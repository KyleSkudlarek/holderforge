"use strict";

// Orders table access. Partition key orderId = Stripe Checkout Session id, so a
// redelivered webhook for the same session maps to the same row.

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { config } = require("./settings");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});

async function getOrder(orderId) {
  const out = await ddb.send(new GetCommand({ TableName: config.ordersTable, Key: { orderId } }));
  return out.Item;
}

// Creates the order row. Returns false if it already existed (duplicate webhook).
async function createOrder(order) {
  try {
    await ddb.send(
      new PutCommand({
        TableName: config.ordersTable,
        Item: order,
        ConditionExpression: "attribute_not_exists(orderId)",
      })
    );
    return true;
  } catch (err) {
    if (err.name === "ConditionalCheckFailedException") return false;
    throw err;
  }
}

async function updateOrder(orderId, fields) {
  const names = {};
  const values = {};
  const sets = [];
  for (const [k, v] of Object.entries(fields)) {
    names[`#${k}`] = k;
    values[`:${k}`] = v;
    sets.push(`#${k} = :${k}`);
  }
  await ddb.send(
    new UpdateCommand({
      TableName: config.ordersTable,
      Key: { orderId },
      UpdateExpression: `SET ${sets.join(", ")}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
    })
  );
}

module.exports = { getOrder, createOrder, updateOrder };
