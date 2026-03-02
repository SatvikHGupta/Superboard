// Boards pe nazar rakho warna bhaag jayenge.

import { useState } from 'react';
import AdminBoardToolbar   from './AdminBoardToolbar.jsx';
import AdminBoardGrid      from './AdminBoardGrid.jsx';
import AdminBoardList      from './AdminBoardList.jsx';
import AdminBoardPagination from './AdminBoardPagination.jsx';

export default function AdminBoardsTab({
  boards, onDeleteBoard, onToggleVisibility,
  onBulkDelete, onBulkToggleVisibility, onDeleteAllBoards,
  onViewBoard, formatRelativeTime,
}) {
  const [searchQuery,      setSearchQuery]      = useState('');
  const [filterVisibility, setFilterVisibility] = useState('all');
  const [selectedBoards,   setSelectedBoards]   = useState([]);
  const [viewMode,         setViewMode]         = useState('grid');
  const [pageSize,         setPageSize]         = useState(25);
  const [page,             setPage]             = useState(1);

  const filtered = boards.filter(b =>
    (b.name?.toLowerCase().includes(searchQuery.toLowerCase()) || b.ownerEmail?.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (filterVisibility === 'all' || b.visibility === filterVisibility)
  );

  const totalPages  = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged       = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function setSearch(v)    { setSearchQuery(v); setPage(1); }
  function setFilter(v)    { setFilterVisibility(v); setPage(1); }
  function toggleSelect(id){ setSelectedBoards(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]); }
  function selectAll()     { setSelectedBoards([...filtered.map(b => b.id)]); }
  function clearSelected() { setSelectedBoards([]); }

  return (
    <div className="admin-boards">
      <AdminBoardToolbar
        searchQuery={searchQuery} onSearch={setSearch}
        filterVisibility={filterVisibility} onFilter={setFilter}
        selectedCount={selectedBoards.length} totalFiltered={filtered.length}
        viewMode={viewMode} onViewMode={setViewMode}
        onBulkPublic={() => onBulkToggleVisibility(selectedBoards, 'public', clearSelected)}
        onBulkPrivate={() => onBulkToggleVisibility(selectedBoards, 'private', clearSelected)}
        onBulkDelete={() => onBulkDelete(selectedBoards, clearSelected)}
        onClearSelection={clearSelected}
        onSelectAll={selectAll}
        onDeleteAll={onDeleteAllBoards}
        showDeleteAll={boards.length > 0}
      />

      <div className="boards-results">
        <div className="results-header">
          <span>{filtered.length} board{filtered.length !== 1 ? 's' : ''}</span>
          {filtered.length > 0 && (
            <button className="btn-link" onClick={selectAll}>Select all {filtered.length}</button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto', fontSize: 12, color: 'var(--tx-4)' }}>
            Per page:
            {[10, 25, 50].map(n => (
              <button key={n} onClick={() => { setPageSize(n); setPage(1); }}
                style={{ padding: '2px 8px', borderRadius: 4, fontSize: 12, cursor: 'pointer',
                  background: pageSize === n ? 'var(--a)' : 'var(--bg-3)',
                  color: pageSize === n ? '#fff' : 'var(--tx-2)',
                  border: '1px solid ' + (pageSize === n ? 'var(--a)' : 'var(--border)') }}>
                {n}
              </button>
            ))}
          </div>
        </div>

        {viewMode === 'grid' && (
          <AdminBoardGrid boards={paged} selectedBoards={selectedBoards}
            onToggleSelect={toggleSelect} onView={onViewBoard}
            onToggleVisibility={onToggleVisibility} onDelete={onDeleteBoard} />
        )}

        {viewMode === 'list' && (
          <AdminBoardList boards={paged} selectedBoards={selectedBoards} allFiltered={filtered.length}
            onToggleSelect={toggleSelect} onSelectAll={selectAll} onClearAll={clearSelected}
            onView={onViewBoard} onToggleVisibility={onToggleVisibility} onDelete={onDeleteBoard}
            formatRelativeTime={formatRelativeTime} />
        )}

        <AdminBoardPagination currentPage={currentPage} totalPages={totalPages} onPage={setPage} />
      </div>
    </div>
  );
}