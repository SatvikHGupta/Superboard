import { useEffect, useRef } from "react";
import {
  onElementsChange,
  batchSetElements
} from "../firebase/elementService";
import { onBoardChange, updateBoard } from "../firebase/boardService";

export function useBoardPersistence(
  boardId,
  elements,
  setElements,
  boardHeight,
  setBoardHeight,
  canvasElRef
) {
  const saveTimerRef = useRef(null);
  const elementsRef = useRef(elements);
  elementsRef.current = elements;

  /* realtime elements */
  useEffect(() => {
    if (!boardId) return;
    const unsub = onElementsChange(boardId, setElements);
    return unsub;
  }, [boardId, setElements]);

  /* realtime board metadata */
  useEffect(() => {
    if (!boardId) return;
    const unsub = onBoardChange(boardId, board => {
      if (board.boardHeight) setBoardHeight(board.boardHeight);
    });
    return unsub;
  }, [boardId, setBoardHeight]);

  /* autosave elements */
  useEffect(() => {
    if (!boardId) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(async () => {
      await batchSetElements(boardId, elements);
      await updateBoard(boardId, { boardHeight });
    }, 600);

    return () => clearTimeout(saveTimerRef.current);
  }, [elements, boardHeight, boardId]);

  /* save before unload */
  useEffect(() => {
    return () => {
      if (boardId) batchSetElements(boardId, elementsRef.current);
    };
  }, [boardId]);
}
