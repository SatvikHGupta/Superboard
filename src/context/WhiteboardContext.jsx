// src/context/WhiteboardContext.jsx
// v1.4 fixes:
// • boardData now fed by onBoardChange real-time listener (not one-time getBoard),
//   so isEditor updates immediately when owner adds/removes the user.
// • Added boardLoading guard so canDraw is never incorrectly false while loading.
// • Listener cleanup on boardId / user change prevents stale callbacks.

import { createContext, useContext, useState, useEffect,
         useRef, useCallback }                         from 'react';
import { onBoardChange }                               from '../firebase/boardService.js';
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

  // ── Board metadata — real-time listener ──────────────────────────────────
  // Using onBoardChange instead of a one-time getBoard so that:
  //   1. When the owner adds this user as an editor, canDraw flips immediately.
  //   2. Board name / visibility changes propagate without a page reload.
  useEffect(() => {
    if (!boardId) return;
    setBoardLoading(true);
    setBoardMissing(false);

    const unsub = onBoardChange(boardId, (board) => {
      if (!board) {
        setBoardMissing(true);
        setBoardData(null);
      } else {
        setBoardData(board);
        setBoardMissing(false);
      }
      setBoardLoading(false);
    });

    // onBoardChange uses onSnapshot — if the doc doesn't exist, the callback
    // is never called. Set a timeout fallback so the loading spinner doesn't
    // hang forever on a missing board.
    const timeout = setTimeout(() => {
      setBoardLoading(prev => {
        if (prev) { setBoardMissing(true); return false; }
        return prev;
      });
    }, 8000);

    return () => { unsub(); clearTimeout(timeout); };
  }, [boardId]);

  // ── Cursor subscription ───────────────────────────────────────────────────
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

  // ── Cursor broadcast callback ─────────────────────────────────────────────
  const handleCursorMove = useCallback((x, y) => {
    if (!boardId || !user) return;
    broadcastCursor(boardId, user.uid, user.displayName || user.email, x, y);
  }, [boardId, user]);

  // ── Permission flags ──────────────────────────────────────────────────────
  const isOwner = !!(boardData && user && boardData.ownerId === user.uid);

  // Always lowercase before comparing — ShareModal stores emails lowercased.
  const userEmailLower = user?.email?.toLowerCase() ?? '';
  const isEditor = !!(
    boardData && user && !isOwner &&
    Array.isArray(boardData.editors) &&
    boardData.editors.some(e => e.toLowerCase() === userEmailLower)
  );

  // While loading we don't yet know permissions — don't block draw prematurely.
  // Once loaded, canDraw is true only for owner or editor.
  const canDraw = boardLoading ? false : (isOwner || isEditor);

  // ── Delete-by-id helper ───────────────────────────────────────────────────
  const deleteElementById = useCallback((id) => {
    wb.setElements(prev => prev.filter(el => el.id !== id));
  }, [wb.setElements]);

  const value = {
    wb,
    boardId,
    boardData, setBoardData, boardLoading, boardMissing,
    isOwner, isEditor, canDraw,
    remoteCursors, onCursorMove: handleCursorMove,
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