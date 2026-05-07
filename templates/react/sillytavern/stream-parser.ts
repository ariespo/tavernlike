/**
 * Streaming XML tag parser for AI responses.
 *
 * State machine (per spec §7):
 *   NORMAL      — outside any registered tag; chars emit as `raw`.
 *   BUFFER_TAG  — saw `<`; accumulating tag name until `>` (or overflow).
 *   TAGGED      — inside a transparent tag; chars emit as `tag-chunk`,
 *                 nested `<` re-enters BUFFER_TAG so closing tag can be detected.
 *   OPAQUE      — inside `thinking`/`think`-style tag; chars emit as `tag-chunk`
 *                 but inner `<...>` is NOT parsed; we only watch for `</tagname>`.
 */

export type ParserEvent =
  | { type: 'tag-open'; tag: string }
  | { type: 'tag-chunk'; tag: string; chunk: string }
  | { type: 'tag-close'; tag: string; full: string }
  | { type: 'option-line'; line: string }
  | { type: 'raw'; chunk: string };

type State = 'NORMAL' | 'BUFFER_TAG' | 'TAGGED' | 'OPAQUE';

const PARTIAL_LIMIT = 64;

export class StreamTagParser {
  private state: State = 'NORMAL';
  private partial = '';
  private currentTag = '';
  private currentBuf = '';
  private optionBuf = '';
  private events: ParserEvent[] = [];

  constructor(
    private readonly tags: string[],
    private readonly opaqueTags: string[],
  ) {}

  feed(chunk: string): ParserEvent[] {
    this.events = [];
    for (const ch of chunk) this.consumeChar(ch);
    return this.events;
  }

  finish(): ParserEvent[] {
    this.events = [];
    if (this.state === 'BUFFER_TAG' && this.partial) {
      this.events.push({ type: 'raw', chunk: '<' + this.partial });
      this.partial = '';
    }
    if (this.state === 'TAGGED' || this.state === 'OPAQUE') {
      if (this.state === 'TAGGED' && this.currentTag === 'option' && this.optionBuf) {
        this.events.push({ type: 'option-line', line: this.optionBuf });
        this.optionBuf = '';
      }
      this.events.push({ type: 'tag-close', tag: this.currentTag, full: this.currentBuf });
      this.currentBuf = '';
      this.currentTag = '';
    }
    this.state = 'NORMAL';
    return this.events;
  }

  private consumeChar(ch: string) {
    if (this.state === 'NORMAL') {
      if (ch === '<') {
        this.state = 'BUFFER_TAG';
        this.partial = '';
      } else {
        this.events.push({ type: 'raw', chunk: ch });
      }
      return;
    }
    if (this.state === 'BUFFER_TAG') {
      if (ch === '>') {
        this.flushTagBuffer();
        return;
      }
      if (this.partial.length >= PARTIAL_LIMIT) {
        // Overflow: this is not a tag, dump partial back as raw.
        this.events.push({ type: 'raw', chunk: '<' + this.partial + ch });
        this.partial = '';
        this.state = 'NORMAL';
        return;
      }
      this.partial += ch;
      return;
    }
    if (this.state === 'OPAQUE') {
      this.currentBuf += ch;
      const closeMarker = `</${this.currentTag}>`;
      if (this.currentBuf.endsWith(closeMarker)) {
        const full = this.currentBuf.slice(0, -closeMarker.length);
        this.events.push({ type: 'tag-chunk', tag: this.currentTag, chunk: ch });
        this.events.push({ type: 'tag-close', tag: this.currentTag, full });
        this.state = 'NORMAL';
        this.currentBuf = '';
        this.currentTag = '';
      } else {
        this.events.push({ type: 'tag-chunk', tag: this.currentTag, chunk: ch });
      }
      return;
    }
    if (this.state === 'TAGGED') {
      if (ch === '<') {
        this.state = 'BUFFER_TAG';
        this.partial = '';
        return;
      }
      if (this.currentTag === 'option' && ch === '\n') {
        this.events.push({ type: 'option-line', line: this.optionBuf });
        this.optionBuf = '';
      } else if (this.currentTag === 'option') {
        this.optionBuf += ch;
      }
      this.currentBuf += ch;
      this.events.push({ type: 'tag-chunk', tag: this.currentTag, chunk: ch });
      return;
    }
  }

  private flushTagBuffer() {
    const tagText = this.partial;
    this.partial = '';
    const isClose = tagText.startsWith('/');
    const name = isClose ? tagText.slice(1) : tagText;

    if (isClose) {
      if (this.currentTag && this.currentTag === name) {
        // Matching close for the open TAGGED tag we were inside before `<` triggered BUFFER_TAG.
        if (this.currentTag === 'option' && this.optionBuf) {
          this.events.push({ type: 'option-line', line: this.optionBuf });
          this.optionBuf = '';
        }
        this.events.push({ type: 'tag-close', tag: this.currentTag, full: this.currentBuf });
        this.currentBuf = '';
        this.currentTag = '';
        this.state = 'NORMAL';
      } else {
        // Stray close for an unrelated tag; pass through as raw and return to NORMAL.
        this.events.push({ type: 'raw', chunk: `</${name}>` });
        this.state = 'NORMAL';
      }
      return;
    }

    if (!this.tags.includes(name)) {
      this.events.push({ type: 'raw', chunk: `<${name}>` });
      this.state = 'NORMAL';
      return;
    }

    this.currentTag = name;
    this.currentBuf = '';
    this.optionBuf = '';
    this.events.push({ type: 'tag-open', tag: name });
    this.state = this.opaqueTags.includes(name) ? 'OPAQUE' : 'TAGGED';
  }
}
