import './index.css';

import { Button, Card, Divider, NonIdealState, NonIdealStateIconSize, Tag, Text, Tooltip } from '@blueprintjs/core';
import { isNull } from 'lodash-es';

import { useAnnotation } from '@/hooks/use-annotation';
import { TextHighlight } from '@/typings';

export default function TextAnnotationList() {
  const { highlights, activeHighlight, handleBoxSelect, handleHighlightSelect, unlinkAnnotations, deleteHighlight } =
    useAnnotation();

  // Handler for the link/unlink button
  const handleLinkButtonClick = (highlight: TextHighlight) => {
    if (highlight.boxRef) {
      // Unlink if already linked
      unlinkAnnotations(highlight.id, highlight.boxRef);
      handleBoxSelect(null);
    }
  };

  return (
    <Card className="flex-1 flex flex-col h-full !p-px">
      <div className="flex px-2 py-1 items-center gap-2">
        <Text className="bp5-text-small font-bold">TEXT HIGHLIGHTS</Text>
        <Tag>{highlights.length}</Tag>
      </div>
      <Divider className="!m-0" />

      <div className="p-4 space-y-4 bg-[#1c2127]">
        {highlights.length === 0 ? (
          <NonIdealState
            className="py-2"
            layout="horizontal"
            icon="warning-sign"
            iconSize={NonIdealStateIconSize.EXTRA_SMALL}
            iconMuted={false}
            title={<Text className="bp5-ui-text !font-bold">No text highlights created yet</Text>}
            description={<Text className="bp5-text-small">Select text to get started.</Text>}
          />
        ) : (
          highlights.map(highlight => (
            <div
              key={highlight.id}
              className="block p-3 text-highlight"
              style={activeHighlight === highlight.id ? { borderColor: highlight.color } : undefined}
              onClick={() => handleHighlightSelect(highlight.id)}
            >
              <div className="flex items-center justify-between">
                <Text ellipsize className="max-w-[200px]">
                  &ldquo;{highlight.text}&rdquo;
                </Text>
                <div className="flex items-center gap-2">
                  <Tooltip content={highlight.boxRef ? 'Unlink box' : 'Link box'}>
                    <Button
                      icon={highlight.boxRef ? 'link' : 'unlink'}
                      variant="minimal"
                      size="small"
                      disabled={isNull(highlight.boxRef)}
                      onClick={e => {
                        e.stopPropagation();
                        handleLinkButtonClick(highlight);
                      }}
                    />
                  </Tooltip>
                  <Tooltip content="Delete annotation">
                    <Button
                      icon="trash"
                      variant="minimal"
                      size="small"
                      onClick={e => {
                        e.stopPropagation();
                        deleteHighlight(highlight.id);
                      }}
                    />
                  </Tooltip>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
