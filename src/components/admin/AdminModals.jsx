// Confirm before regret - 2 step verfiaction

import { useState, useEffect } from 'react';

export function ConfirmModal({ title, message, confirmLabel = 'Confirm', danger = true, onConfirm, onCancel, typeToConfirm }) {
  const [typed, setTyped] = useState('');
  const needsType  = !!typeToConfirm;
  const canConfirm = !needsType || typed === typeToConfirm;

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onCancel(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-content modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ color: danger ? 'var(--red)' : 'var(--tx-1)' }}>{title}</h2>
          <button className="btn-icon" onClick={onCancel}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="modal-body">
          <p style={{ marginBottom: 16, color: 'var(--tx-2)', fontSize: 14, lineHeight: 1.6 }}>{message}</p>
          {needsType && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--tx-4)', marginBottom: 6 }}>
                Type <strong style={{ color: 'var(--tx-2)', fontFamily: 'monospace' }}>{typeToConfirm}</strong> to confirm:
              </div>
              <input className="input" type="text" value={typed} onChange={e => setTyped(e.target.value)}
                placeholder={typeToConfirm} autoFocus style={{ width: '100%' }} />
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
            <button className={danger ? 'btn btn-danger' : 'btn btn-primary'}
              onClick={onConfirm} disabled={!canConfirm} style={{ opacity: canConfirm ? 1 : 0.4 }}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BanModal({ user, onConfirm, onCancel }) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onCancel(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-content modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ color: 'var(--red)' }}>Ban User</h2>
          <button className="btn-icon" onClick={onCancel}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--tx-2)', fontSize: 14, marginBottom: 14 }}>
            Banning <strong>{user.email}</strong> will prevent them from accessing the platform.
          </p>
          <input className="input" type="text" value={reason} onChange={e => setReason(e.target.value)}
            placeholder="Reason (optional)" autoFocus style={{ width: '100%', marginBottom: 16 }} />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
            <button className="btn btn-danger" onClick={() => onConfirm(reason)}>Ban User</button>
          </div>
        </div>
      </div>
    </div>
  );
}
