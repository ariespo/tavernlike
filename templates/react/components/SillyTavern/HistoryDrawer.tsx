import { useSillytavern } from '../../hooks/useSillytavern';

export function HistoryDrawer({ onClose }: { onClose: () => void }) {
  const st = useSillytavern();
  const messages = st.activeChat?.messages ?? [];

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 100 }}
    >
      <aside
        onClick={e => e.stopPropagation()}
        style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 360,
                 background: '#fff', overflowY: 'auto', padding: 16 }}
      >
        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <strong>历史楼层</strong>
          <button onClick={onClose}>×</button>
        </header>
        <ol style={{ listStyle: 'none', padding: 0 }}>
          {messages.map((m, i) => {
            const summary = m.role === 'assistant'
              ? (m.parsed?.maintext ?? m.content).slice(0, 60)
              : m.content.slice(0, 60);
            return (
              <li key={m.id} style={{ borderBottom: '1px solid #eee', padding: 8 }}>
                <div style={{ fontSize: 12, color: '#888' }}>#{i} · {m.role} · {new Date(m.timestamp).toLocaleTimeString()}</div>
                <div style={{ fontSize: 14, marginTop: 4 }}>{summary}…</div>
                <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                  <button onClick={() => { st.jumpToFloor(m.id); onClose(); }}>跳转</button>
                  <button onClick={() => { const t = prompt('编辑内容', m.content); if (t != null) st.editMessage(m.id, t); }}>编辑</button>
                  <button onClick={() => st.rollbackTo(m.id)}>删后续</button>
                </div>
              </li>
            );
          })}
        </ol>
      </aside>
    </div>
  );
}
