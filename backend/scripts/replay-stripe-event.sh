#!/usr/bin/env bash
# Re-delivers a Stripe event to this stage's webhook Lambda, signed with the
# stored webhook secret exactly as Stripe would sign it. Useful after fixing
# configuration so a paid order is processed now rather than on Stripe's retry
# schedule. The webhook is idempotent, so replaying an already-processed event is
# harmless.
#
#   scripts/replay-stripe-event.sh <staging|prod> <evt_...>
set -euo pipefail

stage=${1:?usage: $0 <staging|prod> <evt_id>}
event_id=${2:?usage: $0 <staging|prod> <evt_id>}
prefix="/holderforge/$stage"

key=$(aws ssm get-parameter --name "$prefix/stripe/secret_key" --with-decryption --query Parameter.Value --output text)
whsec=$(aws ssm get-parameter --name "$prefix/stripe/webhook_secret" --with-decryption --query Parameter.Value --output text)
url=$(aws cloudformation describe-stacks --stack-name "holderforge-api-$stage" \
  --query "Stacks[0].Outputs[?OutputKey=='WebhookUrl'].OutputValue" --output text)

payload=$(curl -sS -u "$key:" "https://api.stripe.com/v1/events/$event_id")
jq -e '.id' <<<"$payload" >/dev/null || { echo "event not found: $payload" >&2; exit 1; }

ts=$(date +%s)
sig=$(printf '%s.%s' "$ts" "$payload" | openssl dgst -sha256 -hmac "$whsec" | awk '{print $NF}')

curl -sS -w "\nHTTP %{http_code}\n" -X POST "$url" \
  -H "content-type: application/json" \
  -H "stripe-signature: t=$ts,v1=$sig" \
  --data-binary "$payload"
