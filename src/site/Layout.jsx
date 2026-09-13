import styled, { createGlobalStyle } from "styled-components";
import { Helmet } from "react-helmet";
import { Link, NavLink, Outlet } from "react-router-dom";
import { Container } from "./ui";

// The catalog runs light while index.css (shared with the designer) is dark.
const SiteGlobal = createGlobalStyle`
  :root {
    color-scheme: light;
  }
  body {
    background: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.headerSecondary};
  }
`;

const Header = styled.header`
  background: ${({ theme }) => theme.colors.background};
  border-bottom: 1px solid ${({ theme }) => theme.colors.outline};
`;

const HeaderRow = styled(Container)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 64px;
  flex-wrap: wrap;
  padding-top: 8px;
  padding-bottom: 8px;
`;

const Logo = styled(Link)`
  color: ${({ theme }) => theme.colors.headerLogo};
  font-size: 26px;
  font-weight: 700;
  text-decoration: none;
  letter-spacing: -0.01em;
`;

const Nav = styled.nav`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  a {
    color: ${({ theme }) => theme.colors.headerSecondary};
    text-decoration: none;
    font-size: 15px;
    font-weight: 500;
    padding: 8px 12px;
    border-radius: 6px;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    box-sizing: border-box;
  }
  a:hover {
    color: ${({ theme }) => theme.colors.headerPrimary};
    background: ${({ theme }) => theme.colors.surface};
  }
  a.active {
    color: ${({ theme }) => theme.colors.headerPrimary};
    box-shadow: inset 0 -2px 0 ${({ theme }) => theme.colors.highlightPrimary};
    border-radius: 0;
  }
  @media (max-width: ${({ theme }) => theme.breakpoints.phone}) {
    width: 100%;
    justify-content: space-between;
    a {
      padding: 8px 6px;
      font-size: 14px;
    }
  }
`;

const Main = styled.main`
  min-height: 60vh;
`;

const Footer = styled.footer`
  border-top: 1px solid ${({ theme }) => theme.colors.outline};
  margin-top: 48px;
  padding: 32px 0;
  color: ${({ theme }) => theme.colors.muted};
  font-size: 14px;
`;

const FooterRow = styled(Container)`
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  a {
    color: ${({ theme }) => theme.colors.headerSecondary};
    text-decoration: none;
    font-weight: 400;
  }
  a:hover {
    color: ${({ theme }) => theme.colors.headerPrimary};
  }
`;

const FooterLinks = styled.div`
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
`;

export default function Layout() {
  return (
    <>
      <SiteGlobal />
      <Helmet>
        <meta name="theme-color" content="#f4f3ef" />
      </Helmet>
      <Header>
        <HeaderRow>
          <Logo to="/">HolderForge</Logo>
          <Nav aria-label="Primary">
            <NavLink to="/shop/">Shop</NavLink>
            <NavLink to="/find/">Find your bottle</NavLink>
            <NavLink to="/design/">Design your own</NavLink>
            <NavLink to="/guides/how-to-measure/">How to measure</NavLink>
          </Nav>
        </HeaderRow>
      </Header>
      <Main>
        <Outlet />
      </Main>
      <Footer>
        <FooterRow>
          <div>Made to order in Austin, TX. Ships USPS within the US.</div>
          <FooterLinks>
            <Link to="/fits/">All bottles A-Z</Link>
            <Link to="/guides/how-to-measure/">How to measure</Link>
            <Link to="/design/">Custom designer</Link>
            <a href="https://www.etsy.com/shop/SkudsWorkshop" rel="noopener">Etsy shop</a>
          </FooterLinks>
        </FooterRow>
      </Footer>
    </>
  );
}
