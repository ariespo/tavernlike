import { useCallback, useMemo, useRef } from 'react';
import { createApiRouter, type ApiRouter } from '../sillytavern/api-router';
import type { ApiSettings, Task } from '../sillytavern/types';

export interface SendStreamArgs {
  task: Task;
  messages: Array<{ role: string; content: string }>;
  onChunk: (text: string) => void;
}

export function useApiRouter(api: ApiSettings) {
  const abortRef = useRef<AbortController | null>(null);
  const router: ApiRouter = useMemo(() => createApiRouter(api), [api]);

  const sendStream = useCallback(async (args: SendStreamArgs) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const { task, messages, onChunk } = args;
    const { response } = await router.call(task, { messages, stream: true });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No body');
    const decoder = new TextDecoder();
    let buf = '';
    while (true) {
      if (abortRef.current?.signal.aborted) {
        await reader.cancel();
        throw new Error('aborted');
      }
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const parts = buf.split('\n\n');
      buf = parts.pop() ?? '';
      for (const part of parts) {
        const lines = part.split('\n').filter(l => l.startsWith('data: '));
        for (const line of lines) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') return;
          try {
            const json = JSON.parse(data);
            const delta: string = json?.choices?.[0]?.delta?.content ?? '';
            if (delta) onChunk(delta);
          } catch {
            // ignore bad line
          }
        }
      }
    }
  }, [router]);

  const abort = useCallback(() => abortRef.current?.abort(), []);

  return { sendStream, abort, targetFor: router.targetFor };
}
