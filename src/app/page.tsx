'use client';

import ImageAnnotator from '@/components/image-annotator';
import TextAnnotator from '@/components/text-annotator';
import { useAnnotation } from '@/hooks/use-annotation';
import { Button, Navbar, Switch } from '@blueprintjs/core';
import { ChangeEvent } from 'react';

export default function Annotator() {
  const {
    boxes,
    setBoxes,
    highlights,
    setHighlights,
    activeBox,
    activeHighlight,
    isDrawing,
    setIsDrawing,
    autoLink,
    setAutoLink,
    isEditMode,
    setIsEditMode,
    editableText,
    setEditableText,
    handleBoxSelect,
    handleHighlightSelect,
    clearAnnotations,
    exportAnnotations,
  } = useAnnotation();

  const toggle = (setter: (value: boolean) => void) => {
    return (input: ChangeEvent<HTMLInputElement>) => {
      setter(input.target.checked);
    };
  };

  return (
    <div className="flex flex-col items-center justify-items-center w-full min-h-screen gap-4">
      <Navbar className="!sticky top-0 z-50">
        <Navbar.Group align="left">
          <Navbar.Heading>Image Annotation Tool</Navbar.Heading>
        </Navbar.Group>
        <Navbar.Group align="right">
          <Switch id="auto-link" label="Auto-link annotations" checked={autoLink} onChange={toggle(setAutoLink)} />
          <Switch id="edit-mode" label="Edit text" checked={isEditMode} onChange={toggle(setIsEditMode)} />
          <Button icon="download" onClick={exportAnnotations} className="hover:bg-accent">
            Export
          </Button>
          <Button
            icon="delete"
            onClick={clearAnnotations}
            className="hover:bg-destructive hover:text-destructive-foreground"
          >
            Clear All
          </Button>
        </Navbar.Group>
      </Navbar>

      <div className="flex p-8 gap-4">
        <ImageAnnotator
          boxes={boxes}
          setBoxes={setBoxes}
          activeBox={activeBox}
          setActiveBox={handleBoxSelect}
          isDrawing={isDrawing}
          setIsDrawing={setIsDrawing}
        />
        <TextAnnotator
          text={editableText}
          highlights={highlights}
          setHighlights={setHighlights}
          activeHighlight={activeHighlight}
          setActiveHighlight={handleHighlightSelect}
          isEditMode={isEditMode}
          onTextChange={setEditableText}
        />
      </div>
    </div>
  );
}
