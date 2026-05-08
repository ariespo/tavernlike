import { useState } from 'react';

export function OptionList(props: { options: string[]; disabled: boolean; onPick: (text: string) => void; }) {
  const [custom, setCustom] = useState('');
  return (
    <div className="st-options" style={{ marginTop: 16 }}>
      {props.options.map((opt, i) => (
        <button key={i} disabled={props.disabled} onClick={() => props.onPick(opt)}
          style={{ display: 'block', width: '100%', padding: 12, marginBottom: 8, textAlign: 'left' }}
        >[{i + 1}] {opt}</button>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <input value={custom} onChange={e => setCustom(e.target.value)} placeholder="自由输入…" disabled={props.disabled}
          style={{ flex: 1 }} onKeyDown={e => { if (e.key === 'Enter' && custom.trim()) { props.onPick(custom.trim()); setCustom(''); } }}
        />
        <button disabled={props.disabled || !custom.trim()} onClick={() => { props.onPick(custom.trim()); setCustom(''); }}>发送</button>
      </div>
    </div>
  );
}
