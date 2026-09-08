"use strict";

// Minimal Shippo REST client (https://docs.goshippo.com/). Two calls per order:
// create a shipment to get rates, then buy the rate matching the service level
// the customer paid for. A test token returns sample labels that are not valid
// postage, which is what staging wants.

const { config } = require("./settings");

const BASE = "https://api.goshippo.com";

async function shippoFetch(apiKey, path, body) {
  const res = await fetch(BASE + path, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `ShippoToken ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Shippo ${path} ${res.status}: ${JSON.stringify(data).slice(0, 500)}`);
  }
  return data;
}

// Stripe shipping details -> Shippo address.
function toShippoAddress(shipping, email, phone) {
  const a = shipping.address;
  return {
    name: shipping.name,
    street1: a.line1,
    street2: a.line2 || undefined,
    city: a.city,
    state: a.state,
    zip: a.postal_code,
    country: a.country,
    email: email || undefined,
    phone: phone || undefined,
    validate: true,
  };
}

function parcelFor(quantity) {
  const p = config.parcel;
  return {
    length: String(p.lengthIn),
    width: String(p.widthIn),
    height: String(p.heightIn),
    distance_unit: "in",
    weight: String(p.weightOz * quantity),
    mass_unit: "oz",
  };
}

// Buys a label. Returns { shipmentId, transactionId, rateAmount, servicelevel,
// trackingNumber, trackingUrl, labelUrl }. Throws on any failure so the caller
// can record the order as needing manual fulfilment.
async function buyLabel({ apiKey, shipFrom, shipTo, quantity, servicelevelToken }) {
  const shipment = await shippoFetch(apiKey, "/shipments/", {
    address_from: shipFrom,
    address_to: shipTo,
    parcels: [parcelFor(quantity)],
    async: false,
  });

  const rates = shipment.rates || [];
  let rate = rates.find((r) => r.servicelevel?.token === servicelevelToken);
  if (!rate) {
    // Fall back to the cheapest USPS rate rather than failing the whole order.
    rate = rates
      .filter((r) => r.provider === "USPS")
      .sort((a, b) => Number(a.amount) - Number(b.amount))[0];
  }
  if (!rate) {
    const msgs = (shipment.messages || []).map((m) => m.text).join("; ");
    throw new Error(`Shippo returned no usable rates. ${msgs}`);
  }

  const tx = await shippoFetch(apiKey, "/transactions/", {
    rate: rate.object_id,
    label_file_type: "PDF_4x6",
    async: false,
  });
  if (tx.status !== "SUCCESS") {
    const msgs = (tx.messages || []).map((m) => m.text).join("; ");
    throw new Error(`Shippo label purchase ${tx.status}: ${msgs}`);
  }

  return {
    shipmentId: shipment.object_id,
    transactionId: tx.object_id,
    rateAmount: rate.amount,
    servicelevel: rate.servicelevel?.name,
    trackingNumber: tx.tracking_number,
    trackingUrl: tx.tracking_url_provider,
    labelUrl: tx.label_url,
  };
}

module.exports = { buyLabel, toShippoAddress };
