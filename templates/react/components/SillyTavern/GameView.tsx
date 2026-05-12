import { useState, useMemo } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';
import { ThinkingFold } from './ThinkingFold';
import { MainTextPane } from './MainTextPane';
import { OptionList } from './OptionList';
import { HistoryDrawer } from './HistoryDrawer';
import { SettingsModal } from './SettingsModal';
import { LorebookModal } from './LorebookModal';
import { PresetModal } from './PresetModal';

export function GameView() {
  const st = useSillytavern();
  const [historyOpen, setHistoryOpen] = useState(false);

  const lastAssistant = useMemo(
    () => [...(st.activeChat?.messages ?? [])].reverse().find(m => m.role === 'assistant'),
    [st.activeChat],
  );

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
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => setHistoryOpen(true)}>☰ 历史</button>
        <button onClick={() => st.openSettings()}>⚙ 设置</button>
        <button onClick={() => st.openLorebooks()}>📖 世界书</button>
        <button onClick={() => st.openPresets()}>✦ 预设</button>
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
    </div>
  );
}
