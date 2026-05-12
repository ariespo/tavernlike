import { describe, it, expect } from 'vitest';
import {
  createDefaultEntry,
  createDefaultLorebook,
  applyEntryDefaults,
  updateEntry,
  removeEntry,
  movePromptItem,
  clampNumber,
} from './editor-utils';
import type { Lorebook, LorebookEntry } from './types';

describe('createDefaultEntry', () => {
  it('returns an entry with required defaults', () => {
    const e = createDefaultEntry();
    expect(e.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(e.keys).toEqual([]);
    expect(e.secondaryKeys).toEqual([]);
    expect(e.content).toBe('');
    expect(e.order).toBe(100);
    expect(e.position).toBe('after_char');
    expect(e.selective).toBe(false);
    expect(e.selectiveLogic).toBe('and_any');
    expect(e.constant).toBe(false);
    expect(e.probability).toBe(100);
    expect(e.useProbability).toBe(false);
    expect(e.addMemo).toBe(false);
  });

  it('returns a fresh object each call', () => {
    const a = createDefaultEntry();
    const b = createDefaultEntry();
    expect(a.id).not.toBe(b.id);
  });
});

describe('createDefaultLorebook', () => {
  it('returns a lorebook with the given name and empty entries', () => {
    const lb = createDefaultLorebook('foo');
    expect(lb.name).toBe('foo');
    expect(lb.entries).toEqual([]);
    expect(lb.recursiveScanning).toBe(false);
    expect(lb.caseSensitive).toBe(false);
    expect(lb.matchWholeWords).toBe(false);
    expect(lb.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(typeof lb.createdAt).toBe('number');
    expect(typeof lb.updatedAt).toBe('number');
  });
});

describe('applyEntryDefaults', () => {
  it('fills missing fields from defaults', () => {
    const e = applyEntryDefaults({ keys: ['hello'] });
    expect(e.keys).toEqual(['hello']);
    expect(e.content).toBe('');
    expect(e.order).toBe(100);
    expect(e.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('keeps provided values', () => {
    const e = applyEntryDefaults({ id: 'abc', order: 5, probability: 50, useProbability: true });
    expect(e.id).toBe('abc');
    expect(e.order).toBe(5);
    expect(e.probability).toBe(50);
    expect(e.useProbability).toBe(true);
  });
});

describe('updateEntry', () => {
  const lb: Lorebook = {
    id: 'b',
    name: 'b',
    entries: [
      applyEntryDefaults({ id: 'e1', content: 'one' }),
      applyEntryDefaults({ id: 'e2', content: 'two' }),
    ],
    recursiveScanning: false,
    caseSensitive: false,
    matchWholeWords: false,
    createdAt: 0,
    updatedAt: 0,
  };

  it('patches matching entry and returns a new lorebook', () => {
    const next = updateEntry(lb, 'e1', { content: 'changed' });
    expect(next).not.toBe(lb);
    expect(next.entries[0].content).toBe('changed');
    expect(next.entries[1].content).toBe('two');
    expect(next.updatedAt).toBeGreaterThan(0);
  });

  it('returns original lorebook reference when id does not match', () => {
    const next = updateEntry(lb, 'nope', { content: 'x' });
    expect(next).toBe(lb);
  });
});

describe('removeEntry', () => {
  const lb: Lorebook = {
    id: 'b',
    name: 'b',
    entries: [
      applyEntryDefaults({ id: 'e1' }),
      applyEntryDefaults({ id: 'e2' }),
    ],
    recursiveScanning: false,
    caseSensitive: false,
    matchWholeWords: false,
    createdAt: 0,
    updatedAt: 0,
  };

  it('removes the matching entry', () => {
    const next = removeEntry(lb, 'e1');
    expect(next.entries).toHaveLength(1);
    expect(next.entries[0].id).toBe('e2');
  });

  it('returns original reference when id does not match', () => {
    const next = removeEntry(lb, 'nope');
    expect(next).toBe(lb);
  });
});

describe('movePromptItem', () => {
  it('moves a forward', () => {
    expect(movePromptItem(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
  });
  it('moves a backward', () => {
    expect(movePromptItem(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
  });
  it('returns original array when from === to', () => {
    const arr = ['a', 'b', 'c'];
    expect(movePromptItem(arr, 1, 1)).toBe(arr);
  });
  it('returns original array on out-of-range indices', () => {
    const arr = ['a', 'b', 'c'];
    expect(movePromptItem(arr, -1, 2)).toBe(arr);
    expect(movePromptItem(arr, 0, 99)).toBe(arr);
    expect(movePromptItem(arr, 99, 0)).toBe(arr);
  });
  it('does not mutate the input', () => {
    const arr = ['a', 'b', 'c'];
    movePromptItem(arr, 0, 2);
    expect(arr).toEqual(['a', 'b', 'c']);
  });
});

describe('clampNumber', () => {
  it('returns value within range', () => {
    expect(clampNumber(5, 0, 10)).toBe(5);
  });
  it('clamps high', () => {
    expect(clampNumber(99, 0, 10)).toBe(10);
  });
  it('clamps low', () => {
    expect(clampNumber(-1, 0, 10)).toBe(0);
  });
  it('parses numeric strings', () => {
    expect(clampNumber('7', 0, 10)).toBe(7);
  });
  it('returns fallback on NaN', () => {
    expect(clampNumber(NaN, 0, 10, 3)).toBe(3);
    expect(clampNumber('foo', 0, 10, 3)).toBe(3);
  });
  it('defaults fallback to min', () => {
    expect(clampNumber(NaN, 5, 10)).toBe(5);
  });
});
