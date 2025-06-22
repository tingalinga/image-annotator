'use client';

import { TextHighlight } from '@/typings';
import { Button } from '@blueprintjs/core';
import type React from 'react';
import { useRef, useState, useEffect } from 'react';

interface TextAnnotatorProps {
  text: string;
  highlights: TextHighlight[];
  setHighlights: React.Dispatch<React.SetStateAction<TextHighlight[]>>;
  activeHighlight: string | null;
  setActiveHighlight: (id: string | null) => void;
  isEditMode: boolean;
  onTextChange: (text: string) => void;
}

export default function TextAnnotator({
  text,
  highlights,
  setHighlights,
  activeHighlight,
  setActiveHighlight,
  isEditMode,
  onTextChange,
}: TextAnnotatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isExtendingHighlight, setIsExtendingHighlight] = useState(false);
  const [isReducingHighlight, setIsReducingHighlight] = useState(false);

  const handleTextChange = (newText: string) => {
    onTextChange(newText);
    // Clear highlights when text is changed to avoid misaligned highlights
    if (newText !== text) {
      setHighlights([]);
      setActiveHighlight(null);
    }
  };

  // Handle text selection for creating new highlights
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const container = containerRef.current;

    if (!container || !container.contains(range.commonAncestorContainer)) {
      return;
    }

    // Calculate the start and end positions relative to the text content
    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(container);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const start = preSelectionRange.toString().length;

    const selectedText = selection.toString();
    if (!selectedText.trim()) return;

    const end = start + selectedText.length;

    // If we're in extending mode and have an active highlight, extend it
    if (isExtendingHighlight && activeHighlight) {
      const activeHighlightObj = highlights.find(h => h.id === activeHighlight);
      if (activeHighlightObj) {
        // Determine how to extend the highlight
        const newStart = Math.min(activeHighlightObj.start, start);
        const newEnd = Math.max(activeHighlightObj.end, end);

        setHighlights(
          highlights.map(h =>
            h.id === activeHighlight
              ? {
                  ...h,
                  start: newStart,
                  end: newEnd,
                  text: text.substring(newStart, newEnd),
                }
              : h
          )
        );
      }
    }
    // If we're in reducing mode and have an active highlight, reduce it
    else if (isReducingHighlight && activeHighlight) {
      const activeHighlightObj = highlights.find(h => h.id === activeHighlight);
      if (activeHighlightObj) {
        // Check if selection is within the highlight
        if (start >= activeHighlightObj.start && end <= activeHighlightObj.end) {
          // If selection is at the beginning
          if (start === activeHighlightObj.start) {
            setHighlights(
              highlights.map(h =>
                h.id === activeHighlight
                  ? {
                      ...h,
                      start: end,
                      text: text.substring(end, h.end),
                    }
                  : h
              )
            );
          }
          // If selection is at the end
          else if (end === activeHighlightObj.end) {
            setHighlights(
              highlights.map(h =>
                h.id === activeHighlight
                  ? {
                      ...h,
                      end: start,
                      text: text.substring(h.start, start),
                    }
                  : h
              )
            );
          }
        }
      }
    }
    // Otherwise create a new highlight
    else if (!isExtendingHighlight && !isReducingHighlight) {
      // Create a new highlight
      const newHighlight: TextHighlight = {
        id: crypto.randomUUID(),
        start,
        end,
        text: selectedText,
        color: getRandomColor(),
        boxRef: null,
      };

      setHighlights([...highlights, newHighlight]);
      setActiveHighlight(newHighlight.id);
    }

    // Clear the selection
    selection.removeAllRanges();
  };

  // Reset modification modes when active highlight changes
  useEffect(() => {
    setIsExtendingHighlight(false);
    setIsReducingHighlight(false);
  }, [activeHighlight]);

  // Generate a random color for the highlight
  const getRandomColor = () => {
    const colors = [
      '#FF5733', // Orange-red
      '#33FF57', // Bright green
      '#3357FF', // Blue
      '#FF33F5', // Pink
      '#33FFF5', // Cyan
      '#F5FF33', // Yellow
      '#FF3333', // Red
      '#33FF33', // Green
      '#9933FF', // Purple
      '#FF9933', // Orange
      '#33FFAA', // Mint
      '#AA33FF', // Violet
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Delete the active highlight
  const deleteActiveHighlight = () => {
    if (!activeHighlight) return;

    setHighlights(highlights.filter(highlight => highlight.id !== activeHighlight));
    setActiveHighlight(null);
  };

  // Render the text with highlights
  const renderHighlightedText = () => {
    if (!text) return null;

    // Create an array of "markup points" - points where highlighting starts or ends
    const markupPoints: {
      position: number;
      highlightId: string;
      isStart: boolean;
      color: string;
      isActive: boolean;
      hasLink: boolean;
    }[] = [];

    // Add all start and end points
    highlights.forEach(highlight => {
      markupPoints.push({
        position: highlight.start,
        highlightId: highlight.id,
        isStart: true,
        color: highlight.color,
        isActive: highlight.id === activeHighlight,
        hasLink: !!highlight.boxRef,
      });

      markupPoints.push({
        position: highlight.end,
        highlightId: highlight.id,
        isStart: false,
        color: highlight.color,
        isActive: highlight.id === activeHighlight,
        hasLink: !!highlight.boxRef,
      });
    });

    // Sort by position
    markupPoints.sort((a, b) => {
      if (a.position !== b.position) return a.position - b.position;
      return a.isStart ? 1 : -1;
    });

    const result = [];
    let lastPosition = 0;
    const activeHighlights: {
      id: string;
      color: string;
      isActive: boolean;
      hasLink: boolean;
    }[] = [];

    // Process each markup point
    for (let i = 0; i < markupPoints.length; i++) {
      const point = markupPoints[i];

      // Add text segment before this point
      if (point.position > lastPosition) {
        const segment = text.substring(lastPosition, point.position);

        if (activeHighlights.length === 0) {
          result.push(<span key={`text-${lastPosition}`}>{segment}</span>);
        } else {
          const sortedHighlights = [...activeHighlights].sort((a, b) => {
            if (a.isActive && !b.isActive) return 1;
            if (!a.isActive && b.isActive) return -1;
            return 0;
          });

          const backgroundColor = sortedHighlights.map(h => `${h.color}40`).join(', ');
          const borderColor = sortedHighlights.find(h => h.isActive)?.color;
          const hasLinks = sortedHighlights.some(h => h.hasLink);

          result.push(
            <span
              key={`text-${lastPosition}`}
              style={{
                backgroundColor: sortedHighlights.length > 1 ? 'transparent' : backgroundColor,
                background: sortedHighlights.length > 1 ? `linear-gradient(to right, ${backgroundColor})` : undefined,
                padding: '2px 4px',
                borderRadius: '4px',
                cursor: 'pointer',
                border: borderColor ? `2px solid ${borderColor}` : 'none',
                position: 'relative',
                boxShadow: sortedHighlights.length > 1 ? '0 0 0 1px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s ease',
              }}
              className="hover:shadow-sm"
              onClick={() => {
                const topHighlight = sortedHighlights[sortedHighlights.length - 1];
                setActiveHighlight(topHighlight.id);
              }}
            >
              {segment}
              {hasLinks && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-18px',
                    right: '0',
                    fontSize: '10px',
                    backgroundColor: sortedHighlights.find(h => h.hasLink)?.color || '#000',
                    color: '#fff',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: '500',
                  }}
                >
                  Linked
                </span>
              )}
            </span>
          );
        }
      }

      // Update active highlights
      if (point.isStart) {
        activeHighlights.push({
          id: point.highlightId,
          color: point.color,
          isActive: point.isActive,
          hasLink: point.hasLink,
        });
      } else {
        const index = activeHighlights.findIndex(h => h.id === point.highlightId);
        if (index !== -1) {
          activeHighlights.splice(index, 1);
        }
      }

      lastPosition = point.position;
    }

    // Add any remaining text
    if (lastPosition < text.length) {
      result.push(<span key={`text-${lastPosition}`}>{text.substring(lastPosition)}</span>);
    }

    return result;
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Text Content Area */}
      <div className="flex-1 min-h-[400px] border rounded-lg bg-muted/20 overflow-hidden">
        {isEditMode ? (
          <textarea
            value={text}
            onChange={e => handleTextChange(e.target.value)}
            className="w-full h-full p-4 text-base bg-transparent border-none resize-none focus:outline-none leading-relaxed"
            placeholder="Enter your text here to annotate..."
          />
        ) : (
          <div
            ref={containerRef}
            className="p-4 text-base leading-relaxed h-full overflow-auto"
            onMouseUp={handleTextSelection}
          >
            {text ? (
              renderHighlightedText()
            ) : (
              <div className="text-muted-foreground italic">Select text to highlight and link to bounding boxes</div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
        <div className="text-sm text-muted-foreground font-medium">
          {isEditMode
            ? `${text.length} characters`
            : `${highlights.length} highlight${highlights.length !== 1 ? 's' : ''}`}
        </div>

        {!isEditMode && (
          <div className="flex items-center gap-3">
            {activeHighlight && (
              <>
                <Button
                  icon="plus"
                  onClick={() => {
                    setIsExtendingHighlight(!isExtendingHighlight);
                    setIsReducingHighlight(false);
                  }}
                  className="hover:shadow-sm transition-all"
                >
                  Extend
                </Button>
                <Button
                  icon="minus"
                  onClick={() => {
                    setIsReducingHighlight(!isReducingHighlight);
                    setIsExtendingHighlight(false);
                  }}
                  className="hover:shadow-sm transition-all"
                >
                  Reduce
                </Button>
              </>
            )}
            <Button
              icon="delete"
              onClick={deleteActiveHighlight}
              disabled={!activeHighlight}
              className="hover:shadow-sm transition-all"
            >
              Delete
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
