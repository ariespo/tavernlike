import { describe, it, expect } from 'vitest';
import { StreamTagParser } from './stream-parser';

const TAGS = ['maintext', 'option', 'sum', 'vars', 'thinking', 'think'];
const OPAQUE = ['thinking', 'think'];

describe('StreamTagParser', () => {
  it('parses full response in one chunk', () => {
    const p = new StreamTagParser(TAGS, OPAQUE);
    const text =
      '<thinking>plan stuff</thinking>' +
      '<maintext>Hello\nworld</maintext>' +
      '<option>A\nB\nC</option>' +
      '<sum>summary</sum>' +
      '<vars>{"hp":10}</vars>';
    const events = [...p.feed(text), ...p.finish()];
    const closes = events.filter(e => e.type === 'tag-close');
    expect(closes.map(c => (c as any).tag)).toEqual(['thinking', 'maintext', 'option', 'sum', 'vars']);
    expect((closes.find(c => (c as any).tag === 'maintext') as any).full).toBe('Hello\nworld');
    expect((closes.find(c => (c as any).tag === 'option') as any).full).toBe('A\nB\nC');
  });

  it('handles tag split across chunks', () => {
    const p = new StreamTagParser(TAGS, OPAQUE);
    const e1 = [...p.feed('<mai')];
    const e2 = [...p.feed('ntext>hi</maintext>'), ...p.finish()];
    const close = [...e1, ...e2].find(e => e.type === 'tag-close' && (e as any).tag === 'maintext');
    expect(close).toBeTruthy();
    expect((close as any).full).toBe('hi');
  });

  it('does not parse tags inside opaque thinking block', () => {
    const p = new StreamTagParser(TAGS, OPAQUE);
    const text = '<thinking>I will write <maintext> next</thinking><maintext>real</maintext>';
    const events = [...p.feed(text), ...p.finish()];
    const opens = events.filter(e => e.type === 'tag-open').map(o => (o as any).tag);
    expect(opens).toEqual(['thinking', 'maintext']);
    const tk = events.find(e => e.type === 'tag-close' && (e as any).tag === 'thinking');
    expect((tk as any).full).toBe('I will write <maintext> next');
  });

  it('emits option-line on each newline inside option', () => {
    const p = new StreamTagParser(TAGS, OPAQUE);
    const events = [...p.feed('<option>A\nB\nC</option>'), ...p.finish()];
    const lines = events.filter(e => e.type === 'option-line').map(l => (l as any).line);
    expect(lines).toEqual(['A', 'B', 'C']);
  });

  it('flushes unclosed tag on finish()', () => {
    const p = new StreamTagParser(TAGS, OPAQUE);
    p.feed('<maintext>partial response without close');
    const events = p.finish();
    const close = events.find(e => e.type === 'tag-close' && (e as any).tag === 'maintext');
    expect(close).toBeTruthy();
    expect((close as any).full).toBe('partial response without close');
  });

  it('rolls back over-length partial buffer to raw', () => {
    const p = new StreamTagParser(TAGS, OPAQUE);
    const garbage = '<' + 'x'.repeat(80) + 'y';
    const events = p.feed(garbage);
    expect(events.some(e => e.type === 'raw')).toBe(true);
  });

  it('passes through unregistered tags as raw', () => {
    const p = new StreamTagParser(TAGS, OPAQUE);
    const events = [...p.feed('<unknown>abc</unknown>'), ...p.finish()];
    const opens = events.filter(e => e.type === 'tag-open');
    expect(opens).toHaveLength(0);
    const raw = events.filter(e => e.type === 'raw').map(r => (r as any).chunk).join('');
    expect(raw).toContain('<unknown>');
    expect(raw).toContain('</unknown>');
  });
});
