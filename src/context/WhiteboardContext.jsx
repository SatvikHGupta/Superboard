// src/context/WhiteboardContext.jsx

import { createContext, useContext, useState, useEffect,
         useRef, useCallback }                         from 'react';
import { getBoard }                                    from '../firebase/boardService.js';
import { broadcastCursor, onCursorsChange,
         removeCursor }                                from '../firebase/cursorService.js';
import { useWhiteboard }                               from '../hooks/useWhiteboard.js';

const WhiteboardContext = createContext(null);

export function WhiteboardProvider({ boardId, user, children }) {
  const wb = useWhiteboard(boardId);

  const [remoteCursors, setRemoteCursors] = useState({});
  const [boardData,     setBoardData]     = useState(null);
  const [boardLoading,  setBoardLoading]  = useState(true);
  const [boardMissing,  setBoardMissing]  = useState(false);

  /* ── Load board metadata once ────────────────────────────────────────── */
  useEffect(() => {
    if (!boardId) return;
    getBoard(boardId)
      .then(b => { setBoardData(b || null); setBoardMissing(!b); })
      .catch(() => setBoardMissing(true))
      .finally(() => setBoardLoading(false));
  }, [boardId]);

  /* ── Cursor subscription ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!boardId || !user) return;
    const unsub = onCursorsChange(boardId, user.uid, cursorsArray => {
      const map = {};
      cursorsArray.forEach(c => { if (c.userId) map[c.userId] = c; });
      setRemoteCursors(map);
    });
    return () => {
      unsub();
      removeCursor(boardId, user.uid).catch(() => {});
    };
  }, [boardId, user]);

  /* ── Cursor broadcast callback ───────────────────────────────────────── */
  const handleCursorMove = useCallback((x, y) => {
    if (!boardId || !user) return;
    broadcastCursor(boardId, user.uid, user.displayName || user.email, x, y);
  }, [boardId, user]);

  /* ── Permission flags ────────────────────────────────────────────────── */
  const isOwner = !!(boardData && user && boardData.ownerId === user.uid);

  // BUG FIX: ShareModal stores editor emails as lowercase.
  // Always lowercase user.email before comparing so "Bob@Gmail.com"
  // matches the stored "bob@gmail.com" in the editors array.
  const userEmailLower = user?.email?.toLowerCase() ?? '';
  const isEditor = !!(
    boardData && user && !isOwner &&
    Array.isArray(boardData.editors) &&
    boardData.editors.some(e => e.toLowerCase() === userEmailLower)
  );

  const canDraw = isOwner || isEditor;

  /* ── Delete-by-id helper ─────────────────────────────────────────────── */
  const deleteElementById = useCallback((id) => {
    wb.setElements(prev => prev.filter(el => el.id !== id));
  }, [wb.setElements]);

  const value = {
    // Whiteboard hook (drawing, history, persistence)
    wb,

    // The raw boardId — used by ShareModal to avoid depending on boardData?.id
    boardId,

    // Board metadata
    boardData, setBoardData, boardLoading, boardMissing,

    // Permissions
    isOwner, isEditor, canDraw,

    // Collaboration
    remoteCursors, onCursorMove: handleCursorMove,

    // Helpers
    deleteElementById,
  };

  return (
    <WhiteboardContext.Provider value={value}>
      {children}
    </WhiteboardContext.Provider>
  );
}

export function useWhiteboardContext() {
  const ctx = useContext(WhiteboardContext);
  if (!ctx) throw new Error('useWhiteboardContext must be used inside WhiteboardProvider');
  return ctx;
}