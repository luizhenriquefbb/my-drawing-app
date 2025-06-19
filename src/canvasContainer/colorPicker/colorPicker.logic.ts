import { RefObject, useContext, useEffect } from "react";
import { CanvasContext } from "../canvasContainer.context";

export function useColorPickerLogic(colorRef?: RefObject<HTMLInputElement>) {
  const { setColor } = useContext(CanvasContext);
  // Color picker
  useEffect(
    (colorRef?: RefObject<HTMLInputElement>) => {
      if (!colorRef) return;
      const colorInput = colorRef.current;
      if (!colorInput) return;
      const onChange = (e: Event) =>
        setColor((e.target as HTMLInputElement).value);
      colorInput.addEventListener("input", onChange);
      return () => colorInput.removeEventListener("input", onChange);
    },
    [colorRef]
  );
}
