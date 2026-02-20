// src/components/admin/AdminUsersTab.jsx
//
// Users tab — each user card is clickable and opens UserBoardsModal showing
// all boards that user has created with full management controls.

import { useState }       from 'react';
import UserBoardsModal    from './UserBoardsModal.jsx';

export default function AdminUsersTab({ users, formatRelativeTime, formatDate }) {
  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <div className="admin-users">
      <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--tx-4)' }}>
        Click a user card to view and manage all their boards.
      </div>

      <div className="users-grid">
        {users.map(u => (
          <button
            key={u.uid}
            className="user-card"
            onClick={() => setSelectedUser(u)}
            title="Click to view this user's boards"
            style={{
              textAlign: 'left', cursor: 'pointer',
              transition: 'transform 0.1s, box-shadow 0.1s',
            }}
          >
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
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--a)', fontWeight: 500 }}>
              View boards →
            </div>
          </button>
        ))}
      </div>

      {selectedUser && (
        <UserBoardsModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          formatDate={formatDate}
          formatRelativeTime={formatRelativeTime}
        />
      )}
    </div>
  );
}