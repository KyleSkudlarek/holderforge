"use strict";

// Owner notification for a paid order. Sent from and to the SES-verified
// notify_email address, so it works inside the SES sandbox without production
// access. Customers get Stripe's receipt and Shippo tracking, not this email.

const { SESv2Client, SendEmailCommand } = require("@aws-sdk/client-sesv2");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { config } = require("./settings");
const { specSheet } = require("./holder");

const ses = new SESv2Client({});
const s3 = new S3Client({});

const STL_LINK_TTL_SECONDS = 7 * 24 * 3600;

function formatAddress(shipping) {
  const a = shipping.address;
  return [shipping.name, a.line1, a.line2, `${a.city}, ${a.state} ${a.postal_code}`, a.country]
    .filter(Boolean)
    .join("\n");
}

function money(cents, currency = "usd") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}

async function stlLink(stlKey) {
  if (!stlKey) return "(no STL uploaded; regenerate from the spec above)";
  try {
    return await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: config.uploadsBucket, Key: stlKey }),
      { expiresIn: STL_LINK_TTL_SECONDS }
    );
  } catch (err) {
    return `(could not sign STL link: ${err.message})`;
  }
}

function stripeDashboardLink(paymentIntentId) {
  const mode = config.isLive ? "" : "test/";
  return `https://dashboard.stripe.com/${mode}payments/${paymentIntentId}`;
}

async function sendOrderEmail({ to, order, label, labelError }) {
  const subjectState = label ? "label ready" : "NEEDS LABEL";
  const subject = `[HolderForge${config.isLive ? "" : " staging"}] Order ${order.quantity}x holder for ${order.shipping.name} (${subjectState})`;

  const labelBlock = label
    ? [
        `Service:   ${label.servicelevel} (${money(Math.round(Number(label.rateAmount) * 100))} postage)`,
        `Tracking:  ${label.trackingNumber}`,
        `           ${label.trackingUrl}`,
        `Label PDF: ${label.labelUrl}`,
      ].join("\n")
    : [
        "Automatic label purchase FAILED. Buy the label in the Shippo dashboard using the address above.",
        `Error: ${labelError}`,
      ].join("\n");

  const body = [
    `Order:     ${order.orderId}`,
    `Paid:      ${money(order.amountTotal, order.currency)} (${order.quantity} x ${money(order.unitAmount, order.currency)} + ${money(order.shippingAmount, order.currency)} shipping)`,
    `Customer:  ${order.customerEmail || "(no email)"}${order.customerPhone ? "  " + order.customerPhone : ""}`,
    `Stripe:    ${stripeDashboardLink(order.paymentIntentId)}`,
    "",
    "SHIP TO",
    formatAddress(order.shipping),
    "",
    "SHIPPING LABEL",
    labelBlock,
    "",
    `PRINT SPEC (quantity ${order.quantity})`,
    specSheet(order.config),
    "",
    "STL (link valid 7 days)",
    await stlLink(order.stlKey),
  ].join("\n");

  await ses.send(
    new SendEmailCommand({
      FromEmailAddress: to,
      Destination: { ToAddresses: [to] },
      Content: { Simple: { Subject: { Data: subject }, Body: { Text: { Data: body } } } },
    })
  );
}

module.exports = { sendOrderEmail };
