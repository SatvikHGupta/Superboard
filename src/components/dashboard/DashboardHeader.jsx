// nav bar i think i hope

import { isAdminEmail } from '../../constants/admin.js';

export default function DashboardHeader({ user, boardCount, onLogout }) {
  const isAdmin = isAdminEmail(user.email);

  function goToAdmin() {
    window.location.hash = '#/admin';
  }

  return (
    <header className="dash-header glass-strong">
      <div className="dash-header-left">
        <span className="dash-header-logo">Superboard</span>
        {boardCount > 0 && (
          <span className="dash-header-count">{boardCount}</span>
        )}
      </div>

      <div className="dash-header-right">
        <span className="dash-user-email">{user.email}</span>

        {isAdmin && (
          <button
            className="btn btn-ghost"
            onClick={goToAdmin}
            style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <polyline points="2 17 12 22 22 17"/>
              <polyline points="2 12 12 17 22 12"/>
            </svg>
            Admin
          </button>
        )}

        <button
          className="btn btn-ghost"
          onClick={onLogout}
          style={{ padding: '6px 12px', fontSize: '13px' }}
        >
          Sign out
        </button>
      </div>
    </header>
  );
}