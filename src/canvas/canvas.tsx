import React, { useRef } from "react";
import { useCanvasLogic } from "./canvas.logic";
import "./canvas.styles.css";

const Canvas: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const colorRef = useRef<HTMLInputElement>(null!);
  const { color, cursor } = useCanvasLogic(canvasRef, colorRef);

  return (
    <div id="canvasContainer" className="canvas-container">
      <div className="color-picker-wrapper">
        <input
          ref={colorRef}
          type="color"
          id="colorPicker"
          title="Pick a color"
          value={color}
          className="color-picker-input"
        />
      </div>
      <canvas
        ref={canvasRef}
        id="canvas"
        className="canvas-main"
        style={{
          cursor,
        }}
      ></canvas>
    </div>
  );
};

export default Canvas;
