import type { BoundingBox } from '@/typings';

import { getResizeHandles, HANDLE_SIZE } from './image-annotator';

interface DrawOptions {
  ctx: CanvasRenderingContext2D;
  image: HTMLImageElement;
  boxes: BoundingBox[];
  activeBox: string | null;
  isDrawing: boolean;
  startPos: { x: number; y: number };
  currentPos: { x: number; y: number };
  scale: number;
  panOffset: { x: number; y: number };
}

export const drawCanvas = (options: DrawOptions) => {
  const { ctx, image, boxes, activeBox, isDrawing, startPos, currentPos, scale, panOffset } = options;

  // Set canvas dimensions to match image
  const canvas = ctx.canvas;
  canvas.width = image.width;
  canvas.height = image.height;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Apply transformations for zoom and pan
  ctx.save();
  ctx.translate(panOffset.x, panOffset.y);
  ctx.scale(scale, scale);

  // Draw the image
  ctx.drawImage(image, 0, 0);

  // Draw existing boxes
  drawBoxes(ctx, boxes, activeBox);

  // Draw the box being created
  if (isDrawing) {
    drawDrawingBox(ctx, startPos, currentPos);
  }

  // Restore transformations
  ctx.restore();
};

const drawBoxes = (ctx: CanvasRenderingContext2D, boxes: BoundingBox[], activeBox: string | null) => {
  // First draw non-active boxes
  boxes.filter(box => box.id !== activeBox).forEach(box => drawBox(ctx, box, false));

  // Then draw the active box on top
  if (activeBox) {
    const activeBoxObj = boxes.find(box => box.id === activeBox);
    if (activeBoxObj) {
      drawBox(ctx, activeBoxObj, true);
    }
  }
};

const drawBox = (ctx: CanvasRenderingContext2D, box: BoundingBox, isActive: boolean) => {
  const lineWidth = isActive ? 3 : 2;
  const fillOpacity = isActive ? '50' : '20';

  // Draw box outline
  ctx.strokeStyle = box.color;
  ctx.lineWidth = lineWidth;
  ctx.strokeRect(box.x, box.y, box.width, box.height);

  // Draw semi-transparent fill
  ctx.fillStyle = `${box.color}${fillOpacity}`;
  ctx.fillRect(box.x, box.y, box.width, box.height);

  // Draw resize handles for active box
  if (isActive) {
    drawResizeHandles(ctx, box);
  }

  // Add label if box has text reference
  if (box.textRef) {
    drawBoxLabel(ctx, box);
  }
};

const drawResizeHandles = (ctx: CanvasRenderingContext2D, box: BoundingBox) => {
  const handles = getResizeHandles(box, HANDLE_SIZE);

  handles.forEach(handle => {
    // Draw handle background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(handle.x, handle.y, HANDLE_SIZE, HANDLE_SIZE);

    // Draw handle border
    ctx.strokeStyle = box.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(handle.x, handle.y, HANDLE_SIZE, HANDLE_SIZE);
  });
};

const drawBoxLabel = (ctx: CanvasRenderingContext2D, box: BoundingBox) => {
  ctx.fillStyle = box.color;
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('Linked', box.x, box.y - 8);
};

const drawDrawingBox = (
  ctx: CanvasRenderingContext2D,
  startPos: { x: number; y: number },
  currentPos: { x: number; y: number }
) => {
  const width = currentPos.x - startPos.x;
  const height = currentPos.y - startPos.y;

  // Draw outline
  ctx.strokeStyle = '#00AAFF';
  ctx.lineWidth = 2;
  ctx.strokeRect(startPos.x, startPos.y, width, height);

  // Draw semi-transparent fill
  ctx.fillStyle = '#00AAFF33';
  ctx.fillRect(startPos.x, startPos.y, width, height);
};
