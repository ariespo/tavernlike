# SillyTavern Web Automator

全自动 SillyTavern 生态系统集成工具。一行命令即可完成所有安装和配置。

## 特性

- **全自动安装** - 检测框架、安装依赖、生成代码、创建 UI
- **零配置** - 无需手动设置，一键完成
- **多框架支持** - React、Vue、原生 JavaScript
- **完整功能** - 世界书、预设、AI 聊天、多 Session 聊天记录持久化、每轮变量系统、消息回溯与分支
- **SillyTavern 兼容** - 支持导入/导出 SillyTavern 格式

## 核心组件

### 数据层 (IndexedDB)
- `database.ts` - Dexie 封装，自动初始化
- 支持世界书、预设、设置、聊天记录

### 引擎层
- `lorebook-engine.ts` - 关键词匹配引擎（AND/OR 逻辑、递归扫描）
- `prompt-assembler.ts` - 提示词组装器（宏替换、上下文注入、变量插值）
- `variables.ts` - 变量提取与注入（支持 XML `<var />` 标签）
- `importer.ts` - SillyTavern 格式导入/导出

### 类型定义
- `types.ts` - 完整的 TypeScript 类型
- 支持 Lorebook、Preset、Settings、Chat 等

### React 集成
- `useSillytavern.ts` - 组合式 Hook，管理所有状态（支持消息编辑/删除后续/分支）

## 自动化流程

```
用户输入: /sillytavern-web

1. 自动检测框架
   └── 检查 package.json → 识别 React/Vue/JS

2. 自动安装依赖
   └── npm install dexie

3. 自动生成文件
   └── src/sillytavern/* (6个核心文件)
   └── src/hooks/useSillytavern.ts
   └── src/components/SillyTavern/* (UI组件)

4. 自动显示示例
   └── 展示如何在 App 中使用

总计: 1个命令，全自动完成
```

## 使用示例

### 基础用法

```bash
/sillytavern-web
```

### 指定框架

```bash
/sillytavern-web 为我的 React 项目添加 SillyTavern
```

## 安装后使用

### 在组件中使用

```tsx
import { useSillytavern } from './hooks/useSillytavern';

function App() {
  const { lorebooks, settings, toggleLorebook } = useSillytavern();

  return (
    <div>
      <button onClick={() => setShowSettings(true)}>
        设置 ({lorebooks.filter(b => b.active).length} 世界书)
      </button>
    </div>
  );
}
```

### 发送消息

```tsx
import { assemblePrompt } from './sillytavern';

const sendMessage = async (input: string) => {
  const { messages } = assemblePrompt({
    userInput: input,
    history: chatHistory,
    preset: activePreset,
    lorebooks: activeLorebooks,
    userName: settings.userName,
    characterName: settings.characterName,
  });

  const response = await fetch(settings.api.baseUrl + '/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${settings.api.apiKey}` },
    body: JSON.stringify({ model: settings.api.model, messages }),
  });

  return response.json();
};
```

## 数据结构

### 世界书条目

```typescript
interface LorebookEntry {
  id: string;
  keys: string[];           // 触发关键词
  content: string;          // 内容
  order: number;            // 优先级
  position: 'before_char' | 'after_char' | 'at_depth';
  selective: boolean;       // 是否选择性
  selectiveLogic: 'and' | 'or';
  probability: number;      // 触发概率 0-100
}
```

### 预设

```typescript
interface ChatPreset {
  id: string;
  name: string;
  description?: string;
  settings: Record<string, any>; // SillyTavern 原始预设数据（temp_openai, prompt_order, prompts 等）
  createdAt: number;
  updatedAt: number;
}
```

## API 支持

- **OpenAI** - https://api.openai.com/v1
- **Kimi** - https://api.moonshot.cn/v1
- **DeepSeek** - https://api.deepseek.com/v1
- **本地模型** - http://localhost:1234/v1

## 文件位置

自动化生成的所有文件：

```
src/
├── sillytavern/
│   ├── index.ts
│   ├── types.ts
│   ├── database.ts
│   ├── lorebook-engine.ts
│   ├── prompt-assembler.ts
│   └── importer.ts
├── hooks/
│   └── useSillytavern.ts
└── components/
    └── SillyTavern/
        ├── SettingsModal.tsx
        ├── LorebookModal.tsx
        └── PresetModal.tsx
```

## 版本历史

- **v2.0.0** - 全自动版本，嵌入所有代码，无需外部依赖
- **v1.0.0** - 初始版本，指导型 skill

## 许可证

MIT
