import { useState, useEffect } from 'react';
import { getBoardById, updateBoardSharing } from '../utils/storage.js';

export default function ShareModal({ boardId, onClose }) {
  const [board, setBoard] = useState(null);
  const [editorEmail, setEditorEmail] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setBoard(getBoardById(boardId));
  }, [boardId]);

  if (!board) return null;

  const isPublic = board.visibility === 'public';
  const editors = board.editors || [];

  function toggleVisibility() {
    const newVis = isPublic ? 'private' : 'public';
    updateBoardSharing(boardId, { visibility: newVis });
    setBoard(getBoardById(boardId));
  }

  function addEditor() {
    const email = editorEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) return;
    if (editors.includes(email)) return;
    updateBoardSharing(boardId, { editors: [...editors, email] });
    setBoard(getBoardById(boardId));
    setEditorEmail('');
  }

  function removeEditor(email) {
    updateBoardSharing(boardId, { editors: editors.filter(e => e !== email) });
    setBoard(getBoardById(boardId));
  }

  function copyLink() {
    const url = window.location.origin + window.location.pathname + '#/view/' + boardId;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Share Board</h2>
          <button className="btn-icon" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="modal-body">
          {/* Owner */}
          <div className="modal-row" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--tx-2)' }}>Owner</span>
              <span style={{ fontSize: 13, color: 'var(--tx-1)' }}>{board.ownerEmail}</span>
            </div>
            <span className="badge badge-amber">Owner</span>
          </div>

          {/* Visibility toggle */}
          <div className="modal-row" style={{ marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--tx-1)' }}>
                {isPublic ? 'Public' : 'Private'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--tx-4)' }}>
                {isPublic ? 'Anyone with the link can view' : 'Only you and editors can access'}
              </div>
            </div>
            <div
              className={'toggle-track' + (isPublic ? ' active' : '')}
              onClick={toggleVisibility}
            >
              <div className="toggle-thumb" />
            </div>
          </div>

          {/* Public link */}
          {isPublic && (
            <div className="modal-row" style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 13, color: 'var(--tx-3)', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                {window.location.origin + '/#/view/' + boardId}
              </span>
              <button className="btn btn-ghost" onClick={copyLink} style={{ padding: '4px 12px', fontSize: 12 }}>
                {copied ? '✓ Copied' : 'Copy Link'}
              </button>
            </div>
          )}

          {/* Add editor */}
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx-2)', marginBottom: 8 }}>Editors</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input
              className="input"
              type="email"
              value={editorEmail}
              onChange={e => setEditorEmail(e.target.value)}
              placeholder="Add editor by email..."
              onKeyDown={e => e.key === 'Enter' && addEditor()}
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" onClick={addEditor} style={{ padding: '8px 16px' }}>Add</button>
          </div>

          {/* Editor list */}
          {editors.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--tx-4)', textAlign: 'center', padding: 16 }}>
              No editors added yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {editors.map(email => (
                <div key={email} className="modal-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--tx-1)' }}>{email}</span>
                    <span className="badge badge-green">Editor</span>
                  </div>
                  <button className="btn-icon btn-danger" onClick={() => removeEditor(email)} style={{ width: 28, height: 28 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Legend */}
          <div style={{ marginTop: 20, padding: 14, borderRadius: 'var(--r-md)', background: 'var(--bg-1)', border: '1px solid var(--br-1)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx-3)', marginBottom: 8 }}>Permission Levels</div>
            <div style={{ fontSize: 12, color: 'var(--tx-4)', lineHeight: 1.8 }}>
              <div><span className="badge badge-amber" style={{ marginRight: 6 }}>Owner</span> Full control</div>
              <div><span className="badge badge-green" style={{ marginRight: 6 }}>Editor</span> Can draw and edit</div>
              <div><span className="badge badge-blue" style={{ marginRight: 6 }}>Public</span> View-only with link</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
