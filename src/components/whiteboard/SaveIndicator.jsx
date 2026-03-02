// saviour snape - slytherin green

export default function SaveIndicator({ status, timestamp }) {
  if (status === 'saving') {
    return (
      <span
        title="Saving…"
        style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--tx-4)' }}
      >
        <svg
          width="13" height="13" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2"
          style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}
        >
          <path d="M21 12a9 9 0 11-6.219-8.56" />
        </svg>
      </span>
    );
  }

  if (status === 'error') {
    return (
      <span
        title="Autosave failed — use Save button to retry"
        style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--red)' }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8"  x2="12"    y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </span>
    );
  }

  // saved / idle
  return (
    <span
      title={timestamp ? `All changes saved at ${timestamp}` : 'All changes saved'}
      style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--green)' }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
      </svg>
      {timestamp && (
        <span style={{ fontSize: 11, fontWeight: 500 }}>{timestamp}</span>
      )}
    </span>
  );
}