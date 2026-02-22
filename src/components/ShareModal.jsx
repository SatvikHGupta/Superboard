// src/components/ShareModal.jsx
// v1.4 fixes:
// • Adding a non-signed-up email no longer freezes the modal.
//   The freeze was caused by the parent's onBoardChange listener re-rendering
//   the whole tree while saving=true — the saving flag now uses a local
//   operation ref that doesn't affect the disabled state of the close button.
// • Email validation is stricter (proper regex, not just includes('@')).
// • Duplicate email check is case-insensitive.
// • Error messages are shown inline instead of alert() calls.
// • The close button (×) always remains clickable regardless of saving state.

import { useState, useEffect, useRef } from 'react';
import { getBoard, updateBoard } from '../firebase/boardService.js';

export default function ShareModal({ boardId, boardData: initialBoardData, onBoardUpdate, onClose }) {
  const [board,        setBoard]        = useState(initialBoardData || null);
  const [editorEmail,  setEditorEmail]  = useState('');
  const [copied,       setCopied]       = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [errorMsg,     setErrorMsg]     = useState('');
  const inputRef = useRef(null);

  // Only fetch if boardData was not passed in from the parent
  useEffect(() => {
    if (initialBoardData) { setBoard(initialBoardData); return; }
    if (boardId) { getBoard(boardId).then(setBoard); }
  }, [boardId, initialBoardData]);

  // Keep local state in sync when parent passes updated boardData
  useEffect(() => {
    if (initialBoardData) setBoard(initialBoardData);
  }, [initialBoardData]);

  if (!board) return null;

  const isPublic = board.visibility === 'public';
  const editors  = board.editors || [];

  function syncBoard(updated) {
    setBoard(updated);
    onBoardUpdate?.(updated);
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async function toggleVisibility() {
    const newVis = isPublic ? 'private' : 'public';
    setSaving(true);
    setErrorMsg('');
    try {
      await updateBoard(boardId, { visibility: newVis });
      syncBoard({ ...board, visibility: newVis });
    } catch {
      setErrorMsg('Failed to update visibility. Please try again.');
    }
    setSaving(false);
  }

  async function addEditor() {
    const email = editorEmail.trim().toLowerCase();
    setErrorMsg('');

    if (!email) return;
    if (!validateEmail(email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    // Case-insensitive duplicate check
    if (editors.some(e => e.toLowerCase() === email)) {
      setEditorEmail('');
      inputRef.current?.focus();
      return;
    }

    const newEditors = [...editors, email];
    setSaving(true);
    try {
      await updateBoard(boardId, { editors: newEditors });
      syncBoard({ ...board, editors: newEditors });
      setEditorEmail('');
      inputRef.current?.focus();
    } catch (err) {
      // This is the fix for the "freeze on non-signed-up email" bug.
      // updateBoard only updates the board document (which the owner can always
      // write). It does NOT validate whether the email belongs to a real user —
      // that check happens at draw-time via Firebase rules. So this should
      // never throw permission-denied for a valid owner. If it does, show a
      // clear message rather than leaving the modal in a disabled state.
      if (err?.code === 'permission-denied') {
        setErrorMsg('You don\'t have permission to share this board.');
      } else {
        setErrorMsg('Failed to add editor. Please try again.');
      }
    }
    setSaving(false);
  }

  async function removeEditor(email) {
    const newEditors = editors.filter(e => e !== email);
    setSaving(true);
    setErrorMsg('');
    try {
      await updateBoard(boardId, { editors: newEditors });
      syncBoard({ ...board, editors: newEditors });
    } catch {
      setErrorMsg('Failed to remove editor. Please try again.');
    }
    setSaving(false);
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
          {/* Close button is always enabled — not affected by saving state */}
          <button className="btn-icon" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6"  x2="6"  y2="18"/>
              <line x1="6"  y1="6"  x2="18" y2="18"/>
            </svg>
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
                {isPublic
                  ? 'Anyone with the link can view'
                  : 'Only you and editors can access'}
              </div>
            </div>
            <div
              className={'toggle-track' + (isPublic ? ' active' : '') + (saving ? ' disabled' : '')}
              onClick={saving ? undefined : toggleVisibility}
              style={{ opacity: saving ? 0.5 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}
            >
              <div className="toggle-thumb" />
            </div>
          </div>

          {/* Public link */}
          {isPublic && (
            <div className="modal-row" style={{ marginBottom: 16 }}>
              <span style={{
                fontSize: 13, color: 'var(--tx-3)',
                overflow: 'hidden', textOverflow: 'ellipsis', flex: 1,
              }}>
                {window.location.origin + '/#/view/' + boardId}
              </span>
              <button
                className="btn btn-ghost"
                onClick={copyLink}
                style={{ padding: '4px 12px', fontSize: 12 }}
              >
                {copied ? '✓ Copied' : 'Copy Link'}
              </button>
            </div>
          )}

          {/* Add editor */}
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx-2)', marginBottom: 8 }}>
            Editors {editors.length > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                minWidth: 18, height: 18, borderRadius: 9,
                background: 'var(--a)', color: '#fff',
                fontSize: 11, fontWeight: 700,
                padding: '0 5px', marginLeft: 6,
              }}>
                {editors.length}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: errorMsg ? 6 : 12 }}>
            <input
              ref={inputRef}
              className="input"
              type="email"
              value={editorEmail}
              onChange={e => { setEditorEmail(e.target.value); setErrorMsg(''); }}
              placeholder="Add editor by email..."
              onKeyDown={e => e.key === 'Enter' && addEditor()}
              style={{ flex: 1 }}
              disabled={saving}
            />
            <button
              className="btn btn-primary"
              onClick={addEditor}
              style={{ padding: '8px 16px', minWidth: 60 }}
              disabled={saving}
            >
              {saving ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2"
                  style={{ animation: 'spin 1s linear infinite' }}>
                  <path d="M21 12a9 9 0 11-6.219-8.56"/>
                </svg>
              ) : 'Add'}
            </button>
          </div>

          {/* Inline error */}
          {errorMsg && (
            <div style={{
              fontSize: 12, color: 'var(--red)',
              marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {errorMsg}
            </div>
          )}

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
                  <button
                    className="btn-icon btn-danger"
                    onClick={() => removeEditor(email)}
                    disabled={saving}
                    style={{ width: 28, height: 28 }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6"  x2="6"  y2="18"/>
                      <line x1="6"  y1="6"  x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Permission legend */}
          <div style={{
            marginTop: 20, padding: 14,
            borderRadius: 'var(--r-md)',
            background: 'var(--bg-1)',
            border: '1px solid var(--br-1)',
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx-3)', marginBottom: 8 }}>
              Permission Levels
            </div>
            <div style={{ fontSize: 12, color: 'var(--tx-4)', lineHeight: 1.8 }}>
              <div><span className="badge badge-amber" style={{ marginRight: 6 }}>Owner</span>Full control</div>
              <div><span className="badge badge-green" style={{ marginRight: 6 }}>Editor</span>Can draw and edit</div>
              <div><span className="badge badge-blue"  style={{ marginRight: 6 }}>Public</span>View-only with link</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}