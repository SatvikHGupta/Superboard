// src/hooks/useWhiteboard.js
// v1.4.1 fixes:
// • markLocal is now properly received from useBoardPersistence and passed
//   to all sub-hooks that need it (was always undefined before — BUG-1).
// • markLocal is also passed to useSelection so move/resize/delete of ANY
//   element (including remote ones) is persisted (BUG-3).
// • setBoardHeight is exposed in the return value so WhiteboardContext can
//   drive boardHeight updates from its single onBoardChange listener,
//   eliminating the duplicate listener that was in useBoardPersistence.

import { useState, useCallback, useRef } from 'react';
import { DEFAULTS }            from '../constants/defaults.js';
import { useHistory }          from './useHistory.js';
import { useSelection }        from './useSelection.js';
import { useEraser }           from './useEraser.js';
import { useDrawingActions }   from './useDrawingActions.js';
import { useBoardPersistence } from './useBoardPersistence.js';

export function useWhiteboard(boardId) {
  const [elements,    setElements]    = useState([]);
  const [tool,        setTool]        = useState(DEFAULTS.tool);
  const [color,       setColor]       = useState(DEFAULTS.color);
  const [strokeWidth, setStrokeWidth] = useState(DEFAULTS.strokeWidth);
  const [fontSize,    setFontSize]    = useState(DEFAULTS.fontSize);
  const [showGrid,    setShowGrid]    = useState(true);
  const [boardHeight, setBoardHeight] = useState(DEFAULTS.boardHeight);
  const [selectedId,  setSelectedId]  = useState(null);

  const boardWidth    = DEFAULTS.boardWidth;
  const canvasElRef   = useRef(null);
  const elementsRef   = useRef(elements);
  elementsRef.current = elements;

  // Persistence initialised first so markLocal is available for sub-hooks.
  // markLocal is now actually returned (was missing before — BUG-1 fix).
  const { saveStatus, saveTimestamp, manualSave, markLocal } = useBoardPersistence(
    boardId, elements, setElements,
    boardHeight, setBoardHeight, canvasElRef,
  );

  const { pushToHistory, undo, redo, clearAll, canUndo, canRedo } =
    useHistory(setElements, setSelectedId, markLocal);

  // BUG-3 fix: markLocal passed so move/resize/delete of any element
  // (including remote ones dragged by this user) gets persisted.
  const { selectAtPoint, deleteSelected, moveElementBy, resizeElementBy } =
    useSelection(setElements, selectedId, setSelectedId, pushToHistory, markLocal);

  const { startErasing, eraseAtPoint, stopErasing } =
    useEraser(setElements, pushToHistory, markLocal);

  const {
    isDrawing, currentElement,
    startDrawing, continueDrawing, stopDrawing,
    addTextElement, addNoteElement, addImageElement, addPastedText,
  } = useDrawingActions(
    setElements, elementsRef, pushToHistory,
    tool, color, strokeWidth, fontSize, setSelectedId,
    markLocal,
  );

  const extendBoard = useCallback(() => setBoardHeight(h => h + DEFAULTS.extendAmount), []);
  const toggleGrid  = useCallback(() => setShowGrid(g => !g), []);

  return {
    elements, tool, color, strokeWidth, fontSize,
    isDrawing, currentElement, showGrid,
    boardWidth, boardHeight, canvasElRef, selectedId,
    setElements, saveStatus, saveTimestamp,

    // setBoardHeight exposed so WhiteboardContext can sync remote boardHeight
    // changes without a second Firestore listener (DESIGN-1 fix).
    setBoardHeight,

    setTool, setColor, setStrokeWidth, setFontSize, setSelectedId,

    startDrawing, continueDrawing, stopDrawing,
    addTextElement, addNoteElement, addImageElement, addPastedText,

    selectAtPoint, deleteSelected, moveElementBy, resizeElementBy,
    startErasing, eraseAtPoint, stopErasing,
    pushToHistory, undo, redo, clearAll, canUndo, canRedo,
    extendBoard, toggleGrid, manualSave,
  };
}