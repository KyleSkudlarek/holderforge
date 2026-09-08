"use strict";

// POST /stripe/webhook
// Handles checkout.session.completed. Steps, in order:
//   1. verify the Stripe signature
//   2. record the order (idempotent on session id)
//   3. buy the shipping label through Shippo
//   4. email the owner the print spec, address, label and STL link
//
// Always returns 200 once the event is authenticated, even if label purchase or
// email fails, because Stripe would otherwise retry for days and the failure is
// already surfaced to the owner (email, or CloudWatch if even that failed).

const Stripe = require("stripe");
const { getSecrets } = require("../lib/settings");
const { json, rawBody } = require("../lib/http");
const { expandConfig } = require("../lib/holder");
const { getOrder, createOrder, updateOrder } = require("../lib/orders");
const { buyLabel, toShippoAddress } = require("../lib/shippo");
const { sendOrderEmail } = require("../lib/email");

// Stripe moved shipping details under collected_information in 2025 API versions.
function shippingDetailsOf(session) {
  return session.collected_information?.shipping_details || session.shipping_details || null;
}

function orderFromSession(session) {
  const shipping = shippingDetailsOf(session);
  const item = session.line_items?.data?.[0];
  return {
    orderId: session.id,
    createdAt: new Date(session.created * 1000).toISOString(),
    status: "paid",
    paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
    amountTotal: session.amount_total,
    shippingAmount: session.shipping_cost?.amount_total ?? 0,
    unitAmount: item?.price?.unit_amount ?? 0,
    currency: session.currency,
    quantity: item?.quantity ?? 1,
    customerEmail: session.customer_details?.email,
    customerPhone: session.customer_details?.phone,
    shipping,
    config: expandConfig(JSON.parse(session.metadata.holder)),
    stlKey: session.metadata.stl_key,
    shippoServicelevel: session.shipping_cost?.shipping_rate?.metadata?.shippo_servicelevel,
  };
}

async function fulfil(order, secrets) {
  let label = null;
  let labelError = null;
  try {
    label = await buyLabel({
      apiKey: secrets["shippo/api_key"],
      shipFrom: JSON.parse(secrets.ship_from),
      shipTo: toShippoAddress(order.shipping, order.customerEmail, order.customerPhone),
      quantity: order.quantity,
      servicelevelToken: order.shippoServicelevel || "usps_ground_advantage",
    });
    await updateOrder(order.orderId, { status: "label_purchased", label });
  } catch (err) {
    labelError = err.message;
    console.error("label purchase failed", order.orderId, err);
    await updateOrder(order.orderId, { status: "needs_label", labelError });
  }

  try {
    await sendOrderEmail({ to: secrets.notify_email, order, label, labelError });
    await updateOrder(order.orderId, { notifiedAt: new Date().toISOString() });
  } catch (err) {
    console.error("owner email failed", order.orderId, err);
  }
}

exports.handler = async (event) => {
  const secrets = await getSecrets(["stripe/secret_key", "stripe/webhook_secret", "shippo/api_key", "ship_from", "notify_email"]);
  const stripe = new Stripe(secrets["stripe/secret_key"]);

  let stripeEvent;
  try {
    const signature = event.headers?.["stripe-signature"];
    stripeEvent = stripe.webhooks.constructEvent(rawBody(event), signature, secrets["stripe/webhook_secret"]);
  } catch (err) {
    console.warn("webhook signature rejected", err.message);
    return json(400, { error: "invalid signature" });
  }

  if (stripeEvent.type !== "checkout.session.completed") {
    return json(200, { ignored: stripeEvent.type });
  }

  const sessionId = stripeEvent.data.object.id;
  if (stripeEvent.data.object.payment_status !== "paid") {
    return json(200, { ignored: "unpaid session", sessionId });
  }

  // A replayed event for an order whose label purchase failed retries fulfilment
  // (and re-sends the owner email); any other duplicate is a no-op.
  const existing = await getOrder(sessionId);
  if (existing) {
    if (existing.status !== "needs_label") return json(200, { duplicate: sessionId });
    await fulfil(existing, secrets);
    return json(200, { retried: sessionId });
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items", "shipping_cost.shipping_rate"],
  });
  const order = orderFromSession(session);
  if (!order.shipping) {
    console.error("session has no shipping details", sessionId);
    return json(200, { error: "no shipping details", sessionId });
  }

  const created = await createOrder(order);
  if (!created) return json(200, { duplicate: sessionId });

  await fulfil(order, secrets);
  return json(200, { ok: true, orderId: order.orderId });
};
