import { useState } from 'react';
import type { LorebookEntry } from '../../sillytavern/types';
import { clampNumber } from '../../sillytavern/editor-utils';

const POSITIONS: { value: LorebookEntry['position']; label: string }[] = [
  { value: 'before_char', label: 'before_char (角色前)' },
  { value: 'after_char', label: 'after_char (角色后)' },
  { value: 'before_example', label: 'before_example (示例前)' },
  { value: 'after_example', label: 'after_example (示例后)' },
  { value: 'at_depth', label: 'at_depth (按深度)' },
  { value: 'example_msg_top', label: 'example_msg_top' },
  { value: 'example_msg_bottom', label: 'example_msg_bottom' },
  { value: 'outlet', label: 'outlet' },
];

const LOGICS: { value: LorebookEntry['selectiveLogic']; label: string }[] = [
  { value: 'and_any', label: 'and_any (与/任一)' },
  { value: 'not_all', label: 'not_all (非全部)' },
  { value: 'not_any', label: 'not_any (无任一)' },
  { value: 'and_all', label: 'and_all (与/全部)' },
];

function ChipInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    if (value.includes(v)) {
      setDraft('');
      return;
    }
    onChange([...value, v]);
    setDraft('');
  };
  return (
    <div
      style={{
        border: '1px solid #ccc',
        borderRadius: 4,
        padding: 4,
        minHeight: 32,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 4,
      }}
    >
      {value.map((v, i) => (
        <span
          key={i}
          style={{
            background: '#eef',
            border: '1px solid #99c',
            borderRadius: 3,
            padding: '2px 6px',
            fontSize: 12,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {v}
          <button
            onClick={() => onChange(value.filter((_, j) => j !== i))}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: '#777',
              padding: 0,
            }}
            title="移除"
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        value={draft}
        placeholder={placeholder ?? '回车添加'}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            add();
          }
        }}
        onBlur={add}
        style={{
          border: 'none',
          outline: 'none',
          flex: 1,
          minWidth: 80,
          fontSize: 13,
        }}
      />
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', marginBottom: 12 }}>
      <span style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 4 }}>
        {label}
      </span>
      {children}
    </label>
  );
}

export function EntryForm({
  value,
  onChange,
}: {
  value: LorebookEntry;
  onChange: (patch: Partial<LorebookEntry>) => void;
}) {
  const isAtDepth = value.position === 'at_depth';

  return (
    <div style={{ padding: 12 }}>
      <Row label="关键词 (主)">
        <ChipInput value={value.keys} onChange={(keys) => onChange({ keys })} />
      </Row>
      <Row label="次级关键词 (selective 时启用)">
        <ChipInput
          value={value.secondaryKeys}
          onChange={(secondaryKeys) => onChange({ secondaryKeys })}
        />
      </Row>
      <Row label="备注 (comment)">
        <input
          type="text"
          value={value.comment ?? ''}
          onChange={(e) => onChange({ comment: e.target.value })}
          placeholder="留空时使用内容前 30 字"
          style={{ width: '100%', padding: 6 }}
        />
      </Row>
      <Row label="内容 (content)">
        <textarea
          value={value.content}
          onChange={(e) => onChange({ content: e.target.value })}
          style={{
            width: '100%',
            height: 200,
            padding: 8,
            fontFamily: 'monospace',
            fontSize: 13,
          }}
        />
      </Row>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <Row label="位置 (position)">
          <select
            value={value.position}
            onChange={(e) => onChange({ position: e.target.value as LorebookEntry['position'] })}
            style={{ padding: 6, width: 220 }}
          >
            {POSITIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </Row>
        {isAtDepth && (
          <>
            <Row label="深度 (depth)">
              <input
                type="number"
                value={value.depth ?? 4}
                onChange={(e) =>
                  onChange({ depth: clampNumber(e.target.value, 0, 999, 4) })
                }
                style={{ padding: 6, width: 80 }}
              />
            </Row>
            <Row label="角色 (role)">
              <select
                value={value.role ?? 0}
                onChange={(e) => onChange({ role: Number(e.target.value) })}
                style={{ padding: 6, width: 120 }}
              >
                <option value={0}>system</option>
                <option value={1}>user</option>
                <option value={2}>assistant</option>
              </select>
            </Row>
          </>
        )}
        <Row label="优先级 (order)">
          <input
            type="number"
            value={value.order}
            onChange={(e) => onChange({ order: clampNumber(e.target.value, 0, 9999, 100) })}
            style={{ padding: 6, width: 80 }}
          />
        </Row>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 12 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            checked={value.constant}
            onChange={(e) => onChange({ constant: e.target.checked })}
          />
          常驻 (constant)
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            checked={value.selective}
            onChange={(e) => onChange({ selective: e.target.checked })}
          />
          选择性 (selective)
        </label>
        {value.selective && (
          <select
            value={value.selectiveLogic}
            onChange={(e) =>
              onChange({ selectiveLogic: e.target.value as LorebookEntry['selectiveLogic'] })
            }
            style={{ padding: 4 }}
          >
            {LOGICS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        )}
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            checked={value.useProbability ?? false}
            onChange={(e) => onChange({ useProbability: e.target.checked })}
          />
          启用概率
        </label>
        {value.useProbability && (
          <input
            type="number"
            value={value.probability}
            onChange={(e) =>
              onChange({ probability: clampNumber(e.target.value, 0, 100, 100) })
            }
            style={{ padding: 4, width: 70 }}
            min={0}
            max={100}
          />
        )}
      </div>

      <details style={{ borderTop: '1px solid #eee', paddingTop: 12 }}>
        <summary style={{ cursor: 'pointer', fontSize: 13, color: '#555' }}>
          高级设置
        </summary>
        <div style={{ paddingTop: 12 }}>
          <Row label="扫描深度 (scanDepth)">
            <input
              type="number"
              value={value.scanDepth ?? 0}
              onChange={(e) => onChange({ scanDepth: clampNumber(e.target.value, 0, 999, 0) })}
              style={{ padding: 6, width: 100 }}
            />
          </Row>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
            <label>
              <input
                type="checkbox"
                checked={value.caseSensitive ?? false}
                onChange={(e) => onChange({ caseSensitive: e.target.checked })}
              />
              区分大小写
            </label>
            <label>
              <input
                type="checkbox"
                checked={value.matchWholeWords ?? false}
                onChange={(e) => onChange({ matchWholeWords: e.target.checked })}
              />
              全词匹配
            </label>
            <label>
              <input
                type="checkbox"
                checked={value.excludeRecursion ?? false}
                onChange={(e) => onChange({ excludeRecursion: e.target.checked })}
              />
              排除递归
            </label>
            <label>
              <input
                type="checkbox"
                checked={value.preventRecursion ?? false}
                onChange={(e) => onChange({ preventRecursion: e.target.checked })}
              />
              阻止递归
            </label>
            <label>
              <input
                type="checkbox"
                checked={value.addMemo ?? false}
                onChange={(e) => onChange({ addMemo: e.target.checked })}
              />
              添加备注 (addMemo)
            </label>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <Row label="sticky">
              <input
                type="number"
                value={value.sticky ?? 0}
                onChange={(e) => onChange({ sticky: clampNumber(e.target.value, 0, 9999, 0) })}
                style={{ padding: 6, width: 90 }}
              />
            </Row>
            <Row label="cooldown">
              <input
                type="number"
                value={value.cooldown ?? 0}
                onChange={(e) => onChange({ cooldown: clampNumber(e.target.value, 0, 9999, 0) })}
                style={{ padding: 6, width: 90 }}
              />
            </Row>
            <Row label="delay">
              <input
                type="number"
                value={value.delay ?? 0}
                onChange={(e) => onChange({ delay: clampNumber(e.target.value, 0, 9999, 0) })}
                style={{ padding: 6, width: 90 }}
              />
            </Row>
            <Row label="weight">
              <input
                type="number"
                value={value.weight ?? 100}
                onChange={(e) => onChange({ weight: clampNumber(e.target.value, 0, 9999, 100) })}
                style={{ padding: 6, width: 90 }}
              />
            </Row>
          </div>

          <Row label="分组 (group)">
            <input
              type="text"
              value={value.group ?? ''}
              onChange={(e) => onChange({ group: e.target.value })}
              style={{ padding: 6, width: '100%' }}
            />
          </Row>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <input
              type="checkbox"
              checked={value.useGroupScoring ?? false}
              onChange={(e) => onChange({ useGroupScoring: e.target.checked })}
            />
            分组评分
          </label>

          <fieldset style={{ marginBottom: 12, border: '1px solid #ddd', padding: 8 }}>
            <legend style={{ fontSize: 12, color: '#555' }}>字符卡匹配</legend>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {(
                [
                  ['matchPersonaDescription', '人设描述'],
                  ['matchCharacterDescription', '角色描述'],
                  ['matchCharacterPersonality', '角色性格'],
                  ['matchCharacterDepthPrompt', '角色深度提示'],
                  ['matchScenario', '场景'],
                  ['matchCreatorNotes', '创建者备注'],
                ] as const
              ).map(([k, label]) => (
                <label key={k} style={{ fontSize: 12 }}>
                  <input
                    type="checkbox"
                    checked={(value as any)[k] ?? false}
                    onChange={(e) => onChange({ [k]: e.target.checked } as any)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <Row label="decorators (逗号分隔)">
            <input
              type="text"
              value={(value.decorators ?? []).join(', ')}
              onChange={(e) =>
                onChange({
                  decorators: e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              style={{ padding: 6, width: '100%' }}
            />
          </Row>

          <Row label="characterFilter (JSON,留空表示无)">
            <textarea
              value={value.characterFilter ? JSON.stringify(value.characterFilter, null, 2) : ''}
              onChange={(e) => {
                const raw = e.target.value.trim();
                if (!raw) {
                  onChange({ characterFilter: undefined });
                  return;
                }
                try {
                  onChange({ characterFilter: JSON.parse(raw) });
                } catch {
                  // silently ignore parse errors while typing
                }
              }}
              style={{
                width: '100%',
                height: 80,
                padding: 6,
                fontFamily: 'monospace',
                fontSize: 12,
              }}
            />
          </Row>
        </div>
      </details>
    </div>
  );
}
