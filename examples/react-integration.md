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

### 4. 聊天组件

```tsx
// components/Chat.tsx
import { useState } from 'react';
import { useSillytavernStore } from '../stores/sillytavern';
import { assemblePrompt } from '../sillytavern/prompt-assembler';
import { createLorebookEngine } from '../sillytavern/lorebook-engine';

export function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const { lorebooks, activeLorebookIds, settings } = useSillytavernStore();

  const sendMessage = async () => {
    // 1. 获取激活的世界书
    const activeLorebooks = lorebooks.filter(b => 
      activeLorebookIds.includes(b.id)
    );

    // 2. 扫描关键词匹配
    const matchedEntries = activeLorebooks.flatMap(book => {
      const engine = createLorebookEngine(book);
      return engine.scan(input);
    });

    // 3. 获取当前预设
    const activePreset = presets.find(p => p.id === settings?.activePresetId) || presets[0];

    // 4. 组装提示词
    const { messages: promptMessages } = assemblePrompt({
      userInput: input,
      history: messages,
      preset: activePreset,
      lorebooks: activeLorebooks,
      userName: settings?.userName || '用户',
      characterName: settings?.characterName || 'AI',
    });

    // 5. 调用 API
    const response = await fetch(settings.api.baseUrl + '/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.api.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: settings.api.model,
        messages: promptMessages
      })
    });

    const data = await response.json();
    
    // 6. 更新消息
    setMessages([...messages, 
      { role: 'user', content: input },
      { role: 'assistant', content: data.choices[0].message.content }
    ]);
  };

  return (
    <div className="chat">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={msg.role}>
            {msg.content}
          </div>
        ))}
      </div>
      <input 
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyPress={e => e.key === 'Enter' && sendMessage()}
      />
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

export function TopBar() {
  const [activeModal, setActiveModal] = useState(null);
  const { lorebooks, activeLorebookIds, presets } = useSillytavernStore();

  return (
    <header className="top-bar">
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
