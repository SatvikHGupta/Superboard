// 2 step verification for saving (cost 1 write)

import { useState } from 'react';

const BASE_STYLE = {
  display:     'flex',
  alignItems:  'center',
  gap:         5,
  width:       'auto',
  padding:     '0 10px',
  fontSize:    12,
  borderRadius: 6,
  border:      'none',
  cursor:      'pointer',
  height:      32,
  background:  'transparent',
};

export default function ManualSaveButton({ onSave, iconOnly = false }) {
  const [st, setSt] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'failed'

  async function doSave() {
    if (st === 'saving') return;
    setSt('saving');
    try {
      await onSave();
      setSt('saved');
      setTimeout(() => setSt('idle'), 3000);
    } catch {
      setSt('failed');
    }
  }

  if (st === 'saving') {
    return (
      <button className="btn-icon" disabled style={{ ...BASE_STYLE, color: 'var(--tx-4)' }}>
        <svg
          width="13" height="13" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2"
          style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}
        >
          <path d="M21 12a9 9 0 11-6.219-8.56" />
        </svg>
        {!iconOnly && <span>Saving…</span>}
      </button>
    );
  }

  if (st === 'saved') {
    return (
      <button className="btn-icon" disabled style={{ ...BASE_STYLE, color: 'var(--green)' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        {!iconOnly && <span>Saved</span>}
      </button>
    );
  }

  if (st === 'failed') {
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button className="btn-icon" disabled style={{ ...BASE_STYLE, color: 'var(--red)' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6"  x2="6"  y2="18" />
            <line x1="6"  y1="6"  x2="18" y2="18" />
          </svg>
          {!iconOnly && <span>Failed</span>}
        </button>
        <button
          className="btn-icon"
          onClick={doSave}
          style={{ ...BASE_STYLE, color: 'var(--amber)', border: '1px solid var(--amber)' }}
        >
          {iconOnly ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.13-9.36L23 10" />
            </svg>
          ) : 'Retry'}
        </button>
      </span>
    );
  }

  // idle
  return (
    <button
      className="btn-icon"
      onClick={doSave}
      title="Save now (Ctrl+S)"
      style={{ ...BASE_STYLE, color: 'var(--tx-3)' }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
      </svg>
      {!iconOnly && <span>Save</span>}
    </button>
  );
}