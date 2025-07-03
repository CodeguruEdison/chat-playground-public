'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function ExecuteWorkflowPage({
  params,
}: {
  params: { id: string };
}) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const executeWorkflow = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/workflows/${params.id}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input }),
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setOutput(data.result);
    } catch (error) {
      console.error('Error executing workflow:', error);
      setOutput('Error executing workflow. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Execute Workflow</h1>

      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <Label htmlFor="input">Input</Label>
          <Textarea
            id="input"
            placeholder="Enter your input here..."
            className="mt-1"
            rows={4}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>

        <Button
          className="w-full"
          onClick={executeWorkflow}
          disabled={isLoading}
        >
          {isLoading ? 'Executing...' : 'Execute Workflow'}
        </Button>

        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Output</h2>
          <div className="bg-gray-50 p-4 rounded">
            {output ? (
              <p className="whitespace-pre-wrap">{output}</p>
            ) : (
              <p className="text-gray-500">Results will appear here...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
