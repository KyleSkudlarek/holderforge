"use strict";

// Staging-only scratch store for the cosmetics measuring run (see
// docs/cosmetics-run.md). One item per product row keyed by the page's row id;
// PUT replaces the whole item. The API is public, so every call carries the
// shared key from SSM (measure_key) as ?k=. Not deployed on prod: the
// template gates the table and function on the IsStaging condition and leaves
// MEASUREMENTS_TABLE empty there.
//
// GET    /measurements?k=          -> { items: [item] }
// PUT    /measurements/{id}?k=     body item -> item
// DELETE /measurements/{id}?k=     -> { ok: true }

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand, PutCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");
const { config, getSecrets } = require("../lib/settings");
const { json, parseJsonBody } = require("../lib/http");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), { marshallOptions: { removeUndefinedValues: true } });

const ID_RE = /^[a-z0-9][a-z0-9-]{0,199}$/;
const TEXT_FIELDS = ["cat", "brand", "product", "store", "note", "updatedAt"];
const NUMBER_FIELDS = ["base", "height"];

// Keeps only the fields the page writes, with bounded sizes; anything else in
// the body is dropped. Throws on a value of the wrong type.
function sanitizeMeasurement(id, body) {
  if (!ID_RE.test(id)) throw new Error("invalid id");
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("body must be an object");
  const item = { id };
  for (const f of TEXT_FIELDS) {
    const v = body[f];
    if (v === undefined || v === null || v === "") continue;
    if (typeof v !== "string") throw new Error(`${f} must be a string`);
    item[f] = v.slice(0, 200);
  }
  for (const f of NUMBER_FIELDS) {
    const v = body[f];
    if (v === undefined || v === null || v === "") continue;
    if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > 1000) throw new Error(`${f} must be a number in 0-1000`);
    item[f] = Math.round(v * 10) / 10;
  }
  item.custom = body.custom === true;
  return item;
}

async function authorized(event) {
  const key = event.queryStringParameters?.k;
  if (!key) return false;
  const { measure_key: expected } = await getSecrets(["measure_key"]);
  return key === expected;
}

async function listAll() {
  const items = [];
  let ExclusiveStartKey;
  do {
    const out = await ddb.send(new ScanCommand({ TableName: config.measurementsTable, ExclusiveStartKey }));
    items.push(...(out.Items || []));
    ExclusiveStartKey = out.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return items;
}

async function handler(event) {
  if (!config.measurementsTable) return json(404, { error: "not available on this stage" });
  if (!(await authorized(event))) return json(401, { error: "bad key" });

  const method = event.requestContext?.http?.method;
  const id = event.pathParameters?.id;

  if (method === "GET") return json(200, { items: await listAll() });

  if (method === "PUT") {
    let item;
    try {
      item = sanitizeMeasurement(id, parseJsonBody(event));
    } catch (err) {
      return json(400, { error: err.message });
    }
    await ddb.send(new PutCommand({ TableName: config.measurementsTable, Item: item }));
    return json(200, item);
  }

  if (method === "DELETE") {
    if (!ID_RE.test(id || "")) return json(400, { error: "invalid id" });
    await ddb.send(new DeleteCommand({ TableName: config.measurementsTable, Key: { id } }));
    return json(200, { ok: true });
  }

  return json(405, { error: "method not allowed" });
}

module.exports = { handler, sanitizeMeasurement };
