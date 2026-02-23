export default function AdminBoardGrid({ boards, selectedBoards, onToggleSelect, onView, onToggleVisibility, onDelete }) {
  return (
    <div className="boards-grid">
      {boards.map(board => (
        <div key={board.id} className={'board-card-admin' + (selectedBoards.includes(board.id) ? ' selected' : '')}>
          <div className="board-card-select">
            <input type="checkbox" checked={selectedBoards.includes(board.id)}
              onChange={() => onToggleSelect(board.id)} />
          </div>
          <div className="board-card-thumbnail" onClick={() => onView(board)}>
            {board.thumbnail
              ? <img src={board.thumbnail} alt={board.name} />
              : <div className="board-card-placeholder">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <path d="M3 15l4-4a2 2 0 012.8 0L15 16"/>
                  </svg>
                </div>
            }
            <span className={'visibility-badge badge-' + (board.visibility === 'public' ? 'green' : 'amber')}>
              {board.visibility}
            </span>
            {Array.isArray(board.editors) && board.editors.length > 0 && (
              <span style={{ position: 'absolute', bottom: 6, right: 6, fontSize: 10, color: 'var(--a-light)', background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 'var(--r-full)', padding: '1px 6px' }}>
                {board.editors.length} editor{board.editors.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="board-card-body">
            <h3 className="board-card-title">{board.name}</h3>
            <p className="board-card-owner">{board.ownerName || board.ownerEmail}</p>
          </div>
          <div className="board-card-actions">
            <button className="action-btn-small" onClick={() => onToggleVisibility(board.id, board.visibility)} title="Toggle visibility">
              {board.visibility === 'public' ? '🔒' : '🌐'}
            </button>
            <button className="action-btn-small action-view" onClick={() => onView(board)} title="View details">👁️</button>
            <button className="action-btn-small action-delete" onClick={() => onDelete(board.id)} title="Move to bin">🗑️</button>
          </div>
        </div>
      ))}
    </div>
  );
}
