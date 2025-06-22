'use client';

import ImageAnnotator from '@/components/image-annotator';
import TextAnnotator from '@/components/text-annotator';
import { useAnnotation } from '@/hooks/use-annotation';
import { Button, Card, H3, Icon, Navbar, Switch, Text } from '@blueprintjs/core';
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
      {/* Linked Annotations Section */}
      <Card>
        <H3>Linked Annotations</H3>
        <Text className="text-sm text-muted-foreground">
          View and manage connections between bounding boxes and text highlights
        </Text>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Bounding Boxes */}
          <div className="space-y-4">
            <h3 className="text-base font-medium flex items-center gap-2">
              Bounding Boxes
              <span className="px-2 py-1 text-xs bg-muted rounded-full">{boxes.length}</span>
            </h3>
            <div className="space-y-3">
              {boxes.length === 0 ? (
                <div className="flex items-center gap-3 p-4 text-sm text-muted-foreground bg-muted/30 rounded-lg border-2 border-dashed">
                  <Icon icon="warning-sign" />
                  No bounding boxes created yet. Draw on the image to get started.
                </div>
              ) : (
                boxes.map(box => (
                  <div
                    key={box.id}
                    className={`p-4 text-sm border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      box.id === activeBox ? 'ring-2 ring-primary shadow-sm bg-accent/50' : 'hover:bg-accent/30'
                    }`}
                    style={{ borderColor: box.color }}
                    onClick={() => handleBoxSelect(box.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">Box #{box.id.slice(0, 8)}</div>
                      <div
                        className="px-3 py-1 text-xs font-medium text-white rounded-full"
                        style={{ backgroundColor: box.color }}
                      >
                        {box.textRef ? 'Linked' : 'Unlinked'}
                      </div>
                    </div>
                    {box.textRef && (
                      <div className="text-xs text-muted-foreground">
                        Linked to: &ldquo;
                        {highlights.find(h => h.id === box.textRef)?.text?.slice(0, 50) || 'Unknown text'}&rdquo; ...
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Text Highlights */}
          <div className="space-y-4">
            <h3 className="text-base font-medium flex items-center gap-2">
              Text Highlights
              <span className="px-2 py-1 text-xs bg-muted rounded-full">{highlights.length}</span>
            </h3>
            <div className="space-y-3">
              {highlights.length === 0 ? (
                <div className="flex items-center gap-3 p-4 text-sm text-muted-foreground bg-muted/30 rounded-lg border-2 border-dashed">
                  <Icon icon="warning-sign" />
                  No text highlights created yet. Select text to get started.
                </div>
              ) : (
                highlights.map(highlight => (
                  <div
                    key={highlight.id}
                    className={`p-4 text-sm border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      highlight.id === activeHighlight
                        ? 'ring-2 ring-primary shadow-sm bg-accent/50'
                        : 'hover:bg-accent/30'
                    }`}
                    style={{ borderColor: highlight.color }}
                    onClick={() => handleHighlightSelect(highlight.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium truncate max-w-[200px]">&ldquo;{highlight.text}&rdquo;</div>
                      <div
                        className="px-3 py-1 text-xs font-medium text-white rounded-full"
                        style={{ backgroundColor: highlight.color }}
                      >
                        {highlight.boxRef ? 'Linked' : 'Unlinked'}
                      </div>
                    </div>
                    {highlight.boxRef && (
                      <div className="text-xs text-muted-foreground">
                        Linked to box: #{highlight.boxRef.slice(0, 8)}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
