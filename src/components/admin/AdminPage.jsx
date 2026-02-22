// src/components/admin/AdminPage.jsx
// v1.4:
// • All destructive actions now use a 2-step confirm modal (no more browser confirm())
// • handleDeleteBoard: cascades to delete elements + cursors subcollections
// • handleBulkDelete: cascades deletion for all selected boards
// • New handleDeleteAllBoards: deletes EVERY board in the database with cascade
// • Admin confirm modal is a shared component rendered at the page level

import { useState, useEffect, useCallback } from 'react';
import {
  collection, getDocs, updateDoc,
  doc, writeBatch,
} from 'firebase/firestore';
import { db }                           from '../../firebase/config.js';
import { deleteBoard, deleteSubcollection } from '../../firebase/boardService.js';
import { isAdminEmail }                 from '../../constants/admin.js';
import AdminHeader                      from './AdminHeader.jsx';
import AdminOverviewTab                 from './AdminOverviewTab.jsx';
import AdminBoardsTab                   from './AdminBoardsTab.jsx';
import AdminUsersTab                    from './AdminUsersTab.jsx';
import BoardDetailsModal                from './BoardDetailsModal.jsx';

// ── Reusable 2-step confirm modal ──────────────────────────────────────────
function ConfirmModal({ title, message, confirmLabel = 'Confirm', danger = true, onConfirm, onCancel, typeToConfirm }) {
  const [typed, setTyped] = useState('');
  const needsType = !!typeToConfirm;
  const canConfirm = !needsType || typed === typeToConfirm;

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
          <p style={{ marginBottom: 16, color: 'var(--tx-2)', fontSize: 14, lineHeight: 1.6 }}>
            {message}
          </p>
          {needsType && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--tx-4)', marginBottom: 6 }}>
                Type <strong style={{ color: 'var(--tx-2)', fontFamily: 'monospace' }}>{typeToConfirm}</strong> to confirm:
              </div>
              <input
                className="input"
                type="text"
                value={typed}
                onChange={e => setTyped(e.target.value)}
                placeholder={typeToConfirm}
                autoFocus
                style={{ width: '100%' }}
              />
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
            <button
              className={danger ? 'btn btn-danger' : 'btn btn-primary'}
              onClick={onConfirm}
              disabled={!canConfirm}
              style={{ opacity: canConfirm ? 1 : 0.4 }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage({ user, onBack }) {
  const [activeTab,     setActiveTab]     = useState('overview');
  const [boards,        setBoards]        = useState([]);
  const [users,         setUsers]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [selectedBoard, setSelectedBoard] = useState(null);

  // Confirm modal state
  const [confirm, setConfirm] = useState(null);
  // confirm shape: { title, message, confirmLabel, danger, typeToConfirm, onConfirm }

  const [stats, setStats] = useState({
    totalBoards: 0, publicBoards: 0, privateBoards: 0,
    totalUsers: 0, boardsThisWeek: 0, activeToday: 0,
  });

  const isAdmin = isAdminEmail(user?.email);

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin]);

  async function loadData() {
    setLoading(true);
    try {
      const boardsSnap = await getDocs(collection(db, 'boards'));
      const boardsList = boardsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setBoards(boardsList);

      const now        = Date.now();
      const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
      const oneDayAgo  = now - 24 * 60 * 60 * 1000;

      const usersMap = new Map();
      boardsList.forEach(board => {
        if (!board.ownerId) return;
        if (!usersMap.has(board.ownerId)) {
          usersMap.set(board.ownerId, {
            uid:        board.ownerId,
            email:      board.ownerEmail,
            name:       board.ownerName || board.ownerEmail,
            boardCount: 0,
            lastActive: board.updatedAt?.toMillis?.() || 0,
          });
        }
        const u = usersMap.get(board.ownerId);
        u.boardCount++;
        const boardTime = board.updatedAt?.toMillis?.() || 0;
        if (boardTime > u.lastActive) u.lastActive = boardTime;
      });

      const usersArray = Array.from(usersMap.values());
      setUsers(usersArray);

      setStats({
        totalBoards:    boardsList.length,
        publicBoards:   boardsList.filter(b => b.visibility === 'public').length,
        privateBoards:  boardsList.filter(b => b.visibility === 'private').length,
        totalUsers:     usersMap.size,
        boardsThisWeek: boardsList.filter(b => (b.createdAt?.toMillis?.() || 0) > oneWeekAgo).length,
        activeToday:    usersArray.filter(u => u.lastActive > oneDayAgo).length,
      });
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
    setLoading(false);
  }

  function askConfirm(opts) {
    setConfirm(opts);
  }

  function closeConfirm() {
    setConfirm(null);
  }

  // ── Board operations — all gated behind 2-step confirm ─────────────────

  function handleDeleteBoard(boardId) {
    const board = boards.find(b => b.id === boardId);
    askConfirm({
      title: 'Delete Board',
      message: `Permanently delete "${board?.name || boardId}"? This will also delete all elements and cursors. This cannot be undone.`,
      confirmLabel: 'Delete Board',
      danger: true,
      onConfirm: async () => {
        closeConfirm();
        try {
          // Full cascade delete (elements + cursors + board doc)
          await deleteBoard(boardId);
          setBoards(prev => prev.filter(b => b.id !== boardId));
          setStats(prev => ({
            ...prev,
            totalBoards:   prev.totalBoards - 1,
            publicBoards:  prev.publicBoards  - (board?.visibility === 'public'  ? 1 : 0),
            privateBoards: prev.privateBoards - (board?.visibility === 'private' ? 1 : 0),
          }));
        } catch (err) {
          console.error('Delete failed:', err);
          alert('Failed to delete board. Check console.');
        }
      },
    });
  }

  function handleToggleVisibility(boardId, currentVis) {
    const newVis = currentVis === 'public' ? 'private' : 'public';
    const board  = boards.find(b => b.id === boardId);
    askConfirm({
      title: `Make Board ${newVis === 'public' ? 'Public' : 'Private'}`,
      message: `Change "${board?.name || boardId}" to ${newVis}? ${newVis === 'public' ? 'Anyone with the link will be able to view it.' : 'Only the owner and editors will be able to access it.'}`,
      confirmLabel: `Make ${newVis}`,
      danger: false,
      onConfirm: async () => {
        closeConfirm();
        try {
          await updateDoc(doc(db, 'boards', boardId), { visibility: newVis });
          setBoards(prev => prev.map(b => b.id === boardId ? { ...b, visibility: newVis } : b));
        } catch {
          alert('Failed to update visibility');
        }
      },
    });
  }

  function handleBulkDelete(ids, onDone) {
    askConfirm({
      title: `Delete ${ids.length} Boards`,
      message: `Permanently delete ${ids.length} boards including all their elements and cursors? This cannot be undone.`,
      confirmLabel: `Delete ${ids.length} Boards`,
      danger: true,
      typeToConfirm: 'DELETE',
      onConfirm: async () => {
        closeConfirm();
        try {
          // Cascade delete each board (sequential to avoid overwhelming Firestore)
          for (const id of ids) {
            await deleteBoard(id);
          }
          setBoards(prev => prev.filter(b => !ids.includes(b.id)));
          setStats(prev => ({ ...prev, totalBoards: prev.totalBoards - ids.length }));
          onDone?.();
        } catch (err) {
          console.error('Bulk delete failed:', err);
          alert('Failed to delete some boards. Check console.');
        }
      },
    });
  }

  function handleBulkToggleVisibility(ids, newVis, onDone) {
    askConfirm({
      title: `Make ${ids.length} Boards ${newVis}`,
      message: `Change ${ids.length} selected boards to ${newVis}?`,
      confirmLabel: `Make ${newVis}`,
      danger: false,
      onConfirm: async () => {
        closeConfirm();
        try {
          const batch = writeBatch(db);
          ids.forEach(id => batch.update(doc(db, 'boards', id), { visibility: newVis }));
          await batch.commit();
          setBoards(prev => prev.map(b => ids.includes(b.id) ? { ...b, visibility: newVis } : b));
          onDone?.();
        } catch {
          alert('Failed to update boards');
        }
      },
    });
  }

  // ── DELETE ALL BOARDS — nuclear option ────────────────────────────────────
  function handleDeleteAllBoards() {
    askConfirm({
      title: '⚠️ Delete ALL Boards',
      message: `This will permanently delete ALL ${boards.length} boards from the entire database, including every element and cursor. This is irreversible. Type DELETE ALL to confirm.`,
      confirmLabel: `Delete All ${boards.length} Boards`,
      danger: true,
      typeToConfirm: 'DELETE ALL',
      onConfirm: async () => {
        closeConfirm();
        setLoading(true);
        try {
          for (const board of boards) {
            await deleteBoard(board.id);
          }
          setBoards([]);
          setStats(prev => ({
            ...prev,
            totalBoards: 0, publicBoards: 0, privateBoards: 0,
          }));
        } catch (err) {
          console.error('Delete all failed:', err);
          alert('Failed to delete all boards. Some may remain. Check console.');
        }
        setLoading(false);
      },
    });
  }

  /* ── Formatting helpers ────────────────────────────────────────────────── */
  function formatDate(ts) {
    if (!ts) return 'Never';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  function formatRelativeTime(ts) {
    if (!ts) return 'Never';
    const time = ts?.toMillis?.() || new Date(ts).getTime();
    const diff  = Date.now() - time;
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins  <  1) return 'Just now';
    if (mins  < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days  <  7) return `${days}d ago`;
    return formatDate(ts);
  }

  if (!isAdmin) {
    return (
      <div className="error-page">
        <div className="glass-card error-card">
          <div className="error-icon" style={{ background: 'rgba(239,68,68,0.1)' }}>🔒</div>
          <div className="error-title">Access Denied</div>
          <div className="error-text">You do not have admin privileges.</div>
          <button className="btn btn-primary" onClick={onBack}>Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <AdminHeader user={user} onBack={onBack} onRefresh={loadData} />

      {/* Tabs */}
      <div className="admin-tabs-container">
        <div className="admin-tabs">
          {[
            { id: 'overview', label: 'Overview', icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/>
                <rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>
              </svg>
            )},
            { id: 'boards', label: 'Boards', badge: stats.totalBoards, icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
              </svg>
            )},
            { id: 'users', label: 'Users', badge: stats.totalUsers, icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
              </svg>
            )},
          ].map(tab => (
            <button
              key={tab.id}
              className={'admin-tab' + (activeTab === tab.id ? ' active' : '')}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              {tab.label}
              {tab.badge !== undefined && (
                <span className="tab-badge">{tab.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="admin-content">
        {loading ? (
          <div className="admin-loading">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
              stroke="var(--a)" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
              <path d="M21 12a9 9 0 11-6.219-8.56"/>
            </svg>
            <span>Loading administrative data...</span>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <AdminOverviewTab
                stats={stats}
                boards={boards}
                onGoBoards={() => setActiveTab('boards')}
                onGoUsers={() => setActiveTab('users')}
                onRefresh={loadData}
                formatRelativeTime={formatRelativeTime}
              />
            )}

            {activeTab === 'boards' && (
              <AdminBoardsTab
                boards={boards}
                onDeleteBoard={handleDeleteBoard}
                onToggleVisibility={handleToggleVisibility}
                onBulkDelete={handleBulkDelete}
                onBulkToggleVisibility={handleBulkToggleVisibility}
                onDeleteAllBoards={handleDeleteAllBoards}
                onViewBoard={setSelectedBoard}
                formatRelativeTime={formatRelativeTime}
              />
            )}

            {activeTab === 'users' && (
              <AdminUsersTab
                users={users}
                formatRelativeTime={formatRelativeTime}
                formatDate={formatDate}
              />
            )}
          </>
        )}
      </div>

      {/* Board details modal */}
      {selectedBoard && (
        <BoardDetailsModal
          board={selectedBoard}
          onClose={() => setSelectedBoard(null)}
          onDelete={(id) => {
            handleDeleteBoard(id);
            setSelectedBoard(null);
          }}
          onToggleVisibility={(id, vis) => {
            handleToggleVisibility(id, vis);
          }}
          formatDate={formatDate}
        />
      )}

      {/* Global 2-step confirm modal */}
      {confirm && (
        <ConfirmModal
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          danger={confirm.danger}
          typeToConfirm={confirm.typeToConfirm}
          onConfirm={confirm.onConfirm}
          onCancel={closeConfirm}
        />
      )}
    </div>
  );
}