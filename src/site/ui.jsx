import styled, { css } from "styled-components";
import { Link } from "react-router-dom";

export const Container = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  box-sizing: border-box;
  @media (max-width: ${({ theme }) => theme.breakpoints.phone}) {
    padding: 0 16px;
  }
`;

export const Section = styled.section`
  padding: 40px 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  @media (max-width: ${({ theme }) => theme.breakpoints.phone}) {
    padding: 28px 0;
  }
`;

export const H1 = styled.h1`
  margin: 0;
  font-size: 40px;
  line-height: 1.1;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.headerPrimary};
  text-wrap: balance;
  @media (max-width: ${({ theme }) => theme.breakpoints.phone}) {
    font-size: 30px;
  }
`;

export const H2 = styled.h2`
  margin: 0;
  font-size: 24px;
  line-height: 1.2;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.headerPrimary};
`;

export const H3 = styled.h3`
  margin: 0;
  font-size: 18px;
  line-height: 1.3;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.headerPrimary};
`;

export const Lead = styled.p`
  margin: 0;
  font-size: 18px;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.headerSecondary};
  max-width: 680px;
  text-wrap: pretty;
`;

export const Text = styled.p`
  margin: 0;
  font-size: 15px;
  line-height: 1.55;
  color: ${({ theme }) => theme.colors.headerSecondary};
  text-wrap: pretty;
`;

export const Muted = styled.span`
  color: ${({ theme }) => theme.colors.muted};
  font-size: 14px;
`;

const buttonStyles = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 600;
  font-family: inherit;
  text-decoration: none;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.2s, border-color 0.2s;
  box-sizing: border-box;
  ${({ $variant, theme }) =>
    $variant === "secondary"
      ? css`
          background: transparent;
          color: ${theme.colors.headerPrimary};
          border-color: ${theme.colors.outline};
          &:hover:not(:disabled) {
            border-color: ${theme.colors.headerSecondary};
          }
        `
      : css`
          background: ${theme.colors.highlightPrimary};
          color: #fff;
          &:hover:not(:disabled) {
            background: ${theme.colors.highlightSecondary};
          }
        `}
  &:disabled {
    opacity: 0.55;
    cursor: default;
  }
`;

export const Button = styled.button`
  ${buttonStyles}
`;

export const ButtonLink = styled(Link)`
  ${buttonStyles}
`;

export const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.outline};
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

export const CardLink = styled(Link)`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.outline};
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  color: inherit;
  text-decoration: none;
  transition: border-color 0.2s;
  &:hover {
    border-color: ${({ theme }) => theme.colors.headerSecondary};
  }
`;

export const CardBody = styled.div`
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(${({ $cols = 3 }) => $cols}, minmax(0, 1fr));
  gap: 20px;
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (max-width: ${({ theme }) => theme.breakpoints.phone}) {
    grid-template-columns: 1fr;
  }
`;

export const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const chipStyles = css`
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid ${({ theme, $active }) => ($active ? theme.colors.highlightPrimary : theme.colors.outline)};
  background: ${({ theme, $active }) => ($active ? theme.colors.highlightPrimary : theme.colors.surface)};
  color: ${({ theme }) => theme.colors.headerPrimary};
  font-size: 14px;
  font-family: inherit;
  text-decoration: none;
  cursor: pointer;
  box-sizing: border-box;
  &:hover {
    border-color: ${({ theme }) => theme.colors.highlightSecondary};
  }
`;

export const Chip = styled.button`
  ${chipStyles}
`;

export const ChipLink = styled(Link)`
  ${chipStyles}
`;

export const Divider = styled.hr`
  border: 0;
  border-top: 1px solid ${({ theme }) => theme.colors.outline};
  margin: 0;
`;

export const Breadcrumbs = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.muted};
  padding-top: 16px;
  a {
    color: ${({ theme }) => theme.colors.muted};
    text-decoration: none;
    font-weight: 400;
  }
  a:hover {
    color: ${({ theme }) => theme.colors.headerPrimary};
  }
`;

export const InlineLink = styled(Link)`
  color: ${({ theme }) => theme.colors.highlightSecondary};
  font-weight: 500;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

// Photo placeholder used until real product photography is added. A tint
// colour turns it into a stand-in for a specific filament colour.
const PlaceholderBox = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: ${({ $ratio }) => $ratio};
  background-color: ${({ theme }) => theme.colors.surfaceRaised};
  background-image: repeating-linear-gradient(135deg, transparent 0 14px, rgba(255, 255, 255, 0.035) 14px 16px);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const Tint = styled.div`
  width: 46%;
  aspect-ratio: 3 / 2;
  border-radius: 6px;
  background: ${({ $tint }) => $tint};
  opacity: 0.85;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
`;

const PlaceholderLabel = styled.span`
  position: absolute;
  left: 10px;
  bottom: 8px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.muted};
`;

export const Placeholder = ({ label, tint, ratio = "4 / 3", style }) => (
  <PlaceholderBox $ratio={ratio} style={style} role="img" aria-label={label}>
    {tint ? <Tint $tint={tint} /> : null}
    {label ? <PlaceholderLabel>{label}</PlaceholderLabel> : null}
  </PlaceholderBox>
);

export const Swatch = styled.button`
  width: ${({ $size = 32 }) => $size}px;
  height: ${({ $size = 32 }) => $size}px;
  border-radius: 50%;
  padding: 0;
  border: 2px solid ${({ theme, $active }) => ($active ? theme.colors.headerPrimary : "transparent")};
  outline: 1px solid ${({ theme }) => theme.colors.outline};
  outline-offset: ${({ $active }) => ($active ? "2px" : "0")};
  background: ${({ $color }) => $color};
  cursor: pointer;
  position: relative;
  flex-shrink: 0;
  ${({ $unavailable }) =>
    $unavailable &&
    css`
      opacity: 0.4;
      &::after {
        content: "";
        position: absolute;
        inset: 45%;
        left: -4px;
        right: -4px;
        height: 2px;
        background: #fff;
        transform: rotate(-45deg);
      }
    `}
`;

export const SwatchDots = ({ colors, max = 4 }) => (
  <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
    {colors.slice(0, max).map((c) => (
      <span
        key={c.id}
        title={c.name}
        style={{ width: 12, height: 12, borderRadius: "50%", background: c.swatch, outline: "1px solid #3c3c3c" }}
      />
    ))}
    {colors.length > max ? <Muted>+{colors.length - max}</Muted> : null}
  </span>
);

export const Notice = styled.div`
  padding: 12px 14px;
  border-radius: 6px;
  border: 1px solid ${({ theme, $tone }) => ($tone === "warning" ? theme.colors.warning : theme.colors.outline)};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.headerSecondary};
  font-size: 14px;
  line-height: 1.5;
`;
