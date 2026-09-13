import { useEffect, useRef, useState } from "react";
import styled from "styled-components";

// Live holder render for catalog pages. three.js and the scene module load
// on mount only, so prerendered HTML and the initial bundle stay light; until
// then (and on the server) the `poster` image is shown.
//
//   config:   designer configuration (see holderConfig in src/render/holderScene.js)
//   color:    hex, changes re-tint without rebuilding
//   bottles:  false | { diameter, height }
//   view:     "hero" | "heroLoaded" | "product" | "card" | { yaw, elev, distance, lookY }
//             changing it after mount eases the camera to the new view
//   spin:     turntable on/off; drag always works
//   poster:   image URL shown before WebGL is ready (and as the no-JS fallback)

const Frame = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: ${({ $ratio }) => $ratio};
  canvas,
  img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
  }
  img {
    object-fit: contain;
  }
  /* The poster is prerendered for crawlers and no-WebGL viewers; once the
     live canvas has drawn, hide it (author display:block would otherwise
     override the hidden attribute). */
  img[hidden] {
    display: none;
  }
`;

export default function HolderCanvas({ config, color, bottles = false, view = "hero", spin = false, poster, alt = "", ratio = "4 / 3", style }) {
  const canvasRef = useRef(null);
  const viewerRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let detach = null;
    import("../render/holderScene").then((mod) => {
      if (cancelled || !canvasRef.current) return;
      const viewer = mod.createViewer(canvasRef.current, { config, color, bottles, view });
      detach = viewer.attachDrag();
      viewer.render();
      viewerRef.current = viewer;
      setReady(true);
    });
    return () => {
      cancelled = true;
      if (detach) detach();
      if (viewerRef.current) {
        viewerRef.current.dispose();
        viewerRef.current = null;
      }
      setReady(false);
    };
    // The scene is rebuilt only when the geometry changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(config)]);

  useEffect(() => {
    viewerRef.current?.setColor(color);
  }, [color, ready]);

  const bottlesKey = JSON.stringify(bottles);
  useEffect(() => {
    viewerRef.current?.setBottles(bottles);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bottlesKey, ready]);

  // The first view is applied on creation; later changes ease the camera.
  useEffect(() => {
    if (ready) viewerRef.current?.setView(view, true);
  }, [view, ready]);

  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    viewerRef.current?.setSpin(spin && !reduce);
  }, [spin, ready]);

  return (
    <Frame $ratio={ratio} style={style}>
      {poster ? <img src={poster} alt={alt} hidden={ready} /> : null}
      <canvas ref={canvasRef} aria-label={alt} role="img" />
    </Frame>
  );
}
