import { CardLink, CardBody, H3, Muted, SwatchDots } from "./ui";
import { productImage } from "../catalog";
import { colors, defaultColorId, fitsForProduct, money } from "../catalog";

// Grid tile for a catalog holder. `size` preselects a hole size on the
// product page, `bottle` the bottle id that led here.
export default function ProductCard({ product, size, bottle, hint }) {
  const fits = fitsForProduct(product);
  const brandCount = new Set(fits.flatMap((g) => g.bottles.map((b) => b.brand))).size;
  const sizes = product.holeSizes;
  const sizeText = sizes.length === 1 ? `${sizes[0]} mm holes` : `${sizes[0]}-${sizes[sizes.length - 1]} mm holes`;
  const params = new URLSearchParams();
  if (size && product.holeSizes.includes(size)) params.set("size", size);
  if (bottle) params.set(bottle.includes(",") ? "bottles" : "bottle", bottle);
  const qs = params.toString();
  return (
    <CardLink to={`/shop/${product.slug}/${qs ? `?${qs}` : ""}`}>
      <img
        src={productImage(product, defaultColorId)}
        alt={`${product.name} in ${colors.find((c) => c.id === defaultColorId).name}`}
        width="800"
        height="600"
        loading="lazy"
        style={{ display: "block", width: "100%", height: "auto", background: "var(--render-bg, transparent)" }}
      />
      <CardBody>
        <H3>{product.name}</H3>
        <Muted>{hint || (brandCount ? `Fits ${brandCount} brands, ${sizeText}` : sizeText)}</Muted>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
          <span style={{ fontSize: 18, fontWeight: 600 }}>{money(product.priceCents)}</span>
          <SwatchDots colors={colors.filter((c) => c.available)} />
        </div>
      </CardBody>
    </CardLink>
  );
}
