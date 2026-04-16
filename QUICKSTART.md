# 快速开始 - SillyTavern Web Automator

## 一键安装

```bash
/sillytavern-web
```

**就这一行命令，Claude 会自动完成：**

1. ✅ 检测你的项目类型（React/Vue/JS）
2. ✅ 安装依赖（`npm install dexie`）
3. ✅ 创建核心文件（7个 TypeScript 模块）
4. ✅ 创建 React Hooks（`useSillytavern`）
5. ✅ 创建 UI 组件（设置/世界书/预设/聊天/变量管理器）
6. ✅ 显示使用示例

**全程无需手动操作。**

---

## 安装前准备

**唯一要求：** 确保项目已初始化 npm

```bash
# 如果还没有 package.json
npm init -y
```

---

## 安装后步骤

### 1. 配置 API（必须）

点击界面上的 **"设置"** 按钮，配置：

- **API Key** - 从 Kimi/OpenAI/DeepSeek 获取
- **模型名称** - 例如 `gpt-3.5-turbo` 或 `moonshot-v1-8k`
- **API 地址** - 通常保持默认

### 2. 导入世界书（可选）

点击 **"创意工坊"** 按钮：

- 导入 SillyTavern 导出的 `.json` 文件
- 或点击 **"新建"** 创建空白世界书

### 3. 激活世界书

在世界书列表中：

- 勾选要激活的世界书
- 点击条目编辑关键词和内容

### 4. 管理聊天记录

点击 **"聊天"** 按钮：

- **新建对话** - 创建独立的多轮聊天 Session
- **切换记录** - 在不同角色/历史聊天之间切换
- **删除记录** - 清理不需要的旧对话

所有聊天记录自动保存在浏览器（IndexedDB），刷新不丢失。

### 5. 编辑游戏变量

点击聊天界面上的 **"变量"** 按钮：

- **手动编辑** - 像填表一样添加/修改/删除变量（例如 `hp: 80`、`mood: 愤怒`）
- **自动提取** - 如果 AI 回复中包含 `<var name="hp" value="80" />`，系统会自动解析并更新变量
- **提示词注入** - 当前变量会自动附加在系统提示词里，AI 在后续轮次中可以看到

---

## 立即使用

### 基础聊天

```tsx
import { useSillytavern } from './hooks/useSillytavern';

function Chat() {
  const { settings, lorebooks, activeLorebookIds } = useSillytavern();

  const activeBooks = lorebooks.filter(b =>
    activeLorebookIds.includes(b.id)
  );

  // 使用 assemblePrompt 构建带世界书上下文的提示词
  // 发送给 AI API
}
```

### 完整示例

```tsx
import { useState } from 'react';
import { assemblePrompt } from './sillytavern';
import { useSillytavern } from './hooks/useSillytavern';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const { settings, lorebooks, activeLorebookIds, presets } = useSillytavern();

  const sendMessage = async () => {
    const activeBooks = lorebooks.filter(b =>
      activeLorebookIds.includes(b.id)
    );

    const activePreset = presets.find(p =>
      p.id === settings?.activePresetId
    ) || presets[0];

    const { messages: promptMessages } = assemblePrompt({
      userInput: input,
      history: messages,
      preset: activePreset,
      lorebooks: activeBooks,
      userName: settings?.userName || '用户',
      characterName: settings?.characterName || 'AI',
      variables: { hp: 100, mood: '平静' }, // 自定义变量会自动注入系统提示词
    });

    const response = await fetch(settings.api.baseUrl + '/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.api.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: settings.api.model,
        messages: promptMessages,
      }),
    });

    const data = await response.json();
    const reply = data.choices[0].message.content;

    setMessages([...messages,
      { role: 'user', content: input },
      { role: 'assistant', content: reply }
    ]);
    setInput('');
  };

  return (
    <div>
      {/* 聊天界面 */}
    </div>
  );
}
```

---

## 常见问题

### Q: 安装失败怎么办？

A: 检查：
1. `npm` 是否已安装
2. 是否有 `package.json`
3. 是否有写权限

### Q: 如何更新已安装的文件？

A: 重新运行 `/sillytavern-web`，Claude 会覆盖为最新版本。

### Q: 可以自定义 UI 吗？

A: 可以！自动化安装后，你可以：
- 修改 `src/components/SillyTavern/*` 组件
- 使用 `useSillytavern` hook 创建自己的界面

### Q: 数据存储在哪里？

A: 完全存储在用户浏览器（IndexedDB），不上传到任何服务器。

### Q: 支持哪些 AI 服务？

A: 任何 OpenAI API 格式：
- Kimi (Moonshot)
- OpenAI GPT
- DeepSeek
- 本地模型（LM Studio 等）

---

## 下一步

1. ✅ 运行 `/sillytavern-web` 完成安装
2. ✅ 配置 API Key
3. ✅ 导入或创建世界书
4. ✅ 开始聊天！
