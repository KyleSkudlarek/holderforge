import styled from "styled-components";
import { Link } from "react-router-dom";
import Seo, { breadcrumbLd } from "../Seo";
import BottleSearch from "../BottleSearch";
import { Container, Section, H1, H2, Lead, Muted, ChipRow, ChipLink, Breadcrumbs } from "../ui";
import { brands, holeSizes, bottlesForHole, bottleTypes, bottles } from "../../catalog";

const BrandGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
`;

const BrandRow = styled(Link)`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid ${({ theme }) => theme.colors.outline};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.headerPrimary};
  text-decoration: none;
  &:hover {
    border-color: ${({ theme }) => theme.colors.headerSecondary};
  }
  span:last-child {
    color: ${({ theme }) => theme.colors.muted};
    font-size: 14px;
    white-space: nowrap;
  }
`;

export default function FitsIndex() {
  const list = brands();
  return (
    <>
      <Seo
        title="Every bottle we've measured, A to Z"
        description={`Base measurements and holder hole sizes for ${bottles.length} perfume, cologne and decant bottles across ${list.length} brands.`}
        path="/fits"
        jsonLd={breadcrumbLd([{ name: "Bottles", path: "/fits" }])}
      />
      <Container>
        <Breadcrumbs aria-label="Breadcrumb">
          <Link to="/">Home</Link> <span>/</span> <span>Bottles</span>
        </Breadcrumbs>
        <Section style={{ paddingTop: 20 }}>
          <H1>Every bottle we've measured</H1>
          <Lead>
            {bottles.length} bottles from {list.length} brands, each with the hole size that fits it. Missing yours? Search anyway; brands are added as they're measured.
          </Lead>
          <BottleSearch wide />
        </Section>
        <Section style={{ paddingTop: 0 }}>
          <H2>By size</H2>
          <ChipRow>
            {holeSizes().map((h) => (
              <ChipLink key={h} to={`/fits/${h}mm/`}>
                {h} mm <Muted style={{ marginLeft: 6 }}>{bottlesForHole(h).length}</Muted>
              </ChipLink>
            ))}
          </ChipRow>
        </Section>
        <Section style={{ paddingTop: 0 }}>
          <H2>By brand</H2>
          <BrandGrid>
            {list.map((b) => (
              <BrandRow key={b.slug} to={`/fits/${b.slug}/`}>
                <span>{b.name}</span>
                <span>
                  {[...new Set(b.bottles.map((x) => x.hole))].sort((x, y) => x - y).join(" / ")} mm
                  {b.bottles.length > 1 ? ` · ${b.bottles.length} bottles` : ` · ${bottleTypes[b.bottles[0].type].toLowerCase()}`}
                </span>
              </BrandRow>
            ))}
          </BrandGrid>
        </Section>
      </Container>
    </>
  );
}
