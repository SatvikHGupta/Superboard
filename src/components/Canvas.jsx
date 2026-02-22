// src/components/Canvas.jsx
// v1.4: Added `scale` prop (default 1) for viewport fit on small screens.
//
// How scaling works without breaking pointer coordinates:
//   Pixel buffer:         boardWidth*dpr  ×  boardHeight*dpr  (always full res)
//   CSS display size:     boardWidth*scale × boardHeight*scale
//
//   getPointerPos reads getBoundingClientRect() → returns CSS display size.
//   It computes scaleX = logicalW / rect.width = boardWidth / (boardWidth*scale) = 1/scale.
//   So pointer → canvas coordinate conversion is automatically correct.
//   No extra math needed anywhere.
//
// All other logic is identical to v1.3.

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
  onCursorMove,
  canDraw,
  scale = 1,  // NEW: viewport fit scale, 0 < scale ≤ 1
}) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);

  const [textInput, setTextInput] = useState(null);
  const submittedRef  = useRef(false);
  const textInputRef  = useRef(textInput);
  textInputRef.current = textInput;

  const remoteCursorsRef = useRef(remoteCursors);
  remoteCursorsRef.current = remoteCursors;

  const cursorThrottleRef = useRef(0);

  const { tryStartDrag, handleDragMove, stopDrag, dragCursor } =
    useCanvasDrag({ elements, selectedId, moveElementBy, resizeElementBy, pushToHistory });

  function setCanvasRef(el) {
    canvasRef.current = el;
    if (canvasElRef) canvasElRef.current = el;
  }

  /* ── Canvas sizing — pixel buffer full res, CSS size scaled ───────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width        = boardWidth  * dpr;
    canvas.height       = boardHeight * dpr;
    canvas.style.width  = (boardWidth  * scale) + 'px';
    canvas.style.height = (boardHeight * scale) + 'px';
  }, [boardWidth, boardHeight, scale]);

  /* ── RAF render loop ───────────────────────────────────────────────────── */
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

  /* ── Submit text / note ────────────────────────────────────────────────── */
  const submitText = useCallback(() => {
    const ti = textInputRef.current;
    if (!ti || submittedRef.current) return;
    submittedRef.current = true;

    const ta  = document.getElementById('canvas-text-area');
    const val = ta ? ta.value : '';

    if (!val.trim()) {
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

    if (textInputRef.current) {
      submittedRef.current = false;
      submitText();
      return;
    }

    if (tool === TOOLS.SELECT) {
      if (!tryStartDrag(pos)) selectAtPoint(pos.x, pos.y);
      return;
    }

    if (tool === TOOLS.ERASER) { startErasing(); eraseAtPoint(pos.x, pos.y); return; }
    if (tool === TOOLS.TEXT)   { openTextInput(e, false, pos.x, pos.y); return; }
    if (tool === TOOLS.NOTE)   { openTextInput(e, true,  pos.x, pos.y); return; }

    startDrawing(pos.x, pos.y);
  }, [canDraw, tool, elements, selectedId, submitText, tryStartDrag,
      startDrawing, selectAtPoint, eraseAtPoint, startErasing]);

  /* ── Double-click ──────────────────────────────────────────────────────── */
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

    if (onCursorMove) {
      const now = Date.now();
      if (now - cursorThrottleRef.current >= 40) {
        cursorThrottleRef.current = now;
        onCursorMove(pos.x, pos.y);
      }
    }

    if (canDraw === false) return;
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