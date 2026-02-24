import { describe, it, expect, vi } from 'vitest';
import { toOpenClawTools } from '../../src/adapters/openclaw-adapter.js';
import type { ToolDefinition } from '../../src/core/tools/types.js';

describe('openclaw adapter', () => {
  const mockTools: ToolDefinition[] = [
    {
      name: 'bridge_test',
      description: 'A test tool',
      parameters: {
        name: { type: 'string', description: 'Name', required: true },
        count: { type: 'number', description: 'Count', required: false, default: 10 },
        status: { type: 'string', description: 'Status', enum: ['a', 'b'] },
      },
      handler: vi.fn().mockResolvedValue({ success: true, data: 'ok' }),
    },
  ];

  it('converts tools to OpenClaw format', () => {
    const ocTools = toOpenClawTools(mockTools);
    expect(ocTools).toHaveLength(1);
    expect(ocTools[0]!.name).toBe('bridge_test');
    expect(ocTools[0]!.description).toBe('A test tool');
  });

  it('includes parameter metadata', () => {
    const ocTools = toOpenClawTools(mockTools);
    const params = ocTools[0]!.parameters;
    expect(params['name']).toEqual({
      type: 'string',
      description: 'Name',
      required: true,
    });
  });

  it('includes default values in parameters', () => {
    const ocTools = toOpenClawTools(mockTools);
    const params = ocTools[0]!.parameters;
    expect(params['count']).toEqual(
      expect.objectContaining({ default: 10 }),
    );
  });

  it('includes enum values in parameters', () => {
    const ocTools = toOpenClawTools(mockTools);
    const params = ocTools[0]!.parameters;
    expect(params['status']).toEqual(
      expect.objectContaining({ enum: ['a', 'b'] }),
    );
  });

  it('execute calls the original handler', async () => {
    const ocTools = toOpenClawTools(mockTools);
    const result = await ocTools[0]!.execute({ name: 'test' });
    expect(result.success).toBe(true);
    expect(mockTools[0]!.handler).toHaveBeenCalledWith({ name: 'test' });
  });

  it('execute catches errors and returns failure', async () => {
    const errorTool: ToolDefinition = {
      name: 'bridge_error',
      description: 'Fails',
      parameters: {},
      handler: vi.fn().mockRejectedValue(new Error('boom')),
    };
    const ocTools = toOpenClawTools([errorTool]);
    const result = await ocTools[0]!.execute({});
    expect(result.success).toBe(false);
    expect(result.error).toBe('boom');
  });
});
