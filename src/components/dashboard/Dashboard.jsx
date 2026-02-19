import { useState, useEffect, useCallback } from 'react';
import {
  getUserBoards,
  getEditorBoards,
  deleteBoard as deleteBoardFirestore,
  updateBoard,
} from '../../firebase/boardService.js';
import BoardCard from './BoardCard.jsx';
import CreateBoard from './CreateBoard.jsx';

const ADMIN_EMAILS = ['shg090404@gmail.com', 'face69troll69@gmail.com'];

export default function Dashboard({ user, onOpenBoard, onLogout }) {
  const [ownedBoards, setOwnedBoards] = useState([]);
  const [editorBoards, setEditorBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isAdmin = ADMIN_EMAILS.includes(user.email);

  const loadBoards = useCallback(async () => {
    if (!user) return;
    
    try {
      const [owned, shared] = await Promise.all([
        getUserBoards(user.uid),
        getEditorBoards(user.email),
      ]);
      
      // Sort by updatedAt or createdAt, newest first
      const sortedOwned = owned.sort((a, b) => {
        const aTime = a.updatedAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
        const bTime = b.updatedAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
      
      setOwnedBoards(sortedOwned);
      setEditorBoards(shared);
    } catch (err) {
      console.error('Failed to load boards:', err);
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
    } catch (err) {
      alert('Failed to delete board.');
    }
  }

  async function handleToggleVisibility(id) {
    const board = ownedBoards.find(b => b.id === id);
    if (!board) return;
    const newVis = board.visibility === 'public' ? 'private' : 'public';
    try {
      await updateBoard(id, { visibility: newVis });
      setOwnedBoards(prev =>
        prev.map(b => b.id === id ? { ...b, visibility: newVis } : b)
      );
    } catch (err) {
      alert('Failed to update visibility.');
    }
  }

  function formatDate(ts) {
    if (!ts) return '';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  function goToAdmin() {
    window.location.hash = '#/admin';
  }

  return (
    <div className="dash-page">
      <header className="dash-header glass-strong">
        <div className="dash-header-left">
          <span className="dash-header-logo">Superboard</span>
          {ownedBoards.length > 0 && (
            <span className="dash-header-count">{ownedBoards.length}</span>
          )}
        </div>
        <div className="dash-header-right">
          <span className="dash-user-email">{user.email}</span>
          {isAdmin && (
            <button
              className="btn btn-ghost"
              onClick={goToAdmin}
              style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <polyline points="2 17 12 22 22 17"/>
                <polyline points="2 12 12 17 22 12"/>
              </svg>
              Admin
            </button>
          )}
          <button className="btn btn-ghost" onClick={onLogout} style={{ padding: '6px 12px', fontSize: '13px' }}>
            Sign out
          </button>
        </div>
      </header>

      <div className="dash-content">
        <CreateBoard user={user} onCreated={handleRefresh} />

        {loading ? (
          <div className="dash-empty">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--a)" strokeWidth="2"
              style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }}>
              <path d="M21 12a9 9 0 11-6.219-8.56"/>
            </svg>
            <div className="dash-empty-text">Loading your boards...</div>
          </div>
        ) : (
          <>
            <div className="dash-section-title">
              My Boards
              {refreshing && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--a)" strokeWidth="2"
                  style={{ animation: 'spin 1s linear infinite', marginLeft: 8 }}>
                  <path d="M21 12a9 9 0 11-6.219-8.56"/>
                </svg>
              )}
            </div>

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
          </>
        )}
      </div>
    </div>
  );
}