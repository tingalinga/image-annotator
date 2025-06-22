'use client';

import type React from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Button, FileInput, Icon, NonIdealState, Slider, Tooltip } from '@blueprintjs/core';
import { useAnnotation } from '@/hooks/use-annotation';
import { usePanZoom } from '@/hooks/use-pan-zoom';
import { useImageLoader } from '@/hooks/use-image-loader';
import { drawCanvas } from '@/utils/canvas-drawing';
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
import classNames from 'classnames';

export default function ImageAnnotator() {
  const { boxes, setBoxes, activeBox, handleBoxSelect } = useAnnotation();
  const { scale, panOffset, setScale, resetView, updatePan } = usePanZoom();
  const { image, handleImageUpload, initialized, isLoading } = useImageLoader({
    defaultSrc: '/images/hand-xray.png',
    onImageChange: () => {
      setBoxes([]);
      resetView();
    },
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Draw everything on the canvas
  useEffect(() => {
    if (!canvasRef.current || !image) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawCanvas({
      ctx,
      image,
      boxes,
      activeBox,
      isDrawing,
      startPos,
      currentPos,
      scale,
      panOffset,
    });
  }, [image, boxes, isDrawing, startPos, currentPos, activeBox, scale, panOffset]);

  // Get canvas coordinates from screen coordinates
  const getCanvasCoords = useCallback(
    (screenX: number, screenY: number) => {
      if (!canvasRef.current) return { x: 0, y: 0 };
      return screenToCanvas(screenX, screenY, canvasRef.current, panOffset, scale);
    },
    [panOffset, scale]
  );

  // Update cursor based on hover position
  const updateCursor = useCallback(
    (x: number, y: number) => {
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
    [activeBox, boxes, isResizing, isDrawing, isDragging, isPanning]
  );

  // Handle mouse down
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!canvasRef.current) return;

      const { x, y } = getCanvasCoords(e.clientX, e.clientY);

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
    [activeBox, boxes, getCanvasCoords, handleBoxSelect]
  );

  // Handle mouse move
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!canvasRef.current) return;

      const { x, y } = getCanvasCoords(e.clientX, e.clientY);
      updateCursor(x, y);

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
      activeBox,
      resizeHandle,
      startPos,
      dragOffset,
      lastPanPos,
      boxes,
      setBoxes,
      scale,
      getCanvasCoords,
      updateCursor,
      updatePan,
    ]
  );

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
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
  }, [isResizing, isDragging, isPanning, isDrawing, currentPos, startPos, boxes, setBoxes, handleBoxSelect]);

  // Delete active box
  const deleteActiveBox = useCallback(() => {
    if (!activeBox) return;
    setBoxes(boxes.filter(box => box.id !== activeBox));
    handleBoxSelect(null);
  }, [activeBox, boxes, setBoxes, handleBoxSelect]);

  useEffect(() => {
    if (initialized && image) {
      resetView();
    }
  }, [initialized, image, resetView]);

  return (
    <div className="flex-1 flex flex-col h-full space-y-4" ref={containerRef}>
      <div
        className={classNames('min-h-[400px] flex items-center justify-center', {
          'bp5-skeleton': isLoading || !initialized,
        })}
      >
        {image ? (
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="max-w-full cursor-crosshair"
            style={{ display: image ? 'block' : 'none' }}
          />
        ) : (
          <NonIdealState
            title="Upload an image to annotate"
            description="Supports JPG, PNG, and other image formats"
            icon="upload"
            action={
              <FileInput text="Import image" inputProps={{ accept: 'image/*' }} onInputChange={handleImageUpload} />
            }
          />
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon icon="minus" />
          <Slider min={0.2} max={3} stepSize={0.01} value={scale} labelRenderer={false} onChange={setScale} />
          <Icon icon="plus" />
        </div>
        <Tooltip content="Reset view">
          <Button icon={<Icon icon="reset" />} variant="minimal" onClick={resetView} />
        </Tooltip>
        {Boolean(activeBox) && (
          <Tooltip content="Delete box">
            <Button
              icon={<Icon icon="delete" />}
              variant="minimal"
              onClick={deleteActiveBox}
              className="hover:shadow-sm transition-all"
            />
          </Tooltip>
        )}
        {image && (
          <FileInput text="Import image" inputProps={{ accept: 'image/*' }} onInputChange={handleImageUpload} />
        )}
      </div>
    </div>
  );
}
