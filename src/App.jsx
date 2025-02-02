import React from "react";
import { Provider } from "jotai";
import BoxPreview from "./BoxPreview";

function App() {
  return (
    <Provider>
      <div className="flex items-center justify-center h-screen w-screen bg-gray-100">
        <BoxPreview />
      </div>
    </Provider>
  );
}

export default App;