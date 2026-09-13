# Holder renders

Every picture of a holder on the site is drawn by one renderer from the
designer's own dimensions. Do not draw holders any other way (no hand-made
SVGs, no copied geometry code): add a job or drop in the component.

## Pieces

| File | Role |
|---|---|
| `src/model/ModelCalculator.js` | Tier heights, hole depths, spacing. Shared with the designer, so a render is the print. `minimumFootprint(hole)` gives the smallest width/depth. |
| `src/render/holderConfig.js` | `holderConfig({ hole, holesPerRow, rows, bottleHeight, shape })` builds a full designer config for a uniform holder. No three.js import, safe anywhere. |
| `src/render/holderScene.js` | three.js scene: geometry, materials, bottles, lights, camera presets (`VIEWS`), and `createViewer(canvas, opts)` with `setColor`, `setView`, `setSpin`, `attachDrag`. |
| `src/site/HolderCanvas.jsx` | React wrapper. Lazy-loads the scene module on mount; shows `poster` until WebGL is ready and on the server. |
| `scripts/render/jobs.mjs` | List of static PNGs to produce. |
| `scripts/render/render-images.mjs` | Builds a tiny page around the scene module, screenshots each job with headless Chrome, writes `public/images/renders/`. |

## Live canvas on a page

```jsx
import HolderCanvas from "../HolderCanvas";
import { holderConfig } from "../../render/holderConfig";

<HolderCanvas
  config={holderConfig({ hole: 19 })}
  color="#d9a08a"
  bottles={{ diameter: 18, height: 92 }}   // or false
  view="product"                            // hero | product | card | { yaw, elev, distance, lookY }
  spin                                      // turntable; drag always works
  poster="/images/renders/hero.png"         // shown until ready, and as the no-JS image
  alt="..."
/>
```

Changing `color` re-tints without rebuilding; changing `config` or `bottles`
rebuilds the scene. Used by: home hero (`Home.jsx`), product gallery "3D with
your bottles" tab (`Product.jsx`).

## Static PNG

Add an entry to `scripts/render/jobs.mjs`, then:

```
node scripts/render/render-images.mjs            # everything
node scripts/render/render-images.mjs hero.png   # jobs whose name contains "hero.png"
```

Needs Google Chrome locally (`CHROME=` overrides the path). Amplify's build
image has no browser, so images are committed, not built on deploy. Current
jobs: the hero at 2x, and one `card` view per product per colour, which
`productImage()` in `src/catalog/index.js` serves wherever a photo is missing.

## Camera presets

`VIEWS` in `holderScene.js`. Distances are multiples of the holder's larger
footprint dimension so a 12 mm and a 25 mm holder frame the same. `hero` is
the angle chosen for the home page (front tier facing left, seen from the
right); keep it unless the home page changes.
