"use strict";

const { config } = require("./settings");

// Resolves the site origin for redirects: the request's Origin when allowlisted,
// otherwise the stack's configured SiteUrl. Keeps success/cancel redirects on
// whichever host the customer started from (custom domain vs amplifyapp host).
function siteOriginFor(event) {
  const origin = event.headers?.origin || event.headers?.Origin;
  return origin && config.allowedOrigins.includes(origin) ? origin : config.siteUrl;
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
}

function parseJsonBody(event) {
  if (!event.body) return {};
  const raw = event.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf8") : event.body;
  return JSON.parse(raw);
}

// Raw request body bytes, needed for Stripe signature verification.
function rawBody(event) {
  return event.isBase64Encoded ? Buffer.from(event.body || "", "base64") : Buffer.from(event.body || "", "utf8");
}

module.exports = { siteOriginFor, json, parseJsonBody, rawBody };
