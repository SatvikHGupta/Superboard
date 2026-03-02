// Search filter bulk delete. Power tools.

export default function AdminBoardToolbar({
  searchQuery, onSearch, filterVisibility, onFilter,
  selectedCount, totalFiltered, viewMode, onViewMode,
  onBulkPublic, onBulkPrivate, onBulkDelete, onClearSelection,
  onSelectAll, onDeleteAll, showDeleteAll,
}) {
  return (
    <div className="admin-toolbar">
      <div className="toolbar-left">
        <div className="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input type="text" placeholder="Search boards… (/)" value={searchQuery}
            onChange={e => onSearch(e.target.value)} />
          {searchQuery && (
            <button className="search-clear" onClick={() => onSearch('')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
        <div className="filter-group">
          {['all', 'public', 'private'].map(f => (
            <button key={f} className={'filter-btn' + (filterVisibility === f ? ' active' : '')}
              onClick={() => onFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="toolbar-right">
        {selectedCount > 0 ? (
          <>
            <span className="selection-count">{selectedCount} selected</span>
            <button className="btn btn-ghost" onClick={onBulkPublic}>Make Public</button>
            <button className="btn btn-ghost" onClick={onBulkPrivate}>Make Private</button>
            <button className="btn btn-danger" onClick={onBulkDelete}>Delete Selected</button>
            <button className="btn btn-ghost" onClick={onClearSelection}>Clear</button>
          </>
        ) : showDeleteAll && (
          <button className="btn btn-danger" onClick={onDeleteAll} style={{ fontSize: 12, padding: '6px 12px' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 5 }}>
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
            </svg>
            Move All to Bin
          </button>
        )}
        {['grid', 'list'].map(mode => (
          <button key={mode} className={'view-toggle' + (viewMode === mode ? ' active' : '')}
            onClick={() => onViewMode(mode)} title={mode + ' view'}>
            {mode === 'grid'
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            }
          </button>
        ))}
      </div>
    </div>
  );
}
