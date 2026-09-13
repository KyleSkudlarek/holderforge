export const theme = {
    colors: {
      background: "#272727",
      headerLogo: "#3474F1",
      headerPrimary: "#FAFBFC",
      headerSecondary: "#DFDFDF",
      highlightPrimary: "#3474F1",
      highlightSecondary: "#4D9AF1",
      black: "#1c1c1c",
      outline: "#3c3c3c",
      // Storefront additions
      surface: "#1c1c1c",
      surfaceRaised: "#2f2f2f",
      muted: "#a3a3a3",
      success: "#7bd88f",
      warning: "#f0c060",
      shadow: "rgba(0, 0, 0, 0.4)",
      hatch: "rgba(255, 255, 255, 0.035)",
    },
    breakpoints: {
      phone: "600px",
      tablet: "900px",
      laptop: "1200px",
    },
  };

// Light scheme for the catalog pages (home, shop, product, fits, guides). The
// designer keeps the dark `theme`. Same token names so components work under
// either: headerPrimary = primary text, headerSecondary = body text.
export const lightTheme = {
    colors: {
      background: "#f4f3ef",
      headerLogo: "#3474F1",
      headerPrimary: "#1f1f1f",
      headerSecondary: "#3d3d3d",
      highlightPrimary: "#3474F1",
      highlightSecondary: "#2a5fc9",
      black: "#ffffff",
      outline: "#d9d6ce",
      surface: "#ffffff",
      surfaceRaised: "#e9e7e1",
      muted: "#6b6b6b",
      success: "#2b7a3b",
      warning: "#b8860b",
      shadow: "rgba(30, 30, 30, 0.12)",
      hatch: "rgba(0, 0, 0, 0.045)",
    },
    breakpoints: {
      phone: "600px",
      tablet: "900px",
      laptop: "1200px",
    },
  };
