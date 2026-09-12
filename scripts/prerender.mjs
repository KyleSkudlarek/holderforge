// Prerenders every catalog route into dist/<route>/index.html after
// `vite build`, and writes dist/sitemap.xml. The designer (/design) needs
// WebGL, so it gets the empty shell with its own head tags instead of markup.
//
// Amplify serves dist/<route>/index.html for /<route>; anything else falls
// through the SPA rewrite to dist/index.html, which main.jsx detects via the
// data-route stamp and client-renders.
import { build } from "vite";
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const serverDir = join(dist, ".server");
const SITE_URL = "https://holderforge.com";

await build({
  root,
  logLevel: "warn",
  build: { ssr: "src/entry-server.jsx", outDir: serverDir, emptyOutDir: true },
  // Bundle CJS/ESM-dual packages so Node resolves their default exports the
  // way the browser build does.
  ssr: { noExternal: ["styled-components", "react-helmet"] },
});

const { render, staticRoutes } = await import(pathToFileURL(join(serverDir, "entry-server.js")).href);
const template = readFileSync(join(dist, "index.html"), "utf8");
if (!template.includes("<!--app-head-->") || !template.includes('<div id="root"></div>')) {
  throw new Error("index.html is missing the <!--app-head--> marker or the empty #root div");
}

const designerHead = [
  "<title>Custom bottle holder designer | HolderForge</title>",
  '<meta name="description" content="Design a 3D-printed holder for your bottles: set the hole size for each row, preview it in 3D, and order it printed or download the STL." />',
  `<link rel="canonical" href="${SITE_URL}/design" />`,
].join("\n");

const escapeAttr = (s) => s.replace(/"/g, "&quot;");

function pageFor(route) {
  if (route === "/design") return template.replace("<title>HolderForge</title>", "").replace("<!--app-head-->", designerHead);
  const { html, head } = render(route);
  // The template's static <title> is the SPA fallback's; Helmet supplies one.
  return template
    .replace("<title>HolderForge</title>", "")
    .replace("<!--app-head-->", head)
    .replace('<div id="root"></div>', `<div id="root" data-route="${escapeAttr(route)}">${html}</div>`);
}

const routes = staticRoutes();
for (const route of routes) {
  const outFile = route === "/" ? join(dist, "index.html") : join(dist, route.slice(1), "index.html");
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, pageFor(route));
}

const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map((r) => `  <url><loc>${SITE_URL}${r}</loc><lastmod>${today}</lastmod></url>`).join("\n")}
</urlset>
`;
writeFileSync(join(dist, "sitemap.xml"), sitemap);

rmSync(serverDir, { recursive: true, force: true });
console.log(`prerendered ${routes.length} routes`);
