// src/components/admin/BoardDetailsModal.jsx
// v1.5.2: No sliders, fixed z-index (200), single scroll source on .modal-content.

import { useState } from 'react';

export default function BoardDetailsModal({ board, onClose, onDelete, onToggleVisibility, formatDate }) {
  const [previewMode, setPreviewMode] = useState('thumb');

  const boardWidth  = board.boardWidth  || 1200;
  const boardHeight = board.boardHeight || 1600;

  const base    = window.location.origin + window.location.pathname;
  const viewUrl = board.visibility === 'public'
    ? base + '#/view/' + board.id
    : base + '#/board/' + board.id;

  return (
    <div className="modal-backdrop board-details-modal-backdrop" onClick={onClose}>
      <div
        className="modal-content board-details-modal"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ minWidth: 0 }}>
            <h2 style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 500 }}>
              {board.name}
            </h2>
            <p style={{ fontSize: 11, color: 'var(--tx-4)', marginTop: 3, fontFamily: 'monospace' }}>
              {board.id}
            </p>
          </div>
          <button className="btn-icon" onClick={onClose} style={{ flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body — no overflow, parent .modal-content scrolls */}
        <div className="modal-body">

          {/* Preview */}
          <div className="board-preview-section">
            <div className="board-preview-controls">
              <span className="board-preview-label">Preview</span>
              <div className="filter-group">
                <button
                  className={'filter-btn' + (previewMode === 'thumb' ? ' active' : '')}
                  onClick={() => setPreviewMode('thumb')}
                >
                  Thumbnail
                </button>
                <button
                  className={'filter-btn' + (previewMode === 'live' ? ' active' : '')}
                  onClick={() => setPreviewMode('live')}
                  title={board.visibility === 'private' ? 'Admin access — viewing private board' : 'Live preview'}
                >
                  Live {board.visibility === 'private' ? '🔒' : ''}
                </button>
              </div>
            </div>

            {previewMode === 'thumb' ? (
              <div className="board-preview-large">
                {board.thumbnail ? (
                  <img src={board.thumbnail} alt={board.name} />
                ) : (
                  <div className="board-preview-placeholder">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <path d="M3 15l4-4a2 2 0 012.8 0L15 16"/>
                      <path d="M14 14l1-1a2 2 0 012.8 0L21 16"/>
                    </svg>
                    <p style={{ margin: 0, color: 'var(--tx-4)', fontSize: 13 }}>No thumbnail yet</p>
                  </div>
                )}
                <div className="board-dim-pill">
                  {boardWidth.toLocaleString()}
                  <span className="board-dim-pill-x">×</span>
                  {boardHeight.toLocaleString()}
                  <span style={{ color: 'var(--tx-4)', fontWeight: 400, fontSize: 10 }}>px</span>
                </div>
              </div>
            ) : (
              <div style={{ width: '100%', height: 380, position: 'relative', background: 'var(--bg-2)' }}>
                <iframe
                  src={viewUrl}
                  title={board.name}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  sandbox="allow-scripts allow-same-origin"
                />
                <div className="board-dim-pill">
                  {boardWidth.toLocaleString()}
                  <span className="board-dim-pill-x">×</span>
                  {boardHeight.toLocaleString()}
                  <span style={{ color: 'var(--tx-4)', fontWeight: 400, fontSize: 10 }}>px</span>
                </div>
              </div>
            )}
          </div>

          {/* Info + Actions */}
          <div className="board-details-body">
            <div>
              <p className="detail-section-title">Board Info</p>
              <div className="board-details-grid">

                <div className="detail-group">
                  <label className="detail-label">Owner</label>
                  <div className="detail-user">
                    <div className="detail-avatar">
                      {(board.ownerName || board.ownerEmail || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="detail-user-info">
                      <span className="detail-user-name">{board.ownerName || 'Unknown'}</span>
                      <span className="detail-user-email">{board.ownerEmail}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-group">
                  <label className="detail-label">Visibility</label>
                  <span className={'badge badge-' + (board.visibility === 'public' ? 'green' : 'amber')}>
                    {board.visibility === 'public' ? (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 4 }}>
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                      </svg>
                    ) : (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 4 }}>
                        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                      </svg>
                    )}
                    {board.visibility}
                  </span>
                </div>

                <div className="detail-group">
                  <label className="detail-label">Dimensions</label>
                  <div className="detail-value">
                    {boardWidth.toLocaleString()} × {boardHeight.toLocaleString()}
                    <span style={{ color: 'var(--tx-4)', fontWeight: 400, fontSize: 11, marginLeft: 3 }}>px</span>
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
                  <label className="detail-label">Editors</label>
                  {board.editors && board.editors.length > 0 ? (
                    <div className="editors-list">
                      {board.editors.map((email, i) => (
                        <span key={i} className="editor-badge">{email}</span>
                      ))}
                    </div>
                  ) : <span style={{ color: 'var(--tx-4)', fontSize: 12 }}>No editors</span>}
                </div>

              </div>
            </div>

            <div className="detail-actions">
              <button className="btn btn-primary" onClick={() => onToggleVisibility(board.id, board.visibility)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {board.visibility === 'public' ? (
                    <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>
                  ) : (
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  )}
                </svg>
                Make {board.visibility === 'public' ? 'Private' : 'Public'}
              </button>

              <a href={viewUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ textDecoration: 'none' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                  <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
                Open Board
              </a>

              <button className="btn btn-danger" onClick={() => onDelete(board.id)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                </svg>
                Move to Bin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}