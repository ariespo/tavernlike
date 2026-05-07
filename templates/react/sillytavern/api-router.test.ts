import { describe, it, expect, vi } from 'vitest';
import { createApiRouter } from './api-router';

const baseSettings = {
  baseUrl: 'https://primary',
  apiKey: 'pk',
  model: 'm1',
  timeout: 60000,
};

describe('createApiRouter', () => {
  it('routes all tasks to primary when secondary disabled', () => {
    const r = createApiRouter(baseSettings);
    expect(r.targetFor('story')).toBe('primary');
    expect(r.targetFor('summary')).toBe('primary');
    expect(r.targetFor('vars')).toBe('primary');
  });

  it('routes summary/vars to secondary when enabled', () => {
    const r = createApiRouter({
      ...baseSettings,
      secondary: { enabled: true, baseUrl: 'https://sec', apiKey: 'sk', model: 'm2' },
    });
    expect(r.targetFor('story')).toBe('primary');
    expect(r.targetFor('summary')).toBe('secondary');
    expect(r.targetFor('vars')).toBe('secondary');
  });

  it('falls back to primary when secondary fetch throws', async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new Error('secondary down'))
      .mockResolvedValueOnce(new Response('{"ok":1}', { status: 200 }));
    const r = createApiRouter({
      ...baseSettings,
      secondary: { enabled: true, baseUrl: 'https://sec', apiKey: 'sk', model: 'm2' },
    }, { fetch: fetchMock as any });
    const res = await r.call('summary', { messages: [] });
    expect(res.targetUsed).toBe('primary');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
