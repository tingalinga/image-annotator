'use client';

import type React from 'react';
import { useRef, useEffect } from 'react';
import { Button, Card, Divider, FileInput, NonIdealState, Slider, Text, Tooltip } from '@blueprintjs/core';
import { useAnnotation } from '@/hooks/use-annotation';
import { useMouseInteractions } from '@/hooks/use-mouse-interactions';
import { useImageLoader } from '@/hooks/use-image-loader';
import { drawCanvas } from '@/utils/canvas-drawing';
import classNames from 'classnames';

export default function ImageAnnotator() {
  const { boxes, setBoxes, activeBox, handleBoxSelect } = useAnnotation();
  const { image, handleImageUpload, initialized, isLoading } = useImageLoader({
    defaultSrc: '/images/hand-xray.png',
    onImageChange: () => {
      setBoxes([]);
      resetView();
    },
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    scale,
    panOffset,
    isDrawing,
    startPos,
    currentPos,
    setScale,
    resetView,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  } = useMouseInteractions();

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

  useEffect(() => {
    if (initialized && image) {
      resetView();
    }
  }, [initialized, image, resetView]);

  // Delete active box
  const deleteActiveBox = () => {
    if (!activeBox) return;
    setBoxes(boxes.filter(box => box.id !== activeBox));
    handleBoxSelect(null);
  };

  // Mouse event handlers
  const onMouseDown = (e: React.MouseEvent) => {
    handleMouseDown(e, {
      boxes,
      activeBox,
      handleBoxSelect,
      setBoxes,
      canvasRef,
    });
  };

  const onMouseMove = (e: React.MouseEvent) => {
    handleMouseMove(e, {
      boxes,
      activeBox,
      setBoxes,
      canvasRef,
    });
  };

  const onMouseUp = () => {
    handleMouseUp({
      boxes,
      handleBoxSelect,
      setBoxes,
    });
  };

  return (
    <Card className="flex-1 flex flex-col h-full !p-0" ref={containerRef}>
      <div className="flex px-2 py-1 justify-between items-center">
        <Text className="bp5-text-small font-bold">IMAGE ANNOTATOR</Text>

        {/* Right */}
        <div className="flex items-center gap-4">
          {/* TODO: Remove and add to context menu + hotkey */}
          <Tooltip content="Delete box">
            <Button
              icon="delete-clip"
              variant="minimal"
              size="small"
              onClick={deleteActiveBox}
              disabled={!activeBox}
              className="hover:shadow-sm transition-all"
            />
          </Tooltip>
          <div className="flex items-center gap-2">
            <Button icon="minus" variant="minimal" size="small" onClick={() => setScale(scale - 0.1)} />
            <Slider min={0.2} max={3} stepSize={0.01} value={scale} labelRenderer={false} onChange={setScale} />
            <Button icon="plus" variant="minimal" size="small" onClick={() => setScale(scale + 0.1)} />
          </div>
          <Tooltip content="Reset view">
            <Button icon="reset" variant="minimal" size="small" onClick={resetView} />
          </Tooltip>
        </div>
      </div>

      <Divider className="!m-0" />

      <div
        className={classNames('min-h-[400px] flex items-center justify-center p-px', {
          'bp5-skeleton': isLoading || !initialized,
        })}
      >
        {image ? (
          <canvas
            ref={canvasRef}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
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
    </Card>
  );
}
