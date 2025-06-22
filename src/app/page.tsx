'use client';

import ImageAnnotator from '@/components/image-annotator';
import TextAnnotator from '@/components/text-annotator';
import { BoundingBox, TextHighlight } from '@/typings';
import { useState } from 'react';

export default function Annotator() {
  const [boxes, setBoxes] = useState<BoundingBox[]>([]);
  const [highlights, setHighlights] = useState<TextHighlight[]>([]);
  const [activeBox, setActiveBox] = useState<string | null>(null);
  const [activeHighlight, setActiveHighlight] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [autoLink, setAutoLink] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editableText, setEditableText] = useState(
    `One human is playing ball, while another is watching. The ball is bright red and bouncing high in the air. In the background, there's a tree providing shade on this sunny day. A small dog is sitting nearby, observing the game with curiosity.`
  );

  // Link box to highlight and vice versa
  const linkAnnotations = (boxId: string, highlightId: string) => {
    const box = boxes.find(b => b.id === boxId);
    const highlight = highlights.find(h => h.id === highlightId);

    if (box && highlight) {
      // Use the highlight's color for both to ensure they match
      const sharedColor = highlight.color;

      setBoxes(boxes.map(b => (b.id === boxId ? { ...b, textRef: highlightId, color: sharedColor } : b)));

      setHighlights(highlights.map(h => (h.id === highlightId ? { ...h, boxRef: boxId, color: sharedColor } : h)));
    }
  };

  // Handle when a box is selected
  const handleBoxSelect = (boxId: string | null) => {
    setActiveBox(boxId);

    if (!boxId) {
      return;
    }

    const selectedBox = boxes.find(box => box.id === boxId);

    // If the box is already linked to a highlight, make that highlight active
    if (selectedBox?.textRef) {
      setActiveHighlight(selectedBox.textRef);
    }
    // If auto-link is enabled and there's an active highlight that isn't already linked, link them
    else if (autoLink && activeHighlight) {
      const highlight = highlights.find(h => h.id === activeHighlight);
      if (highlight && !highlight.boxRef) {
        linkAnnotations(boxId, activeHighlight);
      }
    }
  };

  // Handle when a highlight is selected
  const handleHighlightSelect = (highlightId: string | null) => {
    setActiveHighlight(highlightId);

    if (!highlightId) {
      return;
    }

    const selectedHighlight = highlights.find(highlight => highlight.id === highlightId);

    // If the highlight is already linked to a box, make that box active
    if (selectedHighlight?.boxRef) {
      setActiveBox(selectedHighlight.boxRef);
    }
    // If auto-link is enabled and there's an active box that isn't already linked, link them
    else if (autoLink && activeBox) {
      const box = boxes.find(b => b.id === activeBox);
      if (box && !box.textRef) {
        linkAnnotations(activeBox, highlightId);
      }
    }
  };

  // Generate a JSON export of the annotations
  const exportAnnotations = () => {
    const data = {
      boxes,
      highlights,
      text: editableText,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'annotations.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Clear all annotations
  const clearAnnotations = () => {
    setBoxes([]);
    setHighlights([]);
    setActiveBox(null);
    setActiveHighlight(null);
  };

  return (
    <div className="flex flex-col items-center justify-items-center min-h-screen p-8 gap-16">
      <div>toolbar</div>
      <div className="flex">
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
