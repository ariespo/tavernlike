import { useState, useEffect } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';
import { getDatabase } from '../../sillytavern/database';
import { importMultipleLorebooks, renameLorebook } from '../../sillytavern/importer';
import type { Lorebook } from '../../sillytavern/types';
import { LorebookEditorModal } from './LorebookEditorModal';

const db = getDatabase();

export function LorebookModal({ onClose }: { onClose: () => void }) {
  const { lorebooks, toggleLorebook, addLorebookFromDefault, deleteLorebook } = useSillytavern();
  const [list, setList] = useState<Lorebook[]>(lorebooks);
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Lorebook | null>(null);

  useEffect(() => {
    setList(lorebooks);
  }, [lorebooks]);

  // Derive active IDs from settings via a separate effect
  useEffect(() => {
    const fetchActive = async () => {
      const settings = await db.settings.toArray();
      const ids = settings[0]?.activeLorebookIds ?? [];
      setActiveIds(new Set(ids));
    };
    fetchActive();
  }, [db, lorebooks]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.4)',
        zIndex: 100,
      }}
    >
      <aside
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 360,
          background: '#fff',
          padding: 16,
          overflowY: 'auto',
        }}
      >
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <strong>世界书</strong>
          <button onClick={onClose}>×</button>
        </header>

        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: 'inline-block',
              padding: '8px 12px',
              background: '#f0f0f0',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            <input
              type="file"
              multiple
              accept=".json"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const files = Array.from(e.target.files ?? []);
                if (files.length === 0) return;

                const inputs = await Promise.all(
                  files.map(async (f) => ({
                    fileName: f.name,
                    json: JSON.parse(await f.text()),
                  }))
                );

                const { successes, failures } = importMultipleLorebooks(inputs);

                for (const s of successes) {
                  const lorebook: Lorebook = {
                    ...s.lorebook,
                    id: crypto.randomUUID(),
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                  };
                  await db.lorebooks.add(lorebook);
                }

                if (failures.length) {
                  alert(
                    '导入失败：\n' +
                      failures.map((f) => `${f.fileName}: ${f.error}`).join('\n')
                  );
                }

                setList(await db.lorebooks.toArray());
                e.target.value = '';
              }}
            />
            批量导入 JSON
          </label>
          <span style={{ marginLeft: 8, fontSize: 12, color: '#888' }}>
            支持多选 .json 文件
          </span>
          <button
            onClick={async () => {
              const name = prompt('新世界书名称', '新世界书');
              if (!name) return;
              const lb = await addLorebookFromDefault(name);
              setList(await db.lorebooks.toArray());
              setEditing(lb);
            }}
            style={{
              marginLeft: 8,
              padding: '8px 12px',
              background: '#2c8',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            + 新建
          </button>
        </div>

        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {list.map((lb) => (
            <li
              key={lb.id}
              style={{
                borderBottom: '1px solid #eee',
                padding: '10px 4px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    flex: 1,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={activeIds.has(lb.id)}
                    onChange={() => {
                      toggleLorebook(lb.id);
                      setActiveIds((prev) => {
                        const next = new Set(prev);
                        if (next.has(lb.id)) next.delete(lb.id);
                        else next.add(lb.id);
                        return next;
                      });
                    }}
                  />
                  <span
                    style={{
                      fontWeight: 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={lb.name}
                  >
                    {lb.name}
                  </span>
                </label>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  marginTop: 6,
                  paddingLeft: 24,
                }}
              >
                <button
                  style={{ fontSize: 12, padding: '2px 8px' }}
                  onClick={async () => {
                    const v = prompt('新名称', lb.name);
                    if (!v || v === lb.name) return;

                    // Check for name conflict
                    const existing = await db.lorebooks
                      .where('name')
                      .equals(v)
                      .first();

                    if (existing && existing.id !== lb.id) {
                      const action = confirm(
                        `已存在名为 "${v}" 的世界书。\n确定 = 合并（覆盖）\n取消 = 重新输入`
                      );
                      if (action) {
                        // Merge: delete old, update current with new name
                        await db.lorebooks.delete(existing.id);
                        await db.lorebooks.put(renameLorebook(lb, v));
                      } else {
                        // Cancel - do nothing, user can retry
                        return;
                      }
                    } else {
                      await db.lorebooks.put(renameLorebook(lb, v));
                    }

                    setList(await db.lorebooks.toArray());
                  }}
                >
                  重命名
                </button>
                <button
                  style={{ fontSize: 12, padding: '2px 8px' }}
                  onClick={() => setEditing(lb)}
                >
                  ✎ 编辑
                </button>
                <button
                  style={{ fontSize: 12, padding: '2px 8px', color: '#c00' }}
                  onClick={async () => {
                    if (!confirm(`确定删除世界书 "${lb.name}"？`)) return;
                    await deleteLorebook(lb.id);
                    setList(await db.lorebooks.toArray());
                  }}
                >
                  删除
                </button>
              </div>
            </li>
          ))}
        </ul>

        {list.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              color: '#888',
              padding: '40px 0',
              fontSize: 14,
            }}
          >
            暂无世界书,请导入 JSON 文件或点击「+ 新建」
          </div>
        )}
      </aside>
      {editing && (
        <LorebookEditorModal
          lorebook={editing}
          onClose={async () => {
            setEditing(null);
            setList(await db.lorebooks.toArray());
          }}
        />
      )}
    </div>
  );
}
