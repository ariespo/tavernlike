# SillyTavern Web Automator

一行命令将 SillyTavern 生态系统集成到任意前端项目。

## 功能

- **全自动安装** — 检测 React/Vue/Vanilla，安装依赖，生成代码
- **双模式 UI** — 聊天列表 或 游戏式（正文+选项）
- **流式标签解析** — 实时解析 `<maintext>` `<option>` `<sum>` `<vars>` `<thinking>`
- **双 API 路由** — 主 API 跑剧情，次 API 跑变量/总结
- **楼层变量回溯** — 每条 AI 回复自带变量快照，跳回即恢复
- **世界书管理** — 批量导入、重命名、多书同时激活
- **SillyTavern 兼容** — 支持 lorebook/preset JSON 导入导出

## 使用方法

在 Claude Code 中输入：

```
/sillytavern-web
```

或指定框架：

```
/sillytavern-web 为我的 React 项目添加 SillyTavern
```

Skill 会自动：
1. 检测项目类型
2. 安装 `dexie`
3. 生成 `src/sillytavern/` 核心模块
4. 生成 React Hooks 和 UI 组件
5. 询问是否启用游戏模式、自定义标签集、次 API

## 安装后使用

### 游戏模式（v3 默认）

```tsx
import { GameView } from './components/SillyTavern/GameView';

function App() {
  return <GameView />;
}
```

### 聊天模式

```tsx
import { Chat } from './components/SillyTavern/Chat';

function App() {
  return <Chat />;
}
```

### 发送消息（底层 API）

```tsx
import { useSillytavern } from './hooks/useSillytavern';

const { sendGameMessage } = useSillytavern();
await sendGameMessage("我要上前迎击");
```

## 文件结构

安装后生成的文件：

```
src/
├── sillytavern/
│   ├── types.ts          # 类型定义
│   ├── database.ts       # IndexedDB / Dexie
│   ├── lorebook-engine.ts # 关键词匹配
│   ├── prompt-assembler.ts # Prompt 组装
│   ├── stream-parser.ts  # 流式 XML 解析（v3）
│   ├── vars-merger.ts    # 变量深合并（v3）
│   ├── api-router.ts     # 主/次 API 路由（v3）
│   ├── importer.ts       # SillyTavern 导入/导出
│   ├── variables.ts      # 变量提取
│   └── index.ts          # 入口
├── hooks/
│   ├── useSillytavern.ts # 主状态 Hook
│   ├── useStreamParser.ts # 流式解析 Hook（v3）
│   └── useApiRouter.ts   # API 路由 Hook（v3）
└── components/SillyTavern/
    ├── GameView.tsx       # 游戏主界面（v3）
    ├── ThinkingFold.tsx   # 思考折叠（v3）
    ├── MainTextPane.tsx   # 正文显示（v3）
    ├── OptionList.tsx     # 选项列表（v3）
    ├── HistoryDrawer.tsx  # 历史楼层（v3）
    ├── SettingsModal.tsx  # 设置
    ├── LorebookModal.tsx  # 世界书
    └── PresetModal.tsx    # 预设
```

## 默认输出格式

让 LLM 按以下 XML 标签输出：

```xml
<thinking>思考过程（可选，内部不解析其他标签）</thinking>
<maintext>剧情正文，支持多行</maintext>
<option>选项A
选项B
选项C</option>
<sum>本回合总结</sum>
<vars>{ "HP": 80, "gold": 15 }</vars>
```

### 各标签作用

| 标签 | 说明 |
|---|---|
| `<thinking>` | 思考过程，默认折叠，内部不会误解析其他标签 |
| `<maintext>` | 剧情正文，流式显示到正文区域 |
| `<option>` | 选项列表，每行一个，玩家可点选或自由输入 |
| `<sum>` | 本回合一句话总结 |
| `<vars>` | 变量更新命令，JSON 格式，深合并到游戏变量 |

标签集可在 Settings 中自定义增删。

## 多 API 模式

在 Settings → 次 API 中启用：

- **主 API** — 负责生成 `<maintext>` + `<option>`（剧情+选项）
- **次 API** — 负责生成 `<sum>` + `<vars>`（总结+变量），可用更便宜的模型
- 次 API 失败时自动 fallback 到主 API

## 版本

- **v3.0.0** — React 游戏模式、流式标签解析、双 API、变量快照回溯
- **v2.0.0** — 全自动版本，嵌入所有代码
- **v1.0.0** — 初始版本，指导型 skill

## 许可证

MIT
