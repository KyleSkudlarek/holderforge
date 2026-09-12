// Catalog queries shared by the storefront pages and the prerender script.
import { bottles, bottleTypes } from "./bottles";
import { products, productBySlug, footprintFor } from "./products";
import { categories, categoryBySlug } from "./categories";
import { colors, defaultColorId } from "./colors";

export { bottles, bottleTypes, products, productBySlug, footprintFor, categories, categoryBySlug, colors, defaultColorId };

export const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const money = (cents) => `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;

export const brandSlug = (brand) => slugify(brand);

// Brands with their bottles, sorted by name.
export function brands() {
  const map = new Map();
  for (const bottle of bottles) {
    const slug = brandSlug(bottle.brand);
    if (!map.has(slug)) map.set(slug, { slug, name: bottle.brand, bottles: [] });
    map.get(slug).bottles.push(bottle);
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export const brandBySlug = (slug) => brands().find((b) => b.slug === slug);

export const holeSizes = () => [...new Set(bottles.map((b) => b.hole))].sort((a, b) => a - b);

export const bottlesForHole = (hole) => bottles.filter((b) => b.hole === hole);

// Products sold in `hole` mm. With a bottle `type`, only products whose
// categories cover that type (a perfume spray never suggests the makeup organizer).
export const productsForHole = (hole, type) =>
  products.filter(
    (p) =>
      (p.holeSizes.includes(hole) || (p.fitsHoles && hole >= p.fitsHoles[0] && hole <= p.fitsHoles[1])) &&
      (!type || p.categories.some((slug) => (categoryBySlug(slug)?.types || []).includes(type)))
  );

export const productsForCategory = (slug) => products.filter((p) => p.categories.includes(slug));

export const bottlesForCategory = (slug) => {
  const cat = categoryBySlug(slug);
  return cat ? bottles.filter((b) => cat.types.includes(b.type)) : [];
};

// Bottles a product fits, grouped by hole size: [{ hole, bottles }]. Only
// bottle types covered by the product's categories count, so a makeup
// organizer sold in 15 mm does not claim to fit 15 mm perfume sprays.
export function fitsForProduct(product) {
  const types = new Set(product.categories.flatMap((slug) => categoryBySlug(slug)?.types || []));
  return product.holeSizes
    .map((hole) => ({ hole, bottles: bottlesForHole(hole).filter((b) => types.has(b.type)) }))
    .filter((g) => g.bottles.length > 0);
}

export const bottleLabel = (b) => `${b.brand} ${b.product} ${b.volume}`;

export const bottleId = (b) => slugify(`${b.brand} ${b.product} ${b.volume}`);

export const bottleById = (id) => bottles.find((b) => bottleId(b) === id);

// Free-text search over bottles, sizes and products. A query that contains a
// number is treated as a size in mm.
export function search(query, limit = 8) {
  const q = query.trim().toLowerCase();
  if (!q) return { bottles: [], sizes: [], products: [] };
  const terms = q.split(/\s+/).filter(Boolean);

  const sizeMatch = q.match(/(\d{1,2}(?:\.\d)?)\s*(?:mm)?/);
  const sizes = sizeMatch ? holeSizes().filter((h) => String(h).startsWith(sizeMatch[1])) : [];

  const score = (b) => {
    const hay = [b.brand, b.product, b.volume, bottleTypes[b.type], ...b.aliases].join(" ").toLowerCase();
    let s = 0;
    for (const t of terms) {
      if (b.brand.toLowerCase().startsWith(t) || b.aliases.some((a) => a.toLowerCase().startsWith(t))) s += 3;
      else if (hay.includes(t)) s += 1;
      else return 0;
    }
    return s;
  };
  const matched = bottles
    .map((b) => ({ b, s: score(b) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.b.brand.localeCompare(b.b.brand))
    .slice(0, limit)
    .map((x) => x.b);

  const matchedProducts = products.filter((p) => terms.every((t) => `${p.name} ${p.tagline}`.toLowerCase().includes(t)));

  return { bottles: matched, sizes, products: matchedProducts };
}

// Every URL the site serves statically, for prerendering and the sitemap.
export function staticRoutes() {
  return [
    "/",
    "/shop",
    ...categories.map((c) => `/shop/${c.slug}`),
    ...products.map((p) => `/shop/${p.slug}`),
    "/find",
    "/fits",
    ...brands().map((b) => `/fits/${b.slug}`),
    ...holeSizes().map((h) => `/fits/${h}mm`),
    "/guides/how-to-measure",
    "/design",
  ];
}
