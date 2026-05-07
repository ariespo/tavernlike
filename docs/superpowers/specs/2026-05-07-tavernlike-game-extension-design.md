# tavernlike Skill 游戏化扩展 设计文档

- 日期：2026-05-07
- 作者：klymdd / Claude
- 范围：tavernlike-main skill (v2.0.0 → v3.0.0)
- 关联讨论：与 H:\zhangmen-main 实现的差异回填

## 1. 目标

让 `/sillytavern-web` skill 在保留「通用 SillyTavern 集成」基础上，可选生成一套「正文 + 选项」游戏式前端，并补齐 zhangmen-main 已验证的几项工程能力，使 skill 输出可直接落地为可运行的轻型 AI 文字冒险游戏。

## 2. 背景

`tavernlike-main` 当前是 Claude Code Skill 代码生成器，输出 React / Vue / Vanilla 三套消息列表式聊天前端。`zhangmen-main`（《宗门志》）作为该模板的真实落地实例，在原有底座之上长出了完整游戏业务，但其代码是 Vanilla 单页 + 业务硬编码，无法直接抽回。本扩展的目的：把 zhangmen 中**与游戏业务无关、属于通用工程能力**的部分（多 API、流式标签解析、变量回溯、lorebook 重命名/多导入）回填到 skill，让任意未来的 SillyTavern-style 游戏前端都能一键生成。

## 3. 范围与不范围

### In Scope
- 新增「游戏 UI」生成模式（默认启用）
- 流式 XML 标签解析器（6 个默认标签 + 自定义）
- 多 API 路由（主 API 跑剧情，次 API 跑总结/变量）
- 每楼层变量快照（floor-as-snapshot）
- Lorebook 重命名 + 多文件导入
- skill 安装期交互问询（标签集 / 次 API / schema）

### Out of Scope
- 修仙业务（境界、丹药、装备、功法、伏笔等 zhangmen 特有功能）
- 完整 schema-first 状态管理（z* DSL；本期变量用 free-form Record）
- GSAP 动画、移动端 FAB、多语言
- 单独的快照表（floor 自带 `variablesAfter`，无需另设）

## 4. 决策摘要

| 议题 | 决策 |
|---|---|
| UI 整合 | 游戏 UI 主，聊天列表降级为「历史抽屉」 |
| 多 API 路由 | 主跑剧情，次跑 sum/vars；次 API 默认关，可在 settings 启用 |
| 快照机制 | 不单独维护快照，依赖每条 assistant floor 的 `variablesAfter` |
| Lorebook | 全局多激活（已有）+ 多文件导入 + 重命名（新增） |
| 默认标签 | `<maintext>` `<option>` `<sum>` `<vars>` `<thinking>` `<think>` |
| 标签可定制 | skill 安装期交互询问；settings 可后续编辑 |
| `<thinking>` / `<think>` | 不透明区，内部不识别其它标签 |
| 流式 | 解析到 `<maintext>` 即开始流式渲染 |
| `<vars>` 格式 | JSON 深合并 |
| 思考显示 | 默认折叠、可展开 |
| 流中失败 | 丢弃部分内容 + toast 提示重试，不写 DB |

## 5. 整体架构

```
/sillytavern-web (skill v3.0)

Scaffolding Phase                                Generated Code (3 layer)

┌──────────────────────────────┐                ┌────────────────────┐
│ 检测 React/Vue/Vanilla       │                │ sillytavern/       │
│ 询问游戏模式? [Y/n]          │                │   database         │
│ 询问标签集 [默认 6 个]        │                │   lorebook-engine  │
│ 询问启用次 API? [y/N]        │                │   prompt-asm       │
│ 询问 game-state schema?      │  ─generate─►   │   importer         │
│ npm install dexie            │                │   variables (扩)   │
│ 写 src/sillytavern/*         │                │   stream-parser ★ │
│ 写 src/hooks/*               │                │   api-router    ★ │
│ 写 src/components/*          │                │   vars-merger   ★ │
└──────────────────────────────┘                ├────────────────────┤
                                                │ hooks/             │
                                                │   useSillytavern   │
                                                │   useStreamParser  │
                                                │   useApiRouter     │
                                                ├────────────────────┤
                                                │ components/        │
                                                │   GameView ★       │
                                                │     ├ MainTextPane │
                                                │     ├ OptionList   │
                                                │     ├ ThinkingFold │
                                                │     └ HistoryDrawer│
                                                │   SettingsModal(扩)│
                                                │   LorebookModal(扩)│
                                                │   PresetModal      │
                                                └────────────────────┘
★ = 本次新增；其它为已有文件扩展
```

## 6. 数据模型增量

```ts
// types.ts 新增/扩展字段

interface ApiSettings {
  primary: { baseUrl: string; apiKey: string; model: string };
  secondary?: {
    baseUrl: string;
    apiKey: string;
    model: string;
    enabled: boolean;
  };
}

interface AppSettings {
  /* 已有字段保留 */
  uiMode: 'game' | 'chat';                    // 默认 'game'
  customTags: string[];                       // 默认 6 个
  formatPromptTemplate: string;               // 写给 LLM 的格式约定
  thinkingDisplay: 'fold' | 'hide' | 'inline';// 默认 'fold'
}

interface ChatMessage {
  /* 已有字段保留 */
  parsed?: ParsedTags;                        // 仅 assistant
  variablesAfter?: Record<string, any>;       // 仅 assistant，应用 vars 后的全量快照
  apiUsed?: 'primary' | 'secondary';          // 调试/审计
}

interface ParsedTags {
  thinking: string;
  maintext: string;
  options: string[];
  sum: string;
  varsRaw: string;
  varsCommands: VarsPatch;                    // 解析后的 JSON 深合并 patch
  unknown: Record<string, string>;            // 用户自定义标签捕获
}

interface VarsPatch {
  merge: Record<string, any>;                 // 深合并到 chat.variables
}

interface Chat {
  /* 已有字段保留 */
  variables: Record<string, any>;             // 当前活跃变量表（= 末尾 floor 的 variablesAfter）
}
```

## 7. 流式解析器

### 7.1 接口

```ts
// stream-parser.ts
type ParserEvent =
  | { type: 'tag-open';    tag: string }
  | { type: 'tag-chunk';   tag: string; chunk: string }
  | { type: 'tag-close';   tag: string; full: string }
  | { type: 'option-line'; line: string }
  | { type: 'raw';         chunk: string };

class StreamTagParser {
  constructor(
    tags: string[],         // 注册的可解析标签集合
    opaqueTags: string[],   // 不透明标签（默认 ['thinking', 'think']）
  );
  feed(chunk: string): ParserEvent[];
  finish(): ParserEvent[];  // EOF: 强制关闭未闭合标签，输出 raw 残余
}
```

### 7.2 状态机

```
NORMAL
  ├─ 见 '<' → BUFFER_TAG (累积到 '>')
  │   ├─ 是 opaque tag (例: <thinking>)  → OPAQUE
  │   ├─ 是 registered tag (例: <maintext>) → TAGGED
  │   └─ 都不是 → 还原为 raw chunk
  └─ 否则 → emit raw

OPAQUE
  ├─ 累积所有字符为 thinking-chunk（emit）
  └─ 见 '</thinking>' 或 '</think>' → emit tag-close('thinking', full) → NORMAL

TAGGED
  ├─ 实时 emit tag-chunk(tag, char)
  ├─ option 状态额外：见 '\n' → emit option-line(buf), 清空 buf
  └─ 见匹配 '</tag>' → emit tag-close(tag, full) → NORMAL
```

### 7.3 跨 chunk 粘连处理

LLM 流式响应按 SSE chunk 推送，标签字符可能横跨两片：
- 进入 BUFFER_TAG 后，`<` 之后到 `>` 之间的字符暂存 `partial` 缓冲
- partial 长度阈值 64 字符；超过视为非法 tag，缓冲内容回滚为 raw
- chunk 切片在 `<` 之后到达：partial 持有 `<mai`，等下一片到达 `ntext>` 后判定

### 7.4 不透明区语义

```
<thinking>我打算先写 <maintext> 再写 <option></thinking>
   ↓
emit tag-open('thinking')
emit tag-chunk('thinking', '我打算先写 <maintext> 再写 <option>')   ← 内部 <maintext>/<option> 不解析
emit tag-close('thinking', '我打算先写 <maintext> 再写 <option>')
```

### 7.5 容错

- 未闭合标签：`finish()` 强制 emit tag-close（取累积内容）
- 嵌套同名标签：忽略内层 open（保持外层状态机不变）
- `<vars>` 内 JSON 解析失败：`varsCommands.merge = {}`，原文存 `varsRaw`

## 8. 变量系统

### 8.1 应用规则

```
对每条流式收到的 assistant 消息：
  1. parser.finish() → 得到 ParsedTags
  2. parsed.varsCommands.merge → deep-merge 到 chat.variables
  3. 把 deep-merge 后的 chat.variables 整张表 clone 到 message.variablesAfter
  4. 写入 DB
```

### 8.2 时间旅行

```
玩家点击「跳回 floor N」（HistoryDrawer 中）：
  1. 删除 floor N 之后的所有 message（已有 deleteMessagesAfter）
  2. chat.variables = floor N 的 variablesAfter
  3. 写入 DB，UI 重新渲染
```

### 8.3 编辑/分支

- 编辑某 floor 内容：parsed/variablesAfter 失效，需重新解析+应用，并级联清掉后续 floor（已有逻辑）
- 分支：复制 chat 直到目标 floor，新 chat 的初始 variables = 目标 floor 的 variablesAfter

## 9. 多 API 路由

### 9.1 接口

```ts
// api-router.ts
type Task = 'story' | 'summary' | 'vars';

interface ApiRouter {
  call(task: Task, payload: ChatRequest): Promise<ReadableStream<string>>;
}
```

### 9.2 默认路由表

```ts
const route: Record<Task, 'primary' | 'secondary'> = {
  story:   'primary',
  summary: settings.api.secondary?.enabled ? 'secondary' : 'primary',
  vars:    settings.api.secondary?.enabled ? 'secondary' : 'primary',
};
```

### 9.3 触发模式

| 模式 | 行为 | 默认 |
|---|---|---|
| 单次回复全包 | 一次主 API 让 LLM 同时给出 maintext/option/sum/vars。次 API 不调。 | ✓ |
| 二段式增强 | 主 API 出 maintext+option；UI 渲染后再用次 API（含本回合 maintext 上下文）补 sum 与 vars。 | 可选 |

二段式默认关。开关在 settings.advanced 区。

### 9.4 失败回退

- 次 API 失败 → 不阻断；toast 提示；自动 fallback 到 primary 重发该任务（一次）
- 主 API 失败 → 详见 §11 错误处理

## 10. UI 结构

### 10.1 GameView 主界面

```
┌─────────────────────────────────────────────────────────┐
│ ☰  历史 │ ⚙ 设置 │ 📖 世界书 │ ✦ 预设 │ ↻ 重 roll │ ← 撤 │
├─────────────────────────────────────────────────────────┤
│ ▼ 思考过程 (折叠)                                       │
│ ───────────────────                                     │
│                                                         │
│ 长门外，雨水……                  ← MainTextPane (流式)   │
│ 你抬头望去……                                            │
│                                                         │
│ ───────────────────                                     │
│ 请选择：                          ← OptionList          │
│ [1] 上前一步迎击                                        │
│ [2] 退守山门，敲钟示警                                  │
│ [3] 自由输入：[___________________________]             │
│                                                         │
│ ───────────────────                                     │
│ 📜 总结：……                       ← SumStrip (折叠)     │
│ 🎒 变量：金钱 -10  HP 38/40       ← VarsStrip (折叠)    │
└─────────────────────────────────────────────────────────┘
```

### 10.2 HistoryDrawer

- 从左滑出
- 列出当前 chat 所有 floor，含 timestamp 与 maintext 摘要
- 行操作：跳转 / 编辑 / 删后续 / 分支
- 跳转 = 调用 §8.2 时间旅行

### 10.3 SettingsModal 扩展

新增以下 tab / section：
- 主 API（已有）
- 次 API（新增 enabled / baseUrl / apiKey / model）
- 标签集（chips 列表，可加可删；保留 6 个默认值；删除后部分 UI 会优雅降级）
- 格式提示词（textarea，初始预填，提供 reset 按钮）
- 思考显示（fold / hide / inline 单选）
- UI 模式（game / chat 单选）

### 10.4 LorebookModal 扩展

- 导入按钮：`<input type="file" multiple>`，循环 import 每文件
- 列表行：右侧加重命名按钮，双击进入 inline 编辑
- 重名冲突：modal 询问「合并 / 改名 / 取消」

### 10.5 三套模板对应实现

- React：函数组件 + hooks（useSillytavern / useStreamParser / useApiRouter）
- Vue 3：Composition API（同名 composables）
- Vanilla：Store 模式 + render functions（参考 zhangmen st-ui.js 但移除业务）

## 11. 错误处理

| 场景 | 行为 |
|---|---|
| 主 API 网络/HTTP 错误 | toast；流中已渲染内容置灰；不写 DB；上一 floor 仍为头 |
| 主 API 流被 abort | 同上 |
| 解析器 partial 超长 | 缓冲内容回滚为 raw chunk |
| 必填标签缺失（如 maintext 全空） | 写 DB 保留原始 content；UI 显示 fallback：raw 全文，options 单项「自由输入」 |
| 次 API 失败 | toast；本任务 fallback primary 重试 1 次；仍失败 → 仅记录，不阻断主流程 |
| `<vars>` JSON 解析失败 | varsCommands.merge = {}；varsRaw 原样保存；toast 警告 |
| Lorebook 文件结构非 SillyTavern 标准 | 复用已有 normalize；解析失败 → toast，不阻塞 |
| 重命名冲突 | modal：合并 / 改名 / 取消 |
| 多文件导入：部分成功 | 成功的入库；失败的列表展示原因 |

## 12. Skill 安装期交互

```
/sillytavern-web 触发后：

[1] 检测 framework
    Found React project. ✓
    Found package.json: src structure looks like Vite+TS.

[2] Q: 启用游戏模式（正文+选项 UI）? [Y/n]
    > Y

[3] Q: 使用默认 6 个标签 (maintext, option, sum, vars, thinking, think)? [Y/n]
    > N
    Q: 列出你需要的标签（用空格隔开，回车结束）：
    > maintext option sum vars thinking think narrator stats

[4] Q: 启用次 API（变量/总结分流）? [y/N]
    > N
    （settings.api.secondary.enabled = false，二段式默认关）

[5] Q: 是否定义游戏数据 schema (类似 zod)? [y/N]
    > N
    （chat.variables 用 free-form Record<string,any>）

[6] npm install dexie
[7] 写 src/sillytavern/*
[8] 写 src/hooks/*
[9] 写 src/components/SillyTavern/*
[10] 输出快速接入 README 片段
```

每个 Q 都有默认值，敲回车即采用 [] 内默认。

## 13. 默认格式提示词

写入 `settings.formatPromptTemplate`，预设里通过 `{{formatPrompt}}` 宏引用：

```
你必须严格按照以下 XML 标签格式输出回复，不要使用 Markdown 包裹：
<thinking>……</thinking>     ← 可选；内部任何字符都视为思考过程，不被解析
<maintext>……</maintext>     ← 必填；本回合的剧情正文，可多段，保留换行
<option>选项 A
选项 B
选项 C</option>              ← 必填；至少 2 项，每行一个
<sum>……</sum>               ← 必填；本回合一句话总结
<vars>{ "金钱": +10, "HP": 38 }</vars>   ← 选填；JSON 深合并
```

如玩家在 §12 step 3 自定义了标签集，提示词会按所选集合自动生成。

## 14. 测试策略

### 14.1 单元测试 (Vitest)

```
sillytavern/
  stream-parser.test.ts
    □ 单 chunk 完整 6 标签
    □ 跨 chunk 撕裂 (<mai|ntext>)
    □ thinking 内嵌 <maintext> 不触发
    □ option 多行切分（含末行无 \n）
    □ vars 非法 JSON 兜底
    □ 未闭合标签 finish() 强制收尾
    □ partial 超长回滚 raw
    □ 自定义标签集捕获 unknown
  vars-merger.test.ts
    □ 深合并 nested object
    □ 数组替换语义
    □ 类型冲突 fallback
  api-router.test.ts
    □ 单 API 模式所有任务走 primary
    □ 双 API 模式 sum/vars 走 secondary
    □ 次 API 失败 fallback primary
  importer.test.ts
    □ 多文件批量导入
    □ 重命名冲突解决（合并/改名/取消三路径）
```

### 14.2 集成 checklist（嵌入 SKILL.md 末尾）

```
React / Vue / Vanilla 三套各自跑：
□ skill 安装无报错
□ 主 API 配置后能流式渲染 maintext
□ thinking 折叠正确，内部假标签不解析
□ option 显示并可点
□ <vars> 改动落到 chat.variables
□ 跳到第 N floor 后，chat.variables = 第 N floor 的 variablesAfter
□ 重命名 lorebook 持久化
□ 多文件导入并去重
□ 切到 chat 模式仍能用聊天列表
□ 主 API 中途断开后撤回回到上一 floor
□ 启用次 API 后 sum/vars 由次 API 输出
```

## 15. 迁移影响

- 现有 v2 用户运行 `/sillytavern-web` 升级到 v3：
  - settings 缺失字段自动补默认值（uiMode='game' 等）
  - 已有 chat 数据兼容（parsed/variablesAfter 缺失时按 fallback UI 渲染原始 content）
  - 不强制重新解析旧消息
- v3 默认 `uiMode='game'`，但提供 settings 一键切回 chat

## 16. 风险与缓解

| 风险 | 缓解 |
|---|---|
| 流式解析器 bug 导致 LLM 输出无法显示 | 单元测试覆盖率要求 ≥ 90%；fallback UI 始终有效 |
| 次 API 模型差异导致 sum/vars 质量下降 | 默认关；提供典型推荐配置（小模型清单）写在 README |
| 自定义标签 + 默认 UI 不匹配 | 标签集变化时只渲染 maintext/option/sum/vars，其他标签内容存 unknown 不显示，留给用户自行扩展 |
| 玩家修改 prompt 模板破坏标签契约 | settings 提供 reset 按钮；解析失败 fallback UI 显示原文 |
| 跨框架（React/Vue/Vanilla）流式实现差异 | 抽象 useStreamParser hook：每框架有薄壳，核心 stream-parser.ts 共用 |

## 17. 后续工作（不在本期）

- schema-first 状态系统（zhangmen game-state.js 抽象）
- 移动端 FAB 导航
- 长按菜单 / 双击交互
- 成员卡 / 装备 / 多角色对话等 zhangmen 业务能力
- 多语言 (i18n)
