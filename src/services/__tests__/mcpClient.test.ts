import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { McpStreamEvent } from '../../types/mcp';

// Mock import.meta.env before importing the module
vi.stubEnv('VITE_WORKER_URL', 'https://test.workers.dev/api/chat');

/**
 * Test SSE parsing logic in streamChat.
 * We mock fetch to return controlled SSE streams and verify parsed events.
 */

/** Helper: create a ReadableStream from SSE text lines */
function sseStream(lines: string[]): ReadableStream<Uint8Array> {
  const text = lines.join('\n') + '\n';
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
}

/** Helper: collect all events from the async generator */
async function collectEvents(
  gen: AsyncGenerator<McpStreamEvent>,
): Promise<McpStreamEvent[]> {
  const events: McpStreamEvent[] = [];
  for await (const event of gen) {
    events.push(event);
  }
  return events;
}

describe('streamChat SSE parsing', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('parses text_delta events', async () => {
    const { streamChat } = await import('../mcpClient');

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        body: sseStream([
          'data: {"type":"text_delta","text":"Hello"}',
          'data: {"type":"text_delta","text":" world"}',
          'data: [DONE]',
        ]),
      }),
    );

    const events = await collectEvents(
      streamChat([{ role: 'user', content: 'test' }]),
    );

    const textEvents = events.filter((e) => e.type === 'text_delta');
    expect(textEvents).toHaveLength(2);
    expect(textEvents[0].text).toBe('Hello');
    expect(textEvents[1].text).toBe('world');
    expect(events[events.length - 1].type).toBe('done');
  });

  it('parses tool_call events', async () => {
    const { streamChat } = await import('../mcpClient');

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        body: sseStream([
          'data: {"type":"tool_call","tool":{"id":"tc_1","name":"gainlab_kline","arguments":{"symbol":"BTC"}}}',
          'data: [DONE]',
        ]),
      }),
    );

    const events = await collectEvents(
      streamChat([{ role: 'user', content: 'show BTC' }]),
    );

    const toolEvents = events.filter((e) => e.type === 'tool_call');
    expect(toolEvents).toHaveLength(1);
    expect(toolEvents[0].toolCall).toMatchObject({
      id: 'tc_1',
      name: 'gainlab_kline',
      args: { symbol: 'BTC' },
    });
  });

  it('strips <think> tags from text_delta', async () => {
    const { streamChat } = await import('../mcpClient');

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        body: sseStream([
          'data: {"type":"text_delta","text":"<think>reasoning here</think>Visible text"}',
          'data: [DONE]',
        ]),
      }),
    );

    const events = await collectEvents(
      streamChat([{ role: 'user', content: 'test' }]),
    );

    const textEvents = events.filter((e) => e.type === 'text_delta');
    expect(textEvents).toHaveLength(1);
    expect(textEvents[0].text).toBe('Visible text');
  });

  it('yields error for failed HTTP response', async () => {
    const { streamChat } = await import('../mcpClient');

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      }),
    );

    const events = await collectEvents(
      streamChat([{ role: 'user', content: 'test' }]),
    );

    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('error');
    expect(events[0].error).toContain('500');
  });

  it('skips non-SSE lines gracefully', async () => {
    const { streamChat } = await import('../mcpClient');

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        body: sseStream([
          '',
          ': comment line',
          'event: ping',
          'data: {"type":"text_delta","text":"ok"}',
          'data: [DONE]',
        ]),
      }),
    );

    const events = await collectEvents(
      streamChat([{ role: 'user', content: 'test' }]),
    );

    const textEvents = events.filter((e) => e.type === 'text_delta');
    expect(textEvents).toHaveLength(1);
    expect(textEvents[0].text).toBe('ok');
  });
});
