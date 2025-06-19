import React, { useRef } from "react";
import { useCanvasLogic, Tool } from "./canvas.logic";
import "./canvas.styles.css";

const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const colorRef = useRef<HTMLInputElement>(null!);
  const { tool, color } = useCanvasLogic(canvasRef, colorRef);

  return (
    <div id="canvasContainer" className="canvas-container">
      <canvas
        ref={canvasRef}
        id="canvas"
        className="canvas-main"
        style={{
          cursor:
            tool === Tool.Pencil
              ? "crosshair"
              : tool === Tool.Selector
              ? "pointer"
              : "default",
        }}
      ></canvas>
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
    </div>
  );
};

export default Canvas;
