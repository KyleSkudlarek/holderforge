#!/usr/bin/env bash
# Ensures a Stripe webhook endpoint exists for this stage's API and stores its
# signing secret in SSM. Idempotent: an endpoint already registered for the URL
# is left alone (Stripe only reveals the signing secret at creation time).
#
#   scripts/register-stripe-webhook.sh <staging|prod>
#
# Needs: aws CLI credentials with ssm:GetParameter/PutParameter on
# /holderforge/<stage>/*, cloudformation:DescribeStacks, and the Stripe secret key
# already stored at /holderforge/<stage>/stripe/secret_key. Exits 0 with a
# warning when that key is absent so a fresh deploy does not fail.
set -euo pipefail

stage=${1:?usage: $0 <staging|prod>}
prefix="/holderforge/$stage"

key=$(aws ssm get-parameter --name "$prefix/stripe/secret_key" --with-decryption --query Parameter.Value --output text 2>/dev/null || true)
if [ -z "$key" ] || [ "$key" = None ]; then
  echo "WARN: $prefix/stripe/secret_key not set; skipping webhook registration" >&2
  exit 0
fi

url=$(aws cloudformation describe-stacks --stack-name "holderforge-api-$stage" \
  --query "Stacks[0].Outputs[?OutputKey=='WebhookUrl'].OutputValue" --output text)

existing=$(curl -sS -u "$key:" "https://api.stripe.com/v1/webhook_endpoints?limit=100" \
  | jq -r --arg url "$url" '.data[] | select(.url == $url) | .id')

if [ -n "$existing" ]; then
  if aws ssm get-parameter --name "$prefix/stripe/webhook_secret" >/dev/null 2>&1; then
    echo "webhook $existing already registered for $url"
    exit 0
  fi
  # Endpoint exists but the secret was lost; recreate so we can capture it.
  echo "webhook $existing exists without a stored secret; recreating" >&2
  curl -sS -u "$key:" -X DELETE "https://api.stripe.com/v1/webhook_endpoints/$existing" >/dev/null
fi

created=$(curl -sS -u "$key:" https://api.stripe.com/v1/webhook_endpoints \
  -d "url=$url" \
  -d "enabled_events[]=checkout.session.completed" \
  -d "description=holderforge $stage (managed by register-stripe-webhook.sh)")

secret=$(jq -r .secret <<<"$created")
id=$(jq -r .id <<<"$created")
if [ -z "$secret" ] || [ "$secret" = null ]; then
  echo "failed to create webhook: $created" >&2
  exit 1
fi

aws ssm put-parameter --name "$prefix/stripe/webhook_secret" --type SecureString --overwrite --value "$secret" >/dev/null
echo "registered webhook $id for $url; signing secret stored at $prefix/stripe/webhook_secret"
