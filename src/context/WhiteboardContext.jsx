// Whiteboard ka amit shah

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

  // Keep a ref to wb.boardHeight so the onBoardChange callback can compare without needing wb in its dependency array.
  const boardHeightRef = useRef(wb.boardHeight);
  boardHeightRef.current = wb.boardHeight;

  // Board metadata - 2 fix ke baad ab single time listener h
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

        // Sync boardHeight if the server has a different value than local state. This keeps all clients in sync when someone extends the board.
        if (board.boardHeight && board.boardHeight !== boardHeightRef.current) {
          wb.setBoardHeight(board.boardHeight);
        }
      }
      setBoardLoading(false);
    });

    // onBoardChange uses onSnapshot matlab if the doc doesn't exist the callback is called immediately with null. Keep a timeout fallback as belt-and-suspenders for network edge cases.
    const timeout = setTimeout(() => {
      setBoardLoading(prev => {
        if (prev) { setBoardMissing(true); return false; }
        return prev;
      });
    }, 8000);

    return () => { unsub(); clearTimeout(timeout); };
  }, [boardId]);  // wb.setBoardHeight is stable (useCallback with no deps)

  // Cursor subscription 
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

  // Cursor broadcast callback
  const handleCursorMove = useCallback((x, y) => {
    if (!boardId || !user) return;
    broadcastCursor(boardId, user.uid, user.displayName || user.email, x, y);
  }, [boardId, user]);

  // Permission flags 
  const isOwner = !!(boardData && user && boardData.ownerId === user.uid);

  // chota banana, not kela wala banana, make wala banana

  const userEmailLower = user?.email?.toLowerCase() ?? '';
  const isEditor = !!(
    boardData && user && !isOwner &&
    Array.isArray(boardData.editors) &&
    boardData.editors.some(e => e.toLowerCase() === userEmailLower)
  );

  // Owner/editor ke alawa draw nhi hoga
  const canDraw = boardLoading ? false : (isOwner || isEditor);

  // Delete by id ka chotu
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