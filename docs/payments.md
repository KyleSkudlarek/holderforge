# Payments and fulfilment

How an order flows from the configurator to a label on a box. Code lives in
`backend/` (AWS SAM) and `src/checkout.js` + `src/OrderPanel.jsx` (storefront).

## Flow

1. Customer clicks **Buy now**. The browser POSTs the eleven user-editable holder
   fields and a quantity to `POST /checkout`.
2. `CheckoutFunction` validates the config, recomputes the price from the stack's
   `UnitPriceCents`, creates a Stripe Checkout Session (shipping address, phone,
   flat USPS Ground Advantage option, compact config + STL key in metadata) and
   returns the Stripe URL plus a presigned S3 PUT URL.
3. The browser uploads the currently rendered STL to the presigned URL (best
   effort) and redirects to Stripe. Card data never touches holderforge.com.
4. Stripe redirects back to `/?checkout=success` or `/?checkout=cancel` and calls
   `POST /stripe/webhook` with `checkout.session.completed`.
5. `WebhookFunction` verifies the signature, writes the order to DynamoDB
   (idempotent on session id), buys the label through Shippo (`/shipments/`
   then `/transactions/`, PDF 4x6), and emails the owner: spec sheet, address,
   tracking, label PDF link, 7-day STL link, Stripe dashboard link.
6. Owner prints the part, prints the label on the Dymo 4XL, drops the box at USPS.

If label purchase fails the order is stored with status `needs_label` and the
email says so; buy the label in the Shippo dashboard from the address in the
email. The webhook always returns 200 once authenticated so Stripe does not retry.

## Environments

| | staging | prod |
|---|---|---|
| Stack | `holderforge-api-staging` | `holderforge-api-prod` |
| Stripe | sandbox keys, test cards | live keys |
| Shippo | `shippo_test_` token, sample labels (not valid postage) | live token, real postage |
| Storefront | staging.holderforge.com (Amplify env var `VITE_API_URL`) | holderforge.com (`VITE_API_URL` injected by deploy-prod.yml from the stack output) |
| Deploy | `deploy-staging-backend.yml` on push to `main` touching `backend/**` | `backend` job in `deploy-prod.yml` (manual) |

Test card: `4242 4242 4242 4242`, any future expiry, any CVC.

## Secrets and personal data: SSM Parameter Store

All under `/holderforge/<stage>/`. Lambdas read the whole path once per
container. Store SecureStrings from a hidden prompt so keys never enter shell
history or chat:

```
read -rs 'KEY?Paste value: '; echo
aws ssm put-parameter --name /holderforge/staging/stripe/secret_key --type SecureString --overwrite --value "$KEY"
unset KEY
```

| Parameter | Type | Set by |
|---|---|---|
| `stripe/secret_key` | SecureString | owner, from Stripe dashboard API keys |
| `stripe/webhook_secret` | SecureString | `backend/scripts/register-stripe-webhook.sh` (CI runs it after each deploy) |
| `shippo/api_key` | SecureString | owner, from Shippo settings, API |
| `ship_from` | String (JSON) | owner. Shippo address object: `{"name","street1","city","state","zip","country":"US","phone","email"}` |
| `notify_email` | String | owner. Must be a verified SES identity: `aws sesv2 create-email-identity --email-identity you@example.com`, then click the link AWS emails |

SES stays in sandbox mode: the owner email is both sender and recipient, which
sandbox allows. Customers get Stripe's receipt and Shippo's tracking, not SES mail.

## Prices, shipping and parcel defaults

Template parameters on the stack, overridable in `backend/samconfig.toml`
`parameter_overrides` per stage: `UnitPriceCents` (3499), `ShippingGroundCents`
(695), `ParcelWeightOz` (10, multiplied by quantity), `ParcelLengthIn` /
`ParcelWidthIn` / `ParcelHeightIn` (7 x 5 x 4). The storefront reads prices from
`GET /pricing`, so there is one source of truth. USPS adjusts postage after the
fact if the declared weight is wrong; keep `ParcelWeightOz` honest.

## Adding a shipping option

Add an entry to `shippingOptions()` in `backend/src/handlers/checkout.js` with a
`shippo_servicelevel` metadata token (e.g. `usps_priority`). The webhook buys
whatever token the customer selected, falling back to the cheapest USPS rate.

## Going live checklist

1. Stripe activation approved; store the live key at `/holderforge/prod/stripe/secret_key`.
2. Shippo live token at `/holderforge/prod/shippo/api_key`; card on file in Shippo billing.
3. `/holderforge/prod/ship_from` and `/holderforge/prod/notify_email` set; SES identity verified.
4. Run **Deploy to production**. The backend job creates the prod stack and registers the live webhook; the frontend job builds with the prod API URL.
5. Place a real small order yourself and confirm the email, label and Stripe payout.
