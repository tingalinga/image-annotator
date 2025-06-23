import { useAnnotation } from '@/hooks/use-annotation';
import { Card, Divider, NonIdealState, NonIdealStateIconSize, Tag, Text } from '@blueprintjs/core';

import './index.css';

export default function TextAnnotationList() {
  const { highlights, activeHighlight, handleHighlightSelect } = useAnnotation();

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
                <Tag color={highlight.color}>{highlight.boxRef ? 'Linked' : 'Unlinked'}</Tag>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
