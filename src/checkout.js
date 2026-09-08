// Storefront client for the commerce API (backend/). The API base URL is baked
// in at build time from VITE_API_URL; when it is unset the store is disabled and
// the UI shows "coming soon".

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export const storeEnabled = Boolean(API_URL);

// Fields the backend accepts; everything else in modelConfig is derived.
const ORDER_FIELDS = [
  "model_width",
  "model_depth",
  "row_1_hole_diameter",
  "row_2_hole_diameter",
  "row_3_hole_diameter",
  "row_1_bottle_height",
  "row_2_bottle_height",
  "row_3_bottle_height",
  "row_1_hole_shape",
  "row_2_hole_shape",
  "row_3_hole_shape",
];

export function orderConfigFrom(modelConfig) {
  return Object.fromEntries(ORDER_FIELDS.map((k) => [k, modelConfig[k]]));
}

export async function fetchPricing() {
  const res = await fetch(`${API_URL}/pricing`);
  if (!res.ok) throw new Error(`pricing ${res.status}`);
  return res.json();
}

// Creates the Checkout Session, uploads the current STL (best effort: the order
// carries the full spec, so a failed upload is not fatal), then returns the
// Stripe URL to redirect to.
export async function startCheckout({ modelConfig, quantity, stlURL }) {
  const res = await fetch(`${API_URL}/checkout`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ config: orderConfigFrom(modelConfig), quantity }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `checkout ${res.status}`);

  if (stlURL) {
    try {
      const blob = await (await fetch(stlURL)).blob();
      await fetch(data.uploadUrl, {
        method: "PUT",
        headers: { "content-type": "application/octet-stream" },
        body: blob,
      });
    } catch (err) {
      console.warn("STL upload failed; order will carry spec only", err);
    }
  }
  return data.url;
}

// Reads and clears the ?checkout=success|cancel flag Stripe redirects back with.
export function consumeCheckoutResult() {
  const params = new URLSearchParams(window.location.search);
  const result = params.get("checkout");
  if (!result) return null;
  params.delete("checkout");
  params.delete("session_id");
  const qs = params.toString();
  window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : ""));
  return result;
}
