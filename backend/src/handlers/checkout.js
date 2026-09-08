"use strict";

// POST /checkout  { config, quantity }
//   -> { url, uploadUrl, uploadKey }
//   Creates a Stripe Checkout Session for the requested holder and a presigned
//   S3 PUT URL for the browser to upload the generated STL before redirecting.
//
// GET /pricing
//   -> { unitPriceCents, shippingGroundCents, currency, productName }
//   Lets the storefront display prices from the same source the server charges.

const { randomUUID } = require("node:crypto");
const Stripe = require("stripe");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { config, getSecrets } = require("../lib/settings");
const { json, parseJsonBody, siteOriginFor } = require("../lib/http");
const { parseHolderConfig, compactConfig, describeHolder } = require("../lib/holder");

const s3 = new S3Client({});
const MAX_QUANTITY = 10;
const UPLOAD_URL_TTL_SECONDS = 600;

// Shipping options offered at checkout. The shippo_servicelevel metadata is read
// back by the webhook to buy the matching label.
function shippingOptions() {
  return [
    {
      shipping_rate_data: {
        type: "fixed_amount",
        display_name: "USPS Ground Advantage",
        fixed_amount: { amount: config.shippingGroundCents, currency: "usd" },
        delivery_estimate: {
          minimum: { unit: "business_day", value: 2 },
          maximum: { unit: "business_day", value: 5 },
        },
        metadata: { shippo_servicelevel: "usps_ground_advantage" },
      },
    },
  ];
}

async function createCheckout(event) {
  let body;
  try {
    body = parseJsonBody(event);
  } catch {
    return json(400, { error: "invalid JSON" });
  }

  let holder;
  try {
    holder = parseHolderConfig(body.config);
  } catch (err) {
    return json(400, { error: err.message });
  }

  const quantity = Number.parseInt(body.quantity ?? 1, 10);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
    return json(400, { error: `quantity must be between 1 and ${MAX_QUANTITY}` });
  }

  const secrets = await getSecrets(["stripe/secret_key"]);
  const stripe = new Stripe(secrets["stripe/secret_key"]);
  const origin = siteOriginFor(event);
  const uploadKey = `uploads/${randomUUID()}.stl`;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity,
        price_data: {
          currency: "usd",
          unit_amount: config.unitPriceCents,
          product_data: {
            name: config.productName,
            description: describeHolder(holder),
          },
        },
      },
    ],
    shipping_address_collection: { allowed_countries: ["US"] },
    shipping_options: shippingOptions(),
    phone_number_collection: { enabled: true },
    metadata: {
      holder: JSON.stringify(compactConfig(holder)),
      stl_key: uploadKey,
    },
    success_url: `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/?checkout=cancel`,
  });

  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: config.uploadsBucket,
      Key: uploadKey,
      ContentType: "application/octet-stream",
    }),
    { expiresIn: UPLOAD_URL_TTL_SECONDS }
  );

  return json(200, { url: session.url, uploadUrl, uploadKey });
}

function pricing() {
  return json(200, {
    currency: "usd",
    productName: config.productName,
    unitPriceCents: config.unitPriceCents,
    shippingGroundCents: config.shippingGroundCents,
  });
}

exports.handler = async (event) => {
  const route = event.routeKey || `${event.requestContext?.http?.method} ${event.rawPath}`;
  try {
    if (route === "GET /pricing") return pricing();
    if (route === "POST /checkout") return await createCheckout(event);
    return json(404, { error: "not found" });
  } catch (err) {
    console.error("checkout error", err);
    return json(500, { error: "checkout unavailable" });
  }
};
