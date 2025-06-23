'use client';

import { Button, Navbar, Switch } from '@blueprintjs/core';
import { ChangeEvent } from 'react';

import BoundingBoxList from '@/components/bounding-box-list';
import ImageAnnotator from '@/components/image-annotator';
import TextAnnotationList from '@/components/text-annotation-list';
import TextAnnotator from '@/components/text-annotator';
import { useAnnotation } from '@/hooks/use-annotation';

export default function Annotator() {
  const { autoLink, setAutoLink, clearAnnotations, exportAnnotations } = useAnnotation();

  const toggle = (setter: (value: boolean) => void) => {
    return (input: ChangeEvent<HTMLInputElement>) => {
      setter(input.target.checked);
    };
  };

  return (
    <div className="flex flex-col items-center justify-items-center w-full min-h-screen">
      <Navbar className="!sticky top-0 z-50">
        <Navbar.Group align="left">
          <Navbar.Heading>Image Annotation Tool</Navbar.Heading>
        </Navbar.Group>
        <Navbar.Group align="right" className="flex item-center gap-2">
          <Switch
            id="auto-link"
            label="Auto-link annotations"
            checked={autoLink}
            onChange={toggle(setAutoLink)}
            className="!m-0"
          />
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

      <div className="flex p-2 gap-2">
        <ImageAnnotator />
        <TextAnnotator />
      </div>

      <div className="flex w-full p-2 gap-2">
        <BoundingBoxList />
        <TextAnnotationList />
      </div>
    </div>
  );
}
