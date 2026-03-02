// isko 12vi fail nhi hone dena, ye ias nhi banega, WB ka 13th reason ho jaayga

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

  
  const { saveStatus, saveTimestamp, manualSave, markLocal } = useBoardPersistence(
    boardId, elements, setElements,
    boardHeight, setBoardHeight, canvasElRef,
  );

  const { pushToHistory, undo, redo, clearAll, canUndo, canRedo } =
    useHistory(setElements, setSelectedId, markLocal);

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

    // setBoardHeight exposed so WhiteboardContext can sync remote boardHeight, changes without a second Firestore listener
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