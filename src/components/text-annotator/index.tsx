'use client';

import './index.css';

import { Button, Card, Divider, Tag, Text, TextArea, Tooltip } from '@blueprintjs/core';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';

import { useAnnotation } from '@/hooks/use-annotation';
import { TextHighlight } from '@/typings';
import { getRandomColor } from '@/utils/image-annotator';
import { updateHighlightsOnTextChange } from '@/utils/text-highlights';

/**
 * TODO: Support editing highlight by dragging instead of clicking reduce and extend buttons
 * TODO: Support context menu for highlights to: delete, unlink
 * TODO: Fix renderHighlightedText logic
 */
export default function TextAnnotator() {
  const {
    highlights,
    setHighlights,
    setBoxes,
    activeHighlight,
    handleHighlightSelect,
    handleBoxSelect,
    editableText,
    setEditableText,
    deleteHighlight,
    isEditMode,
    setIsEditMode,
  } = useAnnotation();

  const containerRef = useRef<HTMLDivElement>(null);
  const [isExtendingHighlight, setIsExtendingHighlight] = useState(false);
  const [isReducingHighlight, setIsReducingHighlight] = useState(false);

  const toggleIsEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  const prevTextRef = useRef(editableText);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    const oldText = prevTextRef.current;
    const newHighlights = updateHighlightsOnTextChange(oldText, newText, highlights);

    // Find removed highlights
    const removedHighlightIds = highlights.filter(h => !newHighlights.some(nh => nh.id === h.id)).map(h => h.id);

    // Unlink boxes whose textRef matches a removed highlight
    if (removedHighlightIds.length > 0) {
      setBoxes(boxes =>
        boxes.map(box => (removedHighlightIds.includes(box.textRef ?? '') ? { ...box, textRef: null } : box))
      );
    }

    setEditableText(newText);
    setHighlights(newHighlights);
    prevTextRef.current = newText;
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
                  text: editableText.substring(newStart, newEnd),
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
                      text: editableText.substring(end, h.end),
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
                      text: editableText.substring(h.start, start),
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
      handleHighlightSelect(newHighlight.id);
    }

    // Clear the selection
    selection.removeAllRanges();
  };

  // Delete the active highlight
  const deleteActiveHighlight = () => {
    if (activeHighlight) deleteHighlight(activeHighlight);
  };

  // Render the text with highlights
  const renderHighlightedText = () => {
    if (!editableText) return null;

    // If there is an active highlight, render it as a single unbroken span
    if (activeHighlight) {
      const active = highlights.find(h => h.id === activeHighlight);
      if (active) {
        const before = editableText.substring(0, active.start);
        const highlighted = editableText.substring(active.start, active.end);
        const after = editableText.substring(active.end);
        return [
          before && <span key="before">{before}</span>,
          <span
            key="active-highlight"
            className="active-highlight"
            style={{
              backgroundColor: `${active.color}40`,
              border: `2px solid ${active.color}`,
            }}
            onClick={() => {
              if (active.id) {
                handleHighlightSelect(null);
                handleBoxSelect(null);
              } else {
                handleHighlightSelect(active.id);
              }
            }}
          >
            {highlighted}
            {active.boxRef && (
              <span className="linked-tag" style={{ backgroundColor: active.color }}>
                Linked
              </span>
            )}
          </span>,
          after && <span key="after">{after}</span>,
        ];
      }
    }

    // Otherwise, render all highlights as solid color, no gradient, allow overlap but no merging
    // Create an array of markup points
    const markupPoints: { position: number; highlightId: string; isStart: boolean; color: string; hasLink: boolean }[] =
      [];
    highlights.forEach(highlight => {
      markupPoints.push({
        position: highlight.start,
        highlightId: highlight.id,
        isStart: true,
        color: highlight.color,
        hasLink: !!highlight.boxRef,
      });
      markupPoints.push({
        position: highlight.end,
        highlightId: highlight.id,
        isStart: false,
        color: highlight.color,
        hasLink: !!highlight.boxRef,
      });
    });
    markupPoints.sort(
      (a: { position: number; isStart: boolean }, b: { position: number; isStart: boolean }) =>
        a.position - b.position || (a.isStart ? 1 : -1)
    );

    const result = [];
    let lastPosition = 0;
    const openHighlights = [];
    const renderedLinkedTag = new Set<string>();
    for (let i = 0; i < markupPoints.length; i++) {
      const point = markupPoints[i];
      if (point.position > lastPosition) {
        const segment = editableText.substring(lastPosition, point.position);
        if (openHighlights.length === 0) {
          result.push(<span key={`text-${lastPosition}`}>{segment}</span>);
        } else {
          // Use the topmost highlight for color
          const top = openHighlights[openHighlights.length - 1];
          const showLinkedTag = top.hasLink && !renderedLinkedTag.has(top.highlightId);
          result.push(
            <span
              key={`text-${lastPosition}`}
              className="highlight"
              style={{ backgroundColor: `${top.color}40` }}
              onClick={() => handleHighlightSelect(top.highlightId)}
            >
              {segment}
              {showLinkedTag && (
                <span className="linked-tag" style={{ backgroundColor: top.color }}>
                  Linked
                </span>
              )}
            </span>
          );
          if (showLinkedTag) {
            renderedLinkedTag.add(top.highlightId);
          }
        }
      }
      if (point.isStart) {
        openHighlights.push(point);
      } else {
        const idx = openHighlights.findIndex(h => h.highlightId === point.highlightId);
        if (idx !== -1) openHighlights.splice(idx, 1);
      }
      lastPosition = point.position;
    }
    if (lastPosition < editableText.length) {
      result.push(<span key={`text-${lastPosition}`}>{editableText.substring(lastPosition)}</span>);
    }
    return result;
  };

  // Reset modification modes when active highlight changes
  useEffect(() => {
    setIsExtendingHighlight(false);
    setIsReducingHighlight(false);
  }, [activeHighlight]);

  // Precompute highlighted text markup before return
  const highlightedTextMarkup = renderHighlightedText();

  return (
    <Card className="flex-1 flex flex-col h-full !p-0 overflow-hidden">
      <div className="flex px-2 py-1 justify-between items-center">
        <div className="flex items-center gap-4">
          <Text className="bp5-text-small font-bold">TEXT ANNOTATOR</Text>
          <Tag>
            {highlights.length} highlight{highlights.length !== 1 ? 's' : ''}
          </Tag>
        </div>

        {/* Right */}
        <div className="flex items-center gap-4">
          {/* TODO: Remove and add to context menu + hotkey */}

          {activeHighlight && (
            <>
              <Button
                icon="minus"
                size="small"
                onClick={() => {
                  setIsReducingHighlight(!isReducingHighlight);
                  setIsExtendingHighlight(false);
                }}
                active={isReducingHighlight}
              >
                Reduce
              </Button>
              <Button
                icon="plus"
                size="small"
                onClick={() => {
                  setIsExtendingHighlight(!isExtendingHighlight);
                  setIsReducingHighlight(false);
                }}
                active={isExtendingHighlight}
              >
                Extend
              </Button>
            </>
          )}
          <Tooltip content="Delete annotation">
            <Button
              icon="key-delete"
              variant="minimal"
              size="small"
              onClick={deleteActiveHighlight}
              disabled={!activeHighlight}
            />
          </Tooltip>
          <Tooltip content={isEditMode ? 'Confirm' : 'Edit'}>
            <Button icon={isEditMode ? 'tick' : 'edit'} variant="minimal" size="small" onClick={toggleIsEditMode} />
          </Tooltip>
        </div>
      </div>

      <Divider className="!m-0" />

      {/* Text Content Area */}
      <div className="flex flex-col min-h-[400px]">
        <div
          ref={containerRef}
          className="flex-1 grow p-4 h-full leading-loose m-px bg-[#1c2127] overflow-auto"
          onMouseUp={handleTextSelection}
        >
          {isEditMode ? (
            <TextArea className="min-h-[200px] w-full" fill value={editableText} onChange={handleTextChange} />
          ) : editableText ? (
            highlightedTextMarkup
          ) : (
            <Text className="bp5-text-muted select-none">Select text to highlight and link to bounding boxes</Text>
          )}
        </div>
      </div>
    </Card>
  );
}
