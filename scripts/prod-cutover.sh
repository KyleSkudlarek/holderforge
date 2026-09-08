#!/usr/bin/env bash
# One-time migration to the single-branch deploy pipeline. Run from a shell with
# admin AWS credentials for account 641383114949 (these steps touch IAM and
# Route 53). Safe to re-run; every step is an upsert or checks for existence.
#
#   scripts/prod-cutover.sh phase1   # IAM role for GitHub OIDC + fix staging DNS
#   -> then run the "Deploy to production" GitHub Actions workflow once and
#      confirm https://production.d3u13d7kxpo2y6.amplifyapp.com looks right
#   scripts/prod-cutover.sh phase2   # move holderforge.com to the new app,
#                                    # delete the legacy `prod` branch
#
# Delete this script (and the "Pending cutover" note in CLAUDE.md) once phase2
# has completed.
set -euo pipefail

ACCT=641383114949
REGION=us-east-1
ZONE=Z01876611GQP3UAURM8LA          # holderforge.com hosted zone
CF_ALIAS_ZONE=Z2FDTNDATAQYW2         # fixed hosted zone id for all CloudFront aliases
OLD_APP=d3nnchft3fvnkp               # repo-connected app: main -> staging
NEW_APP=d3u13d7kxpo2y6               # manual-deploy app: production -> holderforge.com
NEW_BRANCH=production
ROLE=holderforge-github-deploy

r53() { aws route53 change-resource-record-sets --hosted-zone-id "$ZONE" --change-batch "$1" --query 'ChangeInfo.Status' --output text; }

wait_domain() { # $1 app, $2 domain, $3 target status
  for _ in $(seq 1 90); do
    s=$(aws amplify get-domain-association --app-id "$1" --domain-name "$2" --query 'domainAssociation.domainStatus' --output text)
    echo "  $2: $s"
    [ "$s" = "$3" ] && return 0
    [ "$s" = FAILED ] && { echo "domain association FAILED"; exit 1; }
    sleep 20
  done
  echo "timed out waiting for $3"; exit 1
}

phase1() {
  echo "== IAM role for GitHub Actions OIDC =="
  trust=$(cat <<JSON
{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Federated":"arn:aws:iam::$ACCT:oidc-provider/token.actions.githubusercontent.com"},"Action":"sts:AssumeRoleWithWebIdentity","Condition":{"StringEquals":{"token.actions.githubusercontent.com:aud":"sts.amazonaws.com","token.actions.githubusercontent.com:sub":"repo:KyleSkudlarek/holderforge:environment:production"}}}]}
JSON
)
  policy=$(cat <<JSON
{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":["amplify:CreateDeployment","amplify:StartDeployment","amplify:GetJob","amplify:ListJobs","amplify:GetBranch","amplify:GetApp"],"Resource":["arn:aws:amplify:$REGION:$ACCT:apps/$NEW_APP","arn:aws:amplify:$REGION:$ACCT:apps/$NEW_APP/*"]}]}
JSON
)
  if aws iam get-role --role-name "$ROLE" >/dev/null 2>&1; then
    aws iam update-assume-role-policy --role-name "$ROLE" --policy-document "$trust"
  else
    aws iam create-role --role-name "$ROLE" --assume-role-policy-document "$trust" \
      --description "GitHub Actions (KyleSkudlarek/holderforge, environment production) -> Amplify app holderforge-prod zip deployments" >/dev/null
  fi
  aws iam put-role-policy --role-name "$ROLE" --policy-name amplify-deploy-holderforge-prod --policy-document "$policy"
  echo "  arn:aws:iam::$ACCT:role/$ROLE ready"

  echo "== staging.holderforge.com -> Amplify main branch =="
  target=$(aws amplify get-domain-association --app-id "$OLD_APP" --domain-name staging.holderforge.com --query 'domainAssociation.subDomains[0].dnsRecord' --output text | awk '{print $NF}')
  cert=$(aws amplify get-domain-association --app-id "$OLD_APP" --domain-name staging.holderforge.com --query 'domainAssociation.certificateVerificationDNSRecord' --output text)
  cert_name=$(awk '{print $1}' <<<"$cert"); cert_val=$(awk '{print $NF}' <<<"$cert")
  r53 "{\"Changes\":[
    {\"Action\":\"UPSERT\",\"ResourceRecordSet\":{\"Name\":\"$cert_name\",\"Type\":\"CNAME\",\"TTL\":300,\"ResourceRecords\":[{\"Value\":\"$cert_val\"}]}},
    {\"Action\":\"UPSERT\",\"ResourceRecordSet\":{\"Name\":\"staging.holderforge.com.\",\"Type\":\"CNAME\",\"TTL\":300,\"ResourceRecords\":[{\"Value\":\"$target\"}]}}]}"
  wait_domain "$OLD_APP" staging.holderforge.com AVAILABLE
  echo "phase1 done. Now run the 'Deploy to production' workflow: gh workflow run deploy-prod.yml && gh run watch"
}

phase2() {
  echo "== sanity: new app has a successful deployment =="
  aws amplify list-jobs --app-id "$NEW_APP" --branch-name "$NEW_BRANCH" --max-items 1 --query 'jobSummaries[0].status' --output text | grep -q SUCCEED \
    || { echo "run the Deploy to production workflow first"; exit 1; }

  echo "== move holderforge.com: old app -> new app (brief downtime while the cert issues) =="
  aws amplify delete-domain-association --app-id "$OLD_APP" --domain-name holderforge.com >/dev/null 2>&1 || true
  aws amplify create-domain-association --app-id "$NEW_APP" --domain-name holderforge.com \
    --sub-domain-settings "prefix=,branchName=$NEW_BRANCH" "prefix=www,branchName=$NEW_BRANCH" >/dev/null
  for _ in $(seq 1 30); do
    cert=$(aws amplify get-domain-association --app-id "$NEW_APP" --domain-name holderforge.com --query 'domainAssociation.certificateVerificationDNSRecord' --output text)
    target=$(aws amplify get-domain-association --app-id "$NEW_APP" --domain-name holderforge.com --query 'domainAssociation.subDomains[0].dnsRecord' --output text | awk '{print $NF}')
    [[ "$cert" != *pending* && "$cert" != None && "$target" != *pending* ]] && break
    echo "  waiting for Amplify to hand out DNS targets..."; sleep 10
  done
  cert_name=$(awk '{print $1}' <<<"$cert"); cert_val=$(awk '{print $NF}' <<<"$cert")
  echo "  cert validation: $cert_name -> $cert_val"; echo "  cloudfront: $target"
  r53 "{\"Changes\":[
    {\"Action\":\"UPSERT\",\"ResourceRecordSet\":{\"Name\":\"$cert_name\",\"Type\":\"CNAME\",\"TTL\":300,\"ResourceRecords\":[{\"Value\":\"$cert_val\"}]}},
    {\"Action\":\"UPSERT\",\"ResourceRecordSet\":{\"Name\":\"holderforge.com.\",\"Type\":\"A\",\"AliasTarget\":{\"HostedZoneId\":\"$CF_ALIAS_ZONE\",\"DNSName\":\"$target\",\"EvaluateTargetHealth\":false}}},
    {\"Action\":\"UPSERT\",\"ResourceRecordSet\":{\"Name\":\"www.holderforge.com.\",\"Type\":\"CNAME\",\"TTL\":300,\"ResourceRecords\":[{\"Value\":\"$target\"}]}}]}"
  wait_domain "$NEW_APP" holderforge.com AVAILABLE

  echo "== retire the legacy prod branch =="
  aws amplify delete-branch --app-id "$OLD_APP" --branch-name prod >/dev/null 2>&1 || true
  git push origin --delete prod 2>/dev/null || true
  echo "phase2 done. https://holderforge.com now serves holderforge-prod. Delete scripts/prod-cutover.sh and the Pending cutover note in CLAUDE.md."
}

case "${1:-}" in
  phase1) phase1 ;;
  phase2) phase2 ;;
  *) sed -n '2,15p' "$0"; exit 2 ;;
esac
