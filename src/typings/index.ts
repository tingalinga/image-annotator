export type BoundingBox = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  textRef: string | null;
};

export type TextHighlight = {
  id: string;
  start: number;
  end: number;
  text: string;
  color: string;
  boxRef: string | null;
};
