import { useState, useEffect } from 'react';
import { getBoards, deleteBoard, toggleBoardVisibility } from '../../utils/storage.js';
import BoardCard from './BoardCard.jsx';
import CreateBoard from './CreateBoard.jsx';

export default function Dashboard({ user, onOpenBoard, onLogout }) {
  const [boards, setBoards] = useState([]);

  useEffect(() => {
    setBoards(getBoards(user.uid));
  }, [user.uid]);

  function refresh() {
    setBoards(getBoards(user.uid));
  }

  function handleDelete(id) {
    if (!confirm('Delete this board permanently?')) return;
    deleteBoard(id);
    refresh();
  }

  function handleToggleVisibility(id) {
    toggleBoardVisibility(id);
    refresh();
  }

  function formatDate(ts) {
    if (!ts) return '';
    return new Date(ts).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  /* Split boards: owned vs editor */
  const ownedBoards = boards.filter(b => b.ownerId === user.uid);
  /* TODO V2: Load editor boards from Firestore */
  const editorBoards = boards.filter(b => b.ownerId !== user.uid);

  return (
    <div className="dash-page">
      {/* Header */}
      <header className="dash-header glass-strong">
        <div className="dash-header-left">
          <span className="dash-header-logo">Whiteboard</span>
          {ownedBoards.length > 0 && (
            <span className="dash-header-count">{ownedBoards.length}</span>
          )}
        </div>
        <div className="dash-header-right">
          <span className="dash-user-email">{user.email}</span>
          <button className="btn btn-ghost" onClick={onLogout} style={{ padding: '6px 12px', fontSize: '13px' }}>
            Sign out
          </button>
        </div>
      </header>

      <div className="dash-content">
        {/* Create new board */}
        <CreateBoard userId={user.uid} userEmail={user.email} onCreated={refresh} />

        {/* My Boards */}
        <div className="dash-section-title">My Boards</div>

        {ownedBoards.length === 0 ? (
          <div className="dash-empty">
            <div className="dash-empty-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M12 8v8M8 12h8"/>
              </svg>
            </div>
            <div className="dash-empty-title">No boards yet</div>
            <div className="dash-empty-text">Create your first whiteboard above</div>
          </div>
        ) : (
          <div className="dash-grid">
            {ownedBoards.map(board => (
              <BoardCard
                key={board.id}
                board={board}
                onOpen={() => onOpenBoard(board.id)}
                onDelete={() => handleDelete(board.id)}
                onToggleVisibility={() => handleToggleVisibility(board.id)}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}

        {/* Editor Boards Section */}
        {editorBoards.length > 0 && (
          <>
            <div className="dash-section-title" style={{ marginTop: 32 }}>Shared with me</div>
            <div className="dash-grid">
              {editorBoards.map(board => (
                <BoardCard
                  key={board.id}
                  board={board}
                  onOpen={() => onOpenBoard(board.id)}
                  onDelete={null}
                  onToggleVisibility={null}
                  formatDate={formatDate}
                  isEditor
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
