import { useState, useEffect, RefObject, useMemo, useContext } from "react";
import { CanvasContainerContext } from "../canvasContainer.context";

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
function pointInRect(
  pt: Point,
  rect: { x: number; y: number; w: number; h: number }
) {
  return (
    pt.x >= rect.x &&
    pt.x <= rect.x + rect.w &&
    pt.y >= rect.y &&
    pt.y <= rect.y + rect.h
  );
}
function strokeInRect(
  stroke: Stroke,
  rect: { x: number; y: number; w: number; h: number }
) {
  return stroke.points.some((pt) => pointInRect(pt, rect));
}

export function useCanvasLogic(canvasRef: RefObject<HTMLCanvasElement>) {
  const [tool, setTool] = useState<Tool>(Tool.Pencil);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const { color, setColor } = useContext(CanvasContainerContext);
  const [isDrawing, setIsDrawing] = useState(false);
  const [offset, setOffset] = useState<Point | null>(null);
  const [selectionRect, setSelectionRect] = useState<{
    start: Point;
    end: Point;
  } | null>(null);
  const [dragStart, setDragStart] = useState<Point | null>(null);

  // Undo/Redo stacks
  const [undoStack, setUndoStack] = useState<Stroke[][]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[][]>([]);

  const UNDO_LIMIT = 50;

  // Helper to push to undo stack
  const pushToUndo = (newStrokes: Stroke[]) => {
    setUndoStack((stack) => {
      const next = [...stack, strokes];
      return next.length > UNDO_LIMIT ? next.slice(1) : next;
    });
    setRedoStack([]); // clear redo stack on new action
    setStrokes(newStrokes);
  };

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
      const { x, y, w, h } = rectFromPoints(
        selectionRect.start,
        selectionRect.end
      );
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
      const pos = getPos(e);
      if (tool === Tool.Pencil) {
        setIsDrawing(true);
        setCurrentStroke([pos]);
      } else if (tool === Tool.Selector) {
        // Check if mouse is over a selected stroke
        let hit = false;
        for (const idx of selectedIndices) {
          const stroke = strokes[idx];
          if (
            stroke &&
            stroke.points.some(
              (pt) => Math.hypot(pt.x - pos.x, pt.y - pos.y) < 8
            )
          ) {
            hit = true;
            break;
          }
        }
        if (selectedIndices.length > 0 && hit) {
          setOffset(pos);
        } else {
          // Start selection rectangle
          setSelectionRect({ start: pos, end: pos });
          setDragStart(pos);
        }
      }
    };
    const onMove = (e: MouseEvent) => {
      const pos = getPos(e);
      if (tool === Tool.Pencil && isDrawing) {
        setCurrentStroke((s) => [...s, pos]);
      } else if (tool === Tool.Selector && selectionRect && dragStart) {
        // Update selection rectangle
        setSelectionRect((rect) => (rect ? { ...rect, end: pos } : null));
      } else if (
        tool === Tool.Selector &&
        selectedIndices.length > 0 &&
        offset
      ) {
        // Move selected strokes
        const dx = pos.x - offset.x;
        const dy = pos.y - offset.y;
        setStrokes((prev) =>
          prev.map((stroke, i) =>
            selectedIndices.includes(i)
              ? {
                  ...stroke,
                  points: stroke.points.map((pt) => ({
                    x: pt.x + dx,
                    y: pt.y + dy,
                  })),
                }
              : stroke
          )
        );
        setOffset(pos);
      }
    };
    const onUp = () => {
      if (tool === Tool.Pencil && isDrawing) {
        setIsDrawing(false);
        if (currentStroke.length > 0) {
          pushToUndo([...strokes, { points: currentStroke, color }]);
        }
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
  }, [
    tool,
    isDrawing,
    currentStroke,
    color,
    strokes,
    selectedIndices,
    offset,
    selectionRect,
    dragStart,
  ]);

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

  // Move selected strokes (push to undo stack)
  useEffect(() => {
    if (tool === Tool.Selector && offset && selectedIndices.length > 0) {
      // Save previous state before move
      setUndoStack((stack) => [...stack, strokes]);
      setRedoStack([]);
    }
    // eslint-disable-next-line
  }, [offset]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Undo/Redo (Cmd/Ctrl+Z, Cmd/Ctrl+Y)
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;
      if (ctrlOrCmd && e.key.toLowerCase() === "z") {
        if (undoStack.length > 0) {
          setRedoStack((stack) => {
            const next = [...stack, strokes];
            return next.length > UNDO_LIMIT ? next.slice(1) : next;
          });
          setStrokes(undoStack[undoStack.length - 1]);
          setUndoStack((stack) => stack.slice(0, -1));
        }
        e.preventDefault();
        return;
      }
      if (ctrlOrCmd && e.key.toLowerCase() === "y") {
        if (redoStack.length > 0) {
          setUndoStack((stack) => {
            const next = [...stack, strokes];
            return next.length > UNDO_LIMIT ? next.slice(1) : next;
          });
          setStrokes(redoStack[redoStack.length - 1]);
          setRedoStack((stack) => stack.slice(0, -1));
        }
        e.preventDefault();
        return;
      }
      if (e.key === "F1") setTool(Tool.Pencil);
      if (e.key === "F2") setTool(Tool.Selector);
      if (e.key === "F3") {
        pushToUndo([]);
        setSelectedIndices([]);
      }

      // Color shortcuts
      if (e.key === "1") setColor("#ff0000"); // Red
      if (e.key === "2") setColor("#0000ff"); // Blue
      if (e.key === "3") setColor("#ffff00"); // Yellow
      if (e.key === "4") setColor("#00ff00"); // Green
      if (
        e.key === "Backspace" &&
        tool === Tool.Selector &&
        selectedIndices.length > 0
      ) {
        pushToUndo(strokes.filter((_, i) => !selectedIndices.includes(i)));
        setSelectedIndices([]);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    // window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      // window.removeEventListener("keyup", onKeyUp);
    };
  }, [tool, selectedIndices, strokes, undoStack, redoStack, /* spacePressed, */ setColor]);

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
    cursor,
  };
}
