import { useState, useEffect, RefObject, useMemo, useContext } from "react";
import { CanvasContainerContext } from "../canvasContainer.context";

export type Point = { x: number; y: number };
export type Stroke = { points: Point[]; color: string };

export enum Tool {
  Pencil = "pencil",
  Selector = "selector",
  Pan = "pan",
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

// Convert screen coordinates to world coordinates
function screenToWorld(screenPoint: Point, viewportOffset: Point, zoom: number): Point {
  return {
    x: (screenPoint.x - viewportOffset.x) / zoom,
    y: (screenPoint.y - viewportOffset.y) / zoom,
  };
}

export function useCanvasLogic(canvasRef: RefObject<HTMLCanvasElement>) {
  const [tool, setTool] = useState<Tool>(Tool.Pencil);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const { color } = useContext(CanvasContainerContext);
  const [isDrawing, setIsDrawing] = useState(false);
  const [offset, setOffset] = useState<Point | null>(null);
  const [selectionRect, setSelectionRect] = useState<{
    start: Point;
    end: Point;
  } | null>(null);
  const [dragStart, setDragStart] = useState<Point | null>(null);

  // Viewport state for infinite scroll
  const [viewportOffset, setViewportOffset] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point | null>(null);
  const [spacePressed, setSpacePressed] = useState(false);

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

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save context and apply viewport transformation
    ctx.save();
    ctx.translate(viewportOffset.x, viewportOffset.y);
    ctx.scale(zoom, zoom);

    // Draw all strokes in world coordinates
    strokes.forEach((stroke, i) => {
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = 3 / zoom; // Adjust line width for zoom
      ctx.beginPath();
      stroke.points.forEach((pt, j) => {
        if (j === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();

      // Highlight selected strokes
      if (tool === Tool.Selector && selectedIndices.includes(i)) {
        ctx.save();
        ctx.strokeStyle = "#00f";
        ctx.lineWidth = 5 / zoom;
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

    // Restore context for UI elements that should be in screen space
    ctx.restore();

    // Draw selection rectangle in screen space
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
  }, [strokes, tool, selectedIndices, selectionRect, viewportOffset, zoom]);

  // Mouse events
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getScreenPos = (e: MouseEvent) => ({ x: e.clientX, y: e.clientY });
    const getWorldPos = (e: MouseEvent) => {
      const screenPos = getScreenPos(e);
      return screenToWorld(screenPos, viewportOffset, zoom);
    };

    const onDown = (e: MouseEvent) => {
      const screenPos = getScreenPos(e);
      const worldPos = getWorldPos(e);

      // Handle middle mouse button or space + left mouse for panning
      if (e.button === 1 || (spacePressed && e.button === 0)) {
        setIsPanning(true);
        setPanStart(screenPos);
        e.preventDefault();
        return;
      }

      if (tool === Tool.Pencil && e.button === 0) {
        setIsDrawing(true);
        setCurrentStroke([worldPos]);
      } else if (tool === Tool.Selector && e.button === 0) {
        // Check if mouse is over a selected stroke (in world coordinates)
        let hit = false;
        for (const idx of selectedIndices) {
          const stroke = strokes[idx];
          if (
            stroke &&
            stroke.points.some(
              (pt) => Math.hypot(pt.x - worldPos.x, pt.y - worldPos.y) < 8 / zoom
            )
          ) {
            hit = true;
            break;
          }
        }
        if (selectedIndices.length > 0 && hit) {
          setOffset(worldPos);
        } else {
          // Start selection rectangle (in screen coordinates)
          setSelectionRect({ start: screenPos, end: screenPos });
          setDragStart(screenPos);
        }
      }
    };

    const onMove = (e: MouseEvent) => {
      const screenPos = getScreenPos(e);
      const worldPos = getWorldPos(e);

      // Handle panning
      if (isPanning && panStart) {
        const dx = screenPos.x - panStart.x;
        const dy = screenPos.y - panStart.y;
        setViewportOffset(prev => ({
          x: prev.x + dx,
          y: prev.y + dy
        }));
        setPanStart(screenPos);
        return;
      }

      if (tool === Tool.Pencil && isDrawing) {
        setCurrentStroke((s) => [...s, worldPos]);
      } else if (tool === Tool.Selector && selectionRect && dragStart) {
        // Update selection rectangle (in screen coordinates)
        setSelectionRect((rect) => (rect ? { ...rect, end: screenPos } : null));
      } else if (
        tool === Tool.Selector &&
        selectedIndices.length > 0 &&
        offset
      ) {
        // Move selected strokes (in world coordinates)
        const dx = worldPos.x - offset.x;
        const dy = worldPos.y - offset.y;
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
        setOffset(worldPos);
      }
    };

    const onUp = () => {
      // Handle panning end
      if (isPanning) {
        setIsPanning(false);
        setPanStart(null);
        return;
      }

      if (tool === Tool.Pencil && isDrawing) {
        setIsDrawing(false);
        if (currentStroke.length > 0) {
          pushToUndo([...strokes, { points: currentStroke, color }]);
        }
        setCurrentStroke([]);
      } else if (tool === Tool.Selector && selectionRect && dragStart) {
        // Select all strokes within rectangle (convert selection rect to world coordinates)
        const screenRect = rectFromPoints(selectionRect.start, selectionRect.end);
        const worldRectStart = screenToWorld({ x: screenRect.x, y: screenRect.y }, viewportOffset, zoom);
        const worldRectEnd = screenToWorld({
          x: screenRect.x + screenRect.w,
          y: screenRect.y + screenRect.h
        }, viewportOffset, zoom);
        const worldRect = rectFromPoints(worldRectStart, worldRectEnd);

        const selected = strokes
          .map((stroke, i) => (strokeInRect(stroke, worldRect) ? i : null))
          .filter((i) => i !== null) as number[];
        setSelectedIndices(selected);
        setSelectionRect(null);
        setDragStart(null);
      } else if (tool === Tool.Selector) {
        setOffset(null);
      }
    };

    const onWheel = (e: WheelEvent) => {
      // Zoom with mouse wheel
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(5, zoom * delta));

      // Zoom towards mouse position
      const mousePos = { x: e.clientX, y: e.clientY };
      const worldPosBeforeZoom = screenToWorld(mousePos, viewportOffset, zoom);
      setZoom(newZoom);
      const worldPosAfterZoom = screenToWorld(mousePos, viewportOffset, newZoom);

      setViewportOffset(prev => ({
        x: prev.x + (worldPosAfterZoom.x - worldPosBeforeZoom.x) * newZoom,
        y: prev.y + (worldPosAfterZoom.y - worldPosBeforeZoom.y) * newZoom
      }));
    };

    canvas.addEventListener("mousedown", onDown);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("mouseup", onUp);

    return () => {
      canvas.removeEventListener("mousedown", onDown);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("wheel", onWheel);
      window.removeEventListener("mouseup", onUp);
    };
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
    viewportOffset,
    zoom,
    isPanning,
    panStart,
    spacePressed,
  ]);

  // Draw current stroke
  useEffect(() => {
    if (tool !== Tool.Pencil || !isDrawing || currentStroke.length === 0)
      return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Save context and apply viewport transformation
    ctx.save();
    ctx.translate(viewportOffset.x, viewportOffset.y);
    ctx.scale(zoom, zoom);

    ctx.strokeStyle = color;
    ctx.lineWidth = 3 / zoom; // Adjust line width for zoom
    ctx.beginPath();
    currentStroke.forEach((pt, j) => {
      if (j === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();

    ctx.restore();
  }, [currentStroke, isDrawing, color, tool, canvasRef, viewportOffset, zoom]);

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
      // Handle space bar for panning
      if (e.code === "Space" && !spacePressed) {
        setSpacePressed(true);
        e.preventDefault();
        return;
      }

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
      if (
        e.key === "Backspace" &&
        tool === Tool.Selector &&
        selectedIndices.length > 0
      ) {
        pushToUndo(strokes.filter((_, i) => !selectedIndices.includes(i)));
        setSelectedIndices([]);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      // Handle space bar release
      if (e.code === "Space") {
        setSpacePressed(false);
        setIsPanning(false);
        setPanStart(null);
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [tool, selectedIndices, strokes, undoStack, redoStack, spacePressed]);

  const cursor = useMemo(() => {
    if (isPanning || spacePressed) {
      return isPanning ? "grabbing" : "grab";
    }
    switch (tool) {
      case Tool.Pencil:
        return "crosshair";
      case Tool.Selector:
        return "pointer";
      default:
        return "default";
    }
  }, [tool, isPanning, spacePressed]);

  return {
    cursor,
    zoom,
    viewportOffset,
  };
}
