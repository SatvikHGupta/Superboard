import { useState } from 'react';

export default function BoardCard({ board, onOpen, onDelete, onToggleVisibility, formatDate, isEditor }) {
  const [copied, setCopied] = useState(false);

  function handleCopyLink(e) {
    e.stopPropagation();
    const url = window.location.origin + window.location.pathname + '#/view/' + board.id;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleToggle(e) {
    e.stopPropagation();
    if (onToggleVisibility) onToggleVisibility();
  }

  function handleDel(e) {
    e.stopPropagation();
    if (onDelete) onDelete();
  }

  const isPublic = board.visibility === 'public';

  return (
    <div className="board-card" onClick={onOpen}>
      {/* Thumbnail */}
      <div className="board-card-thumb">
        {board.thumbnail ? (
          <img src={board.thumbnail} alt={board.name} />
        ) : (
          <div className="board-card-empty-thumb">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.4 }}>
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 15l4-4a2 2 0 012.8 0L15 16"/>
              <path d="M14 14l1-1a2 2 0 012.8 0L21 16"/>
            </svg>
          </div>
        )}
        {isPublic && !isEditor && (
          <span className="badge badge-green" style={{ position: 'absolute', top: 8, right: 8 }}>Public</span>
        )}
        {isEditor && (
          <span className="badge badge-purple" style={{ position: 'absolute', top: 8, right: 8 }}>Shared</span>
        )}
      </div>

      {/* Body */}
      <div className="board-card-body">
        <div className="board-card-name">{board.name}</div>
        {isEditor && (
          <div style={{ fontSize: 11, color: 'var(--tx-4)', marginTop: 2 }}>
            by {board.ownerName || board.ownerEmail}
          </div>
        )}
        <div className="board-card-date">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          {formatDate(board.createdAt)}
        </div>
      </div>

      {/* Footer - only for owner */}
      {!isEditor && (
        <div className="board-card-footer">
          <div className="board-card-footer-left">
            <div
              className={'toggle-track' + (isPublic ? ' active' : '')}
              onClick={handleToggle}
              title={isPublic ? 'Make private' : 'Make public'}
            >
              <div className="toggle-thumb" />
            </div>

            {isPublic && (
              <button
                className="btn-icon"
                onClick={handleCopyLink}
                title="Copy public link"
                style={{ width: 28, height: 28 }}
              >
                {copied ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                  </svg>
                )}
              </button>
            )}
          </div>

          <div className="board-card-footer-right">
            <button
              className="btn-icon btn-danger"
              onClick={handleDel}
              title="Delete board"
              style={{ width: 28, height: 28 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                <path d="M10 11v6"/>
                <path d="M14 11v6"/>
                <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}