import { useState } from 'react';
import type { AppSettings } from '../../sillytavern/types';
import { DEFAULT_FORMAT_PROMPT } from '../../sillytavern/types';

const TABS = ['primary', 'secondary', 'tags', 'prompt', 'display'] as const;
type Tab = typeof TABS[number];

const TAB_LABELS: Record<Tab, string> = {
  primary: '主 API',
  secondary: '次 API',
  tags: '标签',
  prompt: '格式提示词',
  display: '显示',
};

export function SettingsModal({
  settings,
  updateSettings,
  onClose,
}: {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>('primary');

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 100 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 480,
          background: '#fff',
          overflowY: 'auto',
          padding: 16,
        }}
      >
        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <strong>设置</strong>
          <button onClick={onClose}>×</button>
        </header>

        <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid #eee', paddingBottom: 8 }}>
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

        {tab === 'primary' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label>
              Base URL
              <input
                type="text"
                value={settings.api.baseUrl}
                onChange={(e) =>
                  updateSettings({
                    api: { ...settings.api, baseUrl: e.target.value },
                  })
                }
                placeholder="https://api.openai.com/v1"
                style={{ width: '100%', padding: 6, marginTop: 4 }}
              />
            </label>
            <label>
              API Key
              <input
                type="password"
                value={settings.api.apiKey}
                onChange={(e) =>
                  updateSettings({
                    api: { ...settings.api, apiKey: e.target.value },
                  })
                }
                placeholder="sk-..."
                style={{ width: '100%', padding: 6, marginTop: 4 }}
              />
            </label>
            <label>
              Model
              <input
                type="text"
                value={settings.api.model}
                onChange={(e) =>
                  updateSettings({
                    api: { ...settings.api, model: e.target.value },
                  })
                }
                placeholder="gpt-3.5-turbo"
                style={{ width: '100%', padding: 6, marginTop: 4 }}
              />
            </label>
            <label>
              用户名
              <input
                type="text"
                value={settings.userName}
                onChange={(e) => updateSettings({ userName: e.target.value })}
                style={{ width: '100%', padding: 6, marginTop: 4 }}
              />
            </label>
            <label>
              角色名
              <input
                type="text"
                value={settings.characterName}
                onChange={(e) => updateSettings({ characterName: e.target.value })}
                style={{ width: '100%', padding: 6, marginTop: 4 }}
              />
            </label>
          </div>
        )}

        {tab === 'secondary' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={settings.api.secondary?.enabled ?? false}
                onChange={(e) =>
                  updateSettings({
                    api: {
                      ...settings.api,
                      secondary: {
                        ...(settings.api.secondary ?? {
                          baseUrl: '',
                          apiKey: '',
                          model: '',
                        }),
                        enabled: e.target.checked,
                      },
                    },
                  })
                }
              />
              启用次 API
            </label>
            {settings.api.secondary?.enabled && (
              <>
                <label>
                  Base URL
                  <input
                    type="text"
                    value={settings.api.secondary.baseUrl}
                    onChange={(e) =>
                      updateSettings({
                        api: {
                          ...settings.api,
                          secondary: {
                            ...settings.api.secondary!,
                            baseUrl: e.target.value,
                          },
                        },
                      })
                    }
                    placeholder="https://api.deepseek.com/v1"
                    style={{ width: '100%', padding: 6, marginTop: 4 }}
                  />
                </label>
                <label>
                  API Key
                  <input
                    type="password"
                    value={settings.api.secondary.apiKey}
                    onChange={(e) =>
                      updateSettings({
                        api: {
                          ...settings.api,
                          secondary: {
                            ...settings.api.secondary!,
                            apiKey: e.target.value,
                          },
                        },
                      })
                    }
                    placeholder="sk-..."
                    style={{ width: '100%', padding: 6, marginTop: 4 }}
                  />
                </label>
                <label>
                  Model
                  <input
                    type="text"
                    value={settings.api.secondary.model}
                    onChange={(e) =>
                      updateSettings({
                        api: {
                          ...settings.api,
                          secondary: {
                            ...settings.api.secondary!,
                            model: e.target.value,
                          },
                        },
                      })
                    }
                    placeholder="deepseek-chat"
                    style={{ width: '100%', padding: 6, marginTop: 4 }}
                  />
                </label>
              </>
            )}
          </div>
        )}

        {tab === 'tags' && (
          <div>
            <p style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>
              注册标签由解析器识别。删除 maintext / option / sum / vars / thinking 会破坏默认 UI。
            </p>
            <div style={{ marginBottom: 12 }}>
              {settings.customTags.map((t, i) => (
                <span
                  key={i}
                  style={{
                    display: 'inline-block',
                    padding: '4px 8px',
                    background: '#eee',
                    borderRadius: 4,
                    margin: 4,
                    fontSize: 13,
                  }}
                >
                  {t}{' '}
                  <button
                    onClick={() =>
                      updateSettings({
                        customTags: settings.customTags.filter((_, j) => j !== i),
                      })
                    }
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#888' }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <button
              onClick={() => {
                const v = prompt('新标签名（小写、无空格）');
                if (v && /^[a-z][a-z0-9_-]*$/.test(v)) {
                  updateSettings({ customTags: [...settings.customTags, v] });
                }
              }}
              style={{ padding: '6px 12px', borderRadius: 4, border: '1px solid #ccc', cursor: 'pointer' }}
            >
              + 新增
            </button>
          </div>
        )}

        {tab === 'prompt' && (
          <div>
            <textarea
              value={settings.formatPromptTemplate}
              onChange={(e) => updateSettings({ formatPromptTemplate: e.target.value })}
              style={{ width: '100%', height: 240, padding: 8, fontFamily: 'monospace', fontSize: 13 }}
            />
            <button
              onClick={() => updateSettings({ formatPromptTemplate: DEFAULT_FORMAT_PROMPT })}
              style={{ marginTop: 8, padding: '6px 12px', borderRadius: 4, border: '1px solid #ccc', cursor: 'pointer' }}
            >
              恢复默认
            </button>
          </div>
        )}

        {tab === 'display' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <fieldset style={{ border: '1px solid #ddd', borderRadius: 4, padding: 12 }}>
              <legend style={{ fontSize: 14, fontWeight: 'bold' }}>思考过程显示</legend>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                {(['fold', 'hide', 'inline'] as const).map((m) => (
                  <label key={m} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      checked={settings.thinkingDisplay === m}
                      onChange={() => updateSettings({ thinkingDisplay: m })}
                    />
                    {m === 'fold' ? '折叠' : m === 'hide' ? '隐藏' : '同区'}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset style={{ border: '1px solid #ddd', borderRadius: 4, padding: 12 }}>
              <legend style={{ fontSize: 14, fontWeight: 'bold' }}>UI 模式</legend>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                {(['game', 'chat'] as const).map((m) => (
                  <label key={m} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      checked={settings.uiMode === m}
                      onChange={() => updateSettings({ uiMode: m })}
                    />
                    {m === 'game' ? '游戏' : '聊天'}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        )}
      </div>
    </div>
  );
}
