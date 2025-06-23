import { useAnnotation } from '@/hooks/use-annotation';
import { Button, Card, Divider, NonIdealState, NonIdealStateIconSize, Tag, Text, Tooltip } from '@blueprintjs/core';
import { BoundingBox } from '@/typings';
import { isNull } from 'lodash-es';
import './index.css';

/**
 * TODO: fix tooltip position for link/unlink button
 */
export default function BoundingBoxList() {
  const { boxes, activeBox, handleBoxSelect, handleHighlightSelect, unlinkAnnotations, deleteBox } = useAnnotation();

  // Handler for the link/unlink button
  const handleLinkButtonClick = (box: BoundingBox) => {
    if (box.textRef) {
      // Unlink if already linked
      unlinkAnnotations(box.id, box.textRef);
      handleHighlightSelect(null);
    }
  };

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

                <div className="flex items-center gap-2">
                  <Tooltip content={box.textRef ? 'Unlink annotation' : 'Link annotation'}>
                    <Button
                      icon={box.textRef ? 'link' : 'unlink'}
                      variant="minimal"
                      size="small"
                      disabled={isNull(box.textRef)}
                      onClick={e => {
                        e.stopPropagation();
                        handleLinkButtonClick(box);
                      }}
                    />
                  </Tooltip>
                  <Tooltip content="Delete box">
                    <Button
                      icon="trash"
                      variant="minimal"
                      size="small"
                      onClick={e => {
                        e.stopPropagation();
                        deleteBox(box.id);
                      }}
                    />
                  </Tooltip>
                </div>
              </div>
            </span>
          ))
        )}
      </div>
    </Card>
  );
}
