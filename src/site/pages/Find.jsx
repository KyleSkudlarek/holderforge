import styled from "styled-components";
import { Link, useSearchParams } from "react-router-dom";
import Seo from "../Seo";
import BottleSearch from "../BottleSearch";
import { Container, Section, H1, H2, H3, Lead, Text, Muted, Card, CardBody, ChipRow, ChipLink, ButtonLink, Breadcrumbs, InlineLink } from "../ui";
import { search, bottles, bottleTypes, bottleId, bottleLabel, brandSlug, brands, holeSizes, productsForHole, bottlesForHole } from "../../catalog";

const Table = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.outline};
  border-radius: 8px;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.surface};
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 2.2fr 1fr 1fr 2fr;
  gap: 16px;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.outline};
  font-size: 15px;
  color: ${({ theme }) => theme.colors.headerSecondary};
  &:last-child {
    border-bottom: 0;
  }
  a {
    color: ${({ theme }) => theme.colors.headerPrimary};
    text-decoration: none;
  }
  a:hover {
    text-decoration: underline;
  }
  @media (max-width: ${({ theme }) => theme.breakpoints.phone}) {
    grid-template-columns: 1fr 1fr;
    div:nth-child(4) {
      grid-column: 1 / -1;
    }
  }
`;

const Head = styled(Row)`
  background: ${({ theme }) => theme.colors.surfaceRaised};
  color: ${({ theme }) => theme.colors.muted};
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  @media (max-width: ${({ theme }) => theme.breakpoints.phone}) {
    display: none;
  }
`;

const Big = styled.span`
  font-size: 20px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.headerPrimary};
`;

const Two = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  @media (max-width: ${({ theme }) => theme.breakpoints.phone}) {
    grid-template-columns: 1fr;
  }
`;

export default function Find() {
  const [params] = useSearchParams();
  const q = params.get("q") || "";
  const results = q ? search(q, 50) : null;
  const brandCount = new Set(bottles.map((b) => b.brand)).size;

  return (
    <>
      <Seo
        title="Find your bottle: which holder size fits your travel spray or decant"
        description={`Search ${brandCount} measured perfume and cologne bottles, from ScentSplit and DecantX to Tom Ford and YSL, and see the holder size that fits each one.`}
        path="/find"
      />
      <Container>
        <Breadcrumbs aria-label="Breadcrumb">
          <Link to="/">Home</Link> <span>/</span> <span>Find your bottle</span>
        </Breadcrumbs>
        <Section style={{ paddingTop: 20 }}>
          <H1>Find your bottle</H1>
          <Lead>Type the brand. We've measured {brandCount} of them and know the hole size that fits.</Lead>
          <BottleSearch wide large autoFocus initial={q} placeholder='Brand, bottle or size: "ScentSplit", "Tom Ford", "19mm"' />
        </Section>

        {results ? (
          <Section style={{ paddingTop: 0 }}>
            <H2>
              Results for "{q}" <Muted>{results.bottles.length} bottles</Muted>
            </H2>
            {results.sizes.length ? (
              <ChipRow>
                {results.sizes.map((h) => (
                  <ChipLink key={h} to={`/fits/${h}mm/`}>
                    All {h} mm bottles
                  </ChipLink>
                ))}
              </ChipRow>
            ) : null}
            {results.bottles.length ? (
              <Table>
                <Head>
                  <div>Bottle</div>
                  <div>Type</div>
                  <div>Hole size</div>
                  <div>Holders that fit</div>
                </Head>
                {results.bottles.map((b) => (
                  <Row key={bottleId(b)}>
                    <div>
                      <Link to={`/fits/${brandSlug(b.brand)}/`}>
                        <strong>{b.brand}</strong>
                      </Link>
                      <br />
                      <Muted>
                        {b.product}, {b.volume}
                        {b.measured ? `, measured ${b.measured} mm` : ""}
                      </Muted>
                    </div>
                    <div>{bottleTypes[b.type]}</div>
                    <div>
                      <Big>{b.hole} mm</Big>
                    </div>
                    <ChipRow>
                      {productsForHole(b.hole, b.type).map((p) => (
                        <ChipLink key={p.slug} to={`/shop/${p.slug}/?size=${b.hole}&bottle=${bottleId(b)}`}>
                          {p.name}
                        </ChipLink>
                      ))}
                    </ChipRow>
                  </Row>
                ))}
              </Table>
            ) : (
              <Text>No measured bottle matches "{q}" yet.</Text>
            )}
          </Section>
        ) : (
          <Section style={{ paddingTop: 0 }}>
            <H2>Browse by size</H2>
            <ChipRow>
              {holeSizes().map((h) => (
                <ChipLink key={h} to={`/fits/${h}mm/`} title={`${bottlesForHole(h).length} bottles`}>
                  {h} mm
                </ChipLink>
              ))}
            </ChipRow>
            <H2 style={{ marginTop: 16 }}>Brands measured so far</H2>
            <ChipRow>
              {brands().map((b) => (
                <ChipLink key={b.slug} to={`/fits/${b.slug}/`}>
                  {b.name}
                </ChipLink>
              ))}
            </ChipRow>
          </Section>
        )}

        <Two>
          <Card style={{ borderStyle: "dashed" }}>
            <CardBody>
              <H3>Can't find your bottle?</H3>
              <Text>
                Measure it in 30 seconds: trace the base, read the width, pick the size 1 mm larger. Or tell us the brand and we'll measure it and add it here.
              </Text>
              <ChipRow>
                <ButtonLink to="/guides/how-to-measure/" $variant="secondary">
                  How to measure
                </ButtonLink>
                <ButtonLink to="/design/" $variant="secondary">
                  Design a custom size
                </ButtonLink>
              </ChipRow>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <H3>How we measure</H3>
              <Text>
                Calipers across the widest point of the base, rounded up to the nearest millimetre, then 1 mm added for the hole so the bottle slides in without scratching the label. Full list on the{" "}
                <InlineLink to="/fits/">bottles A-Z page</InlineLink>.
              </Text>
            </CardBody>
          </Card>
        </Two>
      </Container>
    </>
  );
}
