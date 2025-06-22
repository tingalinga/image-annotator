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
    boxes.forEach(box => {
      ctx.strokeStyle = box.color;
      ctx.lineWidth = box.id === activeBox ? 3 : 2;
      ctx.strokeRect(box.x, box.y, box.width, box.height);

      // Draw a semi-transparent fill for the active box
      if (box.id === activeBox) {
        ctx.fillStyle = `${box.color}33`;
        ctx.fillRect(box.x, box.y, box.width, box.height);
      }

      // Add a label with the box ID
      if (box.textRef) {
        ctx.fillStyle = box.color;
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(`Linked`, box.x, box.y - 8);
      }
    });

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

  // Handle mouse down to start drawing
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Calculate the actual position on the canvas, accounting for scaling
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    setStartPos({ x, y });
    setCurrentPos({ x, y });
    setIsDrawing(true);
  };

  // Handle mouse move to update the current position
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Calculate the actual position on the canvas, accounting for scaling
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    setCurrentPos({ x, y });
  };

  // Handle mouse up to finish drawing
  const handleMouseUp = () => {
    if (!isDrawing) return;

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
  };

  // Handle clicking on a box to select it
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!canvasRef.current || isDrawing) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Calculate the actual position on the canvas, accounting for scaling
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    // Check if we clicked on a box
    for (let i = boxes.length - 1; i >= 0; i--) {
      const box = boxes[i];
      if (x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height) {
        handleBoxSelect(box.id);
        return;
      }
    }

    // If we didn't click on a box, deselect
    handleBoxSelect(null);
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
            onClick={handleCanvasClick}
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
