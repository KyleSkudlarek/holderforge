// Server entry for scripts/prerender.mjs: renders one catalog route to static
// HTML plus its head tags. Not used in the browser.
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { ServerStyleSheet } from "styled-components";
import { Helmet } from "react-helmet";
import App from "./App";
import { staticRoutes } from "./catalog";

export { staticRoutes };

export function render(url) {
  const sheet = new ServerStyleSheet();
  try {
    const html = renderToString(
      sheet.collectStyles(
        <StaticRouter location={url}>
          <App />
        </StaticRouter>
      )
    );
    const helmet = Helmet.renderStatic();
    const head = [helmet.title.toString(), helmet.meta.toString(), helmet.link.toString(), helmet.script.toString(), sheet.getStyleTags()]
      .filter(Boolean)
      .join("\n");
    return { html, head };
  } finally {
    sheet.seal();
  }
}
