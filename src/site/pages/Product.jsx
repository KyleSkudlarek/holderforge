import { useState } from "react";
import styled from "styled-components";
import { Link, useParams, useSearchParams } from "react-router-dom";
import Seo, { breadcrumbLd, canonicalUrl } from "../Seo";
import BottleSearch from "../BottleSearch";
import ProductCard from "../ProductCard";
import HolderCanvas from "../HolderCanvas";
import { holderConfig } from "../../render/holderConfig";
import NotFound from "./NotFound";
import { Container, Section, H1, H2, H3, Text, Muted, Button, ButtonLink, Card, CardBody, ChipRow, Chip, Swatch, Breadcrumbs, InlineLink, ExternalLink, Notice, Segmented } from "../ui";
import {
  productBySlug,
  colors,
  defaultColorId,
  fitsForProduct,
  bottleById,
  bottleId,
  bottleLabel,
  brandSlug,
  productsForHole,
  footprintFor,
  money,
  categoryBySlug,
  renderImage,
  productTypes,
  bottlesFittingSize,
  fitFor,
  fitForAll,
  bestSizeFor,
  recommendedHole,
  rowPlanFor,
  RULE_TEXT,
} from "../../catalog";

const SHIPPING_CENTS = 695;

const Layout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(320px, 5fr);
  /* Row 1 is the gallery's height; the buy box spans both rows, so the
     description sits directly under the gallery. */
  grid-template-rows: auto 1fr;
  align-items: start;
  gap: 40px;
  padding-top: 20px;
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: 1fr;
    gap: 24px;
  }
`;

const Gallery = styled.div`
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  @media (max-width: ${({ theme }) => theme.breakpoints.phone}) {
    grid-template-columns: 1fr;
  }
`;

const Thumbs = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  @media (max-width: ${({ theme }) => theme.breakpoints.phone}) {
    flex-direction: row;
    order: 2;
    overflow-x: auto;
  }
`;

const Thumb = styled.button`
  position: relative;
  width: 72px;
  height: 72px;
  padding: 0;
  border-radius: 6px;
  border: 2px solid ${({ theme, $active }) => ($active ? theme.colors.headerPrimary : theme.colors.outline)};
  background: ${({ theme }) => theme.colors.surfaceRaised};
  cursor: pointer;
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
`;

// Label over the live-render thumbnail so it reads as a gallery entry like
// the photos, not a text button.
const ThumbTag = styled.span`
  position: absolute;
  left: 50%;
  bottom: 6px;
  transform: translateX(-50%);
  padding: 2px 7px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  white-space: nowrap;
`;

const MainImage = styled.div`
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.outline};
`;

const Badge = styled.span`
  position: absolute;
  left: 12px;
  top: 12px;
  padding: 4px 10px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 13px;
`;

const BuyBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-column: 2;
    grid-row: 1 / span 2;
    position: sticky;
    top: 16px;
  }
`;

// Sits under the gallery on desktop and after the buy box on a phone.
const About = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-column: 1;
  }
`;

const StepCard = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.outline};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.surface};
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const StepTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.headerPrimary};
  span.n {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.highlightPrimary};
    color: #fff;
    font-size: 13px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
`;

const Fit = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${({ theme, $tone }) => ($tone === "warning" ? theme.colors.warning : theme.colors.success)};
  font-size: 15px;
  button {
    background: none;
    border: 0;
    padding: 0 4px;
    color: ${({ theme }) => theme.colors.muted};
    cursor: pointer;
    font-size: 13px;
    font-family: inherit;
  }
`;

const SelectedList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
  li {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 15px;
    color: ${({ theme }) => theme.colors.headerPrimary};
  }
  li > span:first-child {
    flex: 1;
  }
  button {
    background: none;
    border: 0;
    padding: 0 4px;
    color: ${({ theme }) => theme.colors.muted};
    cursor: pointer;
    font-size: 13px;
    font-family: inherit;
  }
`;

// Bottles grouped by the row that holds them, for a size-per-row holder.
const RowPlan = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
  > li > strong {
    display: block;
    margin-bottom: 4px;
    font-size: 14px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.headerPrimary};
  }
`;

const FitTag = styled.span`
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
  white-space: nowrap;
  color: ${({ theme, $tone }) => ($tone === "success" ? theme.colors.success : $tone === "warning" ? theme.colors.warning : theme.colors.muted)};
  border: 1px solid currentColor;
`;

const FitNote = styled.span`
  margin-left: 6px;
  font-size: 11px;
  opacity: 0.8;
`;

const ROW_NAMES = ["front", "middle", "back"];
// "Front row", "Front and middle rows".
const rowsLabel = (names) => (names.length === 1 ? `${names[0]} row` : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]} rows`);
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const SIZE_MODE_OPTIONS = [
  { value: "one", label: "One size" },
  { value: "mixed", label: "Mixed sizes" },
];

const Price = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.headerPrimary};
  display: flex;
  align-items: baseline;
  gap: 10px;
`;

const Qty = styled.div`
  display: inline-flex;
  border: 1px solid ${({ theme }) => theme.colors.outline};
  border-radius: 6px;
  overflow: hidden;
  button {
    width: 44px;
    height: 44px;
    border: 0;
    background: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.headerPrimary};
    font-size: 18px;
    cursor: pointer;
    border-radius: 0;
    padding: 0;
  }
  span {
    width: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-left: 1px solid ${({ theme }) => theme.colors.outline};
    border-right: 1px solid ${({ theme }) => theme.colors.outline};
  }
`;

const Trust = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: ${({ theme }) => theme.colors.muted};
  font-size: 14px;
`;

const Below = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(280px, 5fr);
  gap: 40px;
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: 1fr;
  }
`;

const FitsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
`;

const FitsGroup = styled.div`
  h4 {
    margin: 0 0 6px;
    padding-bottom: 4px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.outline};
    font-size: 16px;
    color: ${({ theme }) => theme.colors.headerPrimary};
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 14px;
  }
  a {
    color: ${({ theme }) => theme.colors.headerSecondary};
    text-decoration: none;
    font-weight: 400;
  }
  a:hover {
    color: ${({ theme }) => theme.colors.headerPrimary};
  }
`;

const Specs = styled.dl`
  margin: 0;
  display: grid;
  grid-template-columns: 160px 1fr;
  border: 1px solid ${({ theme }) => theme.colors.outline};
  border-radius: 8px;
  overflow: hidden;
  font-size: 14px;
  dt,
  dd {
    margin: 0;
    padding: 10px 14px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.outline};
  }
  dt {
    color: ${({ theme }) => theme.colors.muted};
    background: ${({ theme }) => theme.colors.surface};
  }
  dd {
    color: ${({ theme }) => theme.colors.headerSecondary};
  }
  dt:nth-last-of-type(1),
  dd:nth-last-of-type(1) {
    border-bottom: 0;
  }
`;

const FilterInput = styled.input`
  max-width: 320px;
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid ${({ theme }) => theme.colors.outline};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.headerPrimary};
  font-size: 14px;
  font-family: inherit;
`;

const Faq = styled.details`
  border: 1px solid ${({ theme }) => theme.colors.outline};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.surface};
  summary {
    cursor: pointer;
    padding: 12px 14px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.headerPrimary};
  }
  p {
    margin: 0;
    padding: 0 14px 14px;
    font-size: 14px;
    line-height: 1.5;
    color: ${({ theme }) => theme.colors.headerSecondary};
  }
`;

const Review = styled.blockquote`
  margin: 0;
  padding: 12px 14px;
  border: 1px solid ${({ theme }) => theme.colors.outline};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.surface};
  font-size: 14px;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.headerSecondary};
  footer {
    margin-top: 6px;
    color: ${({ theme }) => theme.colors.muted};
    font-size: 13px;
  }
`;

const MobileBar = styled.div`
  display: none;
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    display: flex;
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 30;
    gap: 12px;
    align-items: center;
    padding: 10px 16px;
    background: ${({ theme }) => theme.colors.background};
    border-top: 1px solid ${({ theme }) => theme.colors.outline};
  }
`;

const Spacer = styled.div`
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    height: 72px;
  }
`;

const Check = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    <path d="M4 12l5 5 11-11" />
  </svg>
);

export default function Product() {
  const { slug } = useParams();
  const product = productBySlug(slug);
  const [params, setParams] = useSearchParams();
  const [quantity, setQuantity] = useState(1);
  const [brandFilter, setBrandFilter] = useState("");
  const [showAllSizes, setShowAllSizes] = useState(false);
  const [view, setView] = useState("photo-0");

  if (!product) return <NotFound />;

  // Selected bottles: ?bottles=id,id (several sizes) or the single ?bottle=id
  // that finder and brand pages link with.
  const selected = (params.get("bottles") || params.get("bottle") || "")
    .split(",")
    .map((id) => bottleById(id))
    .filter(Boolean);
  const bottle = selected[0] || null;
  const mixed = params.get("mixed") === "1" || selected.length > 1;
  const holes = selected.map((b) => b.hole);
  const sizeParam = Number(params.get("size"));
  const size = product.holeSizes.includes(sizeParam)
    ? sizeParam
    : selected.length
      ? bestSizeFor(product, holes)
      : product.holeSizes.length === 1
        ? product.holeSizes[0]
        : null;
  const recommended = selected.length ? bestSizeFor(product, holes) : null;
  // Bottles too far apart for one hole size get a size per row instead: the
  // same print, so the price and photos are unchanged.
  const plan = selected.length > 1 && !recommended ? rowPlanFor(product, holes, product.layout.rows) : null;
  const planHoles = plan ? plan.map((r) => r.hole) : null;
  const planGroups = plan ? [...new Set(plan)].map((g) => ({ ...g, rows: plan.flatMap((x, i) => (x === g ? [ROW_NAMES[i]] : [])) })) : [];
  const holeForBottle = (b) => (plan ? plan.find((g) => g.bottleHoles.includes(b.hole)).hole : size);
  const colorId = colors.some((c) => c.id === params.get("color")) ? params.get("color") : defaultColorId;
  const color = colors.find((c) => c.id === colorId);

  const update = (changes) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      if (v === null || v === undefined || v === "") next.delete(k);
      else next.set(k, v);
    }
    setParams(next, { replace: true });
  };

  const setSelected = (list) => {
    const ids = [...new Set(list.map(bottleId))];
    update({ bottles: ids.join(","), bottle: null, size: bestSizeFor(product, list.map((b) => b.hole)) });
  };
  const pickBottle = (b) => setSelected(mixed ? [...selected, b] : [b]);
  const removeBottle = (b) => setSelected(selected.filter((x) => bottleId(x) !== bottleId(b)));
  const pickSize = (h) => update({ size: h });
  const setMixed = (on) => update({ mixed: on ? "1" : null, bottles: on ? params.get("bottles") || params.get("bottle") : bottle ? bottleId(bottle) : null, bottle: null });

  const fits = fitsForProduct(product);
  const brandCount = new Set(fits.flatMap((g) => g.bottles.map((b) => b.brand))).size;
  // With a size chosen the list narrows to bottles that go into that size,
  // grouped by fit; otherwise every size the holder is sold in.
  const narrowed = size && !showAllSizes;
  const fitGroups = narrowed
    ? bottlesFittingSize(size, productTypes(product)).map((g) => ({ key: g.grade.id, title: g.grade.label, hole: size - g.grade.gap, bottles: g.bottles }))
    : fits.map((g) => ({ key: String(g.hole), title: `${g.hole} mm`, hole: g.hole, bottles: g.bottles }));
  const filteredFits = brandFilter
    ? fitGroups.map((g) => ({ ...g, bottles: g.bottles.filter((b) => bottleLabel(b).toLowerCase().includes(brandFilter.toLowerCase())) })).filter((g) => g.bottles.length)
    : fitGroups;
  const footprint = footprintFor(size || product.holeSizes[0], product.layout.holesPerRow);
  const slots = product.layout.rows * product.layout.holesPerRow;
  const worstAtSize = size && selected.length ? fitForAll(size, holes) : null;
  // Photos of the chosen colour, else of the first colour that has any, so a
  // buyer always sees a real print; the render view carries the exact colour.
  const photoColorId = product.images[colorId]?.length ? colorId : Object.keys(product.images).find((c) => product.images[c]?.length);
  const photos = photoColorId ? product.images[photoColorId] : [];
  const photoColor = colors.find((c) => c.id === photoColorId);
  const requestedPhoto = view.startsWith("photo-") ? Number(view.slice(6)) : null;
  const activeView = requestedPhoto === null ? view : photos[requestedPhoto] ? view : photos.length ? "photo-0" : "render";
  const renderSize = size || product.holeSizes[0];
  const liveConfig = holderConfig({ hole: renderSize, holes: planHoles, holesPerRow: product.layout.holesPerRow, rows: product.layout.rows });
  // Without a diameter each bottle takes its row's hole, which is what a
  // size-per-row holder should show.
  const liveBottles = { diameter: plan ? undefined : bottle ? bottle.hole - 1 : renderSize - 1, height: bottle?.height || 90 };
  const others = size ? productsForHole(size).filter((p) => p.slug !== product.slug && p.categories.some((c) => product.categories.includes(c))) : [];
  const bottlesParam = selected.length ? selected.map(bottleId).join(",") : undefined;
  const primaryCategory = categoryBySlug(product.categories[0]);
  const holesLabel = planHoles ? planHoles.join(" / ") : String(size || product.holeSizes[0]);
  const designerHref = `/design/?d=${planHoles ? planHoles.join(",") : size || product.holeSizes[0]}`;
  const path = `/shop/${product.slug}`;

  const jsonLd = [
      {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description,
        brand: { "@type": "Brand", name: "HolderForge" },
        material: "PLA",
        url: canonicalUrl(path),
        offers: {
          "@type": "Offer",
          priceCurrency: "USD",
          price: (product.priceCents / 100).toFixed(2),
          availability: "https://schema.org/InStock",
          itemCondition: "https://schema.org/NewCondition",
          url: canonicalUrl(path),
          shippingDetails: {
            "@type": "OfferShippingDetails",
            shippingRate: { "@type": "MonetaryAmount", value: (SHIPPING_CENTS / 100).toFixed(2), currency: "USD" },
            shippingDestination: { "@type": "DefinedRegion", addressCountry: "US" },
          },
        },
      },
      breadcrumbLd([{ name: "Shop", path: "/shop" }, ...(primaryCategory ? [{ name: primaryCategory.name, path: `/shop/${primaryCategory.slug}` }] : []), { name: product.name, path }]),
    ];

  const bottleItem = (b) => {
    const hole = holeForBottle(b);
    const f = hole ? fitFor(hole, b.hole) : null;
    return (
      <li key={bottleId(b)}>
        <span>{bottleLabel(b)}</span>
        {f ? <FitTag $tone={f.tone}>{f.label}</FitTag> : null}
        <button type="button" onClick={() => removeBottle(b)} aria-label={`Remove ${bottleLabel(b)}`}>
          remove
        </button>
      </li>
    );
  };

  const sizeSummary = product.holeSizes.length === 1 ? `${product.holeSizes[0]} mm` : `${product.holeSizes[0]}-${product.holeSizes[product.holeSizes.length - 1]} mm`;

  return (
    <>
      <Seo
        title={`${product.name} (${sizeSummary})`}
        description={`${product.tagline} Fits ${brandCount} measured brands. ${colors.filter((c) => c.available).length} colours, ${money(product.priceCents)}, made to order in Austin, TX.`}
        path={path}
        jsonLd={jsonLd}
      />
      <Container>
        <Breadcrumbs aria-label="Breadcrumb">
          <Link to="/">Home</Link> <span>/</span> <Link to="/shop/">Shop</Link>
          {primaryCategory ? (
            <>
              <span>/</span> <Link to={`/shop/${primaryCategory.slug}/`}>{primaryCategory.name}</Link>
            </>
          ) : null}
          <span>/</span> <span>{product.name}</span>
        </Breadcrumbs>

        <Layout>
          <div>
            <Gallery>
              <Thumbs>
                {photos.map((src, i) => (
                  <Thumb key={src} type="button" $active={activeView === `photo-${i}`} onClick={() => setView(`photo-${i}`)} aria-label={`Photo ${i + 1}, ${photoColor.name}`}>
                    <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </Thumb>
                ))}
                <Thumb type="button" $active={activeView === "render"} onClick={() => setView("render")} aria-label={`${color.name}, rendered`}>
                  <img src={renderImage(product, colorId)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </Thumb>
                <Thumb type="button" $active={activeView === "3d"} onClick={() => setView("3d")} aria-label="3D view with your bottles">
                  <img src={renderImage(product, colorId)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }} />
                  <ThumbTag>3D</ThumbTag>
                </Thumb>
              </Thumbs>
              <MainImage>
                {activeView === "3d" ? (
                  <HolderCanvas
                    config={liveConfig}
                    color={color.swatch}
                    bottles={liveBottles}
                    view="product"
                    spin
                    ratio="1 / 1"
                    alt={`${product.name} in ${color.name} with ${plan ? "your" : `${renderSize} mm`} bottles. Drag to turn.`}
                  />
                ) : activeView === "render" ? (
                  <img src={renderImage(product, colorId)} alt={`${product.name} in ${color.name}, rendered`} width="800" height="600" style={{ display: "block", width: "100%", height: "auto", padding: "8% 0", boxSizing: "border-box" }} />
                ) : (
                  <img src={photos[Number(activeView.slice(6))]} alt={`${product.name} in ${photoColor.name}`} style={{ display: "block", width: "100%" }} />
                )}
                <Badge>
                  {activeView === "render" || activeView === "3d" ? `${color.name}, rendered` : photoColorId === colorId ? color.name : `Photographed in ${photoColor.name}`}
                  {size || plan ? `, ${holesLabel} mm holes` : ""}
                </Badge>
              </MainImage>
            </Gallery>
          </div>

          <BuyBox>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <H1 style={{ fontSize: 30 }}>{product.name}</H1>
              <Text>{product.tagline}</Text>
              <Muted>Fits {brandCount} measured brands. 4.9 stars, 24 reviews on Etsy.</Muted>
            </div>
            <Price>
              {money(product.priceCents)}
              <Muted>+ {money(SHIPPING_CENTS)} USPS Ground. Buy 2, save 25%.</Muted>
            </Price>

            <StepCard>
              <StepTitle>
                <span className="n">1</span>Which bottle is it for?
              </StepTitle>
              {selected.length && !plan ? <SelectedList>{selected.map((b) => bottleItem(b))}</SelectedList> : null}
              {plan ? (
                <RowPlan>
                  {planGroups.map((g) => (
                    <li key={g.rows[0]}>
                      <strong>
                        {capitalize(rowsLabel(g.rows))}: {g.hole} mm
                      </strong>
                      <SelectedList>{selected.filter((b) => g.bottleHoles.includes(b.hole)).map((b) => bottleItem(b))}</SelectedList>
                    </li>
                  ))}
                </RowPlan>
              ) : null}
              {!selected.length || mixed ? (
                <BottleSearch placeholder={mixed && selected.length ? "Add another bottle" : 'Search your brand, e.g. "ScentSplit"'} onPick={pickBottle} />
              ) : null}
              {product.holeSizes.length > 1 ? (
                <Segmented label="Bottle sizes" options={SIZE_MODE_OPTIONS} value={mixed ? "mixed" : "one"} onChange={(v) => setMixed(v === "mixed")} style={{ alignSelf: "flex-start" }} />
              ) : null}
              {plan ? (
                <Fit $tone="success">
                  <Check />
                  <span>One hole size per row, so every bottle fits. Same holder, same price.</span>
                </Fit>
              ) : null}
              {selected.length && !recommended && !plan ? (
                <Notice $tone="warning">
                  {selected.length > 1 ? "These bottles span too wide a range for one hole size." : `${bottleLabel(bottle)} needs a ${bottle.hole} mm hole, which this holder isn't sold in.`}{" "}
                  {selected.length > 1 ? (
                    <>
                      <InlineLink to={`/design/?d=${recommendedHole(holes)}`}>Design a holder with a different size per row</InlineLink>.
                    </>
                  ) : (
                    <>
                      <InlineLink to={`/fits/${bottle.hole}mm/`}>See holders for {bottle.hole} mm</InlineLink>.
                    </>
                  )}
                </Notice>
              ) : null}
              {selected.length && recommended && size === recommended && worstAtSize?.ok ? (
                <Fit $tone={worstAtSize.tone}>
                  <Check />
                  <span>
                    Recommended: {recommended} mm holes.{" "}
                    {worstAtSize.gap === 0 ? (selected.length > 1 ? "Largest bottle snug, the rest have a little room." : "Snug fit.") : worstAtSize.gap === 1 ? "Every bottle fits with a little room." : "The smallest bottle will be loose."}
                  </span>
                </Fit>
              ) : null}
              {plan ? null : product.holeSizes.length > 1 ? (
                <>
                  <Muted>{selected.length ? "Hole size:" : "Or pick the hole size:"}</Muted>
                  <ChipRow>
                    {product.holeSizes.map((h) => {
                      const f = selected.length ? fitForAll(h, holes) : null;
                      return (
                        <Chip key={h} type="button" $active={size === h} disabled={f ? !f.ok : false} title={f ? f.label : undefined} onClick={() => pickSize(h)} style={f && !f.ok ? { opacity: 0.4, cursor: "default" } : undefined}>
                          {h} mm{f && f.ok ? <FitNote>{f.short}</FitNote> : null}
                        </Chip>
                      );
                    })}
                  </ChipRow>
                </>
              ) : (
                <Muted>One size: {product.holeSizes[0]} mm holes.</Muted>
              )}
              <Muted>{RULE_TEXT}</Muted>
              <Muted>
                Not sure? <InlineLink to="/guides/how-to-measure/">Measure your bottle</InlineLink> (30 seconds).
              </Muted>
            </StepCard>

            <StepCard>
              <StepTitle>
                <span className="n">2</span>Colour: {color.name}
              </StepTitle>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {colors.map((c) => (
                  <Swatch
                    key={c.id}
                    type="button"
                    $color={c.swatch}
                    $active={c.id === colorId}
                    $unavailable={!c.available}
                    $size={36}
                    title={c.available ? c.name : `${c.name} (out of stock)`}
                    aria-label={c.name}
                    aria-pressed={c.id === colorId}
                    disabled={!c.available}
                    onClick={() => update({ color: c.id })}
                  />
                ))}
              </div>
            </StepCard>

            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <Qty>
                <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">
                  -
                </button>
                <span>{quantity}</span>
                <button type="button" onClick={() => setQuantity((q) => Math.min(10, q + 1))} aria-label="Increase quantity">
                  +
                </button>
              </Qty>
              <Button type="button" disabled style={{ flex: 1 }} title="Checkout for ready-made holders is not open yet">
                Buy now
              </Button>
            </div>
            <Notice>
              Checkout for ready-made holders opens soon. You can order this exact size today in the designer:{" "}
              <InlineLink to={designerHref}>open it with {holesLabel} mm holes</InlineLink>, or message us on{" "}
              <ExternalLink href="https://www.etsy.com/shop/SkudsWorkshop" rel="noopener">
                Etsy
              </ExternalLink>
              .
            </Notice>
            <Trust>
              <li>Printed to order in Austin, TX. Ships USPS in 2-3 business days.</li>
              <li>14-day returns and exchanges. Wrong size? We'll swap it.</li>
              <li>Secure checkout with Stripe.</li>
            </Trust>
          </BuyBox>
          <About>
            <H2>About this holder</H2>
            <Text>{product.description}</Text>
          </About>
        </Layout>

        <Below style={{ marginTop: 48 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
            {fits.length ? (
              <Section style={{ padding: 0 }}>
                <H2>{narrowed ? `Bottles that fit the ${size} mm holder` : "Bottles this holder fits"}</H2>
                <Muted>
                  {narrowed ? `${RULE_TEXT} ` : "Grouped by the hole size we make for them. "}
                  {size ? (
                    <button type="button" onClick={() => setShowAllSizes(!showAllSizes)} style={{ background: "none", border: 0, padding: 0, color: "inherit", textDecoration: "underline", cursor: "pointer", font: "inherit" }}>
                      {showAllSizes ? `Show only ${size} mm` : "Show every size"}
                    </button>
                  ) : null}
                </Muted>
                <FilterInput type="search" value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)} placeholder="Filter brands" aria-label="Filter brands" />
                <FitsGrid>
                  {filteredFits.map((g) => (
                    <FitsGroup key={g.key}>
                      <h4>
                        {g.title}
                        {!narrowed ? (
                          <Chip as="button" type="button" $active={size === g.hole} onClick={() => pickSize(g.hole)} style={{ minHeight: 26, padding: "2px 10px", fontSize: 12, marginLeft: 6 }}>
                            {size === g.hole ? "selected" : "select"}
                          </Chip>
                        ) : (
                          <Muted style={{ marginLeft: 6 }}>{g.hole} mm bottles</Muted>
                        )}
                      </h4>
                      <ul>
                        {g.bottles.map((b) => (
                          <li key={bottleId(b)}>
                            <Link to={`/fits/${brandSlug(b.brand)}/`}>{bottleLabel(b)}</Link>
                          </li>
                        ))}
                      </ul>
                    </FitsGroup>
                  ))}
                  {filteredFits.length === 0 ? <Muted>{narrowed ? `No measured bottle fits ${size} mm yet.` : "No brand matches. Measure the bottle and pick a size above."}</Muted> : null}
                </FitsGrid>
              </Section>
            ) : (
              <Section style={{ padding: 0 }}>
                <H2>Bottles this holder fits</H2>
                <Text>Brand measurements for this category are in progress. Measure the tube base and pick the hole size 1 mm larger.</Text>
              </Section>
            )}

            <Section style={{ padding: 0 }}>
              <H2>Specs</H2>
              <Specs>
                <dt>Slots</dt>
                <dd>
                  {slots} ({product.layout.rows} tiers x {product.layout.holesPerRow})
                </dd>
                <dt>Footprint</dt>
                <dd>
                  {footprint.model_width} x {footprint.model_depth} mm ({(footprint.model_width / 25.4).toFixed(1)} x {(footprint.model_depth / 25.4).toFixed(1)} in)
                  {size ? ` at ${size} mm holes` : ""}
                </dd>
                <dt>Hole sizes</dt>
                <dd>{sizeSummary}, one size per holder</dd>
                <dt>Hole depth</dt>
                <dd>About a third of the bottle height, so bottles stand without tipping</dd>
                <dt>Material</dt>
                <dd>PLA, 3D printed with a fine-tuned finish. Made in Austin, TX.</dd>
              </Specs>
            </Section>

            <Section style={{ padding: 0 }}>
              <H2>How to measure your bottle</H2>
              <Text>
                Stand the bottle on paper, trace the base, measure the width of the trace to the nearest millimetre, then choose the hole size 1 mm larger. {RULE_TEXT}{" "}
                <InlineLink to="/guides/how-to-measure/">Full guide with photos</InlineLink>.
              </Text>
            </Section>

            <Section style={{ padding: 0 }}>
              <H2>Questions</H2>
              <Faq>
                <summary>My bottles are different sizes. Can I mix?</summary>
                <p>
                  A ready-made holder has one hole size, and it takes bottles up to 3 mm narrower than the hole. Switch to "Mixed sizes" above to check a mix; if the range is wider than that,{" "}
                  <InlineLink to="/design/">design a holder</InlineLink> with a different size on each row.
                </p>
              </Faq>
              <Faq>
                <summary>What if I order the wrong size?</summary>
                <p>Get in touch within 14 days and we'll print the right size and swap it.</p>
              </Faq>
              <Faq>
                <summary>Will tall bottles tip over?</summary>
                <p>Holes are cut to about a third of the bottle height. Bottles more than 2 mm narrower than the hole start to lean, and tall rollerballs lean first, so match the size.</p>
              </Faq>
            </Section>

            <Section style={{ padding: 0 }}>
              <H2>Reviews</H2>
              <Review>
                "It is perfect to hold my perfumes, and the bronze color is exactly what I wanted. It's very sturdy and heavier than I thought it would be, in a good way!"
                <footer>Etsy buyer, June 2025</footer>
              </Review>
              <Review>
                "I needed a bit of help with the custom sizing and Kyle was super quick to respond and help. Great quality. Great service."
                <footer>Dario, May 2025</footer>
              </Review>
            </Section>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card style={{ borderStyle: "dashed" }}>
              <CardBody>
                <H3>Need something different?</H3>
                <Text>More rows, square holes, a different count per row, or a size we don't stock.</Text>
                <div>
                  <ButtonLink to={designerHref} $variant="secondary">
                    Design your own
                  </ButtonLink>
                </div>
              </CardBody>
            </Card>
            {others.length ? (
              <>
                <H3>Other holders for {size} mm bottles</H3>
                {others.map((p) => (
                  <ProductCard key={p.slug} product={p} size={size} bottle={bottlesParam} />
                ))}
              </>
            ) : null}
          </div>
        </Below>
        <Spacer />
      </Container>

      <MobileBar>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 18, fontWeight: 700 }}>{money(product.priceCents)}</span>
          <Muted>
            {size ? `${size} mm, ` : ""}
            {color.name}
          </Muted>
        </div>
        <Button type="button" disabled style={{ flex: 1 }}>
          Buy now
        </Button>
      </MobileBar>
    </>
  );
}
