import { Node } from 'reactflow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';

interface SidebarProps {
  selectedNode: Node | null;
  updateNodeData: (id: string, data: any) => void;
}

export function Sidebar({ selectedNode, updateNodeData }: SidebarProps) {
  const [label, setLabel] = useState(selectedNode?.data.label || '');
  const [prompt, setPrompt] = useState(selectedNode?.data.prompt || '');

  if (!selectedNode) {
    return (
      <div className="w-80 border-l p-4 bg-gray-50">
        <h2 className="text-lg font-semibold mb-4">Node Properties</h2>
        <p className="text-gray-500">
          Select a node to configure its properties
        </p>
      </div>
    );
  }

  const handleSave = () => {
    updateNodeData(selectedNode.id, {
      label,
      ...(selectedNode.data.type === 'llm' ? { prompt } : {}),
    });
  };

  return (
    <div className="w-80 border-l p-4 bg-gray-50">
      <h2 className="text-lg font-semibold mb-4">Node Properties</h2>
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="type">Type</Label>
          <Input
            id="type"
            value={selectedNode.data.type}
            disabled
            className="mt-1"
          />
        </div>
        {selectedNode.data.type === 'llm' && (
          <div>
            <Label htmlFor="prompt">Prompt</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="mt-1"
            />
          </div>
        )}
        <Button className="w-full" onClick={handleSave}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}
