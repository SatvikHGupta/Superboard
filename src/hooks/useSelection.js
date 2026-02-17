import { useCallback } from "react";
import { hitTest } from "../utils/drawing/index.js";

export function useSelection(setElements, selectedId, setSelectedId, pushToHistory) {

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
      setSelectedId(null);
      return prev.filter((e) => e.id !== selectedId);
    });
  }, [selectedId, setElements, setSelectedId, pushToHistory]);

  /* ── Move element by incremental (dx, dy) ─────── */
  const moveElementBy = useCallback((id, dx, dy) => {
    if (!id) return;
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
        if ("startX" in moved) {
          moved.startX += dx;
          moved.startY += dy;
        }
        if ("endX" in moved) {
          moved.endX += dx;
          moved.endY += dy;
        }
        return moved;
      })
    );
  }, [setElements]);

  /* ── Resize element by incremental (dx, dy) ───── */
  const resizeElementBy = useCallback((id, dx, dy) => {
    if (!id) return;
    setElements((prev) =>
      prev.map((el) => {
        if (el.id !== id) return el;
        const r = { ...el };
        if (el.type === "note" || el.type === "image") {
          r.width = Math.max(50, (el.width || 200) + dx);
          r.height = Math.max(40, (el.height || 150) + dy);
        } else if (el.type === "text") {
          r.maxWidth = Math.max(50, (el.maxWidth || 200) + dx);
        } else if ("endX" in el) {
          r.endX = el.endX + dx;
          r.endY = el.endY + dy;
        }
        return r;
      })
    );
  }, [setElements]);

  return { selectAtPoint, deleteSelected, moveElementBy, resizeElementBy };
}
