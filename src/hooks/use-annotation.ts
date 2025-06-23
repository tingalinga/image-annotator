import { Dispatch, SetStateAction } from 'react';

import { useAnnotationStore } from '@/stores/annotation-store';
import { BoundingBox, TextHighlight } from '@/typings';

export const useAnnotation = () => {
  const store = useAnnotationStore();

  // Wrapper functions to match React.Dispatch<SetStateAction<T>> interface
  const setBoxesWrapper: Dispatch<SetStateAction<BoundingBox[]>> = value => {
    if (typeof value === 'function') {
      store.setBoxes(value(store.boxes));
    } else {
      store.setBoxes(value);
    }
  };

  const setHighlightsWrapper: Dispatch<SetStateAction<TextHighlight[]>> = value => {
    if (typeof value === 'function') {
      store.setHighlights(value(store.highlights));
    } else {
      store.setHighlights(value);
    }
  };

  const setIsDrawingWrapper: Dispatch<SetStateAction<boolean>> = value => {
    if (typeof value === 'function') {
      store.setIsDrawing(value(store.isDrawing));
    } else {
      store.setIsDrawing(value);
    }
  };

  return {
    ...store,
    setBoxes: setBoxesWrapper,
    setHighlights: setHighlightsWrapper,
    setIsDrawing: setIsDrawingWrapper,
  };
};
