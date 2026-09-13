import { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { Helmet } from "react-helmet";

// Temporary, staging-only: the phone sheet for the cosmetics measuring trip
// (docs/cosmetics-run.md). Rows save to the backend's /measurements scratch
// API as soon as a field changes. Remove this page, its route, the API and
// public/images/measure/ together before production.

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const KEY_STORAGE = "measureKey";

// Example photos are Sephora product shots (public/images/measure/<sku>.jpg),
// there so the right kind of tube gets measured under the right heading.
const CATEGORIES = [
  {
    id: "lipstick-round",
    name: "Lipstick bullets, round",
    what: "A twist-up stick of solid colour in a round tube with a cap. Most are 19-21 mm across; the cap is usually flush with the base.",
    examples: [
      { sku: "2985976", caption: "Charlotte Tilbury Matte Revolution" },
      { sku: "2589422", caption: "Rare Beauty Kind Words" },
    ],
    rows: [
      ["Charlotte Tilbury", "Matte Revolution (Pillow Talk)", "SU"],
      ["MAC", "Matte / Macximal", "U"],
      ["Rare Beauty", "Kind Words Matte Lipstick", "S"],
      ["NARS", "Powermatte / Afterglow", "SU"],
      ["Fenty Beauty", "Fenty Icon (refillable)", "SU"],
    ],
  },
  {
    id: "lipstick-square",
    name: "Lipstick bullets, square",
    what: "Same twist-up stick, but the case is square or rectangular. Base = the longer side; put the shorter side in the note.",
    examples: [
      { sku: "2130003", caption: "YSL Rouge Pur Couture" },
      { sku: "2594869", caption: "Dior Rouge Dior" },
    ],
    rows: [
      ["YSL", "Rouge Pur Couture", "SU"],
      ["Dior", "Rouge Dior", "SU"],
      ["Tom Ford", "Lip Color", "S"],
      ["Chanel", "Rouge Allure", "U"],
      ["Makeup by Mario", "SuperSatin", "S"],
    ],
  },
  {
    id: "concealer",
    name: "Concealers",
    what: "A slim tube of liquid with a long cap; the cap pulls off to reveal a sponge-tip wand. If the cap is wider than the base, note the cap width.",
    examples: [
      { sku: "2452316", caption: "Tarte Shape Tape" },
      { sku: "2172310", caption: "NARS Radiant Creamy" },
      { sku: "2642270", caption: "Kosas Revealer (mini)" },
    ],
    rows: [
      ["Tarte", "Shape Tape", "SU"],
      ["NARS", "Radiant Creamy Concealer", "SU"],
      ["Maybelline", "Instant Age Rewind", "U"],
      ["Rare Beauty", "Liquid Touch Brightening", "S"],
      ["Kosas", "Revealer", "S"],
    ],
  },
  {
    id: "liquid-lip",
    name: "Liquid lipstick, gloss, lip oil",
    what: "Liquid colour in a tube with a wand, like a concealer but for lips. Gloss and lip oil are the shiny, sheer versions. Tall and top-heavy, so height matters most.",
    examples: [
      { sku: "2316172", caption: "Dior Lip Glow Oil (square)" },
      { sku: "2156578", caption: "Fenty Gloss Bomb" },
    ],
    rows: [
      ["Dior", "Addict Lip Glow Oil", "SU"],
      ["Fenty Beauty", "Gloss Bomb", "SU"],
      ["Rare Beauty", "Soft Pinch Tinted Lip Oil", "S"],
      ["Maybelline", "SuperStay Matte Ink", "U"],
      ["NYX", "Fat Oil Lip Drip", "U"],
    ],
  },
  {
    id: "pencils",
    name: "Lip and eye pencils",
    what: "Pencils, wood or plastic twist-up. Base = the body diameter. Expect about 8 mm for wood and 9-11 mm for mechanical.",
    examples: [
      { sku: "2116515", caption: "Charlotte Tilbury Lip Cheat (wood)" },
      { sku: "2502235", caption: "Makeup by Mario Ultra Suede (mechanical)" },
    ],
    rows: [
      ["Charlotte Tilbury", "Lip Cheat", "SU"],
      ["MAC", "Lip Pencil", "U"],
      ["NYX", "Slim Lip Pencil", "U"],
      ["Makeup by Mario", "Ultra Suede Lip Liner", "S"],
      ["Urban Decay", "24/7 Glide-On Eye Pencil", "SU"],
    ],
  },
  {
    id: "mascara",
    name: "Mascara",
    what: "A fat tube with a brush wand inside. Usually the widest thing on this list at 20-25 mm.",
    examples: [
      { sku: "1533439", caption: "Too Faced Better Than Sex" },
      { sku: "1719764", caption: "Benefit They're Real" },
    ],
    rows: [
      ["Maybelline", "Lash Sensational Sky High", "U"],
      ["Too Faced", "Better Than Sex", "SU"],
      ["Benefit", "They're Real", "SU"],
      ["Lancôme", "Lash Idôle", "SU"],
      ["L'Oréal", "Telescopic", "U"],
    ],
  },
  {
    id: "blush",
    name: "Liquid blush and highlighter",
    what: "Small glass or plastic bottles of liquid cheek colour with a wand. Rare Beauty's is a squat bottle with square shoulders. Note the shape if it is not round.",
    examples: [{ sku: "2437796", caption: "Saie Dew Blush" }],
    rows: [
      ["Rare Beauty", "Soft Pinch Liquid Blush", "S"],
      ["Rare Beauty", "Positive Light Liquid Luminizer", "S"],
      ["Saie", "Dew Blush", "S"],
      ["Milk Makeup", "Cooling Water Jelly Tint", "S"],
      ["Glossier", "Cloud Paint", "S"],
    ],
  },
  {
    id: "essential-oils",
    name: "Essential oils (Whole Foods)",
    what: "Small amber or blue glass dropper bottles. One per size covers every brand: 5, 10, 15, 30 ml and the 10 ml roll-on. Measure the glass at the base; the cap is usually wider, note it.",
    examples: [],
    rows: [
      ["NOW Foods", "Lavender, 1 fl oz (30 ml)", "W"],
      ["Aura Cacia", "Lavender, 0.5 fl oz (15 ml)", "W"],
      ["Plant Therapy", "Lavender, 10 ml", "W"],
      ["Plant Therapy", "any 5 ml (sets, kids line)", "W"],
      ["Aura Cacia / Plant Therapy", "roll-on, 10 ml", "W"],
    ],
  },
];
const STORE = { S: "Sephora", U: "Ulta", SU: "Both", W: "Whole Foods" };

const slug = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const rowId = (cat, brand, product) => `${cat}--${slug(brand)}--${slug(product)}`;

const Page = styled.div`
  max-width: 640px;
  margin: 0 auto;
  padding: 16px 12px 80px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Bar = styled.div`
  position: sticky;
  top: 0;
  z-index: 5;
  margin: 0 -12px;
  padding: 10px 16px;
  background: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.outline};
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  h1 {
    margin: 0;
    font-size: 17px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.headerPrimary};
  }
  span {
    font-size: 13px;
    font-variant-numeric: tabular-nums;
    color: ${({ theme, $tone }) => ($tone === "error" ? theme.colors.warning : theme.colors.muted)};
    white-space: nowrap;
  }
`;

const How = styled.p`
  margin: 0 4px;
  font-size: 14px;
  line-height: 1.45;
  color: ${({ theme }) => theme.colors.muted};
  b {
    color: ${({ theme }) => theme.colors.headerPrimary};
    font-weight: 600;
  }
`;

const Cat = styled.section`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.outline};
  border-radius: 10px;
  overflow: hidden;
`;

const CatHead = styled.div`
  padding: 12px 14px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.outline};
  display: grid;
  gap: 8px;
  .top {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
  }
  h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.headerPrimary};
  }
  .count {
    font-size: 13px;
    color: ${({ theme, $done }) => ($done ? theme.colors.success : theme.colors.muted)};
    white-space: nowrap;
  }
  p {
    margin: 0;
    font-size: 13px;
    line-height: 1.45;
    color: ${({ theme }) => theme.colors.muted};
  }
`;

const Examples = styled.div`
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 10px 14px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.outline};
  background: ${({ theme }) => theme.colors.surfaceRaised};
  figure {
    margin: 0;
    flex: 0 0 120px;
    display: grid;
    gap: 4px;
  }
  img {
    display: block;
    width: 120px;
    height: 120px;
    object-fit: contain;
    border-radius: 6px;
    background: #fff;
    border: 1px solid ${({ theme }) => theme.colors.outline};
  }
  figcaption {
    font-size: 11px;
    line-height: 1.3;
    color: ${({ theme }) => theme.colors.muted};
  }
`;

const RowEl = styled.div`
  padding: 12px 14px 14px;
  border-top: 1px solid ${({ theme }) => theme.colors.outline};
  display: grid;
  gap: 10px;
  &:first-child {
    border-top: 0;
  }
  .who {
    display: flex;
    align-items: baseline;
    gap: 8px;
    flex-wrap: wrap;
  }
  .brand {
    font-weight: 600;
    color: ${({ theme }) => theme.colors.headerPrimary};
  }
  .product {
    color: ${({ theme }) => theme.colors.muted};
  }
  .store {
    margin-left: auto;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 2px 7px;
    border-radius: 999px;
    background: ${({ theme }) => theme.colors.surfaceRaised};
    color: ${({ theme }) => theme.colors.muted};
  }
  .remove {
    background: none;
    border: 0;
    padding: 0 4px;
    color: ${({ theme }) => theme.colors.muted};
    font: inherit;
    font-size: 13px;
    cursor: pointer;
  }
  .fields {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .note {
    grid-column: 1 / -1;
  }
  label {
    display: grid;
    gap: 4px;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.muted};
  }
  .in {
    display: flex;
    align-items: center;
    height: 48px;
    padding: 0 10px;
    border: 1px solid ${({ theme }) => theme.colors.outline};
    border-radius: 8px;
    background: ${({ theme }) => theme.colors.surfaceRaised};
  }
  .in:focus-within {
    border-color: ${({ theme }) => theme.colors.highlightPrimary};
  }
  input {
    flex: 1;
    min-width: 0;
    border: 0;
    background: transparent;
    color: ${({ theme }) => theme.colors.headerPrimary};
    font: inherit;
    font-size: 20px;
    font-variant-numeric: tabular-nums;
    outline: none;
    padding: 0;
    -moz-appearance: textfield;
    appearance: textfield;
  }
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  input[type="text"] {
    font-size: 15px;
  }
  .unit {
    font-size: 13px;
    color: ${({ theme }) => theme.colors.muted};
    margin-left: 6px;
  }
  .save {
    font-size: 12px;
    min-height: 16px;
    display: flex;
    align-items: center;
    gap: 6px;
    color: ${({ theme, $state }) => ($state === "saved" ? theme.colors.success : $state === "error" ? theme.colors.warning : theme.colors.muted)};
  }
  .save::before {
    content: "";
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: ${({ theme, $state }) =>
      $state === "saved" ? theme.colors.success : $state === "error" ? theme.colors.warning : $state === "saving" ? theme.colors.highlightPrimary : theme.colors.outline};
  }
`;

const AddForm = styled.form`
  display: flex;
  gap: 8px;
  padding: 12px 14px;
  border-top: 1px solid ${({ theme }) => theme.colors.outline};
  background: ${({ theme }) => theme.colors.surfaceRaised};
  input {
    flex: 1;
    min-width: 0;
    height: 40px;
    padding: 0 10px;
    border: 1px solid ${({ theme }) => theme.colors.outline};
    border-radius: 8px;
    background: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.headerPrimary};
    font: inherit;
    font-size: 15px;
  }
  button {
    height: 40px;
    padding: 0 14px;
    border: 0;
    border-radius: 8px;
    background: ${({ theme }) => theme.colors.highlightPrimary};
    color: #fff;
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }
`;

const Gate = styled.form`
  display: grid;
  gap: 10px;
  padding: 16px;
  border: 1px solid ${({ theme }) => theme.colors.outline};
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.headerPrimary};
  input {
    height: 44px;
    padding: 0 10px;
    border: 1px solid ${({ theme }) => theme.colors.outline};
    border-radius: 8px;
    font: inherit;
    font-family: ui-monospace, Menlo, monospace;
  }
  button {
    height: 44px;
    border: 0;
    border-radius: 8px;
    background: ${({ theme }) => theme.colors.highlightPrimary};
    color: #fff;
    font: inherit;
    font-weight: 600;
  }
`;

const timeOf = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

function readKey() {
  const fromUrl = new URLSearchParams(window.location.search).get("k");
  if (fromUrl) {
    try {
      localStorage.setItem(KEY_STORAGE, fromUrl);
    } catch {
      /* private mode: the key lives in the URL for this visit */
    }
    return fromUrl;
  }
  try {
    return localStorage.getItem(KEY_STORAGE) || "";
  } catch {
    return "";
  }
}

async function api(key, method, path, body) {
  const res = await fetch(`${API_URL}${path}?k=${encodeURIComponent(key)}`, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

function Row({ row, value, state, onChange, onCommit, onRemove }) {
  const v = value || {};
  const field = (key, label, type, unit) => (
    <label className={key === "note" ? "note" : undefined}>
      <span>{label}</span>
      <span className="in">
        <input
          type={type}
          inputMode={type === "number" ? "decimal" : undefined}
          step={type === "number" ? "0.1" : undefined}
          min={type === "number" ? "0" : undefined}
          autoComplete="off"
          value={v[key] ?? ""}
          onChange={(e) => onChange(row.id, key, e.target.value)}
          onBlur={() => onCommit(row.id)}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            const inputs = [...document.querySelectorAll("input[data-measure]")];
            const next = inputs[inputs.indexOf(e.target) + 1];
            if (next) next.focus();
            else e.target.blur();
          }}
          data-measure=""
        />
        {unit ? <span className="unit">{unit}</span> : null}
      </span>
    </label>
  );
  return (
    <RowEl $state={state?.kind || "empty"}>
      <div className="who">
        <span className="brand">{row.brand}</span>
        <span className="product">{row.product}</span>
        {row.custom ? (
          <button type="button" className="remove" onClick={() => onRemove(row.id)}>
            remove
          </button>
        ) : null}
        {row.store ? <span className="store">{STORE[row.store] || row.store}</span> : null}
      </div>
      <div className="fields">
        {field("base", "Base", "number", "mm")}
        {field("height", "Height", "number", "mm")}
        {field("note", "Note", "text", "")}
      </div>
      <div className="save">{state?.text || ""}</div>
    </RowEl>
  );
}

export default function MeasureRun() {
  const [key, setKey] = useState(() => (typeof window === "undefined" ? "" : readKey()));
  const [keyInput, setKeyInput] = useState("");
  const [values, setValues] = useState({}); // id -> { base, height, note }
  const [states, setStates] = useState({}); // id -> { kind, text }
  const [custom, setCustom] = useState([]); // extra rows from the server
  const [sync, setSync] = useState({ kind: "loading", text: "loading…" });
  const timers = useRef({});
  const latest = useRef(values);
  latest.current = values;

  const rows = useMemo(() => {
    const base = CATEGORIES.flatMap((c) => c.rows.map(([brand, product, store]) => ({ id: rowId(c.id, brand, product), cat: c.id, brand, product, store, custom: false })));
    return [...base, ...custom];
  }, [custom]);
  const rowById = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);

  useEffect(() => {
    if (!key || !API_URL) return;
    let cancelled = false;
    api(key, "GET", "/measurements")
      .then(({ items }) => {
        if (cancelled) return;
        const v = {};
        const s = {};
        const extra = [];
        for (const it of items) {
          v[it.id] = { base: it.base ?? "", height: it.height ?? "", note: it.note ?? "" };
          if (it.base || it.height || it.note) s[it.id] = { kind: "saved", text: it.updatedAt ? `saved ${timeOf(it.updatedAt)}` : "saved" };
          if (it.custom && it.cat) extra.push({ id: it.id, cat: it.cat, brand: it.brand || "?", product: it.product || "", store: it.store || "", custom: true });
        }
        setValues(v);
        setStates(s);
        setCustom(extra);
        setSync({ kind: "ok", text: "synced" });
      })
      .catch((err) => setSync({ kind: "error", text: err.message === "401" ? "wrong key" : "could not load" }));
    return () => {
      cancelled = true;
    };
  }, [key]);

  const setState = (id, kind, text) => setStates((s) => ({ ...s, [id]: { kind, text } }));

  const commit = async (id) => {
    clearTimeout(timers.current[id]);
    const r = rowById.get(id);
    const v = latest.current[id];
    if (!r || !v) return;
    const body = {
      base: v.base === "" ? "" : Number(v.base),
      height: v.height === "" ? "" : Number(v.height),
      note: v.note || "",
      cat: r.cat,
      brand: r.brand,
      product: r.product,
      store: r.store || "",
      custom: r.custom,
      updatedAt: new Date().toISOString(),
    };
    setState(id, "saving", "saving…");
    try {
      await api(key, "PUT", `/measurements/${id}`, body);
      setState(id, "saved", `saved ${timeOf(body.updatedAt)}`);
      setSync({ kind: "ok", text: "synced" });
    } catch {
      setState(id, "error", "not saved, edit again to retry");
      setSync({ kind: "error", text: "save failed" });
    }
  };

  const change = (id, k, val) => {
    setValues((v) => ({ ...v, [id]: { ...(v[id] || {}), [k]: val } }));
    setState(id, "saving", "typing…");
    clearTimeout(timers.current[id]);
    timers.current[id] = setTimeout(() => commit(id), 800);
  };

  const addCustom = (cat, brand, product) => {
    const id = `${rowId(cat, brand, product)}--x`;
    if (rowById.has(id)) return;
    setCustom((c) => [...c, { id, cat, brand, product, store: "", custom: true }]);
    setValues((v) => ({ ...v, [id]: { base: "", height: "", note: "" } }));
    setTimeout(() => commit(id), 0);
  };

  const removeCustom = async (id) => {
    const r = rowById.get(id);
    if (!r || !window.confirm(`Remove ${r.brand} ${r.product}?`)) return;
    setCustom((c) => c.filter((x) => x.id !== id));
    try {
      await api(key, "DELETE", `/measurements/${id}`);
    } catch {
      /* gone locally; the next load reconciles */
    }
  };

  const measured = rows.filter((r) => values[r.id]?.base && values[r.id]?.height).length;

  return (
    <Page>
      <Helmet>
        <title>Measuring run | HolderForge</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Bar $tone={sync.kind === "error" ? "error" : undefined}>
        <h1>Cosmetics measuring run</h1>
        <span>
          {measured} of {rows.length} · {sync.text}
        </span>
      </Bar>

      {!API_URL ? (
        <How>This page needs the staging API. VITE_API_URL is not set on this build.</How>
      ) : !key ? (
        <Gate
          onSubmit={(e) => {
            e.preventDefault();
            const k = keyInput.trim();
            if (!k) return;
            try {
              localStorage.setItem(KEY_STORAGE, k);
            } catch {
              /* ignore */
            }
            setKey(k);
          }}
        >
          <span>Paste the measuring key once; it stays on this phone.</span>
          <input value={keyInput} onChange={(e) => setKeyInput(e.target.value)} placeholder="key" aria-label="Measuring key" />
          <button type="submit">Open</button>
        </Gate>
      ) : (
        <>
          <How>
            <b>Base</b> is the widest point of the bottom 30 mm with the cap on. <b>Height</b> is with the cap on. Every field saves as soon as you leave it.
          </How>
          {CATEGORIES.map((c) => {
            const list = rows.filter((r) => r.cat === c.id);
            const n = list.filter((r) => values[r.id]?.base && values[r.id]?.height).length;
            return (
              <Cat key={c.id}>
                <CatHead $done={n === list.length}>
                  <div className="top">
                    <h2>{c.name}</h2>
                    <span className="count">
                      {n} of {list.length}
                    </span>
                  </div>
                  <p>{c.what}</p>
                </CatHead>
                <Examples>
                  {c.examples.map((ex) => (
                    <figure key={ex.sku}>
                      <img src={`/images/measure/${ex.sku}.jpg`} alt={ex.caption} loading="lazy" width="120" height="120" />
                      <figcaption>{ex.caption}</figcaption>
                    </figure>
                  ))}
                </Examples>
                <div>
                  {list.map((r) => (
                    <Row key={r.id} row={r} value={values[r.id]} state={states[r.id]} onChange={change} onCommit={commit} onRemove={removeCustom} />
                  ))}
                </div>
                <AddForm
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = e.currentTarget;
                    const brand = f.brand.value.trim();
                    const product = f.product.value.trim();
                    if (!brand) return;
                    addCustom(c.id, brand, product || "—");
                    f.reset();
                  }}
                >
                  <input name="brand" placeholder="Brand" aria-label="Brand" />
                  <input name="product" placeholder="Product" aria-label="Product" />
                  <button type="submit">Add</button>
                </AddForm>
              </Cat>
            );
          })}
        </>
      )}
    </Page>
  );
}
