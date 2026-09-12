import styled from "styled-components";
import { Link } from "react-router-dom";
import Seo, { breadcrumbLd } from "../Seo";
import BottleSearch from "../BottleSearch";
import { Container, Section, H1, H2, H3, Lead, Text, Grid, Card, CardBody, Placeholder, ButtonLink, ChipRow, Breadcrumbs, InlineLink } from "../ui";

const Steps = styled.ol`
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  counter-reset: step;
  @media (max-width: ${({ theme }) => theme.breakpoints.phone}) {
    grid-template-columns: 1fr;
  }
  li {
    counter-increment: step;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  li h3::before {
    content: counter(step) ". ";
    color: ${({ theme }) => theme.colors.highlightSecondary};
  }
`;

const Rule = styled.div`
  padding: 18px 20px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.highlightPrimary};
  background: ${({ theme }) => theme.colors.surface};
  font-size: 18px;
  color: ${({ theme }) => theme.colors.headerPrimary};
  strong {
    color: ${({ theme }) => theme.colors.highlightSecondary};
  }
`;

export default function Measure() {
  const path = "/guides/how-to-measure";
  return (
    <>
      <Seo
        title="How to measure a bottle for a holder"
        description="Trace the base, measure the width to the nearest millimetre, add 1 mm. A 30-second guide to choosing the right hole size for perfume, cologne and makeup bottles."
        path={path}
        jsonLd={[
          breadcrumbLd([{ name: "How to measure", path }]),
          {
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: "How to measure a bottle for a HolderForge holder",
            totalTime: "PT1M",
            step: [
              { "@type": "HowToStep", name: "Trace the base", text: "Stand the bottle on a sheet of paper and trace around the base with a pencil." },
              { "@type": "HowToStep", name: "Measure the trace", text: "Measure the widest part of the trace with a ruler, to the nearest millimetre." },
              { "@type": "HowToStep", name: "Add 1 mm", text: "Choose the hole size 1 mm larger than the measurement." },
            ],
          },
        ]}
      />
      <Container>
        <Breadcrumbs aria-label="Breadcrumb">
          <Link to="/">Home</Link> <span>/</span> <span>How to measure</span>
        </Breadcrumbs>
        <Section style={{ paddingTop: 20 }}>
          <H1>How to measure your bottle</H1>
          <Lead>
            Before you measure: we may already have. <InlineLink to="/find">Search the brand</InlineLink> and the size is filled in for you.
          </Lead>
          <BottleSearch wide />
        </Section>
        <Section style={{ paddingTop: 0 }}>
          <Steps>
            <li>
              <Placeholder label="Photo: bottle standing on paper, pencil tracing the base" ratio="4 / 3" />
              <H3>Trace the base</H3>
              <Text>Stand the bottle on a sheet of paper and trace around the bottom with a pencil held upright.</Text>
            </li>
            <li>
              <Placeholder label="Photo: ruler across the traced circle" ratio="4 / 3" />
              <H3>Measure the trace</H3>
              <Text>Measure the widest part of the trace with a ruler, to the nearest millimetre. Calipers work too, straight on the bottle.</Text>
            </li>
            <li>
              <Placeholder label="Photo: bottle sliding into a hole with a little clearance" ratio="4 / 3" />
              <H3>Add 1 mm</H3>
              <Text>Pick the hole size 1 mm larger than what you measured. That clearance lets the bottle slide in and out without scuffing the label.</Text>
            </li>
          </Steps>
          <Rule>
            Measured <strong>18 mm</strong>? Choose <strong>19 mm</strong> holes.
          </Rule>
        </Section>
        <Section style={{ paddingTop: 0 }}>
          <H2>Common mistakes</H2>
          <Grid $cols={3}>
            <Card>
              <CardBody>
                <H3>Measuring the cap</H3>
                <Text>Caps are often wider than the bottle. Measure the base, the part that sits in the hole.</Text>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <H3>Rounding down</H3>
                <Text>Between two millimetre marks? Round up, then add 1. A hole that's slightly big is fine; one that's slightly small doesn't fit.</Text>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <H3>Square tubes</H3>
                <Text>Measure the widest side. A round hole that size works; for a flush fit, the designer can make square holes.</Text>
              </CardBody>
            </Card>
          </Grid>
        </Section>
        <Section style={{ paddingTop: 0 }}>
          <H2>Got your number?</H2>
          <ChipRow>
            <ButtonLink to="/shop">Pick a holder and choose the size</ButtonLink>
            <ButtonLink to="/design" $variant="secondary">
              Design a custom holder
            </ButtonLink>
          </ChipRow>
        </Section>
      </Container>
    </>
  );
}
