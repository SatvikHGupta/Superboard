//excel-l masters go

import { TOOL_LIST } from '../constants/tools.js';
import { SHORTCUTS } from '../constants/shortcuts.js';

export default function ShortcutsModal({ onClose }) {
  const rows = [
    ...TOOL_LIST.map(t => ({
      label: t.label,
      keys: 'Shift + ' + (SHORTCUTS[t.id] || '?'),
    })),
    { label: 'Toggle Grid', keys: 'Shift + G' },
    { label: 'Clear All', keys: 'Shift + X' },
    { label: 'Undo', keys: 'Ctrl + Z' },
    { label: 'Redo', keys: 'Ctrl + Y' },
    { label: 'Delete Selected', keys: 'Backspace' },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--a-light)" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M8 16h8"/>
            </svg>
            Keyboard Shortcuts
          </h2>
          <button className="btn-icon" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="modal-body" style={{ padding: '12px 20px 20px' }}>
          {rows.map((r, i) => (
            <div key={i} className="modal-row" style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: 'var(--tx-2)' }}>{r.label}</span>
              <kbd style={{
                padding: '3px 10px',
                borderRadius: 'var(--r-sm)',
                background: 'var(--bg-3)',
                border: '1px solid var(--br-2)',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'monospace',
                color: 'var(--tx-1)',
              }}>
                {r.keys}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
