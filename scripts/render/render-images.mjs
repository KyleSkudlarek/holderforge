// Writes the static holder PNGs listed in scripts/render/jobs.mjs to
// public/images/renders/. Builds scripts/render/page.html with Vite (so it
// shares src/render/holderScene.js with the site), serves it locally, and
// opens it once in headless Chrome; the page renders every job into one
// canvas and uploads each PNG back here.
//
//   node scripts/render/render-images.mjs            # all jobs
//   node scripts/render/render-images.mjs hero.png   # jobs whose `out` matches
//   CHROME=/path/to/chrome node scripts/render/render-images.mjs
//   SOFTWARE_GL=1 node scripts/render/render-images.mjs   # no usable GPU (CI, VMs)
//
// Needs Google Chrome; Amplify's build image has none, so run it locally and
// commit the images.
import { build } from "vite";
import { createServer } from "node:http";
import { readFile, mkdir, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { join, dirname, extname, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { jobs } from "./jobs.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const outRoot = join(root, "public", "images", "renders");
const buildDir = join(root, "dist", ".render");
const chrome = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const filter = process.argv[2];
const selected = filter ? jobs.filter((j) => j.out.includes(filter)) : jobs;
if (selected.length === 0) {
  console.error(`no job matches "${filter}"`);
  process.exit(1);
}

await build({
  root: join(root, "scripts", "render"),
  logLevel: "warn",
  build: { outDir: buildDir, emptyOutDir: true, rollupOptions: { input: join(root, "scripts", "render", "page.html") } },
});

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
let written = 0;
let finish;
const done = new Promise((r) => (finish = r));

const server = createServer(async (req, res) => {
  const path = new URL(req.url, "http://x").pathname;
  if (path === "/jobs") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify(selected));
  }
  if (path.startsWith("/out/") && req.method === "PUT") {
    const rel = normalize(decodeURIComponent(path.slice(5)));
    if (rel.startsWith("..")) {
      res.writeHead(400);
      return res.end();
    }
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const file = join(outRoot, rel);
    await mkdir(dirname(file), { recursive: true });
    const body = Buffer.concat(chunks);
    await writeFile(file, body);
    written += 1;
    console.log(`${rel}  ${(body.length / 1024).toFixed(0)} KB`);
    res.writeHead(200);
    return res.end();
  }
  if (path === "/done" && req.method === "POST") {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    res.writeHead(200);
    res.end();
    return finish(Buffer.concat(chunks).toString() || null);
  }
  const file = join(buildDir, path === "/" ? "page.html" : path);
  try {
    const body = await readFile(file);
    res.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;

const profile = join(tmpdir(), `holderforge-render-${process.pid}`);
// The real GPU is several times faster than SwiftShader; keep the software
// path available for machines without one.
const glFlags = process.env.SOFTWARE_GL === "1" ? ["--disable-gpu", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] : [];
const child = spawn(
  chrome,
  [
    "--headless=new",
    ...glFlags,
    `--user-data-dir=${profile}`,
    `http://127.0.0.1:${port}/page.html`,
  ],
  { stdio: "ignore" }
);

const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("render timed out after 120 s")), 120000));
let error = null;
try {
  error = await Promise.race([done, timeout]);
} finally {
  child.kill();
  server.close();
  await rm(buildDir, { recursive: true, force: true });
  await rm(profile, { recursive: true, force: true }).catch(() => {});
}
if (error) {
  console.error(error);
  process.exit(1);
}
console.log(`rendered ${written} image${written === 1 ? "" : "s"}`);
