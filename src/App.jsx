import React, {useEffect} from "react";
import { Provider } from "jotai";
import GridPreview from "./GridPreview";

function App() {

  useEffect(() => {
    const metaTag = document.createElement("meta");
    metaTag.name = "viewport";
    metaTag.content = "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no";
    document.head.appendChild(metaTag);

    return () => {
      document.head.removeChild(metaTag); // Cleanup when component unmounts
    };
  }, []);


  return (
    <Provider>
        <GridPreview />
    </Provider>
  );
}

export default App; 