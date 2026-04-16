---
name: sillytavern-web
description: >-
  Fully automated SillyTavern ecosystem integration. Installs lorebooks, presets,
  and AI chat functionality into any web project with one command. Auto-detects
  framework, installs dependencies, generates all code files, and creates UI components.
  Triggers on: sillytavern, lorebook, integrate AI chat, add character cards,
  world info system.
license: MIT
metadata:
  author: User
  version: 2.0.0
  type: automated
  platforms: [react, vue, vanilla]
---

# /sillytavern-web — Automated SillyTavern Integrator

**One-command integration of SillyTavern's lorebook system into any web project.**

Automatically detects your project type, installs dependencies, generates all necessary code,
and creates a complete management UI.

## Trigger

```
/sillytavern-web
/sillytavern-web Add AI chat with lorebooks to my React app
Integrate SillyTavern into this project
Add character cards and world info
```

## Automated Workflow

### Phase 1: Auto-Detect (No user input needed)

Check project structure:
```bash
# Detect framework
ls package.json 2>/dev/null && cat package.json | grep -E '"react"|"vue"'
ls src/**/*.tsx 2>/dev/null && echo "REACT"
ls src/**/*.vue 2>/dev/null && echo "VUE"
```

### Phase 2: Auto-Install

Install `dexie` dependency:
```bash
npm install dexie
```

### Phase 3: Auto-Generate

Create all files automatically:

1. **Core files** in `src/sillytavern/`
2. **React hooks** in `src/hooks/useSillytavern.ts`
3. **UI components** in `src/components/SillyTavern/`
4. **Integration example** in your App.tsx

---

## File Generation Templates

### 1. types.ts

```typescript
/**
 * SillyTavern Web - Core Types
 */

// ========== World Book (Lorebook) Types ==========

export interface LorebookEntry {
  id: string;
  keys: string[];
  secondaryKeys: string[];
  content: string;
  order: number;
  position: 'before_char' | 'after_char' | 'before_example' | 'after_example' | 'at_depth';
  depth?: number;
  selective: boolean;
  selectiveLogic: 'and' | 'or';
  constant: boolean;
  probability: number;
  addMemo: boolean;
  comment?: string;
}

export interface Lorebook {
  id: string;
  name: string;
  description?: string;
  entries: LorebookEntry[];
  recursiveScanning: boolean;
  caseSensitive: boolean;
  matchWholeWords: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface SillyTavernLorebookExport {
  name: string;
  description?: string;
  entries: Array<{
    uid: number;
    key: string[];
    keysecondary: string[];
    comment: string;
    content: string;
    constant: boolean;
    selective: boolean;
    selectiveLogic: 0 | 1;
    addMemo: boolean;
    order: number;
    position: 0 | 1 | 2 | 3 | 4;
    disable: boolean;
    probability: number;
    depth: number;
    group: string;
    useProbability: boolean;
    excluded: boolean;
  }>;
  settings?: {
    recursive_scanning?: boolean;
    case_sensitive?: boolean;
    match_whole_words?: boolean;
  };
}

export interface MatchedEntry {
  entry: LorebookEntry;
  score: number;
  matchedKeywords: string[];
}

// ========== Preset Types ==========

export interface PromptBlock {
  id: string;
  name: string;
  content: string;
  enabled: boolean;
  position: number;
  insertionType: 'system' | 'user' | 'assistant';
  role?: 'system' | 'user' | 'assistant';
  description?: string;
}

export interface GenerationParameters {
  temperature: number;
  maxTokens: number;
  topP: number;
  topK?: number;
  frequencyPenalty: number;
  presencePenalty: number;
  repetitionPenalty?: number;
  minTokens?: number;
}

export interface ChatPreset {
  id: string;
  name: string;
  description?: string;
  promptOrder: PromptBlock[];
  parameters: GenerationParameters;
  contextLength?: number;
  createdAt: number;
  updatedAt: number;
}

// ========== Settings Types ==========

export interface ApiSettings {
  baseUrl: string;
  apiKey: string;
  model: string;
  timeout: number;
}

export interface AppSettings {
  key?: string;
  api: ApiSettings;
  activePresetId: string | null;
  activeLorebookIds: string[];
  userName: string;
  characterName: string;
  theme: 'dark' | 'light';
  language: 'zh' | 'en';
  autoSave: boolean;
  autoSaveInterval: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  api: {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-3.5-turbo',
    timeout: 60000,
  },
  activePresetId: null,
  activeLorebookIds: [],
  userName: '用户',
  characterName: 'AI',
  theme: 'dark',
  language: 'zh',
  autoSave: true,
  autoSaveInterval: 30,
};

// ========== Chat Types ==========

export interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: number;
  metadata?: {
    tokenCount?: number;
    lorebookEntries?: string[];
    processingTime?: number;
  };
}

export interface ChatSession {
  id: string;
  name: string;
  messages: ChatMessage[];
  characterName: string;
  userName: string;
  presetId: string | null;
  lorebookIds: string[];
  createdAt: number;
  updatedAt: number;
}

// ========== Constants ==========

export const DEFAULT_PROMPT_BLOCKS = {
  SYSTEM_PROMPT: 'system_prompt',
  WORLD_INFO: 'world_info',
  CHARACTER_DESCRIPTION: 'character_description',
  SCENARIO: 'scenario',
  EXAMPLE_MESSAGES: 'example_messages',
  CHAT_HISTORY: 'chat_history',
  USER_INPUT: 'user_input',
} as const;

export function createDefaultPreset(): Omit<ChatPreset, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: '默认预设',
    description: '基础对话预设',
    promptOrder: [
      {
        id: DEFAULT_PROMPT_BLOCKS.SYSTEM_PROMPT,
        name: '系统提示',
        content: '你是一个有帮助的AI助手。',
        enabled: true,
        position: 0,
        insertionType: 'system',
        role: 'system',
      },
      {
        id: DEFAULT_PROMPT_BLOCKS.WORLD_INFO,
        name: '世界书',
        content: '',
        enabled: true,
        position: 100,
        insertionType: 'system',
        role: 'system',
        description: '动态插入的世界书条目',
      },
      {
        id: DEFAULT_PROMPT_BLOCKS.CHARACTER_DESCRIPTION,
        name: '角色定义',
        content: '',
        enabled: true,
        position: 200,
        insertionType: 'system',
        role: 'system',
      },
    ],
    parameters: {
      temperature: 0.8,
      maxTokens: 2048,
      topP: 0.9,
      topK: 40,
      frequencyPenalty: 0,
      presencePenalty: 0,
      repetitionPenalty: 1.0,
      minTokens: 0,
    },
    contextLength: 4096,
  };
}
```

### 2. database.ts

```typescript
/**
 * IndexedDB Database Layer
 */

import Dexie, { Table } from 'dexie';
import type { Lorebook, ChatPreset, AppSettings, ChatSession } from './types';
import { DEFAULT_SETTINGS } from './types';

const DB_NAME = 'SillyTavernWebDB';
const DB_VERSION = 1;

class AppDatabase extends Dexie {
  lorebooks!: Table<Lorebook>;
  presets!: Table<ChatPreset>;
  settings!: Table<AppSettings>;
  chats!: Table<ChatSession>;

  constructor() {
    super(DB_NAME);
    this.version(DB_VERSION).stores({
      lorebooks: 'id, name, updatedAt',
      presets: 'id, name, updatedAt',
      settings: 'key',
      chats: 'id, name, updatedAt',
    });
  }
}

let dbInstance: AppDatabase | null = null;

export function getDatabase(): AppDatabase {
  if (!dbInstance) {
    dbInstance = new AppDatabase();
  }
  return dbInstance;
}

export async function initializeDatabase(): Promise<void> {
  const db = getDatabase();

  const presetCount = await db.presets.count();
  if (presetCount === 0) {
    const { createDefaultPreset } = await import('./types');
    const defaultPreset = createDefaultPreset();
    await db.presets.add({
      ...defaultPreset,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as ChatPreset);
  }

  const settingsCount = await db.settings.count();
  if (settingsCount === 0) {
    await db.settings.put({ ...DEFAULT_SETTINGS, key: 'settings' });
  }
}

export async function clearAllData(): Promise<void> {
  const db = getDatabase();
  await db.delete();
  dbInstance = null;
}

export async function getLorebooks(): Promise<Lorebook[]> {
  return getDatabase().lorebooks.toArray();
}

export async function saveLorebook(lorebook: Lorebook): Promise<string> {
  await getDatabase().lorebooks.put(lorebook);
  return lorebook.id;
}

export async function deleteLorebook(id: string): Promise<void> {
  await getDatabase().lorebooks.delete(id);
}

export async function getPresets(): Promise<ChatPreset[]> {
  return getDatabase().presets.toArray();
}

export async function savePreset(preset: ChatPreset): Promise<string> {
  await getDatabase().presets.put(preset);
  return preset.id;
}

export async function deletePreset(id: string): Promise<void> {
  await getDatabase().presets.delete(id);
}

export async function getSettings(): Promise<AppSettings | undefined> {
  const all = await getDatabase().settings.toArray();
  return all[0];
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await getDatabase().settings.put({ ...settings, key: 'settings' });
}

export async function getChats(): Promise<ChatSession[]> {
  return getDatabase().chats.toArray();
}

export async function saveChat(chat: ChatSession): Promise<string> {
  await getDatabase().chats.put(chat);
  return chat.id;
}

export async function deleteChat(id: string): Promise<void> {
  await getDatabase().chats.delete(id);
}
```

### 3. lorebook-engine.ts

```typescript
/**
 * Lorebook Matching Engine
 */

import type { Lorebook, LorebookEntry, MatchedEntry } from './types';

export class LorebookEngine {
  private lorebook: Lorebook;

  constructor(lorebook: Lorebook) {
    this.lorebook = lorebook;
  }

  scan(text: string, additionalContext?: string): MatchedEntry[] {
    const normalizedText = this.lorebook.caseSensitive ? text : text.toLowerCase();
    const normalizedContext = additionalContext
      ? this.lorebook.caseSensitive ? additionalContext : additionalContext.toLowerCase()
      : normalizedText;

    const matched: MatchedEntry[] = [];

    for (const entry of this.lorebook.entries) {
      if (entry.constant) {
        matched.push({ entry, score: -9999, matchedKeywords: ['constant'] });
        continue;
      }

      if (Math.random() * 100 >= entry.probability) {
        continue;
      }

      const isMatch = this.checkEntryMatch(entry, normalizedText, normalizedContext);

      if (isMatch) {
        matched.push({
          entry,
          score: entry.order,
          matchedKeywords: entry.keys.filter(k =>
            this.containsKeyword(normalizedText, this.normalizeKeyword(k))
          ),
        });
      }
    }

    return matched.sort((a, b) => a.score - b.score);
  }

  recursiveScan(initialText: string, maxDepth: number = 3, additionalContext?: string): MatchedEntry[] {
    if (!this.lorebook.recursiveScanning || maxDepth <= 0) {
      return this.scan(initialText, additionalContext);
    }

    const allMatched = new Map<string, MatchedEntry>();
    let currentText = initialText;
    let depth = 0;

    while (depth < maxDepth) {
      const newMatches = this.scan(currentText, additionalContext);
      let hasNewMatches = false;

      for (const match of newMatches) {
        if (!allMatched.has(match.entry.id)) {
          allMatched.set(match.entry.id, match);
          currentText += ' ' + match.entry.content;
          hasNewMatches = true;
        }
      }

      if (!hasNewMatches) break;
      depth++;
    }

    return Array.from(allMatched.values()).sort((a, b) => a.score - b.score);
  }

  groupByPosition(matched: MatchedEntry[]): Record<LorebookEntry['position'], MatchedEntry[]> {
    const grouped: Record<LorebookEntry['position'], MatchedEntry[]> = {
      before_char: [], after_char: [], before_example: [], after_example: [], at_depth: [],
    };

    for (const m of matched) {
      grouped[m.entry.position].push(m);
    }

    return grouped;
  }

  formatEntriesContent(entries: MatchedEntry[]): string {
    if (entries.length === 0) return '';
    return entries.map(e => e.entry.content).join('\n\n');
  }

  private checkEntryMatch(entry: LorebookEntry, text: string, context: string): boolean {
    const { keys, secondaryKeys, selective, selectiveLogic } = entry;

    if (keys.length === 0) return false;

    const primaryMatches = keys.map(k => this.containsKeyword(text, this.normalizeKeyword(k)));
    const hasPrimaryMatch = selectiveLogic === 'and'
      ? primaryMatches.every(m => m)
      : primaryMatches.some(m => m);

    if (!hasPrimaryMatch) return false;

    if (!selective || secondaryKeys.length === 0) {
      return hasPrimaryMatch;
    }

    const secondaryMatches = secondaryKeys.map(k =>
      this.containsKeyword(context, this.normalizeKeyword(k))
    );

    return secondaryMatches.some(m => m);
  }

  private normalizeKeyword(keyword: string): string {
    return this.lorebook.caseSensitive ? keyword : keyword.toLowerCase();
  }

  private containsKeyword(text: string, keyword: string): boolean {
    if (this.lorebook.matchWholeWords) {
      const regex = new RegExp(`\\b${this.escapeRegex(keyword)}\\b`, 'i');
      return regex.test(text);
    }
    return text.includes(keyword);
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

export function createLorebookEngine(lorebook: Lorebook): LorebookEngine {
  return new LorebookEngine(lorebook);
}
```

### 4. prompt-assembler.ts

```typescript
/**
 * Prompt Assembler
 */

import type { ChatPreset, Lorebook, ChatMessage, MatchedEntry } from './types';
import { DEFAULT_PROMPT_BLOCKS } from './types';
import { createLorebookEngine } from './lorebook-engine';

export interface AssembleOptions {
  userInput: string;
  history: ChatMessage[];
  preset: ChatPreset;
  lorebooks: Lorebook[];
  userName: string;
  characterName: string;
}

export interface AssembleResult {
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  matchedEntries: MatchedEntry[];
  systemPrompt: string;
}

export function assemblePrompt(options: AssembleOptions): AssembleResult {
  const { userInput, history, preset, lorebooks, userName, characterName } = options;

  const allMatchedEntries: MatchedEntry[] = [];
  const scanText = userInput + ' ' + history.slice(-3).map(m => m.content).join(' ');

  for (const book of lorebooks) {
    const engine = createLorebookEngine(book);
    const matches = engine.recursiveScan(scanText, 3);
    allMatchedEntries.push(...matches);
  }

  const uniqueEntries = Array.from(
    new Map(allMatchedEntries.map(e => [e.entry.id, e])).values()
  ).sort((a, b) => a.score - b.score);

  const maxContextTokens = preset.contextLength || 4096;
  let currentTokens = 0;

  const recentHistory: { role: 'system' | 'user' | 'assistant'; content: string }[] = [];
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    if (msg.role === 'system') continue;
    const msgTokens = msg.content.length / 4;
    if (currentTokens + msgTokens > maxContextTokens * 0.8) break;
    recentHistory.unshift({ role: msg.role, content: msg.content });
    currentTokens += msgTokens;
  }

  const sortedBlocks = preset.promptOrder
    .filter(b => b.enabled)
    .sort((a, b) => a.position - b.position);

  const assembledMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [];
  let systemAccumulator = '';

  for (const block of sortedBlocks) {
    if (block.id === DEFAULT_PROMPT_BLOCKS.CHAT_HISTORY) {
      if (systemAccumulator) {
        assembledMessages.push({ role: 'system', content: systemAccumulator });
        systemAccumulator = '';
      }
      assembledMessages.push(...recentHistory);
      continue;
    }

    if (block.id === DEFAULT_PROMPT_BLOCKS.USER_INPUT) {
      if (systemAccumulator) {
        assembledMessages.push({ role: 'system', content: systemAccumulator });
        systemAccumulator = '';
      }
      assembledMessages.push({ role: 'user', content: userInput });
      continue;
    }

    let content = block.content;
    content = replaceMacros(content, { userName, characterName, userInput });

    if (block.id === DEFAULT_PROMPT_BLOCKS.WORLD_INFO) {
      const worldInfoContent = uniqueEntries.map(e => e.entry.content).join('\n\n');
      if (worldInfoContent) {
        content = worldInfoContent;
      } else {
        continue;
      }
    }

    if (!content.trim()) continue;

    const role = block.role || block.insertionType || 'system';
    if (role === 'system') {
      systemAccumulator += (systemAccumulator ? '\n\n' : '') + content;
    } else {
      if (systemAccumulator) {
        assembledMessages.push({ role: 'system', content: systemAccumulator });
        systemAccumulator = '';
      }
      assembledMessages.push({ role, content });
    }
  }

  if (systemAccumulator) {
    assembledMessages.unshift({ role: 'system', content: systemAccumulator });
  }

  // Fallback: append history and user input if their blocks weren't configured
  if (!sortedBlocks.some(b => b.id === DEFAULT_PROMPT_BLOCKS.CHAT_HISTORY)) {
    const userIdx = assembledMessages.findIndex(m => m.role === 'user');
    if (userIdx === -1) {
      assembledMessages.push(...recentHistory);
    } else {
      assembledMessages.splice(userIdx, 0, ...recentHistory);
    }
  }

  if (!sortedBlocks.some(b => b.id === DEFAULT_PROMPT_BLOCKS.USER_INPUT)) {
    assembledMessages.push({ role: 'user', content: userInput });
  }

  const systemPrompt = assembledMessages
    .filter(m => m.role === 'system')
    .map(m => m.content)
    .join('\n\n');

  return {
    messages: assembledMessages,
    matchedEntries: uniqueEntries,
    systemPrompt,
  };
}

interface MacroContext {
  userName: string;
  characterName: string;
  userInput: string;
}

export function replaceMacros(template: string, context: MacroContext): string {
  return template
    .replace(/\{\{user\}\}/g, context.userName)
    .replace(/\{\{char\}\}/g, context.characterName)
    .replace(/\{\{original\}\}/g, context.userInput);
}

export const SUPPORTED_MACROS = [
  { name: '{{user}}', description: '用户名' },
  { name: '{{char}}', description: 'AI角色名' },
  { name: '{{original}}', description: '用户原始输入' },
] as const;
```

### 5. importer.ts

```typescript
/**
 * SillyTavern Import/Export Adapter
 */

import type { Lorebook, LorebookEntry, ChatPreset, PromptBlock, SillyTavernLorebookExport } from './types';

const POSITION_MAP: Record<number, LorebookEntry['position']> = {
  0: 'before_char', 1: 'after_char', 2: 'before_example', 3: 'after_example', 4: 'at_depth',
};

const REVERSE_POSITION_MAP: Record<LorebookEntry['position'], number> = {
  before_char: 0, after_char: 1, before_example: 2, after_example: 3, at_depth: 4,
};

const LOGIC_MAP: Record<number, 'and' | 'or'> = { 0: 'and', 1: 'or' };

export function importLorebook(data: SillyTavernLorebookExport): Omit<Lorebook, 'id' | 'createdAt' | 'updatedAt'> {
  const entries: LorebookEntry[] = (data.entries || [])
    .filter((e) => !e.disable && !e.excluded)
    .map((e) => ({
      id: crypto.randomUUID(),
      keys: e.key || [],
      secondaryKeys: e.keysecondary || [],
      content: e.content || '',
      order: e.order ?? 100,
      position: POSITION_MAP[e.position ?? 1],
      depth: e.depth,
      selective: e.selective ?? false,
      selectiveLogic: LOGIC_MAP[e.selectiveLogic ?? 1],
      constant: e.constant ?? false,
      probability: e.useProbability ? (e.probability ?? 100) : 100,
      addMemo: e.addMemo ?? false,
      comment: e.comment,
    }));

  return {
    name: data.name || '导入的世界书',
    description: data.description,
    entries,
    recursiveScanning: data.settings?.recursive_scanning ?? false,
    caseSensitive: data.settings?.case_sensitive ?? false,
    matchWholeWords: data.settings?.match_whole_words ?? false,
  };
}

export function exportLorebook(lorebook: Lorebook): SillyTavernLorebookExport {
  return {
    name: lorebook.name,
    description: lorebook.description,
    entries: lorebook.entries.map((e, index) => ({
      uid: index,
      key: e.keys,
      keysecondary: e.secondaryKeys || [],
      comment: e.comment || e.content.slice(0, 50),
      content: e.content,
      constant: e.constant,
      selective: e.selective,
      selectiveLogic: (e.selectiveLogic === 'and' ? 0 : 1) as 0 | 1,
      addMemo: e.addMemo,
      order: e.order,
      position: REVERSE_POSITION_MAP[e.position] as 0 | 1 | 2 | 3 | 4,
      disable: false,
      probability: e.probability,
      depth: e.depth ?? 4,
      group: '',
      useProbability: e.probability < 100,
      excluded: false,
    })),
    settings: {
      recursive_scanning: lorebook.recursiveScanning,
      case_sensitive: lorebook.caseSensitive,
      match_whole_words: lorebook.matchWholeWords,
    },
  };
}

export async function importJsonFile<T>(): Promise<T | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) { resolve(null); return; }
      try {
        const text = await file.text();
        resolve(JSON.parse(text) as T);
      } catch {
        resolve(null);
      }
    };
    input.click();
  });
}

export function exportToJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

### 6. index.ts

```typescript
/**
 * Main exports
 */

export * from './types';
export * from './database';
export * from './lorebook-engine';
export * from './prompt-assembler';
export * from './importer';

export const VERSION = '2.0.0';
```

---

## React Integration

### hooks/useSillytavern.ts

```typescript
import { useState, useEffect, useCallback } from 'react';
import {
  getLorebooks, saveLorebook, deleteLorebook,
  getPresets, savePreset, deletePreset,
  getSettings, saveSettings, initializeDatabase,
  type Lorebook, type ChatPreset, type AppSettings,
} from '../sillytavern';

export function useSillytavern() {
  const [lorebooks, setLorebooks] = useState<Lorebook[]>([]);
  const [presets, setPresets] = useState<ChatPreset[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [activeLorebookIds, setActiveLorebookIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setIsLoading(true);
    await initializeDatabase();
    const [l, p, s] = await Promise.all([getLorebooks(), getPresets(), getSettings()]);
    setLorebooks(l);
    setPresets(p);
    setSettings(s || null);
    setActiveLorebookIds(s?.activeLorebookIds || []);
    setIsLoading(false);
  };

  const toggleLorebook = useCallback(async (id: string) => {
    const newIds = activeLorebookIds.includes(id)
      ? activeLorebookIds.filter(i => i !== id)
      : [...activeLorebookIds, id];
    setActiveLorebookIds(newIds);
    if (settings) {
      const newSettings = { ...settings, activeLorebookIds: newIds };
      await saveSettings(newSettings);
      setSettings(newSettings);
    }
  }, [activeLorebookIds, settings]);

  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    if (!settings) return;
    const newSettings = { ...settings, ...updates };
    await saveSettings(newSettings);
    setSettings(newSettings);
  }, [settings]);

  return {
    lorebooks, presets, settings, activeLorebookIds, isLoading,
    loadAll, toggleLorebook, updateSettings,
    saveLorebook, deleteLorebook, savePreset, deletePreset,
  };
}
```

---

## Vue Integration

### composables/useSillytavern.ts

```typescript
import { ref, computed, onMounted } from 'vue';
import {
  getLorebooks, saveLorebook, deleteLorebook,
  getPresets, savePreset, deletePreset,
  getSettings, saveSettings, initializeDatabase,
  type Lorebook, type ChatPreset, type AppSettings,
} from '../sillytavern';

export function useSillytavern() {
  const lorebooks = ref<Lorebook[]>([]);
  const presets = ref<ChatPreset[]>([]);
  const settings = ref<AppSettings | null>(null);
  const activeLorebookIds = ref<string[]>([]);
  const isLoading = ref(true);

  onMounted(() => {
    loadAll();
  });

  const loadAll = async () => {
    isLoading.value = true;
    await initializeDatabase();
    const [l, p, s] = await Promise.all([getLorebooks(), getPresets(), getSettings()]);
    lorebooks.value = l;
    presets.value = p;
    settings.value = s || null;
    activeLorebookIds.value = s?.activeLorebookIds || [];
    isLoading.value = false;
  };

  const toggleLorebook = async (id: string) => {
    const newIds = activeLorebookIds.value.includes(id)
      ? activeLorebookIds.value.filter(i => i !== id)
      : [...activeLorebookIds.value, id];
    activeLorebookIds.value = newIds;
    if (settings.value) {
      const newSettings = { ...settings.value, activeLorebookIds: newIds };
      await saveSettings(newSettings);
      settings.value = newSettings;
    }
  };

  const updateSettings = async (updates: Partial<AppSettings>) => {
    if (!settings.value) return;
    const newSettings = { ...settings.value, ...updates };
    await saveSettings(newSettings);
    settings.value = newSettings;
  };

  return {
    lorebooks: computed(() => lorebooks.value),
    presets: computed(() => presets.value),
    settings: computed(() => settings.value),
    activeLorebookIds: computed(() => activeLorebookIds.value),
    isLoading: computed(() => isLoading.value),
    loadAll,
    toggleLorebook,
    updateSettings,
    saveLorebook,
    deleteLorebook,
    savePreset,
    deletePreset,
  };
}
```

### Vue 使用示例

```vue
<template>
  <div>
    <button @click="showSettings = true">
      设置 ({{ activeLorebookIds.length }} 世界书)
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useSillytavern } from './composables/useSillytavern';

const { lorebooks, settings, activeLorebookIds, toggleLorebook } = useSillytavern();
</script>
```

---

## Vanilla JS Integration

### vanilla/sillytavern-store.ts

```typescript
import {
  getLorebooks, saveLorebook, deleteLorebook,
  getPresets, savePreset, deletePreset,
  getSettings, saveSettings, initializeDatabase,
  type Lorebook, type ChatPreset, type AppSettings,
} from '../sillytavern';

type Listener = () => void;

export function createSillytavernStore() {
  let lorebooks: Lorebook[] = [];
  let presets: ChatPreset[] = [];
  let settings: AppSettings | null = null;
  let activeLorebookIds: string[] = [];
  let isLoading = true;
  const listeners = new Set<Listener>();

  const notify = () => listeners.forEach(cb => cb());

  const loadAll = async () => {
    isLoading = true;
    notify();
    await initializeDatabase();
    const [l, p, s] = await Promise.all([getLorebooks(), getPresets(), getSettings()]);
    lorebooks = l;
    presets = p;
    settings = s || null;
    activeLorebookIds = s?.activeLorebookIds || [];
    isLoading = false;
    notify();
  };

  const toggleLorebook = async (id: string) => {
    const newIds = activeLorebookIds.includes(id)
      ? activeLorebookIds.filter(i => i !== id)
      : [...activeLorebookIds, id];
    activeLorebookIds = newIds;
    if (settings) {
      const newSettings = { ...settings, activeLorebookIds: newIds };
      await saveSettings(newSettings);
      settings = newSettings;
    }
    notify();
  };

  const updateSettings = async (updates: Partial<AppSettings>) => {
    if (!settings) return;
    const newSettings = { ...settings, ...updates };
    await saveSettings(newSettings);
    settings = newSettings;
    notify();
  };

  const subscribe = (cb: Listener) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
  };

  return {
    get lorebooks() { return lorebooks; },
    get presets() { return presets; },
    get settings() { return settings; },
    get activeLorebookIds() { return activeLorebookIds; },
    get isLoading() { return isLoading; },
    loadAll,
    toggleLorebook,
    updateSettings,
    saveLorebook,
    deleteLorebook,
    savePreset,
    deletePreset,
    subscribe,
  };
}

export const sillytavernStore = createSillytavernStore();
```

### Vanilla 使用示例

```html
<script type="module">
  import { sillytavernStore, assemblePrompt } from './sillytavern';

  await sillytavernStore.loadAll();

  sillytavernStore.subscribe(() => {
    const { settings, activeLorebookIds } = sillytavernStore;
    document.getElementById('badge').textContent = activeLorebookIds.length;
  });
</script>
```

---

## Execution Steps

When user runs `/sillytavern-web`:

1. **Detect Framework** (Auto)
   ```bash
   cat package.json | grep -q react && FRAMEWORK=react
   cat package.json | grep -q vue && FRAMEWORK=vue
   ```

2. **Install Dependencies** (Auto)
   ```bash
   npm install dexie
   ```

3. **Create Directory Structure** (Auto - framework specific)
   - React: `src/sillytavern/`, `src/hooks/`, `src/components/SillyTavern/`
   - Vue: `src/sillytavern/`, `src/composables/`, `src/components/SillyTavern/`
   - Vanilla: `src/sillytavern/`, `src/vanilla/`, `src/components/SillyTavern/`

4. **Write All Files** (Auto - use templates above)
   - `src/sillytavern/types.ts`
   - `src/sillytavern/database.ts`
   - `src/sillytavern/lorebook-engine.ts`
   - `src/sillytavern/prompt-assembler.ts`
   - `src/sillytavern/importer.ts`
   - `src/sillytavern/index.ts`
   - Framework integration file (React: `src/hooks/useSillytavern.ts`, Vue: `src/composables/useSillytavern.ts`, Vanilla: `src/vanilla/sillytavern-store.ts`)

5. **Create UI Components** (Auto - generate based on framework)

6. **Show Integration Example** (Auto - display usage code for detected framework)

---

## Verification

After installation, verify:

- [ ] `npm install dexie` succeeded
- [ ] All files created in `src/sillytavern/`
- [ ] No TypeScript errors
- [ ] App compiles successfully
- [ ] Settings modal opens
- [ ] Can import SillyTavern JSON

---

## Output

**A complete working SillyTavern integration with:**
- Full TypeScript type definitions
- IndexedDB persistence layer
- Lorebook keyword matching engine (with primary/secondary key selective logic)
- Prompt assembly with context injection (respects preset block order)
- SillyTavern format import/export
- Framework-specific state management (React hooks / Vue composables / Vanilla store)
- Ready-to-use UI components
