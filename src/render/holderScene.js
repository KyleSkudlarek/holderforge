// Shared holder renderer. Every picture of a holder on the site comes from
// here: live canvases (src/site/HolderCanvas.jsx) and the static PNGs written
// by scripts/render/render-images.mjs. Geometry is derived from the same
// ModelCalculator the designer uses, so a render always matches the print.
//
// Entry points:
//   holderConfig({ hole, holesPerRow, rows, bottleHeight })  -> full config
//     (also exported from ./holderConfig without pulling in three.js)
//   createViewer(canvas, { config, color, bottles, view, style }) -> viewer
//     viewer.setColor(hex) | setBottles(spec | false) | setView(name, animate) | setSpin(bool)
//     viewer.render() | viewer.dispose()
//   VIEWS: named camera presets (yaw/elevation in radians, distance relative
//     to the holder's footprint so different sizes frame the same way).
//
// Coordinates: three.js Y up. The holder's front (lowest tier) faces +Z.
import * as THREE from "three";
import ModelCalculator from "../model/ModelCalculator";
import { holderConfig } from "./holderConfig";

export { holderConfig };

export const VIEWS = {
  // Home page hero ("A2" in the angle review): front tier faces left, seen from the right.
  hero: { yaw: 0.62, elev: 0.55, distance: 2.63, lookY: 0.45 },
  // Same hero with bottles standing in it: further back and higher so they fit.
  heroLoaded: { yaw: 0.62, elev: 0.42, distance: 4.1, lookY: 1.25 },
  // Product gallery, with bottles.
  product: { yaw: 0.62, elev: 0.4, distance: 4.3, lookY: 1.2 },
  // Catalog card: nearly head-on, compact, empty.
  card: { yaw: 0.35, elev: 0.5, distance: 2.7, lookY: 0.45 },
};

// Hole centres and per-tier dimensions for a config, in holder coordinates.
export function holderLayout(config) {
  const calc = new ModelCalculator(config).getCalculatedModelDimensions();
  const rows = config.rows;
  const tiers = [];
  let y = 0;
  for (let r = 1; r <= rows; r++) {
    const height = calc[`tier_${r}_extrusion_distance`];
    const rowDepth = calc[`row_${r}_depth`];
    const zFront = config.model_depth / 2 - (r - 1) * rowDepth;
    const holes = [];
    const x0 = -config.model_width / 2 + calc[`row_${r}_hole_horizontal_constraint`];
    const step = config[`row_${r}_hole_diameter`] + calc[`row_${r}_inner_gap`];
    const z = zFront - calc[`row_${r}_hole_vertical_constraint`];
    for (let i = 0; i < config.number_holes_per_row; i++) {
      holes.push({ x: x0 + i * step, z, diameter: config[`row_${r}_hole_diameter`], shape: config[`row_${r}_hole_shape`] });
    }
    tiers.push({
      row: r,
      y0: y,
      height,
      zFront,
      zBack: -config.model_depth / 2,
      holeDepth: Math.min(calc[`row_${r}_hole_height`], height),
      holes,
    });
    y += height;
  }
  return { tiers, height: y, width: config.model_width, depth: config.model_depth, chamfer: config.model_chamfer };
}

// Rounded rectangle in shape space; shape y maps to world -z after rotateX(-90deg).
function roundedRect(x0, y0, x1, y1, r) {
  const s = new THREE.Shape();
  s.moveTo(x0 + r, y0);
  s.lineTo(x1 - r, y0);
  s.absarc(x1 - r, y0 + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x1, y1 - r);
  s.absarc(x1 - r, y1 - r, r, 0, Math.PI / 2, false);
  s.lineTo(x0 + r, y1);
  s.absarc(x0 + r, y1 - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x0, y0 + r);
  s.absarc(x0 + r, y0 + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

function slabGeometry(layout, tier, y0, height, holes) {
  const shape = roundedRect(-layout.width / 2, -tier.zFront, layout.width / 2, -tier.zBack, layout.chamfer);
  for (const h of holes) {
    const p = new THREE.Path();
    if (h.shape === "square") {
      const r = h.diameter / 2;
      p.moveTo(h.x - r, -h.z - r);
      p.lineTo(h.x - r, -h.z + r);
      p.lineTo(h.x + r, -h.z + r);
      p.lineTo(h.x + r, -h.z - r);
      p.closePath();
    } else {
      p.absarc(h.x, -h.z, h.diameter / 2, 0, Math.PI * 2, true);
    }
    shape.holes.push(p);
  }
  const geo = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false, curveSegments: 24 });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, y0, 0);
  return geo;
}

// Solid slabs that make up the holder. Holes are blind: a solid floor slab
// sits under the perforated top slab of each tier.
export function holderGeometries(config) {
  const layout = holderLayout(config);
  const parts = [];
  for (const tier of layout.tiers) {
    const floor = tier.height - tier.holeDepth;
    if (floor > 0) parts.push(slabGeometry(layout, tier, tier.y0, floor, []));
    parts.push(slabGeometry(layout, tier, tier.y0 + floor, tier.holeDepth, tier.holes));
  }
  return { parts, layout };
}

function holderMaterial(color, style) {
  return style === "flat"
    ? new THREE.MeshLambertMaterial({ color })
    : new THREE.MeshStandardMaterial({ color, roughness: 0.42, metalness: 0.35 });
}

// A generic cosmetic tube: straight translucent blue body with a flush
// slate cover cap, so it reads as a decant, a travel spray or a lipstick.
// `diameter` and `height` in mm; the group's origin is the bottle's base.
export const BOTTLE_BODY = "#9dbde8";
export const BOTTLE_CAP = "#5b7fb5";
const CAP_SHARE = 0.32; // cap height as a share of the bottle height

export function bottleGroup({ diameter, height }, style) {
  const r = diameter / 2;
  const flat = style === "flat";
  const capH = height * CAP_SHARE;
  const bodyH = height - capH;
  const body = flat
    ? new THREE.MeshLambertMaterial({ color: BOTTLE_BODY })
    : new THREE.MeshPhysicalMaterial({ color: BOTTLE_BODY, roughness: 0.15, metalness: 0, transparent: true, opacity: 0.55, clearcoat: 1, clearcoatRoughness: 0.1 });
  const cap = flat ? new THREE.MeshLambertMaterial({ color: BOTTLE_CAP }) : new THREE.MeshStandardMaterial({ color: BOTTLE_CAP, roughness: 0.45, metalness: 0.2 });
  const g = new THREE.Group();
  const bodyMesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, bodyH, 40), body);
  bodyMesh.position.y = bodyH / 2;
  bodyMesh.renderOrder = 2;
  const capMesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, capH, 40), cap);
  capMesh.position.y = bodyH + capH / 2;
  capMesh.castShadow = !flat;
  g.add(bodyMesh, capMesh);
  return g;
}

// Scene with the holder, optional bottles, lights and a shadow-catching ground.
//   color:   hex string
//   bottles: false | { diameter, height }  (one bottle per hole)
//   style:   "studio" (default) | "flat"
//   shadowMap: shadow map resolution (2048 default; 1024 is fine below ~800 px)
export function createHolderScene({ config, color = "#d9a08a", bottles = false, style = "studio", shadowMap = 2048 }) {
  const scene = new THREE.Scene();
  const { parts, layout } = holderGeometries(config);
  const material = holderMaterial(color, style);
  const holder = new THREE.Group();
  for (const geo of parts) {
    const mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = style !== "flat";
    mesh.receiveShadow = style !== "flat";
    holder.add(mesh);
    if (style === "flat") holder.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 28), new THREE.LineBasicMaterial({ color: 0x2a2a2a })));
  }
  // Holder and bottles share a rig that the viewer turns; lights, ground and
  // camera stay fixed so shading and shadow behave like a real turntable.
  const rig = new THREE.Group();
  rig.add(holder);
  scene.add(rig);

  const bottleMeshes = new THREE.Group();
  rig.add(bottleMeshes);
  const setBottles = (spec) => {
    bottleMeshes.clear();
    if (!spec) return;
    for (const tier of layout.tiers) {
      for (const h of tier.holes) {
        const b = bottleGroup({ diameter: spec.diameter ?? h.diameter - 1, height: spec.height ?? 90 }, style);
        b.position.set(h.x, tier.y0 + tier.height - tier.holeDepth + 0.5, h.z);
        bottleMeshes.add(b);
      }
    }
  };
  setBottles(bottles);

  if (style === "flat") {
    scene.add(new THREE.HemisphereLight(0xffffff, 0xbbbbbb, 1.6));
    const d = new THREE.DirectionalLight(0xffffff, 1.2);
    d.position.set(100, 200, 150);
    scene.add(d);
  } else {
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200), new THREE.ShadowMaterial({ opacity: 0.16 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    scene.add(ground);
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(90, 320, 130);
    key.castShadow = true;
    key.shadow.mapSize.set(shadowMap, shadowMap);
    const reach = Math.max(layout.width, layout.depth) * 1.6;
    key.shadow.camera.left = -reach;
    key.shadow.camera.right = reach;
    key.shadow.camera.top = reach;
    key.shadow.camera.bottom = -reach;
    key.shadow.camera.near = 10;
    key.shadow.camera.far = 900;
    key.shadow.radius = 4;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xdfe8ff, 0.7);
    fill.position.set(-200, 120, -80);
    scene.add(fill);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x9a9488, 0.9));
  }

  return {
    scene,
    rig,
    layout,
    setColor: (hex) => material.color.set(hex),
    setBottles,
    dispose: () => {
      for (const geo of parts) geo.dispose();
      material.dispose();
    },
  };
}

// Canvas-bound viewer. Renders on demand; `setSpin(true)` starts a turntable
// loop, `attachDrag()` lets the viewer be spun by pointer. Turning rotates the
// holder rig under fixed lights; the camera only moves through `setView`.
export function createViewer(canvas, { config, color, bottles, style, view = "hero", pixelRatio, transparent = true, shadowMap }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: transparent, preserveDrawingBuffer: true });
  renderer.setPixelRatio(pixelRatio ?? Math.min(globalThis.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = style !== "flat";
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = style === "flat" ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const holder = createHolderScene({ config, color, bottles, style, shadowMap: shadowMap ?? (canvas.width > 1200 ? 2048 : 1024) });
  const camera = new THREE.PerspectiveCamera(28, 4 / 3, 1, 4000);
  const size = Math.max(holder.layout.width, holder.layout.depth);
  // cam = current camera parameters, target = where an animated setView is heading.
  const cam = { yaw: 0, elev: 0.5, distance: size * 2.6, lookY: holder.layout.height * 0.45 };
  const target = { ...cam };
  const state = { turn: 0, spinning: false, animating: false, raf: 0, disposed: false };

  const resolve = (v) => {
    const preset = typeof v === "string" ? VIEWS[v] : v;
    if (!preset) return null;
    return {
      yaw: preset.yaw ?? target.yaw,
      elev: preset.elev ?? target.elev,
      distance: preset.distance ? preset.distance * size : target.distance,
      lookY: preset.lookY !== undefined ? preset.lookY * holder.layout.height : target.lookY,
    };
  };
  const setView = (v, animate = false) => {
    const next = resolve(v);
    if (!next) return;
    Object.assign(target, next);
    if (!animate) Object.assign(cam, next);
    else state.animating = true;
  };
  setView(view);

  const fit = () => {
    const w = canvas.clientWidth || canvas.width;
    const h = canvas.clientHeight || canvas.height;
    const target = Math.floor(w * renderer.getPixelRatio());
    if (canvas.width !== target || canvas.height !== Math.floor(h * renderer.getPixelRatio())) {
      renderer.setSize(w, h, false);
    }
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };

  const render = () => {
    if (state.disposed) return;
    fit();
    holder.rig.rotation.y = state.turn;
    camera.position.set(
      Math.sin(cam.yaw) * Math.cos(cam.elev) * cam.distance,
      cam.lookY + Math.sin(cam.elev) * cam.distance,
      Math.cos(cam.yaw) * Math.cos(cam.elev) * cam.distance
    );
    camera.lookAt(0, cam.lookY, 0);
    renderer.render(holder.scene, camera);
  };

  // Runs while spinning or easing toward a new view, then stops itself.
  const loop = () => {
    state.raf = 0;
    if (state.disposed) return;
    if (state.spinning) state.turn += 0.004;
    if (state.animating) {
      let remaining = 0;
      for (const k of ["yaw", "elev", "distance", "lookY"]) {
        cam[k] += (target[k] - cam[k]) * 0.14;
        remaining = Math.max(remaining, Math.abs(target[k] - cam[k]) / (Math.abs(target[k]) || 1));
      }
      if (remaining < 0.002) {
        Object.assign(cam, target);
        state.animating = false;
      }
    }
    render();
    if (state.spinning || state.animating) state.raf = requestAnimationFrame(loop);
  };
  const wake = () => {
    if (!state.raf) state.raf = requestAnimationFrame(loop);
  };

  const setSpin = (on) => {
    state.spinning = on;
    if (on) wake();
  };

  const attachDrag = () => {
    let dragging = false;
    let lastX = 0;
    const down = (e) => {
      dragging = true;
      lastX = e.clientX;
      canvas.setPointerCapture(e.pointerId);
    };
    const move = (e) => {
      if (!dragging) return;
      state.turn += (e.clientX - lastX) * 0.01;
      lastX = e.clientX;
      if (!state.raf) render();
    };
    const up = () => {
      dragging = false;
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    canvas.style.cursor = "grab";
    canvas.style.touchAction = "pan-y";
    return () => {
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
    };
  };

  return {
    render,
    // setView(name | preset, animate): animate eases the camera over ~0.5 s.
    setView: (v, animate = false) => {
      setView(v, animate);
      if (animate) wake();
      else if (!state.raf) render();
    },
    setColor: (hex) => {
      holder.setColor(hex);
      if (!state.raf) render();
    },
    setBottles: (spec) => {
      holder.setBottles(spec);
      if (!state.raf) render();
    },
    setSpin,
    attachDrag,
    dispose: () => {
      state.disposed = true;
      if (state.raf) cancelAnimationFrame(state.raf);
      holder.dispose();
      renderer.dispose();
    },
  };
}
