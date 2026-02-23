// src/context/WhiteboardContext.jsx
// v1.4 fixes:
// • boardData now fed by onBoardChange real-time listener (not one-time getBoard),
//   so isEditor updates immediately when owner adds/removes the user.
// • Added boardLoading guard so canDraw is never incorrectly false while loading.
// • Listener cleanup on boardId / user change prevents stale callbacks.
//
// v1.4.1 fixes (DESIGN-1):
// • useBoardPersistence previously opened its own onBoardChange listener solely
//   to sync boardHeight.  That doubled Firestore read costs for every active
//   board.  boardHeight is now synced here — the single onBoardChange listener
//   this context already maintains calls wb.setBoardHeight when the server value
//   differs from local state.  useBoardPersistence no longer needs its own listener.
// • canDraw comment corrected: it was contradicting what the code actually does.

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

  // Keep a ref to wb.boardHeight so the onBoardChange callback can compare
  // without needing wb in its dependency array.
  const boardHeightRef = useRef(wb.boardHeight);
  boardHeightRef.current = wb.boardHeight;

  // ── Board metadata — single real-time listener ───────────────────────────
  // This is the ONLY onBoardChange subscription for this board.
  // Previously useBoardPersistence opened a second identical listener for
  // boardHeight — that has been removed (DESIGN-1 fix).
  //
  // Responsibilities:
  //   1. Drive boardData / boardMissing / boardLoading state.
  //   2. Sync boardHeight from server → local when the server value differs
  //      (e.g. another user extended the board).
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

        // Sync boardHeight if the server has a different value than local state.
        // This keeps all clients in sync when someone extends the board.
        if (board.boardHeight && board.boardHeight !== boardHeightRef.current) {
          wb.setBoardHeight(board.boardHeight);
        }
      }
      setBoardLoading(false);
    });

    // onBoardChange uses onSnapshot — if the doc doesn't exist the callback
    // is called immediately with null (v1.4 fix in boardService.js).
    // Keep a timeout fallback as belt-and-suspenders for network edge cases.
    const timeout = setTimeout(() => {
      setBoardLoading(prev => {
        if (prev) { setBoardMissing(true); return false; }
        return prev;
      });
    }, 8000);

    return () => { unsub(); clearTimeout(timeout); };
  }, [boardId]);  // wb.setBoardHeight is stable (useCallback with no deps)

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

  // Block drawing until permissions are confirmed — avoids granting draw
  // access before we know whether this user is owner or editor.
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