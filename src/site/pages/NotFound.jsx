import { Helmet } from "react-helmet";
import { Container, Section, H1, Lead, ChipRow, ButtonLink } from "../ui";

export default function NotFound() {
  return (
    <>
      <Helmet>
        <title>Page not found | HolderForge</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <Container>
        <Section style={{ paddingTop: 48 }}>
          <H1>That page doesn't exist</H1>
          <Lead>Try searching for your bottle, or start from the shop.</Lead>
          <ChipRow>
            <ButtonLink to="/find/">Find your bottle</ButtonLink>
            <ButtonLink to="/shop/" $variant="secondary">
              Shop
            </ButtonLink>
          </ChipRow>
        </Section>
      </Container>
    </>
  );
}
