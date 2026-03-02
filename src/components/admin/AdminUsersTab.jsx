// kon ho bhai

import { useState } from 'react';
import UserBoardsModal from './UserBoardsModal.jsx';

function EditorBoardsList({ boards }) {
  const [open, setOpen] = useState(false);
  if (!boards || boards.length === 0) return null;

  return (
    <div style={{ marginTop: 8 }}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '2px 8px', borderRadius: 'var(--r-full)',
          background: 'rgba(59,130,246,0.12)',
          border: '1px solid rgba(59,130,246,0.28)',
          color: '#3b82f6', fontSize: 11, fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        Editor on {boards.length} board{boards.length !== 1 ? 's' : ''}
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            marginTop: 5, padding: '6px 10px',
            borderRadius: 'var(--r-md)',
            background: 'rgba(59,130,246,0.06)',
            border: '1px solid rgba(59,130,246,0.18)',
            display: 'flex', flexDirection: 'column', gap: 3,
          }}
        >
          {boards.map(b => (
            <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--tx-3)' }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
              </svg>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {b.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
                    <span className="user-stat-label">Owned</span>
                  </div>
                  <div className="user-stat">
                    <span className="user-stat-value">{formatRelativeTime(u.lastActive)}</span>
                    <span className="user-stat-label">Last Active</span>
                  </div>
                </div>

                {/* Boards this user is an editor on */}
                <EditorBoardsList boards={u.editorBoards} />

                <div style={{ marginTop: 10, fontSize: 12, color: 'var(--a)', fontWeight: 500 }}>
                  View owned boards →
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