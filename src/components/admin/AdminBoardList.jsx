export default function AdminBoardList({ boards, selectedBoards, allFiltered, onToggleSelect, onSelectAll, onClearAll, onView, onToggleVisibility, onDelete, formatRelativeTime }) {
  const allSelected = selectedBoards.length === allFiltered && allFiltered > 0;

  return (
    <div className="boards-list">
      <table className="boards-table">
        <thead>
          <tr>
            <th style={{ width: 40 }}>
              <input type="checkbox" checked={allSelected}
                onChange={() => allSelected ? onClearAll() : onSelectAll()} />
            </th>
            <th>Board</th><th>Owner</th><th>Visibility</th><th>Editors</th><th>Updated</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {boards.map(board => (
            <tr key={board.id} className={selectedBoards.includes(board.id) ? 'selected' : ''}>
              <td>
                <input type="checkbox" checked={selectedBoards.includes(board.id)}
                  onChange={() => onToggleSelect(board.id)} />
              </td>
              <td>
                <div className="table-board-cell">
                  <div className="table-board-thumb">
                    {board.thumbnail
                      ? <img src={board.thumbnail} alt="" />
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                    }
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
              <td><span className={'badge badge-' + (board.visibility === 'public' ? 'green' : 'amber')}>{board.visibility}</span></td>
              <td><span style={{ fontSize: 13, color: 'var(--tx-3)' }}>{Array.isArray(board.editors) ? board.editors.length : 0}</span></td>
              <td className="table-date">{formatRelativeTime(board.updatedAt)}</td>
              <td>
                <div className="table-actions">
                  <button className="btn-icon" onClick={() => onToggleVisibility(board.id, board.visibility)} title="Toggle visibility">
                    {board.visibility === 'public'
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                    }
                  </button>
                  <button className="btn-icon" onClick={() => onView(board)} title="View details">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                  <button className="btn-icon btn-danger" onClick={() => onDelete(board.id)} title="Move to bin">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
