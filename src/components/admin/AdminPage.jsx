// src/components/admin/AdminPage.jsx
//
// Refactored: thin orchestrator — data loading + state only.
// UI decomposed into: AdminHeader, AdminOverviewTab, AdminBoardsTab,
// AdminUsersTab (+ UserBoardsModal), BoardDetailsModal.

import { useState, useEffect }          from 'react';
import { collection, getDocs, updateDoc,
         deleteDoc, doc, writeBatch }   from 'firebase/firestore';
import { db }                           from '../../firebase/config.js';
import { isAdminEmail }                 from '../../constants/admin.js';
import AdminHeader                      from './AdminHeader.jsx';
import AdminOverviewTab                 from './AdminOverviewTab.jsx';
import AdminBoardsTab                   from './AdminBoardsTab.jsx';
import AdminUsersTab                    from './AdminUsersTab.jsx';
import BoardDetailsModal                from './BoardDetailsModal.jsx';

export default function AdminPage({ user, onBack }) {
  const [activeTab,    setActiveTab]    = useState('overview');
  const [boards,       setBoards]       = useState([]);
  const [users,        setUsers]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [selectedBoard, setSelectedBoard] = useState(null);

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

      // Build users map from board ownership
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
      alert('Failed to load data. Check console for details.');
    }
    setLoading(false);
  }

  /* ── Board operations ──────────────────────────────────────────────── */
  async function handleDeleteBoard(boardId) {
    try {
      await deleteDoc(doc(db, 'boards', boardId));
      setBoards(prev => prev.filter(b => b.id !== boardId));
      setStats(prev => ({
        ...prev,
        totalBoards:  prev.totalBoards - 1,
        publicBoards: prev.publicBoards  - (boards.find(b => b.id === boardId)?.visibility === 'public' ? 1 : 0),
        privateBoards:prev.privateBoards - (boards.find(b => b.id === boardId)?.visibility === 'private' ? 1 : 0),
      }));
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete board');
    }
  }

  async function handleToggleVisibility(boardId, currentVis) {
    const newVis = currentVis === 'public' ? 'private' : 'public';
    try {
      await updateDoc(doc(db, 'boards', boardId), { visibility: newVis });
      setBoards(prev => prev.map(b => b.id === boardId ? { ...b, visibility: newVis } : b));
    } catch {
      alert('Failed to update visibility');
    }
  }

  async function handleBulkDelete(ids, onDone) {
    if (!confirm(`Delete ${ids.length} boards permanently? This cannot be undone.`)) return;
    try {
      const batch = writeBatch(db);
      ids.forEach(id => batch.delete(doc(db, 'boards', id)));
      await batch.commit();
      setBoards(prev => prev.filter(b => !ids.includes(b.id)));
      setStats(prev => ({ ...prev, totalBoards: prev.totalBoards - ids.length }));
      onDone?.();
    } catch {
      alert('Failed to delete boards');
    }
  }

  async function handleBulkToggleVisibility(ids, newVis, onDone) {
    try {
      const batch = writeBatch(db);
      ids.forEach(id => batch.update(doc(db, 'boards', id), { visibility: newVis }));
      await batch.commit();
      setBoards(prev => prev.map(b => ids.includes(b.id) ? { ...b, visibility: newVis } : b));
      onDone?.();
    } catch {
      alert('Failed to update boards');
    }
  }

  /* ── Formatting helpers ────────────────────────────────────────────── */
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
    const diff = Date.now() - time;
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins  <  1) return 'Just now';
    if (mins  < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days  <  7) return `${days}d ago`;
    return formatDate(ts);
  }

  /* ── Access denied ─────────────────────────────────────────────────── */
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
            setSelectedBoard(prev => prev ? { ...prev, visibility: vis === 'public' ? 'private' : 'public' } : null);
          }}
          formatDate={formatDate}
        />
      )}
    </div>
  );
}