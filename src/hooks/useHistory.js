// src/hooks/useHistory.js
// v1.4: markLocal passed in to track element additions/deletions through
// undo/redo/clearAll operations.

import { useCallback, useRef, useState } from 'react';

const MAX_HISTORY = 60;

export function useHistory(setElements, setSelectedId, markLocal) {
  const pastRef   = useRef([]);
  const futureRef = useRef([]);

  const [undoDepth, setUndoDepth] = useState(0);
  const [redoDepth, setRedoDepth] = useState(0);

  const pushToHistory = useCallback((snapshot) => {
    pastRef.current   = [...pastRef.current.slice(-(MAX_HISTORY - 1)), snapshot];
    futureRef.current = [];
    setUndoDepth(pastRef.current.length);
    setRedoDepth(0);
  }, []);

  const undo = useCallback(() => {
    if (!pastRef.current.length) return;
    const previous = pastRef.current[pastRef.current.length - 1];
    pastRef.current = pastRef.current.slice(0, -1);

    setElements(prev => {
      futureRef.current = [...futureRef.current, prev];
      setRedoDepth(futureRef.current.length);

      // Update local ownership tracking
      if (markLocal) {
        const prevIds = new Set(prev.map(e => e.id));
        const nextIds = new Set(previous.map(e => e.id));
        // Elements removed by undo → mark for deletion
        prevIds.forEach(id => { if (!nextIds.has(id)) markLocal.delete(id); });
        // Elements restored by undo → mark as local so they get saved
        nextIds.forEach(id => { if (!prevIds.has(id)) markLocal.restore(id); });
      }

      return previous;
    });

    setUndoDepth(pastRef.current.length);
    setSelectedId(null);
  }, [setElements, setSelectedId, markLocal]);

  const redo = useCallback(() => {
    if (!futureRef.current.length) return;
    const next = futureRef.current[futureRef.current.length - 1];
    futureRef.current = futureRef.current.slice(0, -1);

    setElements(prev => {
      pastRef.current = [...pastRef.current, prev];
      setUndoDepth(pastRef.current.length);

      if (markLocal) {
        const prevIds = new Set(prev.map(e => e.id));
        const nextIds = new Set(next.map(e => e.id));
        prevIds.forEach(id => { if (!nextIds.has(id)) markLocal.delete(id); });
        nextIds.forEach(id => { if (!prevIds.has(id)) markLocal.restore(id); });
      }

      return next;
    });

    setRedoDepth(futureRef.current.length);
    setSelectedId(null);
  }, [setElements, setSelectedId, markLocal]);

  const clearAll = useCallback(() => {
    setElements(prev => {
      if (!prev.length) return prev;
      pushToHistory(prev);
      // Mark every element as pending deletion
      if (markLocal) prev.forEach(el => markLocal.delete(el.id));
      return [];
    });
    setSelectedId(null);
  }, [setElements, setSelectedId, pushToHistory, markLocal]);

  return {
    pushToHistory, undo, redo, clearAll,
    canUndo: undoDepth > 0,
    canRedo: redoDepth > 0,
  };
}