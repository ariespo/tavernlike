import { useState } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';

export function VariablesModal({ onClose }: { onClose: () => void }) {
  const { activeChat, setChatVariables } = useSillytavern();
  const vars = activeChat?.variables ?? {};
  const [draftKey, setDraftKey] = useState('');
  const [draftValue, setDraftValue] = useState('');

  const handleAdd = async () => {
    const k = draftKey.trim();
    if (!k) return;
    if (vars[k] !== undefined) {
      alert('变量名已存在');
      return;
    }
    await setChatVariables({ ...vars, [k]: draftValue });
    setDraftKey('');
    setDraftValue('');
  };

  const handleEdit = async (oldKey: string, newKey: string, newValue: string) => {
    const next: Record<string, any> = { ...vars };
    if (oldKey !== newKey) {
      delete next[oldKey];
    }
    next[newKey] = newValue;
    await setChatVariables(next);
  };

  const handleDelete = async (key: string) => {
    if (!confirm(`删除变量 "${key}"?`)) return;
    const next = { ...vars };
    delete next[key];
    await setChatVariables(next);
  };

  return (
    <div
      onClick={onClose}
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
          width: 'min(560px, 95vw)',
          maxHeight: '85vh',
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
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <strong>📊 变量面板</strong>
          <button onClick={onClose}>×</button>
        </header>

        {!activeChat ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#888' }}>
            请先创建或选择一个对话
          </div>
        ) : (
          <main style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            <div
              style={{
                display: 'flex',
                gap: 8,
                marginBottom: 16,
                paddingBottom: 12,
                borderBottom: '1px solid #eee',
              }}
            >
              <input
                type="text"
                placeholder="变量名"
                value={draftKey}
                onChange={(e) => setDraftKey(e.target.value)}
                style={{ flex: 1, padding: 6 }}
              />
              <input
                type="text"
                placeholder="值"
                value={draftValue}
                onChange={(e) => setDraftValue(e.target.value)}
                style={{ flex: 2, padding: 6 }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdd();
                }}
              />
              <button onClick={handleAdd} style={{ padding: '6px 12px' }}>
                + 添加
              </button>
            </div>

            {Object.keys(vars).length === 0 ? (
              <div style={{ color: '#888', padding: 24, textAlign: 'center', fontSize: 13 }}>
                暂无变量。AI 回复中包含 <code>{'<var name="hp" value="100" />'}</code> 时会自动提取。
              </div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {Object.entries(vars).map(([key, value]) => (
                  <VariableRow
                    key={key}
                    varKey={key}
                    varValue={String(value)}
                    onSave={handleEdit}
                    onDelete={() => handleDelete(key)}
                  />
                ))}
              </ul>
            )}

            <div
              style={{
                marginTop: 16,
                padding: 12,
                background: 'rgba(110,207,207,0.08)',
                borderRadius: 6,
                fontSize: 12,
                color: '#555',
              }}
            >
              <strong style={{ color: '#266' }}>提示:</strong> 变量随当前对话保存。AI 回复包含
              <code style={{ background: '#eee', padding: '0 4px', margin: '0 4px' }}>
                {'<vars>{"hp": 80}</vars>'}
              </code>
              块时也会自动合并。
            </div>
          </main>
        )}
      </div>
    </div>
  );
}

function VariableRow({
  varKey,
  varValue,
  onSave,
  onDelete,
}: {
  varKey: string;
  varValue: string;
  onSave: (oldKey: string, newKey: string, newValue: string) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(varKey);
  const [value, setValue] = useState(varValue);
  const dirty = name !== varKey || value !== varValue;

  return (
    <li
      style={{
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        padding: '6px 0',
        borderBottom: '1px solid #f0f0f0',
      }}
    >
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ flex: 1, padding: 4, fontFamily: 'monospace' }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{ flex: 2, padding: 4 }}
      />
      <button
        onClick={() => onSave(varKey, name.trim() || varKey, value)}
        disabled={!dirty || !name.trim()}
        style={{
          padding: '4px 10px',
          background: dirty && name.trim() ? '#2c8' : '#ddd',
          color: '#fff',
          border: 'none',
          borderRadius: 3,
          cursor: dirty && name.trim() ? 'pointer' : 'not-allowed',
          fontSize: 12,
        }}
      >
        保存
      </button>
      <button
        onClick={onDelete}
        style={{ padding: '4px 8px', color: '#c00', background: 'transparent', border: '1px solid #c00', borderRadius: 3, fontSize: 12 }}
      >
        删除
      </button>
    </li>
  );
}
