// src/hooks/useHistory.js
//
// BUG FIX: canUndo / canRedo were previously derived from ref.current values.
// Since refs don't trigger re-renders, those boolean values were always stale —
// the Undo / Redo buttons in WhiteboardHeader never updated their disabled
// state correctly after an undo or redo operation.
//
// Fix: track stack depth in useState so React re-renders whenever the stacks
// change.  The actual history arrays stay in refs (no serialisation cost),
// and we only use state for the depth numbers that drive the UI.

import { useCallback, useRef, useState } from 'react';

const MAX_HISTORY = 60;

export function useHistory(setElements, setSelectedId) {
  const pastRef   = useRef([]);
  const futureRef = useRef([]);

  // State-backed depth counters — these drive canUndo / canRedo in the UI
  const [undoDepth, setUndoDepth] = useState(0);
  const [redoDepth, setRedoDepth] = useState(0);

  /* ── Push a snapshot onto the undo stack ─────────────────────────────── */
  const pushToHistory = useCallback((snapshot) => {
    pastRef.current = [
      ...pastRef.current.slice(-(MAX_HISTORY - 1)),
      snapshot,
    ];
    futureRef.current = [];
    setUndoDepth(pastRef.current.length);
    setRedoDepth(0);
  }, []);

  /* ── Undo ────────────────────────────────────────────────────────────── */
  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return;

    const previous = pastRef.current[pastRef.current.length - 1];
    pastRef.current = pastRef.current.slice(0, -1);

    setElements(prev => {
      futureRef.current = [...futureRef.current, prev];
      setRedoDepth(futureRef.current.length);
      return previous;
    });

    setUndoDepth(pastRef.current.length);
    setSelectedId(null);
  }, [setElements, setSelectedId]);

  /* ── Redo ────────────────────────────────────────────────────────────── */
  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;

    const next = futureRef.current[futureRef.current.length - 1];
    futureRef.current = futureRef.current.slice(0, -1);

    setElements(prev => {
      pastRef.current = [...pastRef.current, prev];
      setUndoDepth(pastRef.current.length);
      return next;
    });

    setRedoDepth(futureRef.current.length);
    setSelectedId(null);
  }, [setElements, setSelectedId]);

  /* ── Clear all (with undo support) ──────────────────────────────────── */
  const clearAll = useCallback(() => {
    setElements(prev => {
      if (prev.length === 0) return prev;
      pushToHistory(prev);
      return [];
    });
    setSelectedId(null);
  }, [setElements, setSelectedId, pushToHistory]);

  return {
    pushToHistory,
    undo,
    redo,
    clearAll,
    canUndo: undoDepth > 0,
    canRedo: redoDepth > 0,
  };
}