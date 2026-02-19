import { useState, useCallback, useRef } from "react";
import { DEFAULTS } from "../constants/defaults.js";
import { useHistory } from "./useHistory.js";
import { useSelection } from "./useSelection.js";
import { useEraser } from "./useEraser.js";
import { useDrawingActions } from "./useDrawingActions.js";
import { useBoardPersistence } from "./useBoardPersistence.js";

export function useWhiteboard(boardId) {
  const [elements, setElements] = useState([]);
  const [tool, setTool] = useState(DEFAULTS.tool);
  const [color, setColor] = useState(DEFAULTS.color);
  const [strokeWidth, setStrokeWidth] = useState(DEFAULTS.strokeWidth);
  const [fontSize, setFontSize] = useState(DEFAULTS.fontSize);
  const [showGrid, setShowGrid] = useState(true);
  const [boardHeight, setBoardHeight] = useState(DEFAULTS.boardHeight);
  const [selectedId, setSelectedId] = useState(null);

  const boardWidth = DEFAULTS.boardWidth;
  const canvasElRef = useRef(null);
  const elementsRef = useRef(elements);
  elementsRef.current = elements;

  // ─── Compose sub-hooks ────────────────────────
  const { pushToHistory, undo, redo, clearAll, canUndo, canRedo } =
    useHistory(setElements, setSelectedId);

  const { selectAtPoint, deleteSelected, moveElementBy, resizeElementBy } =
    useSelection(setElements, selectedId, setSelectedId, pushToHistory);

  const { startErasing, eraseAtPoint, stopErasing } =
    useEraser(setElements, pushToHistory);

  const {
    isDrawing,
    currentElement,
    startDrawing,
    continueDrawing,
    stopDrawing,
    addTextElement,
    addNoteElement,
    addImageElement,
    addPastedText,
  } = useDrawingActions(
    setElements, elementsRef, pushToHistory,
    tool, color, strokeWidth, fontSize, setSelectedId
  );

  // ─── Persistence + save status ────────────────
  const { saveStatus } = useBoardPersistence(
    boardId, elements, setElements,
    boardHeight, setBoardHeight, canvasElRef
  );

  // ─── Board controls ───────────────────────────
  const extendBoard = useCallback(() => {
    setBoardHeight((h) => h + DEFAULTS.extendAmount);
  }, []);

  const toggleGrid = useCallback(() => {
    setShowGrid((g) => !g);
  }, []);

  return {
    // State
    elements,
    tool,
    color,
    strokeWidth,
    fontSize,
    isDrawing,
    currentElement,
    showGrid,
    boardWidth,
    boardHeight,
    canvasElRef,
    selectedId,
    setElements,
    saveStatus,

    // Setters
    setTool,
    setColor,
    setStrokeWidth,
    setFontSize,
    setSelectedId,

    // Drawing
    startDrawing,
    continueDrawing,
    stopDrawing,
    addTextElement,
    addNoteElement,
    addImageElement,
    addPastedText,

    // Selection
    selectAtPoint,
    deleteSelected,
    moveElementBy,
    resizeElementBy,

    // Eraser
    startErasing,
    eraseAtPoint,
    stopErasing,

    // History
    pushToHistory,
    undo,
    redo,
    clearAll,
    canUndo,
    canRedo,

    // Board
    extendBoard,
    toggleGrid,
  };
}