# tavernlike v3 React Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 spec `2026-05-07-tavernlike-game-extension-design.md` 的 React 部分落地：在 skill 仓库内引入可测试的 TS 工程，TDD 出 stream-parser / vars-merger / api-router 三大新模块，扩展 types/database/variables/importer，建好 GameView + 4 个子组件 + 2 个扩展 modal，最后改 SKILL.md 让 `/sillytavern-web` 输出 v3 React 代码。

**Architecture:** 在 `H:\tavernlike-main\` 顶层装 Vitest + TypeScript，把所有 React 模板搬到 `templates/react/`，旧 SKILL.md 内嵌的字符串模板逐步替换为「读文件复制」。Vue / Vanilla 在本计划之外，留至 Plan B / C。

**Tech Stack:** TypeScript 5、Vitest 1、Dexie 4、React 18、Vite 5（参考工程）。

---

### Task 1: 仓库根级 TypeScript + Vitest 初始化

**Files:**
- Create: `H:\tavernlike-main\package.json`
- Create: `H:\tavernlike-main\tsconfig.json`
- Create: `H:\tavernlike-main\vitest.config.ts`
- Create: `H:\tavernlike-main\.gitignore` (若无)

- [ ] **Step 1: 初始化 package.json**

```json
{
  "name": "tavernlike-skill",
  "version": "3.0.0-dev",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@vitest/ui": "^1.0.0",
    "typescript": "^5.4.0",
    "vitest": "^1.6.0"
  },
  "dependencies": {
    "dexie": "^4.0.1"
  }
}
```

- [ ] **Step 2: 写 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": {
      "@react/*": ["templates/react/*"]
    }
  },
  "include": ["templates/**/*"]
}
```

- [ ] **Step 3: 写 vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['templates/**/*.test.ts', 'templates/**/*.test.tsx'],
    globals: false,
  },
});
```

- [ ] **Step 4: 追加 happy-dom 到 devDependencies 并 npm install**

```bash
cd H:/tavernlike-main && npm install --save-dev happy-dom
```

预期：node_modules 出现，无错误。

- [ ] **Step 5: 创建 .gitignore（若不存在）**

```
node_modules/
dist/
.DS_Store
*.tsbuildinfo
.vitest/
```

- [ ] **Step 6: 验证 typecheck 与 test 命令空跑通过**

```bash
cd H:/tavernlike-main && npm run typecheck && npm run test
```

预期 typecheck 通过、test 报 "No test files found"（正常，没文件）。

- [ ] **Step 7: Commit**

```bash
git -C H:/tavernlike-main add package.json tsconfig.json vitest.config.ts .gitignore
git -C H:/tavernlike-main commit -m "Add TypeScript + Vitest harness for testable templates"
```

---

### Task 2: 把 SKILL.md 内嵌 v2 模板抽出为 templates/react/sillytavern/*.ts

**Files:**
- Create: `templates/react/sillytavern/types.ts` (从 SKILL.md §1)
- Create: `templates/react/sillytavern/database.ts` (从 SKILL.md §2)
- Create: `templates/react/sillytavern/lorebook-engine.ts` (从 SKILL.md §3)
- Create: `templates/react/sillytavern/prompt-assembler.ts` (从 SKILL.md §4)
- Create: `templates/react/sillytavern/importer.ts` (从 SKILL.md §5)
- Create: `templates/react/sillytavern/index.ts` (从 SKILL.md §6)
- Create: `templates/react/sillytavern/variables.ts` (从 SKILL.md §7)

- [ ] **Step 1: 读 SKILL.md 第 65-1106 行，逐块提取**

每个章节的代码块（```typescript ... ```）原样复制到对应文件。不修改任何内容、不添加 import 路径调整。

- [ ] **Step 2: 修复模块间相对 import**

提取后的文件相互引用（如 `database.ts` import `Lorebook` from `./types`）需要保持 `./xxx` 形式。检查每个文件顶部 import，确保都用相对路径。

- [ ] **Step 3: 跑 typecheck 看零错误**

```bash
cd H:/tavernlike-main && npm run typecheck
```

预期：通过。如有错误，逐项修复（多半是 import 缺失）。

- [ ] **Step 4: Commit**

```bash
git -C H:/tavernlike-main add templates/
git -C H:/tavernlike-main commit -m "Extract v2 sillytavern templates into typecheckable TS files"
```

---

### Task 3: 扩展 types.ts —— 新增 v3 字段

**Files:**
- Modify: `templates/react/sillytavern/types.ts`

参照 spec §6 数据模型增量。

- [ ] **Step 1: 在 types.ts 末尾追加新类型**

```ts
// ========== v3 Game Mode Types ==========

export interface ParsedTags {
  thinking: string;
  maintext: string;
  options: string[];
  sum: string;
  varsRaw: string;
  varsCommands: VarsPatch;
  unknown: Record<string, string>;
}

export interface VarsPatch {
  /** Object that will be deep-merged into chat.variables */
  merge: Record<string, any>;
}

export type Task = 'story' | 'summary' | 'vars';
export type ApiTarget = 'primary' | 'secondary';
```

- [ ] **Step 2: 修改 ApiSettings 接口（已有）**

找到 `interface ApiSettings`，添加可选 secondary：

```ts
export interface ApiSettings {
  baseUrl: string;
  apiKey: string;
  model: string;
  // 已有字段不动 ↑
  // 新增 ↓
  secondary?: {
    enabled: boolean;
    baseUrl: string;
    apiKey: string;
    model: string;
  };
}
```

- [ ] **Step 3: 修改 AppSettings 接口（已有）**

找到 `interface AppSettings`，添加：

```ts
  uiMode: 'game' | 'chat';                        // default 'game'
  customTags: string[];                           // default ['maintext','option','sum','vars','thinking','think']
  formatPromptTemplate: string;                   // default § 见下文
  thinkingDisplay: 'fold' | 'hide' | 'inline';    // default 'fold'
```

- [ ] **Step 4: 修改 ChatMessage 接口（已有）**

```ts
  parsed?: ParsedTags;                  // 仅 assistant
  variablesAfter?: Record<string, any>; // 仅 assistant
  apiUsed?: ApiTarget;                  // 调试/审计
```

- [ ] **Step 5: 修改 Chat 接口（已有）**

确认有 `variables: Record<string, any>` 字段；若无则添加。这是当前活跃变量表（= 末尾 floor.variablesAfter）。

- [ ] **Step 6: 增加 DEFAULT_TAGS 与 DEFAULT_FORMAT_PROMPT 常量**

```ts
export const DEFAULT_TAGS = ['maintext', 'option', 'sum', 'vars', 'thinking', 'think'] as const;
export const DEFAULT_OPAQUE_TAGS = ['thinking', 'think'] as const;

export const DEFAULT_FORMAT_PROMPT = `你必须严格按照以下 XML 标签格式输出回复，不要使用 Markdown 包裹：
<thinking>……</thinking>     ← 可选；内部任何字符都视为思考过程，不被解析
<maintext>……</maintext>     ← 必填；本回合的剧情正文，可多段，保留换行
<option>选项 A
选项 B
选项 C</option>              ← 必填；至少 2 项，每行一个
<sum>……</sum>               ← 必填；本回合一句话总结
<vars>{ "金钱": +10, "HP": 38 }</vars>   ← 选填；JSON 深合并`;
```

- [ ] **Step 7: typecheck**

```bash
cd H:/tavernlike-main && npm run typecheck
```

预期通过。

- [ ] **Step 8: Commit**

```bash
git -C H:/tavernlike-main add templates/react/sillytavern/types.ts
git -C H:/tavernlike-main commit -m "Add v3 type extensions: ParsedTags, VarsPatch, secondary API, gameMode settings"
```

---

### Task 4: stream-parser.ts —— 流式标签解析器（TDD）

**Files:**
- Create: `templates/react/sillytavern/stream-parser.ts`
- Test: `templates/react/sillytavern/stream-parser.test.ts`

参照 spec §7。

- [ ] **Step 1: 写第一个失败测试 —— 单 chunk 完整 6 标签**

`templates/react/sillytavern/stream-parser.test.ts`：

```ts
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
    expect(closes.map(c => c.tag)).toEqual(['thinking', 'maintext', 'option', 'sum', 'vars']);
    expect(closes.find(c => c.tag === 'maintext')!.full).toBe('Hello\nworld');
    expect(closes.find(c => c.tag === 'option')!.full).toBe('A\nB\nC');
  });
});
```

- [ ] **Step 2: 跑测试看失败**

```bash
cd H:/tavernlike-main && npm run test -- stream-parser
```

预期：FAIL — `Cannot find module './stream-parser'`。

- [ ] **Step 3: 写最小实现**

`templates/react/sillytavern/stream-parser.ts`：

```ts
export type ParserEvent =
  | { type: 'tag-open';    tag: string }
  | { type: 'tag-chunk';   tag: string; chunk: string }
  | { type: 'tag-close';   tag: string; full: string }
  | { type: 'option-line'; line: string }
  | { type: 'raw';         chunk: string };

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
      if (this.state === 'TAGGED' && name === this.currentTag) {
        if (this.currentTag === 'option' && this.optionBuf) {
          this.events.push({ type: 'option-line', line: this.optionBuf });
          this.optionBuf = '';
        }
        this.events.push({ type: 'tag-close', tag: this.currentTag, full: this.currentBuf });
        this.currentBuf = '';
        this.currentTag = '';
        this.state = 'NORMAL';
      } else {
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
```

- [ ] **Step 4: 跑测试看通过**

```bash
npm run test -- stream-parser
```

预期：PASS。

- [ ] **Step 5: 加测试 —— 跨 chunk 撕裂**

在 describe 内追加：

```ts
it('handles tag split across chunks', () => {
  const p = new StreamTagParser(TAGS, OPAQUE);
  const e1 = [...p.feed('<mai')];
  const e2 = [...p.feed('ntext>hi</maintext>'), ...p.finish()];
  const close = [...e1, ...e2].find(e => e.type === 'tag-close' && (e as any).tag === 'maintext');
  expect(close).toBeTruthy();
  expect((close as any).full).toBe('hi');
});
```

跑，预期 PASS（实现已支持跨 chunk）。

- [ ] **Step 6: 加测试 —— thinking 内嵌假标签不触发**

```ts
it('does not parse tags inside opaque thinking block', () => {
  const p = new StreamTagParser(TAGS, OPAQUE);
  const text = '<thinking>I will write <maintext> next</thinking><maintext>real</maintext>';
  const events = [...p.feed(text), ...p.finish()];
  const opens = events.filter(e => e.type === 'tag-open').map(o => (o as any).tag);
  expect(opens).toEqual(['thinking', 'maintext']);
  const tk = events.find(e => e.type === 'tag-close' && (e as any).tag === 'thinking');
  expect((tk as any).full).toBe('I will write <maintext> next');
});
```

跑，预期 PASS。

- [ ] **Step 7: 加测试 —— option 多行切分**

```ts
it('emits option-line on each newline inside option', () => {
  const p = new StreamTagParser(TAGS, OPAQUE);
  const events = [...p.feed('<option>A\nB\nC</option>'), ...p.finish()];
  const lines = events.filter(e => e.type === 'option-line').map(l => (l as any).line);
  expect(lines).toEqual(['A', 'B', 'C']);
});
```

跑，预期 PASS。

- [ ] **Step 8: 加测试 —— 未闭合标签 finish() 强制收尾**

```ts
it('flushes unclosed tag on finish()', () => {
  const p = new StreamTagParser(TAGS, OPAQUE);
  p.feed('<maintext>partial response without close');
  const events = p.finish();
  const close = events.find(e => e.type === 'tag-close' && (e as any).tag === 'maintext');
  expect(close).toBeTruthy();
  expect((close as any).full).toBe('partial response without close');
});
```

跑，预期 PASS。

- [ ] **Step 9: 加测试 —— partial 超长回滚 raw**

```ts
it('rolls back over-length partial buffer to raw', () => {
  const p = new StreamTagParser(TAGS, OPAQUE);
  const garbage = '<' + 'x'.repeat(80) + 'y';
  const events = p.feed(garbage);
  expect(events.some(e => e.type === 'raw')).toBe(true);
});
```

跑，预期 PASS。

- [ ] **Step 10: 加测试 —— 未注册标签透传 raw**

```ts
it('passes through unregistered tags as raw', () => {
  const p = new StreamTagParser(TAGS, OPAQUE);
  const events = [...p.feed('<unknown>abc</unknown>'), ...p.finish()];
  const opens = events.filter(e => e.type === 'tag-open');
  expect(opens).toHaveLength(0);
  const raw = events.filter(e => e.type === 'raw').map(r => (r as any).chunk).join('');
  expect(raw).toContain('<unknown>');
  expect(raw).toContain('</unknown>');
});
```

跑，预期 PASS。

- [ ] **Step 11: 全量跑 + commit**

```bash
npm run test -- stream-parser
```

```bash
git -C H:/tavernlike-main add templates/react/sillytavern/stream-parser.ts templates/react/sillytavern/stream-parser.test.ts
git -C H:/tavernlike-main commit -m "Add streaming XML tag parser with opaque thinking support"
```

---

### Task 5: vars-merger.ts —— `<vars>` JSON 深合并（TDD）

**Files:**
- Create: `templates/react/sillytavern/vars-merger.ts`
- Test: `templates/react/sillytavern/vars-merger.test.ts`

参照 spec §6 VarsPatch 与 §11 错误处理。

- [ ] **Step 1: 写第一个失败测试 —— 简单 merge**

```ts
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
```

- [ ] **Step 2: 跑看失败**

```bash
npm run test -- vars-merger
```

预期：FAIL — `Cannot find module './vars-merger'`。

- [ ] **Step 3: 写实现**

```ts
import type { VarsPatch } from './types';

export function parseVarsBlock(raw: string): VarsPatch {
  const trimmed = raw.trim();
  if (!trimmed) return { merge: {} };
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return { merge: parsed as Record<string, any> };
    }
    return { merge: {} };
  } catch {
    return { merge: {} };
  }
}

export function applyVarsPatch(
  existing: Record<string, any>,
  patch: VarsPatch,
): Record<string, any> {
  return deepMerge(existing, patch.merge);
}

function deepMerge(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = { ...target };
  for (const key of Object.keys(source)) {
    const sv = source[key];
    const tv = out[key];
    if (Array.isArray(sv)) {
      out[key] = [...sv];
    } else if (sv && typeof sv === 'object' && tv && typeof tv === 'object' && !Array.isArray(tv)) {
      out[key] = deepMerge(tv, sv);
    } else {
      out[key] = sv;
    }
  }
  return out;
}
```

- [ ] **Step 4: 跑通过**

```bash
npm run test -- vars-merger
```

- [ ] **Step 5: Commit**

```bash
git -C H:/tavernlike-main add templates/react/sillytavern/vars-merger.ts templates/react/sillytavern/vars-merger.test.ts
git -C H:/tavernlike-main commit -m "Add vars-merger: parse <vars> JSON and deep-merge into chat variables"
```

---

### Task 6: api-router.ts —— 主/次 API 任务路由（TDD）

**Files:**
- Create: `templates/react/sillytavern/api-router.ts`
- Test: `templates/react/sillytavern/api-router.test.ts`

参照 spec §9。

- [ ] **Step 1: 写测试 —— 单 API 模式所有任务走 primary**

```ts
import { describe, it, expect, vi } from 'vitest';
import { createApiRouter } from './api-router';

const baseSettings = {
  baseUrl: 'https://primary',
  apiKey: 'pk',
  model: 'm1',
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
```

- [ ] **Step 2: 跑看失败**

```bash
npm run test -- api-router
```

预期：FAIL — module not found。

- [ ] **Step 3: 写实现**

```ts
import type { ApiSettings, ApiTarget, Task } from './types';

interface ChatRequest {
  messages: Array<{ role: string; content: string }>;
  // 其它 OpenAI 兼容参数，由调用方按需填
  [key: string]: any;
}

interface CallResult {
  targetUsed: ApiTarget;
  response: Response;
}

interface RouterDeps {
  fetch?: typeof fetch;
}

export function createApiRouter(settings: ApiSettings, deps: RouterDeps = {}) {
  const fetchImpl = deps.fetch ?? globalThis.fetch;
  const useSecondary = !!settings.secondary?.enabled;

  function targetFor(task: Task): ApiTarget {
    if (!useSecondary) return 'primary';
    return task === 'story' ? 'primary' : 'secondary';
  }

  function endpointFor(target: ApiTarget) {
    if (target === 'secondary' && settings.secondary) {
      return {
        baseUrl: settings.secondary.baseUrl,
        apiKey: settings.secondary.apiKey,
        model: settings.secondary.model,
      };
    }
    return { baseUrl: settings.baseUrl, apiKey: settings.apiKey, model: settings.model };
  }

  async function callOnce(target: ApiTarget, body: ChatRequest): Promise<Response> {
    const ep = endpointFor(target);
    return await fetchImpl(`${ep.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ep.apiKey}`,
      },
      body: JSON.stringify({ ...body, model: ep.model }),
    });
  }

  async function call(task: Task, payload: ChatRequest): Promise<CallResult> {
    const target = targetFor(task);
    if (target === 'secondary') {
      try {
        const res = await callOnce('secondary', payload);
        if (!res.ok) throw new Error(`secondary HTTP ${res.status}`);
        return { targetUsed: 'secondary', response: res };
      } catch {
        const res = await callOnce('primary', payload);
        return { targetUsed: 'primary', response: res };
      }
    }
    const res = await callOnce('primary', payload);
    return { targetUsed: 'primary', response: res };
  }

  return { targetFor, call };
}

export type ApiRouter = ReturnType<typeof createApiRouter>;
```

- [ ] **Step 4: 跑通过**

```bash
npm run test -- api-router
```

- [ ] **Step 5: Commit**

```bash
git -C H:/tavernlike-main add templates/react/sillytavern/api-router.ts templates/react/sillytavern/api-router.test.ts
git -C H:/tavernlike-main commit -m "Add api-router: primary/secondary task routing with fallback"
```

---

### Task 7: variables.ts —— 流式事件 → 解析结果 → 应用变量

**Files:**
- Modify: `templates/react/sillytavern/variables.ts`
- Test: `templates/react/sillytavern/variables.test.ts`

参照 spec §8 与 §11 fallback。

- [ ] **Step 1: 写测试 —— 把事件流聚合为 ParsedTags**

```ts
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
    const chat = { variables: { hp: 100, gold: 5 } };
    const parsed = aggregateEvents([
      { type: 'tag-close', tag: 'vars', full: '{"hp":80}' },
    ] as any);
    const { nextVariables, snapshot } = applyParsedToChat(chat.variables, parsed);
    expect(nextVariables).toEqual({ hp: 80, gold: 5 });
    expect(snapshot).toEqual({ hp: 80, gold: 5 });
    expect(snapshot).not.toBe(nextVariables);
  });
});
```

- [ ] **Step 2: 跑看失败**

```bash
npm run test -- variables
```

- [ ] **Step 3: 改写 variables.ts**

保留原有 `<var name="x" value="y" />` 自闭合解析（向后兼容），新增聚合与应用：

```ts
import type { ParsedTags } from './types';
import type { ParserEvent } from './stream-parser';
import { parseVarsBlock, applyVarsPatch } from './vars-merger';

// ========== Legacy: <var name=x value=y /> self-closing tags（保留，向后兼容） ==========
// （把 SKILL.md §7 中现有的 extractVariables / mergeVariables 等函数原样保留）

// ========== v3: stream parser event aggregation ==========

export function aggregateEvents(events: ParserEvent[]): ParsedTags {
  const parsed: ParsedTags = {
    thinking: '',
    maintext: '',
    options: [],
    sum: '',
    varsRaw: '',
    varsCommands: { merge: {} },
    unknown: {},
  };
  for (const ev of events) {
    if (ev.type === 'tag-close') {
      if (ev.tag === 'thinking' || ev.tag === 'think') parsed.thinking = ev.full;
      else if (ev.tag === 'maintext') parsed.maintext = ev.full;
      else if (ev.tag === 'sum') parsed.sum = ev.full;
      else if (ev.tag === 'vars') {
        parsed.varsRaw = ev.full;
        parsed.varsCommands = parseVarsBlock(ev.full);
      } else if (ev.tag === 'option') {
        // option-line events accumulated into options below
      } else {
        parsed.unknown[ev.tag] = ev.full;
      }
    } else if (ev.type === 'option-line') {
      parsed.options.push(ev.line);
    }
  }
  return parsed;
}

export function applyParsedToChat(
  current: Record<string, any>,
  parsed: ParsedTags,
): { nextVariables: Record<string, any>; snapshot: Record<string, any> } {
  const next = applyVarsPatch(current, parsed.varsCommands);
  const snapshot = JSON.parse(JSON.stringify(next));
  return { nextVariables: next, snapshot };
}
```

- [ ] **Step 4: 跑通过 + commit**

```bash
npm run test -- variables
```

```bash
git -C H:/tavernlike-main add templates/react/sillytavern/variables.ts templates/react/sillytavern/variables.test.ts
git -C H:/tavernlike-main commit -m "Aggregate parser events into ParsedTags and apply to chat variables"
```

---

### Task 8: database.ts —— Dexie schema 升级与默认值迁移

**Files:**
- Modify: `templates/react/sillytavern/database.ts`

参照 spec §6 与 §15 迁移影响。

- [ ] **Step 1: 升 schema 版本号到 v3**

在 Dexie 类的 `this.version(N).stores({...})` 之后加：

```ts
this.version(3).stores({
  lorebooks: 'id, name, updatedAt',
  presets: 'id, name, updatedAt',
  settings: 'id',
  chats: 'id, updatedAt',
}).upgrade(async tx => {
  // settings 默认值补齐
  const settings = await tx.table('settings').toCollection().toArray();
  for (const s of settings) {
    if (s.uiMode === undefined) s.uiMode = 'game';
    if (s.customTags === undefined) s.customTags = ['maintext','option','sum','vars','thinking','think'];
    if (s.thinkingDisplay === undefined) s.thinkingDisplay = 'fold';
    if (s.formatPromptTemplate === undefined) {
      s.formatPromptTemplate = ''; // 由 hook 在读取时填默认
    }
    if (s.api && s.api.secondary === undefined) {
      s.api.secondary = { enabled: false, baseUrl: '', apiKey: '', model: '' };
    }
    await tx.table('settings').put(s);
  }
});
```

- [ ] **Step 2: 默认配置 helper 同步更新**

找到 `createDefaultSettings()` 或同等函数，确保新装用户的 settings 默认值含上述新字段：

```ts
export function createDefaultSettings(): AppSettings {
  return {
    // ...原有
    uiMode: 'game',
    customTags: ['maintext','option','sum','vars','thinking','think'],
    formatPromptTemplate: DEFAULT_FORMAT_PROMPT,
    thinkingDisplay: 'fold',
    api: {
      baseUrl: 'https://api.openai.com/v1',
      apiKey: '',
      model: 'gpt-4o-mini',
      secondary: { enabled: false, baseUrl: '', apiKey: '', model: '' },
    },
  };
}
```

- [ ] **Step 3: 给 ChatStore 加 `setVariables(chatId, vars)` 方法**

```ts
async setVariables(chatId: string, variables: Record<string, any>) {
  const chat = await this.db.chats.get(chatId);
  if (!chat) return;
  chat.variables = variables;
  chat.updatedAt = Date.now();
  await this.db.chats.put(chat);
}
```

- [ ] **Step 4: typecheck**

```bash
cd H:/tavernlike-main && npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git -C H:/tavernlike-main add templates/react/sillytavern/database.ts
git -C H:/tavernlike-main commit -m "Bump Dexie schema to v3; backfill defaults for new settings fields"
```

---

### Task 9: importer.ts —— Lorebook 重命名 + 多文件批量导入

**Files:**
- Modify: `templates/react/sillytavern/importer.ts`
- Test: `templates/react/sillytavern/importer.test.ts`

参照 spec §10.4 与 §11 重命名冲突处理。

- [ ] **Step 1: 写测试 —— 多文件批量导入聚合结果**

```ts
import { describe, it, expect } from 'vitest';
import { importMultipleLorebooks } from './importer';

const stub = (name: string) => ({
  name,
  description: '',
  entries: {},
  settings: {},
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

  it('renameLorebook replaces only the name', async () => {
    const { renameLorebook } = await import('./importer');
    const lb = { id: '1', name: 'old', entries: [], createdAt: 0, updatedAt: 0,
                 recursiveScanning: true, caseSensitive: false, matchWholeWords: false };
    const next = renameLorebook(lb, 'new');
    expect(next.name).toBe('new');
    expect(next.id).toBe('1');
    expect(next.updatedAt).toBeGreaterThanOrEqual(lb.updatedAt);
  });
});
```

- [ ] **Step 2: 跑看失败**

```bash
npm run test -- importer
```

- [ ] **Step 3: 在 importer.ts 末尾追加新导出**

```ts
import type { Lorebook, SillyTavernLorebookExport } from './types';
import { importLorebook } from './importer'; // 假设原 importLorebook 已存在；不存在则保留模块内调用

export interface MultiImportInput {
  fileName: string;
  json: SillyTavernLorebookExport;
}

export interface MultiImportResults {
  successes: Array<{ fileName: string; lorebook: Lorebook }>;
  failures: Array<{ fileName: string; error: string }>;
}

export function importMultipleLorebooks(inputs: MultiImportInput[]): MultiImportResults {
  const successes: MultiImportResults['successes'] = [];
  const failures: MultiImportResults['failures'] = [];
  for (const input of inputs) {
    try {
      const lb = importLorebook(input.json);
      successes.push({ fileName: input.fileName, lorebook: lb });
    } catch (e) {
      failures.push({ fileName: input.fileName, error: String((e as Error).message ?? e) });
    }
  }
  return { successes, failures };
}

export function renameLorebook(lb: Lorebook, newName: string): Lorebook {
  return { ...lb, name: newName, updatedAt: Date.now() };
}
```

注意：若原文件没有顶层 `importLorebook` 导出（现状是叫别的名），把上面调用替换为实际名。

- [ ] **Step 4: 跑通过 + commit**

```bash
npm run test -- importer
```

```bash
git -C H:/tavernlike-main add templates/react/sillytavern/importer.ts templates/react/sillytavern/importer.test.ts
git -C H:/tavernlike-main commit -m "Add multi-file lorebook import and rename helpers"
```

---

### Task 10: useStreamParser hook —— React 流式状态包装

**Files:**
- Create: `templates/react/hooks/useStreamParser.ts`

参照 spec §7 + §10.1 GameView 的 maintext 流式渲染需求。

- [ ] **Step 1: 写 hook 实现**

```ts
import { useRef, useState, useCallback } from 'react';
import { StreamTagParser, type ParserEvent } from '../sillytavern/stream-parser';
import { aggregateEvents } from '../sillytavern/variables';
import type { ParsedTags } from '../sillytavern/types';

export interface StreamParserState {
  thinking: string;
  maintext: string;
  options: string[];
  sum: string;
  varsRaw: string;
  isStreaming: boolean;
}

const initialState: StreamParserState = {
  thinking: '',
  maintext: '',
  options: [],
  sum: '',
  varsRaw: '',
  isStreaming: false,
};

export function useStreamParser(tags: string[], opaqueTags: string[]) {
  const parserRef = useRef<StreamTagParser | null>(null);
  const eventBufRef = useRef<ParserEvent[]>([]);
  const [state, setState] = useState<StreamParserState>(initialState);

  const start = useCallback(() => {
    parserRef.current = new StreamTagParser(tags, opaqueTags);
    eventBufRef.current = [];
    setState({ ...initialState, isStreaming: true });
  }, [tags, opaqueTags]);

  const feed = useCallback((chunk: string) => {
    if (!parserRef.current) return;
    const events = parserRef.current.feed(chunk);
    eventBufRef.current.push(...events);
    setState(prev => applyEvents(prev, events));
  }, []);

  const finish = useCallback((): { events: ParserEvent[]; parsed: ParsedTags } => {
    if (!parserRef.current) return { events: [], parsed: emptyParsed() };
    const tail = parserRef.current.finish();
    eventBufRef.current.push(...tail);
    setState(prev => ({ ...applyEvents(prev, tail), isStreaming: false }));
    const all = eventBufRef.current;
    return { events: all, parsed: aggregateEvents(all) };
  }, []);

  const reset = useCallback(() => setState(initialState), []);

  return { state, start, feed, finish, reset };
}

function applyEvents(prev: StreamParserState, events: ParserEvent[]): StreamParserState {
  let next = { ...prev };
  for (const ev of events) {
    if (ev.type === 'tag-chunk') {
      if (ev.tag === 'maintext') next.maintext += ev.chunk;
      else if (ev.tag === 'thinking' || ev.tag === 'think') next.thinking += ev.chunk;
      else if (ev.tag === 'sum') next.sum += ev.chunk;
      else if (ev.tag === 'vars') next.varsRaw += ev.chunk;
    } else if (ev.type === 'option-line') {
      next.options = [...next.options, ev.line];
    } else if (ev.type === 'tag-close' && ev.tag === 'option') {
      // 收尾时若 buf 里还有未换行内容，已由 parser emit option-line 处理
    }
  }
  return next;
}

function emptyParsed(): ParsedTags {
  return {
    thinking: '', maintext: '', options: [], sum: '', varsRaw: '',
    varsCommands: { merge: {} }, unknown: {},
  };
}
```

- [ ] **Step 2: typecheck**

```bash
cd H:/tavernlike-main && npm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git -C H:/tavernlike-main add templates/react/hooks/useStreamParser.ts
git -C H:/tavernlike-main commit -m "Add useStreamParser React hook with start/feed/finish API"
```

---

### Task 11: useApiRouter hook —— 流式 fetch 包装

**Files:**
- Create: `templates/react/hooks/useApiRouter.ts`

- [ ] **Step 1: 写 hook**

```ts
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
      // OpenAI SSE: lines like `data: {...}\n\n`
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
            // 单条无效行，忽略
          }
        }
      }
    }
  }, [router]);

  const abort = useCallback(() => abortRef.current?.abort(), []);

  return { sendStream, abort, targetFor: router.targetFor };
}
```

- [ ] **Step 2: typecheck**

```bash
cd H:/tavernlike-main && npm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git -C H:/tavernlike-main add templates/react/hooks/useApiRouter.ts
git -C H:/tavernlike-main commit -m "Add useApiRouter React hook with SSE streaming and abort support"
```

---

### Task 12: useSillytavern hook —— 整合 game mode 发送流程

**Files:**
- Modify: `templates/react/hooks/useSillytavern.ts`

参照 spec §8 与 §11 错误处理。

- [ ] **Step 1: 在 useSillytavern 中加 sendGameMessage**

在已有 `sendMessage` 旁新增（保留 sendMessage 用于 chat mode）：

```ts
import { useStreamParser } from './useStreamParser';
import { useApiRouter } from './useApiRouter';
import { applyParsedToChat } from '../sillytavern/variables';
import { assemblePrompt } from '../sillytavern/prompt-assembler';
import { DEFAULT_TAGS, DEFAULT_OPAQUE_TAGS } from '../sillytavern/types';

// 在 hook 函数体内：
const parser = useStreamParser(
  settings?.customTags ?? [...DEFAULT_TAGS],
  [...DEFAULT_OPAQUE_TAGS],
);
const router = useApiRouter(settings?.api);

const sendGameMessage = useCallback(async (userText: string) => {
  if (!activeChat || !settings) return;

  // 1. 写 user floor
  const userMsg = { id: crypto.randomUUID(), role: 'user' as const, content: userText, timestamp: Date.now() };
  const updatedChat = { ...activeChat, messages: [...activeChat.messages, userMsg] };
  await db.chats.put(updatedChat);
  setActiveChat(updatedChat);

  // 2. 组 prompt
  const { messages } = assemblePrompt({
    userInput: userText,
    history: updatedChat.messages,
    preset: activePreset,
    lorebooks: lorebooks.filter(l => l.active),
    userName: settings.userName,
    characterName: settings.characterName,
    extraVariables: updatedChat.variables,
    formatPrompt: settings.formatPromptTemplate,
  });

  // 3. 启动解析 + 流式 fetch
  parser.start();
  try {
    await router.sendStream({
      task: 'story',
      messages,
      onChunk: (delta) => parser.feed(delta),
    });
  } catch (e) {
    parser.reset();
    throw e; // 上层显示 toast；不写 DB
  }

  const { events, parsed } = parser.finish();

  // 4. 应用变量
  const { nextVariables, snapshot } = applyParsedToChat(updatedChat.variables ?? {}, parsed);

  // 5. 写 assistant floor
  const assistantMsg = {
    id: crypto.randomUUID(),
    role: 'assistant' as const,
    content: events.filter(e => e.type === 'tag-chunk' || e.type === 'raw').map((e: any) => e.chunk).join(''),
    timestamp: Date.now(),
    parsed,
    variablesAfter: snapshot,
    apiUsed: 'primary' as const,
  };
  const finalChat = {
    ...updatedChat,
    messages: [...updatedChat.messages, assistantMsg],
    variables: nextVariables,
    updatedAt: Date.now(),
  };
  await db.chats.put(finalChat);
  setActiveChat(finalChat);
}, [activeChat, settings, lorebooks, activePreset, parser, router]);
```

- [ ] **Step 2: 在 jumpToFloor 里恢复 variables**

新增方法：

```ts
const jumpToFloor = useCallback(async (messageId: string) => {
  if (!activeChat) return;
  const idx = activeChat.messages.findIndex(m => m.id === messageId);
  if (idx < 0) return;
  const truncated = activeChat.messages.slice(0, idx + 1);
  const target = truncated[truncated.length - 1];
  const restoredVars =
    target?.role === 'assistant' && target.variablesAfter
      ? target.variablesAfter
      : (activeChat.variables ?? {});
  const next = { ...activeChat, messages: truncated, variables: restoredVars, updatedAt: Date.now() };
  await db.chats.put(next);
  setActiveChat(next);
}, [activeChat]);
```

- [ ] **Step 3: 把 sendGameMessage、jumpToFloor、parser 暴露在 hook 返回值里**

```ts
return {
  // ...原有
  sendGameMessage,
  jumpToFloor,
  streamState: parser.state,
  abortStream: router.abort,
};
```

- [ ] **Step 4: typecheck + commit**

```bash
cd H:/tavernlike-main && npm run typecheck
```

```bash
git -C H:/tavernlike-main add templates/react/hooks/useSillytavern.ts
git -C H:/tavernlike-main commit -m "Wire sendGameMessage and jumpToFloor with streaming parser and variable snapshots"
```

---

### Task 13: GameView 主容器 + ThinkingFold + MainTextPane + OptionList

**Files:**
- Create: `templates/react/components/SillyTavern/GameView.tsx`
- Create: `templates/react/components/SillyTavern/ThinkingFold.tsx`
- Create: `templates/react/components/SillyTavern/MainTextPane.tsx`
- Create: `templates/react/components/SillyTavern/OptionList.tsx`

参照 spec §10.1。

- [ ] **Step 1: ThinkingFold.tsx**

```tsx
import { useState } from 'react';

export function ThinkingFold({ text, mode }: { text: string; mode: 'fold' | 'hide' | 'inline' }) {
  const [open, setOpen] = useState(false);
  if (!text || mode === 'hide') return null;
  if (mode === 'inline') {
    return <div style={{ color: '#888', fontStyle: 'italic', marginBottom: 8 }}>{text}</div>;
  }
  return (
    <div style={{ marginBottom: 8 }}>
      <button onClick={() => setOpen(o => !o)} style={{ color: '#888' }}>
        {open ? '▾' : '▸'} 思考过程
      </button>
      {open && <pre style={{ whiteSpace: 'pre-wrap', color: '#888' }}>{text}</pre>}
    </div>
  );
}
```

- [ ] **Step 2: MainTextPane.tsx**

```tsx
export function MainTextPane({ text, isStreaming }: { text: string; isStreaming: boolean }) {
  return (
    <div className="st-maintext" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
      {text}
      {isStreaming && <span className="st-cursor">▍</span>}
    </div>
  );
}
```

- [ ] **Step 3: OptionList.tsx**

```tsx
import { useState } from 'react';

export function OptionList(props: {
  options: string[];
  disabled: boolean;
  onPick: (text: string) => void;
}) {
  const [custom, setCustom] = useState('');
  return (
    <div className="st-options" style={{ marginTop: 16 }}>
      {props.options.map((opt, i) => (
        <button
          key={i}
          disabled={props.disabled}
          onClick={() => props.onPick(opt)}
          style={{ display: 'block', width: '100%', padding: 12, marginBottom: 8, textAlign: 'left' }}
        >
          [{i + 1}] {opt}
        </button>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <input
          value={custom}
          onChange={e => setCustom(e.target.value)}
          placeholder="自由输入…"
          disabled={props.disabled}
          style={{ flex: 1 }}
          onKeyDown={e => {
            if (e.key === 'Enter' && custom.trim()) {
              props.onPick(custom.trim());
              setCustom('');
            }
          }}
        />
        <button
          disabled={props.disabled || !custom.trim()}
          onClick={() => { props.onPick(custom.trim()); setCustom(''); }}
        >发送</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: GameView.tsx**

```tsx
import { useState, useMemo } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';
import { ThinkingFold } from './ThinkingFold';
import { MainTextPane } from './MainTextPane';
import { OptionList } from './OptionList';

export function GameView() {
  const st = useSillytavern();
  const [historyOpen, setHistoryOpen] = useState(false);

  const lastAssistant = useMemo(
    () => [...(st.activeChat?.messages ?? [])].reverse().find(m => m.role === 'assistant'),
    [st.activeChat],
  );

  const isStreaming = st.streamState.isStreaming;
  const display = isStreaming
    ? st.streamState
    : {
        thinking: lastAssistant?.parsed?.thinking ?? '',
        maintext: lastAssistant?.parsed?.maintext ?? lastAssistant?.content ?? '',
        options: lastAssistant?.parsed?.options ?? [],
        sum: lastAssistant?.parsed?.sum ?? '',
      };

  return (
    <div className="st-gameview" style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <div className="st-toolbar" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => setHistoryOpen(true)}>☰ 历史</button>
        <button onClick={() => st.openSettings()}>⚙ 设置</button>
        <button onClick={() => st.openLorebooks()}>📖 世界书</button>
        <button onClick={() => st.openPresets()}>✦ 预设</button>
        <button disabled={!lastAssistant} onClick={() => st.regenerateLast()}>↻ 重 roll</button>
      </div>

      <ThinkingFold text={display.thinking} mode={st.settings?.thinkingDisplay ?? 'fold'} />
      <MainTextPane text={display.maintext} isStreaming={isStreaming} />

      <OptionList
        options={display.options}
        disabled={isStreaming}
        onPick={(text) => st.sendGameMessage(text)}
      />

      {display.sum && (
        <details style={{ marginTop: 24, color: '#666' }}>
          <summary>📜 总结</summary>
          <p>{display.sum}</p>
        </details>
      )}

      {historyOpen && <HistoryDrawer onClose={() => setHistoryOpen(false)} />}
    </div>
  );
}

// HistoryDrawer 在下个 task 实现，临时占位
function HistoryDrawer({ onClose }: { onClose: () => void }) {
  return <div onClick={onClose}>历史抽屉占位 — 见下一 task</div>;
}
```

- [ ] **Step 5: typecheck**

```bash
cd H:/tavernlike-main && npm run typecheck
```

需要在 useSillytavern 暴露 `openSettings`、`openLorebooks`、`openPresets`、`regenerateLast` 方法。若已有相近函数（如 toggleSettingsModal）改名或加 alias；若无则在 useSillytavern 内补：

```ts
const [showSettings, setShowSettings] = useState(false);
// ... 类似的
return {
  // ...
  openSettings: () => setShowSettings(true),
  openLorebooks: () => setShowLorebooks(true),
  openPresets: () => setShowPresets(true),
  regenerateLast: async () => { /* 删除最后一条 assistant 然后重发上一条 user */ },
};
```

`regenerateLast` 实现：

```ts
const regenerateLast = useCallback(async () => {
  if (!activeChat) return;
  const lastUserIdx = [...activeChat.messages].reverse().findIndex(m => m.role === 'user');
  if (lastUserIdx < 0) return;
  const targetIdx = activeChat.messages.length - 1 - lastUserIdx;
  const truncated = activeChat.messages.slice(0, targetIdx);
  await db.chats.put({ ...activeChat, messages: truncated });
  setActiveChat({ ...activeChat, messages: truncated });
  await sendGameMessage(activeChat.messages[targetIdx].content);
}, [activeChat, sendGameMessage]);
```

- [ ] **Step 6: Commit**

```bash
git -C H:/tavernlike-main add templates/react/components/SillyTavern/GameView.tsx \
  templates/react/components/SillyTavern/ThinkingFold.tsx \
  templates/react/components/SillyTavern/MainTextPane.tsx \
  templates/react/components/SillyTavern/OptionList.tsx
git -C H:/tavernlike-main commit -m "Add GameView shell with ThinkingFold, MainTextPane, OptionList"
```

---

### Task 14: HistoryDrawer —— 楼层抽屉，含跳转/编辑/删后续/分支

**Files:**
- Create: `templates/react/components/SillyTavern/HistoryDrawer.tsx`
- Modify: `templates/react/components/SillyTavern/GameView.tsx` (替换占位)

参照 spec §10.2 与 §8 时间旅行。

- [ ] **Step 1: HistoryDrawer.tsx**

```tsx
import { useSillytavern } from '../../hooks/useSillytavern';

export function HistoryDrawer({ onClose }: { onClose: () => void }) {
  const st = useSillytavern();
  const messages = st.activeChat?.messages ?? [];

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 100 }}
    >
      <aside
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 360,
          background: '#fff', overflowY: 'auto', padding: 16,
        }}
      >
        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <strong>历史楼层</strong>
          <button onClick={onClose}>×</button>
        </header>
        <ol style={{ listStyle: 'none', padding: 0 }}>
          {messages.map((m, i) => {
            const summary = m.role === 'assistant'
              ? (m.parsed?.maintext ?? m.content).slice(0, 60)
              : m.content.slice(0, 60);
            return (
              <li key={m.id} style={{ borderBottom: '1px solid #eee', padding: 8 }}>
                <div style={{ fontSize: 12, color: '#888' }}>
                  #{i} · {m.role} · {new Date(m.timestamp).toLocaleTimeString()}
                </div>
                <div style={{ fontSize: 14, marginTop: 4 }}>{summary}…</div>
                <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                  <button onClick={() => { st.jumpToFloor(m.id); onClose(); }}>跳转</button>
                  <button onClick={() => { const t = prompt('编辑内容', m.content); if (t != null) st.editMessage(m.id, t); }}>编辑</button>
                  <button onClick={() => st.deleteMessagesFrom(m.id)}>删后续</button>
                  <button onClick={async () => { await st.branchFromMessage(m.id); onClose(); }}>分支</button>
                </div>
              </li>
            );
          })}
        </ol>
      </aside>
    </div>
  );
}
```

- [ ] **Step 2: 替换 GameView 中的 HistoryDrawer 占位**

把 GameView.tsx 顶部 import 改为：

```tsx
import { HistoryDrawer } from './HistoryDrawer';
```

并删除 GameView.tsx 末尾的占位 function。

- [ ] **Step 3: typecheck + commit**

```bash
cd H:/tavernlike-main && npm run typecheck
```

```bash
git -C H:/tavernlike-main add templates/react/components/SillyTavern/HistoryDrawer.tsx \
  templates/react/components/SillyTavern/GameView.tsx
git -C H:/tavernlike-main commit -m "Add HistoryDrawer with jump/edit/delete/branch actions"
```

---

### Task 15: SettingsModal —— 扩展次 API、标签集、格式提示词、思考显示、UI 模式

**Files:**
- Modify: `templates/react/components/SillyTavern/SettingsModal.tsx`

参照 spec §10.3。

- [ ] **Step 1: 在 modal 中加 tab/section**

把 SettingsModal 的现有内容包在「主 API」分页里，并加另外 4 个分页 / collapsible：

```tsx
const TABS = ['primary', 'secondary', 'tags', 'prompt', 'display'] as const;
type Tab = typeof TABS[number];

const [tab, setTab] = useState<Tab>('primary');
```

主 API 分页保持现有 form 不动。

- [ ] **Step 2: 次 API 分页**

```tsx
{tab === 'secondary' && (
  <>
    <label>
      <input
        type="checkbox"
        checked={settings.api.secondary?.enabled ?? false}
        onChange={e => updateSettings({
          api: {
            ...settings.api,
            secondary: { ...(settings.api.secondary ?? { baseUrl:'', apiKey:'', model:'' }), enabled: e.target.checked },
          },
        })}
      />
      启用次 API（用于变量/总结分流）
    </label>
    {settings.api.secondary?.enabled && (
      <>
        <input value={settings.api.secondary.baseUrl} onChange={e => updateSettings({ api: { ...settings.api, secondary: { ...settings.api.secondary!, baseUrl: e.target.value } } })} placeholder="Base URL" />
        <input value={settings.api.secondary.apiKey} onChange={e => updateSettings({ api: { ...settings.api, secondary: { ...settings.api.secondary!, apiKey: e.target.value } } })} placeholder="API Key" />
        <input value={settings.api.secondary.model} onChange={e => updateSettings({ api: { ...settings.api, secondary: { ...settings.api.secondary!, model: e.target.value } } })} placeholder="Model" />
      </>
    )}
  </>
)}
```

- [ ] **Step 3: 标签集分页（chip editor）**

```tsx
{tab === 'tags' && (
  <div>
    <p style={{ fontSize: 12, color: '#666' }}>注册的标签将由解析器识别。删除 maintext/option 会破坏默认 UI。</p>
    {settings.customTags.map((t, i) => (
      <span key={i} style={{ display: 'inline-block', padding: '4px 8px', background: '#eee', borderRadius: 4, margin: 4 }}>
        {t} <button onClick={() => updateSettings({ customTags: settings.customTags.filter((_, j) => j !== i) })}>×</button>
      </span>
    ))}
    <button onClick={() => {
      const v = prompt('新标签名（小写、无空格）');
      if (v && /^[a-z][a-z0-9_-]*$/.test(v)) updateSettings({ customTags: [...settings.customTags, v] });
    }}>+ 新增</button>
  </div>
)}
```

- [ ] **Step 4: 格式提示词分页**

```tsx
{tab === 'prompt' && (
  <div>
    <textarea
      value={settings.formatPromptTemplate}
      onChange={e => updateSettings({ formatPromptTemplate: e.target.value })}
      style={{ width: '100%', height: 200 }}
    />
    <button onClick={() => updateSettings({ formatPromptTemplate: DEFAULT_FORMAT_PROMPT })}>恢复默认</button>
  </div>
)}
```

需 `import { DEFAULT_FORMAT_PROMPT } from '../../sillytavern/types';`。

- [ ] **Step 5: 显示分页（思考显示 + UI 模式）**

```tsx
{tab === 'display' && (
  <div>
    <fieldset>
      <legend>思考过程显示</legend>
      {(['fold','hide','inline'] as const).map(m => (
        <label key={m}>
          <input type="radio" checked={settings.thinkingDisplay === m} onChange={() => updateSettings({ thinkingDisplay: m })} />
          {m === 'fold' ? '折叠（默认）' : m === 'hide' ? '隐藏' : '与正文同区'}
        </label>
      ))}
    </fieldset>
    <fieldset>
      <legend>UI 模式</legend>
      {(['game','chat'] as const).map(m => (
        <label key={m}>
          <input type="radio" checked={settings.uiMode === m} onChange={() => updateSettings({ uiMode: m })} />
          {m === 'game' ? '游戏（默认）' : '聊天列表'}
        </label>
      ))}
    </fieldset>
  </div>
)}
```

- [ ] **Step 6: typecheck + commit**

```bash
cd H:/tavernlike-main && npm run typecheck
```

```bash
git -C H:/tavernlike-main add templates/react/components/SillyTavern/SettingsModal.tsx
git -C H:/tavernlike-main commit -m "Extend SettingsModal with secondary API, tags, prompt, thinking display, UI mode"
```

---

### Task 16: LorebookModal —— 多文件批量导入 + 行内重命名

**Files:**
- Modify: `templates/react/components/SillyTavern/LorebookModal.tsx`

参照 spec §10.4。

- [ ] **Step 1: 改导入按钮为 multiple**

把现有 import button 替换为：

```tsx
<input
  type="file"
  multiple
  accept="application/json"
  onChange={async (e) => {
    const files = Array.from(e.target.files ?? []);
    const inputs = await Promise.all(files.map(async f => ({
      fileName: f.name,
      json: JSON.parse(await f.text()),
    })));
    const { successes, failures } = importMultipleLorebooks(inputs);
    for (const s of successes) await db.lorebooks.add(s.lorebook);
    if (failures.length) alert('导入失败：\n' + failures.map(f => `${f.fileName}: ${f.error}`).join('\n'));
    refresh();
  }}
/>
```

需 `import { importMultipleLorebooks } from '../../sillytavern/importer';`。

- [ ] **Step 2: 列表行加重命名按钮**

在 lorebook 列表行操作区加：

```tsx
<button onClick={() => {
  const v = prompt('新名称', lb.name);
  if (v && v !== lb.name) handleRename(lb.id, v);
}}>重命名</button>
```

- [ ] **Step 3: handleRename 处理重名冲突**

```tsx
async function handleRename(id: string, newName: string) {
  const all = await db.lorebooks.toArray();
  const conflict = all.find(x => x.id !== id && x.name === newName);
  if (conflict) {
    const choice = window.prompt('已存在同名 lorebook。输入：merge / rename(自动加后缀) / cancel', 'rename');
    if (choice === 'cancel' || !choice) return;
    if (choice === 'merge') {
      const target = all.find(x => x.id === id)!;
      conflict.entries = [...conflict.entries, ...target.entries];
      conflict.updatedAt = Date.now();
      await db.lorebooks.put(conflict);
      await db.lorebooks.delete(id);
      refresh();
      return;
    }
    if (choice === 'rename') {
      newName = newName + '_' + Date.now().toString(36);
    }
  }
  const lb = await db.lorebooks.get(id);
  if (!lb) return;
  await db.lorebooks.put(renameLorebook(lb, newName));
  refresh();
}
```

需 `import { renameLorebook } from '../../sillytavern/importer';`。

- [ ] **Step 4: typecheck + commit**

```bash
cd H:/tavernlike-main && npm run typecheck
```

```bash
git -C H:/tavernlike-main add templates/react/components/SillyTavern/LorebookModal.tsx
git -C H:/tavernlike-main commit -m "LorebookModal: multi-file import and inline rename with conflict handling"
```

---

### Task 17: prompt-assembler.ts —— 注入 formatPrompt 与变量上下文

**Files:**
- Modify: `templates/react/sillytavern/prompt-assembler.ts`
- Test: `templates/react/sillytavern/prompt-assembler.test.ts`

参照 spec §13。

- [ ] **Step 1: 写测试 —— formatPrompt 注入到 system 段**

```ts
import { describe, it, expect } from 'vitest';
import { assemblePrompt } from './prompt-assembler';

describe('assemblePrompt formatPrompt injection', () => {
  it('injects formatPrompt as a system message', () => {
    const out = assemblePrompt({
      userInput: 'hi',
      history: [],
      preset: { id: 'p', name: 'p', settings: {}, createdAt: 0, updatedAt: 0 },
      lorebooks: [],
      userName: 'Alice',
      characterName: 'Bob',
      formatPrompt: 'FORMAT_INSTRUCTIONS_HERE',
      extraVariables: { hp: 100 },
    });
    const sysJoined = out.messages.filter(m => m.role === 'system').map(m => m.content).join('\n');
    expect(sysJoined).toContain('FORMAT_INSTRUCTIONS_HERE');
  });

  it('exposes extraVariables via {{var.x}} or as JSON in system', () => {
    const out = assemblePrompt({
      userInput: 'hi',
      history: [],
      preset: { id: 'p', name: 'p', settings: {}, createdAt: 0, updatedAt: 0 },
      lorebooks: [],
      userName: 'Alice',
      characterName: 'Bob',
      extraVariables: { hp: 42 },
    });
    const sysJoined = out.messages.filter(m => m.role === 'system').map(m => m.content).join('\n');
    expect(sysJoined).toMatch(/42/);
  });
});
```

- [ ] **Step 2: 跑看失败**

```bash
npm run test -- prompt-assembler
```

- [ ] **Step 3: 修改 assemblePrompt 签名**

在已有 PromptInput 接口加：

```ts
export interface PromptInput {
  // ...原有
  formatPrompt?: string;
  extraVariables?: Record<string, any>;
}
```

在 system 段拼接处末尾追加：

```ts
const systemTail: string[] = [];
if (input.formatPrompt) systemTail.push(input.formatPrompt);
if (input.extraVariables) {
  systemTail.push('当前变量: ' + JSON.stringify(input.extraVariables, null, 2));
}
if (systemTail.length) {
  messages.push({ role: 'system', content: systemTail.join('\n\n') });
}
```

- [ ] **Step 4: 跑通过**

```bash
npm run test -- prompt-assembler
```

- [ ] **Step 5: Commit**

```bash
git -C H:/tavernlike-main add templates/react/sillytavern/prompt-assembler.ts templates/react/sillytavern/prompt-assembler.test.ts
git -C H:/tavernlike-main commit -m "Inject formatPrompt and extraVariables into system messages"
```

---

### Task 18: SKILL.md —— Phase 阶段重写为 v3 交互流程

**Files:**
- Modify: `H:\tavernlike-main\SKILL.md` (lines 33–62 起，整个 Automated Workflow 区段)

参照 spec §12。

- [ ] **Step 1: 替换 Phase 1 / Phase 2 / Phase 3 区块**

把 SKILL.md 第 33–62 行（"## Automated Workflow" 到 "## File Generation Templates" 之前）整段替换为：

````markdown
## Automated Workflow

### Phase 1: 检测框架（自动）

```bash
test -f package.json && grep -E '"react"|"vue"' package.json
ls src/**/*.tsx 2>/dev/null && echo "REACT"
ls src/**/*.vue 2>/dev/null && echo "VUE"
```

若都未匹配则视为 Vanilla。

### Phase 2: 询问安装选项（与用户交互）

依次以单行问题询问，每个 Q 都给出 [] 内默认值，敲回车即采纳：

1. **Q：启用游戏模式（正文+选项 UI）？[Y/n]**
   - Y → 安装 GameView，settings.uiMode='game'
   - N → 仅安装聊天模式，settings.uiMode='chat'

2. **Q：使用默认 6 个标签 (maintext, option, sum, vars, thinking, think)？[Y/n]**
   - Y → settings.customTags 取默认
   - N → 让用户用空格列出标签名（必须包含 maintext 与 option，否则默认 UI 不可用）

3. **Q：启用次 API（变量/总结分流）？[y/N]**
   - Y → settings.api.secondary.enabled=true，让用户填 baseUrl/apiKey/model
   - N → settings.api.secondary.enabled=false

4. **Q：是否使用 schema-first 状态系统？[y/N]**
   - 本期一律 N。占位以便未来扩展。

### Phase 3: 安装 + 写文件（自动）

```bash
npm install dexie
```

然后按所选框架写入对应文件：

- React: `src/sillytavern/`、`src/hooks/`、`src/components/SillyTavern/`
- Vue: 同上但替换 `hooks/` 为 `composables/`，组件为 `.vue`（本期 v3 仅 React 走升级路径，Vue 保持 v2）
- Vanilla: 同上但 `vanilla/sillytavern-store.ts`（本期保持 v2）

具体文件清单见 §"File Generation Templates"。React 模板已抽到本仓库的 `templates/react/`，可直接复制。
````

- [ ] **Step 2: 在 SKILL.md 顶端 metadata 升 version**

把 `version: 2.0.0` 改为 `version: 3.0.0`。`skill.json` 同步：

```json
{ "version": "3.0.0" }
```

- [ ] **Step 3: Commit**

```bash
git -C H:/tavernlike-main add SKILL.md skill.json
git -C H:/tavernlike-main commit -m "Bump skill to v3.0.0; add interactive scaffolding phase for game mode"
```

---

### Task 19: SKILL.md —— 用 templates/react/ 同步替换 React 模板代码块

**Files:**
- Modify: `H:\tavernlike-main\SKILL.md` (sections §1 types.ts ~ §7 variables.ts，以及 React Integration / UI Components 中的 React 子区段)

参照 spec §1 / §6 / §10.5。

- [ ] **Step 1: types.ts 区块用 templates/react/sillytavern/types.ts 的内容覆盖**

读取：

```bash
cat H:/tavernlike-main/templates/react/sillytavern/types.ts
```

在 SKILL.md 中找到 `### 1. types.ts` 下的 ```typescript ... ``` 块，整段替换为读取到的文件内容。

- [ ] **Step 2: 同步 §2 database / §3 lorebook-engine / §4 prompt-assembler / §5 importer / §6 index / §7 variables**

逐个对应替换。注意 §3 lorebook-engine 与 §6 index 本期未改，但要确认 templates/ 中文件与 SKILL.md 一致。

- [ ] **Step 3: 加新章节 §8 stream-parser / §9 vars-merger / §10 api-router**

在 §7 variables 之后插入：

````markdown
### 8. stream-parser.ts

```typescript
{paste templates/react/sillytavern/stream-parser.ts here}
```

### 9. vars-merger.ts

```typescript
{paste templates/react/sillytavern/vars-merger.ts here}
```

### 10. api-router.ts

```typescript
{paste templates/react/sillytavern/api-router.ts here}
```
````

- [ ] **Step 4: 同步 React Integration / UI Components 区段**

在 SKILL.md 第 1106 行附近的 `## React Integration` 下，依次以 templates 文件覆盖：
- `useSillytavern.ts` (line 1108)
- 新增子节 `useStreamParser.ts`
- 新增子节 `useApiRouter.ts`

在 `## UI Components` → `### React — ...` 区段：
- 替换 LorebookModal、SettingsModal 部分（使用 templates 文件）
- 在 React 区段顶部插入 GameView / MainTextPane / OptionList / ThinkingFold / HistoryDrawer 5 个新子节
- 保留 ChatModal / VariablePanel / Chat 不动（chat 模式仍可用）

- [ ] **Step 5: 把 Vue / Vanilla 区段加置顶 NOTE**

在 `## Vue Integration` 起始处加：

```
> ⚠ v3 升级仅 React 路径已迁移；Vue 与 Vanilla 仍为 v2 模板（功能不含游戏模式 / stream-parser / 多 API）。在后续 plan 中跟进。
```

`## Vanilla JS Integration` 同样加置顶 NOTE。

- [ ] **Step 6: typecheck（理论上 SKILL.md 不参与 TS 编译，但作 sanity check）**

```bash
cd H:/tavernlike-main && npm run typecheck
```

- [ ] **Step 7: Commit**

```bash
git -C H:/tavernlike-main add SKILL.md
git -C H:/tavernlike-main commit -m "Sync v3 React templates into SKILL.md; mark Vue/Vanilla as v2 fallback"
```

---

### Task 20: 文档同步 —— CLAUDE.md / QUICKSTART.md / README

**Files:**
- Modify: `H:\tavernlike-main\CLAUDE.md`
- Modify: `H:\tavernlike-main\QUICKSTART.md`
- Modify: `H:\tavernlike-main\README.md` (若存在；否则跳过)

- [ ] **Step 1: CLAUDE.md 加 v3 章节**

在「核心组件」下追加：

```markdown
### v3 新增（仅 React）
- `stream-parser.ts` - 流式 XML 标签解析器，含 opaque thinking 区
- `vars-merger.ts` - `<vars>` JSON 深合并
- `api-router.ts` - 主/次 API 任务路由
- `GameView` + `ThinkingFold` / `MainTextPane` / `OptionList` / `HistoryDrawer` - 游戏式 UI
```

并在「版本历史」末尾加：

```markdown
- **v3.0.0** - React 游戏模式（streaming parser / multi-API / floor variable snapshot / lorebook rename / multi-import）
```

- [ ] **Step 2: QUICKSTART.md 加 game-mode 速通**

在文末加：

````markdown
## 游戏模式速通（v3，React）

```tsx
import { GameView } from './components/SillyTavern/GameView';

function App() {
  return <GameView />;
}
```

- 在设置中填主 API → 自动从 settings.formatPromptTemplate 注入格式约定
- 默认显示 6 标签：`<maintext>`/`<option>`/`<sum>`/`<vars>`/`<thinking>`/`<think>`
- 切回聊天列表：Settings → 显示 → UI 模式 → 聊天列表
````

- [ ] **Step 3: typecheck（sanity）**

```bash
cd H:/tavernlike-main && npm run typecheck && npm run test
```

预期全部 PASS。

- [ ] **Step 4: Commit**

```bash
git -C H:/tavernlike-main add CLAUDE.md QUICKSTART.md
git -C H:/tavernlike-main commit -m "Document v3 React game mode in CLAUDE.md and QUICKSTART.md"
```

---

### Task 21: 端到端集成测试 —— Vite React 沙箱

**Files:**
- Create (临时，不入库): `C:\tmp\tavernlike-v3-sandbox\`

参照 spec §14.2 集成 checklist。

- [ ] **Step 1: 起一个干净的 Vite React 工程**

```bash
mkdir -p /c/tmp && cd /c/tmp && npm create vite@latest tavernlike-v3-sandbox -- --template react-ts
cd tavernlike-v3-sandbox && npm install
```

- [ ] **Step 2: 把 templates/react/ 拷进去**

```bash
cp -r H:/tavernlike-main/templates/react/sillytavern src/
cp -r H:/tavernlike-main/templates/react/hooks src/
cp -r H:/tavernlike-main/templates/react/components src/
npm install dexie
```

- [ ] **Step 3: 改 src/App.tsx 用 GameView**

```tsx
import { GameView } from './components/SillyTavern/GameView';
export default function App() { return <GameView />; }
```

- [ ] **Step 4: dev 启动 + 手动跑 checklist**

```bash
npm run dev
```

打开浏览器，逐项确认（写入 H:/tavernlike-main/docs/superpowers/specs 的同名 spec §14.2）：

- [ ] skill 安装无报错（这里是手工拷，等同验证）
- [ ] 主 API 配置后能流式渲染 maintext
- [ ] thinking 折叠正确，内部假标签不解析
- [ ] option 显示并可点
- [ ] `<vars>` 改动落到 chat.variables
- [ ] 跳到第 N floor 后，chat.variables = 第 N floor 的 variablesAfter
- [ ] 重命名 lorebook 持久化
- [ ] 多文件导入并去重
- [ ] 切到 chat 模式仍能用聊天列表
- [ ] 主 API 中途断开后撤回回到上一 floor
- [ ] 启用次 API 后 sum/vars 由次 API 输出

- [ ] **Step 5: 失败修复闭环**

任何一项 FAIL：回到对应 task，新增 / 调整 test，TDD 修，重新跑 checklist。

- [ ] **Step 6: 沙箱清理（不 commit）**

```bash
rm -rf /c/tmp/tavernlike-v3-sandbox
```

- [ ] **Step 7: 在 H:/tavernlike-main 写一篇验证日志（可选）**

```bash
mkdir -p H:/tavernlike-main/docs/superpowers/notes
```

`docs/superpowers/notes/2026-05-08-v3-integration-result.md`：

```markdown
# v3 集成验证

- 日期：2026-05-08
- 沙箱：Vite + React + TS
- checklist 通过项：[列表]
- 发现的回归：[列表]
- 后续调整：[列表]
```

- [ ] **Step 8: Commit 验证日志（如果写了）**

```bash
git -C H:/tavernlike-main add docs/superpowers/notes/
git -C H:/tavernlike-main commit -m "Log v3 integration test results in sandbox"
```

---

## 总结：本计划之外（Plan B/C 留底）

- Plan B：Vue 3 模板升级（与 React 平面对齐：composables/useStreamParser、useApiRouter；GameView.vue + 子组件）
- Plan C：Vanilla 模板升级（store + render functions 平面对齐）
- Plan D（可选）：游戏数据 schema 系统（zhangmen game-state.js 抽象）

每个 Plan 独立产出可工作软件，与本计划解耦。
