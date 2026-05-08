import { useState } from 'react';

export function ThinkingFold({ text, mode }: { text: string; mode: 'fold' | 'hide' | 'inline' }) {
  const [open, setOpen] = useState(false);
  if (!text || mode === 'hide') return null;
  if (mode === 'inline') return <div style={{ color: '#888', fontStyle: 'italic', marginBottom: 8 }}>{text}</div>;
  return (
    <div style={{ marginBottom: 8 }}>
      <button onClick={() => setOpen(o => !o)} style={{ color: '#888' }}>{open ? '▾' : '▸'} 思考过程</button>
      {open && <pre style={{ whiteSpace: 'pre-wrap', color: '#888' }}>{text}</pre>}
    </div>
  );
}
