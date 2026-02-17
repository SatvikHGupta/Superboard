import { useCallback, useRef } from "react";

const MAX_HISTORY = 60;

export function useHistory(setElements, setSelectedId) {
  const pastRef = useRef([]);
  const futureRef = useRef([]);

  const pushToHistory = useCallback((snapshot) => {
    pastRef.current = [
      ...pastRef.current.slice(-(MAX_HISTORY - 1)),
      snapshot,
    ];
    futureRef.current = [];
  }, []);

  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return;
    const previous = pastRef.current[pastRef.current.length - 1];
    pastRef.current = pastRef.current.slice(0, -1);
    setElements((prev) => {
      futureRef.current = [...futureRef.current, prev];
      return previous;
    });
    setSelectedId(null);
  }, [setElements, setSelectedId]);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    const next = futureRef.current[futureRef.current.length - 1];
    futureRef.current = futureRef.current.slice(0, -1);
    setElements((prev) => {
      pastRef.current = [...pastRef.current, prev];
      return next;
    });
    setSelectedId(null);
  }, [setElements, setSelectedId]);

  const clearAll = useCallback(() => {
    setElements((prev) => {
      if (prev.length === 0) return prev;
      pushToHistory(prev);
      return [];
    });
    setSelectedId(null);
  }, [setElements, setSelectedId, pushToHistory]);

  const canUndo = pastRef.current.length > 0;
  const canRedo = futureRef.current.length > 0;

  return { pushToHistory, undo, redo, clearAll, canUndo, canRedo };
}
