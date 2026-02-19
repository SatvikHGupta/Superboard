import { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase/config.js';
import BoardDetailsModal from './BoardDetailsModal.jsx';

const ADMIN_EMAILS = ['shg090404@gmail.com', 'face69troll69@gmail.com'];

export default function AdminPage({ user, onBack }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [boards, setBoards] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVisibility, setFilterVisibility] = useState('all'); // all, public, private
  const [selectedBoards, setSelectedBoards] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  
  const [stats, setStats] = useState({
    totalBoards: 0,
    publicBoards: 0,
    privateBoards: 0,
    totalUsers: 0,
    boardsThisWeek: 0,
    activeToday: 0,
  });

  const isAdmin = user && ADMIN_EMAILS.includes(user.email);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  async function loadData() {
    setLoading(true);
    try {
      const boardsSnap = await getDocs(collection(db, 'boards'));
      const boardsList = boardsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setBoards(boardsList);

      // Calculate stats
      const now = Date.now();
      const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
      const oneDayAgo = now - 24 * 60 * 60 * 1000;

      const usersMap = new Map();
      boardsList.forEach(board => {
        if (board.ownerId && !usersMap.has(board.ownerId)) {
          usersMap.set(board.ownerId, {
            uid: board.ownerId,
            email: board.ownerEmail,
            name: board.ownerName || board.ownerEmail,
            boardCount: 0,
            lastActive: board.updatedAt?.toMillis?.() || 0,
          });
        }
        if (board.ownerId) {
          const u = usersMap.get(board.ownerId);
          u.boardCount++;
          const boardTime = board.updatedAt?.toMillis?.() || 0;
          if (boardTime > u.lastActive) u.lastActive = boardTime;
        }
      });
      
      const usersArray = Array.from(usersMap.values());
      setUsers(usersArray);

      setStats({
        totalBoards: boardsList.length,
        publicBoards: boardsList.filter(b => b.visibility === 'public').length,
        privateBoards: boardsList.filter(b => b.visibility === 'private').length,
        totalUsers: usersMap.size,
        boardsThisWeek: boardsList.filter(b => {
          const created = b.createdAt?.toMillis?.() || 0;
          return created > oneWeekAgo;
        }).length,
        activeToday: usersArray.filter(u => u.lastActive > oneDayAgo).length,
      });
    } catch (err) {
      console.error('Failed to load admin data:', err);
      alert('Failed to load data. Check console for details.');
    }
    setLoading(false);
  }

  async function deleteBoard(boardId) {
    try {
      await deleteDoc(doc(db, 'boards', boardId));
      setBoards(prev => prev.filter(b => b.id !== boardId));
      setStats(prev => ({ ...prev, totalBoards: prev.totalBoards - 1 }));
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete board');
    }
  }

  async function toggleVisibility(boardId, currentVis) {
    const newVis = currentVis === 'public' ? 'private' : 'public';
    try {
      await updateDoc(doc(db, 'boards', boardId), { visibility: newVis });
      setBoards(prev => prev.map(b => 
        b.id === boardId ? { ...b, visibility: newVis } : b
      ));
    } catch (err) {
      alert('Failed to update visibility');
    }
  }

  async function bulkDelete() {
    if (!confirm(`Delete ${selectedBoards.length} boards permanently? This cannot be undone.`)) return;
    
    try {
      const batch = writeBatch(db);
      selectedBoards.forEach(id => {
        batch.delete(doc(db, 'boards', id));
      });
      await batch.commit();
      
      setBoards(prev => prev.filter(b => !selectedBoards.includes(b.id)));
      setStats(prev => ({ ...prev, totalBoards: prev.totalBoards - selectedBoards.length }));
      setSelectedBoards([]);
      alert('Boards deleted successfully');
    } catch (err) {
      alert('Failed to delete boards');
    }
  }

  async function bulkToggleVisibility(newVis) {
    try {
      const batch = writeBatch(db);
      selectedBoards.forEach(id => {
        batch.update(doc(db, 'boards', id), { visibility: newVis });
      });
      await batch.commit();
      
      setBoards(prev => prev.map(b => 
        selectedBoards.includes(b.id) ? { ...b, visibility: newVis } : b
      ));
      setSelectedBoards([]);
      alert(`${selectedBoards.length} boards set to ${newVis}`);
    } catch (err) {
      alert('Failed to update boards');
    }
  }

  function formatDate(ts) {
    if (!ts) return 'Never';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function formatRelativeTime(ts) {
    if (!ts) return 'Never';
    const time = ts?.toMillis?.() || new Date(ts).getTime();
    const now = Date.now();
    const diff = now - time;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return formatDate(ts);
  }

  // Filter boards
  const filteredBoards = boards.filter(board => {
    const matchesSearch = board.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         board.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterVisibility === 'all' || board.visibility === filterVisibility;
    return matchesSearch && matchesFilter;
  });

  function toggleBoardSelection(id) {
    setSelectedBoards(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function selectAllFiltered() {
    setSelectedBoards(filteredBoards.map(b => b.id));
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
      {/* Enhanced Header */}
      <header className="admin-header glass-strong">
        <div className="admin-header-main">
          <button className="btn-icon" onClick={onBack} title="Back to Dashboard">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div className="admin-header-info">
            <h1 className="admin-title">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--a)" strokeWidth="2" style={{ marginRight: 8 }}>
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <polyline points="2 17 12 22 22 17"/>
                <polyline points="2 12 12 17 22 12"/>
              </svg>
              Admin Control Panel
            </h1>
            <p className="admin-subtitle">Superboard Management System</p>
          </div>
        </div>
        
        <div className="admin-header-actions">
          <div className="admin-user-badge">
            <div className="admin-user-avatar">
              {user.email.charAt(0).toUpperCase()}
            </div>
            <div className="admin-user-info">
              <span className="admin-user-name">{user.displayName || 'Admin'}</span>
              <span className="admin-user-email">{user.email}</span>
            </div>
          </div>
          <button className="btn btn-primary" onClick={loadData} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 11-2.13-9.36L23 10"/>
            </svg>
            Refresh Data
          </button>
        </div>
      </header>

      {/* Enhanced Tabs */}
      <div className="admin-tabs-container">
        <div className="admin-tabs">
          <button
            className={'admin-tab' + (activeTab === 'overview' ? ' active' : '')}
            onClick={() => setActiveTab('overview')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/>
              <rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>
            </svg>
            Overview
          </button>
          <button
            className={'admin-tab' + (activeTab === 'boards' ? ' active' : '')}
            onClick={() => setActiveTab('boards')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
            </svg>
            Boards
            <span className="tab-badge">{stats.totalBoards}</span>
          </button>
          <button
            className={'admin-tab' + (activeTab === 'users' ? ' active' : '')}
            onClick={() => setActiveTab('users')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
            </svg>
            Users
            <span className="tab-badge">{stats.totalUsers}</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="admin-content">
        {loading ? (
          <div className="admin-loading">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--a)" strokeWidth="2"
              style={{ animation: 'spin 1s linear infinite' }}>
              <path d="M21 12a9 9 0 11-6.219-8.56"/>
            </svg>
            <span>Loading administrative data...</span>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="admin-overview">
                {/* Enhanced Stats Grid */}
                <div className="stats-grid-enhanced">
                  <div className="stat-card-enhanced stat-primary">
                    <div className="stat-header">
                      <div className="stat-icon-large">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2"/>
                        </svg>
                      </div>
                      <span className="stat-trend">+{stats.boardsThisWeek} this week</span>
                    </div>
                    <div className="stat-value-large">{stats.totalBoards}</div>
                    <div className="stat-label-large">Total Boards</div>
                    <div className="stat-footer">
                      <span className="stat-detail">{stats.publicBoards} public</span>
                      <span className="stat-detail">{stats.privateBoards} private</span>
                    </div>
                  </div>

                  <div className="stat-card-enhanced stat-success">
                    <div className="stat-header">
                      <div className="stat-icon-large">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                          <circle cx="9" cy="7" r="4"/>
                        </svg>
                      </div>
                      <span className="stat-trend">{stats.activeToday} active today</span>
                    </div>
                    <div className="stat-value-large">{stats.totalUsers}</div>
                    <div className="stat-label-large">Total Users</div>
                    <div className="stat-progress">
                      <div 
                        className="stat-progress-bar" 
                        style={{ width: `${(stats.activeToday / stats.totalUsers * 100) || 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="stat-card-enhanced stat-warning">
                    <div className="stat-header">
                      <div className="stat-icon-large">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                        </svg>
                      </div>
                      <span className="stat-trend">
                        {((stats.publicBoards / stats.totalBoards * 100) || 0).toFixed(0)}% of total
                      </span>
                    </div>
                    <div className="stat-value-large">{stats.publicBoards}</div>
                    <div className="stat-label-large">Public Boards</div>
                    <div className="stat-progress">
                      <div 
                        className="stat-progress-bar"
                        style={{ width: `${(stats.publicBoards / stats.totalBoards * 100) || 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="stat-card-enhanced stat-info">
                    <div className="stat-header">
                      <div className="stat-icon-large">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="11" width="18" height="11" rx="2"/>
                          <path d="M7 11V7a5 5 0 0110 0v4"/>
                        </svg>
                      </div>
                      <span className="stat-trend">
                        {((stats.privateBoards / stats.totalBoards * 100) || 0).toFixed(0)}% of total
                      </span>
                    </div>
                    <div className="stat-value-large">{stats.privateBoards}</div>
                    <div className="stat-label-large">Private Boards</div>
                    <div className="stat-progress">
                      <div 
                        className="stat-progress-bar"
                        style={{ width: `${(stats.privateBoards / stats.totalBoards * 100) || 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Actions Section */}
                <div className="admin-section">
                  <div className="section-header">
                    <h2 className="section-title">Quick Actions</h2>
                    <p className="section-subtitle">Common administrative tasks</p>
                  </div>
                  <div className="quick-actions-grid">
                    <button className="quick-action-card" onClick={() => setActiveTab('boards')}>
                      <div className="quick-action-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2"/>
                        </svg>
                      </div>
                      <div className="quick-action-content">
                        <h3>Manage Boards</h3>
                        <p>View, edit, and delete boards</p>
                      </div>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </button>

                    <button className="quick-action-card" onClick={() => setActiveTab('users')}>
                      <div className="quick-action-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                          <circle cx="9" cy="7" r="4"/>
                        </svg>
                      </div>
                      <div className="quick-action-content">
                        <h3>View Users</h3>
                        <p>Monitor user activity</p>
                      </div>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </button>

                    <button className="quick-action-card" onClick={loadData}>
                      <div className="quick-action-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="23 4 23 10 17 10"/>
                          <path d="M20.49 15a9 9 0 11-2.13-9.36L23 10"/>
                        </svg>
                      </div>
                      <div className="quick-action-content">
                        <h3>Refresh Data</h3>
                        <p>Reload all statistics</p>
                      </div>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="admin-section">
                  <div className="section-header">
                    <h2 className="section-title">Recent Activity</h2>
                    <p className="section-subtitle">Latest board updates</p>
                  </div>
                  <div className="activity-list">
                    {boards.slice(0, 5).sort((a, b) => {
                      const aTime = a.updatedAt?.toMillis?.() || 0;
                      const bTime = b.updatedAt?.toMillis?.() || 0;
                      return bTime - aTime;
                    }).map(board => (
                      <div key={board.id} className="activity-item">
                        <div className="activity-icon">
                          {board.thumbnail ? (
                            <img src={board.thumbnail} alt="" />
                          ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="3" width="18" height="18" rx="2"/>
                            </svg>
                          )}
                        </div>
                        <div className="activity-content">
                          <div className="activity-title">{board.name}</div>
                          <div className="activity-meta">
                            <span>{board.ownerName || board.ownerEmail}</span>
                            <span>•</span>
                            <span>{formatRelativeTime(board.updatedAt)}</span>
                          </div>
                        </div>
                        <span className={'badge badge-' + (board.visibility === 'public' ? 'green' : 'amber')}>
                          {board.visibility}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Boards Tab */}
            {activeTab === 'boards' && (
              <div className="admin-boards">
                {/* Toolbar */}
                <div className="admin-toolbar">
                  <div className="toolbar-left">
                    <div className="search-box">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.35-4.35"/>
                      </svg>
                      <input
                        type="text"
                        placeholder="Search boards..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                      />
                      {searchQuery && (
                        <button className="search-clear" onClick={() => setSearchQuery('')}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      )}
                    </div>

                    <div className="filter-group">
                      <button
                        className={'filter-btn' + (filterVisibility === 'all' ? ' active' : '')}
                        onClick={() => setFilterVisibility('all')}
                      >
                        All
                      </button>
                      <button
                        className={'filter-btn' + (filterVisibility === 'public' ? ' active' : '')}
                        onClick={() => setFilterVisibility('public')}
                      >
                        Public
                      </button>
                      <button
                        className={'filter-btn' + (filterVisibility === 'private' ? ' active' : '')}
                        onClick={() => setFilterVisibility('private')}
                      >
                        Private
                      </button>
                    </div>
                  </div>

                  <div className="toolbar-right">
                    {selectedBoards.length > 0 && (
                      <>
                        <span className="selection-count">{selectedBoards.length} selected</span>
                        <button className="btn btn-ghost" onClick={() => bulkToggleVisibility('public')}>
                          Make Public
                        </button>
                        <button className="btn btn-ghost" onClick={() => bulkToggleVisibility('private')}>
                          Make Private
                        </button>
                        <button className="btn btn-danger" onClick={bulkDelete}>
                          Delete Selected
                        </button>
                        <button className="btn btn-ghost" onClick={() => setSelectedBoards([])}>
                          Clear
                        </button>
                      </>
                    )}
                    <button
                      className={'view-toggle' + (viewMode === 'grid' ? ' active' : '')}
                      onClick={() => setViewMode('grid')}
                      title="Grid view"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                        <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                      </svg>
                    </button>
                    <button
                      className={'view-toggle' + (viewMode === 'list' ? ' active' : '')}
                      onClick={() => setViewMode('list')}
                      title="List view"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                        <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
                        <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Results */}
                <div className="boards-results">
                  <div className="results-header">
                    <span>{filteredBoards.length} board{filteredBoards.length !== 1 ? 's' : ''}</span>
                    {filteredBoards.length > 0 && (
                      <button className="btn-link" onClick={selectAllFiltered}>
                        Select all {filteredBoards.length}
                      </button>
                    )}
                  </div>

                  {viewMode === 'grid' ? (
                    <div className="boards-grid">
                      {filteredBoards.map(board => (
                        <div key={board.id} className={'board-card-admin' + (selectedBoards.includes(board.id) ? ' selected' : '')}>
                          <div className="board-card-select">
                            <input
                              type="checkbox"
                              checked={selectedBoards.includes(board.id)}
                              onChange={() => toggleBoardSelection(board.id)}
                            />
                          </div>
                          
                          <div className="board-card-thumbnail" onClick={() => setSelectedBoard(board)}>
                            {board.thumbnail ? (
                              <img src={board.thumbnail} alt={board.name} />
                            ) : (
                              <div className="board-card-placeholder">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                                  <path d="M3 15l4-4a2 2 0 012.8 0L15 16"/>
                                </svg>
                              </div>
                            )}
                            <span className={'visibility-badge badge-' + (board.visibility === 'public' ? 'green' : 'amber')}>
                              {board.visibility === 'public' ? (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                                </svg>
                              ) : (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                                </svg>
                              )}
                              {board.visibility}
                            </span>
                          </div>

                          <div className="board-card-body">
                            <h3 className="board-card-title">{board.name}</h3>
                            <p className="board-card-owner">{board.ownerName || board.ownerEmail}</p>
                            <div className="board-card-meta">
                              <span>{formatRelativeTime(board.updatedAt)}</span>
                            </div>
                          </div>

                          <div className="board-card-actions">
                            <button
                              className="action-btn-small"
                              onClick={() => toggleVisibility(board.id, board.visibility)}
                              title="Toggle visibility"
                            >
                              {board.visibility === 'public' ? '🔒' : '🌐'}
                            </button>
                            <button
                              className="action-btn-small action-view"
                              onClick={() => setSelectedBoard(board)}
                              title="View details"
                            >
                              👁️
                            </button>
                            <button
                              className="action-btn-small action-delete"
                              onClick={() => {
                                setDeleteTarget(board.id);
                                setShowDeleteConfirm(true);
                              }}
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="boards-list">
                      <table className="boards-table">
                        <thead>
                          <tr>
                            <th style={{ width: 40 }}>
                              <input
                                type="checkbox"
                                checked={selectedBoards.length === filteredBoards.length && filteredBoards.length > 0}
                                onChange={() => {
                                  if (selectedBoards.length === filteredBoards.length) {
                                    setSelectedBoards([]);
                                  } else {
                                    selectAllFiltered();
                                  }
                                }}
                              />
                            </th>
                            <th>Board</th>
                            <th>Owner</th>
                            <th>Visibility</th>
                            <th>Updated</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredBoards.map(board => (
                            <tr key={board.id} className={selectedBoards.includes(board.id) ? 'selected' : ''}>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={selectedBoards.includes(board.id)}
                                  onChange={() => toggleBoardSelection(board.id)}
                                />
                              </td>
                              <td>
                                <div className="table-board-cell">
                                  <div className="table-board-thumb">
                                    {board.thumbnail ? (
                                      <img src={board.thumbnail} alt="" />
                                    ) : (
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                                      </svg>
                                    )}
                                  </div>
                                  <div>
                                    <div className="table-board-name">{board.name}</div>
                                    <div className="table-board-id">ID: {board.id.slice(0, 8)}...</div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="table-owner-cell">
                                  <div>{board.ownerName || 'Unknown'}</div>
                                  <div className="table-owner-email">{board.ownerEmail}</div>
                                </div>
                              </td>
                              <td>
                                <span className={'badge badge-' + (board.visibility === 'public' ? 'green' : 'amber')}>
                                  {board.visibility}
                                </span>
                              </td>
                              <td className="table-date">{formatRelativeTime(board.updatedAt)}</td>
                              <td>
                                <div className="table-actions">
                                  <button
                                    className="btn-icon"
                                    onClick={() => toggleVisibility(board.id, board.visibility)}
                                    title="Toggle visibility"
                                  >
                                    {board.visibility === 'public' ? (
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2"/>
                                        <path d="M7 11V7a5 5 0 0110 0v4"/>
                                      </svg>
                                    ) : (
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                                      </svg>
                                    )}
                                  </button>
                                  <button
                                    className="btn-icon"
                                    onClick={() => setSelectedBoard(board)}
                                    title="View details"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                      <circle cx="12" cy="12" r="3"/>
                                    </svg>
                                  </button>
                                  <button
                                    className="btn-icon btn-danger"
                                    onClick={() => {
                                      setDeleteTarget(board.id);
                                      setShowDeleteConfirm(true);
                                    }}
                                    title="Delete"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <polyline points="3 6 5 6 21 6"/>
                                      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="admin-users">
                <div className="users-grid">
                  {users.map(u => (
                    <div key={u.uid} className="user-card">
                      <div className="user-avatar-large">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <h3 className="user-name">{u.name}</h3>
                      <p className="user-email">{u.email}</p>
                      <div className="user-stats">
                        <div className="user-stat">
                          <span className="user-stat-value">{u.boardCount}</span>
                          <span className="user-stat-label">Boards</span>
                        </div>
                        <div className="user-stat">
                          <span className="user-stat-value">{formatRelativeTime(u.lastActive)}</span>
                          <span className="user-stat-label">Last Active</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-backdrop" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Deletion</h2>
              <button className="btn-icon" onClick={() => setShowDeleteConfirm(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 20, color: 'var(--tx-2)' }}>
                Are you sure you want to permanently delete this board? This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => deleteBoard(deleteTarget)}
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Board Details Modal */}
      {selectedBoard && (
        <BoardDetailsModal
          board={selectedBoard}
          onClose={() => setSelectedBoard(null)}
          onDelete={(id) => {
            setDeleteTarget(id);
            setShowDeleteConfirm(true);
            setSelectedBoard(null);
          }}
          onToggleVisibility={toggleVisibility}
          formatDate={formatDate}
        />
      )}
    </div>
  );
}