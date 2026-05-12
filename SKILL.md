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
  version: 3.0.0
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

2. **Q：使用默认 6 个标签 (maintext, option, sum, vars, thinking, think）？[Y/n]**
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

---

## File Generation Templates

### 1. types.ts

（源码位于本仓库 `templates/react/sillytavern/types.ts`，直接复制到用户项目 `src/sillytavern/types.ts`）

### 2. database.ts

（源码位于本仓库 `templates/react/sillytavern/database.ts`，直接复制到用户项目 `src/sillytavern/database.ts`）

### 3. lorebook-engine.ts

（源码位于本仓库 `templates/react/sillytavern/lorebook-engine.ts`，直接复制到用户项目 `src/sillytavern/lorebook-engine.ts`）

### 4. prompt-assembler.ts

（源码位于本仓库 `templates/react/sillytavern/prompt-assembler.ts`，直接复制到用户项目 `src/sillytavern/prompt-assembler.ts`）

### 5. importer.ts

（源码位于本仓库 `templates/react/sillytavern/importer.ts`，直接复制到用户项目 `src/sillytavern/importer.ts`）

### 6. index.ts

（源码位于本仓库 `templates/react/sillytavern/index.ts`，直接复制到用户项目 `src/sillytavern/index.ts`）

### 7. variables.ts

（源码位于本仓库 `templates/react/sillytavern/variables.ts`，直接复制到用户项目 `src/sillytavern/variables.ts`）

### 8. stream-parser.ts（新增）

（源码位于本仓库 `templates/react/sillytavern/stream-parser.ts`，直接复制到用户项目 `src/sillytavern/stream-parser.ts`）

### 9. vars-merger.ts（新增）

（源码位于本仓库 `templates/react/sillytavern/vars-merger.ts`，直接复制到用户项目 `src/sillytavern/vars-merger.ts`）

### 10. api-router.ts（新增）

（源码位于本仓库 `templates/react/sillytavern/api-router.ts`，直接复制到用户项目 `src/sillytavern/api-router.ts`）
---

## React Integration

### hooks/useSillytavern.ts

（源码位于 `templates/react/hooks/useSillytavern.ts`）

### hooks/useStreamParser.ts（新增）

（源码位于 `templates/react/hooks/useStreamParser.ts`）

### hooks/useApiRouter.ts（新增）

（源码位于 `templates/react/hooks/useApiRouter.ts`）
---

## Vue Integration

> ⚠ v3 升级仅 React 路径已迁移；Vue 与 Vanilla 仍为 v2 模板（功能不含游戏模式 / stream-parser / 多 API）。在后续 plan 中跟进。

### composables/useSillytavern.ts

```typescript
import { ref, computed, onMounted } from 'vue';
import {
  getLorebooks, saveLorebook, deleteLorebook,
  getPresets, savePreset, deletePreset,
  getSettings, saveSettings, initializeDatabase,
  getChats, saveChat, deleteChat as deleteChatById,
  assemblePrompt, extractVariables, mergeVariables, USER_ROLE, truncateChatAt, branchChat,
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
    if (activeChatId.value === id) return;
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

      const requestBody: Record<string, any> = {
        model: activePreset.settings.openai_model || settings.value.api.model,
        messages: promptMessages,
      };
      if (activePreset.settings.temp_openai !== undefined) requestBody.temperature = activePreset.settings.temp_openai;
      if (activePreset.settings.openai_max_tokens !== undefined) requestBody.max_tokens = activePreset.settings.openai_max_tokens;
      if (activePreset.settings.top_p_openai !== undefined) requestBody.top_p = activePreset.settings.top_p_openai;
      if (activePreset.settings.freq_pen_openai !== undefined) requestBody.frequency_penalty = activePreset.settings.freq_pen_openai;
      if (activePreset.settings.pres_pen_openai !== undefined) requestBody.presence_penalty = activePreset.settings.pres_pen_openai;
      if (activePreset.settings.stream_openai !== undefined) requestBody.stream = activePreset.settings.stream_openai;

      const response = await fetch(settings.value.api.baseUrl + '/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.value.api.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
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

  const editMessage = async (messageId: string, newContent: string) => {
    if (!activeChat.value) return;
    const idx = activeChat.value.messages.findIndex(m => m.id === messageId);
    if (idx === -1) return;
    if (activeChat.value.messages[idx].role !== USER_ROLE) return;

    const updatedChat = truncateChatAt(activeChat.value, idx, activeChat.value.messages[idx].variables);
    await saveChat(updatedChat);
    chats.value = chats.value.map(c => c.id === updatedChat.id ? updatedChat : c);
    await sendMessage(newContent);
  };

  const deleteMessagesFrom = async (messageId: string) => {
    if (!activeChat.value) return;
    const idx = activeChat.value.messages.findIndex(m => m.id === messageId);
    if (idx === -1) return;

    const updatedChat = truncateChatAt(activeChat.value, idx);
    await saveChat(updatedChat);
    chats.value = chats.value.map(c => c.id === updatedChat.id ? updatedChat : c);
  };

  const branchFromMessage = async (messageId: string, name?: string) => {
    if (!activeChat.value || !settings.value) throw new Error('No active chat');
    const idx = activeChat.value.messages.findIndex(m => m.id === messageId);
    if (idx === -1) throw new Error('Message not found');

    const branchCount = chats.value.filter(c => c.characterName === settings.value.characterName).length;
    const branchName = name || `${settings.value.characterName} - 分支 ${branchCount + 1}`;
    const newChat = branchChat(activeChat.value, idx, {
      name: branchName,
      presetId: settings.value.activePresetId || presets.value[0]?.id || null,
      lorebookIds: [...activeLorebookIds.value],
      variables: activeChat.value.messages[idx].variables,
    });
    await saveChat(newChat);
    chats.value = [...chats.value, newChat];
    activeChatId.value = newChat.id;
    return newChat.id;
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
    editMessage,
    deleteMessagesFrom,
    branchFromMessage,
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

### React — GameView.tsx（新增）

（源码位于 `templates/react/components/SillyTavern/GameView.tsx`）

### React — ThinkingFold.tsx（新增）

（源码位于 `templates/react/components/SillyTavern/ThinkingFold.tsx`）

### React — MainTextPane.tsx（新增）

（源码位于 `templates/react/components/SillyTavern/MainTextPane.tsx`）

### React — OptionList.tsx（新增）

（源码位于 `templates/react/components/SillyTavern/OptionList.tsx`）

### React — HistoryDrawer.tsx（新增）

（源码位于 `templates/react/components/SillyTavern/HistoryDrawer.tsx`）

### React — SettingsModal.tsx

（源码位于 `templates/react/components/SillyTavern/SettingsModal.tsx`）

### React — LorebookModal.tsx

（源码位于 `templates/react/components/SillyTavern/LorebookModal.tsx`）

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

### React — Chat.tsx

```tsx
import { useState } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';
import { VariablePanel } from './VariablePanel';
import { USER_ROLE } from '../../sillytavern';

export function Chat() {
  const { activeChat, isSending, sendMessage, editMessage, deleteMessagesFrom, branchFromMessage } = useSillytavern();
  const [input, setInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');

  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    await sendMessage(input);
    setInput('');
  };

  const startEdit = (msg: { id: string; content: string }) => {
    setEditingId(msg.id);
    setEditDraft(msg.content);
  };

  const confirmEdit = async () => {
    if (!editingId || !editDraft.trim()) return;
    await editMessage(editingId, editDraft);
    setEditingId(null);
    setEditDraft('');
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
            {editingId === msg.id ? (
              <div className="edit-row">
                <input value={editDraft} onChange={(e) => setEditDraft(e.target.value)} />
                <button onClick={confirmEdit}>重新生成</button>
                <button onClick={() => setEditingId(null)}>取消</button>
              </div>
            ) : (
              <>
                <div className="bubble">{msg.content}</div>
                <div className="msg-actions">
                  {msg.role === USER_ROLE && (
                    <button onClick={() => startEdit(msg)}>编辑并重新生成</button>
                  )}
                  <button onClick={() => deleteMessagesFrom(msg.id)}>删除后续</button>
                  <button onClick={() => branchFromMessage(msg.id)}>从此分支</button>
                </div>
              </>
            )}
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

---


> ⚠ v3 升级仅 React 路径已迁移；Vue 与 Vanilla 仍为 v2 模板（功能不含游戏模式 / stream-parser / 多 API）。在后续 plan 中跟进。

### vanilla/sillytavern-store.ts

```typescript
import {
  getLorebooks, saveLorebook, deleteLorebook,
  getPresets, savePreset, deletePreset,
  getSettings, saveSettings, initializeDatabase,
  getChats, saveChat, deleteChat as deleteChatById,
  assemblePrompt, extractVariables, mergeVariables, USER_ROLE, truncateChatAt, branchChat,
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
    if (activeChatId === id) return;
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

      const requestBody: Record<string, any> = {
        model: activePreset.settings.openai_model || settings.api.model,
        messages: promptMessages,
      };
      if (activePreset.settings.temp_openai !== undefined) requestBody.temperature = activePreset.settings.temp_openai;
      if (activePreset.settings.openai_max_tokens !== undefined) requestBody.max_tokens = activePreset.settings.openai_max_tokens;
      if (activePreset.settings.top_p_openai !== undefined) requestBody.top_p = activePreset.settings.top_p_openai;
      if (activePreset.settings.freq_pen_openai !== undefined) requestBody.frequency_penalty = activePreset.settings.freq_pen_openai;
      if (activePreset.settings.pres_pen_openai !== undefined) requestBody.presence_penalty = activePreset.settings.pres_pen_openai;
      if (activePreset.settings.stream_openai !== undefined) requestBody.stream = activePreset.settings.stream_openai;

      const response = await fetch(settings.api.baseUrl + '/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.api.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
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

  const editMessage = async (messageId: string, newContent: string) => {
    const activeChat = chats.find(c => c.id === activeChatId);
    if (!activeChat) return;
    const idx = activeChat.messages.findIndex(m => m.id === messageId);
    if (idx === -1) return;
    if (activeChat.messages[idx].role !== USER_ROLE) return;

    const updatedChat = truncateChatAt(activeChat, idx, activeChat.messages[idx].variables);
    await saveChat(updatedChat);
    chats = chats.map(c => c.id === updatedChat.id ? updatedChat : c);
    notify();
    await sendMessage(newContent);
  };

  const deleteMessagesFrom = async (messageId: string) => {
    const activeChat = chats.find(c => c.id === activeChatId);
    if (!activeChat) return;
    const idx = activeChat.messages.findIndex(m => m.id === messageId);
    if (idx === -1) return;

    const updatedChat = truncateChatAt(activeChat, idx);
    await saveChat(updatedChat);
    chats = chats.map(c => c.id === updatedChat.id ? updatedChat : c);
    notify();
  };

  const branchFromMessage = async (messageId: string, name?: string) => {
    const activeChat = chats.find(c => c.id === activeChatId);
    if (!activeChat || !settings) throw new Error('No active chat');
    const idx = activeChat.messages.findIndex(m => m.id === messageId);
    if (idx === -1) throw new Error('Message not found');

    const branchCount = chats.filter(c => c.characterName === settings.characterName).length;
    const branchName = name || `${settings.characterName} - 分支 ${branchCount + 1}`;
    const newChat = branchChat(activeChat, idx, {
      name: branchName,
      presetId: settings.activePresetId || presets[0]?.id || null,
      lorebookIds: [...activeLorebookIds],
      variables: activeChat.messages[idx].variables,
    });
    await saveChat(newChat);
    chats = [...chats, newChat];
    activeChatId = newChat.id;
    notify();
    return newChat.id;
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
    editMessage,
    deleteMessagesFrom,
    branchFromMessage,
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

4. **Write All Files** (Auto — copy from skill templates)
   - React: copy `templates/react/sillytavern/` → `src/sillytavern/`, `templates/react/hooks/` → `src/hooks/`, `templates/react/components/SillyTavern/` → `src/components/SillyTavern/`

5. **Create UI Components** (Auto - generate based on framework)
   - React: `SettingsModal.tsx`, `LorebookModal.tsx`, `LorebookEditorModal.tsx`, `EntryForm.tsx`, `PresetModal.tsx`, `PromptOrderEditor.tsx`, `ChatModal.tsx`, `Chat.tsx`, `VariablePanel.tsx`
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
- [ ] Can edit/regenerate past user messages
- [ ] Can delete messages from a specific point onward
- [ ] Can branch from any message to create a new chat session

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
- Message rollback and branching (edit/regenerate, delete subsequent, branch from any point)
- Ready-to-use UI components (including Chat, Chat Session manager, Variable Panel)

