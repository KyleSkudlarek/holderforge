import styled from "styled-components";
import { Link, useParams, useSearchParams } from "react-router-dom";
import Seo, { breadcrumbLd } from "../Seo";
import BottleSearch from "../BottleSearch";
import ProductCard from "../ProductCard";
import NotFound from "./NotFound";
import { Container, Section, H1, H2, Lead, Muted, Grid, ChipRow, Chip, ChipLink, Card, CardBody, H3, Text, ButtonLink, Breadcrumbs } from "../ui";
import { categories, categoryBySlug, products, holeSizes, bottlesForHole, bottlesForCategory, productsForCategory, productsForHole, brandSlug } from "../../catalog";

const Toolbar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const FilterLabel = styled(Muted)`
  min-width: 90px;
  display: inline-flex;
  align-items: center;
`;

const FilterRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: flex-start;
  flex-wrap: wrap;
`;

// /shop and /shop/<category>. Filters: category (path) and hole size (query).
export default function Shop() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const category = slug ? categoryBySlug(slug) : null;
  if (slug && !category) return <NotFound />;

  const size = Number(params.get("size")) || null;
  const setSize = (h) => {
    const next = new URLSearchParams(params);
    if (h && h !== size) next.set("size", h);
    else next.delete("size");
    setParams(next, { replace: true });
  };

  let list = category ? productsForCategory(category.slug) : products;
  if (size) list = list.filter((p) => productsForHole(size).includes(p));

  const sizesShown = category
    ? [...new Set(bottlesForCategory(category.slug).map((b) => b.hole))].sort((a, b) => a - b)
    : holeSizes();

  const title = category ? `${category.name} holders` : "Bottle holders and organizers";
  const description = category
    ? `${category.description} Made to order in Austin, TX in 10 colours.`
    : "3D-printed holders for travel sprays, decants, rollerballs and makeup, made with the hole size for your bottles. Search your brand or browse by size.";
  const path = category ? `/shop/${category.slug}` : "/shop";

  return (
    <>
      <Seo
        title={title}
        description={description}
        path={path}
        jsonLd={breadcrumbLd([{ name: "Shop", path: "/shop" }, ...(category ? [{ name: category.name, path }] : [])])}
      />
      <Container>
        <Breadcrumbs aria-label="Breadcrumb">
          <Link to="/">Home</Link> <span>/</span> {category ? <Link to="/shop">Shop</Link> : <span>Shop</span>}
          {category ? (
            <>
              <span>/</span> <span>{category.name}</span>
            </>
          ) : null}
        </Breadcrumbs>
        <Section style={{ paddingTop: 20 }}>
          <H1>{title}</H1>
          <Lead>{category ? category.description : "Pick your brand and the hole size is set for you. Every holder comes in 10 colours."}</Lead>
          <BottleSearch wide placeholder='Search a brand or size, e.g. "Jo Malone" or "22mm"' />
        </Section>

        <Toolbar>
          <FilterRow>
            <FilterLabel>Holds</FilterLabel>
            <ChipRow>
              <ChipLink to={size ? `/shop?size=${size}` : "/shop"} $active={!category}>
                Everything
              </ChipLink>
              {categories.map((c) => (
                <ChipLink key={c.slug} to={`/shop/${c.slug}${size ? `?size=${size}` : ""}`} $active={category?.slug === c.slug}>
                  {c.name}
                </ChipLink>
              ))}
            </ChipRow>
          </FilterRow>
          <FilterRow>
            <FilterLabel>Bottle size</FilterLabel>
            <ChipRow>
              {sizesShown.map((h) => (
                <Chip key={h} type="button" $active={size === h} onClick={() => setSize(h)} title={`${bottlesForHole(h).length} bottles measured at ${h} mm`}>
                  {h} mm
                </Chip>
              ))}
              <ChipLink to="/guides/how-to-measure" style={{ borderStyle: "dashed" }}>
                Not sure? Measure it
              </ChipLink>
            </ChipRow>
          </FilterRow>
        </Toolbar>

        <Section>
          <Muted>
            {list.length} {list.length === 1 ? "holder" : "holders"}
            {size ? ` for ${size} mm bottles` : ""}
          </Muted>
          <Grid $cols={3}>
            {list.map((p) => (
              <ProductCard key={p.slug} product={p} size={size && p.holeSizes.includes(size) ? size : undefined} />
            ))}
            <Card style={{ borderStyle: "dashed", justifyContent: "center", textAlign: "center" }}>
              <CardBody style={{ alignItems: "center", gap: 10, padding: 24 }}>
                <H3>Need a size or layout we don't stock?</H3>
                <Text>Mixed sizes on each row, more rows, square holes, any diameter.</Text>
                <ButtonLink to={`/design${size ? `?d=${size}` : ""}`} $variant="secondary">
                  Design your own
                </ButtonLink>
              </CardBody>
            </Card>
          </Grid>
        </Section>

        {category ? (
          <Section>
            <H2>Bottles we've measured in this category</H2>
            <ChipRow>
              {[...new Set(bottlesForCategory(category.slug).map((b) => b.brand))].sort().map((brand) => (
                <ChipLink key={brand} to={`/fits/${brandSlug(brand)}`}>
                  {brand}
                </ChipLink>
              ))}
              {bottlesForCategory(category.slug).length === 0 ? <Muted>Measurements in progress. Measure your tube and pick a size above.</Muted> : null}
            </ChipRow>
          </Section>
        ) : null}
      </Container>
    </>
  );
}
