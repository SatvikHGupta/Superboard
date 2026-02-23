import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs }              from 'firebase/firestore';
import { db }                               from '../../firebase/config.js';
import { getBannedUsers }                   from '../../firebase/banService.js';
import { writeAuditLog }                    from '../../firebase/auditService.js';
import { isAdminEmail }                     from '../../constants/admin.js';
import { useAdminActions }                  from '../../hooks/useAdminActions.js';
import { ConfirmModal, BanModal }           from './AdminModals.jsx';
import AdminHeader                          from './AdminHeader.jsx';
import AdminOverviewTab                     from './AdminOverviewTab.jsx';
import AdminBoardsTab                       from './AdminBoardsTab.jsx';
import AdminUsersTab                        from './AdminUsersTab.jsx';
import AdminAnalyticsTab                    from './AdminAnalyticsTab.jsx';
import AdminRecycleBinTab                   from './AdminRecycleBinTab.jsx';
import BoardDetailsModal                    from './BoardDetailsModal.jsx';

function formatDate(ts) {
  if (!ts) return 'Never';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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

export default function AdminPage({ user, onBack }) {
  const [activeTab,     setActiveTab]     = useState('overview');
  const [boards,        setBoards]        = useState([]);
  const [users,         setUsers]         = useState([]);
  const [bannedUsers,   setBannedUsers]   = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [confirm,       setConfirm]       = useState(null);
  const [banTarget,     setBanTarget]     = useState(null);
  const [stats, setStats] = useState({
    totalBoards: 0, publicBoards: 0, privateBoards: 0,
    totalUsers: 0, boardsThisWeek: 0, activeToday: 0,
  });

  const isAdmin = isAdminEmail(user?.email);

  function askConfirm(opts) { setConfirm(opts); }
  function closeConfirm()   { setConfirm(null); }

  const actions = useAdminActions({
    boards, setBoards, setStats, setBannedUsers,
    askConfirm, closeConfirm, adminEmail: user?.email,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Load boards and banned-users independently so a permissions failure
      // on banned_users (rules not yet deployed) never blocks boards from loading.
      const boardsSnap = await getDocs(collection(db, 'boards'));
      const boardsList = boardsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setBoards(boardsList);

      getBannedUsers()
        .then(banned => setBannedUsers(banned))
        .catch(() => {}); // silently ignore if rules not yet updated

      writeAuditLog('ADMIN_DATA_LOADED', { actorEmail: user.email }).catch(() => {});

      const now        = Date.now();
      const oneWeekAgo = now - 7 * 86400000;
      const oneDayAgo  = now - 86400000;
      const usersMap   = new Map();

      boardsList.forEach(board => {
        if (!board.ownerId) return;
        if (!usersMap.has(board.ownerId)) {
          usersMap.set(board.ownerId, {
            uid: board.ownerId, email: board.ownerEmail,
            name: board.ownerName || board.ownerEmail,
            boardCount: 0, lastActive: board.updatedAt?.toMillis?.() || 0,
          });
        }
        const u = usersMap.get(board.ownerId);
        u.boardCount++;
        const t = board.updatedAt?.toMillis?.() || 0;
        if (t > u.lastActive) u.lastActive = t;
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
    } catch (err) { console.error('Failed to load admin data:', err); }
    setLoading(false);
  }, [user.email]);

  useEffect(() => {
    if (!isAdmin) return;
    function onKey(e) {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.key === 'r' || e.key === 'R') { e.preventDefault(); loadData(); }
      if (e.key === '/') { e.preventDefault(); document.querySelector('.search-box input')?.focus(); }
      if (e.key === 'Escape') { setSelectedBoard(null); setConfirm(null); setBanTarget(null); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isAdmin, loadData]);

  useEffect(() => { if (isAdmin) loadData(); }, [isAdmin, loadData]);

  if (!isAdmin) return (
    <div className="error-page">
      <div className="glass-card error-card">
        <div className="error-icon" style={{ background: 'rgba(239,68,68,0.1)' }}>🔒</div>
        <div className="error-title">Access Denied</div>
        <div className="error-text">You do not have admin privileges.</div>
        <button className="btn btn-primary" onClick={onBack}>Go Back</button>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview',  label: 'Overview',    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg> },
    { id: 'boards',    label: 'Boards',      badge: stats.totalBoards, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg> },
    { id: 'users',     label: 'Users',       badge: stats.totalUsers,  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> },
    { id: 'analytics', label: 'Analytics',   icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
    { id: 'recycle',   label: 'Recycle Bin', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg> },
  ];

  const kbdStyle = { background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 3, padding: '1px 5px', fontFamily: 'monospace', fontSize: 10 };

  return (
    <div className="admin-page">
      <AdminHeader user={user} onBack={onBack} onRefresh={loadData} />

      <div className="admin-tabs-container">
        <div className="admin-tabs">
          {tabs.map(tab => (
            <button key={tab.id} className={'admin-tab' + (activeTab === tab.id ? ' active' : '')}
              onClick={() => setActiveTab(tab.id)}>
              {tab.icon}{tab.label}
              {tab.badge !== undefined && <span className="tab-badge">{tab.badge}</span>}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 11, color: 'var(--tx-4)', padding: '0 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span><kbd style={kbdStyle}>R</kbd> Refresh</span>
          <span><kbd style={kbdStyle}>/</kbd> Search</span>
          <span><kbd style={kbdStyle}>Esc</kbd> Close</span>
        </div>
      </div>

      <div className="admin-content">
        {loading ? (
          <div className="admin-loading">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--a)" strokeWidth="2"
              style={{ animation: 'spin 1s linear infinite' }}>
              <path d="M21 12a9 9 0 11-6.219-8.56"/>
            </svg>
            <span>Loading administrative data…</span>
          </div>
        ) : (
          <>
            {activeTab === 'overview'  && <AdminOverviewTab stats={stats} boards={boards} onGoBoards={() => setActiveTab('boards')} onGoUsers={() => setActiveTab('users')} onRefresh={loadData} formatRelativeTime={formatRelativeTime} />}
            {activeTab === 'boards'    && <AdminBoardsTab boards={boards} onDeleteBoard={actions.handleDeleteBoard} onToggleVisibility={actions.handleToggleVisibility} onBulkDelete={actions.handleBulkDelete} onBulkToggleVisibility={actions.handleBulkToggleVisibility} onDeleteAllBoards={actions.handleDeleteAllBoards} onViewBoard={setSelectedBoard} formatRelativeTime={formatRelativeTime} />}
            {activeTab === 'users'     && <AdminUsersTab users={users} bannedUsers={bannedUsers} onBanUser={setBanTarget} onUnbanUser={actions.handleUnbanUser} formatRelativeTime={formatRelativeTime} formatDate={formatDate} />}
            {activeTab === 'analytics' && <AdminAnalyticsTab boards={boards} users={users} />}
            {activeTab === 'recycle'   && <AdminRecycleBinTab adminEmail={user.email} onBoardRestored={loadData} />}
          </>
        )}
      </div>

      {selectedBoard && <BoardDetailsModal board={selectedBoard} onClose={() => setSelectedBoard(null)} onDelete={(id) => { actions.handleDeleteBoard(id); setSelectedBoard(null); }} onToggleVisibility={(id, vis) => actions.handleToggleVisibility(id, vis)} formatDate={formatDate} />}
      {confirm   && <ConfirmModal {...confirm} onCancel={closeConfirm} />}
      {banTarget && <BanModal user={banTarget} onConfirm={(reason) => { actions.handleBanUser(banTarget, reason); setBanTarget(null); }} onCancel={() => setBanTarget(null)} />}
    </div>
  );
}