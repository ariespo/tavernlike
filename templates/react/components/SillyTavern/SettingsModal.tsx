import { useState } from 'react';
import type { AppSettings } from '../../sillytavern/types';
import { DEFAULT_FORMAT_PROMPT } from '../../sillytavern/types';
import { fetchModels, testConnection } from '../../sillytavern/api-tools';
import { exportAllData, importAllData, clearAllData } from '../../sillytavern/database';
import { useSillytavern } from '../../hooks/useSillytavern';

const TABS = ['primary', 'secondary', 'tags', 'prompt', 'display', 'backup'] as const;
type Tab = typeof TABS[number];

const TAB_LABELS: Record<Tab, string> = {
  primary: '主 API',
  secondary: '次 API',
  tags: '标签',
  prompt: '格式提示词',
  display: '显示',
  backup: '备份',
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
  const { showToast } = useSillytavern();

  const [primaryModels, setPrimaryModels] = useState<string[]>([]);
  const [secondaryModels, setSecondaryModels] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const isDual = settings.apiMode === 'dual';
  const secondary = settings.api.secondary ?? {
    enabled: false,
    baseUrl: '',
    apiKey: '',
    model: '',
    temperature: 0.7,
    maxTokens: 8000,
  };

  const updateSecondary = (patch: Partial<NonNullable<AppSettings['api']['secondary']>>) => {
    updateSettings({
      api: {
        ...settings.api,
        secondary: { ...secondary, ...patch },
      },
    });
  };

  const handleFetchModels = async (which: 'primary' | 'secondary') => {
    setBusy(`fetch-${which}`);
    try {
      const target =
        which === 'primary'
          ? { baseUrl: settings.api.baseUrl, apiKey: settings.api.apiKey }
          : { baseUrl: secondary.baseUrl, apiKey: secondary.apiKey };
      const { models, source, error } = await fetchModels(target);
      if (which === 'primary') setPrimaryModels(models);
      else setSecondaryModels(models);
      if (source === 'remote') {
        showToast(`已获取 ${models.length} 个模型`);
      } else if (error) {
        showToast(`获取失败 (${error}),已显示常用模型`);
      }
    } finally {
      setBusy(null);
    }
  };

  const handleTestConnection = async (which: 'primary' | 'secondary') => {
    setBusy(`test-${which}`);
    try {
      const target =
        which === 'primary'
          ? { baseUrl: settings.api.baseUrl, apiKey: settings.api.apiKey, model: settings.api.model }
          : { baseUrl: secondary.baseUrl, apiKey: secondary.apiKey, model: secondary.model };
      const result = await testConnection(target);
      if (result.ok) {
        showToast(`${which === 'primary' ? '主' : '次'} API 连通性测试通过`);
      } else if (result.status) {
        alert(`测试失败: HTTP ${result.status}\n${result.errorBody ?? ''}`);
      } else {
        alert(`测试失败: ${result.error ?? '未知错误'}`);
      }
    } finally {
      setBusy(null);
    }
  };

  const handleExportAll = async () => {
    const data = await exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sillytavern-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('备份已导出');
  };

  const handleImportAll = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const backup = JSON.parse(text);
        if (!confirm(`确认导入备份? 这将覆盖所有现有数据 (${(backup.lorebooks?.length ?? 0)} 世界书 / ${(backup.presets?.length ?? 0)} 预设 / ${(backup.chats?.length ?? 0)} 对话)。`)) return;
        await importAllData(backup);
        showToast('备份已导入,请刷新页面以加载');
      } catch (err) {
        alert('导入失败: ' + (err as Error).message);
      }
    };
    input.click();
  };

  const handleClearAll = async () => {
    if (!confirm('确定清除所有数据? 此操作不可恢复。')) return;
    if (!confirm('再次确认: 所有世界书、预设、对话、设置都将被删除。')) return;
    await clearAllData();
    showToast('数据已清除,请刷新页面');
  };

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

        <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid #eee', paddingBottom: 8, flexWrap: 'wrap' }}>
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
                fontSize: 13,
              }}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {tab === 'primary' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label>
              API 模式
              <select
                value={settings.apiMode}
                onChange={(e) => updateSettings({ apiMode: e.target.value as 'single' | 'dual' })}
                style={{ width: '100%', padding: 6, marginTop: 4 }}
              >
                <option value="single">单 API (一个 LLM 处理所有任务)</option>
                <option value="dual">双 API (主 API 剧情 + 次 API 变量)</option>
              </select>
              <small style={{ display: 'block', color: '#888', marginTop: 4, fontSize: 11 }}>
                {isDual
                  ? '双 API 模式: 主 API 负责剧情/对话, 次 API 负责变量更新等次要任务。'
                  : '单 API 模式: 主 API 同时负责剧情和变量。'}
              </small>
            </label>
            <label>
              Base URL
              <input
                type="text"
                value={settings.api.baseUrl}
                onChange={(e) =>
                  updateSettings({ api: { ...settings.api, baseUrl: e.target.value } })
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
                  updateSettings({ api: { ...settings.api, apiKey: e.target.value } })
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
                  updateSettings({ api: { ...settings.api, model: e.target.value } })
                }
                placeholder="gpt-3.5-turbo"
                style={{ width: '100%', padding: 6, marginTop: 4 }}
              />
              {primaryModels.length > 0 && (
                <select
                  onChange={(e) => {
                    if (!e.target.value) return;
                    updateSettings({ api: { ...settings.api, model: e.target.value } });
                  }}
                  style={{ width: '100%', padding: 6, marginTop: 4, background: '#f8f8f8' }}
                  defaultValue=""
                >
                  <option value="">-- 选择模型 ({primaryModels.length}) --</option>
                  {primaryModels.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              )}
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={() => handleFetchModels('primary')}
                disabled={busy !== null}
                style={{ padding: '6px 12px' }}
              >
                {busy === 'fetch-primary' ? '获取中…' : '获取模型列表'}
              </button>
              <button
                onClick={() => handleTestConnection('primary')}
                disabled={busy !== null}
                style={{ padding: '6px 12px' }}
              >
                {busy === 'test-primary' ? '测试中…' : '测试连通性'}
              </button>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '8px 0' }} />
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
            {!isDual && (
              <div style={{ padding: 10, background: '#fff8e1', border: '1px solid #ffd54f', borderRadius: 4, fontSize: 12, color: '#7a5800' }}>
                当前为单 API 模式。在「主 API」面板切换到双 API 模式以启用此页面的配置。
              </div>
            )}
            <label>
              Base URL
              <input
                type="text"
                value={secondary.baseUrl}
                onChange={(e) => updateSecondary({ baseUrl: e.target.value, enabled: true })}
                placeholder="https://api.deepseek.com/v1"
                style={{ width: '100%', padding: 6, marginTop: 4 }}
              />
            </label>
            <label>
              API Key
              <input
                type="password"
                value={secondary.apiKey}
                onChange={(e) => updateSecondary({ apiKey: e.target.value, enabled: true })}
                placeholder="sk-..."
                style={{ width: '100%', padding: 6, marginTop: 4 }}
              />
            </label>
            <label>
              Model
              <input
                type="text"
                value={secondary.model}
                onChange={(e) => updateSecondary({ model: e.target.value, enabled: true })}
                placeholder="deepseek-chat"
                style={{ width: '100%', padding: 6, marginTop: 4 }}
              />
              {secondaryModels.length > 0 && (
                <select
                  onChange={(e) => {
                    if (!e.target.value) return;
                    updateSecondary({ model: e.target.value, enabled: true });
                  }}
                  style={{ width: '100%', padding: 6, marginTop: 4, background: '#f8f8f8' }}
                  defaultValue=""
                >
                  <option value="">-- 选择模型 ({secondaryModels.length}) --</option>
                  {secondaryModels.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              )}
            </label>
            <div style={{ display: 'flex', gap: 12 }}>
              <label style={{ flex: 1 }}>
                温度 (0-2)
                <input
                  type="number"
                  min={0}
                  max={2}
                  step={0.1}
                  value={secondary.temperature ?? 0.7}
                  onChange={(e) => updateSecondary({ temperature: Number(e.target.value), enabled: true })}
                  style={{ width: '100%', padding: 6, marginTop: 4 }}
                />
              </label>
              <label style={{ flex: 1 }}>
                Max Tokens
                <input
                  type="number"
                  min={1}
                  max={32768}
                  value={secondary.maxTokens ?? 8000}
                  onChange={(e) => updateSecondary({ maxTokens: Number(e.target.value), enabled: true })}
                  style={{ width: '100%', padding: 6, marginTop: 4 }}
                />
              </label>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={() => handleFetchModels('secondary')}
                disabled={busy !== null}
                style={{ padding: '6px 12px' }}
              >
                {busy === 'fetch-secondary' ? '获取中…' : '获取模型列表'}
              </button>
              <button
                onClick={() => handleTestConnection('secondary')}
                disabled={busy !== null}
                style={{ padding: '6px 12px' }}
              >
                {busy === 'test-secondary' ? '测试中…' : '测试连通性'}
              </button>
            </div>
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
                const v = prompt('新标签名(小写、无空格)');
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

        {tab === 'backup' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <fieldset style={{ border: '1px solid #2c8', borderRadius: 4, padding: 12 }}>
              <legend style={{ fontSize: 14, fontWeight: 'bold', color: '#2c8' }}>导出</legend>
              <p style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                将所有世界书、预设、设置、对话导出为单个 JSON 文件。
              </p>
              <button
                onClick={handleExportAll}
                style={{ padding: '8px 16px', background: '#2c8', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
              >
                导出全部数据
              </button>
            </fieldset>
            <fieldset style={{ border: '1px solid #8a8acc', borderRadius: 4, padding: 12 }}>
              <legend style={{ fontSize: 14, fontWeight: 'bold', color: '#6464a8' }}>导入</legend>
              <p style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                从之前导出的备份文件恢复数据。<strong>会覆盖现有数据</strong>。
              </p>
              <button
                onClick={handleImportAll}
                style={{ padding: '8px 16px', background: '#6464a8', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
              >
                导入备份文件
              </button>
            </fieldset>
            <fieldset style={{ border: '1px solid #c44', borderRadius: 4, padding: 12 }}>
              <legend style={{ fontSize: 14, fontWeight: 'bold', color: '#c44' }}>清除</legend>
              <p style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                清除所有本地存储数据。<strong>不可恢复</strong>。
              </p>
              <button
                onClick={handleClearAll}
                style={{ padding: '8px 16px', background: '#c44', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
              >
                清除所有数据
              </button>
            </fieldset>
          </div>
        )}
      </div>
    </div>
  );
}
