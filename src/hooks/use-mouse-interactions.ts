import { useState, useCallback } from 'react';
import type { BoundingBox } from '@/typings';
import {
  getResizeHandleAtPosition,
  screenToCanvas,
  getBoxAtPosition,
  createBoundingBox,
  updateBoxPosition,
  updateBoxSize,
  MIN_BOX_SIZE,
  MIN_DRAW_SIZE,
  RESIZE_CURSORS,
} from '@/utils/image-annotator';

interface MouseInteractionsState {
  scale: number;
  panOffset: { x: number; y: number };
  isDrawing: boolean;
  isResizing: boolean;
  isDragging: boolean;
  isPanning: boolean;
  startPos: { x: number; y: number };
  currentPos: { x: number; y: number };
  resizeHandle: string | null;
  originalBox: BoundingBox | null;
  dragOffset: { x: number; y: number };
  lastPanPos: { x: number; y: number };
}

interface MouseInteractionsActions {
  setScale: (scale: number) => void;
  resetView: () => void;
  deleteActiveBox: () => void;
  handleMouseDown: (e: React.MouseEvent, options: MouseDownOptions) => void;
  handleMouseMove: (e: React.MouseEvent, options: MouseMoveOptions) => void;
  handleMouseUp: (options: MouseUpOptions) => void;
  updateCursor: (x: number, y: number, options: CursorOptions) => void;
}

interface MouseDownOptions {
  boxes: BoundingBox[];
  activeBox: string | null;
  handleBoxSelect: (id: string | null) => void;
  setBoxes: (boxes: BoundingBox[]) => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

interface MouseMoveOptions {
  boxes: BoundingBox[];
  activeBox: string | null;
  setBoxes: (boxes: BoundingBox[]) => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

interface MouseUpOptions {
  boxes: BoundingBox[];
  handleBoxSelect: (id: string | null) => void;
  setBoxes: (boxes: BoundingBox[]) => void;
}

interface CursorOptions {
  activeBox: string | null;
  boxes: BoundingBox[];
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export const useMouseInteractions = (initialScale: number = 1): MouseInteractionsState & MouseInteractionsActions => {
  const [scale, setScale] = useState(initialScale);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });

  // Resize state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [originalBox, setOriginalBox] = useState<BoundingBox | null>(null);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Pan state
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPos, setLastPanPos] = useState({ x: 0, y: 0 });

  const resetView = useCallback(() => {
    setScale(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  const updatePan = useCallback((deltaX: number, deltaY: number) => {
    setPanOffset(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY,
    }));
  }, []);

  const getCanvasCoords = useCallback(
    (screenX: number, screenY: number, canvasRef: React.RefObject<HTMLCanvasElement | null>) => {
      if (!canvasRef.current) return { x: 0, y: 0 };
      return screenToCanvas(screenX, screenY, canvasRef.current, panOffset, scale);
    },
    [panOffset, scale]
  );

  const updateCursor = useCallback(
    (x: number, y: number, options: CursorOptions) => {
      const { activeBox, boxes, canvasRef } = options;
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;

      if (isResizing || isDrawing || isDragging || isPanning) {
        if (isPanning) canvas.style.cursor = 'grabbing';
        return;
      }

      // Check for resize handles
      if (activeBox) {
        const activeBoxObj = boxes.find(box => box.id === activeBox);
        if (activeBoxObj) {
          const handle = getResizeHandleAtPosition(x, y, activeBoxObj);
          if (handle) {
            canvas.style.cursor = RESIZE_CURSORS[handle] || 'crosshair';
            return;
          }
        }
      }

      // Check for box hover
      const hoveredBox = getBoxAtPosition(x, y, boxes);
      canvas.style.cursor = hoveredBox ? 'move' : 'crosshair';
    },
    [isResizing, isDrawing, isDragging, isPanning]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, options: MouseDownOptions) => {
      const { boxes, activeBox, handleBoxSelect, canvasRef } = options;
      if (!canvasRef.current) return;

      const { x, y } = getCanvasCoords(e.clientX, e.clientY, canvasRef);

      // Check for resize handle
      if (activeBox) {
        const activeBoxObj = boxes.find(box => box.id === activeBox);
        if (activeBoxObj) {
          const handle = getResizeHandleAtPosition(x, y, activeBoxObj);
          if (handle) {
            setIsResizing(true);
            setResizeHandle(handle);
            setOriginalBox(activeBoxObj);
            setStartPos({ x, y });
            setCurrentPos({ x, y });
            return;
          }
        }
      }

      // Check for box selection/dragging
      const clickedBox = getBoxAtPosition(x, y, boxes);
      if (clickedBox) {
        handleBoxSelect(clickedBox.id);
        setIsDragging(true);
        setDragOffset({ x: x - clickedBox.x, y: y - clickedBox.y });
        setOriginalBox(clickedBox);
        return;
      }

      // Start panning if modifier key is held
      if (e.metaKey || e.ctrlKey) {
        setIsPanning(true);
        setLastPanPos({ x: e.clientX, y: e.clientY });
        return;
      }

      // Start drawing
      setStartPos({ x, y });
      setCurrentPos({ x, y });
      setIsDrawing(true);
    },
    [getCanvasCoords]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent, options: MouseMoveOptions) => {
      const { boxes, activeBox, setBoxes, canvasRef } = options;
      if (!canvasRef.current) return;

      const { x, y } = getCanvasCoords(e.clientX, e.clientY, canvasRef);
      updateCursor(x, y, { activeBox, boxes, canvasRef });

      if (isPanning) {
        const deltaX = e.clientX - lastPanPos.x;
        const deltaY = e.clientY - lastPanPos.y;
        updatePan(deltaX * 10, deltaY * 10);
        setLastPanPos({ x: e.clientX, y: e.clientY });
      } else if (isDragging && originalBox && activeBox) {
        const newX = x - dragOffset.x;
        const newY = y - dragOffset.y;
        const updatedBox = updateBoxPosition(
          originalBox,
          newX,
          newY,
          canvasRef.current!.width,
          canvasRef.current!.height,
          scale
        );
        setBoxes(boxes.map(b => (b.id === activeBox ? updatedBox : b)));
      } else if (isResizing && originalBox && resizeHandle) {
        setCurrentPos({ x, y });
        const deltaX = x - startPos.x;
        const deltaY = y - startPos.y;
        const updatedBox = updateBoxSize(originalBox, resizeHandle, deltaX, deltaY);

        if (updatedBox.width > MIN_BOX_SIZE && updatedBox.height > MIN_BOX_SIZE) {
          setBoxes(boxes.map(b => (b.id === activeBox ? updatedBox : b)));
        }
      } else if (isDrawing) {
        setCurrentPos({ x, y });
      }
    },
    [
      isPanning,
      isDragging,
      isResizing,
      isDrawing,
      originalBox,
      resizeHandle,
      startPos,
      dragOffset,
      lastPanPos,
      scale,
      getCanvasCoords,
      updateCursor,
      updatePan,
    ]
  );

  const handleMouseUp = useCallback(
    (options: MouseUpOptions) => {
      const { boxes, handleBoxSelect, setBoxes } = options;

      if (isResizing) {
        setIsResizing(false);
        setResizeHandle(null);
        setOriginalBox(null);
      } else if (isDragging) {
        setIsDragging(false);
        setDragOffset({ x: 0, y: 0 });
        setOriginalBox(null);
      } else if (isPanning) {
        setIsPanning(false);
        setLastPanPos({ x: 0, y: 0 });
      } else if (isDrawing) {
        const width = currentPos.x - startPos.x;
        const height = currentPos.y - startPos.y;

        if (Math.abs(width) > MIN_DRAW_SIZE && Math.abs(height) > MIN_DRAW_SIZE) {
          const newBox = createBoundingBox(startPos, currentPos);
          setBoxes([...boxes, newBox]);
          handleBoxSelect(newBox.id);
        }

        setIsDrawing(false);
      }
    },
    [isResizing, isDragging, isPanning, isDrawing, currentPos, startPos]
  );

  const deleteActiveBox = useCallback(() => {
    // This is a placeholder - the actual implementation needs access to boxes and activeBox
    // which will be passed through the component
  }, []);

  return {
    // State
    scale,
    panOffset,
    isDrawing,
    isResizing,
    isDragging,
    isPanning,
    startPos,
    currentPos,
    resizeHandle,
    originalBox,
    dragOffset,
    lastPanPos,

    // Actions
    setScale,
    resetView,
    deleteActiveBox,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    updateCursor,
  };
};
