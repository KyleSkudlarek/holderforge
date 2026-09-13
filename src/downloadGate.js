// Client-side gate for the designer's STL / Fusion script downloads.
//
// This is a curtain, not a paywall: the files are generated in the browser, so
// anyone who reads the bundle can reach them. It only keeps the download panel
// off the page for ordinary visitors. Selling the files needs server-side
// generation instead (see docs/business.md).
//
// The passphrase itself is never stored; only its SHA-256 hex digest is
// compared. To rotate it, replace PASSPHRASE_SHA256 with the output of
//   printf %s 'new passphrase' | shasum -a 256
//
// An unlock persists in localStorage for UNLOCK_DAYS; a wrong or expired entry
// is treated as locked. Every storage access is wrapped because private
// windows and blocked site data make localStorage throw.

const PASSPHRASE_SHA256 = "5ad49cf92b2adf880da0918f0c459ee036398f6e991ed9f80b989fa71430bf56";
const STORAGE_KEY = "hf.downloads.unlockedUntil";
const UNLOCK_DAYS = 30;

export function isUnlocked() {
  try {
    const until = Number(localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(until) && until > Date.now();
  } catch {
    return false;
  }
}

export function lock() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
}

async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

// Resolves true and records the unlock when the passphrase matches.
export async function tryUnlock(passphrase) {
  if (!passphrase || (await sha256Hex(passphrase)) !== PASSPHRASE_SHA256) return false;
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now() + UNLOCK_DAYS * 24 * 60 * 60 * 1000));
  } catch {
    // Unlock still applies for this page load.
  }
  return true;
}

// The unlock form is shown only when the URL asks for it (/design?unlock), so
// the locked designer carries no hint that downloads exist.
export function unlockRequested() {
  try {
    return new URLSearchParams(window.location.search).has("unlock");
  } catch {
    return false;
  }
}
