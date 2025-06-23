import { useAnnotation } from '@/hooks/use-annotation';
import { Card, Divider, NonIdealState, NonIdealStateIconSize, Tag, Text } from '@blueprintjs/core';

import './index.css';

export default function BoundingBoxList() {
  const { boxes, activeBox, handleBoxSelect } = useAnnotation();

  return (
    <Card className="flex-1 flex flex-col h-full !p-px">
      <div className="flex px-2 py-1 items-center gap-2">
        <Text className="bp5-text-small font-bold">BOUNDING BOXES</Text>
        <Tag>{boxes.length}</Tag>
      </div>
      <Divider className="!m-0" />

      <div className="p-4 space-y-4 bg-[#1c2127]">
        {boxes.length === 0 ? (
          <NonIdealState
            className="py-2"
            layout="horizontal"
            icon="warning-sign"
            iconSize={NonIdealStateIconSize.EXTRA_SMALL}
            iconMuted={false}
            title={<Text className="bp5-ui-text !font-bold">No bounding boxes created yet</Text>}
            description={<Text className="bp5-text-small">Draw on the image to get started.</Text>}
          />
        ) : (
          boxes.map(box => (
            <span
              key={box.id}
              className="block p-3 bounding-box"
              style={activeBox === box.id ? { borderColor: box.color } : undefined}
              onClick={() => handleBoxSelect(box.id)}
            >
              <div className="flex items-center justify-between">
                <Text>Box #{box.id.slice(0, 8)}</Text>
                <Tag color={box.color}>{box.textRef ? 'Linked' : 'Unlinked'}</Tag>
              </div>
            </span>
          ))
        )}
      </div>
    </Card>
  );
}
