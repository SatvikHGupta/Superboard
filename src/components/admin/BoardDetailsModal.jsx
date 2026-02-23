// src/components/admin/BoardDetailsModal.jsx
// v1.4.2: Board preview tab — full-size read-only embed via iframe pointing
//   at the public #/view/{id} route. Falls back to thumbnail if board is private.

import { useState } from 'react';

export default function BoardDetailsModal({ board, onClose, onDelete, onToggleVisibility, formatDate }) {
  const [previewMode, setPreviewMode] = useState('thumb'); // 'thumb' | 'live'

  const viewUrl = window.location.origin + window.location.pathname + '#/view/' + board.id;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content modal-lg board-details-modal"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 900, width: '95vw' }}
      >
        <div className="modal-header">
          <div>
            <h2>{board.name}</h2>
            <p style={{ fontSize: 13, color: 'var(--tx-4)', marginTop: 4 }}>
              ID: {board.id}
            </p>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {/* ── Preview section ─────────────────────────────────────────── */}
          <div className="board-preview-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <h3 className="detail-section-title">Preview</h3>
              <div className="filter-group">
                <button
                  className={'filter-btn' + (previewMode === 'thumb' ? ' active' : '')}
                  onClick={() => setPreviewMode('thumb')}
                >
                  Thumbnail
                </button>
                {board.visibility === 'public' && (
                  <button
                    className={'filter-btn' + (previewMode === 'live' ? ' active' : '')}
                    onClick={() => setPreviewMode('live')}
                  >
                    Live Preview
                  </button>
                )}
              </div>
            </div>

            {previewMode === 'thumb' ? (
              <div className="board-preview-large">
                {board.thumbnail ? (
                  <img src={board.thumbnail} alt={board.name} />
                ) : (
                  <div className="board-preview-placeholder">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <path d="M3 15l4-4a2 2 0 012.8 0L15 16"/>
                      <path d="M14 14l1-1a2 2 0 012.8 0L21 16"/>
                    </svg>
                    <p>No preview available</p>
                  </div>
                )}
              </div>
            ) : (
              // Live iframe embed — only shown for public boards so no auth needed
              <div style={{
                width: '100%', height: 480, borderRadius: 'var(--r-lg)',
                overflow: 'hidden', border: '1px solid var(--border)',
                background: 'var(--bg-2)', position: 'relative',
              }}>
                <iframe
                  src={viewUrl}
                  title={board.name}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  sandbox="allow-scripts allow-same-origin"
                />
                <a
                  href={viewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    position: 'absolute', bottom: 10, right: 10,
                    padding: '4px 10px', fontSize: 12, borderRadius: 6,
                    background: 'var(--bg-glass)', backdropFilter: 'blur(8px)',
                    border: '1px solid var(--border)', color: 'var(--tx-2)',
                    textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5,
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                    <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                  Open in new tab
                </a>
              </div>
            )}

            {board.visibility === 'private' && (
              <p style={{ fontSize: 12, color: 'var(--tx-4)', marginTop: 8, textAlign: 'center' }}>
                Live preview only available for public boards. Make this board public to enable it.
              </p>
            )}
          </div>

          {/* ── Details grid ────────────────────────────────────────────── */}
          <div className="board-details-grid">
            <div className="detail-group">
              <label className="detail-label">Owner</label>
              <div className="detail-value">
                <div className="detail-user">
                  <div className="detail-avatar">
                    {(board.ownerName || board.ownerEmail).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="detail-user-name">{board.ownerName || 'Unknown'}</div>
                    <div className="detail-user-email">{board.ownerEmail}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="detail-group">
              <label className="detail-label">Visibility</label>
              <div className="detail-value">
                <span className={'badge badge-' + (board.visibility === 'public' ? 'green' : 'amber')}>
                  {board.visibility === 'public' ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 4 }}>
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 4 }}>
                      <rect x="3" y="11" width="18" height="11" rx="2"/>
                      <path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                  )}
                  {board.visibility}
                </span>
              </div>
            </div>

            <div className="detail-group">
              <label className="detail-label">Created</label>
              <div className="detail-value">{formatDate(board.createdAt)}</div>
            </div>

            <div className="detail-group">
              <label className="detail-label">Last Updated</label>
              <div className="detail-value">{formatDate(board.updatedAt)}</div>
            </div>

            <div className="detail-group">
              <label className="detail-label">Dimensions</label>
              <div className="detail-value">
                {board.boardWidth || 1200} × {board.boardHeight || 1600} px
              </div>
            </div>

            <div className="detail-group">
              <label className="detail-label">Editors</label>
              <div className="detail-value">
                {board.editors && board.editors.length > 0 ? (
                  <div className="editors-list">
                    {board.editors.map((email, i) => (
                      <span key={i} className="editor-badge">{email}</span>
                    ))}
                  </div>
                ) : (
                  <span style={{ color: 'var(--tx-4)' }}>No editors</span>
                )}
              </div>
            </div>
          </div>

          {/* ── Actions ─────────────────────────────────────────────────── */}
          <div className="detail-actions">
            <button className="btn btn-primary" onClick={() => onToggleVisibility(board.id, board.visibility)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {board.visibility === 'public' ? (
                  <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>
                ) : (
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                )}
              </svg>
              Make {board.visibility === 'public' ? 'Private' : 'Public'}
            </button>

            <a
              href={viewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost"
              style={{ textDecoration: 'none' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              Open Board
            </a>

            <button className="btn btn-danger" onClick={() => onDelete(board.id)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/>
              </svg>
              Move to Bin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}