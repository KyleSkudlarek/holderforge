"use strict";

// Runtime settings come from two places:
//   - plain configuration: Lambda environment variables set by the SAM template
//   - secrets and personal data: SSM Parameter Store under /holderforge/<stage>/
//
// SSM parameters (all under SSM_PREFIX):
//   stripe/secret_key       sk_test_... or sk_live_...
//   stripe/webhook_secret   whsec_..., written by scripts/register-stripe-webhook.sh
//   shippo/api_key          shippo_test_... or shippo_live_...
//   ship_from               JSON Shippo address object for the shop's outbound address
//   notify_email            SES-verified address that receives order notifications
//
// Parameters are fetched once per container and cached.

const { SSMClient, GetParametersByPathCommand } = require("@aws-sdk/client-ssm");

const env = process.env;

const config = {
  stage: env.STAGE,
  ssmPrefix: env.SSM_PREFIX,
  ordersTable: env.ORDERS_TABLE,
  uploadsBucket: env.UPLOADS_BUCKET,
  siteUrl: env.SITE_URL,
  allowedOrigins: (env.ALLOWED_ORIGINS || "").split(",").filter(Boolean),
  productName: env.PRODUCT_NAME,
  unitPriceCents: Number(env.UNIT_PRICE_CENTS),
  shippingGroundCents: Number(env.SHIPPING_GROUND_CENTS),
  parcel: {
    weightOz: Number(env.PARCEL_WEIGHT_OZ),
    lengthIn: Number(env.PARCEL_LENGTH_IN),
    widthIn: Number(env.PARCEL_WIDTH_IN),
    heightIn: Number(env.PARCEL_HEIGHT_IN),
  },
  isLive: env.STAGE === "prod",
};

let secretsPromise;

async function loadSecrets() {
  const ssm = new SSMClient({});
  const values = {};
  let nextToken;
  do {
    const out = await ssm.send(
      new GetParametersByPathCommand({
        Path: config.ssmPrefix,
        Recursive: true,
        WithDecryption: true,
        NextToken: nextToken,
      })
    );
    for (const p of out.Parameters || []) {
      values[p.Name.slice(config.ssmPrefix.length)] = p.Value;
    }
    nextToken = out.NextToken;
  } while (nextToken);
  return values;
}

// Returns the cached secrets map keyed by the path suffix, e.g. "stripe/secret_key".
// Throws if a required key is missing so misconfiguration fails loudly at first use.
async function getSecrets(required = []) {
  secretsPromise ||= loadSecrets().catch((err) => {
    secretsPromise = undefined;
    throw err;
  });
  const secrets = await secretsPromise;
  const missing = required.filter((k) => !secrets[k]);
  if (missing.length) {
    throw new Error(`Missing SSM parameters under ${config.ssmPrefix}: ${missing.join(", ")}`);
  }
  return secrets;
}

module.exports = { config, getSecrets };
