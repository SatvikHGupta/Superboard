//mota >> lamba

export default function StrokeControl({ strokeWidth, setStrokeWidth }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '0 8px',
      width: 180,
      flexShrink: 0,
    }}>
      <input
        className="stroke-slider"
        type="range"
        min={1}
        max={24}
        value={strokeWidth}
        onChange={e => setStrokeWidth(Number(e.target.value))}
        style={{ flex: 1 }}
      />
      <span style={{
        fontSize: 12,
        fontWeight: 600,
        color: 'var(--tx-2)',
        minWidth: 28,
        textAlign: 'center',
      }}>
        {strokeWidth}px
      </span>
    </div>
  );
}
