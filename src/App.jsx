import React from "react";
import { Provider } from "jotai";
import BoxPreview from "./BoxPreview";
import GridPreview from "./GridPreview";

function App() {
  return (
    <Provider>
        {/* <BoxPreview /> */}
        <GridPreview />
    </Provider>
  );
}

export default App; 