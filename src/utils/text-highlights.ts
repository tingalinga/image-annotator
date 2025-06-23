// Utility functions for text highlight diffing and updates
import { TextHighlight } from '@/typings';

export function findTextDiff(oldText: string, newText: string) {
  let start = 0;
  while (start < oldText.length && start < newText.length && oldText[start] === newText[start]) {
    start++;
  }
  let endOld = oldText.length - 1;
  let endNew = newText.length - 1;
  while (endOld >= start && endNew >= start && oldText[endOld] === newText[endNew]) {
    endOld--;
    endNew--;
  }
  return {
    index: start,
    removed: oldText.slice(start, endOld + 1),
    added: newText.slice(start, endNew + 1),
  };
}

export function updateHighlightsOnTextChange(
  oldText: string,
  newText: string,
  highlights: TextHighlight[]
): TextHighlight[] {
  const diff = findTextDiff(oldText, newText);
  let newHighlights = highlights.map(h => ({ ...h }));
  if (diff) {
    const { index, removed, added } = diff;
    const delta = added.length - removed.length;
    newHighlights = newHighlights
      .map(h => {
        // Edit before highlight: shift
        if (index <= h.start) {
          return {
            ...h,
            start: h.start + delta,
            end: h.end + delta,
            text: newText.slice(h.start + delta, h.end + delta),
          };
        }
        // Edit inside highlight
        if (index > h.start && index <= h.end) {
          return {
            ...h,
            end: h.end + delta,
            text: newText.slice(h.start, h.end + delta),
          };
        }
        // Edit after highlight: no change
        return {
          ...h,
          text: newText.slice(h.start, h.end),
        };
      })
      .filter(h => h.end > h.start && h.start >= 0 && h.end <= newText.length);
  }
  return newHighlights;
}
