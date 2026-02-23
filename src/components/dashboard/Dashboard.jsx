// src/components/dashboard/Dashboard.jsx
// v1.4.1 optimisations:
//   • Replaced getDocs (one-shot reads) with onSnapshot real-time listeners
//     via onUserBoardsChange / onEditorBoardsChange.
//     Effect: newly created boards appear instantly with zero extra reads.
//     Each subsequent board metadata change (thumbnail, rename) triggers a
//     1-doc incremental update, not a full collection re-fetch.
//   • handleRefresh / refreshing state removed — no longer needed.
//   • onCreated now receives the new boardId and navigates directly to it,
//     so the user lands in the board immediately without a manual click.
//   • delete / visibility-toggle still use optimistic local state updates
//     (the listener will confirm in the background).

import { useState, useEffect } from 'react';
import {
  onUserBoardsChange,
  onEditorBoardsChange,
  deleteBoard as deleteBoardFirestore,
  updateBoard,
} from '../../firebase/boardService.js';
import DashboardHeader from './DashboardHeader.jsx';
import BoardCard       from './BoardCard.jsx';
import CreateBoard     from './CreateBoard.jsx';

export default function Dashboard({ user, onOpenBoard, onLogout }) {
  const [ownedBoards,  setOwnedBoards]  = useState([]);
  const [editorBoards, setEditorBoards] = useState([]);
  const [loading,      setLoading]      = useState(true);

  // ── Real-time owned-boards listener ──────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    let initialised = false;

    const unsub = onUserBoardsChange(user.uid, boards => {
      setOwnedBoards(boards);
      if (!initialised) { setLoading(false); initialised = true; }
    });

    return unsub;
  }, [user.uid]);

  // ── Real-time editor-boards listener ──────────────────────────────────────
  useEffect(() => {
    if (!user?.email) return;
    const unsub = onEditorBoardsChange(user.email, boards => {
      setEditorBoards(boards);
    });
    return unsub;
  }, [user.email]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  // After a board is created, navigate directly into it.
  // The real-time listener will add it to the dashboard list in the background.
  function handleBoardCreated(newBoardId) {
    onOpenBoard(newBoardId);
  }

  async function handleDelete(id) {
    if (!confirm('Delete this board permanently?')) return;
    // Optimistic — remove locally first; listener confirms.
    setOwnedBoards(prev => prev.filter(b => b.id !== id));
    try {
      await deleteBoardFirestore(id);
    } catch {
      alert('Failed to delete board.');
      // Listener will restore the board if deletion failed.
    }
  }

  async function handleToggleVisibility(id) {
    const board  = ownedBoards.find(b => b.id === id);
    if (!board) return;
    const newVis = board.visibility === 'public' ? 'private' : 'public';
    // Optimistic update
    setOwnedBoards(prev =>
      prev.map(b => b.id === id ? { ...b, visibility: newVis } : b),
    );
    try {
      await updateBoard(id, { visibility: newVis });
    } catch {
      alert('Failed to update visibility.');
      // Revert optimistic update
      setOwnedBoards(prev =>
        prev.map(b => b.id === id ? { ...b, visibility: board.visibility } : b),
      );
    }
  }

  function formatDate(ts) {
    if (!ts) return '';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  return (
    <div className="dash-page">
      <DashboardHeader
        user={user}
        boardCount={ownedBoards.length}
        onLogout={onLogout}
      />

      <div className="dash-content">
        <CreateBoard user={user} onCreated={handleBoardCreated} />

        {loading ? (
          <div className="dash-empty">
            <svg
              width="24" height="24" viewBox="0 0 24 24"
              fill="none" stroke="var(--a)" strokeWidth="2"
              style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }}
            >
              <path d="M21 12a9 9 0 11-6.219-8.56"/>
            </svg>
            <div className="dash-empty-text">Loading your boards...</div>
          </div>
        ) : (
          <>
            <div className="dash-section-title">My Boards</div>

            {ownedBoards.length === 0 ? (
              <div className="dash-empty">
                <div className="dash-empty-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.5">
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

            {editorBoards.length > 0 && (
              <>
                <div className="dash-section-title" style={{ marginTop: 32 }}>
                  Shared with me
                </div>
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
          </>
        )}
      </div>
    </div>
  );
}