import { useState, useEffect, RefObject, useMemo } from "react";

export type Point = { x: number; y: number };
export type Stroke = { points: Point[]; color: string };

export enum Tool {
  Pencil = "pencil",
  Selector = "selector",
}

export function useCanvasLogic(
  canvasRef: RefObject<HTMLCanvasElement>,
  colorRef: RefObject<HTMLInputElement>
) {
  const [tool, setTool] = useState<Tool>(Tool.Pencil);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [color, setColor] = useState<string>("#ff0000");
  const [isDrawing, setIsDrawing] = useState(false);
  const [offset, setOffset] = useState<Point | null>(null);

  // Resize canvas to fill window
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        redraw();
      }
    };
    window.addEventListener("resize", resize);
    resize();
    return () => window.removeEventListener("resize", resize);
    // eslint-disable-next-line
  }, []);

  // Redraw all strokes
  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokes.forEach((stroke, i) => {
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      stroke.points.forEach((pt, j) => {
        if (j === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
      // Highlight selected
      if (tool === Tool.Selector && selectedIndex === i) {
        ctx.save();
        ctx.strokeStyle = "#00f";
        ctx.lineWidth = 5;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        stroke.points.forEach((pt, j) => {
          if (j === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();
        ctx.restore();
      }
    });
  };

  // Redraw on strokes/tool/selection change
  useEffect(() => {
    redraw();
  }, [strokes, tool, selectedIndex]);

  // Mouse events
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const getPos = (e: MouseEvent) => ({ x: e.clientX, y: e.clientY });

    const onDown = (e: MouseEvent) => {
      if (tool === Tool.Pencil) {
        setIsDrawing(true);
        setCurrentStroke([getPos(e)]);
      } else if (tool === Tool.Selector) {
        // Find stroke under cursor
        const pos = getPos(e);
        let found = null;
        strokes.forEach((stroke, i) => {
          if (
            stroke.points.some(
              (pt) => Math.hypot(pt.x - pos.x, pt.y - pos.y) < 10
            )
          ) {
            found = i;
          }
        });
        setSelectedIndex(found);
        if (found !== null) {
          setOffset({
            x: pos.x - strokes[found].points[0].x,
            y: pos.y - strokes[found].points[0].y,
          });
        } else {
          setOffset(null);
        }
      }
    };
    const onMove = (e: MouseEvent) => {
      if (tool === Tool.Pencil && isDrawing) {
        setCurrentStroke((s) => [...s, getPos(e)]);
      } else if (tool === Tool.Selector && selectedIndex !== null && offset) {
        // Move selected stroke
        const pos = getPos(e);
        setStrokes((strokes) =>
          strokes.map((stroke, i) =>
            i === selectedIndex
              ? {
                  ...stroke,
                  points: stroke.points.map((pt, j) =>
                    j === 0
                      ? { x: pos.x - offset.x, y: pos.y - offset.y }
                      : {
                          x: pt.x + (pos.x - offset.x - stroke.points[0].x),
                          y: pt.y + (pos.y - offset.y - stroke.points[0].y),
                        }
                  ),
                }
              : stroke
          )
        );
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const onUp = (e: MouseEvent) => {
      if (tool === Tool.Pencil && isDrawing) {
        setIsDrawing(false);
        setStrokes((strokes) => [...strokes, { points: currentStroke, color }]);
        setCurrentStroke([]);
      } else if (tool === Tool.Selector) {
        setOffset(null);
      }
    };
    canvas.addEventListener("mousedown", onDown);
    canvas.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      canvas.removeEventListener("mousedown", onDown);
      canvas.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    // eslint-disable-next-line
  }, [tool, isDrawing, currentStroke, color, strokes, selectedIndex, offset]);

  // Draw current stroke
  useEffect(() => {
    if (tool !== Tool.Pencil || !isDrawing || currentStroke.length === 0)
      return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    currentStroke.forEach((pt, j) => {
      if (j === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();
  }, [currentStroke, isDrawing, color, tool, canvasRef]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F1") setTool(Tool.Pencil);
      if (e.key === "F2") setTool(Tool.Selector);
      if (e.key === "F3") {
        setStrokes([]);
        setSelectedIndex(null);
      }
      if (
        e.key === "Backspace" &&
        tool === Tool.Selector &&
        selectedIndex !== null
      ) {
        setStrokes((strokes) => strokes.filter((_, i) => i !== selectedIndex));
        setSelectedIndex(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [tool, selectedIndex]);

  // Color picker
  useEffect(() => {
    const colorInput = colorRef.current;
    if (!colorInput) return;
    const onChange = (e: Event) =>
      setColor((e.target as HTMLInputElement).value);
    colorInput.addEventListener("input", onChange);
    return () => colorInput.removeEventListener("input", onChange);
  }, [colorRef]);

  const cursor = useMemo(() => {
    switch (tool) {
      case Tool.Pencil:
        return "crosshair";
      case Tool.Selector:
        return "pointer";
      default:
        return "default";
    }
  }, [tool]);

  return {
    setTool,
    color,
    setColor,
    strokes,
    selectedIndex,
    setSelectedIndex,
    cursor,
  };
}
