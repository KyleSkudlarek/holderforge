import { useEffect } from "react";
import styled from "styled-components";
import { useLocation, useNavigate } from "react-router-dom";
import Seo from "../Seo";
import BottleSearch from "../BottleSearch";
import HolderIllustration from "../HolderIllustration";
import ProductCard from "../ProductCard";
import { Container, Section, H1, H2, H3, Lead, Text, Muted, ButtonLink, Card, CardBody, CardLink, Grid, ChipRow, ChipLink, Placeholder, InlineLink } from "../ui";
import { categories, products, bottles, brandSlug, colors } from "../../catalog";

const Hero = styled.div`
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 40px;
  align-items: center;
  padding: 56px 0 24px;
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: 1fr;
    padding-top: 32px;
  }
`;

const HeroText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Actions = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const Illustration = styled.div`
  display: flex;
  justify-content: center;
  svg {
    width: 100%;
    height: auto;
    max-width: 520px;
  }
`;

const Steps = styled.ol`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  counter-reset: step;
  @media (max-width: ${({ theme }) => theme.breakpoints.phone}) {
    grid-template-columns: 1fr;
  }
`;

const Step = styled.li`
  counter-increment: step;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 18px;
  border: 1px solid ${({ theme }) => theme.colors.outline};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.surface};
  &::before {
    content: counter(step);
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.highlightPrimary};
    color: #fff;
    font-weight: 700;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const Compare = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  @media (max-width: ${({ theme }) => theme.breakpoints.phone}) {
    grid-template-columns: 1fr;
  }
`;

const List = styled.ul`
  margin: 0;
  padding-left: 18px;
  color: ${({ theme }) => theme.colors.headerSecondary};
  font-size: 15px;
  line-height: 1.6;
`;

const popularBrands = ["ScentSplit", "DecantX", "TOM FORD", "Jo Malone London", "Yves Saint Laurent", "Glossier", "Maison Margiela", "NEST New York"];

export default function Home() {
  const location = useLocation();
  const navigate = useNavigate();

  // Stripe Checkout still returns to "/?checkout=..."; the designer owns that
  // banner, so forward the flag there.
  useEffect(() => {
    if (new URLSearchParams(location.search).has("checkout")) {
      navigate(`/design${location.search}`, { replace: true });
    }
  }, [location.search, navigate]);

  const brandCount = new Set(bottles.map((b) => b.brand)).size;

  return (
    <>
      <Seo
        title="Holders sized to your perfume, cologne and travel spray bottles"
        description={`3D-printed holders and organizers with holes sized to your bottles. Pick from ${brandCount} measured brands like ScentSplit, DecantX, Tom Ford and YSL, or design a custom size. Made to order in Austin, TX.`}
        path="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "HolderForge",
          url: "https://holderforge.com",
          sameAs: ["https://www.etsy.com/shop/SkudsWorkshop"],
        }}
      />
      <Container>
        <Hero>
          <HeroText>
            <H1>A stand for your bottles, with holes cut to fit them.</H1>
            <Lead>
              Travel sprays, decants and rollerballs roll around drawers and tip over on shelves. A HolderForge holder is a
              3D-printed tray with a snug hole for each bottle, so your collection stands upright with the labels facing out.
            </Lead>
            <Actions>
              <ButtonLink to="/find">Find your bottle</ButtonLink>
              <ButtonLink to="/design" $variant="secondary">Design your own</ButtonLink>
            </Actions>
            <BottleSearch wide />
          </HeroText>
          <Illustration>
            <HolderIllustration holder={colors[0].swatch} />
          </Illustration>
        </Hero>

        <Section>
          <H2>How it works</H2>
          <Steps>
            <Step>
              <H3>Tell us the bottle</H3>
              <Text>
                Search the brand. We have measured {brandCount} of them, so the hole size is already known. Own something we
                haven't measured? <InlineLink to="/guides/how-to-measure">Measure it in 30 seconds</InlineLink>.
              </Text>
            </Step>
            <Step>
              <H3>Pick a colour</H3>
              <Text>Every holder comes in {colors.filter((c) => c.available).length} filament colours, from copper and gunmetal to white and blue.</Text>
            </Step>
            <Step>
              <H3>Printed and shipped</H3>
              <Text>Each holder is printed to order in Austin, TX and ships USPS within a few business days. Wrong size? We swap it.</Text>
            </Step>
          </Steps>
        </Section>

        <Section>
          <H2>What are you holding?</H2>
          <Grid $cols={4}>
            {categories.map((c) => (
              <CardLink key={c.slug} to={`/shop/${c.slug}`}>
                <Placeholder label={c.name} ratio="3 / 2" />
                <CardBody>
                  <H3>{c.name}</H3>
                  <Muted>{c.comingSoon ? "Sizes being measured" : c.short}</Muted>
                </CardBody>
              </CardLink>
            ))}
          </Grid>
        </Section>

        <Section>
          <H2>Popular bottles</H2>
          <ChipRow>
            {popularBrands.map((b) => (
              <ChipLink key={b} to={`/fits/${brandSlug(b)}`}>
                {b}
              </ChipLink>
            ))}
            <ChipLink to="/fits">All {brandCount} brands</ChipLink>
          </ChipRow>
        </Section>

        <Section>
          <H2>Holders</H2>
          <Grid $cols={4}>
            {products.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </Grid>
        </Section>

        <Section>
          <H2>Ready-made or custom?</H2>
          <Compare>
            <Card>
              <CardBody>
                <H3>Shop a ready-made size</H3>
                <List>
                  <li>One hole size per holder, matched to your brand</li>
                  <li>15 slots in three staggered tiers</li>
                  <li>Choose a colour and order in a minute</li>
                </List>
                <div>
                  <ButtonLink to="/shop" $variant="secondary">Browse holders</ButtonLink>
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <H3>Design your own</H3>
                <List>
                  <li>A different hole size on each row for a mixed collection</li>
                  <li>Round or square holes, any diameter from 8 to 40 mm</li>
                  <li>Live 3D preview, and the STL to print it yourself</li>
                </List>
                <div>
                  <ButtonLink to="/design" $variant="secondary">Open the designer</ButtonLink>
                </div>
              </CardBody>
            </Card>
          </Compare>
        </Section>

        <Section>
          <Text>
            Made in the USA by a one-person workshop in Austin, TX from durable PLA. 4.9 stars across 24 reviews on{" "}
            <a href="https://www.etsy.com/shop/SkudsWorkshop" rel="noopener" style={{ color: "#4D9AF1" }}>
              Etsy as SkudsWorkshop
            </a>
            .
          </Text>
        </Section>
      </Container>
    </>
  );
}
