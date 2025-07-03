'use client';

import { useCallback, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { WorkflowNode } from './workflow-node';
import { Sidebar } from './sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const nodeTypes = {
  workflowNode: WorkflowNode,
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'workflowNode',
    position: { x: 250, y: 100 },
    data: { label: 'Input Node', type: 'input', width: 200, height: 80 },
  },
  {
    id: '2',
    type: 'workflowNode',
    position: { x: 250, y: 250 },
    data: { label: 'LLM Node', type: 'llm', width: 200, height: 80 },
  },
  {
    id: '3',
    type: 'workflowNode',
    position: { x: 250, y: 400 },
    data: { label: 'Output Node', type: 'output', width: 200, height: 80 },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
];

export function WorkflowBuilder() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [workflowName, setWorkflowName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Handler to update node size
  const handleResize = useCallback(
    (id: string, size: { width: number; height: number }) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === id ? { ...node, data: { ...node.data, ...size } } : node,
        ),
      );
    },
    [setNodes],
  );

  // Pass onResize to each node's data
  const nodesWithResize = nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      onResize: (size: { width: number; height: number }) =>
        handleResize(node.id, size),
    },
  }));

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node);
  }, []);

  // Update node data from sidebar
  const updateNodeData = (id: string, data: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...data } } : node,
      ),
    );
  };

  const saveWorkflow = async () => {
    if (!workflowName) {
      alert('Please enter a workflow name');
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: workflowName,
          description: 'A sample workflow',
          steps: nodes.map((node) => ({
            name: node.data.label,
            type: node.data.type,
            position: node.position,
            config: {},
            width: node.data.width,
            height: node.data.height,
          })),
          connections: edges.map((edge) => ({
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle,
          })),
        }),
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      alert('Workflow saved successfully!');
    } catch (error) {
      console.error('Error saving workflow:', error);
      alert('Failed to save workflow. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const exportWorkflow = () => {
    const workflow = {
      name: workflowName,
      steps: nodes,
      connections: edges,
    };
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(workflow, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute(
      'download',
      `${workflowName || 'workflow'}.json`,
    );
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-4 flex items-center gap-4">
        <div className="flex-1">
          <Label htmlFor="workflow-name">Workflow Name</Label>
          <Input
            id="workflow-name"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            placeholder="Enter workflow name"
            className="mt-1"
          />
        </div>
        <Button onClick={saveWorkflow} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Workflow'}
        </Button>
        <Button onClick={exportWorkflow} variant="outline">
          Export as JSON
        </Button>
      </div>
      <div className="flex-1 flex">
        <div className="flex-1">
          <ReactFlow
            nodes={nodesWithResize}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>
        <Sidebar selectedNode={selectedNode} updateNodeData={updateNodeData} />
      </div>
    </div>
  );
}
