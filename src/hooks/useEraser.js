// Tumhari life ki galti ya uski yaade nhi mitegi

import { useCallback, useRef } from 'react';
import { hitTest } from '../utils/drawing/index.js';

export function useEraser(setElements, pushToHistory, markLocal) {
  const isErasingRef      = useRef(false);
  const snapshotPushedRef = useRef(false);

  const startErasing = useCallback(() => {
    isErasingRef.current      = true;
    snapshotPushedRef.current = false;
  }, []);

  const eraseAtPoint = useCallback((x, y) => {
    if (!isErasingRef.current) return;
    setElements(prev => {
      const found = hitTest(prev, { x, y }, 8);
      if (!found) return prev;
      if (!snapshotPushedRef.current) {
        snapshotPushedRef.current = true;
        pushToHistory(prev);
      }
      markLocal?.delete(found.id);
      return prev.filter(e => e.id !== found.id);
    });
  }, [setElements, pushToHistory, markLocal]);

  const stopErasing = useCallback(() => {
    isErasingRef.current      = false;
    snapshotPushedRef.current = false;
  }, []);

  return { startErasing, eraseAtPoint, stopErasing };
}