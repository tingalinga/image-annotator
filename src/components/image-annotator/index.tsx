'use client';

import type React from 'react';

import { useState, useRef, useEffect } from 'react';
import { BoundingBox } from '@/typings';
import { Button, Icon } from '@blueprintjs/core';
import { useAnnotation } from '@/hooks/use-annotation';

export default function ImageAnnotator() {
  const { boxes, setBoxes, activeBox, handleBoxSelect, isDrawing, setIsDrawing } = useAnnotation();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [originalBox, setOriginalBox] = useState<BoundingBox | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Load a default image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = '/images/hand-xray.png';
    img.onload = () => {
      setImage(img);
    };
  }, []);

  // Draw everything on the canvas
  useEffect(() => {
    if (!canvasRef.current || !image) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to match image
    canvas.width = image.width;
    canvas.height = image.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the image
    ctx.drawImage(image, 0, 0);

    // Draw existing boxes
    // First draw non-active boxes
    boxes
      .filter(box => box.id !== activeBox)
      .forEach(box => {
        ctx.strokeStyle = box.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(box.x, box.y, box.width, box.height);

        // Draw a semi-transparent fill for non-active boxes
        ctx.fillStyle = `${box.color}20`;
        ctx.fillRect(box.x, box.y, box.width, box.height);

        // Add a label with the box ID
        if (box.textRef) {
          ctx.fillStyle = box.color;
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText(`Linked`, box.x, box.y - 8);
        }
      });

    // Then draw the active box on top
    if (activeBox) {
      const activeBoxObj = boxes.find(box => box.id === activeBox);
      if (activeBoxObj) {
        ctx.strokeStyle = activeBoxObj.color;
        ctx.lineWidth = 3;
        ctx.strokeRect(activeBoxObj.x, activeBoxObj.y, activeBoxObj.width, activeBoxObj.height);

        // Draw a semi-transparent fill for the active box
        ctx.fillStyle = `${activeBoxObj.color}50`;
        ctx.fillRect(activeBoxObj.x, activeBoxObj.y, activeBoxObj.width, activeBoxObj.height);

        // Draw resize handles for active box
        const handleSize = 50;
        const handles = [
          { x: activeBoxObj.x - handleSize / 2, y: activeBoxObj.y - handleSize / 2, cursor: 'nw-resize' }, // top-left
          {
            x: activeBoxObj.x + activeBoxObj.width - handleSize / 2,
            y: activeBoxObj.y - handleSize / 2,
            cursor: 'ne-resize',
          }, // top-right
          {
            x: activeBoxObj.x - handleSize / 2,
            y: activeBoxObj.y + activeBoxObj.height - handleSize / 2,
            cursor: 'sw-resize',
          }, // bottom-left
          {
            x: activeBoxObj.x + activeBoxObj.width - handleSize / 2,
            y: activeBoxObj.y + activeBoxObj.height - handleSize / 2,
            cursor: 'se-resize',
          }, // bottom-right
          {
            x: activeBoxObj.x + activeBoxObj.width / 2 - handleSize / 2,
            y: activeBoxObj.y - handleSize / 2,
            cursor: 'n-resize',
          }, // top
          {
            x: activeBoxObj.x + activeBoxObj.width / 2 - handleSize / 2,
            y: activeBoxObj.y + activeBoxObj.height - handleSize / 2,
            cursor: 's-resize',
          }, // bottom
          {
            x: activeBoxObj.x - handleSize / 2,
            y: activeBoxObj.y + activeBoxObj.height / 2 - handleSize / 2,
            cursor: 'w-resize',
          }, // left
          {
            x: activeBoxObj.x + activeBoxObj.width - handleSize / 2,
            y: activeBoxObj.y + activeBoxObj.height / 2 - handleSize / 2,
            cursor: 'e-resize',
          }, // right
        ];

        handles.forEach(handle => {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
          ctx.strokeStyle = activeBoxObj.color;
          ctx.lineWidth = 2;
          ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);
        });

        // Add a label with the box ID for active box
        if (activeBoxObj.textRef) {
          ctx.fillStyle = activeBoxObj.color;
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText(`Linked`, activeBoxObj.x, activeBoxObj.y - 8);
        }
      }
    }

    // Draw the box being created
    if (isDrawing) {
      const width = currentPos.x - startPos.x;
      const height = currentPos.y - startPos.y;

      ctx.strokeStyle = '#00AAFF';
      ctx.lineWidth = 2;
      ctx.strokeRect(startPos.x, startPos.y, width, height);

      // Draw a semi-transparent fill
      ctx.fillStyle = '#00AAFF33';
      ctx.fillRect(startPos.x, startPos.y, width, height);
    }
  }, [image, boxes, isDrawing, startPos, currentPos, activeBox]);

  // Get resize handle at position
  const getResizeHandle = (x: number, y: number): string | null => {
    if (!activeBox) return null;

    const box = boxes.find(b => b.id === activeBox);
    if (!box) return null;

    const handleSize = 100;
    const handles = [
      { x: box.x - handleSize / 2, y: box.y - handleSize / 2, handle: 'nw' }, // top-left
      { x: box.x + box.width - handleSize / 2, y: box.y - handleSize / 2, handle: 'ne' }, // top-right
      { x: box.x - handleSize / 2, y: box.y + box.height - handleSize / 2, handle: 'sw' }, // bottom-left
      { x: box.x + box.width - handleSize / 2, y: box.y + box.height - handleSize / 2, handle: 'se' }, // bottom-right
      { x: box.x + box.width / 2 - handleSize / 2, y: box.y - handleSize / 2, handle: 'n' }, // top
      { x: box.x + box.width / 2 - handleSize / 2, y: box.y + box.height - handleSize / 2, handle: 's' }, // bottom
      { x: box.x - handleSize / 2, y: box.y + box.height / 2 - handleSize / 2, handle: 'w' }, // left
      { x: box.x + box.width - handleSize / 2, y: box.y + box.height / 2 - handleSize / 2, handle: 'e' }, // right
    ];

    for (const handle of handles) {
      if (x >= handle.x && x <= handle.x + handleSize && y >= handle.y && y <= handle.y + handleSize) {
        return handle.handle;
      }
    }
    return null;
  };

  // Handle mouse down to start drawing, resizing, or dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Calculate the actual position on the canvas, accounting for scaling
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    // Check if we're clicking on a resize handle
    const handle = getResizeHandle(x, y);
    if (handle && activeBox) {
      setIsResizing(true);
      setResizeHandle(handle);
      setOriginalBox(boxes.find(b => b.id === activeBox) || null);
      setStartPos({ x, y });
      setCurrentPos({ x, y });
      return;
    }

    // Check if we're clicking on a box
    // First check if we're clicking on the active box
    if (activeBox) {
      const activeBoxObj = boxes.find(box => box.id === activeBox);
      if (
        activeBoxObj &&
        x >= activeBoxObj.x &&
        x <= activeBoxObj.x + activeBoxObj.width &&
        y >= activeBoxObj.y &&
        y <= activeBoxObj.y + activeBoxObj.height
      ) {
        // Start dragging the active box
        setIsDragging(true);
        setDragOffset({ x: x - activeBoxObj.x, y: y - activeBoxObj.y });
        setOriginalBox(activeBoxObj);
        return;
      }
    }

    // Then check other boxes
    for (let i = boxes.length - 1; i >= 0; i--) {
      const box = boxes[i];
      if (x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height) {
        handleBoxSelect(box.id);

        // Start dragging the box
        setIsDragging(true);
        setDragOffset({ x: x - box.x, y: y - box.y });
        setOriginalBox(box);
        return;
      }
    }

    // Start drawing a new box
    setStartPos({ x, y });
    setCurrentPos({ x, y });
    setIsDrawing(true);
  };

  // Handle mouse move to update the current position
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Calculate the actual position on the canvas, accounting for scaling
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    // Update cursor based on hover position
    if (!isResizing && !isDrawing && !isDragging) {
      const handle = getResizeHandle(x, y);
      if (handle) {
        const cursorMap: { [key: string]: string } = {
          nw: 'nw-resize',
          ne: 'ne-resize',
          sw: 'sw-resize',
          se: 'se-resize',
          n: 'n-resize',
          s: 's-resize',
          w: 'w-resize',
          e: 'e-resize',
        };
        canvas.style.cursor = cursorMap[handle] || 'crosshair';
      } else {
        // Check if hovering over a box
        const hoveredBox = boxes.find(
          box => x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height
        );
        canvas.style.cursor = hoveredBox ? 'move' : 'crosshair';
      }
    }

    if (isDragging && originalBox && activeBox) {
      // Update box position during drag
      const newX = x - dragOffset.x;
      const newY = y - dragOffset.y;

      // Ensure box stays within canvas bounds
      const clampedX = Math.max(0, Math.min(newX, canvas.width - originalBox.width));
      const clampedY = Math.max(0, Math.min(newY, canvas.height - originalBox.height));

      const newBox = { ...originalBox, x: clampedX, y: clampedY };
      setBoxes(boxes.map(b => (b.id === activeBox ? newBox : b)));
    } else if (isResizing && originalBox && resizeHandle) {
      setCurrentPos({ x, y });

      // Update the box based on resize handle
      const newBox = { ...originalBox };
      const deltaX = x - startPos.x;
      const deltaY = y - startPos.y;

      switch (resizeHandle) {
        case 'nw':
          newBox.x = originalBox.x + deltaX;
          newBox.y = originalBox.y + deltaY;
          newBox.width = originalBox.width - deltaX;
          newBox.height = originalBox.height - deltaY;
          break;
        case 'ne':
          newBox.y = originalBox.y + deltaY;
          newBox.width = originalBox.width + deltaX;
          newBox.height = originalBox.height - deltaY;
          break;
        case 'sw':
          newBox.x = originalBox.x + deltaX;
          newBox.width = originalBox.width - deltaX;
          newBox.height = originalBox.height + deltaY;
          break;
        case 'se':
          newBox.width = originalBox.width + deltaX;
          newBox.height = originalBox.height + deltaY;
          break;
        case 'n':
          newBox.y = originalBox.y + deltaY;
          newBox.height = originalBox.height - deltaY;
          break;
        case 's':
          newBox.height = originalBox.height + deltaY;
          break;
        case 'w':
          newBox.x = originalBox.x + deltaX;
          newBox.width = originalBox.width - deltaX;
          break;
        case 'e':
          newBox.width = originalBox.width + deltaX;
          break;
      }

      // Ensure minimum size
      if (newBox.width > 10 && newBox.height > 10) {
        setBoxes(boxes.map(b => (b.id === activeBox ? newBox : b)));
      }
    } else if (isDrawing) {
      setCurrentPos({ x, y });
    }
  };

  // Handle mouse up to finish drawing, resizing, or dragging
  const handleMouseUp = () => {
    if (isResizing) {
      setIsResizing(false);
      setResizeHandle(null);
      setOriginalBox(null);
    } else if (isDragging) {
      setIsDragging(false);
      setDragOffset({ x: 0, y: 0 });
      setOriginalBox(null);
    } else if (isDrawing) {
      const width = currentPos.x - startPos.x;
      const height = currentPos.y - startPos.y;

      // Only create a box if it has some size
      if (Math.abs(width) > 5 && Math.abs(height) > 5) {
        const newBox: BoundingBox = {
          id: crypto.randomUUID(),
          x: width > 0 ? startPos.x : currentPos.x,
          y: height > 0 ? startPos.y : currentPos.y,
          width: Math.abs(width),
          height: Math.abs(height),
          color: getRandomColor(),
          textRef: null,
        };

        setBoxes([...boxes, newBox]);
        handleBoxSelect(newBox.id);
      }

      setIsDrawing(false);
    }
  };

  // Handle file upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setImage(img);
        // Clear existing boxes when loading a new image
        setBoxes([]);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Generate a random color for the box
  const getRandomColor = () => {
    const colors = ['#FF5733', '#33FF57', '#3357FF', '#FF33F5', '#33FFF5', '#F5FF33', '#FF3333', '#33FF33'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Delete the active box
  const deleteActiveBox = () => {
    if (!activeBox) return;

    setBoxes(boxes.filter(box => box.id !== activeBox));
    handleBoxSelect(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full space-y-4" ref={containerRef}>
      {/* Image Canvas Area */}
      <div className="flex-1 min-h-[400px] border rounded-lg bg-muted/20 overflow-auto">
        <div className="relative inline-block">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="max-w-full cursor-crosshair transition-transform"
            style={{
              display: image ? 'block' : 'none',
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          />

          {!image && (
            <div className="flex items-center justify-center w-full h-64 bg-muted/20">
              <div className="text-center">
                <Icon icon="upload" className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground font-medium">Upload an image to annotate</p>
                <p className="text-xs text-muted-foreground mt-1">Supports JPG, PNG, and other image formats</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-3">
          <Button
            icon={<Icon icon="zoom-out" />}
            onClick={() => setScale(Math.max(0.5, scale - 0.1))}
            disabled={scale <= 0.5}
            className="hover:shadow-sm transition-all"
          >
            Zoom Out
          </Button>
          <span className="text-sm font-medium px-3 py-1 bg-background rounded border">{Math.round(scale * 100)}%</span>
          <Button
            icon={<Icon icon="zoom-in" />}
            onClick={() => setScale(Math.min(2, scale + 0.1))}
            disabled={scale >= 2}
            className="hover:shadow-sm transition-all"
          >
            Zoom In
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Button
            icon={<Icon icon="delete" />}
            onClick={deleteActiveBox}
            disabled={!activeBox}
            className="hover:shadow-sm transition-all"
          >
            Delete Box
          </Button>
          <div className="relative">
            <input
              type="file"
              id="image-upload"
              accept="image/*"
              onChange={handleImageUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button icon={<Icon icon="upload" />} className="hover:shadow-sm transition-all">
              Upload Image
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
