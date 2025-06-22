import type { BoundingBox } from '@/typings';

// Constants
export const HANDLE_SIZE = 50;
export const MIN_BOX_SIZE = 10;
export const MIN_DRAW_SIZE = 5;

// Color palette for bounding boxes
const BOX_COLORS = ['#FF5733', '#33FF57', '#3357FF', '#FF33F5', '#33FFF5', '#F5FF33', '#FF3333', '#33FF33'];

// Cursor mapping for resize handles
export const RESIZE_CURSORS: Record<string, string> = {
  nw: 'nw-resize',
  ne: 'ne-resize',
  sw: 'sw-resize',
  se: 'se-resize',
  n: 'n-resize',
  s: 's-resize',
  w: 'w-resize',
  e: 'e-resize',
};

// Generate a random color for bounding boxes
export const getRandomColor = (): string => {
  return BOX_COLORS[Math.floor(Math.random() * BOX_COLORS.length)];
};

// Get resize handles for a bounding box
export const getResizeHandles = (box: BoundingBox, handleSize: number = HANDLE_SIZE) => {
  return [
    { x: box.x - handleSize / 2, y: box.y - handleSize / 2, handle: 'nw' }, // top-left
    { x: box.x + box.width - handleSize / 2, y: box.y - handleSize / 2, handle: 'ne' }, // top-right
    { x: box.x - handleSize / 2, y: box.y + box.height - handleSize / 2, handle: 'sw' }, // bottom-left
    { x: box.x + box.width - handleSize / 2, y: box.y + box.height - handleSize / 2, handle: 'se' }, // bottom-right
    { x: box.x + box.width / 2 - handleSize / 2, y: box.y - handleSize / 2, handle: 'n' }, // top
    { x: box.x + box.width / 2 - handleSize / 2, y: box.y + box.height - handleSize / 2, handle: 's' }, // bottom
    { x: box.x - handleSize / 2, y: box.y + box.height / 2 - handleSize / 2, handle: 'w' }, // left
    { x: box.x + box.width - handleSize / 2, y: box.y + box.height / 2 - handleSize / 2, handle: 'e' }, // right
  ];
};

// Get resize handle at position
export const getResizeHandleAtPosition = (
  x: number,
  y: number,
  box: BoundingBox,
  handleSize: number = HANDLE_SIZE
): string | null => {
  const handles = getResizeHandles(box, handleSize);

  for (const handle of handles) {
    if (x >= handle.x && x <= handle.x + handleSize && y >= handle.y && y <= handle.y + handleSize) {
      return handle.handle;
    }
  }
  return null;
};

// Transform screen coordinates to canvas coordinates
export const screenToCanvas = (
  screenX: number,
  screenY: number,
  canvas: HTMLCanvasElement,
  panOffset: { x: number; y: number },
  scale: number
) => {
  const rect = canvas.getBoundingClientRect();

  // Convert screen coordinates to canvas coordinates
  const canvasX = (screenX - rect.left) * (canvas.width / rect.width);
  const canvasY = (screenY - rect.top) * (canvas.height / rect.height);

  // Apply inverse transformations
  const transformedX = (canvasX - panOffset.x) / scale;
  const transformedY = (canvasY - panOffset.y) / scale;

  return { x: transformedX, y: transformedY };
};

// Check if a point is inside a bounding box
export const isPointInBox = (x: number, y: number, box: BoundingBox): boolean => {
  return x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height;
};

// Find box at position (returns the topmost box)
export const getBoxAtPosition = (x: number, y: number, boxes: BoundingBox[]): BoundingBox | null => {
  for (let i = boxes.length - 1; i >= 0; i--) {
    const box = boxes[i];
    if (isPointInBox(x, y, box)) {
      return box;
    }
  }
  return null;
};

// Create a new bounding box from start and current positions
export const createBoundingBox = (
  startPos: { x: number; y: number },
  currentPos: { x: number; y: number }
): BoundingBox => {
  const width = currentPos.x - startPos.x;
  const height = currentPos.y - startPos.y;

  return {
    id: crypto.randomUUID(),
    x: width > 0 ? startPos.x : currentPos.x,
    y: height > 0 ? startPos.y : currentPos.y,
    width: Math.abs(width),
    height: Math.abs(height),
    color: getRandomColor(),
    textRef: null,
  };
};

// Update box position during drag
export const updateBoxPosition = (
  box: BoundingBox,
  newX: number,
  newY: number,
  canvasWidth: number,
  canvasHeight: number,
  scale: number
): BoundingBox => {
  const clampedX = Math.max(0, Math.min(newX, canvasWidth / scale - box.width));
  const clampedY = Math.max(0, Math.min(newY, canvasHeight / scale - box.height));

  return { ...box, x: clampedX, y: clampedY };
};

// Update box size during resize
export const updateBoxSize = (
  originalBox: BoundingBox,
  resizeHandle: string,
  deltaX: number,
  deltaY: number
): BoundingBox => {
  const newBox = { ...originalBox };

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

  return newBox;
};
