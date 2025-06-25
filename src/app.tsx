import { createRoot } from "react-dom/client";
import CanvasContainer from "./canvasContainer/canvasContainer";
import { ClickThroughStatus } from "./canvasContainer/clickThroughStatus/clickThroughStatus";

const root = createRoot(document.body);
root.render(
  <>
    <CanvasContainer />
    <ClickThroughStatus />
  </>
);
