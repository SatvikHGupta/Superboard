//add 3 inches

export default function ExtendButton({ onExtend }) {
  return (
    <button className="extend-btn" onClick={onExtend} title="Extend board downward">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
      </svg>
      Extend Board
    </button>
  );
}
