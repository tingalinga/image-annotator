import { create } from 'zustand';
import { BoundingBox, TextHighlight } from '@/typings';

interface AnnotationState {
  // State
  boxes: BoundingBox[];
  highlights: TextHighlight[];
  activeBox: string | null;
  activeHighlight: string | null;
  isDrawing: boolean;
  autoLink: boolean;
  isEditMode: boolean;
  editableText: string;

  // Actions
  setBoxes: (boxes: BoundingBox[]) => void;
  setHighlights: (highlights: TextHighlight[]) => void;
  setActiveBox: (boxId: string | null) => void;
  setActiveHighlight: (highlightId: string | null) => void;
  setIsDrawing: (isDrawing: boolean) => void;
  setAutoLink: (autoLink: boolean) => void;
  setIsEditMode: (isEditMode: boolean) => void;
  setEditableText: (text: string) => void;

  // Business logic
  linkAnnotations: (boxId: string, highlightId: string) => void;
  handleBoxSelect: (boxId: string | null) => void;
  handleHighlightSelect: (highlightId: string | null) => void;
  clearAnnotations: () => void;
  exportAnnotations: () => void;
  unlinkAnnotations: (boxId: string, highlightId: string) => void;
  deleteBox: (boxId: string) => void;
  deleteHighlight: (highlightId: string) => void;
}

export const useAnnotationStore = create<AnnotationState>((set, get) => {
  // Utility functions
  const validateId = (id: string | null): boolean => {
    return id !== null && id !== undefined && id.trim() !== '';
  };

  const findBoxById = (boxes: BoundingBox[], id: string): BoundingBox | undefined => {
    return boxes.find(box => box.id === id);
  };

  const findHighlightById = (highlights: TextHighlight[], id: string): TextHighlight | undefined => {
    return highlights.find(highlight => highlight.id === id);
  };

  const unlinkExistingConnections = (boxId: string, highlightId: string) => {
    const { boxes, highlights } = get();

    // Remove any existing connections for this box or highlight
    const updatedBoxes = boxes.map(box => {
      if (box.id === boxId || box.textRef === highlightId) {
        return { ...box, textRef: null };
      }
      return box;
    });

    const updatedHighlights = highlights.map(highlight => {
      if (highlight.id === highlightId || highlight.boxRef === boxId) {
        return { ...highlight, boxRef: null };
      }
      return highlight;
    });

    return { updatedBoxes, updatedHighlights };
  };

  return {
    // Initial state
    boxes: [],
    highlights: [],
    activeBox: null,
    activeHighlight: null,
    isDrawing: false,
    autoLink: true,
    isEditMode: false,
    editableText: `One human is playing ball, while another is watching. The ball is bright red and bouncing high in the air. In the background, there's a tree providing shade on this sunny day. A small dog is sitting nearby, observing the game with curiosity.`,

    // Basic setters
    setBoxes: boxes => set({ boxes }),
    setHighlights: highlights => set({ highlights }),
    setActiveBox: activeBox => set({ activeBox }),
    setActiveHighlight: activeHighlight => set({ activeHighlight }),
    setIsDrawing: isDrawing => set({ isDrawing }),
    setAutoLink: autoLink => set({ autoLink }),
    setIsEditMode: isEditMode => set({ isEditMode }),
    setEditableText: editableText => set({ editableText }),

    // Business logic
    linkAnnotations: (boxId: string, highlightId: string) => {
      // Validate inputs
      if (!validateId(boxId) || !validateId(highlightId)) {
        console.warn('Invalid boxId or highlightId provided to linkAnnotations');
        return;
      }

      const { boxes, highlights } = get();
      const box = findBoxById(boxes, boxId);
      const highlight = findHighlightById(highlights, highlightId);

      if (!box || !highlight) {
        console.warn('Box or highlight not found for linking');
        return;
      }

      // Unlink any existing connections
      const { updatedBoxes, updatedHighlights } = unlinkExistingConnections(boxId, highlightId);
      const sharedColor = highlight.color;

      // Create new link
      set({
        boxes: updatedBoxes.map(b => (b.id === boxId ? { ...b, textRef: highlightId, color: sharedColor } : b)),
        highlights: updatedHighlights.map(h =>
          h.id === highlightId ? { ...h, boxRef: boxId, color: sharedColor } : h
        ),
      });
    },

    handleBoxSelect: (boxId: string | null) => {
      const { boxes, highlights, activeHighlight, autoLink } = get();

      set({ activeBox: boxId });

      if (!validateId(boxId)) return;

      const selectedBox = findBoxById(boxes, boxId!);
      if (!selectedBox) return;

      // If box has existing link, activate the linked highlight
      if (selectedBox.textRef) {
        set({ activeHighlight: selectedBox.textRef });
        return;
      }

      // Auto-link if enabled and there's an active highlight without a box
      if (autoLink && validateId(activeHighlight)) {
        const highlight = findHighlightById(highlights, activeHighlight!);
        if (highlight && !highlight.boxRef) {
          get().linkAnnotations(boxId!, activeHighlight!);
          return;
        }
      }

      set({ activeHighlight: null });
    },

    handleHighlightSelect: (highlightId: string | null) => {
      const { highlights, boxes, activeBox, autoLink } = get();

      set({ activeHighlight: highlightId });

      if (!validateId(highlightId)) return;

      const selectedHighlight = findHighlightById(highlights, highlightId!);
      if (!selectedHighlight) return;

      // If highlight has existing link, activate the linked box
      if (selectedHighlight.boxRef) {
        set({ activeBox: selectedHighlight.boxRef });
        return;
      }
      // Auto-link if enabled and there's an active box without a highlight
      if (autoLink && validateId(activeBox)) {
        const box = findBoxById(boxes, activeBox!);
        if (box && !box.textRef) {
          get().linkAnnotations(activeBox!, highlightId!);
          return;
        }
      }

      set({ activeBox: null });
    },

    clearAnnotations: () => {
      set({
        boxes: [],
        highlights: [],
        activeBox: null,
        activeHighlight: null,
      });
    },

    exportAnnotations: () => {
      try {
        const { boxes, highlights, editableText } = get();

        const data = {
          boxes,
          highlights,
          text: editableText,
          exportedAt: new Date().toISOString(),
        };

        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });

        // Check if we're in a browser environment
        if (typeof window === 'undefined') {
          console.warn('Export is only available in browser environment');
          return;
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `annotations-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Failed to export annotations:', error);
      }
    },

    unlinkAnnotations: (boxId: string, highlightId: string) => {
      const { boxes, highlights } = get();
      // Only unlink the specified box and highlight
      set({
        boxes: boxes.map(box => (box.id === boxId && box.textRef === highlightId ? { ...box, textRef: null } : box)),
        highlights: highlights.map(highlight =>
          highlight.id === highlightId && highlight.boxRef === boxId ? { ...highlight, boxRef: null } : highlight
        ),
      });
    },

    deleteBox: (boxId: string) => {
      const { boxes, highlights } = get();
      set({
        boxes: boxes.filter(box => box.id !== boxId),
        highlights: highlights.map(h => (h.boxRef === boxId ? { ...h, boxRef: null } : h)),
        activeBox: null,
      });
    },

    deleteHighlight: (highlightId: string) => {
      const { boxes, highlights } = get();
      set({
        highlights: highlights.filter(h => h.id !== highlightId),
        boxes: boxes.map(b => (b.textRef === highlightId ? { ...b, textRef: null } : b)),
        activeHighlight: null,
      });
    },
  };
});
