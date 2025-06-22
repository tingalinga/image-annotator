import { useState, useCallback } from 'react';

interface PanZoomState {
  scale: number;
  panOffset: { x: number; y: number };
}

interface PanZoomActions {
  setScale: (scale: number) => void;
  setPanOffset: (offset: { x: number; y: number }) => void;
  resetView: () => void;
  updatePan: (deltaX: number, deltaY: number) => void;
}

export const usePanZoom = (initialScale: number = 1): PanZoomState & PanZoomActions => {
  const [scale, setScale] = useState(initialScale);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

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

  return {
    scale,
    panOffset,
    setScale,
    setPanOffset,
    resetView,
    updatePan,
  };
};
