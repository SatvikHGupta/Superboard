import { useRef, useEffect, useState, useCallback } from 'react';
import { TOOLS } from '../constants/tools.js';
import { NOTE_COLORS } from '../constants/colors.js';
import { getPointerPos, renderCanvas, isOnResizeHandle, getElementBounds, hitTest } from '../utils/drawing/index.js';

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
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const [textInput, setTextInput] = useState(null);
  const submittedRef = useRef(false);
  const textInputRef = useRef(textInput);
  textInputRef.current = textInput;

  const [drag, setDrag] = useState(null);
  const dragRef = useRef(null);
  dragRef.current = drag;

  function setCanvasRef(el) {
    canvasRef.current = el;
    if (canvasElRef) canvasElRef.current = el;
  }

  /* ── Canvas size (DPR-aware) ──────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = boardWidth * dpr;
    canvas.height = boardHeight * dpr;
    canvas.style.width = boardWidth + 'px';
    canvas.style.height = boardHeight + 'px';
  }, [boardWidth, boardHeight]);

  /* ── Render loop ──────────────────────────────── */
  useEffect(() => {
    function draw() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const allEls = currentElement ? [...elements, currentElement] : elements;
      renderCanvas(ctx, allEls, boardWidth, boardHeight, showGrid, selectedId);

      if (remoteCursors) {
        Object.values(remoteCursors).forEach(cursor => {
          if (!cursor) return;
          ctx.fillStyle = cursor.color || '#ff0000';
          ctx.beginPath();
          ctx.arc(cursor.x, cursor.y, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.font = '12px sans-serif';
          ctx.fillStyle = '#000';
          ctx.fillText(cursor.userName || '', cursor.x + 8, cursor.y - 8);
        });
      }
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [elements, currentElement, selectedId, showGrid, boardWidth, boardHeight, remoteCursors]);

  /* ── Submit text / note input ─────────────────── */
  const submitText = useCallback(() => {
    const ti = textInputRef.current;
    if (!ti || submittedRef.current) return;
    submittedRef.current = true;
    const ta = document.getElementById('canvas-text-area');
    const val = ta ? ta.value : '';

    if (!val.trim()) {
      // If we were editing an existing element, put it back
      if (ti.editingId && ti.originalElement) {
        // Nothing to restore — deleteElementById already ran on open,
        // so we re-add the original unchanged
        if (ti.isNote) {
          addNoteElement(
            ti.originalElement.text,
            ti.originalElement.startX,
            ti.originalElement.startY,
            ti.originalElement.fontSize,
            ti.originalElement.bgColor,
            ti.originalElement.width,
            ti.originalElement.height,
          );
        } else {
          addTextElement(
            ti.originalElement.text,
            ti.originalElement.startX,
            ti.originalElement.startY,
            ti.originalElement.color,
            ti.originalElement.fontSize,
            ti.originalElement.maxWidth,
          );
        }
      }
      setTextInput(null);
      return;
    }

    if (ti.isNote) {
      const w = ta ? ta.offsetWidth : (ti.originalElement?.width || 200);
      const h = ta ? ta.offsetHeight : (ti.originalElement?.height || 150);
      addNoteElement(val, ti.canvasX, ti.canvasY, fontSize, ti.bgColor, w, h);
    } else {
      const w = ta ? ta.offsetWidth : null;
      addTextElement(val, ti.canvasX, ti.canvasY, color, fontSize, w);
    }
    setTextInput(null);
  }, [addTextElement, addNoteElement, color, fontSize]);

  /* ── Open text input for a new element ───────── */
  function openTextInput(e, isNote, canvasX, canvasY) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    submittedRef.current = false;
    setTextInput({
      screenX: e.clientX - rect.left,
      screenY: e.clientY - rect.top,
      canvasX,
      canvasY,
      isNote,
      bgColor: isNote ? NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)] : undefined,
    });
  }

  /* ── Open text input to EDIT an existing element ─ */
  function openEditInput(e, el) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    // Delete the old element (history snapshot already pushed by double-click handler)
    deleteElementById(el.id);
    submittedRef.current = false;
    setTextInput({
      // Position the textarea at the element's actual location
      screenX: el.startX,
      screenY: el.startY,
      canvasX: el.startX,
      canvasY: el.startY,
      isNote: el.type === 'note',
      bgColor: el.bgColor,
      editingId: el.id,
      originalElement: el, // keep reference in case user cancels
    });
  }

  /* ── Pointer down ─────────────────────────────── */
  const handlePointerDown = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    const pos = getPointerPos(e, canvas);

    if (textInputRef.current) {
      submittedRef.current = false;
      submitText();
    }

    if (tool === TOOLS.SELECT) {
      if (selectedId) {
        const sel = elements.find(el => el.id === selectedId);
        if (sel) {
          const bounds = getElementBounds(sel);
          if (bounds && isOnResizeHandle(pos.x, pos.y, bounds)) {
            pushToHistory(elements);
            setDrag({ mode: 'resize', startX: pos.x, startY: pos.y });
            return;
          }
          if (
            bounds &&
            pos.x >= bounds.x - 8 && pos.x <= bounds.x + bounds.w + 8 &&
            pos.y >= bounds.y - 8 && pos.y <= bounds.y + bounds.h + 8
          ) {
            pushToHistory(elements);
            setDrag({ mode: 'move', startX: pos.x, startY: pos.y });
            return;
          }
        }
      }
      selectAtPoint(pos.x, pos.y);
      return;
    }

    if (tool === TOOLS.ERASER) {
      startErasing();
      eraseAtPoint(pos.x, pos.y);
      return;
    }

    if (tool === TOOLS.TEXT) {
      openTextInput(e, false, pos.x, pos.y);
      return;
    }

    if (tool === TOOLS.NOTE) {
      openTextInput(e, true, pos.x, pos.y);
      return;
    }

    startDrawing(pos.x, pos.y);
  }, [tool, elements, selectedId, submitText, startDrawing, selectAtPoint, eraseAtPoint, startErasing, pushToHistory]);

  /* ── Double click — re-edit text / note ──────── */
  const handleDoubleClick = useCallback((e) => {
    if (tool !== TOOLS.SELECT) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = getPointerPos(e, canvas);

    // Find element under cursor (prefer selectedId first)
    let target = elements.find(el => el.id === selectedId);
    if (!target) target = hitTest(elements, pos, 8);
    if (!target) return;
    if (target.type !== 'text' && target.type !== 'note') return;

    // Push history so the delete+re-add is one undo step
    pushToHistory(elements);
    openEditInput(e, target);
  }, [tool, elements, selectedId, pushToHistory]);

  /* ── Pointer move ─────────────────────────────── */
  const handlePointerMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = getPointerPos(e, canvas);

    if (dragRef.current) {
      const d = dragRef.current;
      const dx = pos.x - d.startX;
      const dy = pos.y - d.startY;
      if (d.mode === 'move') moveElementBy(selectedId, dx, dy);
      if (d.mode === 'resize') resizeElementBy(selectedId, dx, dy);
      setDrag({ ...d, startX: pos.x, startY: pos.y });
      return;
    }

    if (tool === TOOLS.ERASER) {
      eraseAtPoint(pos.x, pos.y);
      return;
    }

    continueDrawing(pos.x, pos.y);
  }, [tool, selectedId, continueDrawing, eraseAtPoint, moveElementBy, resizeElementBy]);

  /* ── Pointer up ───────────────────────────────── */
  const handlePointerUp = useCallback(() => {
    if (dragRef.current) {
      setDrag(null);
      return;
    }
    if (tool === TOOLS.ERASER) {
      stopErasing();
      return;
    }
    stopDrawing();
  }, [tool, stopDrawing, stopErasing]);

  /* ── Focus textarea when it appears ──────────── */
  useEffect(() => {
    if (textInput) {
      submittedRef.current = false;
      setTimeout(() => {
        const ta = document.getElementById('canvas-text-area');
        if (ta) {
          ta.focus();
          // Move cursor to end of pre-filled text
          const len = ta.value.length;
          ta.setSelectionRange(len, len);
        }
      }, 20);
    }
  }, [textInput]);

  /* ── Cursor style ─────────────────────────────── */
  let cursor = 'crosshair';
  if (tool === TOOLS.TEXT || tool === TOOLS.NOTE) cursor = 'text';
  if (tool === TOOLS.SELECT) {
    cursor = drag
      ? (drag.mode === 'resize' ? 'nwse-resize' : 'grabbing')
      : 'default';
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

      {textInput && (
        <textarea
          id="canvas-text-area"
          className={
            'canvas-text-input ' +
            (textInput.isNote ? 'canvas-text-input-note' : 'canvas-text-input-text')
          }
          style={{
            left: textInput.screenX,
            top: textInput.screenY,
            fontSize: textInput.originalElement?.fontSize || fontSize,
            color: textInput.isNote ? '#1a1a1a' : (textInput.originalElement?.color || color),
            backgroundColor: textInput.isNote
              ? (textInput.bgColor || '#fef08a')
              : 'transparent',
          }}
          defaultValue={textInput.originalElement?.text || ''}
          onBlur={() => {
            if (!submittedRef.current) submitText();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submittedRef.current = false;
              submitText();
            }
            if (e.key === 'Escape') {
              submittedRef.current = true;
              // If editing, restore original element
              if (textInputRef.current?.editingId && textInputRef.current?.originalElement) {
                const orig = textInputRef.current.originalElement;
                if (orig.type === 'note') {
                  addNoteElement(orig.text, orig.startX, orig.startY, orig.fontSize, orig.bgColor, orig.width, orig.height);
                } else {
                  addTextElement(orig.text, orig.startX, orig.startY, orig.color, orig.fontSize, orig.maxWidth);
                }
              }
              setTextInput(null);
            }
          }}
        />
      )}
    </div>
  );
}