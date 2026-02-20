// src/components/Canvas.jsx
//
// Responsibilities (after refactor):
//   1. DPR-aware canvas sizing
//   2. RAF render loop (delegates cursor drawing to utils/drawing/cursors.js)
//   3. Pointer event routing — delegates drag/resize to useCanvasDrag,
//      text overlay lifecycle to CanvasTextOverlay
//   4. Cursor broadcast throttle (40 ms)
//
// What moved out:
//   • Remote cursor drawing  → utils/drawing/cursors.js
//   • Drag / resize machine  → hooks/useCanvasDrag.js
//   • Textarea overlay JSX   → components/CanvasTextOverlay.jsx

import { useRef, useEffect, useState, useCallback } from 'react';
import { TOOLS }                from '../constants/tools.js';
import { NOTE_COLORS }          from '../constants/colors.js';
import {
  getPointerPos, renderCanvas,
  hitTest, drawRemoteCursors,
} from '../utils/drawing/index.js';
import { useCanvasDrag }        from '../hooks/useCanvasDrag.js';
import CanvasTextOverlay        from './CanvasTextOverlay.jsx';

export default function Canvas({
  elements, currentElement, tool, color, strokeWidth, fontSize,
  boardWidth, boardHeight, showGrid, selectedId,
  startDrawing, continueDrawing, stopDrawing,
  selectAtPoint, eraseAtPoint, startErasing, stopErasing,
  addTextElement, addNoteElement,
  pushToHistory, moveElementBy, resizeElementBy,
  deleteElementById,
  canvasElRef,
  remoteCursors,
  onCursorMove, // (x, y) => void — fires even in read-only so viewers appear
  canDraw,      // boolean — false = viewer: no drawing, toolbar disabled
}) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);

  // ── Text overlay state ──────────────────────────────────────────────────
  const [textInput, setTextInput] = useState(null);
  const submittedRef  = useRef(false);
  const textInputRef  = useRef(textInput);
  textInputRef.current = textInput;

  // ── Remote cursors ref (fresh data for RAF without adding to dep array) ─
  const remoteCursorsRef = useRef(remoteCursors);
  remoteCursorsRef.current = remoteCursors;

  // ── Cursor broadcast throttle — max 25 broadcasts / sec ────────────────
  const cursorThrottleRef = useRef(0);

  // ── Drag / resize hook ──────────────────────────────────────────────────
  const { dragRef, tryStartDrag, handleDragMove, stopDrag, dragCursor } =
    useCanvasDrag({ elements, selectedId, moveElementBy, resizeElementBy, pushToHistory });

  // Assign both the local ref and the forwarded parent canvasElRef
  function setCanvasRef(el) {
    canvasRef.current = el;
    if (canvasElRef) canvasElRef.current = el;
  }

  /* ── Canvas sizing (DPR-aware) ─────────────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width        = boardWidth  * dpr;
    canvas.height       = boardHeight * dpr;
    canvas.style.width  = boardWidth  + 'px';
    canvas.style.height = boardHeight + 'px';
  }, [boardWidth, boardHeight]);

  /* ── RAF render loop ───────────────────────────────────────────────────────
   * remoteCursors is intentionally excluded from deps — the loop reads
   * remoteCursorsRef.current so it always has fresh cursor data without
   * rescheduling RAF on every cursor update from other users (up to 25/sec).
   */
  useEffect(() => {
    function draw() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const allEls = currentElement ? [...elements, currentElement] : elements;
      renderCanvas(ctx, allEls, boardWidth, boardHeight, showGrid, selectedId);
      drawRemoteCursors(ctx, remoteCursorsRef.current);

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elements, currentElement, selectedId, showGrid, boardWidth, boardHeight]);
  // remoteCursors deliberately omitted — see note above

  /* ── Submit text / note ────────────────────────────────────────────────── */
  const submitText = useCallback(() => {
    const ti = textInputRef.current;
    if (!ti || submittedRef.current) return;
    submittedRef.current = true;

    const ta  = document.getElementById('canvas-text-area');
    const val = ta ? ta.value : '';

    if (!val.trim()) {
      // Empty — restore original element if editing an existing one
      if (ti.editingId && ti.originalElement) {
        const o = ti.originalElement;
        if (ti.isNote) addNoteElement(o.text, o.startX, o.startY, o.fontSize, o.bgColor, o.width, o.height);
        else           addTextElement(o.text, o.startX, o.startY, o.color, o.fontSize, o.maxWidth);
      }
      setTextInput(null);
      return;
    }

    if (ti.isNote) {
      const w = ta ? ta.offsetWidth  : (ti.originalElement?.width  || 200);
      const h = ta ? ta.offsetHeight : (ti.originalElement?.height || 150);
      addNoteElement(val, ti.canvasX, ti.canvasY, fontSize, ti.bgColor, w, h);
    } else {
      addTextElement(val, ti.canvasX, ti.canvasY, color, fontSize, ta ? ta.offsetWidth : null);
    }
    setTextInput(null);
  }, [addTextElement, addNoteElement, color, fontSize]);

  function openTextInput(e, isNote, canvasX, canvasY) {
    const rect = canvasRef.current.getBoundingClientRect();
    submittedRef.current = false;
    setTextInput({
      screenX: e.clientX - rect.left,
      screenY: e.clientY - rect.top,
      canvasX, canvasY, isNote,
      bgColor: isNote
        ? NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)]
        : undefined,
    });
  }

  function openEditInput(_e, el) {
    deleteElementById(el.id);
    submittedRef.current = false;
    setTextInput({
      screenX: el.startX, screenY: el.startY,
      canvasX: el.startX, canvasY: el.startY,
      isNote:  el.type === 'note',
      bgColor: el.bgColor,
      editingId:       el.id,
      originalElement: el,
    });
  }

  /* ── Pointer down ──────────────────────────────────────────────────────── */
  const handlePointerDown = useCallback((e) => {
    if (canDraw === false) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    const pos = getPointerPos(e, canvas);

    // Commit any in-progress text input first
    if (textInputRef.current) {
      submittedRef.current = false;
      submitText();
      return; // don't process pointer further until text is committed
    }

    if (tool === TOOLS.SELECT) {
      // Try drag / resize on the selected element first
      if (!tryStartDrag(pos)) {
        // No drag started — try to select a new element
        selectAtPoint(pos.x, pos.y);
      }
      return;
    }

    if (tool === TOOLS.ERASER) { startErasing(); eraseAtPoint(pos.x, pos.y); return; }
    if (tool === TOOLS.TEXT)   { openTextInput(e, false, pos.x, pos.y); return; }
    if (tool === TOOLS.NOTE)   { openTextInput(e, true,  pos.x, pos.y); return; }

    startDrawing(pos.x, pos.y);
  }, [canDraw, tool, elements, selectedId, submitText, tryStartDrag,
      startDrawing, selectAtPoint, eraseAtPoint, startErasing]);

  /* ── Double-click — re-edit text / note ───────────────────────────────── */
  const handleDoubleClick = useCallback((e) => {
    if (tool !== TOOLS.SELECT) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos    = getPointerPos(e, canvas);
    const target = elements.find(el => el.id === selectedId)
                || hitTest(elements, pos, 8);
    if (!target || (target.type !== 'text' && target.type !== 'note')) return;
    pushToHistory(elements);
    openEditInput(e, target);
  }, [tool, elements, selectedId, pushToHistory]);

  /* ── Pointer move ──────────────────────────────────────────────────────── */
  const handlePointerMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = getPointerPos(e, canvas);

    // Cursor broadcast — throttled at 40 ms; fires even in read-only mode
    if (onCursorMove) {
      const now = Date.now();
      if (now - cursorThrottleRef.current >= 40) {
        cursorThrottleRef.current = now;
        onCursorMove(pos.x, pos.y);
      }
    }

    if (canDraw === false) return;

    // If dragging/resizing, delegate to the drag hook
    if (handleDragMove(pos)) return;

    if (tool === TOOLS.ERASER) { eraseAtPoint(pos.x, pos.y); return; }
    continueDrawing(pos.x, pos.y);
  }, [canDraw, tool, selectedId, continueDrawing, eraseAtPoint,
      handleDragMove, onCursorMove]);

  /* ── Pointer up ────────────────────────────────────────────────────────── */
  const handlePointerUp = useCallback(() => {
    if (canDraw === false) return;
    if (stopDrag()) return;
    if (tool === TOOLS.ERASER) { stopErasing(); return; }
    stopDrawing();
  }, [canDraw, tool, stopDrag, stopDrawing, stopErasing]);

  /* ── CSS cursor ────────────────────────────────────────────────────────── */
  let cursor = 'crosshair';
  if (canDraw === false) {
    cursor = 'default';
  } else if (tool === TOOLS.TEXT || tool === TOOLS.NOTE) {
    cursor = 'text';
  } else if (tool === TOOLS.SELECT) {
    cursor = dragCursor || 'default';
  }

  return (
    <div className="canvas-wrapper">
      <canvas
        ref={setCanvasRef}
        className="canvas-element"
        style={{ cursor }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleDoubleClick}
      />

      <CanvasTextOverlay
        textInput={textInput}
        fontSize={fontSize}
        color={color}
        submittedRef={submittedRef}
        onSubmit={submitText}
        addTextElement={addTextElement}
        addNoteElement={addNoteElement}
        onClose={() => setTextInput(null)}
      />
    </div>
  );
}