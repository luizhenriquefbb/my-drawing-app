import React, { useRef } from "react";
import { useCanvasLogic } from "./canvas.logic";
import "./canvas.styles.css";
import ColorPicker from "../colorPicker/colorPicker";
import HelpOverlay from "../helpOverlay/helpOverlay";

const Canvas: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const { cursor, zoom } = useCanvasLogic(
    canvasRef as React.RefObject<HTMLCanvasElement>
  );

  return (
    <div id="canvasContainer" className="canvas-container">
      <ColorPicker />
      <HelpOverlay />
      <div className="zoom-indicator">
        {Math.round(zoom * 100)}%
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
