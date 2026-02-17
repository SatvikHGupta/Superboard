import { useState } from 'react';
import ExportDropdown from './ExportDropdown.jsx';

export default function WhiteboardHeader({
  boardName, onBack, onUndo, onRedo, canUndo, canRedo,
  onClear, showGrid, onToggleGrid, onShowShortcuts,
  onShowShare, elements, boardWidth, boardHeight,
}) {
  return (
    <header className="wb-header glass-strong">
      <div className="wb-header-left">
        {/* Back */}
        <button className="btn-icon" onClick={onBack} title="Dashboard">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span className="wb-header-title">{boardName}</span>
      </div>

      <div className="wb-header-center">
        {/* Undo */}
        <button className="btn-icon" onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
        </button>
        {/* Redo */}
        <button className="btn-icon" onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.13-9.36L23 10"/></svg>
        </button>

        <div className="toolbar-divider" />

        {/* Clear */}
        <button className="btn-icon" onClick={onClear} title="Clear all">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m5-3h4a1 1 0 011 1v1H9V4a1 1 0 011-1z"/></svg>
        </button>
        {/* Grid */}
        <button
          className={'btn-icon' + (showGrid ? ' active' : '')}
          onClick={onToggleGrid}
          title="Toggle grid (Shift+G)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
        </button>
      </div>

      <div className="wb-header-right">
        {/* Export */}
        <ExportDropdown elements={elements} boardWidth={boardWidth} boardHeight={boardHeight} />

        {/* Share */}
        <button className="btn-icon" onClick={onShowShare} title="Share">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
        </button>

        <div className="toolbar-divider" />

        {/* Shortcuts */}
        <button className="btn-icon" onClick={onShowShortcuts} title="Keyboard shortcuts">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        </button>
      </div>
    </header>
  );
}
