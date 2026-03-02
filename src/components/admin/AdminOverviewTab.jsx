// short summary or precis kehte h 

import AdminStats from './AdminStats.jsx';

export default function AdminOverviewTab({ stats, boards, onGoBoards, onGoUsers, onRefresh, formatRelativeTime }) {
  const recentBoards = [...boards]
    .sort((a, b) => {
      const at = a.updatedAt?.toMillis?.() || 0;
      const bt = b.updatedAt?.toMillis?.() || 0;
      return bt - at;
    })
    .slice(0, 5);

  return (
    <div className="admin-overview">
      <AdminStats stats={stats} />

      {/* Quick Actions */}
      <div className="admin-section">
        <div className="section-header">
          <h2 className="section-title">Quick Actions</h2>
          <p className="section-subtitle">Common administrative tasks</p>
        </div>
        <div className="quick-actions-grid">
          <button className="quick-action-card" onClick={onGoBoards}>
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

          <button className="quick-action-card" onClick={onGoUsers}>
            <div className="quick-action-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
              </svg>
            </div>
            <div className="quick-action-content">
              <h3>View Users</h3>
              <p>Monitor user activity and boards</p>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>

          <button className="quick-action-card" onClick={onRefresh}>
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
          {recentBoards.map(board => (
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
  );
}