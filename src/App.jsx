import React from "react";
import { Provider } from "jotai";
import GridPreview from "./GridPreview";

function App() {
  return (
    <Provider>
        <GridPreview />
    </Provider>
  );
}

export default App; 