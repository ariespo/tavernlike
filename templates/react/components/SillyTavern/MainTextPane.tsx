export function MainTextPane({ text, isStreaming }: { text: string; isStreaming: boolean }) {
  return (
    <div className="st-maintext" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
      {text}{isStreaming && <span className="st-cursor">▍</span>}
    </div>
  );
}
