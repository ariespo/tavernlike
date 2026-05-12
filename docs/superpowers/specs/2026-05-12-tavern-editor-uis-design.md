# SillyTavern 编辑器 UI 实装设计

**日期**: 2026-05-12
**作者**: Claude (与 klymdd 协作)
**状态**: 设计稿,等待实现

## 背景

`tavernlike-main` 当前 React 模板提供运行时和导入器,但缺三个编辑器 UI:

1. **世界书条目编辑器** — `LorebookModal` 只能列出、启停、重命名、删除世界书。无法编辑单个 entry 的 keys / content / order / position / probability / selectiveLogic 等字段。
2. **预设参数编辑器** — `PresetModal` 文件根本不存在。`ChatPreset.settings` 是导入 SillyTavern 的原始 JSON,要改只能编辑原 JSON。
3. **`prompt_order` 可视化编辑** — 同上,只能改导入前的 JSON。

本设计补齐这三块,使模板成为完整的可视化编辑器,而非纯导入器。

## 目标

- 在 React 模板下补完编辑器 UI,使用户无需触碰 JSON 即可创建/修改/删除世界书条目和预设。
- 保持现有 SillyTavern 导入/导出兼容性(`importer.ts` 的双向 map 不动)。
- 不引入新 npm 依赖。
- 把所有可测逻辑抽到纯函数,UI 组件保持薄。

## 范围之外

- 字符卡(character cards)UI — `prompt-assembler` 已有 placeholder,但卡片管理面板留待后续。
- 群组聊天 / 多角色 — 同上。
- token 计数器、token 化预览。
- 拖拽排序(明确选用 ↑↓ 按钮以避免新依赖)。
- prompts 数组中的 marker 节点等高级字段(只暴露 identifier / role / content 三字段)。
- 字符卡过滤器(`characterFilter`)UI — 在高级折叠区以 JSON 文本编辑兜底,不展开可视化。

## 架构

### 文件清单

```
templates/react/
├── components/SillyTavern/
│   ├── LorebookModal.tsx          [扩展] + "新建" / "✎ 编辑" 按钮
│   ├── LorebookEditorModal.tsx    [新]   单本世界书的条目列表 + EntryForm
│   ├── EntryForm.tsx              [新]   单条 entry 表单
│   ├── PresetModal.tsx            [新]   Tab 式预设编辑器
│   └── PromptOrderEditor.tsx      [新]   ↑↓ 按钮 + enabled 复选框
├── sillytavern/
│   ├── editor-utils.ts            [新]   纯函数集
│   └── editor-utils.test.ts       [新]   纯函数测试
└── hooks/
    └── useSillytavern.ts          [扩展] 增 update / delete / new-from-default 方法
```

### 组件依赖(单向)

```
LorebookModal ──opens──▶ LorebookEditorModal ──renders──▶ EntryForm
PresetModal ──renders──▶ PromptOrderEditor
所有组件 ──── consume ──▶ useSillytavern ──── persist ─▶ database (IndexedDB)
EntryForm / PresetModal / PromptOrderEditor ── consume ──▶ editor-utils
```

### 边界原则

- **表单组件接收 `value + onChange(patch)`,自身不直接落盘**。
- **草稿在 Modal 层 useState**,关闭未保存时弹 `confirm`。
- **所有数据变换走 editor-utils 纯函数**(可测试)。
- **PromptOrderEditor 自管**(内部 ↑↓ + 复选框),通过 `onChange(nextOrder)` 通知外层。

## 字段清单

### EntryForm — 核心区(默认展开)

| 字段 | 控件 | 备注 |
|------|------|------|
| `keys[]` | chip 输入 | 回车添加,× 移除 |
| `secondaryKeys[]` | chip 输入 | 同上 |
| `comment` | 单行 input | 为空时占位显示 content 前 30 字 |
| `content` | textarea | height 200,monospace,可手动拖大 |
| `position` | select | 8 项:before_char / after_char / before_example / after_example / at_depth / example_msg_top / example_msg_bottom / outlet |
| `depth` | number | 仅当 `position=at_depth` 显示 |
| `role` | select | system/user/assistant,仅 depth 模式 |
| `order` | number | 默认 100 |
| `selective` | checkbox | 勾选后展开 `selectiveLogic` |
| `selectiveLogic` | select | and_any / not_all / not_any / and_all |
| `constant` | checkbox | 常驻 |
| `useProbability` | checkbox | 勾选后展开 `probability` |
| `probability` | number | 0-100,clampNumber 兜底 |

### EntryForm — 高级折叠区(`<details>`,默认收起)

- **扫描**:`scanDepth`、`caseSensitive`、`matchWholeWords`
- **递归**:`excludeRecursion`、`preventRecursion`
- **时序**:`sticky`、`cooldown`、`delay`、`weight`
- **分组**:`group`、`useGroupScoring`
- **字符卡匹配**:`matchPersonaDescription`、`matchCharacterDescription`、`matchCharacterPersonality`、`matchCharacterDepthPrompt`、`matchScenario`、`matchCreatorNotes`
- **其他**:`addMemo`、`decorators[]`(逗号分隔输入)、`characterFilter`(JSON 文本)

### PresetModal Tab

| Tab | 字段 |
|-----|------|
| **采样** | `temp_openai`、`freq_pen_openai`、`pres_pen_openai`、`top_p_openai`、`top_k_openai`、`top_a_openai`、`min_p_openai`、`repetition_penalty_openai`、`openai_max_context`、`openai_max_tokens`、`stream_openai`、`max_context_unlocked`、`openai_model` |
| **Prompt 文本** | `main`、`nsfw`、`jailbreak`、`enhanceDefinitions`、`impersonation_prompt`、`new_chat_prompt`、`new_group_chat_prompt`、`new_example_chat_prompt`、`continue_nudge_prompt`、`wi_format`、`group_nudge_prompt`、`scenario_format`、`personality_format`(全部 textarea) |
| **自定义 Prompts** | `prompts[]` 列表;每条:`identifier` / `role` / `content`;支持新建、编辑、删除 |
| **排序** | `PromptOrderEditor` 渲染 `prompt_order` |

## 数据流

```
用户点 LorebookModal "✎ 编辑"
  ──▶ setEditingLorebook(lb) ──▶ LorebookEditorModal 打开
       ↓
   内部 useState<Lorebook> draft = lb
       ↓
   用户改 EntryForm.value ──▶ onChange(patch) ──▶ setDraft(updateEntry(draft, id, patch))
       ↓
   "保存" 按钮 ──▶ useSillytavern.updateLorebook(draft) ──▶ db.lorebooks.put(draft)
   "取消"/× ──▶ 若 draft !== lb ──▶ confirm("放弃修改?") 后关闭
```

PresetModal 数据流同构,把 `Lorebook` 换成 `ChatPreset`。

## hook 扩展

`useSillytavern.ts` 新增以下方法:

```ts
updateLorebook(lb: Lorebook): Promise<void>
deleteLorebook(id: string): Promise<void>
addLorebookFromDefault(name: string): Promise<Lorebook>

updatePreset(preset: ChatPreset): Promise<void>
deletePreset(id: string): Promise<void>
addPresetFromDefault(name: string): Promise<ChatPreset>
```

`addLorebookFromDefault` / `addPresetFromDefault` 走 editor-utils 的 `createDefaultLorebook` / 复用现有 `createDefaultPreset`,生成新 `id` + 时间戳,落盘并更新 state。

`database.ts` 已具备 `saveLorebook`、`deleteLorebook`、`savePreset`、`deletePreset`,直接复用,无需扩展。

## editor-utils 接口

```ts
// 纯函数,无副作用
export function createDefaultEntry(): LorebookEntry
export function createDefaultLorebook(name: string): Lorebook
export function applyEntryDefaults(partial: Partial<LorebookEntry>): LorebookEntry
export function updateEntry(book: Lorebook, entryId: string, patch: Partial<LorebookEntry>): Lorebook
export function removeEntry(book: Lorebook, entryId: string): Lorebook
export function movePromptItem<T>(arr: T[], from: number, to: number): T[]
export function clampNumber(value: unknown, min: number, max: number, fallback?: number): number
```

## TDD 计划

按 superpowers:test-driven-development 流程,**先写 `editor-utils.test.ts`,再写 `editor-utils.ts`**。测试覆盖:

1. `createDefaultEntry()` 返回的 entry 含 `id` 是 36 字符的 UUID、`keys=[]`、`content=''`、`order=100`、`position='after_char'`、`selective=false`、`selectiveLogic='and_any'`、`constant=false`、`probability=100`、`useProbability=false`、`addMemo=false`。
2. `createDefaultLorebook('foo')` 返回 `name='foo'`、`entries=[]`、`recursiveScanning=false`、`caseSensitive=false`、`matchWholeWords=false`。
3. `movePromptItem([a,b,c], 0, 2)` 返回 `[b,c,a]`;`movePromptItem([a,b,c], -1, 0)` 返回原数组;`movePromptItem([a,b,c], 0, 99)` 返回原数组;**不修改入参**。
4. `clampNumber(5, 0, 10)` → 5;`clampNumber(NaN, 0, 10)` → 0;`clampNumber('7', 0, 10)` → 7;`clampNumber(-1, 0, 10, 5)` → 5;`clampNumber(99, 0, 10)` → 10。
5. `updateEntry(book, 'id1', {content: 'x'})` 返回新 book,该 entry content='x',其他 entry 不变;未匹配 id 时原样返回(对象引用相同)。
6. `removeEntry(book, 'id1')` 返回新 book,entries 少一项;未匹配 id 时原样返回。
7. `applyEntryDefaults({keys: ['a']})` 返回包含 `keys=['a']` + 其他字段默认值。

UI 组件本身不写 React Testing Library 测试以避免新增依赖。所有可测逻辑全部抽到 editor-utils。

## 错误处理

| 场景 | 处理 |
|------|------|
| `db.lorebooks.put` / `db.presets.put` 失败 | `alert("保存失败: " + e.message)`,draft 保留供用户重试 |
| 同名 Lorebook | 沿用 LorebookModal 现有的 confirm("合并/取消") 流程 |
| `prompts[]` 中 identifier 为空 | PromptOrderEditor 拒绝添加(显示红框 + 内联错误) |
| 数字字段非法输入(空、字母) | `clampNumber` 兜底,保存不阻断 |
| 关闭 Modal 有未保存 draft | `confirm("放弃修改?")` 拒绝则不关 |
| 删除最后一项预设 | 提示"确认删除唯一预设?将无法发送消息";若 `activePresetId` 命中此项,删后清空 |

## UI 视觉

- 复用 LorebookModal / SettingsModal 现有的内联 style 风格(白底、灰边、`#333`/`#888` 文字),不引入样式库。
- LorebookEditorModal 全屏 modal(`inset: 0` + 内容 1000px max-width 居中),内部左侧列表(280px) + 右侧表单(flex 1)。
- PresetModal 全屏 modal,Tab 横向排列(对齐 SettingsModal)。
- PromptOrderEditor:单列垂直,每行 [复选框] [identifier(灰色 monospace)] [name(主)] [↑] [↓]。

## 实现顺序

1. `editor-utils.test.ts` → `editor-utils.ts`(TDD 红→绿)
2. `useSillytavern.ts` 加 update / delete / new-from-default 方法
3. `PromptOrderEditor.tsx`(最小可复用单元)
4. `EntryForm.tsx`
5. `LorebookEditorModal.tsx`
6. `PresetModal.tsx`
7. `LorebookModal.tsx` 加新建/编辑入口
8. 端到端手动验证流程(导入旧 JSON → 编辑 → 保存 → 导出 → diff)

## 验证

- `npm run test`(模板项目里有 vitest 时)执行 editor-utils 测试。
- 手动:导入 SillyTavern 真实预设,在 UI 改 `temp_openai` 与 `prompt_order`,送一条消息,验证 prompt-assembler 行为符合预期。
- 手动:新建空世界书,加 entry,触发对应关键词,验证 lorebook-engine 注入。
- 手动:导出 → 与 SillyTavern 原版字段对齐(确保 importer/exporter 双向兼容性未破)。
