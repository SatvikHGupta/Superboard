// src/hooks/useSelection.js
// v1.4.1 fixes:
// • markLocal parameter added (BUG-3 fix).
// • moveElementBy and resizeElementBy call markLocal.add(id) so that dragging
//   or resizing ANY element — including one drawn by a remote user — is
//   registered as a local change and persisted on the next autosave.
//   Previously, moving a remote element only updated local React state; the
//   next Firestore snapshot would overwrite it with the original position.
// • deleteSelected calls markLocal.delete(id) so deleted elements are queued
//   for server removal even when deleted via keyboard shortcut.

import { useCallback } from 'react';
import { hitTest } from '../utils/drawing/index.js';

export function useSelection(setElements, selectedId, setSelectedId, pushToHistory, markLocal) {

  /* ── Select element at (x, y) ─────────────────── */
  const selectAtPoint = useCallback((x, y) => {
    setElements((curr) => {
      const found = hitTest(curr, { x, y }, 8);
      setSelectedId(found ? found.id : null);
      return curr;
    });
  }, [setElements, setSelectedId]);

  /* ── Delete selected ──────────────────────────── */
  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    setElements((prev) => {
      const idx = prev.findIndex((e) => e.id === selectedId);
      if (idx === -1) return prev;
      pushToHistory(prev);
      // Queue this element for server deletion regardless of who drew it
      markLocal?.delete(selectedId);
      setSelectedId(null);
      return prev.filter((e) => e.id !== selectedId);
    });
  }, [selectedId, setElements, setSelectedId, pushToHistory, markLocal]);

  /* ── Move element by incremental (dx, dy) ─────── */
  const moveElementBy = useCallback((id, dx, dy) => {
    if (!id) return;
    // Register as local so the updated position is saved — this is the
    // BUG-3 fix: without this, dragging a remote element would be lost on
    // the next Firestore snapshot that overwrites state with server data.
    markLocal?.add(id);
    setElements((prev) =>
      prev.map((el) => {
        if (el.id !== id) return el;
        const moved = { ...el };
        if (moved.points) {
          moved.points = moved.points.map((p) => ({
            x: p.x + dx,
            y: p.y + dy,
          }));
        }
        if ('startX' in moved) {
          moved.startX += dx;
          moved.startY += dy;
        }
        if ('endX' in moved) {
          moved.endX += dx;
          moved.endY += dy;
        }
        return moved;
      })
    );
  }, [setElements, markLocal]);

  /* ── Resize element by incremental (dx, dy) ───── */
  const resizeElementBy = useCallback((id, dx, dy) => {
    if (!id) return;
    // Same BUG-3 fix: register as local so resized dimensions are persisted.
    markLocal?.add(id);
    setElements((prev) =>
      prev.map((el) => {
        if (el.id !== id) return el;
        const r = { ...el };
        if (el.type === 'note' || el.type === 'image') {
          r.width  = Math.max(50, (el.width  || 200) + dx);
          r.height = Math.max(40, (el.height || 150) + dy);
        } else if (el.type === 'text') {
          r.maxWidth = Math.max(50, (el.maxWidth || 200) + dx);
        } else if ('endX' in el) {
          r.endX = el.endX + dx;
          r.endY = el.endY + dy;
        }
        return r;
      })
    );
  }, [setElements, markLocal]);

  return { selectAtPoint, deleteSelected, moveElementBy, resizeElementBy };
}