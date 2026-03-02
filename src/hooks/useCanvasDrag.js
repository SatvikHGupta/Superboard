// drag ko safely handle karenge isse - important

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

  // Mirror drag into a ref so pointer-move handlers always read the latest value without needing drag in their useCallback dependency arrays.
  const dragRef = useRef(null);
  dragRef.current = drag;

  /* tryStartDrag
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
      // Store elementId at drag-start so handleDragMove always targets the correct element even if selectedId changes during the drag.
      setDrag({ mode: 'resize', elementId: selectedId, startX: pos.x, startY: pos.y });
      return true;
    }

    // Element body — move - yeh ishq ishq h
    const pad = 8;
    if (
      pos.x >= bounds.x - pad && pos.x <= bounds.x + bounds.w + pad &&
      pos.y >= bounds.y - pad && pos.y <= bounds.y + bounds.h + pad
    ) {
      pushToHistory(elements);
      setDrag({ mode: 'move', elementId: selectedId, startX: pos.x, startY: pos.y });
      return true;
    }

    return false;
  }, [elements, selectedId, pushToHistory]);

  /*  handleDragMove */
  const handleDragMove = useCallback((pos) => {
    const d = dragRef.current;
    if (!d) return false;

    const dx = pos.x - d.startX;
    const dy = pos.y - d.startY;

    // Use d.elementId (captured at drag-start) not selectedId from closure
    if (d.mode === 'move')   moveElementBy(d.elementId, dx, dy);
    if (d.mode === 'resize') resizeElementBy(d.elementId, dx, dy);

    setDrag({ ...d, startX: pos.x, startY: pos.y });
    return true;
  }, [moveElementBy, resizeElementBy]);

  /* stopDrag  */
  const stopDrag = useCallback(() => {
    if (!dragRef.current) return false;
    setDrag(null);
    return true;
  }, []);

  /* cursor helper matlab Returns the CSS cursor string appropriate for the current drag state.
   */
  const dragCursor = drag
    ? (drag.mode === 'resize' ? 'nwse-resize' : 'grabbing')
    : null;

  return { drag, dragRef, tryStartDrag, handleDragMove, stopDrag, dragCursor };
}