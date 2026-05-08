import { describe, it, expect } from 'vitest';
import { StreamTagParser } from './stream-parser';
import { aggregateEvents, applyParsedToChat } from './variables';

const TAGS = ['maintext', 'option', 'sum', 'vars', 'thinking', 'think'];
const OPAQUE = ['thinking', 'think'];

describe('variables aggregator', () => {
  it('aggregates tag-close events into ParsedTags', () => {
    const p = new StreamTagParser(TAGS, OPAQUE);
    const events = [
      ...p.feed('<thinking>plan</thinking>'),
      ...p.feed('<maintext>hi\nthere</maintext>'),
      ...p.feed('<option>A\nB</option>'),
      ...p.feed('<sum>summary</sum>'),
      ...p.feed('<vars>{"hp":10}</vars>'),
      ...p.finish(),
    ];
    const parsed = aggregateEvents(events);
    expect(parsed.thinking).toBe('plan');
    expect(parsed.maintext).toBe('hi\nthere');
    expect(parsed.options).toEqual(['A', 'B']);
    expect(parsed.sum).toBe('summary');
    expect(parsed.varsRaw).toBe('{"hp":10}');
    expect(parsed.varsCommands.merge).toEqual({ hp: 10 });
  });

  it('applyParsedToChat returns next chat.variables and message.variablesAfter clones', () => {
    const parsed = aggregateEvents([
      { type: 'tag-close', tag: 'vars', full: '{"hp":80}' },
    ] as any);
    const { nextVariables, snapshot } = applyParsedToChat({ hp: 100, gold: 5 }, parsed);
    expect(nextVariables).toEqual({ hp: 80, gold: 5 });
    expect(snapshot).toEqual({ hp: 80, gold: 5 });
    expect(snapshot).not.toBe(nextVariables);
  });
});
