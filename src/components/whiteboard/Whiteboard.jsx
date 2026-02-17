import { useState, useEffect, useRef } from 'react';
import { TOOLS } from '../../constants/tools.js';
import { SHORTCUTS } from '../../constants/shortcuts.js';
import { getBoardById } from '../../utils/storage.js';
import { getCachedImage } from '../../utils/drawing/index.js';
import { useWhiteboard } from '../../hooks/useWhiteboard.js';
import WhiteboardHeader from './WhiteboardHeader.jsx';
import ExtendButton from './ExtendButton.jsx';
import Toolbar from '../toolbar/Toolbar.jsx';
import Canvas from '../Canvas.jsx';
import ShortcutsModal from '../ShortcutsModal.jsx';
import ShareModal from '../ShareModal.jsx';
import { broadcastCursor, onCursorsChange } from "../../firebase/cursorService.js";

export default function Whiteboard({ boardId, onBack }) {
  const wb = useWhiteboard(boardId);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [remoteCursors, setRemoteCursors] = useState({});

  const board = getBoardById(boardId);
  const boardName = board ? board.name : 'Whiteboard';

  const user = JSON.parse(localStorage.getItem("wb_user") || "null");

  function throttle(fn, delay) {
    let last = 0;
    return (...args) => {
      const now = Date.now();
      if (now - last >= delay) {
        last = now;
        fn(...args);
      }
    };
  }

  const throttledBroadcast = useRef(
    throttle((x, y) => {
      if (!boardId || !user) return;
      broadcastCursor(boardId, user.uid, user.displayName, x, y);
    }, 40)
  ).current;

  useEffect(() => {
    if (!boardId) return;
    const unsub = onCursorsChange(boardId, user?.uid, setRemoteCursors);
    return unsub;
  }, [boardId]);

  useEffect(() => {
    const canvas = wb.canvasElRef?.current;
    if (!canvas) return;

    function handleMove(e) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      throttledBroadcast(x, y);
    }

    canvas.addEventListener("mousemove", handleMove);
    return () => canvas.removeEventListener("mousemove", handleMove);
  }, [wb.canvasElRef, throttledBroadcast]);

  /* Keyboard shortcuts */
  useEffect(() => {
    function handleKey(e) {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); wb.undo(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); wb.redo(); return; }

      if (e.key === 'Backspace' || e.key === 'Delete') {
        if (wb.selectedId) { e.preventDefault(); wb.deleteSelected(); return; }
      }

      if (!e.shiftKey) return;
      const k = e.key.toUpperCase();

      for (const [toolId, shortcutKey] of Object.entries(SHORTCUTS)) {
        if (k === shortcutKey) { e.preventDefault(); wb.setTool(toolId); return; }
      }

      if (k === 'G') { e.preventDefault(); wb.toggleGrid(); }
      if (k === 'X') { e.preventDefault(); wb.clearAll(); }
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [wb]);

  /* Paste handler */
  useEffect(() => {
    function handlePaste(e) {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          const reader = new FileReader();

          reader.onload = (ev) => {
            const dataUrl = ev.target.result;
            const img = new Image();

            img.onload = () => {
              let w = img.width, h = img.height;
              if (w > 600) { h = h * (600 / w); w = 600; }
              if (h > 600) { w = w * (600 / h); h = 600; }

              getCachedImage(dataUrl);
              wb.addImageElement(dataUrl, 100, 100, Math.round(w), Math.round(h));
            };

            img.src = dataUrl;
          };

          reader.readAsDataURL(file);
          return;
        }
      }

      const text = e.clipboardData.getData('text/plain');
      if (text && text.trim()) {
        e.preventDefault();
        wb.addTextElement(text.trim(), 100, 100, wb.color, wb.fontSize, null);
      }
    }

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [wb]);

  if (!board) {
    return (
      <div className="error-page">
        <div className="error-card">
          <div className="error-icon">⚠️</div>
          <div className="error-title">Board not found</div>
          <div className="error-text">This board may have been deleted.</div>
          <button className="btn btn-primary" onClick={onBack}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="whiteboard-layout">
      <WhiteboardHeader
        boardName={boardName}
        onBack={onBack}
        onUndo={wb.undo}
        onRedo={wb.redo}
        canUndo={wb.canUndo}
        canRedo={wb.canRedo}
        onClear={wb.clearAll}
        showGrid={wb.showGrid}
        onToggleGrid={wb.toggleGrid}
        onShowShortcuts={() => setShowShortcuts(true)}
        onShowShare={() => setShowShare(true)}
        elements={wb.elements}
        boardWidth={wb.boardWidth}
        boardHeight={wb.boardHeight}
      />

      <Toolbar
        tool={wb.tool}
        setTool={wb.setTool}
        color={wb.color}
        setColor={wb.setColor}
        strokeWidth={wb.strokeWidth}
        setStrokeWidth={wb.setStrokeWidth}
        fontSize={wb.fontSize}
        setFontSize={wb.setFontSize}
      />

      <main className="whiteboard-main">
        <Canvas
          elements={wb.elements}
          currentElement={wb.currentElement}
          tool={wb.tool}
          color={wb.color}
          strokeWidth={wb.strokeWidth}
          fontSize={wb.fontSize}
          boardWidth={wb.boardWidth}
          boardHeight={wb.boardHeight}
          showGrid={wb.showGrid}
          selectedId={wb.selectedId}
          startDrawing={wb.startDrawing}
          continueDrawing={wb.continueDrawing}
          stopDrawing={wb.stopDrawing}
          selectAtPoint={wb.selectAtPoint}
          eraseAtPoint={wb.eraseAtPoint}
          startErasing={wb.startErasing}
          stopErasing={wb.stopErasing}
          addTextElement={wb.addTextElement}
          addNoteElement={wb.addNoteElement}
          pushToHistory={wb.pushToHistory}
          moveElementBy={wb.moveElementBy}
          resizeElementBy={wb.resizeElementBy}
          canvasElRef={wb.canvasElRef}
          remoteCursors={remoteCursors}
        />
      </main>

      <ExtendButton onExtend={wb.extendBoard} />

      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
      {showShare && <ShareModal boardId={boardId} onClose={() => setShowShare(false)} />}
    </div>
  );
}
