import React, { useContext, useRef } from "react";
import { useColorPickerLogic } from "./colorPicker.logic";
import { CanvasContainerContext } from "../canvasContainer.context";
import "./colorPicker.styles.css";

const ColorPicker: React.FC = () => {
  const { color, setColor: onChange } = useContext(CanvasContainerContext);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const colorRef = useRef<HTMLInputElement>(null!);

  useColorPickerLogic(colorRef);

  return (
    <div className="color-picker-wrapper">
      <input
        type="color"
        id="colorPicker"
        title="Pick a color"
        value={color}
        className="color-picker-input"
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default ColorPicker;
