// src/components/whiteboard/WhiteboardHeader.jsx
//
// Refactored: SaveIndicator and ManualSaveButton are now imported from their
// own files instead of being defined inline here.
//
// v1.4.1 fix (BUG-4):
//   Pressing Escape during a rename previously saved the board anyway.
//   The sequence was: Escape → setIsRenaming(false) → input unmounts →
//   onBlur fires → saveRename() called.
//   Fix: an escapedRef tracks intent.  saveRename() bails out immediately
//   if the ref is true, and onRenameKey sets it before calling setIsRenaming.

import { useState, useRef } from 'react';
import { updateBoard }       from '../../firebase/boardService.js';
import ExportDropdown        from './ExportDropdown.jsx';
import SaveIndicator         from './SaveIndicator.jsx';
import ManualSaveButton      from './ManualSaveButton.jsx';

export default function WhiteboardHeader({
  boardData, isOwner, isEditor, onBack, onUndo, onRedo, canUndo, canRedo,
  onClear, showGrid, onToggleGrid, onShowShortcuts,
  onShowShare, elements, boardWidth, boardHeight,
  saveStatus, saveTimestamp, onManualSave,
}) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName,    setNewName]    = useState('');

  // BUG-4 fix: track when the user explicitly cancelled with Escape so that
  // the blur event (fired on unmount) does not trigger an unwanted save.
  const escapedRef = useRef(false);

  function startRename() {
    if (!isOwner) return;
    escapedRef.current = false;
    setNewName(boardData?.name || '');
    setIsRenaming(true);
  }

  async function saveRename() {
    // If the user pressed Escape, don't save — just reset the flag.
    if (escapedRef.current) { escapedRef.current = false; return; }
    if (!boardData || !newName.trim()) { setIsRenaming(false); return; }
    try {
      await updateBoard(boardData.id, { name: newName.trim() });
    } catch { alert('Failed to rename board'); }
    setIsRenaming(false);
  }

  function onRenameKey(e) {
    if (e.key === 'Enter') { e.preventDefault(); saveRename(); }
    if (e.key === 'Escape') {
      // Set the flag BEFORE setIsRenaming so the blur handler sees it
      escapedRef.current = true;
      setIsRenaming(false);
    }
  }

  const displayName = boardData?.name || 'Whiteboard';

  return (
    <header className="wb-header glass-strong">

      {/* ── Left: back · title · editor badge · autosave indicator ── */}
      <div className="wb-header-left">
        <button className="btn-icon" onClick={onBack} title="Dashboard">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {isRenaming ? (
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onBlur={saveRename}
            onKeyDown={onRenameKey}
            autoFocus
            style={{
              fontSize: 15, fontWeight: 600, padding: '2px 6px',
              border: '1px solid var(--a)', borderRadius: 4,
              background: 'var(--bg-3)', color: 'var(--tx-1)', maxWidth: 200,
            }}
          />
        ) : (
          <span
            className="wb-header-title"
            onDoubleClick={startRename}
            title={isOwner ? 'Double-click to rename' : ''}
            style={{ cursor: isOwner ? 'pointer' : 'default' }}
          >
            {displayName}
          </span>
        )}

        {isEditor && boardData && (
          <span
            style={{
              fontSize: 11, color: 'var(--tx-4)',
              background: 'var(--bg-3)', padding: '2px 6px', borderRadius: 4,
            }}
            title={`Owner: ${boardData.ownerEmail}`}
          >
            by {boardData.ownerName || boardData.ownerEmail}
          </span>
        )}

        <SaveIndicator status={saveStatus} timestamp={saveTimestamp} />
      </div>

      {/* ── Centre: undo · redo · clear · grid · manual save ── */}
      <div className="wb-header-center">
        <button className="btn-icon" onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
          </svg>
        </button>

        <button className="btn-icon" onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 11-2.13-9.36L23 10" />
          </svg>
        </button>

        <div className="toolbar-divider" />

        <button className="btn-icon" onClick={onClear} title="Clear all (Shift+X)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m5-3h4a1 1 0 011 1v1H9V4a1 1 0 011-1z" />
          </svg>
        </button>

        <button
          className={'btn-icon' + (showGrid ? ' active' : '')}
          onClick={onToggleGrid}
          title="Toggle grid (Shift+G)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="3"  y1="9"  x2="21" y2="9"  />
            <line x1="3"  y1="15" x2="21" y2="15" />
            <line x1="9"  y1="3"  x2="9"  y2="21" />
            <line x1="15" y1="3"  x2="15" y2="21" />
          </svg>
        </button>

        <div className="toolbar-divider" />

        {onManualSave && <ManualSaveButton onSave={onManualSave} />}
      </div>

      {/* ── Right: export · share · shortcuts ── */}
      <div className="wb-header-right">
        <ExportDropdown
          elements={elements}
          boardWidth={boardWidth}
          boardHeight={boardHeight}
          boardName={boardData?.name}
        />

        {isOwner && (
          <button className="btn-icon" onClick={onShowShare} title="Share">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5"  r="3" />
              <circle cx="6"  cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59"  y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51"  x2="8.59"  y2="10.49" />
            </svg>
          </button>
        )}

        <div className="toolbar-divider" />

        <button className="btn-icon" onClick={onShowShortcuts} title="Keyboard shortcuts">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12"    y2="12" />
            <line x1="12" y1="8"  x2="12.01" y2="8"  />
          </svg>
        </button>
      </div>
    </header>
  );
}