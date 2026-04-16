# React 集成示例

## 完整集成步骤

### 1. 安装依赖

```bash
npm install dexie
```

### 2. 复制核心文件

```
src/
├── sillytavern/
│   ├── types.ts
│   ├── database.ts
│   ├── lorebook-engine.ts
│   ├── prompt-assembler.ts
│   └── importer.ts
└── components/
    ├── LorebookModal.tsx
    ├── PresetModal.tsx
    └── SettingsModal.tsx
```

### 3. 创建 Store

```typescript
// stores/sillytavern.ts
import { create } from 'zustand';
import { getLorebooks, getPresets, getSettings } from '../sillytavern/database';

export const useSillytavernStore = create((set, get) => ({
  lorebooks: [],
  presets: [],
  settings: null,
  activeLorebookIds: [],
  activePresetId: null,

  loadData: async () => {
    const [lorebooks, presets, settings] = await Promise.all([
      getLorebooks(),
      getPresets(),
      getSettings()
    ]);
    set({ lorebooks, presets, settings });
  },

  toggleLorebook: (id: string) => {
    const { activeLorebookIds } = get();
    const newIds = activeLorebookIds.includes(id)
      ? activeLorebookIds.filter(i => i !== id)
      : [...activeLorebookIds, id];
    set({ activeLorebookIds: newIds });
  }
}));
```

### 4. 聊天组件（使用 `useSillytavern` Hook）

```tsx
// components/Chat.tsx
import { useState } from 'react';
import { useSillytavern } from '../hooks/useSillytavern';
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

### 5. 添加快捷按钮

```tsx
// components/TopBar.tsx
import { useState } from 'react';
import { useSillytavernStore } from '../stores/sillytavern';
import { LorebookModal } from './LorebookModal';
import { PresetModal } from './PresetModal';
import { SettingsModal } from './SettingsModal';
import { ChatModal } from './ChatModal';

export function TopBar() {
  const [activeModal, setActiveModal] = useState(null);
  const { lorebooks, activeLorebookIds, presets, chats } = useSillytavernStore();

  return (
    <header className="top-bar">
      {/* 聊天按钮 */}
      <button onClick={() => setActiveModal('chat')}>
        💬 聊天
        {chats.length > 0 && (
          <span className="badge">{chats.length}</span>
        )}
      </button>

      {/* 创意工坊按钮 */}
      <button onClick={() => setActiveModal('lorebook')}>
        🏛️ 创意工坊
        {activeLorebookIds.length > 0 && (
          <span className="badge">{activeLorebookIds.length}</span>
        )}
      </button>

      {/* 预设按钮 */}
      <button onClick={() => setActiveModal('preset')}>
        ⚙️ 预设
      </button>

      {/* 设置按钮 */}
      <button onClick={() => setActiveModal('settings')}>
        🔧 设置
      </button>

      {/* Modals */}
      {activeModal === 'chat' && (
        <ChatModal onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'lorebook' && (
        <LorebookModal
          lorebooks={lorebooks}
          activeIds={activeLorebookIds}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal === 'preset' && (
        <PresetModal onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'settings' && (
        <SettingsModal onClose={() => setActiveModal(null)} />
      )}
    </header>
  );
}
```

## 世界书界面结构

```tsx
// components/LorebookModal.tsx
export function LorebookModal({ lorebooks, activeIds, onClose }) {
  const [selectedBook, setSelectedBook] = useState(null);

  return (
    <div className="modal">
      <div className="lorebook-manager">
        {/* 左侧列表 */}
        <aside>
          <button>导入世界书</button>
          <button>新建</button>
          <ul>
            {lorebooks.map(book => (
              <li key={book.id}>
                <input 
                  type="checkbox"
                  checked={activeIds.includes(book.id)}
                  onChange={() => toggleLorebook(book.id)}
                />
                <span onClick={() => setSelectedBook(book)}>
                  {book.name}
                </span>
              </li>
            ))}
          </ul>
        </aside>

        {/* 右侧编辑区 */}
        <main>
          {selectedBook ? (
            <LorebookEditor book={selectedBook} />
          ) : (
            <div>选择一个世界书或创建新的</div>
          )}
        </main>
      </div>
    </div>
  );
}
```
