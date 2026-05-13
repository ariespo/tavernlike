import { useState, useMemo } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';
import { ThinkingFold } from './ThinkingFold';
import { MainTextPane } from './MainTextPane';
import { OptionList } from './OptionList';
import { HistoryDrawer } from './HistoryDrawer';
import { SettingsModal } from './SettingsModal';
import { LorebookModal } from './LorebookModal';
import { PresetModal } from './PresetModal';
import { VariablesModal } from './VariablesModal';
import { Toast } from './Toast';

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      style={{
        display: 'inline-block',
        marginLeft: 6,
        minWidth: 18,
        padding: '0 5px',
        background: '#2c8',
        color: '#fff',
        borderRadius: 9,
        fontSize: 11,
        lineHeight: '18px',
        textAlign: 'center',
        fontWeight: 'bold',
      }}
    >
      {count}
    </span>
  );
}

export function GameView() {
  const st = useSillytavern();
  const [historyOpen, setHistoryOpen] = useState(false);

  const lastAssistant = useMemo(
    () => [...(st.activeChat?.messages ?? [])].reverse().find(m => m.role === 'assistant'),
    [st.activeChat],
  );

  const lorebookCount = st.settings?.activeLorebookIds?.length ?? 0;
  const messageCount = st.activeChat?.messages?.length ?? 0;
  const variableCount = Object.keys(st.activeChat?.variables ?? {}).length;

  const isStreaming = st.streamState.isStreaming;
  const display = isStreaming
    ? st.streamState
    : {
        thinking: lastAssistant?.parsed?.thinking ?? '',
        maintext: lastAssistant?.parsed?.maintext ?? lastAssistant?.content ?? '',
        options: lastAssistant?.parsed?.options ?? [],
        sum: lastAssistant?.parsed?.sum ?? '',
      };

  return (
    <div className="st-gameview" style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={() => setHistoryOpen(true)}>
          ☰ 历史<Badge count={messageCount} />
        </button>
        <button onClick={() => st.openSettings()}>⚙ 设置</button>
        <button onClick={() => st.openLorebooks()}>
          📖 世界书<Badge count={lorebookCount} />
        </button>
        <button onClick={() => st.openPresets()}>✦ 预设</button>
        <button onClick={() => st.openVariables()}>
          📊 变量<Badge count={variableCount} />
        </button>
        <button disabled={!lastAssistant} onClick={() => st.regenerateLast()}>↻ 重 roll</button>
      </div>

      <ThinkingFold text={display.thinking} mode={st.settings?.thinkingDisplay ?? 'fold'} />
      <MainTextPane text={display.maintext} isStreaming={isStreaming} />
      <OptionList options={display.options} disabled={isStreaming} onPick={(text) => st.sendGameMessage(text)} />

      {display.sum && (
        <details style={{ marginTop: 24, color: '#666' }}>
          <summary>📜 总结</summary>
          <p>{display.sum}</p>
        </details>
      )}

      {historyOpen && <HistoryDrawer onClose={() => setHistoryOpen(false)} />}
      {st.showSettings && st.settings && (
        <SettingsModal
          settings={st.settings}
          updateSettings={st.updateSettings}
          onClose={() => st.setShowSettings(false)}
        />
      )}
      {st.showLorebooks && <LorebookModal onClose={() => st.setShowLorebooks(false)} />}
      {st.showPresets && <PresetModal onClose={() => st.setShowPresets(false)} />}
      {st.showVariables && <VariablesModal onClose={() => st.setShowVariables(false)} />}
      <Toast message={st.toast} />
    </div>
  );
}
