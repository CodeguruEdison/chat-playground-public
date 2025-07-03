import { Handle, Position, NodeResizer } from 'reactflow';

interface WorkflowNodeProps {
  id: string;
  data: {
    label: string;
    type: 'input' | 'llm' | 'output';
    width?: number;
    height?: number;
    onResize?: (size: { width: number; height: number }) => void;
  };
  selected?: boolean;
}

const nodeStyles = {
  input: 'bg-blue-100 border-blue-500',
  llm: 'bg-green-100 border-green-500',
  output: 'bg-purple-100 border-purple-500',
};

export function WorkflowNode({ id, data, selected }: WorkflowNodeProps) {
  const style = nodeStyles[data.type];
  return (
    <div
      style={{ width: data.width || 200, height: data.height || 80 }}
      className={`relative p-4 rounded-lg border-2 ${style} min-w-[120px] min-h-[60px] flex flex-col items-center justify-center`}
    >
      <NodeResizer
        color="#888"
        isVisible={selected}
        minWidth={120}
        minHeight={60}
        onResize={(e, size) => data.onResize?.(size)}
      />
      {data.type !== 'input' && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 bg-gray-400"
        />
      )}
      <div className="text-center w-full">
        <div className="font-semibold truncate">{data.label}</div>
        <div className="text-sm text-gray-600">{data.type}</div>
      </div>
      {data.type !== 'output' && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 bg-gray-400"
        />
      )}
    </div>
  );
}
