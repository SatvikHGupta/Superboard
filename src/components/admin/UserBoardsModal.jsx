// sorry no incoginto for admins

import { useState, useEffect } from 'react';
import { getBoardsByUserId, updateBoard, deleteBoard } from '../../firebase/boardService.js';

export default function UserBoardsModal({ user, onClose, formatDate, formatRelativeTime }) {
  const [boards,   setBoards]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    setLoading(true);
    getBoardsByUserId(user.uid)
      .then(setBoards)
      .catch(err => { console.error('Failed to load user boards:', err); setBoards([]); })
      .finally(() => setLoading(false));
  }, [user?.uid]);

  async function handleToggleVisibility(boardId, currentVis) {
    const newVis = currentVis === 'public' ? 'private' : 'public';
    setSaving(true);
    try {
      await updateBoard(boardId, { visibility: newVis });
      setBoards(prev => prev.map(b => b.id === boardId ? { ...b, visibility: newVis } : b));
    } catch { alert('Failed to update visibility.'); }
    setSaving(false);
  }

  async function handleDelete(boardId) {
    setSaving(true);
    try {
      await deleteBoard(boardId);
      setBoards(prev => prev.filter(b => b.id !== boardId));
      setDeleteId(null);
    } catch { alert('Failed to delete board.'); }
    setSaving(false);
  }

  const editorBoards = user.editorBoards || [];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content modal-lg"
        style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="admin-user-avatar" style={{ width: 32, height: 32, fontSize: 14 }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              {user.name}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--tx-4)', marginTop: 4 }}>
              {user.email}
              {!loading && (
                <> · {boards.length} owned · {editorBoards.length} editing</>
              )}
            </p>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body scrollable */}
        <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>

          {/* Owned boards */}
          <SectionLabel>Boards Owned</SectionLabel>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 40 }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                stroke="var(--a)" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
              <span style={{ color: 'var(--tx-3)', fontSize: 14 }}>Loading boards…</span>
            </div>
          ) : boards.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--tx-4)', padding: '8px 0 20px' }}>
              This user owns no boards.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
              {boards.map(board => (
                <OwnedBoardRow
                  key={board.id}
                  board={board}
                  formatDate={formatDate}
                  formatRelativeTime={formatRelativeTime}
                  saving={saving}
                  onToggleVisibility={handleToggleVisibility}
                  onDelete={() => setDeleteId(board.id)}
                />
              ))}
            </div>
          )}

          {/* Editor boards */}
          {!loading && editorBoards.length > 0 && (
            <>
              <SectionLabel style={{ borderTop: '1px solid var(--br-1)', paddingTop: 20 }}>
                Editor On
              </SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {editorBoards.map(b => (
                  <EditorBoardRow key={b.id} board={b} />
                ))}
              </div>
            </>
          )}

          {/* Empty state — no boards at all */}
          {!loading && boards.length === 0 && editorBoards.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--tx-4)' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1" style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }}>
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M12 8v8M8 12h8"/>
              </svg>
              This user has no boards.
            </div>
          )}
        </div>
      </div>

      {/* ── Delete confirmation ── */}
      {deleteId && (
        <div className="modal-backdrop" style={{ zIndex: 1001 }} onClick={() => setDeleteId(null)}>
          <div className="modal-content modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Deletion</h2>
              <button className="btn-icon" onClick={() => setDeleteId(null)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 20, color: 'var(--tx-2)' }}>
                Permanently delete <strong>{boards.find(b => b.id === deleteId)?.name || 'this board'}</strong>?
                This cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={() => handleDelete(deleteId)} disabled={saving}>
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Small helpers 
function SectionLabel({ children, style }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
      color: 'var(--tx-4)', textTransform: 'uppercase',
      marginBottom: 10, ...style,
    }}>
      {children}
    </div>
  );
}

function OwnedBoardRow({ board, formatDate, formatRelativeTime, saving, onToggleVisibility, onDelete }) {
  return (
    <div style={{
      display: 'flex', gap: 14, alignItems: 'center',
      padding: 14, borderRadius: 'var(--r-md)',
      border: '1px solid var(--br-1)', background: 'var(--bg-1)',
    }}>
      {/* Thumbnail */}
      <div style={{
        width: 80, height: 52, flexShrink: 0,
        borderRadius: 6, overflow: 'hidden', background: 'var(--bg-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {board.thumbnail ? (
          <img src={board.thumbnail} alt={board.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.4 }}>
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M3 15l4-4a2 2 0 012.8 0L15 16"/>
          </svg>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--tx-1)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {board.name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--tx-4)', marginTop: 3, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <span>Created: {formatDate(board.createdAt)}</span>
          <span>Updated: {formatRelativeTime(board.updatedAt)}</span>
          {board.editors?.length > 0 && <span>Editors: {board.editors.length}</span>}
        </div>
      </div>

      {/* Visibility badge */}
      <span className={'badge badge-' + (board.visibility === 'public' ? 'green' : 'amber')}
        style={{ flexShrink: 0 }}>
        {board.visibility}
      </span>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <a href={`#/view/${board.id}`} target="_blank" rel="noopener noreferrer"
          className="btn btn-ghost"
          style={{ padding: '5px 10px', fontSize: 12, textDecoration: 'none' }}>
          View
        </a>
        <button className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: 12 }}
          onClick={() => onToggleVisibility(board.id, board.visibility)} disabled={saving}>
          {board.visibility === 'public' ? 'Make Private' : 'Make Public'}
        </button>
        <button className="btn btn-danger" style={{ padding: '5px 10px', fontSize: 12 }}
          onClick={onDelete} disabled={saving}>
          Delete
        </button>
      </div>
    </div>
  );
}

function EditorBoardRow({ board }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 14px', borderRadius: 'var(--r-md)',
      border: '1px solid rgba(59,130,246,0.2)',
      background: 'rgba(59,130,246,0.04)',
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="#3b82f6" strokeWidth="2" style={{ flexShrink: 0 }}>
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
      <span style={{
        flex: 1, fontSize: 14, color: 'var(--tx-1)', fontWeight: 500,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {board.name}
      </span>
      <span className="badge badge-blue" style={{ flexShrink: 0 }}>Editor</span>
      <a href={`#/view/${board.id}`} target="_blank" rel="noopener noreferrer"
        className="btn btn-ghost"
        style={{ padding: '4px 10px', fontSize: 12, textDecoration: 'none', flexShrink: 0 }}>
        View
      </a>
    </div>
  );
}