import { useState, useMemo, useEffect } from 'react';
import type { ChatPreset } from '../../sillytavern/types';
import { useSillytavern } from '../../hooks/useSillytavern';
import { PromptOrderEditor, type PromptOrderItem } from './PromptOrderEditor';
import { clampNumber } from '../../sillytavern/editor-utils';

const TABS = ['sampling', 'prompts', 'custom', 'order'] as const;
type Tab = typeof TABS[number];
const TAB_LABELS: Record<Tab, string> = {
  sampling: '采样',
  prompts: 'Prompt 文本',
  custom: '自定义 Prompts',
  order: '排序',
};

const PROMPT_TEXT_FIELDS: { key: string; label: string }[] = [
  { key: 'main', label: 'Main' },
  { key: 'nsfw', label: 'NSFW' },
  { key: 'jailbreak', label: 'Jailbreak' },
  { key: 'enhanceDefinitions', label: 'Enhance Definitions' },
  { key: 'impersonation_prompt', label: 'Impersonation Prompt' },
  { key: 'new_chat_prompt', label: 'New Chat Prompt' },
  { key: 'new_group_chat_prompt', label: 'New Group Chat Prompt' },
  { key: 'new_example_chat_prompt', label: 'New Example Chat Prompt' },
  { key: 'continue_nudge_prompt', label: 'Continue Nudge Prompt' },
  { key: 'wi_format', label: 'World Info Format' },
  { key: 'group_nudge_prompt', label: 'Group Nudge Prompt' },
  { key: 'scenario_format', label: 'Scenario Format' },
  { key: 'personality_format', label: 'Personality Format' },
];

interface CustomPromptItem {
  identifier: string;
  role?: 'system' | 'user' | 'assistant';
  content?: string;
}

function NumberField({
  label,
  value,
  onChange,
  step,
  min,
  max,
  fallback,
}: {
  label: string;
  value: number | undefined;
  onChange: (n: number) => void;
  step?: number;
  min?: number;
  max?: number;
  fallback: number;
}) {
  return (
    <label style={{ display: 'block', marginBottom: 8 }}>
      <span style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 2 }}>
        {label}
      </span>
      <input
        type="number"
        step={step ?? 1}
        value={value ?? fallback}
        onChange={(e) =>
          onChange(clampNumber(e.target.value, min ?? -1e9, max ?? 1e9, fallback))
        }
        style={{ padding: 6, width: 140 }}
      />
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string | undefined;
  onChange: (s: string) => void;
  placeholder?: string;
}) {
  return (
    <label style={{ display: 'block', marginBottom: 8 }}>
      <span style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 2 }}>
        {label}
      </span>
      <input
        type="text"
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{ padding: 6, width: '100%' }}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows,
}: {
  label: string;
  value: string | undefined;
  onChange: (s: string) => void;
  rows?: number;
}) {
  return (
    <label style={{ display: 'block', marginBottom: 12 }}>
      <span style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 4 }}>
        {label}
      </span>
      <textarea
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: 8,
          fontFamily: 'monospace',
          fontSize: 12,
        }}
        rows={rows ?? 4}
      />
    </label>
  );
}

export function PresetModal({ onClose }: { onClose: () => void }) {
  const {
    presets,
    settings,
    updateSettings,
    updatePreset,
    deletePreset,
    addPresetFromDefault,
  } = useSillytavern();

  const [selectedId, setSelectedId] = useState<string | null>(
    settings?.activePresetId ?? presets[0]?.id ?? null,
  );
  const original = useMemo(
    () => presets.find((p) => p.id === selectedId) ?? null,
    [presets, selectedId],
  );
  const [draft, setDraft] = useState<ChatPreset | null>(original);
  const [tab, setTab] = useState<Tab>('sampling');

  useEffect(() => {
    setDraft(original);
  }, [original?.id]);

  const dirty = useMemo(() => {
    if (!draft || !original) return false;
    return draft.name !== original.name || JSON.stringify(draft.settings) !== JSON.stringify(original.settings);
  }, [draft, original]);

  const patchSettings = (patch: Record<string, any>) => {
    if (!draft) return;
    setDraft({ ...draft, settings: { ...draft.settings, ...patch } });
  };

  const tryClose = () => {
    if (dirty && !confirm('放弃未保存的修改?')) return;
    onClose();
  };

  const handleSave = async () => {
    if (!draft) return;
    try {
      await updatePreset(draft);
    } catch (e) {
      alert('保存失败: ' + (e as Error).message);
    }
  };

  const handleSelectPreset = (id: string) => {
    if (dirty && !confirm('当前预设有未保存修改,确定切换?')) return;
    setSelectedId(id);
    const next = presets.find((p) => p.id === id);
    setDraft(next ?? null);
  };

  const handleActivate = async () => {
    if (!draft) return;
    await updateSettings({ activePresetId: draft.id });
  };

  const handleNewPreset = async () => {
    const name = prompt('新预设名称', '新预设');
    if (!name) return;
    const p = await addPresetFromDefault(name);
    setSelectedId(p.id);
    setDraft(p);
  };

  const handleDelete = async () => {
    if (!draft) return;
    if (!confirm(`删除预设 "${draft.name}"?`)) return;
    await deletePreset(draft.id);
    const remaining = presets.filter((p) => p.id !== draft.id);
    setSelectedId(remaining[0]?.id ?? null);
    setDraft(remaining[0] ?? null);
  };

  const handleAddCustomPrompt = () => {
    if (!draft) return;
    const current = (draft.settings.prompts ?? []) as CustomPromptItem[];
    const id = prompt('新 prompt 的 identifier (英文/下划线)', 'custom_' + (current.length + 1));
    if (!id) return;
    if (current.some((p) => p.identifier === id)) {
      alert('identifier 已存在');
      return;
    }
    patchSettings({
      prompts: [...current, { identifier: id, role: 'system', content: '' }],
    });
  };

  return (
    <div
      onClick={tryClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.5)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          width: 'min(1100px, 95vw)',
          height: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 6,
          overflow: 'hidden',
        }}
      >
        <header
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid #eee',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <strong>预设管理</strong>
          <button onClick={handleNewPreset}>+ 新建</button>
          {draft && (
            <>
              <button onClick={handleActivate} disabled={settings?.activePresetId === draft.id}>
                {settings?.activePresetId === draft.id ? '当前已激活' : '设为激活'}
              </button>
              <button onClick={handleDelete} style={{ color: '#c00' }}>
                删除
              </button>
            </>
          )}
          <span style={{ flex: 1 }} />
          <button
            onClick={handleSave}
            disabled={!dirty}
            style={{
              padding: '6px 14px',
              background: dirty ? '#2c8' : '#bbb',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: dirty ? 'pointer' : 'not-allowed',
            }}
          >
            保存
          </button>
          <button onClick={tryClose}>×</button>
        </header>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <aside
            style={{
              width: 240,
              borderRight: '1px solid #eee',
              overflowY: 'auto',
              padding: 8,
            }}
          >
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {presets.map((p) => (
                <li
                  key={p.id}
                  onClick={() => handleSelectPreset(p.id)}
                  style={{
                    padding: '6px 8px',
                    cursor: 'pointer',
                    background: p.id === selectedId ? '#e6f0ff' : 'transparent',
                    borderRadius: 4,
                    fontSize: 13,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {settings?.activePresetId === p.id ? '★ ' : ''}
                  {p.name}
                </li>
              ))}
            </ul>
            {presets.length === 0 && (
              <div style={{ textAlign: 'center', color: '#888', padding: 24, fontSize: 13 }}>
                暂无预设
              </div>
            )}
          </aside>

          <main style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
            {!draft ? (
              <div style={{ textAlign: 'center', color: '#888', padding: 60 }}>
                选择左侧预设或新建一个
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    名称:
                    <input
                      type="text"
                      value={draft.name}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                      style={{ padding: 6, flex: 1 }}
                    />
                  </label>
                </div>

                <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                  {TABS.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      style={{
                        padding: '4px 10px',
                        border: 'none',
                        background: tab === t ? '#333' : '#f0f0f0',
                        color: tab === t ? '#fff' : '#333',
                        borderRadius: 4,
                        cursor: 'pointer',
                      }}
                    >
                      {TAB_LABELS[t]}
                    </button>
                  ))}
                </div>

                {tab === 'sampling' && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <NumberField
                      label="temp_openai (温度)"
                      value={draft.settings.temp_openai}
                      onChange={(v) => patchSettings({ temp_openai: v })}
                      step={0.05}
                      min={0}
                      max={2}
                      fallback={0.8}
                    />
                    <NumberField
                      label="top_p_openai"
                      value={draft.settings.top_p_openai}
                      onChange={(v) => patchSettings({ top_p_openai: v })}
                      step={0.01}
                      min={0}
                      max={1}
                      fallback={0.9}
                    />
                    <NumberField
                      label="top_k_openai"
                      value={draft.settings.top_k_openai}
                      onChange={(v) => patchSettings({ top_k_openai: v })}
                      step={1}
                      min={0}
                      max={500}
                      fallback={0}
                    />
                    <NumberField
                      label="top_a_openai"
                      value={draft.settings.top_a_openai}
                      onChange={(v) => patchSettings({ top_a_openai: v })}
                      step={0.01}
                      min={0}
                      max={1}
                      fallback={0}
                    />
                    <NumberField
                      label="min_p_openai"
                      value={draft.settings.min_p_openai}
                      onChange={(v) => patchSettings({ min_p_openai: v })}
                      step={0.01}
                      min={0}
                      max={1}
                      fallback={0}
                    />
                    <NumberField
                      label="freq_pen_openai (频率惩罚)"
                      value={draft.settings.freq_pen_openai}
                      onChange={(v) => patchSettings({ freq_pen_openai: v })}
                      step={0.1}
                      min={-2}
                      max={2}
                      fallback={0}
                    />
                    <NumberField
                      label="pres_pen_openai (存在惩罚)"
                      value={draft.settings.pres_pen_openai}
                      onChange={(v) => patchSettings({ pres_pen_openai: v })}
                      step={0.1}
                      min={-2}
                      max={2}
                      fallback={0}
                    />
                    <NumberField
                      label="repetition_penalty_openai"
                      value={draft.settings.repetition_penalty_openai}
                      onChange={(v) => patchSettings({ repetition_penalty_openai: v })}
                      step={0.05}
                      min={0}
                      max={2}
                      fallback={1}
                    />
                    <NumberField
                      label="openai_max_context"
                      value={draft.settings.openai_max_context}
                      onChange={(v) => patchSettings({ openai_max_context: v })}
                      step={256}
                      min={256}
                      max={2_000_000}
                      fallback={4096}
                    />
                    <NumberField
                      label="openai_max_tokens"
                      value={draft.settings.openai_max_tokens}
                      onChange={(v) => patchSettings({ openai_max_tokens: v })}
                      step={64}
                      min={32}
                      max={32768}
                      fallback={2048}
                    />
                    <TextField
                      label="openai_model"
                      value={draft.settings.openai_model}
                      onChange={(v) => patchSettings({ openai_model: v })}
                      placeholder="gpt-3.5-turbo"
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <label>
                        <input
                          type="checkbox"
                          checked={!!draft.settings.stream_openai}
                          onChange={(e) => patchSettings({ stream_openai: e.target.checked })}
                        />
                        stream_openai
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={!!draft.settings.max_context_unlocked}
                          onChange={(e) =>
                            patchSettings({ max_context_unlocked: e.target.checked })
                          }
                        />
                        max_context_unlocked
                      </label>
                    </div>
                  </div>
                )}

                {tab === 'prompts' && (
                  <div>
                    {PROMPT_TEXT_FIELDS.map((f) => (
                      <TextArea
                        key={f.key}
                        label={f.label + ' (' + f.key + ')'}
                        value={draft.settings[f.key]}
                        onChange={(v) => patchSettings({ [f.key]: v })}
                        rows={4}
                      />
                    ))}
                  </div>
                )}

                {tab === 'custom' && (
                  <div>
                    <button onClick={handleAddCustomPrompt} style={{ marginBottom: 12 }}>
                      + 新建自定义 prompt
                    </button>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {((draft.settings.prompts ?? []) as CustomPromptItem[]).map((p, idx) => (
                        <li
                          key={p.identifier + idx}
                          style={{
                            border: '1px solid #ddd',
                            borderRadius: 4,
                            padding: 8,
                            marginBottom: 8,
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              gap: 8,
                              alignItems: 'center',
                              marginBottom: 8,
                            }}
                          >
                            <code style={{ fontSize: 12, color: '#888' }}>{p.identifier}</code>
                            <select
                              value={p.role ?? 'system'}
                              onChange={(e) => {
                                const list = (draft.settings.prompts ?? []).slice();
                                list[idx] = { ...list[idx], role: e.target.value as any };
                                patchSettings({ prompts: list });
                              }}
                              style={{ padding: 4 }}
                            >
                              <option value="system">system</option>
                              <option value="user">user</option>
                              <option value="assistant">assistant</option>
                            </select>
                            <span style={{ flex: 1 }} />
                            <button
                              onClick={() => {
                                if (!confirm('删除此 prompt?')) return;
                                const list = (draft.settings.prompts ?? []).filter(
                                  (_: any, i: number) => i !== idx,
                                );
                                patchSettings({ prompts: list });
                              }}
                              style={{ color: '#c00' }}
                            >
                              删除
                            </button>
                          </div>
                          <textarea
                            value={p.content ?? ''}
                            onChange={(e) => {
                              const list = (draft.settings.prompts ?? []).slice();
                              list[idx] = { ...list[idx], content: e.target.value };
                              patchSettings({ prompts: list });
                            }}
                            style={{
                              width: '100%',
                              minHeight: 80,
                              padding: 6,
                              fontFamily: 'monospace',
                              fontSize: 12,
                            }}
                          />
                        </li>
                      ))}
                    </ul>
                    {((draft.settings.prompts ?? []) as CustomPromptItem[]).length === 0 && (
                      <div style={{ color: '#888', padding: 16, fontSize: 13 }}>
                        无自定义 prompt
                      </div>
                    )}
                  </div>
                )}

                {tab === 'order' && (
                  <PromptOrderEditor
                    value={(draft.settings.prompt_order ?? []) as PromptOrderItem[]}
                    onChange={(next) => patchSettings({ prompt_order: next })}
                  />
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
