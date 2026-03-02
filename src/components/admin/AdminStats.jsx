// ai made this up - works though

export default function AdminStats({ stats }) {
  const {
    totalBoards, publicBoards, privateBoards,
    totalUsers, boardsThisWeek, activeToday,
  } = stats;

  const publicPct  = ((publicBoards  / totalBoards * 100) || 0).toFixed(0);
  const privatePct = ((privateBoards / totalBoards * 100) || 0).toFixed(0);
  const activePct  = totalUsers > 0 ? (activeToday / totalUsers * 100) : 0;

  return (
    <div className="stats-grid-enhanced">
      {/* Total Boards */}
      <div className="stat-card-enhanced stat-primary">
        <div className="stat-header">
          <div className="stat-icon-large">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
            </svg>
          </div>
          <span className="stat-trend">+{boardsThisWeek} this week</span>
        </div>
        <div className="stat-value-large">{totalBoards}</div>
        <div className="stat-label-large">Total Boards</div>
        <div className="stat-footer">
          <span className="stat-detail">{publicBoards} public</span>
          <span className="stat-detail">{privateBoards} private</span>
        </div>
      </div>

      {/* Total Users */}
      <div className="stat-card-enhanced stat-success">
        <div className="stat-header">
          <div className="stat-icon-large">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
            </svg>
          </div>
          <span className="stat-trend">{activeToday} active today</span>
        </div>
        <div className="stat-value-large">{totalUsers}</div>
        <div className="stat-label-large">Total Users</div>
        <div className="stat-progress">
          <div className="stat-progress-bar" style={{ width: `${activePct}%` }} />
        </div>
      </div>

      {/* Public Boards */}
      <div className="stat-card-enhanced stat-warning">
        <div className="stat-header">
          <div className="stat-icon-large">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <span className="stat-trend">{publicPct}% of total</span>
        </div>
        <div className="stat-value-large">{publicBoards}</div>
        <div className="stat-label-large">Public Boards</div>
        <div className="stat-progress">
          <div className="stat-progress-bar" style={{ width: `${publicPct}%` }} />
        </div>
      </div>

      {/* Private Boards */}
      <div className="stat-card-enhanced stat-info">
        <div className="stat-header">
          <div className="stat-icon-large">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
          </div>
          <span className="stat-trend">{privatePct}% of total</span>
        </div>
        <div className="stat-value-large">{privateBoards}</div>
        <div className="stat-label-large">Private Boards</div>
        <div className="stat-progress">
          <div className="stat-progress-bar" style={{ width: `${privatePct}%` }} />
        </div>
      </div>
    </div>
  );
}