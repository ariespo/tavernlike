# Tavern Editor UIs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Lorebook entry editor, Preset parameter editor, and `prompt_order` visual editor to the React template, so users can create/edit/delete world-book entries and presets through UI instead of editing imported JSON.

**Architecture:** Pure-function utilities in `editor-utils.ts` (TDD). Three modal-level components (`LorebookEditorModal`, `PresetModal`, `PromptOrderEditor`) plus a shared `EntryForm`. All persistence goes through new `useSillytavern` methods (`updateLorebook`, `deleteLorebook`, `addLorebookFromDefault`, `updatePreset`, `deletePreset`, `addPresetFromDefault`). Modal stacking handled by parent components managing local draft state. Existing `LorebookModal` is extended with "+ 新建" and "✎ 编辑" entry points; `GameView` is updated to actually render the three modals when their `showXxx` flags are true (currently a latent bug — buttons set the flag but nothing renders).

**Tech Stack:** React 18 + TypeScript + Vite + vitest + Dexie (IndexedDB). No new dependencies.

---

## File Structure

**New files:**
- `templates/react/sillytavern/editor-utils.ts` — pure functions (default factories, patch helpers, array move, clamp)
- `templates/react/sillytavern/editor-utils.test.ts` — vitest unit tests
- `templates/react/components/SillyTavern/PromptOrderEditor.tsx` — ↑↓ buttons + enabled checkboxes
- `templates/react/components/SillyTavern/EntryForm.tsx` — single entry form, core + advanced collapse
- `templates/react/components/SillyTavern/LorebookEditorModal.tsx` — entry list + EntryForm + new/delete
- `templates/react/components/SillyTavern/PresetModal.tsx` — Tab-style preset editor

**Modified files:**
- `templates/react/hooks/useSillytavern.ts` — add update/delete/new-from-default for both Lorebook and Preset
- `templates/react/components/SillyTavern/LorebookModal.tsx` — add "+ 新建" button + per-row "✎ 编辑" that opens LorebookEditorModal
- `templates/react/components/SillyTavern/GameView.tsx` — render the three modals conditionally
- `SKILL.md` — remove inline PresetModal example, add file references for new components and `editor-utils`

---

## Task 1: editor-utils (TDD)

**Files:**
- Create: `templates/react/sillytavern/editor-utils.test.ts`
- Create: `templates/react/sillytavern/editor-utils.ts`

- [ ] **Step 1.1: Write the failing tests**

Create `templates/react/sillytavern/editor-utils.test.ts`:

```ts
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
```

- [ ] **Step 1.2: Run tests to verify they fail**

Run from inside a project that has installed the template (the templates directory itself does not have its own package.json — these files are copies). For verification we can write a minimal sandbox: assume the repository contains `sandbox/` or run vitest at the template path with a transient `package.json`. The expected behavior is identical to existing module tests (e.g. `stream-parser.test.ts`): the test file will fail to import because `./editor-utils` does not exist yet.

Expected failure message when running vitest:
```
Error: Cannot find module './editor-utils' from '.../editor-utils.test.ts'
```

If you have a sandbox set up, run:
```
npx vitest run templates/react/sillytavern/editor-utils.test.ts
```

- [ ] **Step 1.3: Write the minimal implementation**

Create `templates/react/sillytavern/editor-utils.ts`:

```ts
/**
 * Pure utilities for the lorebook/preset editor UIs.
 * No React, no IndexedDB — only data transformations.
 */

import type { Lorebook, LorebookEntry } from './types';

const ENTRY_DEFAULTS: Omit<LorebookEntry, 'id'> = {
  keys: [],
  secondaryKeys: [],
  content: '',
  order: 100,
  position: 'after_char',
  selective: false,
  selectiveLogic: 'and_any',
  constant: false,
  probability: 100,
  useProbability: false,
  addMemo: false,
};

export function createDefaultEntry(): LorebookEntry {
  return {
    id: crypto.randomUUID(),
    ...ENTRY_DEFAULTS,
  };
}

export function applyEntryDefaults(partial: Partial<LorebookEntry>): LorebookEntry {
  return {
    id: partial.id ?? crypto.randomUUID(),
    ...ENTRY_DEFAULTS,
    ...partial,
  };
}

export function createDefaultLorebook(name: string): Lorebook {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    name,
    entries: [],
    recursiveScanning: false,
    caseSensitive: false,
    matchWholeWords: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateEntry(
  book: Lorebook,
  entryId: string,
  patch: Partial<LorebookEntry>,
): Lorebook {
  const idx = book.entries.findIndex((e) => e.id === entryId);
  if (idx < 0) return book;
  const nextEntries = book.entries.slice();
  nextEntries[idx] = { ...nextEntries[idx], ...patch };
  return { ...book, entries: nextEntries, updatedAt: Date.now() };
}

export function removeEntry(book: Lorebook, entryId: string): Lorebook {
  const idx = book.entries.findIndex((e) => e.id === entryId);
  if (idx < 0) return book;
  const nextEntries = book.entries.slice();
  nextEntries.splice(idx, 1);
  return { ...book, entries: nextEntries, updatedAt: Date.now() };
}

export function movePromptItem<T>(arr: T[], from: number, to: number): T[] {
  if (from === to) return arr;
  if (from < 0 || from >= arr.length) return arr;
  if (to < 0 || to >= arr.length) return arr;
  const next = arr.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function clampNumber(
  value: unknown,
  min: number,
  max: number,
  fallback?: number,
): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback ?? min;
  if (n < min) return min;
  if (n > max) return max;
  return n;
}
```

- [ ] **Step 1.4: Run tests to verify they pass**

```
npx vitest run templates/react/sillytavern/editor-utils.test.ts
```

Expected: all 22 assertions pass.

- [ ] **Step 1.5: Commit**

```bash
git add templates/react/sillytavern/editor-utils.ts templates/react/sillytavern/editor-utils.test.ts
git commit -m "Add editor-utils pure functions with tests"
```

---

## Task 2: Extend useSillytavern hook

**Files:**
- Modify: `templates/react/hooks/useSillytavern.ts`

- [ ] **Step 2.1: Add imports for new helpers**

In `templates/react/hooks/useSillytavern.ts`, locate the imports near the top. Add `deleteLorebook` and `deletePreset` imports from `database` (they already exist there), and import `createDefaultLorebook` from `editor-utils`. Also import `createDefaultPreset` from `types`.

Find the block (around line 16-28):

```ts
import {
  getDatabase,
  initializeDatabase,
  getLorebooks,
  getPresets,
  getSettings,
  getChats,
  saveLorebook,
  savePreset,
  saveSettings,
  saveChat,
  deleteChat,
} from '../sillytavern/database';
```

Replace it with:

```ts
import {
  getDatabase,
  initializeDatabase,
  getLorebooks,
  getPresets,
  getSettings,
  getChats,
  saveLorebook,
  savePreset,
  saveSettings,
  saveChat,
  deleteChat,
  deleteLorebook as deleteLorebookDb,
  deletePreset as deletePresetDb,
} from '../sillytavern/database';
import { createDefaultLorebook } from '../sillytavern/editor-utils';
import { createDefaultPreset } from '../sillytavern/types';
```

Also expand the `ChatPreset`/`Lorebook` type imports if needed — they are already imported (`type ChatPreset, type Lorebook`).

- [ ] **Step 2.2: Add update/delete/new-from-default methods**

Locate the block ending around line 197 with `addLorebook`. After `addLorebook`, insert the following before `toggleLorebook`:

```ts
  const updateLorebook = useCallback(async (book: Lorebook) => {
    const next: Lorebook = { ...book, updatedAt: Date.now() };
    await saveLorebook(next);
    setLorebooks((prev) => prev.map((b) => (b.id === next.id ? next : b)));
  }, []);

  const deleteLorebook = useCallback(async (id: string) => {
    await deleteLorebookDb(id);
    setLorebooks((prev) => prev.filter((b) => b.id !== id));
    setSettings((prev) => {
      if (!prev) return prev;
      if (!prev.activeLorebookIds?.includes(id)) return prev;
      const next = {
        ...prev,
        activeLorebookIds: prev.activeLorebookIds.filter((x) => x !== id),
      };
      saveSettings(next);
      return next;
    });
  }, []);

  const addLorebookFromDefault = useCallback(async (name: string) => {
    const book = createDefaultLorebook(name);
    await saveLorebook(book);
    setLorebooks((prev) => [...prev, book]);
    return book;
  }, []);

  const updatePreset = useCallback(async (preset: ChatPreset) => {
    const next: ChatPreset = { ...preset, updatedAt: Date.now() };
    await savePreset(next);
    setPresets((prev) => prev.map((p) => (p.id === next.id ? next : p)));
  }, []);

  const deletePreset = useCallback(async (id: string) => {
    await deletePresetDb(id);
    setPresets((prev) => prev.filter((p) => p.id !== id));
    setSettings((prev) => {
      if (!prev) return prev;
      if (prev.activePresetId !== id) return prev;
      const next = { ...prev, activePresetId: null };
      saveSettings(next);
      return next;
    });
  }, []);

  const addPresetFromDefault = useCallback(async (name: string) => {
    const base = createDefaultPreset();
    const preset: ChatPreset = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...base,
      name,
    };
    await savePreset(preset);
    setPresets((prev) => [...prev, preset]);
    return preset;
  }, []);
```

- [ ] **Step 2.3: Export the new methods from the hook return**

Find the `return {` block at the bottom (around line 334). Update the "settings / lorebook / preset mutations" section:

```ts
    // settings / lorebook / preset mutations
    updateSettings,
    addPreset,
    addLorebook,
    toggleLorebook,
```

Replace with:

```ts
    // settings / lorebook / preset mutations
    updateSettings,
    addPreset,
    addLorebook,
    toggleLorebook,
    updateLorebook,
    deleteLorebook,
    addLorebookFromDefault,
    updatePreset,
    deletePreset,
    addPresetFromDefault,
```

- [ ] **Step 2.4: Verify by reading the file**

Open `templates/react/hooks/useSillytavern.ts` and confirm:
1. New imports are present (`deleteLorebook as deleteLorebookDb`, `deletePreset as deletePresetDb`, `createDefaultLorebook`, `createDefaultPreset`).
2. Six new `useCallback` blocks are defined between `addLorebook` and `toggleLorebook` (or just after `toggleLorebook` — order doesn't matter functionally).
3. All six methods are listed in the returned object.

- [ ] **Step 2.5: Commit**

```bash
git add templates/react/hooks/useSillytavern.ts
git commit -m "Add lorebook/preset update/delete/new-from-default to hook"
```

---

## Task 3: PromptOrderEditor component

**Files:**
- Create: `templates/react/components/SillyTavern/PromptOrderEditor.tsx`

- [ ] **Step 3.1: Create the file**

Create `templates/react/components/SillyTavern/PromptOrderEditor.tsx`:

```tsx
import { movePromptItem } from '../../sillytavern/editor-utils';

export interface PromptOrderItem {
  identifier: string;
  name?: string;
  role?: 'system' | 'user' | 'assistant';
  enabled?: boolean;
}

export function PromptOrderEditor({
  value,
  onChange,
}: {
  value: PromptOrderItem[];
  onChange: (next: PromptOrderItem[]) => void;
}) {
  const setEnabled = (idx: number, enabled: boolean) => {
    const next = value.slice();
    next[idx] = { ...next[idx], enabled };
    onChange(next);
  };

  const move = (from: number, to: number) => {
    const next = movePromptItem(value, from, to);
    if (next !== value) onChange(next);
  };

  if (value.length === 0) {
    return (
      <div style={{ color: '#888', fontSize: 13, padding: 12 }}>
        当前预设没有 prompt_order 数组。导入 SillyTavern 预设或新建默认预设以获得标准顺序。
      </div>
    );
  }

  return (
    <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {value.map((item, idx) => (
        <li
          key={item.identifier + idx}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 8px',
            borderBottom: '1px solid #eee',
          }}
        >
          <input
            type="checkbox"
            checked={item.enabled !== false}
            onChange={(e) => setEnabled(idx, e.target.checked)}
          />
          <code style={{ fontSize: 12, color: '#888', minWidth: 140 }}>{item.identifier}</code>
          <span style={{ flex: 1 }}>{item.name ?? item.identifier}</span>
          <button
            disabled={idx === 0}
            onClick={() => move(idx, idx - 1)}
            style={{ padding: '2px 8px' }}
            title="上移"
          >
            ↑
          </button>
          <button
            disabled={idx === value.length - 1}
            onClick={() => move(idx, idx + 1)}
            style={{ padding: '2px 8px' }}
            title="下移"
          >
            ↓
          </button>
        </li>
      ))}
    </ol>
  );
}
```

- [ ] **Step 3.2: Commit**

```bash
git add templates/react/components/SillyTavern/PromptOrderEditor.tsx
git commit -m "Add PromptOrderEditor with up/down buttons and enable toggle"
```

---

## Task 4: EntryForm component

**Files:**
- Create: `templates/react/components/SillyTavern/EntryForm.tsx`

- [ ] **Step 4.1: Create the file**

Create `templates/react/components/SillyTavern/EntryForm.tsx`:

```tsx
import { useState } from 'react';
import type { LorebookEntry } from '../../sillytavern/types';
import { clampNumber } from '../../sillytavern/editor-utils';

const POSITIONS: { value: LorebookEntry['position']; label: string }[] = [
  { value: 'before_char', label: 'before_char (角色前)' },
  { value: 'after_char', label: 'after_char (角色后)' },
  { value: 'before_example', label: 'before_example (示例前)' },
  { value: 'after_example', label: 'after_example (示例后)' },
  { value: 'at_depth', label: 'at_depth (按深度)' },
  { value: 'example_msg_top', label: 'example_msg_top' },
  { value: 'example_msg_bottom', label: 'example_msg_bottom' },
  { value: 'outlet', label: 'outlet' },
];

const LOGICS: { value: LorebookEntry['selectiveLogic']; label: string }[] = [
  { value: 'and_any', label: 'and_any (与/任一)' },
  { value: 'not_all', label: 'not_all (非全部)' },
  { value: 'not_any', label: 'not_any (无任一)' },
  { value: 'and_all', label: 'and_all (与/全部)' },
];

function ChipInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    if (value.includes(v)) {
      setDraft('');
      return;
    }
    onChange([...value, v]);
    setDraft('');
  };
  return (
    <div
      style={{
        border: '1px solid #ccc',
        borderRadius: 4,
        padding: 4,
        minHeight: 32,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 4,
      }}
    >
      {value.map((v, i) => (
        <span
          key={i}
          style={{
            background: '#eef',
            border: '1px solid #99c',
            borderRadius: 3,
            padding: '2px 6px',
            fontSize: 12,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {v}
          <button
            onClick={() => onChange(value.filter((_, j) => j !== i))}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: '#777',
              padding: 0,
            }}
            title="移除"
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        value={draft}
        placeholder={placeholder ?? '回车添加'}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            add();
          }
        }}
        onBlur={add}
        style={{
          border: 'none',
          outline: 'none',
          flex: 1,
          minWidth: 80,
          fontSize: 13,
        }}
      />
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', marginBottom: 12 }}>
      <span style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 4 }}>
        {label}
      </span>
      {children}
    </label>
  );
}

export function EntryForm({
  value,
  onChange,
}: {
  value: LorebookEntry;
  onChange: (patch: Partial<LorebookEntry>) => void;
}) {
  const isAtDepth = value.position === 'at_depth';

  return (
    <div style={{ padding: 12 }}>
      <Row label="关键词 (主)">
        <ChipInput value={value.keys} onChange={(keys) => onChange({ keys })} />
      </Row>
      <Row label="次级关键词 (selective 时启用)">
        <ChipInput
          value={value.secondaryKeys}
          onChange={(secondaryKeys) => onChange({ secondaryKeys })}
        />
      </Row>
      <Row label="备注 (comment)">
        <input
          type="text"
          value={value.comment ?? ''}
          onChange={(e) => onChange({ comment: e.target.value })}
          placeholder="留空时使用内容前 30 字"
          style={{ width: '100%', padding: 6 }}
        />
      </Row>
      <Row label="内容 (content)">
        <textarea
          value={value.content}
          onChange={(e) => onChange({ content: e.target.value })}
          style={{
            width: '100%',
            height: 200,
            padding: 8,
            fontFamily: 'monospace',
            fontSize: 13,
          }}
        />
      </Row>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <Row label="位置 (position)">
          <select
            value={value.position}
            onChange={(e) => onChange({ position: e.target.value as LorebookEntry['position'] })}
            style={{ padding: 6, width: 220 }}
          >
            {POSITIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </Row>
        {isAtDepth && (
          <>
            <Row label="深度 (depth)">
              <input
                type="number"
                value={value.depth ?? 4}
                onChange={(e) =>
                  onChange({ depth: clampNumber(e.target.value, 0, 999, 4) })
                }
                style={{ padding: 6, width: 80 }}
              />
            </Row>
            <Row label="角色 (role)">
              <select
                value={value.role ?? 0}
                onChange={(e) => onChange({ role: Number(e.target.value) })}
                style={{ padding: 6, width: 120 }}
              >
                <option value={0}>system</option>
                <option value={1}>user</option>
                <option value={2}>assistant</option>
              </select>
            </Row>
          </>
        )}
        <Row label="优先级 (order)">
          <input
            type="number"
            value={value.order}
            onChange={(e) => onChange({ order: clampNumber(e.target.value, 0, 9999, 100) })}
            style={{ padding: 6, width: 80 }}
          />
        </Row>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 12 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            checked={value.constant}
            onChange={(e) => onChange({ constant: e.target.checked })}
          />
          常驻 (constant)
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            checked={value.selective}
            onChange={(e) => onChange({ selective: e.target.checked })}
          />
          选择性 (selective)
        </label>
        {value.selective && (
          <select
            value={value.selectiveLogic}
            onChange={(e) =>
              onChange({ selectiveLogic: e.target.value as LorebookEntry['selectiveLogic'] })
            }
            style={{ padding: 4 }}
          >
            {LOGICS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        )}
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            checked={value.useProbability ?? false}
            onChange={(e) => onChange({ useProbability: e.target.checked })}
          />
          启用概率
        </label>
        {value.useProbability && (
          <input
            type="number"
            value={value.probability}
            onChange={(e) =>
              onChange({ probability: clampNumber(e.target.value, 0, 100, 100) })
            }
            style={{ padding: 4, width: 70 }}
            min={0}
            max={100}
          />
        )}
      </div>

      <details style={{ borderTop: '1px solid #eee', paddingTop: 12 }}>
        <summary style={{ cursor: 'pointer', fontSize: 13, color: '#555' }}>
          高级设置
        </summary>
        <div style={{ paddingTop: 12 }}>
          <Row label="扫描深度 (scanDepth)">
            <input
              type="number"
              value={value.scanDepth ?? 0}
              onChange={(e) => onChange({ scanDepth: clampNumber(e.target.value, 0, 999, 0) })}
              style={{ padding: 6, width: 100 }}
            />
          </Row>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
            <label>
              <input
                type="checkbox"
                checked={value.caseSensitive ?? false}
                onChange={(e) => onChange({ caseSensitive: e.target.checked })}
              />
              区分大小写
            </label>
            <label>
              <input
                type="checkbox"
                checked={value.matchWholeWords ?? false}
                onChange={(e) => onChange({ matchWholeWords: e.target.checked })}
              />
              全词匹配
            </label>
            <label>
              <input
                type="checkbox"
                checked={value.excludeRecursion ?? false}
                onChange={(e) => onChange({ excludeRecursion: e.target.checked })}
              />
              排除递归
            </label>
            <label>
              <input
                type="checkbox"
                checked={value.preventRecursion ?? false}
                onChange={(e) => onChange({ preventRecursion: e.target.checked })}
              />
              阻止递归
            </label>
            <label>
              <input
                type="checkbox"
                checked={value.addMemo ?? false}
                onChange={(e) => onChange({ addMemo: e.target.checked })}
              />
              添加备注 (addMemo)
            </label>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <Row label="sticky">
              <input
                type="number"
                value={value.sticky ?? 0}
                onChange={(e) => onChange({ sticky: clampNumber(e.target.value, 0, 9999, 0) })}
                style={{ padding: 6, width: 90 }}
              />
            </Row>
            <Row label="cooldown">
              <input
                type="number"
                value={value.cooldown ?? 0}
                onChange={(e) => onChange({ cooldown: clampNumber(e.target.value, 0, 9999, 0) })}
                style={{ padding: 6, width: 90 }}
              />
            </Row>
            <Row label="delay">
              <input
                type="number"
                value={value.delay ?? 0}
                onChange={(e) => onChange({ delay: clampNumber(e.target.value, 0, 9999, 0) })}
                style={{ padding: 6, width: 90 }}
              />
            </Row>
            <Row label="weight">
              <input
                type="number"
                value={value.weight ?? 100}
                onChange={(e) => onChange({ weight: clampNumber(e.target.value, 0, 9999, 100) })}
                style={{ padding: 6, width: 90 }}
              />
            </Row>
          </div>

          <Row label="分组 (group)">
            <input
              type="text"
              value={value.group ?? ''}
              onChange={(e) => onChange({ group: e.target.value })}
              style={{ padding: 6, width: '100%' }}
            />
          </Row>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <input
              type="checkbox"
              checked={value.useGroupScoring ?? false}
              onChange={(e) => onChange({ useGroupScoring: e.target.checked })}
            />
            分组评分
          </label>

          <fieldset style={{ marginBottom: 12, border: '1px solid #ddd', padding: 8 }}>
            <legend style={{ fontSize: 12, color: '#555' }}>字符卡匹配</legend>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {(
                [
                  ['matchPersonaDescription', '人设描述'],
                  ['matchCharacterDescription', '角色描述'],
                  ['matchCharacterPersonality', '角色性格'],
                  ['matchCharacterDepthPrompt', '角色深度提示'],
                  ['matchScenario', '场景'],
                  ['matchCreatorNotes', '创建者备注'],
                ] as const
              ).map(([k, label]) => (
                <label key={k} style={{ fontSize: 12 }}>
                  <input
                    type="checkbox"
                    checked={(value as any)[k] ?? false}
                    onChange={(e) => onChange({ [k]: e.target.checked } as any)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <Row label="decorators (逗号分隔)">
            <input
              type="text"
              value={(value.decorators ?? []).join(', ')}
              onChange={(e) =>
                onChange({
                  decorators: e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              style={{ padding: 6, width: '100%' }}
            />
          </Row>

          <Row label="characterFilter (JSON,留空表示无)">
            <textarea
              value={value.characterFilter ? JSON.stringify(value.characterFilter, null, 2) : ''}
              onChange={(e) => {
                const raw = e.target.value.trim();
                if (!raw) {
                  onChange({ characterFilter: undefined });
                  return;
                }
                try {
                  onChange({ characterFilter: JSON.parse(raw) });
                } catch {
                  // silently ignore parse errors while typing
                }
              }}
              style={{
                width: '100%',
                height: 80,
                padding: 6,
                fontFamily: 'monospace',
                fontSize: 12,
              }}
            />
          </Row>
        </div>
      </details>
    </div>
  );
}
```

- [ ] **Step 4.2: Commit**

```bash
git add templates/react/components/SillyTavern/EntryForm.tsx
git commit -m "Add EntryForm with core fields and advanced collapse"
```

---

## Task 5: LorebookEditorModal

**Files:**
- Create: `templates/react/components/SillyTavern/LorebookEditorModal.tsx`

- [ ] **Step 5.1: Create the file**

Create `templates/react/components/SillyTavern/LorebookEditorModal.tsx`:

```tsx
import { useState, useMemo } from 'react';
import type { Lorebook, LorebookEntry } from '../../sillytavern/types';
import { EntryForm } from './EntryForm';
import {
  createDefaultEntry,
  updateEntry,
  removeEntry,
} from '../../sillytavern/editor-utils';
import { useSillytavern } from '../../hooks/useSillytavern';

function entryLabel(e: LorebookEntry): string {
  if (e.comment?.trim()) return e.comment;
  if (e.content.trim()) return e.content.trim().slice(0, 30);
  if (e.keys.length) return e.keys.join(', ');
  return '(未命名条目)';
}

export function LorebookEditorModal({
  lorebook,
  onClose,
}: {
  lorebook: Lorebook;
  onClose: () => void;
}) {
  const { updateLorebook } = useSillytavern();
  const [draft, setDraft] = useState<Lorebook>(lorebook);
  const [selectedId, setSelectedId] = useState<string | null>(
    lorebook.entries[0]?.id ?? null,
  );

  const dirty = useMemo(() => draft !== lorebook, [draft, lorebook]);

  const selected = useMemo(
    () => draft.entries.find((e) => e.id === selectedId) ?? null,
    [draft.entries, selectedId],
  );

  const tryClose = () => {
    if (dirty && !confirm('放弃未保存的修改?')) return;
    onClose();
  };

  const handleSave = async () => {
    try {
      await updateLorebook(draft);
      onClose();
    } catch (e) {
      alert('保存失败: ' + (e as Error).message);
    }
  };

  const handleAddEntry = () => {
    const e = createDefaultEntry();
    setDraft((prev) => ({
      ...prev,
      entries: [...prev.entries, e],
      updatedAt: Date.now(),
    }));
    setSelectedId(e.id);
  };

  const handleDeleteEntry = (id: string) => {
    if (!confirm('确定删除此条目?')) return;
    setDraft((prev) => removeEntry(prev, id));
    if (selectedId === id) {
      const remaining = draft.entries.filter((e) => e.id !== id);
      setSelectedId(remaining[0]?.id ?? null);
    }
  };

  const handleEntryChange = (patch: Partial<LorebookEntry>) => {
    if (!selected) return;
    setDraft((prev) => updateEntry(prev, selected.id, patch));
  };

  return (
    <div
      onClick={tryClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.5)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          width: 'min(1100px, 95vw)',
          height: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 6,
          overflow: 'hidden',
        }}
      >
        <header
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid #eee',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <strong>编辑世界书:</strong>
          <input
            type="text"
            value={draft.name}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, name: e.target.value, updatedAt: Date.now() }))
            }
            style={{ flex: 1, padding: 6, fontSize: 14 }}
          />
          <button
            onClick={handleSave}
            disabled={!dirty}
            style={{
              padding: '6px 14px',
              background: dirty ? '#2c8' : '#bbb',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: dirty ? 'pointer' : 'not-allowed',
            }}
          >
            保存
          </button>
          <button onClick={tryClose}>×</button>
        </header>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <aside
            style={{
              width: 280,
              borderRight: '1px solid #eee',
              overflowY: 'auto',
              padding: 8,
            }}
          >
            <button
              onClick={handleAddEntry}
              style={{
                width: '100%',
                padding: '6px 10px',
                marginBottom: 8,
                background: '#f0f0f0',
                border: '1px solid #ccc',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              + 新建条目
            </button>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {draft.entries.map((e) => (
                <li
                  key={e.id}
                  onClick={() => setSelectedId(e.id)}
                  style={{
                    padding: '6px 8px',
                    cursor: 'pointer',
                    background: e.id === selectedId ? '#e6f0ff' : 'transparent',
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 13,
                  }}
                >
                  <span
                    style={{
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {entryLabel(e)}
                  </span>
                  <button
                    onClick={(ev) => {
                      ev.stopPropagation();
                      handleDeleteEntry(e.id);
                    }}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#c00',
                      cursor: 'pointer',
                      fontSize: 16,
                    }}
                    title="删除"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
            {draft.entries.length === 0 && (
              <div style={{ textAlign: 'center', color: '#888', padding: 24, fontSize: 13 }}>
                暂无条目,点上方按钮新建
              </div>
            )}
          </aside>

          <main style={{ flex: 1, overflowY: 'auto' }}>
            {selected ? (
              <EntryForm value={selected} onChange={handleEntryChange} />
            ) : (
              <div style={{ textAlign: 'center', color: '#888', padding: 60 }}>
                选择左侧条目或新建一条
              </div>
            )}
          </main>
        </div>

        <footer
          style={{
            padding: '8px 16px',
            borderTop: '1px solid #eee',
            display: 'flex',
            gap: 16,
            fontSize: 12,
            color: '#666',
          }}
        >
          <label>
            <input
              type="checkbox"
              checked={draft.recursiveScanning}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  recursiveScanning: e.target.checked,
                  updatedAt: Date.now(),
                }))
              }
            />
            递归扫描
          </label>
          <label>
            <input
              type="checkbox"
              checked={draft.caseSensitive}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  caseSensitive: e.target.checked,
                  updatedAt: Date.now(),
                }))
              }
            />
            区分大小写
          </label>
          <label>
            <input
              type="checkbox"
              checked={draft.matchWholeWords}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  matchWholeWords: e.target.checked,
                  updatedAt: Date.now(),
                }))
              }
            />
            全词匹配
          </label>
        </footer>
      </div>
    </div>
  );
}
```

- [ ] **Step 5.2: Commit**

```bash
git add templates/react/components/SillyTavern/LorebookEditorModal.tsx
git commit -m "Add LorebookEditorModal with entry list and form"
```

---

## Task 6: PresetModal

**Files:**
- Create: `templates/react/components/SillyTavern/PresetModal.tsx`

- [ ] **Step 6.1: Create the file**

Create `templates/react/components/SillyTavern/PresetModal.tsx`:

```tsx
import { useState, useMemo } from 'react';
import type { ChatPreset } from '../../sillytavern/types';
import { useSillytavern } from '../../hooks/useSillytavern';
import { PromptOrderEditor, type PromptOrderItem } from './PromptOrderEditor';
import { clampNumber } from '../../sillytavern/editor-utils';

const TABS = ['sampling', 'prompts', 'custom', 'order'] as const;
type Tab = typeof TABS[number];
const TAB_LABELS: Record<Tab, string> = {
  sampling: '采样',
  prompts: 'Prompt 文本',
  custom: '自定义 Prompts',
  order: '排序',
};

const PROMPT_TEXT_FIELDS: { key: string; label: string }[] = [
  { key: 'main', label: 'Main' },
  { key: 'nsfw', label: 'NSFW' },
  { key: 'jailbreak', label: 'Jailbreak' },
  { key: 'enhanceDefinitions', label: 'Enhance Definitions' },
  { key: 'impersonation_prompt', label: 'Impersonation Prompt' },
  { key: 'new_chat_prompt', label: 'New Chat Prompt' },
  { key: 'new_group_chat_prompt', label: 'New Group Chat Prompt' },
  { key: 'new_example_chat_prompt', label: 'New Example Chat Prompt' },
  { key: 'continue_nudge_prompt', label: 'Continue Nudge Prompt' },
  { key: 'wi_format', label: 'World Info Format' },
  { key: 'group_nudge_prompt', label: 'Group Nudge Prompt' },
  { key: 'scenario_format', label: 'Scenario Format' },
  { key: 'personality_format', label: 'Personality Format' },
];

interface CustomPromptItem {
  identifier: string;
  role?: 'system' | 'user' | 'assistant';
  content?: string;
}

function NumberField({
  label,
  value,
  onChange,
  step,
  min,
  max,
  fallback,
}: {
  label: string;
  value: number | undefined;
  onChange: (n: number) => void;
  step?: number;
  min?: number;
  max?: number;
  fallback: number;
}) {
  return (
    <label style={{ display: 'block', marginBottom: 8 }}>
      <span style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 2 }}>
        {label}
      </span>
      <input
        type="number"
        step={step ?? 1}
        value={value ?? fallback}
        onChange={(e) =>
          onChange(clampNumber(e.target.value, min ?? -1e9, max ?? 1e9, fallback))
        }
        style={{ padding: 6, width: 140 }}
      />
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string | undefined;
  onChange: (s: string) => void;
  placeholder?: string;
}) {
  return (
    <label style={{ display: 'block', marginBottom: 8 }}>
      <span style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 2 }}>
        {label}
      </span>
      <input
        type="text"
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{ padding: 6, width: '100%' }}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows,
}: {
  label: string;
  value: string | undefined;
  onChange: (s: string) => void;
  rows?: number;
}) {
  return (
    <label style={{ display: 'block', marginBottom: 12 }}>
      <span style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 4 }}>
        {label}
      </span>
      <textarea
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: 8,
          fontFamily: 'monospace',
          fontSize: 12,
        }}
        rows={rows ?? 4}
      />
    </label>
  );
}

export function PresetModal({ onClose }: { onClose: () => void }) {
  const {
    presets,
    settings,
    updateSettings,
    updatePreset,
    deletePreset,
    addPresetFromDefault,
  } = useSillytavern();

  const [selectedId, setSelectedId] = useState<string | null>(
    settings?.activePresetId ?? presets[0]?.id ?? null,
  );
  const original = useMemo(
    () => presets.find((p) => p.id === selectedId) ?? null,
    [presets, selectedId],
  );
  const [draft, setDraft] = useState<ChatPreset | null>(original);
  const [tab, setTab] = useState<Tab>('sampling');

  if (draft && original && draft.id !== original.id) {
    setDraft(original);
  }
  if (!draft && original) {
    setDraft(original);
  }

  const dirty = draft && original && draft !== original;

  const patchSettings = (patch: Record<string, any>) => {
    if (!draft) return;
    setDraft({ ...draft, settings: { ...draft.settings, ...patch } });
  };

  const tryClose = () => {
    if (dirty && !confirm('放弃未保存的修改?')) return;
    onClose();
  };

  const handleSave = async () => {
    if (!draft) return;
    try {
      await updatePreset(draft);
    } catch (e) {
      alert('保存失败: ' + (e as Error).message);
    }
  };

  const handleSelectPreset = (id: string) => {
    if (dirty && !confirm('当前预设有未保存修改,确定切换?')) return;
    setSelectedId(id);
    const next = presets.find((p) => p.id === id);
    setDraft(next ?? null);
  };

  const handleActivate = async () => {
    if (!draft) return;
    await updateSettings({ activePresetId: draft.id });
  };

  const handleNewPreset = async () => {
    const name = prompt('新预设名称', '新预设');
    if (!name) return;
    const p = await addPresetFromDefault(name);
    setSelectedId(p.id);
    setDraft(p);
  };

  const handleDelete = async () => {
    if (!draft) return;
    if (!confirm(`删除预设 "${draft.name}"?`)) return;
    await deletePreset(draft.id);
    const remaining = presets.filter((p) => p.id !== draft.id);
    setSelectedId(remaining[0]?.id ?? null);
    setDraft(remaining[0] ?? null);
  };

  const handleAddCustomPrompt = () => {
    if (!draft) return;
    const current = (draft.settings.prompts ?? []) as CustomPromptItem[];
    const id = prompt('新 prompt 的 identifier (英文/下划线)', 'custom_' + (current.length + 1));
    if (!id) return;
    if (current.some((p) => p.identifier === id)) {
      alert('identifier 已存在');
      return;
    }
    patchSettings({
      prompts: [...current, { identifier: id, role: 'system', content: '' }],
    });
  };

  return (
    <div
      onClick={tryClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.5)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          width: 'min(1100px, 95vw)',
          height: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 6,
          overflow: 'hidden',
        }}
      >
        <header
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid #eee',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <strong>预设管理</strong>
          <button onClick={handleNewPreset}>+ 新建</button>
          {draft && (
            <>
              <button onClick={handleActivate} disabled={settings?.activePresetId === draft.id}>
                {settings?.activePresetId === draft.id ? '当前已激活' : '设为激活'}
              </button>
              <button onClick={handleDelete} style={{ color: '#c00' }}>
                删除
              </button>
            </>
          )}
          <span style={{ flex: 1 }} />
          <button
            onClick={handleSave}
            disabled={!dirty}
            style={{
              padding: '6px 14px',
              background: dirty ? '#2c8' : '#bbb',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: dirty ? 'pointer' : 'not-allowed',
            }}
          >
            保存
          </button>
          <button onClick={tryClose}>×</button>
        </header>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <aside
            style={{
              width: 240,
              borderRight: '1px solid #eee',
              overflowY: 'auto',
              padding: 8,
            }}
          >
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {presets.map((p) => (
                <li
                  key={p.id}
                  onClick={() => handleSelectPreset(p.id)}
                  style={{
                    padding: '6px 8px',
                    cursor: 'pointer',
                    background: p.id === selectedId ? '#e6f0ff' : 'transparent',
                    borderRadius: 4,
                    fontSize: 13,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {settings?.activePresetId === p.id ? '★ ' : ''}
                  {p.name}
                </li>
              ))}
            </ul>
            {presets.length === 0 && (
              <div style={{ textAlign: 'center', color: '#888', padding: 24, fontSize: 13 }}>
                暂无预设
              </div>
            )}
          </aside>

          <main style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
            {!draft ? (
              <div style={{ textAlign: 'center', color: '#888', padding: 60 }}>
                选择左侧预设或新建一个
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    名称:
                    <input
                      type="text"
                      value={draft.name}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                      style={{ padding: 6, flex: 1 }}
                    />
                  </label>
                </div>

                <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                  {TABS.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      style={{
                        padding: '4px 10px',
                        border: 'none',
                        background: tab === t ? '#333' : '#f0f0f0',
                        color: tab === t ? '#fff' : '#333',
                        borderRadius: 4,
                        cursor: 'pointer',
                      }}
                    >
                      {TAB_LABELS[t]}
                    </button>
                  ))}
                </div>

                {tab === 'sampling' && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <NumberField
                      label="temp_openai (温度)"
                      value={draft.settings.temp_openai}
                      onChange={(v) => patchSettings({ temp_openai: v })}
                      step={0.05}
                      min={0}
                      max={2}
                      fallback={0.8}
                    />
                    <NumberField
                      label="top_p_openai"
                      value={draft.settings.top_p_openai}
                      onChange={(v) => patchSettings({ top_p_openai: v })}
                      step={0.01}
                      min={0}
                      max={1}
                      fallback={0.9}
                    />
                    <NumberField
                      label="top_k_openai"
                      value={draft.settings.top_k_openai}
                      onChange={(v) => patchSettings({ top_k_openai: v })}
                      step={1}
                      min={0}
                      max={500}
                      fallback={0}
                    />
                    <NumberField
                      label="top_a_openai"
                      value={draft.settings.top_a_openai}
                      onChange={(v) => patchSettings({ top_a_openai: v })}
                      step={0.01}
                      min={0}
                      max={1}
                      fallback={0}
                    />
                    <NumberField
                      label="min_p_openai"
                      value={draft.settings.min_p_openai}
                      onChange={(v) => patchSettings({ min_p_openai: v })}
                      step={0.01}
                      min={0}
                      max={1}
                      fallback={0}
                    />
                    <NumberField
                      label="freq_pen_openai (频率惩罚)"
                      value={draft.settings.freq_pen_openai}
                      onChange={(v) => patchSettings({ freq_pen_openai: v })}
                      step={0.1}
                      min={-2}
                      max={2}
                      fallback={0}
                    />
                    <NumberField
                      label="pres_pen_openai (存在惩罚)"
                      value={draft.settings.pres_pen_openai}
                      onChange={(v) => patchSettings({ pres_pen_openai: v })}
                      step={0.1}
                      min={-2}
                      max={2}
                      fallback={0}
                    />
                    <NumberField
                      label="repetition_penalty_openai"
                      value={draft.settings.repetition_penalty_openai}
                      onChange={(v) => patchSettings({ repetition_penalty_openai: v })}
                      step={0.05}
                      min={0}
                      max={2}
                      fallback={1}
                    />
                    <NumberField
                      label="openai_max_context"
                      value={draft.settings.openai_max_context}
                      onChange={(v) => patchSettings({ openai_max_context: v })}
                      step={256}
                      min={256}
                      max={2_000_000}
                      fallback={4096}
                    />
                    <NumberField
                      label="openai_max_tokens"
                      value={draft.settings.openai_max_tokens}
                      onChange={(v) => patchSettings({ openai_max_tokens: v })}
                      step={64}
                      min={32}
                      max={32768}
                      fallback={2048}
                    />
                    <TextField
                      label="openai_model"
                      value={draft.settings.openai_model}
                      onChange={(v) => patchSettings({ openai_model: v })}
                      placeholder="gpt-3.5-turbo"
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <label>
                        <input
                          type="checkbox"
                          checked={!!draft.settings.stream_openai}
                          onChange={(e) => patchSettings({ stream_openai: e.target.checked })}
                        />
                        stream_openai
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={!!draft.settings.max_context_unlocked}
                          onChange={(e) =>
                            patchSettings({ max_context_unlocked: e.target.checked })
                          }
                        />
                        max_context_unlocked
                      </label>
                    </div>
                  </div>
                )}

                {tab === 'prompts' && (
                  <div>
                    {PROMPT_TEXT_FIELDS.map((f) => (
                      <TextArea
                        key={f.key}
                        label={f.label + ' (' + f.key + ')'}
                        value={draft.settings[f.key]}
                        onChange={(v) => patchSettings({ [f.key]: v })}
                        rows={4}
                      />
                    ))}
                  </div>
                )}

                {tab === 'custom' && (
                  <div>
                    <button onClick={handleAddCustomPrompt} style={{ marginBottom: 12 }}>
                      + 新建自定义 prompt
                    </button>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {((draft.settings.prompts ?? []) as CustomPromptItem[]).map((p, idx) => (
                        <li
                          key={p.identifier + idx}
                          style={{
                            border: '1px solid #ddd',
                            borderRadius: 4,
                            padding: 8,
                            marginBottom: 8,
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              gap: 8,
                              alignItems: 'center',
                              marginBottom: 8,
                            }}
                          >
                            <code style={{ fontSize: 12, color: '#888' }}>{p.identifier}</code>
                            <select
                              value={p.role ?? 'system'}
                              onChange={(e) => {
                                const list = (draft.settings.prompts ?? []).slice();
                                list[idx] = { ...list[idx], role: e.target.value as any };
                                patchSettings({ prompts: list });
                              }}
                              style={{ padding: 4 }}
                            >
                              <option value="system">system</option>
                              <option value="user">user</option>
                              <option value="assistant">assistant</option>
                            </select>
                            <span style={{ flex: 1 }} />
                            <button
                              onClick={() => {
                                if (!confirm('删除此 prompt?')) return;
                                const list = (draft.settings.prompts ?? []).filter(
                                  (_: any, i: number) => i !== idx,
                                );
                                patchSettings({ prompts: list });
                              }}
                              style={{ color: '#c00' }}
                            >
                              删除
                            </button>
                          </div>
                          <textarea
                            value={p.content ?? ''}
                            onChange={(e) => {
                              const list = (draft.settings.prompts ?? []).slice();
                              list[idx] = { ...list[idx], content: e.target.value };
                              patchSettings({ prompts: list });
                            }}
                            style={{
                              width: '100%',
                              minHeight: 80,
                              padding: 6,
                              fontFamily: 'monospace',
                              fontSize: 12,
                            }}
                          />
                        </li>
                      ))}
                    </ul>
                    {((draft.settings.prompts ?? []) as CustomPromptItem[]).length === 0 && (
                      <div style={{ color: '#888', padding: 16, fontSize: 13 }}>
                        无自定义 prompt
                      </div>
                    )}
                  </div>
                )}

                {tab === 'order' && (
                  <PromptOrderEditor
                    value={(draft.settings.prompt_order ?? []) as PromptOrderItem[]}
                    onChange={(next) => patchSettings({ prompt_order: next })}
                  />
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6.2: Commit**

```bash
git add templates/react/components/SillyTavern/PresetModal.tsx
git commit -m "Add PresetModal with sampling/prompts/custom/order tabs"
```

---

## Task 7: Extend LorebookModal

**Files:**
- Modify: `templates/react/components/SillyTavern/LorebookModal.tsx`

- [ ] **Step 7.1: Add imports and state for the editor modal**

At the top of `templates/react/components/SillyTavern/LorebookModal.tsx`, after the existing imports, add:

```ts
import { LorebookEditorModal } from './LorebookEditorModal';
```

Inside the function body, after the existing `const [activeIds, setActiveIds] = useState<Set<string>>(new Set());` (around line 12), add:

```ts
  const [editing, setEditing] = useState<Lorebook | null>(null);
```

And in the destructuring line `const { lorebooks, toggleLorebook } = useSillytavern();`, replace with:

```ts
  const { lorebooks, toggleLorebook, addLorebookFromDefault, deleteLorebook } = useSillytavern();
```

- [ ] **Step 7.2: Add "+ 新建" button next to "批量导入 JSON"**

Locate the existing import block (the `<label>` containing "批量导入 JSON" around line 63-118). After the closing `</label>` and the adjacent `<span>` (around line 117), but still inside the surrounding `<div style={{ marginBottom: 16 }}>`, add a button:

Find this exact block:

```tsx
          <span style={{ marginLeft: 8, fontSize: 12, color: '#888' }}>
            支持多选 .json 文件
          </span>
        </div>
```

Replace with:

```tsx
          <span style={{ marginLeft: 8, fontSize: 12, color: '#888' }}>
            支持多选 .json 文件
          </span>
          <button
            onClick={async () => {
              const name = prompt('新世界书名称', '新世界书');
              if (!name) return;
              const lb = await addLorebookFromDefault(name);
              setList(await db.lorebooks.toArray());
              setEditing(lb);
            }}
            style={{
              marginLeft: 8,
              padding: '8px 12px',
              background: '#2c8',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            + 新建
          </button>
        </div>
```

- [ ] **Step 7.3: Replace the existing delete handler with hook-based one and add "✎ 编辑"**

Locate the action button row for each lorebook (around line 172-223, containing "重命名" and "删除" buttons). Find this exact block:

```tsx
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  marginTop: 6,
                  paddingLeft: 24,
                }}
              >
                <button
                  style={{ fontSize: 12, padding: '2px 8px' }}
                  onClick={async () => {
                    const v = prompt('新名称', lb.name);
                    if (!v || v === lb.name) return;
```

(Don't replace yet — just locate it.) Then find the closing of the delete button:

```tsx
                <button
                  style={{ fontSize: 12, padding: '2px 8px', color: '#c00' }}
                  onClick={async () => {
                    if (!confirm(`确定删除世界书 "${lb.name}"？`)) return;
                    await db.lorebooks.delete(lb.id);
                    setList(await db.lorebooks.toArray());
                  }}
                >
                  删除
                </button>
              </div>
```

Replace it (the delete button only) with:

```tsx
                <button
                  style={{ fontSize: 12, padding: '2px 8px' }}
                  onClick={() => setEditing(lb)}
                >
                  ✎ 编辑
                </button>
                <button
                  style={{ fontSize: 12, padding: '2px 8px', color: '#c00' }}
                  onClick={async () => {
                    if (!confirm(`确定删除世界书 "${lb.name}"？`)) return;
                    await deleteLorebook(lb.id);
                    setList(await db.lorebooks.toArray());
                  }}
                >
                  删除
                </button>
              </div>
```

The change: add the "✎ 编辑" button before the delete button, and have delete go through `deleteLorebook` (the hook method) instead of `db.lorebooks.delete` directly so settings get cleaned up too.

- [ ] **Step 7.4: Render the editor modal at the end of the component**

Locate the very last `</aside></div>` of the component (around line 240-243). Find this block:

```tsx
        {list.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              color: '#888',
              padding: '40px 0',
              fontSize: 14,
            }}
          >
            暂无世界书，请导入 JSON 文件
          </div>
        )}
      </aside>
    </div>
  );
}
```

Replace with:

```tsx
        {list.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              color: '#888',
              padding: '40px 0',
              fontSize: 14,
            }}
          >
            暂无世界书,请导入 JSON 文件或点击「+ 新建」
          </div>
        )}
      </aside>
      {editing && (
        <LorebookEditorModal
          lorebook={editing}
          onClose={async () => {
            setEditing(null);
            setList(await db.lorebooks.toArray());
          }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 7.5: Verify by reading the modified file**

Open `templates/react/components/SillyTavern/LorebookModal.tsx` and confirm:
1. `import { LorebookEditorModal } from './LorebookEditorModal';` is at the top.
2. `addLorebookFromDefault` and `deleteLorebook` are destructured from `useSillytavern()`.
3. `const [editing, setEditing] = useState<Lorebook | null>(null);` is present.
4. "+ 新建" button is added.
5. "✎ 编辑" button is added per row.
6. The delete button uses `deleteLorebook` (not `db.lorebooks.delete`).
7. `{editing && <LorebookEditorModal ... />}` is rendered.

- [ ] **Step 7.6: Commit**

```bash
git add templates/react/components/SillyTavern/LorebookModal.tsx
git commit -m "Add new/edit entry points to LorebookModal"
```

---

## Task 8: Wire modals into GameView

**Files:**
- Modify: `templates/react/components/SillyTavern/GameView.tsx`

- [ ] **Step 8.1: Add imports and modal rendering**

The current `GameView.tsx` has buttons that flip `showSettings/showLorebooks/showPresets` via `openSettings/openLorebooks/openPresets`, but never renders the matching modals — a pre-existing bug. Fix it now.

Open `templates/react/components/SillyTavern/GameView.tsx`. Replace the entire file with:

```tsx
import { useState, useMemo } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';
import { ThinkingFold } from './ThinkingFold';
import { MainTextPane } from './MainTextPane';
import { OptionList } from './OptionList';
import { HistoryDrawer } from './HistoryDrawer';
import { SettingsModal } from './SettingsModal';
import { LorebookModal } from './LorebookModal';
import { PresetModal } from './PresetModal';

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
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => setHistoryOpen(true)}>☰ 历史</button>
        <button onClick={() => st.openSettings()}>⚙ 设置</button>
        <button onClick={() => st.openLorebooks()}>📖 世界书</button>
        <button onClick={() => st.openPresets()}>✦ 预设</button>
        <button disabled={!lastAssistant} onClick={() => st.regenerateLast()}>↻ 重 roll</button>
      </div>

      <ThinkingFold text={display.thinking} mode={st.settings?.thinkingDisplay ?? 'fold'} />
      <MainTextPane text={display.maintext} isStreaming={isStreaming} />
      <OptionList options={display.options} disabled={isStreaming} onPick={(text) => st.sendGameMessage(text)} />

      {display.sum && (
        <details style={{ marginTop: 24, color: '#666' }}>
          <summary>📜 总结</summary>
          <p>{display.sum}</p>
        </details>
      )}

      {historyOpen && <HistoryDrawer onClose={() => setHistoryOpen(false)} />}
      {st.showSettings && st.settings && (
        <SettingsModal
          settings={st.settings}
          updateSettings={st.updateSettings}
          onClose={() => st.setShowSettings(false)}
        />
      )}
      {st.showLorebooks && <LorebookModal onClose={() => st.setShowLorebooks(false)} />}
      {st.showPresets && <PresetModal onClose={() => st.setShowPresets(false)} />}
    </div>
  );
}
```

- [ ] **Step 8.2: Commit**

```bash
git add templates/react/components/SillyTavern/GameView.tsx
git commit -m "Render Settings/Lorebook/Preset modals in GameView"
```

---

## Task 9: Update SKILL.md

**Files:**
- Modify: `SKILL.md`

- [ ] **Step 9.1: Find the inline PresetModal block**

Open `SKILL.md` and find the section that starts with `### React — PresetModal.tsx` (around line 446). The block extends from there for many lines until the next major section. The inline code uses stale hook API (`savePreset` instead of `addPreset`/`updatePreset`) and only handles 3 fields.

- [ ] **Step 9.2: Replace the entire PresetModal inline block with a file reference**

Replace the section starting from `### React — PresetModal.tsx` through the closing of the inline ```tsx code block and any trailing description, ending just before the next `###` heading. Replace with:

```markdown
### React — PresetModal.tsx

（源码位于 `templates/react/components/SillyTavern/PresetModal.tsx`）

提供采样参数、Prompt 文本、自定义 Prompts、prompt_order 排序四个 Tab。

### React — LorebookEditorModal.tsx

（源码位于 `templates/react/components/SillyTavern/LorebookEditorModal.tsx`）

单本世界书的条目列表 + EntryForm 表单。从 LorebookModal 的「✎ 编辑」按钮进入。

### React — EntryForm.tsx

（源码位于 `templates/react/components/SillyTavern/EntryForm.tsx`）

LorebookEntry 的字段编辑器,核心字段直显,高级字段在 `<details>` 折叠。

### React — PromptOrderEditor.tsx

（源码位于 `templates/react/components/SillyTavern/PromptOrderEditor.tsx`）

prompt_order 数组的 ↑↓ 排序 + enabled 复选框。供 PresetModal 使用。

### React — editor-utils.ts

（源码位于 `templates/react/sillytavern/editor-utils.ts`）

纯函数:`createDefaultEntry` / `createDefaultLorebook` / `applyEntryDefaults` / `updateEntry` / `removeEntry` / `movePromptItem` / `clampNumber`。供编辑器组件使用,无 IndexedDB 副作用。
```

If the engineer can't determine the exact boundaries of the inline block in their copy of SKILL.md, the safe approach is: locate the first line `### React — PresetModal.tsx` and the next `###` heading after it; replace everything between (inclusive of the start, exclusive of the next heading) with the markdown above.

- [ ] **Step 9.3: Update the install list at line ~1037**

Find:

```
   - React: `SettingsModal.tsx`, `LorebookModal.tsx`, `PresetModal.tsx`, `ChatModal.tsx`, `Chat.tsx`, `VariablePanel.tsx`
```

Replace with:

```
   - React: `SettingsModal.tsx`, `LorebookModal.tsx`, `LorebookEditorModal.tsx`, `EntryForm.tsx`, `PresetModal.tsx`, `PromptOrderEditor.tsx`, `ChatModal.tsx`, `Chat.tsx`, `VariablePanel.tsx`
```

- [ ] **Step 9.4: Commit**

```bash
git add SKILL.md
git commit -m "Sync SKILL.md with new editor components"
```

---

## Task 10: Manual end-to-end verification

There are no React Testing Library tests for the UI — by design, to avoid new dependencies. Verify by manual exercise in a real consumer project.

- [ ] **Step 10.1: Sandbox check (if a sandbox project exists)**

If `sandbox/` (or similar) exists in the repo with this template installed:

1. Start dev server: `npm run dev` from the sandbox.
2. Open the page in a browser.
3. Verify each:
   - Click "📖 世界书" → LorebookModal opens.
   - Click "+ 新建" → prompt for name → creates empty lorebook → opens LorebookEditorModal.
   - Click "+ 新建条目" → entry appears in left list with "(未命名条目)".
   - Fill in keys, content, change position to `at_depth` → depth/role fields appear.
   - Open 高级设置 → all advanced fields render.
   - Save → modal closes; reopen → values persisted.
   - Import a real SillyTavern lorebook JSON, then edit → save → export → diff against original.
   - Click "✦ 预设" → PresetModal opens.
   - "+ 新建" preset → default preset appears with `prompt_order` populated.
   - Sampling tab: change `temp_openai` → save → reopen → value persisted.
   - 排序 tab: ↑↓ buttons reorder identifiers, checkbox toggles `enabled`.
   - Send a game message; verify the resulting `messages` array (in browser DevTools, log inside `assemblePrompt`) reflects the new order/disabled flags.
4. Verify regressions in existing flows: import JSON still works, settings still save, game streaming still works.

- [ ] **Step 10.2: Run the editor-utils tests one last time**

```
npx vitest run templates/react/sillytavern/editor-utils.test.ts
```

Expected: all assertions pass.

- [ ] **Step 10.3: If verification shows real problems, file a follow-up task and do NOT mark this plan complete.**

If everything passes, the plan is done. No final commit needed — verification is observation, not change.

---

## Self-Review Notes

(Internal — for the planner, not the executor.)

- **Spec coverage:** Tasks 1-2 cover hook+utils. Tasks 3-6 cover the four new components named in the spec (PromptOrderEditor / EntryForm / LorebookEditorModal / PresetModal). Task 7 covers the LorebookModal extension. Task 8 covers GameView wiring (added to fix a latent bug uncovered during planning). Task 9 syncs docs. Task 10 covers verification.
- **No-placeholder check:** Every code step contains complete code; commit messages are concrete; commands include exact paths and expected output.
- **Type consistency:** `LorebookEntry`, `Lorebook`, `ChatPreset`, `PromptOrderItem` used consistently across tasks. Method names `updateLorebook` / `deleteLorebook` / `addLorebookFromDefault` / `updatePreset` / `deletePreset` / `addPresetFromDefault` match between Task 2 (hook export) and Tasks 5-7 (consumers).
- **Latent bug:** `GameView` did not render modals despite `openXxx/showXxx` API existing. Added Task 8 to fix.
- **`database.ts`:** Already has `deleteLorebook` and `deletePreset` — no extension needed (was in earlier spec draft, removed).
