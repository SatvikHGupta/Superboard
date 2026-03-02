//sarkate ka aatank

import { useState, useEffect } from 'react';

export default function AdminHeader({ user, onBack, onRefresh, liveCount }) {
  // liveCount is passed in from AdminAnalyticsTab/LiveUsersPanel via prop, so we never open a collectionGroup listener here (that crashes the SDK).
  const count = typeof liveCount === 'number' ? liveCount : null;

  return (
    <header className="admin-header glass-strong">
      <div className="admin-header-main">
        <button className="btn-icon admin-back-btn" onClick={onBack} title="Back to Dashboard">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div className="admin-header-info">
          <h1 className="admin-title">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--a)" strokeWidth="2" style={{ marginRight: 8, flexShrink: 0 }}>
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
        {count !== null && (
          <div
            className="admin-live-badge"
            title="Users with a board open right now (cursor active in last 5 min)"
            data-active={count > 0}
          >
            <span className="admin-live-dot" data-active={count > 0} />
            {count} online
          </div>
        )}

        <div className="admin-user-badge">
          <div className="admin-user-avatar">{user.email.charAt(0).toUpperCase()}</div>
          <div className="admin-user-info">
            <span className="admin-user-name">{user.displayName || 'Admin'}</span>
            <span className="admin-user-email">{user.email}</span>
          </div>
        </div>

        <button
          className="btn btn-primary admin-refresh-btn"
          onClick={onRefresh}
          title="Refresh all data (R)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 11-2.13-9.36L23 10"/>
          </svg>
          Refresh
        </button>
      </div>
    </header>
  );
}