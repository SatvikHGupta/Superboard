// src/components/whiteboard/Whiteboard.jsx

import { useState, useEffect, useRef }    from 'react';
import { TOOLS }                           from '../../constants/tools.js';
import { SHORTCUTS }                       from '../../constants/shortcuts.js';
import { getCachedImage }                  from '../../utils/drawing/index.js';
import { WhiteboardProvider,
         useWhiteboardContext }            from '../../context/WhiteboardContext.jsx';
import WhiteboardHeader                    from './WhiteboardHeader.jsx';
import ExtendButton                        from './ExtendButton.jsx';
import Toolbar                             from '../toolbar/Toolbar.jsx';
import Canvas                              from '../Canvas.jsx';
import ShortcutsModal                      from '../ShortcutsModal.jsx';
import ShareModal                          from '../ShareModal.jsx';

function WhiteboardInner({ onBack }) {
  const {
    wb, boardId, boardData, setBoardData, boardLoading, boardMissing,
    isOwner, isEditor, canDraw,
    remoteCursors, onCursorMove,
    deleteElementById,
  } = useWhiteboardContext();

  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showShare,     setShowShare]     = useState(false);

  const prevToolRef = useRef(wb.tool);
  useEffect(() => {
    if (prevToolRef.current !== wb.tool && wb.isDrawing) wb.stopDrawing();
    prevToolRef.current = wb.tool;
  }, [wb.tool, wb.isDrawing, wb.stopDrawing]);

  /* ── Keyboard shortcuts ─────────────────────────────────────────────── */
  useEffect(() => {
    function handleKey(e) {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); wb.undo(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); wb.redo(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); wb.manualSave(); return; }

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

  /* ── Paste handler ──────────────────────────────────────────────────── */
  useEffect(() => {
    function handlePaste(e) {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file   = item.getAsFile();
          const reader = new FileReader();

          reader.onload = ev => {
            const dataUrl = ev.target.result;
            const img     = new Image();
            img.onload = () => {
              let w = img.width, h = img.height;
              const MAX = 800;
              if (w > MAX || h > MAX) {
                if (w >= h) { h = Math.round(h * MAX / w); w = MAX; }
                else        { w = Math.round(w * MAX / h); h = MAX; }
              }
              const offscreen = document.createElement('canvas');
              offscreen.width  = w;
              offscreen.height = h;
              offscreen.getContext('2d').drawImage(img, 0, 0, w, h);
              const compressed = offscreen.toDataURL('image/jpeg', 0.65);
              getCachedImage(compressed);
              wb.addImageElement(compressed, 100, 100, w, h);
            };
            img.src = dataUrl;
          };
          reader.readAsDataURL(file);
          return;
        }
      }

      const text = e.clipboardData.getData('text/plain');
      if (text?.trim()) {
        e.preventDefault();
        wb.addTextElement(text.trim(), 100, 100, wb.color, wb.fontSize, null);
      }
    }

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [wb]);

  /* ── Loading / error states ─────────────────────────────────────────── */
  if (boardLoading) {
    return (
      <div className="error-page">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
            stroke="var(--a)" strokeWidth="2"
            style={{ animation: 'spin 1s linear infinite' }}>
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
          <span style={{ color: 'var(--tx-3)', fontSize: 14 }}>Loading board…</span>
        </div>
      </div>
    );
  }

  if (boardMissing) {
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
        boardData={boardData}
        isOwner={isOwner}
        isEditor={isEditor}
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
        saveStatus={wb.saveStatus}
        saveTimestamp={wb.saveTimestamp}
        onManualSave={wb.manualSave}
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
        canDraw={canDraw}
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
          deleteElementById={deleteElementById}
          canvasElRef={wb.canvasElRef}
          remoteCursors={remoteCursors}
          onCursorMove={onCursorMove}
          canDraw={canDraw}
        />
      </main>

      <ExtendButton onExtend={wb.extendBoard} />

      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}

      {showShare && (
        <ShareModal
          boardId={boardId}
          boardData={boardData}
          onBoardUpdate={setBoardData}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}

export default function Whiteboard({ boardId, onBack, user }) {
  return (
    <WhiteboardProvider boardId={boardId} user={user}>
      <WhiteboardInner onBack={onBack} />
    </WhiteboardProvider>
  );
}