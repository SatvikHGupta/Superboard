// src/components/dashboard/Dashboard.jsx
//
// Fix: Promise.all → Promise.allSettled so getEditorBoards permission-denied
// (common for users whose Firestore rules block array-contains on editors field)
// no longer silently kills the owned boards query too.

import { useState, useEffect, useCallback } from 'react';
import {
  getUserBoards,
  getEditorBoards,
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
  const [refreshing,   setRefreshing]   = useState(false);

  const loadBoards = useCallback(async () => {
    if (!user) return;

    // allSettled — if getEditorBoards is blocked by Firestore security rules
    // for this user, owned boards still load correctly.
    // (Promise.all would cancel both if either rejects.)
    const [ownedResult, sharedResult] = await Promise.allSettled([
      getUserBoards(user.uid),
      getEditorBoards(user.email),
    ]);

    if (ownedResult.status === 'fulfilled') {
      setOwnedBoards(ownedResult.value);
    } else {
      console.error('Failed to load owned boards:', ownedResult.reason);
      setOwnedBoards([]);
    }

    if (sharedResult.status === 'fulfilled') {
      setEditorBoards(sharedResult.value);
    } else {
      // Silently swallow — permission-denied on editors array-contains query
      // is expected for users who have no shared boards yet
      setEditorBoards([]);
    }
  }, [user]);

  useEffect(() => {
    async function initialLoad() {
      setLoading(true);
      await loadBoards();
      setLoading(false);
    }
    initialLoad();
  }, [loadBoards, user.uid]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadBoards();
    setRefreshing(false);
  }

  async function handleDelete(id) {
    if (!confirm('Delete this board permanently?')) return;
    try {
      await deleteBoardFirestore(id);
      setOwnedBoards(prev => prev.filter(b => b.id !== id));
    } catch {
      alert('Failed to delete board.');
    }
  }

  async function handleToggleVisibility(id) {
    const board  = ownedBoards.find(b => b.id === id);
    if (!board) return;
    const newVis = board.visibility === 'public' ? 'private' : 'public';
    try {
      await updateBoard(id, { visibility: newVis });
      setOwnedBoards(prev =>
        prev.map(b => b.id === id ? { ...b, visibility: newVis } : b),
      );
    } catch {
      alert('Failed to update visibility.');
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
        <CreateBoard user={user} onCreated={handleRefresh} />

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
            <div className="dash-section-title">
              My Boards
              {refreshing && (
                <svg
                  width="14" height="14" viewBox="0 0 24 24"
                  fill="none" stroke="var(--a)" strokeWidth="2"
                  style={{ animation: 'spin 1s linear infinite', marginLeft: 8 }}
                >
                  <path d="M21 12a9 9 0 11-6.219-8.56"/>
                </svg>
              )}
            </div>

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