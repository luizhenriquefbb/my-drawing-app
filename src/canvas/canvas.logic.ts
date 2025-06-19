import { useState, useEffect, RefObject, useMemo } from "react";

export type Point = { x: number; y: number };
export type Stroke = { points: Point[]; color: string };

export enum Tool {
  Pencil = "pencil",
  Selector = "selector",
}

function rectFromPoints(a: Point, b: Point) {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: Math.abs(a.x - b.x),
    h: Math.abs(a.y - b.y),
  };
}
function pointInRect(pt: Point, rect: { x: number; y: number; w: number; h: number }) {
  return pt.x >= rect.x && pt.x <= rect.x + rect.w && pt.y >= rect.y && pt.y <= rect.y + rect.h;
}
function strokeInRect(stroke: Stroke, rect: { x: number; y: number; w: number; h: number }) {
  return stroke.points.some((pt) => pointInRect(pt, rect));
}

export function useCanvasLogic(
  canvasRef: RefObject<HTMLCanvasElement>,
  colorRef: RefObject<HTMLInputElement>
) {
  const [tool, setTool] = useState<Tool>(Tool.Pencil);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [color, setColor] = useState<string>("#ff0000");
  const [isDrawing, setIsDrawing] = useState(false);
  const [offset, setOffset] = useState<Point | null>(null);
  const [selectionRect, setSelectionRect] = useState<{ start: Point; end: Point } | null>(null);
  const [dragStart, setDragStart] = useState<Point | null>(null);

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
      if (tool === Tool.Selector && selectedIndices.includes(i)) {
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
    // Draw selection rectangle
    if (tool === Tool.Selector && selectionRect) {
      const { x, y, w, h } = rectFromPoints(selectionRect.start, selectionRect.end);
      ctx.save();
      ctx.strokeStyle = "#00f";
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.7;
      ctx.strokeRect(x, y, w, h);
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = "#00f";
      ctx.fillRect(x, y, w, h);
      ctx.restore();
    }
  };

  // Redraw on strokes/tool/selection change
  useEffect(() => {
    redraw();
  }, [strokes, tool, selectedIndices, selectionRect]);

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
        // Start selection rectangle
        setSelectionRect({ start: getPos(e), end: getPos(e) });
        setDragStart(getPos(e));
      }
    };
    const onMove = (e: MouseEvent) => {
      if (tool === Tool.Pencil && isDrawing) {
        setCurrentStroke((s) => [...s, getPos(e)]);
      } else if (tool === Tool.Selector && selectionRect && dragStart) {
        // Update selection rectangle
        setSelectionRect((rect) => rect ? { ...rect, end: getPos(e) } : null);
      } else if (tool === Tool.Selector && selectedIndices.length > 0 && offset) {
        // Move selected strokes (optional: implement group move)
        // ...not implemented for group move in this version...
      }
    };
    const onUp = () => {
      if (tool === Tool.Pencil && isDrawing) {
        setIsDrawing(false);
        setStrokes((strokes) => [...strokes, { points: currentStroke, color }]);
        setCurrentStroke([]);
      } else if (tool === Tool.Selector && selectionRect && dragStart) {
        // Select all strokes within rectangle
        const rect = rectFromPoints(selectionRect.start, selectionRect.end);
        const selected = strokes
          .map((stroke, i) => (strokeInRect(stroke, rect) ? i : null))
          .filter((i) => i !== null) as number[];
        setSelectedIndices(selected);
        setSelectionRect(null);
        setDragStart(null);
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
  }, [tool, isDrawing, currentStroke, color, strokes, selectedIndices, offset, selectionRect, dragStart]);

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
        setSelectedIndices([]);
      }
      if (
        e.key === "Backspace" &&
        tool === Tool.Selector &&
        selectedIndices.length > 0
      ) {
        setStrokes((strokes) => strokes.filter((_, i) => !selectedIndices.includes(i)));
        setSelectedIndices([]);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [tool, selectedIndices]);

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
    selectedIndices,
    setSelectedIndices,
    cursor,
  };
}
