# Implementation Approach & Assumptions

This document describes the core implementation approach and key assumptions made in the development of the Image Annotator project.

---

## Architecture Overview

- **Framework**: Built with Next.js (App Router, React 18).
- **State Management**: Uses Zustand for global state (boxes, highlights, active selections, edit mode, etc.).
- **UI**: Blueprint.js and Tailwind CSS for a modern, responsive interface.
- **Component Structure**:
  - `src/components/image-annotator`: Handles image display, bounding box drawing, moving, resizing.
  - `src/components/text-annotator`: Handles text display, highlight creation, editing, and linking.
  - `src/utils/text-highlights.ts`: Contains text diffing and highlight update logic.

---

## Key Implementation Details

### 1. **Bounding Boxes**

- Users can draw, move, and resize boxes on the image.
- Each box has a unique ID, color, and can be linked to a text highlight.
- Boxes are stored in global state and updated via actions.

### 2. **Text Highlights**

- Users can select text to create highlights.
- Highlights are stored as `{ id, start, end, text, color, boxRef }`.
- Multiple highlights can overlap or be adjacent.
- Highlights are visually rendered with background color and (optionally) a border if selected.

### 3. **Linking & Unlinking**

- Boxes and highlights can be linked (one-to-one relationship).
- Linking synchronizes color between box and highlight.
- Unlinking is possible from either side and is reflected in both box and highlight state.
- Only one "Linked" tag is shown per highlight, regardless of how many lines it spans.

### 4. **Text Editing & Highlight Synchronization**

- When the text is edited, highlights are updated to stay in sync:
  - If text is inserted or deleted before a highlight, its start/end are shifted.
  - If text is edited inside a highlight, its end and text are updated.
  - Highlights after the edit are shifted accordingly.
  - Highlights are removed if they become invalid (end <= start or out of bounds).
- The diffing and update logic is in `src/utils/text-highlights.ts`.

### 5. **Annotation Management**

- Users can delete boxes or highlights, which also unlinks any associated items.
- All annotations can be exported as JSON.
- "Clear All" removes all boxes and highlights.

---

## Assumptions & Design Decisions

- **Single Edit Diff**: The text diffing logic assumes a single contiguous edit (insertion or deletion) per change event. Complex multi-cursor or multi-edit scenarios are not handled.
- **One-to-One Linking**: Each box can be linked to only one highlight and vice versa. Many-to-many linking is not supported.
- **No Undo/Redo**: There is no built-in undo/redo stack for annotation actions.
- **No Persistent Storage**: All state is in-memory; annotations are lost on page reload unless exported.
- **Performance**: The app is optimized for moderate-length text and a reasonable number of boxes/highlights. Very large documents or images may require further optimization.

---

## Future Improvements

- Support editing highlight by dragging instead of clicking reduce and extend buttons.
- Support context menu for highlights to: delete, unlink.
- Fix renderHighlightedText logic for edge cases.
- Add context menu and hotkey support for annotation actions (delete, etc.).
- Fix tooltip position for link/unlink button.
- Many-to-many linking between boxes and highlights.
- Persistent storage (local or cloud).
- Undo/redo functionality.
- Enhanced accessibility and keyboard support.
- More annotation types (polygons, freehand, etc.).
