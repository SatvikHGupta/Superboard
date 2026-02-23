// src/components/admin/AdminUsersTab.jsx
// v1.4.2: Ban / unban buttons on each user card.

import { useState } from 'react';
import UserBoardsModal from './UserBoardsModal.jsx';

export default function AdminUsersTab({ users, bannedUsers = [], onBanUser, onUnbanUser, formatRelativeTime, formatDate }) {
  const [selectedUser, setSelectedUser] = useState(null);

  const bannedSet = new Set(bannedUsers.map(b => b.uid));

  return (
    <div className="admin-users">
      <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--tx-4)' }}>
        Click a user card to view and manage all their boards.
        {bannedUsers.length > 0 && (
          <span style={{ marginLeft: 12, color: 'var(--red)', fontWeight: 600 }}>
            {bannedUsers.length} user{bannedUsers.length !== 1 ? 's' : ''} currently banned.
          </span>
        )}
      </div>

      <div className="users-grid">
        {users.map(u => {
          const isBanned = bannedSet.has(u.uid);
          const ban      = bannedUsers.find(b => b.uid === u.uid);
          return (
            <div key={u.uid} style={{ position: 'relative' }}>
              <button className="user-card"
                onClick={() => setSelectedUser(u)}
                title="Click to view boards"
                style={{
                  textAlign: 'left', cursor: 'pointer', width: '100%',
                  opacity: isBanned ? 0.7 : 1,
                  border: isBanned ? '1px solid rgba(239,68,68,0.4)' : undefined,
                }}>
                <div className="user-avatar-large"
                  style={{ background: isBanned ? 'rgba(239,68,68,0.15)' : undefined }}>
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <h3 className="user-name">{u.name}</h3>
                <p className="user-email">{u.email}</p>
                {isBanned && (
                  <div style={{ marginTop: 6 }}>
                    <span className="badge badge-red">🚫 Banned</span>
                    {ban?.reason && (
                      <div style={{ fontSize: 11, color: 'var(--tx-4)', marginTop: 4, fontStyle: 'italic' }}>
                        {ban.reason}
                      </div>
                    )}
                  </div>
                )}
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
                <div style={{ marginTop: 10, fontSize: 12, color: 'var(--a)', fontWeight: 500 }}>
                  View boards →
                </div>
              </button>

              {/* Ban / Unban button — outside the user-card button to avoid nesting */}
              <div style={{ position: 'absolute', top: 10, right: 10 }}>
                {isBanned ? (
                  <button
                    onClick={e => { e.stopPropagation(); onUnbanUser(u); }}
                    title="Remove ban"
                    style={{
                      padding: '3px 8px', fontSize: 11, borderRadius: 6, cursor: 'pointer',
                      background: 'rgba(34,197,94,0.12)', color: '#22c55e',
                      border: '1px solid rgba(34,197,94,0.3)',
                    }}>
                    ✓ Unban
                  </button>
                ) : (
                  <button
                    onClick={e => { e.stopPropagation(); onBanUser(u); }}
                    title="Ban this user"
                    style={{
                      padding: '3px 8px', fontSize: 11, borderRadius: 6, cursor: 'pointer',
                      background: 'rgba(239,68,68,0.1)', color: 'var(--red)',
                      border: '1px solid rgba(239,68,68,0.25)',
                    }}>
                    🚫 Ban
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedUser && (
        <UserBoardsModal user={selectedUser} onClose={() => setSelectedUser(null)}
          formatDate={formatDate} formatRelativeTime={formatRelativeTime} />
      )}
    </div>
  );
}