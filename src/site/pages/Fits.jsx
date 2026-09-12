import styled from "styled-components";
import { Link, useParams } from "react-router-dom";
import Seo, { breadcrumbLd } from "../Seo";
import ProductCard from "../ProductCard";
import NotFound from "./NotFound";
import { Container, Section, H1, H2, H3, Lead, Text, Muted, Grid, Card, CardBody, ChipRow, ChipLink, ButtonLink, Placeholder, Breadcrumbs, InlineLink } from "../ui";
import { brandBySlug, bottlesForHole, productsForHole, holeSizes, bottleTypes, bottleId, bottleLabel, brandSlug, categories } from "../../catalog";

const Facts = styled.dl`
  margin: 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  padding: 14px 18px;
  border: 1px solid ${({ theme }) => theme.colors.outline};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.surface};
  dt {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: ${({ theme }) => theme.colors.muted};
  }
  dd {
    margin: 2px 0 0;
    font-size: 18px;
    color: ${({ theme }) => theme.colors.headerPrimary};
  }
  dd.big {
    font-size: 24px;
    font-weight: 700;
  }
  @media (max-width: ${({ theme }) => theme.breakpoints.phone}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const Hero = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(280px, 2fr);
  gap: 40px;
  align-items: start;
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: 1fr;
  }
`;

const Two = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  @media (max-width: ${({ theme }) => theme.breakpoints.phone}) {
    grid-template-columns: 1fr;
  }
`;

const categoryFor = (type) => categories.find((c) => c.types.includes(type));

function SizePage({ hole }) {
  const list = bottlesForHole(hole);
  const holders = productsForHole(hole);
  const path = `/fits/${hole}mm`;
  return (
    <>
      <Seo
        title={`Holders for ${hole} mm bottles`}
        description={`${list.length} perfume and cologne bottles measured for a ${hole} mm hole, including ${list
          .slice(0, 3)
          .map((b) => b.brand)
          .join(", ")}. Holders made with ${hole} mm holes, in 10 colours.`}
        path={path}
        jsonLd={breadcrumbLd([{ name: "Bottles", path: "/fits" }, { name: `${hole} mm`, path }])}
      />
      <Container>
        <Breadcrumbs aria-label="Breadcrumb">
          <Link to="/">Home</Link> <span>/</span> <Link to="/fits">Bottles</Link> <span>/</span> <span>{hole} mm</span>
        </Breadcrumbs>
        <Section style={{ paddingTop: 20 }}>
          <H1>Holders for {hole} mm bottles</H1>
          <Lead>
            A {hole} mm hole fits bottles that measure about {hole - 1} mm across the base. {list.length} of the bottles we've measured are this size.
          </Lead>
        </Section>
        <Section style={{ paddingTop: 0 }}>
          <H2>Bottles at this size</H2>
          <ChipRow>
            {list.map((b) => (
              <ChipLink key={bottleId(b)} to={`/fits/${brandSlug(b.brand)}`}>
                {bottleLabel(b)}
              </ChipLink>
            ))}
          </ChipRow>
        </Section>
        <Section style={{ paddingTop: 0 }}>
          <H2>Holders made with {hole} mm holes</H2>
          <Grid $cols={3}>
            {holders.map((p) => (
              <ProductCard key={p.slug} product={p} size={hole} />
            ))}
            <Card style={{ borderStyle: "dashed", justifyContent: "center", textAlign: "center" }}>
              <CardBody style={{ alignItems: "center", gap: 10, padding: 24 }}>
                <H3>Mixing {hole} mm bottles with other sizes?</H3>
                <Text>Design a holder with a different size on each row.</Text>
                <ButtonLink to={`/design?d=${hole}`} $variant="secondary">
                  Design your own
                </ButtonLink>
              </CardBody>
            </Card>
          </Grid>
        </Section>
        <Section style={{ paddingTop: 0 }}>
          <H2>Other sizes</H2>
          <ChipRow>
            {holeSizes()
              .filter((h) => h !== hole)
              .map((h) => (
                <ChipLink key={h} to={`/fits/${h}mm`}>
                  {h} mm
                </ChipLink>
              ))}
          </ChipRow>
        </Section>
      </Container>
    </>
  );
}

function BrandPage({ brand }) {
  const holes = [...new Set(brand.bottles.map((b) => b.hole))].sort((a, b) => a - b);
  const holders = [...new Map(brand.bottles.flatMap((b) => productsForHole(b.hole, b.type).map((p) => [p.slug, p]))).values()];
  const first = brand.bottles[0];
  const category = categoryFor(first.type);
  const path = `/fits/${brand.slug}`;
  const sameSize = holes.flatMap((h) => bottlesForHole(h)).filter((b) => b.brand !== brand.name);
  const typeWord = bottleTypes[first.type].toLowerCase();

  return (
    <>
      <Seo
        title={`${brand.name} ${typeWord} holder (${holes.join(" / ")} mm)`}
        description={`Holders sized for ${brand.name} ${typeWord}s. We measured the ${first.volume} ${first.product.toLowerCase()} for a ${first.hole} mm hole. Made to order in Austin, TX in 10 colours.`}
        path={path}
        jsonLd={breadcrumbLd([{ name: "Bottles", path: "/fits" }, { name: brand.name, path }])}
      />
      <Container>
        <Breadcrumbs aria-label="Breadcrumb">
          <Link to="/">Home</Link> <span>/</span> <Link to="/fits">Bottles</Link>
          {category ? (
            <>
              <span>/</span> <Link to={`/shop/${category.slug}`}>{category.name}</Link>
            </>
          ) : null}
          <span>/</span> <span>{brand.name}</span>
        </Breadcrumbs>
        <Section style={{ paddingTop: 20 }}>
          <Hero>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <H1>{brand.name} holders</H1>
              <Lead>
                {brand.bottles.length === 1
                  ? `We measured the ${brand.name} ${first.volume} ${first.product.toLowerCase()} and make holders with ${first.hole} mm holes for it: snug enough to stand straight, loose enough to lift out without scuffing the label.`
                  : `${brand.name} sells ${brand.bottles.length} bottle sizes we've measured. Pick the one you own and the holder is made with the matching hole.`}
              </Lead>
              {brand.bottles.map((b) => (
                <Facts key={bottleId(b)}>
                  <div>
                    <dt>Bottle</dt>
                    <dd>
                      {b.product}, {b.volume}
                    </dd>
                  </div>
                  <div>
                    <dt>Measured base</dt>
                    <dd>{b.measured ? `${b.measured} mm` : `about ${b.hole - 1} mm`}</dd>
                  </div>
                  <div>
                    <dt>Hole size</dt>
                    <dd className="big">{b.hole} mm</dd>
                  </div>
                  <div>
                    <dt>Shape</dt>
                    <dd>{b.shape === "round" ? "Round" : "Square"}</dd>
                  </div>
                </Facts>
              ))}
            </div>
            <Placeholder label={`${brand.name} bottle in a holder: photo coming`} ratio="4 / 3" />
          </Hero>
        </Section>

        <Section style={{ paddingTop: 0 }}>
          <H2>Holders that fit {brand.name}</H2>
          <Grid $cols={3}>
            {holders.map((p) => {
              const b = brand.bottles.find((x) => p.holeSizes.includes(x.hole)) || first;
              return <ProductCard key={p.slug} product={p} size={b.hole} bottle={bottleId(b)} hint={`Preselected: ${b.hole} mm holes`} />;
            })}
            <Card style={{ borderStyle: "dashed", justifyContent: "center", textAlign: "center" }}>
              <CardBody style={{ alignItems: "center", gap: 10, padding: 24 }}>
                <H3>Mixing {brand.name} with other bottles?</H3>
                <Text>Design a holder with a different size on each row.</Text>
                <ButtonLink to={`/design?d=${first.hole}`} $variant="secondary">
                  Design your own
                </ButtonLink>
              </CardBody>
            </Card>
          </Grid>
        </Section>

        <Two style={{ marginTop: 8 }}>
          <Card>
            <CardBody>
              <H3>Other bottles that share the {holes.join(" / ")} mm size</H3>
              <ChipRow>
                {sameSize.slice(0, 12).map((b) => (
                  <ChipLink key={bottleId(b)} to={`/fits/${brandSlug(b.brand)}`}>
                    {bottleLabel(b)}
                  </ChipLink>
                ))}
                {holes.map((h) => (
                  <ChipLink key={h} to={`/fits/${h}mm`}>
                    All {h} mm bottles
                  </ChipLink>
                ))}
              </ChipRow>
              <Muted>Mixed collection? Every bottle here fits the same holder.</Muted>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <H3>How we measure</H3>
              <Text>
                Calipers across the widest point of the base, rounded up to the nearest millimetre, plus 1 mm for the hole. Have a different {brand.name} bottle?{" "}
                <InlineLink to="/guides/how-to-measure">Measure it yourself</InlineLink> and pick the size on any holder.
              </Text>
            </CardBody>
          </Card>
        </Two>
      </Container>
    </>
  );
}

export default function Fits() {
  const { slug } = useParams();
  const sizeMatch = slug.match(/^(\d{1,2})mm$/);
  if (sizeMatch) {
    const hole = Number(sizeMatch[1]);
    return holeSizes().includes(hole) ? <SizePage hole={hole} /> : <NotFound />;
  }
  const brand = brandBySlug(slug);
  return brand ? <BrandPage brand={brand} /> : <NotFound />;
}
