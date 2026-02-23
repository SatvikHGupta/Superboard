// src/components/admin/AdminRecycleBinTab.jsx
//
// Shows boards soft-deleted by admin. Each entry shows how long until
// permanent deletion (30-day TTL). Admin can restore or permanently purge.

import { useState, useEffect } from 'react';
import { getSoftDeletedBoards, restoreBoard, purgeSoftDeletedBoard } from '../../firebase/boardService.js';
import { writeAuditLog } from '../../firebase/auditService.js';

function daysUntilPurge(deletedAtTs) {
  if (!deletedAtTs) return 30;
  const deletedMs = deletedAtTs?.toMillis?.() || new Date(deletedAtTs).getTime();
  const elapsed   = (Date.now() - deletedMs) / 86400000;
  return Math.max(0, Math.ceil(30 - elapsed));
}

export default function AdminRecycleBinTab({ adminEmail, onBoardRestored }) {
  const [boards,   setBoards]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [working,  setWorking]  = useState(null); // boardId currently being processed
  const [confirm,  setConfirm]  = useState(null); // { type, board }

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try { setBoards(await getSoftDeletedBoards()); }
    catch (e) { console.error(e); }
    setLoading(false);
  }

  async function handleRestore(board) {
    setWorking(board.id);
    try {
      await restoreBoard(board.id);
      await writeAuditLog('BOARD_RESTORED', {
        actorEmail: adminEmail,
        boardId:    board.id,
        boardName:  board.name,
      });
      setBoards(prev => prev.filter(b => b.id !== board.id));
      onBoardRestored?.();
    } catch (err) {
      alert('Restore failed: ' + err.message);
    }
    setWorking(null);
    setConfirm(null);
  }

  async function handlePurge(board) {
    setWorking(board.id);
    try {
      await purgeSoftDeletedBoard(board.id);
      await writeAuditLog('BOARD_PURGED', {
        actorEmail: adminEmail,
        boardId:    board.id,
        boardName:  board.name,
      });
      setBoards(prev => prev.filter(b => b.id !== board.id));
    } catch (err) {
      alert('Purge failed: ' + err.message);
    }
    setWorking(null);
    setConfirm(null);
  }

  function fmtDate(ts) {
    if (!ts) return '—';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="admin-recycle">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--tx-1)', marginBottom: 4 }}>Recycle Bin</h2>
          <p style={{ fontSize: 13, color: 'var(--tx-4)' }}>
            Soft-deleted boards are kept for 30 days then must be manually purged. Subcollections (elements) are preserved until purge.
          </p>
        </div>
        <button className="btn btn-ghost" onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.13-9.36L23 10"/>
          </svg>
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="admin-loading">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--a)" strokeWidth="2"
            style={{ animation: 'spin 1s linear infinite' }}>
            <path d="M21 12a9 9 0 11-6.219-8.56"/>
          </svg>
          <span>Loading deleted boards…</span>
        </div>
      ) : boards.length === 0 ? (
        <div className="admin-empty-state">
          <div style={{ fontSize: 48, marginBottom: 12 }}>🗑️</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--tx-2)', marginBottom: 6 }}>Recycle bin is empty</div>
          <div style={{ fontSize: 13, color: 'var(--tx-4)' }}>Deleted boards will appear here for 30 days.</div>
        </div>
      ) : (
        <div className="recycle-list">
          {boards.map(board => {
            const daysLeft = daysUntilPurge(board.deletedAt);
            const urgent   = daysLeft <= 3;
            const isWorking = working === board.id;

            return (
              <div key={board.id} className="recycle-row">
                {/* Thumbnail */}
                <div className="recycle-thumb">
                  {board.thumbnail
                    ? <img src={board.thumbnail} alt={board.name} />
                    : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.4 }}>
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                      </svg>
                  }
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--tx-1)', marginBottom: 3 }}>
                    {board.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--tx-4)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span>Owner: {board.ownerEmail}</span>
                    <span>Deleted: {fmtDate(board.deletedAt)}</span>
                    {board.deletedBy && <span>By: {board.deletedBy}</span>}
                  </div>
                </div>

                {/* TTL indicator */}
                <div style={{ textAlign: 'center', minWidth: 80 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: urgent ? 'var(--red)' : 'var(--tx-2)', lineHeight: 1 }}>
                    {daysLeft}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--tx-4)' }}>days left</div>
                  {urgent && <div style={{ fontSize: 10, color: 'var(--red)', fontWeight: 600 }}>EXPIRING SOON</div>}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => setConfirm({ type: 'restore', board })}
                    disabled={isWorking}
                    style={{ fontSize: 12, padding: '5px 12px' }}
                  >
                    ↩ Restore
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => setConfirm({ type: 'purge', board })}
                    disabled={isWorking}
                    style={{ fontSize: 12, padding: '5px 12px' }}
                  >
                    Purge
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm modal */}
      {confirm && (
        <div className="modal-backdrop" onClick={() => setConfirm(null)}>
          <div className="modal-content modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ color: confirm.type === 'purge' ? 'var(--red)' : 'var(--tx-1)' }}>
                {confirm.type === 'purge' ? '⚠️ Permanently Purge' : 'Restore Board'}
              </h2>
              <button className="btn-icon" onClick={() => setConfirm(null)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--tx-2)', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
                {confirm.type === 'purge'
                  ? `Permanently delete "${confirm.board.name}" and ALL its elements? This cannot be undone.`
                  : `Restore "${confirm.board.name}" back to the active boards list?`}
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setConfirm(null)}>Cancel</button>
                <button
                  className={confirm.type === 'purge' ? 'btn btn-danger' : 'btn btn-primary'}
                  onClick={() => confirm.type === 'purge' ? handlePurge(confirm.board) : handleRestore(confirm.board)}
                >
                  {confirm.type === 'purge' ? 'Purge Permanently' : 'Restore'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}