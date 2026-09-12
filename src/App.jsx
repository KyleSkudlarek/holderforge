import { Suspense, lazy, useEffect } from "react";
import { Routes, Route, useLocation, useParams } from "react-router-dom";
import { Provider } from "jotai";
import { ThemeProvider } from "styled-components";
import { theme } from "./theme";
import Layout from "./site/Layout";
import Home from "./site/pages/Home";
import Shop from "./site/pages/Shop";
import Product from "./site/pages/Product";
import Find from "./site/pages/Find";
import FitsIndex from "./site/pages/FitsIndex";
import Fits from "./site/pages/Fits";
import Measure from "./site/pages/Measure";
import NotFound from "./site/pages/NotFound";
import { categoryBySlug } from "./catalog";

// The designer pulls in three.js and jscad; loading it lazily keeps the
// catalog pages light and keeps WebGL code out of the prerender bundle.
const GridPreview = lazy(() => import("./GridPreview"));

function Designer() {
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "viewport";
    meta.content = "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no";
    document.head.appendChild(meta);
    return () => document.head.removeChild(meta);
  }, []);
  return (
    <Suspense fallback={<div style={{ padding: 24, color: theme.colors.headerSecondary }}>Loading the designer…</div>}>
      <GridPreview />
    </Suspense>
  );
}

// /shop/<slug> is a category page when the slug names a category, otherwise a product.
function ShopSlug() {
  const { slug } = useParams();
  return categoryBySlug(slug) ? <Shop /> : <Product />;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <Provider>
        <ScrollToTop />
        <Routes>
          <Route path="/design" element={<Designer />} />
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/shop/:slug" element={<ShopSlug />} />
            <Route path="/find" element={<Find />} />
            <Route path="/fits" element={<FitsIndex />} />
            <Route path="/fits/:slug" element={<Fits />} />
            <Route path="/guides/how-to-measure" element={<Measure />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Provider>
    </ThemeProvider>
  );
}
