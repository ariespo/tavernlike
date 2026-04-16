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
  variables?: Record<string, string | number>;
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
  variables?: Record<string, string | number>;
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
import { formatVariablesForPrompt } from './variables';

export interface AssembleOptions {
  userInput: string;
  history: ChatMessage[];
  preset: ChatPreset;
  lorebooks: Lorebook[];
  userName: string;
  characterName: string;
  variables?: Record<string, string | number>;
}

export interface AssembleResult {
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  matchedEntries: MatchedEntry[];
  systemPrompt: string;
}

export function assemblePrompt(options: AssembleOptions): AssembleResult {
  const { userInput, history, preset, lorebooks, userName, characterName, variables } = options;

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
    content = replaceMacros(content, { userName, characterName, userInput, variables });

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

  const variablesBlock = formatVariablesForPrompt(variables || {});
  if (variablesBlock) {
    systemAccumulator += (systemAccumulator ? '\n\n' : '') + variablesBlock;
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
  variables?: Record<string, string | number>;
}

export function replaceMacros(template: string, context: MacroContext): string {
  let result = template
    .replace(/\{\{user\}\}/g, context.userName)
    .replace(/\{\{char\}\}/g, context.characterName)
    .replace(/\{\{original\}\}/g, context.userInput);

  if (context.variables) {
    result = result.replace(/\{\{([^{}]+)\}\}/g, (match, key) => {
      const value = context.variables?.[key.trim()];
      return value !== undefined ? String(value) : match;
    });
  }

  return result;
}

export const SUPPORTED_MACROS = [
  { name: '{{user}}', description: '用户名' },
  { name: '{{char}}', description: 'AI角色名' },
  { name: '{{original}}', description: '用户原始输入' },
  { name: '{{变量名}}', description: '自定义变量（例如 {{hp}}）' },
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
export * from './variables';

export const VERSION = '2.0.0';
```

### 7. variables.ts

```typescript
/**
 * Variable System Utilities
 */

export function extractVariables(text: string): { cleanedText: string; updates: Record<string, string | number> } {
  const updates: Record<string, string | number> = {};
  const regex = /<var\s+name="([^"]+)"\s+value="([^"]+)"\s*\/?>/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const [, name, rawValue] = match;
    const num = Number(rawValue);
    updates[name] = Number.isNaN(num) ? rawValue : num;
  }
  const cleanedText = text.replace(regex, '').replace(/\n{2,}/g, '\n').trim();
  return { cleanedText, updates };
}

export function mergeVariables(
  base: Record<string, string | number> = {},
  updates: Record<string, string | number> = {}
): Record<string, string | number> {
  return { ...base, ...updates };
}

export function formatVariablesForPrompt(variables: Record<string, string | number>): string {
  const entries = Object.entries(variables);
  if (entries.length === 0) return '';
  const lines = entries.map(([k, v]) => `${k}: ${v}`);
  return `[当前状态]\n${lines.join('\n')}`;
}
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
  getChats, saveChat, deleteChat as deleteChatById,
  assemblePrompt, extractVariables, mergeVariables,
  type Lorebook, type ChatPreset, type AppSettings, type ChatSession, type ChatMessage,
} from '../sillytavern';

export function useSillytavern() {
  const [lorebooks, setLorebooks] = useState<Lorebook[]>([]);
  const [presets, setPresets] = useState<ChatPreset[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [activeLorebookIds, setActiveLorebookIds] = useState<string[]>([]);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setIsLoading(true);
    await initializeDatabase();
    const [l, p, s, c] = await Promise.all([getLorebooks(), getPresets(), getSettings(), getChats()]);
    setLorebooks(l);
    setPresets(p);
    setSettings(s || null);
    setActiveLorebookIds(s?.activeLorebookIds || []);
    setChats(c);
    setIsLoading(false);
  };

  const activeChat = chats.find(c => c.id === activeChatId) || null;

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

  const createChat = useCallback(async (name?: string) => {
    if (!settings) throw new Error('Settings not loaded');
    const chatCount = chats.filter(c => c.characterName === settings.characterName).length;
    const chatName = name || `${settings.characterName} - 新对话 ${chatCount + 1}`;
    const newChat: ChatSession = {
      id: crypto.randomUUID(),
      name: chatName,
      messages: [],
      characterName: settings.characterName,
      userName: settings.userName,
      presetId: settings.activePresetId || presets[0]?.id || null,
      lorebookIds: [...activeLorebookIds],
      variables: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await saveChat(newChat);
    setChats(prev => [...prev, newChat]);
    setActiveChatId(newChat.id);
    return newChat.id;
  }, [chats, settings, presets, activeLorebookIds]);

  const loadChat = useCallback((id: string) => {
    setActiveChatId(id);
  }, []);

  const deleteChat = useCallback(async (id: string) => {
    await deleteChatById(id);
    setChats(prev => prev.filter(c => c.id !== id));
    if (activeChatId === id) setActiveChatId(null);
  }, [activeChatId]);

  const updateVariables = useCallback(async (updates: Record<string, string | number>) => {
    if (!activeChat) return;
    const merged = mergeVariables(activeChat.variables, updates);
    const updatedChat = { ...activeChat, variables: merged, updatedAt: Date.now() };
    await saveChat(updatedChat);
    setChats(prev => prev.map(c => c.id === updatedChat.id ? updatedChat : c));
  }, [activeChat]);

  const sendMessage = useCallback(async (content: string) => {
    if (!settings || !activeChat) {
      throw new Error('No active chat or settings not loaded');
    }
    setIsSending(true);

    try {
      const activePreset = presets.find(p => p.id === settings.activePresetId) || presets[0];
      if (!activePreset) throw new Error('No preset available');

      const activeBooks = lorebooks.filter(b => activeLorebookIds.includes(b.id));
      const currentVariables = activeChat.variables || {};

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        timestamp: Date.now(),
        variables: { ...currentVariables },
      };

      const updatedMessages = [...activeChat.messages, userMessage];
      let updatedChat = { ...activeChat, messages: updatedMessages, updatedAt: Date.now() };

      const { messages: promptMessages } = assemblePrompt({
        userInput: content,
        history: updatedMessages,
        preset: activePreset,
        lorebooks: activeBooks,
        userName: settings.userName,
        characterName: settings.characterName,
        variables: currentVariables,
      });

      const response = await fetch(settings.api.baseUrl + '/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.api.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: settings.api.model, messages: promptMessages }),
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data = await response.json();
      const rawReply = data.choices?.[0]?.message?.content || '';
      const { cleanedText: reply, updates: extractedVars } = extractVariables(rawReply);
      const nextVariables = mergeVariables(currentVariables, extractedVars);

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: reply,
        timestamp: Date.now(),
        variables: { ...nextVariables },
      };

      updatedChat = { ...updatedChat, messages: [...updatedChat.messages, assistantMessage], variables: nextVariables };
      await saveChat(updatedChat);
      setChats(prev => prev.map(c => c.id === updatedChat.id ? updatedChat : c));
    } finally {
      setIsSending(false);
    }
  }, [activeChat, settings, presets, lorebooks, activeLorebookIds]);

  return {
    lorebooks, presets, settings, activeLorebookIds, chats, activeChatId, activeChat, isSending, isLoading,
    loadAll, toggleLorebook, updateSettings, createChat, loadChat, deleteChat, sendMessage, updateVariables,
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
  getChats, saveChat, deleteChat as deleteChatById,
  assemblePrompt, extractVariables, mergeVariables,
  type Lorebook, type ChatPreset, type AppSettings, type ChatSession, type ChatMessage,
} from '../sillytavern';

export function useSillytavern() {
  const lorebooks = ref<Lorebook[]>([]);
  const presets = ref<ChatPreset[]>([]);
  const settings = ref<AppSettings | null>(null);
  const activeLorebookIds = ref<string[]>([]);
  const chats = ref<ChatSession[]>([]);
  const activeChatId = ref<string | null>(null);
  const isSending = ref(false);
  const isLoading = ref(true);

  onMounted(() => {
    loadAll();
  });

  const loadAll = async () => {
    isLoading.value = true;
    await initializeDatabase();
    const [l, p, s, c] = await Promise.all([getLorebooks(), getPresets(), getSettings(), getChats()]);
    lorebooks.value = l;
    presets.value = p;
    settings.value = s || null;
    activeLorebookIds.value = s?.activeLorebookIds || [];
    chats.value = c;
    isLoading.value = false;
  };

  const activeChat = computed(() => chats.value.find(c => c.id === activeChatId.value) || null);

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

  const createChat = async (name?: string) => {
    if (!settings.value) throw new Error('Settings not loaded');
    const chatCount = chats.value.filter(c => c.characterName === settings.value.characterName).length;
    const chatName = name || `${settings.value.characterName} - 新对话 ${chatCount + 1}`;
    const newChat: ChatSession = {
      id: crypto.randomUUID(),
      name: chatName,
      messages: [],
      characterName: settings.value.characterName,
      userName: settings.value.userName,
      presetId: settings.value.activePresetId || presets.value[0]?.id || null,
      lorebookIds: [...activeLorebookIds.value],
      variables: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await saveChat(newChat);
    chats.value = [...chats.value, newChat];
    activeChatId.value = newChat.id;
    return newChat.id;
  };

  const loadChat = (id: string) => {
    activeChatId.value = id;
  };

  const deleteChat = async (id: string) => {
    await deleteChatById(id);
    chats.value = chats.value.filter(c => c.id !== id);
    if (activeChatId.value === id) activeChatId.value = null;
  };

  const updateVariables = async (updates: Record<string, string | number>) => {
    if (!activeChat.value) return;
    const merged = mergeVariables(activeChat.value.variables, updates);
    const updatedChat = { ...activeChat.value, variables: merged, updatedAt: Date.now() };
    await saveChat(updatedChat);
    chats.value = chats.value.map(c => c.id === updatedChat.id ? updatedChat : c);
  };

  const sendMessage = async (content: string) => {
    if (!settings.value || !activeChat.value) {
      throw new Error('No active chat or settings not loaded');
    }
    isSending.value = true;

    try {
      const activePreset = presets.value.find(p => p.id === settings.value.activePresetId) || presets.value[0];
      if (!activePreset) throw new Error('No preset available');

      const activeBooks = lorebooks.value.filter(b => activeLorebookIds.value.includes(b.id));
      const currentVariables = activeChat.value.variables || {};

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        timestamp: Date.now(),
        variables: { ...currentVariables },
      };

      const updatedMessages = [...activeChat.value.messages, userMessage];
      let updatedChat = { ...activeChat.value, messages: updatedMessages, updatedAt: Date.now() };

      const { messages: promptMessages } = assemblePrompt({
        userInput: content,
        history: updatedMessages,
        preset: activePreset,
        lorebooks: activeBooks,
        userName: settings.value.userName,
        characterName: settings.value.characterName,
        variables: currentVariables,
      });

      const response = await fetch(settings.value.api.baseUrl + '/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.value.api.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: settings.value.api.model, messages: promptMessages }),
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data = await response.json();
      const rawReply = data.choices?.[0]?.message?.content || '';
      const { cleanedText: reply, updates: extractedVars } = extractVariables(rawReply);
      const nextVariables = mergeVariables(currentVariables, extractedVars);

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: reply,
        timestamp: Date.now(),
        variables: { ...nextVariables },
      };

      updatedChat = { ...updatedChat, messages: [...updatedChat.messages, assistantMessage], variables: nextVariables };
      await saveChat(updatedChat);
      chats.value = chats.value.map(c => c.id === updatedChat.id ? updatedChat : c);
    } finally {
      isSending.value = false;
    }
  };

  return {
    lorebooks: computed(() => lorebooks.value),
    presets: computed(() => presets.value),
    settings: computed(() => settings.value),
    activeLorebookIds: computed(() => activeLorebookIds.value),
    chats: computed(() => chats.value),
    activeChatId: computed(() => activeChatId.value),
    activeChat,
    isSending: computed(() => isSending.value),
    isLoading: computed(() => isLoading.value),
    loadAll,
    toggleLorebook,
    updateSettings,
    createChat,
    loadChat,
    deleteChat,
    sendMessage,
    updateVariables,
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
    <button @click="showChatModal = true">
      聊天 ({{ chats.length }})
    </button>
    <ChatModal v-if="showChatModal" @close="showChatModal = false" />
    <Chat />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useSillytavern } from './composables/useSillytavern';
import Chat from './components/SillyTavern/Chat.vue';
import ChatModal from './components/SillyTavern/ChatModal.vue';

const { chats } = useSillytavern();
const showChatModal = ref(false);
</script>
```

---

## UI Components

### React — VariablePanel.tsx

```tsx
import { useState } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';

export function VariablePanel() {
  const { activeChat, updateVariables } = useSillytavern();
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>({});

  if (!activeChat) return null;
  const vars = activeChat.variables || {};

  const startEdit = () => {
    setDraft(Object.fromEntries(Object.entries(vars).map(([k, v]) => [k, String(v)])));
    setIsOpen(true);
  };

  const save = async () => {
    const updates: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(draft)) {
      if (k.trim()) {
        const num = Number(v);
        updates[k.trim()] = Number.isNaN(num) ? v : num;
      }
    }
    await updateVariables(updates);
    setIsOpen(false);
  };

  return (
    <div className="variable-panel">
      <button onClick={() => (isOpen ? setIsOpen(false) : startEdit())}>
        {isOpen ? '取消' : '变量'}
      </button>
      {isOpen && (
        <div className="variable-editor">
          {Object.entries(draft).map(([key, value], idx) => (
            <div key={idx} className="variable-row">
              <input
                value={key}
                onChange={(e) => {
                  const next = { ...draft };
                  const old = Object.keys(draft)[idx];
                  delete next[old];
                  next[e.target.value] = value;
                  setDraft(next);
                }}
                placeholder="名称"
              />
              <input
                value={value}
                onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                placeholder="值"
              />
              <button
                onClick={() => {
                  const next = { ...draft };
                  delete next[key];
                  setDraft(next);
                }}
              >
                删除
              </button>
            </div>
          ))}
          <button onClick={() => setDraft({ ...draft, '': '' })}>+ 添加</button>
          <button onClick={save}>保存</button>
        </div>
      )}
      {!isOpen && Object.keys(vars).length > 0 && (
        <ul className="variable-list">
          {Object.entries(vars).map(([k, v]) => (
            <li key={k}>{k}: {v}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### React — Chat.tsx

```tsx
import { useState } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';
import { VariablePanel } from './VariablePanel';

export function Chat() {
  const { activeChat, isSending, sendMessage } = useSillytavern();
  const [input, setInput] = useState('');

  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    await sendMessage(input);
    setInput('');
  };

  if (!activeChat) {
    return <div className="chat-empty">选择一个聊天或创建新对话</div>;
  }

  return (
    <div className="chat">
      <VariablePanel />
      <div className="messages">
        {activeChat.messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <div className="bubble">{msg.content}</div>
          </div>
        ))}
      </div>
      <div className="input-bar">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={isSending}
          placeholder="输入消息..."
        />
        <button onClick={handleSend} disabled={isSending}>
          {isSending ? '发送中...' : '发送'}
        </button>
      </div>
    </div>
  );
}
```

### React — ChatModal.tsx

```tsx
import { useSillytavern } from '../../hooks/useSillytavern';

interface ChatModalProps {
  onClose: () => void;
}

export function ChatModal({ onClose }: ChatModalProps) {
  const { chats, activeChatId, createChat, loadChat, deleteChat } = useSillytavern();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header>
          <h3>聊天记录</h3>
          <button onClick={onClose}>关闭</button>
        </header>
        <div className="chat-list">
          <button onClick={() => createChat()}>+ 新对话</button>
          <ul>
            {chats.map((chat) => (
              <li
                key={chat.id}
                className={chat.id === activeChatId ? 'active' : ''}
                onClick={() => loadChat(chat.id)}
              >
                <span>{chat.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChat(chat.id);
                  }}
                >
                  删除
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
```

### Vue — VariablePanel.vue

```vue
<template>
  <div v-if="activeChat" class="variable-panel">
    <button @click="isOpen ? (isOpen = false) : startEdit()">
      {{ isOpen ? '取消' : '变量' }}
    </button>
    <div v-if="isOpen" class="variable-editor">
      <div v-for="(value, key) in draft" :key="key" class="variable-row">
        <input v-model="draftKeys[key]" @blur="syncKey(key, $event)" placeholder="名称" />
        <input v-model="draft[key]" placeholder="值" />
        <button @click="removeKey(key)">删除</button>
      </div>
      <button @click="addEmpty">+ 添加</button>
      <button @click="save">保存</button>
    </div>
    <ul v-else-if="Object.keys(vars).length > 0" class="variable-list">
      <li v-for="[k, v] in Object.entries(vars)" :key="k">{{ k }}: {{ v }}</li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useSillytavern } from '../../composables/useSillytavern';

const { activeChat, updateVariables } = useSillytavern();
const isOpen = ref(false);
const draft = ref<Record<string, string>>({});
const draftKeys = ref<Record<string, string>>({});

const vars = computed(() => activeChat.value?.variables || {});

const startEdit = () => {
  draft.value = Object.fromEntries(Object.entries(vars.value).map(([k, v]) => [k, String(v)]));
  draftKeys.value = { ...draft.value };
  isOpen.value = true;
};

const addEmpty = () => {
  draft.value[''] = '';
  draftKeys.value[''] = '';
};

const removeKey = (key: string) => {
  const next = { ...draft.value };
  delete next[key];
  draft.value = next;
  const nextKeys = { ...draftKeys.value };
  delete nextKeys[key];
  draftKeys.value = nextKeys;
};

const syncKey = (oldKey: string, e: Event) => {
  const newKey = (e.target as HTMLInputElement).value;
  if (newKey === oldKey) return;
  const next = { ...draft.value };
  next[newKey] = next[oldKey];
  delete next[oldKey];
  draft.value = next;
};

const save = async () => {
  const updates: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(draft.value)) {
    if (k.trim()) {
      const num = Number(v);
      updates[k.trim()] = Number.isNaN(num) ? v : num;
    }
  }
  await updateVariables(updates);
  isOpen.value = false;
};
</script>
```

### Vue — Chat.vue

```vue
<template>
  <div class="chat">
    <div v-if="!activeChat" class="chat-empty">
      选择一个聊天或创建新对话
    </div>
    <template v-else>
      <VariablePanel />
      <div class="messages">
        <div
          v-for="msg in activeChat.messages"
          :key="msg.id"
          :class="['message', msg.role]"
        >
          <div class="bubble">{{ msg.content }}</div>
        </div>
      </div>
      <div class="input-bar">
        <input
          v-model="input"
          @keydown.enter="handleSend"
          :disabled="isSending"
          placeholder="输入消息..."
        />
        <button @click="handleSend" :disabled="isSending">
          {{ isSending ? '发送中...' : '发送' }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useSillytavern } from '../../composables/useSillytavern';
import VariablePanel from './VariablePanel.vue';

const { activeChat, isSending, sendMessage } = useSillytavern();
const input = ref('');

const handleSend = async () => {
  if (!input.value.trim() || isSending.value) return;
  await sendMessage(input.value);
  input.value = '';
};
</script>
```

### Vue — ChatModal.vue

```vue
<template>
  <div class="modal-overlay" @click="emit('close')">
    <div class="modal" @click.stop>
      <header>
        <h3>聊天记录</h3>
        <button @click="emit('close')">关闭</button>
      </header>
      <div class="chat-list">
        <button @click="createChat()">+ 新对话</button>
        <ul>
          <li
            v-for="chat in chats"
            :key="chat.id"
            :class="{ active: chat.id === activeChatId }"
            @click="loadChat(chat.id)"
          >
            <span>{{ chat.name }}</span>
            <button @click.stop="deleteChat(chat.id)">删除</button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSillytavern } from '../../composables/useSillytavern';

const { chats, activeChatId, createChat, loadChat, deleteChat } = useSillytavern();
const emit = defineEmits<{ close: [] }>();
</script>
```

### Vanilla 使用示例

```html
<div id="app">
  <button id="chat-modal-btn">聊天</button>
  <div id="chat-modal" style="display:none;">
    <button id="new-chat">+ 新对话</button>
    <ul id="chat-list"></ul>
  </div>
  <div id="chat-view">
    <div id="variables" style="margin-bottom:8px;"></div>
    <div id="messages"></div>
    <input id="msg-input" placeholder="输入消息..." />
    <button id="send-btn">发送</button>
  </div>
</div>

<script type="module">
  import { sillytavernStore } from './sillytavern';

  await sillytavernStore.loadAll();

  const renderVariables = () => {
    const el = document.getElementById('variables');
    const { activeChat } = sillytavernStore;
    if (!activeChat) { el.innerHTML = ''; return; }
    const vars = activeChat.variables || {};
    const entries = Object.entries(vars);
    if (entries.length === 0) { el.innerHTML = '<em>暂无变量</em>'; return; }
    el.innerHTML = entries.map(([k, v]) => `
      <span class="var-badge">${k}: ${v}</span>
    `).join(' ');
  };

  const renderChats = () => {
    const list = document.getElementById('chat-list');
    const { chats, activeChatId, activeChat } = sillytavernStore;
    list.innerHTML = chats.map(c => `
      <li class="${c.id === activeChatId ? 'active' : ''}" data-id="${c.id}">
        ${c.name} <button class="del" data-id="${c.id}">删除</button>
      </li>
    `).join('');

    const msgs = document.getElementById('messages');
    msgs.innerHTML = activeChat
      ? activeChat.messages.map(m => `<div class="${m.role}">${m.content}</div>`).join('')
      : '<div>选择一个聊天或创建新对话</div>';

    renderVariables();
  };

  sillytavernStore.subscribe(renderChats);
  renderChats();

  document.getElementById('new-chat').onclick = () => sillytavernStore.createChat();
  document.getElementById('chat-modal-btn').onclick = () => {
    const el = document.getElementById('chat-modal');
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
  };

  document.getElementById('chat-list').onclick = (e) => {
    const li = e.target.closest('li');
    if (e.target.classList.contains('del')) {
      sillytavernStore.deleteChat(e.target.dataset.id);
    } else if (li) {
      sillytavernStore.loadChat(li.dataset.id);
    }
  };

  document.getElementById('send-btn').onclick = async () => {
    const input = document.getElementById('msg-input');
    if (!input.value.trim() || sillytavernStore.isSending) return;
    await sillytavernStore.sendMessage(input.value);
    input.value = '';
  };
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
  getChats, saveChat, deleteChat as deleteChatById,
  assemblePrompt, extractVariables, mergeVariables,
  type Lorebook, type ChatPreset, type AppSettings, type ChatSession, type ChatMessage,
} from '../sillytavern';

type Listener = () => void;

export function createSillytavernStore() {
  let lorebooks: Lorebook[] = [];
  let presets: ChatPreset[] = [];
  let settings: AppSettings | null = null;
  let activeLorebookIds: string[] = [];
  let chats: ChatSession[] = [];
  let activeChatId: string | null = null;
  let isSending = false;
  let isLoading = true;
  const listeners = new Set<Listener>();

  const notify = () => listeners.forEach(cb => cb());

  const loadAll = async () => {
    isLoading = true;
    notify();
    await initializeDatabase();
    const [l, p, s, c] = await Promise.all([getLorebooks(), getPresets(), getSettings(), getChats()]);
    lorebooks = l;
    presets = p;
    settings = s || null;
    activeLorebookIds = s?.activeLorebookIds || [];
    chats = c;
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

  const createChat = async (name?: string) => {
    if (!settings) throw new Error('Settings not loaded');
    const chatCount = chats.filter(c => c.characterName === settings.characterName).length;
    const chatName = name || `${settings.characterName} - 新对话 ${chatCount + 1}`;
    const newChat: ChatSession = {
      id: crypto.randomUUID(),
      name: chatName,
      messages: [],
      characterName: settings.characterName,
      userName: settings.userName,
      presetId: settings.activePresetId || presets[0]?.id || null,
      lorebookIds: [...activeLorebookIds],
      variables: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await saveChat(newChat);
    chats = [...chats, newChat];
    activeChatId = newChat.id;
    notify();
    return newChat.id;
  };

  const loadChat = (id: string) => {
    activeChatId = id;
    notify();
  };

  const deleteChat = async (id: string) => {
    await deleteChatById(id);
    chats = chats.filter(c => c.id !== id);
    if (activeChatId === id) activeChatId = null;
    notify();
  };

  const updateVariables = async (updates: Record<string, string | number>) => {
    const activeChat = chats.find(c => c.id === activeChatId);
    if (!activeChat) return;
    const merged = mergeVariables(activeChat.variables, updates);
    const updatedChat = { ...activeChat, variables: merged, updatedAt: Date.now() };
    await saveChat(updatedChat);
    chats = chats.map(c => c.id === updatedChat.id ? updatedChat : c);
    notify();
  };

  const sendMessage = async (content: string) => {
    if (!settings || !activeChatId) throw new Error('No active chat or settings not loaded');
    const activeChat = chats.find(c => c.id === activeChatId);
    if (!activeChat) throw new Error('Active chat not found');

    isSending = true;
    notify();

    try {
      const activePreset = presets.find(p => p.id === settings.activePresetId) || presets[0];
      if (!activePreset) throw new Error('No preset available');

      const activeBooks = lorebooks.filter(b => activeLorebookIds.includes(b.id));
      const currentVariables = activeChat.variables || {};

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        timestamp: Date.now(),
        variables: { ...currentVariables },
      };

      const updatedMessages = [...activeChat.messages, userMessage];
      let updatedChat = { ...activeChat, messages: updatedMessages, updatedAt: Date.now() };

      const { messages: promptMessages } = assemblePrompt({
        userInput: content,
        history: updatedMessages,
        preset: activePreset,
        lorebooks: activeBooks,
        userName: settings.userName,
        characterName: settings.characterName,
        variables: currentVariables,
      });

      const response = await fetch(settings.api.baseUrl + '/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.api.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: settings.api.model, messages: promptMessages }),
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data = await response.json();
      const rawReply = data.choices?.[0]?.message?.content || '';
      const { cleanedText: reply, updates: extractedVars } = extractVariables(rawReply);
      const nextVariables = mergeVariables(currentVariables, extractedVars);

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: reply,
        timestamp: Date.now(),
        variables: { ...nextVariables },
      };

      updatedChat = { ...updatedChat, messages: [...updatedChat.messages, assistantMessage], variables: nextVariables };
      await saveChat(updatedChat);
      chats = chats.map(c => c.id === updatedChat.id ? updatedChat : c);
    } finally {
      isSending = false;
      notify();
    }
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
    get chats() { return chats; },
    get activeChatId() { return activeChatId; },
    get activeChat() { return chats.find(c => c.id === activeChatId) || null; },
    get isSending() { return isSending; },
    get isLoading() { return isLoading; },
    loadAll,
    toggleLorebook,
    updateSettings,
    createChat,
    loadChat,
    deleteChat,
    sendMessage,
    updateVariables,
    saveLorebook,
    deleteLorebook,
    savePreset,
    deletePreset,
    subscribe,
  };
}

export const sillytavernStore = createSillytavernStore();
```

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
   - React: `SettingsModal.tsx`, `LorebookModal.tsx`, `PresetModal.tsx`, `ChatModal.tsx`, `Chat.tsx`, `VariablePanel.tsx`
   - Vue: `SettingsModal.vue`, `LorebookModal.vue`, `PresetModal.vue`, `ChatModal.vue`, `Chat.vue`, `VariablePanel.vue`
   - Vanilla: inline example for settings/lorebook/preset/chat/variable UI

6. **Show Integration Example** (Auto - display usage code for detected framework, including multi-session chat and variable editing)

---

## Verification

After installation, verify:

- [ ] `npm install dexie` succeeded
- [ ] All files created in `src/sillytavern/`
- [ ] No TypeScript errors
- [ ] App compiles successfully
- [ ] Settings modal opens
- [ ] Can import SillyTavern JSON
- [ ] Can create/load/delete chat sessions
- [ ] Messages persist in IndexedDB across reloads
- [ ] Variables are injected into system prompt and can be edited manually
- [ ] `<var name="..." value="..." />` tags in LLM replies auto-update variables

---

## Output

**A complete working SillyTavern integration with:**
- Full TypeScript type definitions
- IndexedDB persistence layer
- Lorebook keyword matching engine (with primary/secondary key selective logic)
- Prompt assembly with context injection (respects preset block order)
- SillyTavern format import/export
- Framework-specific state management (React hooks / Vue composables / Vanilla store)
- Multi-session chat with full IndexedDB persistence
- Per-turn variable system with XML extraction and manual editing UI
- Ready-to-use UI components (including Chat, Chat Session manager, and Variable Panel)
