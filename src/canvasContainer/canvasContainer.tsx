import Canvas from "./canvas/canvas";
import { CanvasProvider } from "./canvasContainer.context";
import { useColorPickerLogic } from "./canvasContainer.logic";

export default function CanvasContainer() {
  const { color, setColor } = useColorPickerLogic();

  return (
    <CanvasProvider value={{ color, setColor }}>
      <Canvas />
    </CanvasProvider>
  );
}
