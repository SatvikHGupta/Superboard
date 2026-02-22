// src/components/admin/AdminBoardsTab.jsx
// v1.4:
// • Removed all browser confirm() calls — confirmations now handled by
//   the ConfirmModal in AdminPage (2-step confirm pattern)
// • Added "Delete All Boards" danger button in toolbar
// • onDeleteAllBoards prop wired to the nuclear option in AdminPage

import { useState } from 'react';

export default function AdminBoardsTab({
  boards,
  onDeleteBoard,
  onToggleVisibility,
  onBulkDelete,
  onBulkToggleVisibility,
  onDeleteAllBoards,
  onViewBoard,
  formatRelativeTime,
}) {
  const [searchQuery,      setSearchQuery]      = useState('');
  const [filterVisibility, setFilterVisibility] = useState('all');
  const [selectedBoards,   setSelectedBoards]   = useState([]);
  const [viewMode,         setViewMode]         = useState('grid');

  const filteredBoards = boards.filter(board => {
    const matchesSearch =
      board.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      board.ownerEmail?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterVisibility === 'all' || board.visibility === filterVisibility;
    return matchesSearch && matchesFilter;
  });

  function toggleBoardSelection(id) {
    setSelectedBoards(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  }

  function selectAllFiltered() {
    setSelectedBoards(filteredBoards.map(b => b.id));
  }

  function handleBulkDelete() {
    onBulkDelete(selectedBoards, () => setSelectedBoards([]));
  }

  function handleBulkToggle(vis) {
    onBulkToggleVisibility(selectedBoards, vis, () => setSelectedBoards([]));
  }

  return (
    <div className="admin-boards">
      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search boards..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => setSearchQuery('')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>

          <div className="filter-group">
            {['all', 'public', 'private'].map(f => (
              <button
                key={f}
                className={'filter-btn' + (filterVisibility === f ? ' active' : '')}
                onClick={() => setFilterVisibility(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="toolbar-right">
          {selectedBoards.length > 0 ? (
            <>
              <span className="selection-count">{selectedBoards.length} selected</span>
              <button className="btn btn-ghost" onClick={() => handleBulkToggle('public')}>Make Public</button>
              <button className="btn btn-ghost" onClick={() => handleBulkToggle('private')}>Make Private</button>
              <button className="btn btn-danger" onClick={handleBulkDelete}>Delete Selected</button>
              <button className="btn btn-ghost" onClick={() => setSelectedBoards([])}>Clear</button>
            </>
          ) : (
            /* Delete All — only shown when no selection */
            boards.length > 0 && (
              <button
                className="btn btn-danger"
                onClick={onDeleteAllBoards}
                style={{ fontSize: 12, padding: '6px 12px' }}
                title="Delete every board in the database"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 5 }}>
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                </svg>
                Delete All
              </button>
            )
          )}

          {['grid', 'list'].map(mode => (
            <button
              key={mode}
              className={'view-toggle' + (viewMode === mode ? ' active' : '')}
              onClick={() => setViewMode(mode)}
              title={mode.charAt(0).toUpperCase() + mode.slice(1) + ' view'}
            >
              {mode === 'grid' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                  <line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/>
                  <line x1="3" y1="12" x2="3.01" y2="12"/>
                  <line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Results header */}
      <div className="boards-results">
        <div className="results-header">
          <span>{filteredBoards.length} board{filteredBoards.length !== 1 ? 's' : ''}</span>
          {filteredBoards.length > 0 && (
            <button className="btn-link" onClick={selectAllFiltered}>
              Select all {filteredBoards.length}
            </button>
          )}
        </div>

        {/* Grid view */}
        {viewMode === 'grid' && (
          <div className="boards-grid">
            {filteredBoards.map(board => (
              <div
                key={board.id}
                className={'board-card-admin' + (selectedBoards.includes(board.id) ? ' selected' : '')}
              >
                <div className="board-card-select">
                  <input
                    type="checkbox"
                    checked={selectedBoards.includes(board.id)}
                    onChange={() => toggleBoardSelection(board.id)}
                  />
                </div>

                <div className="board-card-thumbnail" onClick={() => onViewBoard(board)}>
                  {board.thumbnail ? (
                    <img src={board.thumbnail} alt={board.name} />
                  ) : (
                    <div className="board-card-placeholder">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <path d="M3 15l4-4a2 2 0 012.8 0L15 16"/>
                      </svg>
                    </div>
                  )}
                  <span className={'visibility-badge badge-' + (board.visibility === 'public' ? 'green' : 'amber')}>
                    {board.visibility}
                  </span>
                  {/* Editor count */}
                  {Array.isArray(board.editors) && board.editors.length > 0 && (
                    <span style={{
                      position: 'absolute', bottom: 6, right: 6,
                      fontSize: 10, color: 'var(--a-light)',
                      background: 'rgba(99,102,241,0.18)',
                      border: '1px solid rgba(99,102,241,0.3)',
                      borderRadius: 'var(--r-full)',
                      padding: '1px 6px',
                    }}>
                      {board.editors.length} editor{board.editors.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <div className="board-card-body">
                  <h3 className="board-card-title">{board.name}</h3>
                  <p className="board-card-owner">{board.ownerName || board.ownerEmail}</p>
                  <div className="board-card-meta">
                    <span>{formatRelativeTime(board.updatedAt)}</span>
                  </div>
                </div>

                <div className="board-card-actions">
                  <button
                    className="action-btn-small"
                    onClick={() => onToggleVisibility(board.id, board.visibility)}
                    title="Toggle visibility"
                  >
                    {board.visibility === 'public' ? '🔒' : '🌐'}
                  </button>
                  <button
                    className="action-btn-small action-view"
                    onClick={() => onViewBoard(board)}
                    title="View details"
                  >
                    👁️
                  </button>
                  <button
                    className="action-btn-small action-delete"
                    onClick={() => onDeleteBoard(board.id)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List view */}
        {viewMode === 'list' && (
          <div className="boards-list">
            <table className="boards-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input
                      type="checkbox"
                      checked={selectedBoards.length === filteredBoards.length && filteredBoards.length > 0}
                      onChange={() => {
                        if (selectedBoards.length === filteredBoards.length) setSelectedBoards([]);
                        else selectAllFiltered();
                      }}
                    />
                  </th>
                  <th>Board</th>
                  <th>Owner</th>
                  <th>Visibility</th>
                  <th>Editors</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBoards.map(board => (
                  <tr key={board.id} className={selectedBoards.includes(board.id) ? 'selected' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedBoards.includes(board.id)}
                        onChange={() => toggleBoardSelection(board.id)}
                      />
                    </td>
                    <td>
                      <div className="table-board-cell">
                        <div className="table-board-thumb">
                          {board.thumbnail ? (
                            <img src={board.thumbnail} alt="" />
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="3" width="18" height="18" rx="2"/>
                            </svg>
                          )}
                        </div>
                        <div>
                          <div className="table-board-name">{board.name}</div>
                          <div className="table-board-id">ID: {board.id.slice(0, 8)}…</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="table-owner-cell">
                        <div>{board.ownerName || 'Unknown'}</div>
                        <div className="table-owner-email">{board.ownerEmail}</div>
                      </div>
                    </td>
                    <td>
                      <span className={'badge badge-' + (board.visibility === 'public' ? 'green' : 'amber')}>
                        {board.visibility}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 13, color: 'var(--tx-3)' }}>
                        {Array.isArray(board.editors) ? board.editors.length : 0}
                      </span>
                    </td>
                    <td className="table-date">{formatRelativeTime(board.updatedAt)}</td>
                    <td>
                      <div className="table-actions">
                        <button className="btn-icon" onClick={() => onToggleVisibility(board.id, board.visibility)} title="Toggle visibility">
                          {board.visibility === 'public' ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                            </svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                            </svg>
                          )}
                        </button>
                        <button className="btn-icon" onClick={() => onViewBoard(board)} title="View details">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        </button>
                        <button className="btn-icon btn-danger" onClick={() => onDeleteBoard(board.id)} title="Delete">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}