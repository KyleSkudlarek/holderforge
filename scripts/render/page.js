// Headless render page driven by render-images.mjs: fetches the job list from
// the local server, draws each job with the shared renderer into one canvas,
// and POSTs the PNG back. One browser, one page, all jobs.
import { createViewer, holderConfig } from "../../src/render/holderScene";

const canvas = document.getElementById("c");

async function renderJob(job) {
  const scale = job.scale || 1;
  canvas.width = job.width * scale;
  canvas.height = job.height * scale;
  canvas.style.width = `${job.width}px`;
  canvas.style.height = `${job.height}px`;
  const config = holderConfig({
    hole: job.hole,
    holesPerRow: job.holesPerRow ?? 5,
    rows: job.rows ?? 3,
    bottleHeight: job.bottleHeight ?? 120,
    shape: job.shape || "circle",
  });
  const viewer = createViewer(canvas, {
    config,
    color: job.colour || "#b87333",
    bottles: job.bottles || false,
    view: job.view || "hero",
    style: job.style || "studio",
    pixelRatio: scale,
  });
  viewer.render();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  viewer.dispose();
  const res = await fetch(`/out/${job.out}`, { method: "PUT", body: blob });
  if (!res.ok) throw new Error(`upload failed for ${job.out}`);
}

(async () => {
  const jobs = await (await fetch("/jobs")).json();
  for (const job of jobs) await renderJob(job);
  await fetch("/done", { method: "POST" });
  document.title = "done";
})().catch(async (err) => {
  await fetch("/done", { method: "POST", body: String(err && err.stack ? err.stack : err) });
});
