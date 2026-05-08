import { describe, it, expect } from 'vitest';
import { importMultipleLorebooks, renameLorebook } from './importer';
import type { SillyTavernLorebookExport } from './types';

const stub = (name: string): SillyTavernLorebookExport => ({
  name,
  description: '',
  entries: {},
});

describe('importer multi/rename', () => {
  it('returns success and failure lists', () => {
    const results = importMultipleLorebooks([
      { fileName: 'a.json', json: stub('a') },
      { fileName: 'b.json', json: 'broken' as any },
    ]);
    expect(results.successes).toHaveLength(1);
    expect(results.failures).toHaveLength(1);
    expect(results.successes[0].lorebook.name).toBe('a');
    expect(results.failures[0].fileName).toBe('b.json');
  });

  it('renameLorebook replaces only the name', () => {
    const lb = { id: '1', name: 'old', entries: [], createdAt: 0, updatedAt: 0,
                 recursiveScanning: true, caseSensitive: false, matchWholeWords: false };
    const next = renameLorebook(lb, 'new');
    expect(next.name).toBe('new');
    expect(next.id).toBe('1');
    expect(next.updatedAt).toBeGreaterThanOrEqual(lb.updatedAt);
  });
});
