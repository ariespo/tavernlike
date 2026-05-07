import { describe, it, expect } from 'vitest';
import { parseVarsBlock, applyVarsPatch } from './vars-merger';

describe('vars-merger', () => {
  it('parses JSON object inside <vars>', () => {
    const patch = parseVarsBlock('{"hp":10,"name":"foo"}');
    expect(patch.merge).toEqual({ hp: 10, name: 'foo' });
  });

  it('returns empty merge on invalid JSON', () => {
    const patch = parseVarsBlock('not valid');
    expect(patch.merge).toEqual({});
  });

  it('deep-merges patch into existing variables', () => {
    const existing = { stats: { hp: 100, mp: 50 }, gold: 5 };
    const patch = { merge: { stats: { hp: 80 }, gold: 10 } };
    const next = applyVarsPatch(existing, patch);
    expect(next).toEqual({ stats: { hp: 80, mp: 50 }, gold: 10 });
  });

  it('does not mutate input', () => {
    const existing = { a: { b: 1 } };
    const patch = { merge: { a: { c: 2 } } };
    applyVarsPatch(existing, patch);
    expect(existing).toEqual({ a: { b: 1 } });
  });

  it('arrays are replaced, not merged', () => {
    const existing = { tags: ['a', 'b', 'c'] };
    const patch = { merge: { tags: ['x'] } };
    const next = applyVarsPatch(existing, patch);
    expect(next.tags).toEqual(['x']);
  });
});
