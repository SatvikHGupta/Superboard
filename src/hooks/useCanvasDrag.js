// src/hooks/useCanvasDrag.js
//
// Encapsulates the drag / resize state machine that was previously inlined
// inside Canvas.jsx.  Returns the current drag descriptor and event handlers
// that Canvas.jsx wires to pointer events.

import { useState, useRef, useCallback } from 'react';
import { getElementBounds, isOnResizeHandle } from '../utils/drawing/index.js';

/**
 * @param {{
 *   elements: object[],
 *   selectedId: string|null,
 *   moveElementBy: (id:string, dx:number, dy:number) => void,
 *   resizeElementBy: (id:string, dx:number, dy:number) => void,
 *   pushToHistory: (snapshot:object[]) => void,
 * }} opts
 */
export function useCanvasDrag({
  elements,
  selectedId,
  moveElementBy,
  resizeElementBy,
  pushToHistory,
}) {
  const [drag, setDrag] = useState(null);

  // Mirror drag into a ref so pointer-move handlers always read the latest
  // value without needing drag in their useCallback dependency arrays.
  const dragRef = useRef(null);
  dragRef.current = drag;

  /* ── tryStartDrag ──────────────────────────────────────────────────────
   * Call this from pointerDown (SELECT tool, with an active selection).
   * Returns true if a drag or resize was started — caller should return early.
   */
  const tryStartDrag = useCallback((pos) => {
    if (!selectedId) return false;

    const sel = elements.find(el => el.id === selectedId);
    if (!sel) return false;

    const bounds = getElementBounds(sel);
    if (!bounds) return false;

    // Bottom-right resize handle
    if (isOnResizeHandle(pos.x, pos.y, bounds)) {
      pushToHistory(elements);
      setDrag({ mode: 'resize', startX: pos.x, startY: pos.y });
      return true;
    }

    // Element body — move
    const pad = 8;
    if (
      pos.x >= bounds.x - pad && pos.x <= bounds.x + bounds.w + pad &&
      pos.y >= bounds.y - pad && pos.y <= bounds.y + bounds.h + pad
    ) {
      pushToHistory(elements);
      setDrag({ mode: 'move', startX: pos.x, startY: pos.y });
      return true;
    }

    return false;
  }, [elements, selectedId, pushToHistory]);

  /* ── handleDragMove ────────────────────────────────────────────────────
   * Call this from pointerMove when dragRef.current is non-null.
   * Returns true if a drag move was processed — caller should return early.
   */
  const handleDragMove = useCallback((pos) => {
    const d = dragRef.current;
    if (!d) return false;

    const dx = pos.x - d.startX;
    const dy = pos.y - d.startY;

    if (d.mode === 'move')   moveElementBy(selectedId, dx, dy);
    if (d.mode === 'resize') resizeElementBy(selectedId, dx, dy);

    setDrag({ ...d, startX: pos.x, startY: pos.y });
    return true;
  }, [selectedId, moveElementBy, resizeElementBy]);

  /* ── stopDrag ──────────────────────────────────────────────────────────
   * Call this from pointerUp.
   * Returns true if a drag was active and has now been cleared.
   */
  const stopDrag = useCallback(() => {
    if (!dragRef.current) return false;
    setDrag(null);
    return true;
  }, []);

  /* ── cursor helper ─────────────────────────────────────────────────────
   * Returns the CSS cursor string appropriate for the current drag state.
   */
  const dragCursor = drag
    ? (drag.mode === 'resize' ? 'nwse-resize' : 'grabbing')
    : null;

  return { drag, dragRef, tryStartDrag, handleDragMove, stopDrag, dragCursor };
}