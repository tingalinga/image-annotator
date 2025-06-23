# Image Annotator

## Live Demo

Try the app online: [https://image-annotator-murex.vercel.app/](https://image-annotator-murex.vercel.app/)

A web-based annotation tool built with Next.js for annotating images and text. Supports bounding box creation, text highlights, and linking between them. Designed for usability and extensibility.

## Features

- **Image Annotation**: Draw, move, and resize bounding boxes on images.
- **Text Annotation**: Highlight text spans, with support for multi-line and overlapping highlights.
- **Linking**: Link bounding boxes to text highlights and vice versa. Visual indication of linked items.
- **Highlight Synchronization**: Highlights update automatically as you edit the text (insertion, deletion, typing within highlights, etc.).
- **Unlinking**: Easily unlink boxes and highlights.
- **Annotation Management**: Delete boxes or highlights, clear all annotations, and export annotation data.
- **Modern UI**: Built with Blueprint.js and Tailwind CSS for a clean, responsive interface.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

- **Draw bounding boxes**: Click and drag on the image.
- **Highlight text**: Select text with your mouse to create a highlight.
- **Link/unlink**: Use the link/unlink buttons in the box and highlight lists.
- **Edit text**: Use the edit mode to change the text. Highlights will update automatically.
- **Delete**: Use the trash/delete icons to remove boxes or highlights.
- **Export**: Export all annotations as JSON.

## Annotation Logic

- **Highlight synchronization**: When editing text, highlights shift and resize to stay in sync. If you type or delete inside or near a highlight, its start/end and text are updated. Highlights after the edit are shifted accordingly.
- **Linked tags**: The "Linked" tag appears only once per unique highlight, even if the highlight spans multiple lines.
- **Unlinking**: Unlink a box or highlight using the link/unlink button. Deleting a box or highlight also unlinks it from any associated items.

## Developer Notes

- **Component structure**: Main logic is in `src/components/text-annotator` and `src/components/image-annotator`.
- **Highlight update logic**: See `src/utils/text-highlights.ts` for text diffing and highlight synchronization.
- **State management**: Uses Zustand for global annotation state.
- **Styling**: Uses Tailwind CSS and Blueprint.js. (You can add or update styles in the relevant CSS modules.)
- **Extensibility**: Utility functions and annotation logic are modular for easy extension.

## Contributing

Pull requests and issues are welcome! Please open an issue to discuss major changes.
