import { useCallback, useRef } from "react";
import { hitTest } from "../utils/drawing/index.js";

export function useEraser(setElements, pushToHistory) {
  const isErasingRef = useRef(false);
  const snapshotPushedRef = useRef(false);

  /* ── Start erasing (no args, just sets flag) ───── */
  const startErasing = useCallback(() => {
    isErasingRef.current = true;
    snapshotPushedRef.current = false;
  }, []);

  /* ── Erase at point (x, y) ────────────────────── */
  const eraseAtPoint = useCallback((x, y) => {
    if (!isErasingRef.current) return;
    setElements((prev) => {
      const found = hitTest(prev, { x, y }, 8);
      if (!found) return prev;
      if (!snapshotPushedRef.current) {
        snapshotPushedRef.current = true;
        pushToHistory(prev);
      }
      return prev.filter((e) => e.id !== found.id);
    });
  }, [setElements, pushToHistory]);

  /* ── Stop erasing ─────────────────────────────── */
  const stopErasing = useCallback(() => {
    isErasingRef.current = false;
    snapshotPushedRef.current = false;
  }, []);

  return { startErasing, eraseAtPoint, stopErasing };
}
