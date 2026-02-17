import { useRef, useEffect, useState, useCallback } from 'react';
import { TOOLS } from '../constants/tools.js';
import { NOTE_COLORS } from '../constants/colors.js';
import { getPointerPos, renderCanvas, isOnResizeHandle, getElementBounds } from '../utils/drawing/index.js';

export default function Canvas({
  elements, currentElement, tool, color, strokeWidth, fontSize,
  boardWidth, boardHeight, showGrid, selectedId,
  startDrawing, continueDrawing, stopDrawing,
  selectAtPoint, eraseAtPoint, startErasing, stopErasing,
  addTextElement, addNoteElement,
  pushToHistory, moveElementBy, resizeElementBy,
  canvasElRef,
  remoteCursors
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = boardWidth * dpr;
    canvas.height = boardHeight * dpr;
    canvas.style.width = boardWidth + 'px';
    canvas.style.height = boardHeight + 'px';
  }, [boardWidth, boardHeight]);

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

          ctx.fillStyle = cursor.color || "#ff0000";

          ctx.beginPath();
          ctx.arc(cursor.x, cursor.y, 6, 0, Math.PI * 2);
          ctx.fill();

          ctx.font = "12px sans-serif";
          ctx.fillStyle = "#000";
          ctx.fillText(cursor.userName, cursor.x + 8, cursor.y - 8);
        });
      }
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [elements, currentElement, selectedId, showGrid, boardWidth, boardHeight, remoteCursors]);

  const submitText = useCallback(() => {
    const ti = textInputRef.current;
    if (!ti || submittedRef.current) return;
    submittedRef.current = true;
    const ta = document.getElementById('canvas-text-area');
    const val = ta ? ta.value : '';
    if (!val.trim()) { setTextInput(null); return; }

    if (ti.isNote) {
      const w = ta ? ta.offsetWidth : 200;
      const h = ta ? ta.offsetHeight : 150;
      addNoteElement(val, ti.canvasX, ti.canvasY, fontSize, ti.bgColor, w, h);
    } else {
      const w = ta ? ta.offsetWidth : null;
      addTextElement(val, ti.canvasX, ti.canvasY, color, fontSize, w);
    }
    setTextInput(null);
  }, [addTextElement, addNoteElement, color, fontSize]);

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
          if (bounds && pos.x >= bounds.x - 8 && pos.x <= bounds.x + bounds.w + 8 &&
              pos.y >= bounds.y - 8 && pos.y <= bounds.y + bounds.h + 8) {
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
      const rect = canvas.getBoundingClientRect();
      submittedRef.current = false;
      setTextInput({
        screenX: e.clientX - rect.left,
        screenY: e.clientY - rect.top,
        canvasX: pos.x, canvasY: pos.y,
        isNote: false,
      });
      return;
    }

    if (tool === TOOLS.NOTE) {
      const rect = canvas.getBoundingClientRect();
      submittedRef.current = false;
      setTextInput({
        screenX: e.clientX - rect.left,
        screenY: e.clientY - rect.top,
        canvasX: pos.x, canvasY: pos.y,
        isNote: true,
        bgColor: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)],
      });
      return;
    }

    startDrawing(pos.x, pos.y);
  }, [tool, elements, selectedId, submitText, startDrawing, selectAtPoint, eraseAtPoint, startErasing, pushToHistory]);

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

  useEffect(() => {
    if (textInput) {
      submittedRef.current = false;
      setTimeout(() => {
        const ta = document.getElementById('canvas-text-area');
        if (ta) ta.focus();
      }, 20);
    }
  }, [textInput]);

  let cursor = 'crosshair';
  if (tool === TOOLS.TEXT || tool === TOOLS.NOTE) cursor = 'text';
  if (tool === TOOLS.SELECT) cursor = drag ? (drag.mode === 'resize' ? 'nwse-resize' : 'grabbing') : 'default';

  return (
    <div className="canvas-wrapper">
      <canvas
        ref={setCanvasRef}
        className="canvas-element"
        style={{ cursor }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
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
            fontSize: fontSize,
            color: textInput.isNote ? '#1a1a1a' : color,
            backgroundColor: textInput.isNote ? textInput.bgColor : 'transparent',
          }}
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
              setTextInput(null);
            }
          }}
        />
      )}
    </div>
  );
}
