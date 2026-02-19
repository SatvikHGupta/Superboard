import { useState, useEffect, useRef } from "react";
import {
  onElementsChange,
  batchSetElements
} from "../firebase/elementService";
import { onBoardChange, updateBoard } from "../firebase/boardService";
import { generateThumbnail } from "../utils/storage.js";

export function useBoardPersistence(
  boardId,
  elements,
  setElements,
  boardHeight,
  setBoardHeight,
  canvasElRef
) {
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'error'
  const saveTimerRef = useRef(null);
  const elementsRef = useRef(elements);
  elementsRef.current = elements;

  /* ── Realtime elements from Firestore ─────────── */
  useEffect(() => {
    if (!boardId) return;
    const unsub = onElementsChange(boardId, setElements);
    return unsub;
  }, [boardId, setElements]);

  /* ── Realtime board metadata from Firestore ───── */
  useEffect(() => {
    if (!boardId) return;
    const unsub = onBoardChange(boardId, board => {
      if (board.boardHeight) setBoardHeight(board.boardHeight);
    });
    return unsub;
  }, [boardId, setBoardHeight]);

  /* ── 2-step autosave ──────────────────────────── */
  useEffect(() => {
    if (!boardId) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    // Step 1 — write to localStorage immediately (instant, no network)
    try {
      localStorage.setItem('wb_els_' + boardId, JSON.stringify(elements));
    } catch (e) {
      // localStorage full — not critical, Firebase is source of truth
    }

    setSaveStatus('saving');

    // Step 2 — write to Firestore after 600ms debounce
    saveTimerRef.current = setTimeout(async () => {
      try {
        await batchSetElements(boardId, elements);
        await updateBoard(boardId, { boardHeight });

        // Generate and save thumbnail (top portion of canvas)
        const thumb = generateThumbnail(canvasElRef.current);
        if (thumb) {
          await updateBoard(boardId, { thumbnail: thumb });
        }

        setSaveStatus('saved');
      } catch (err) {
        console.error('Autosave failed:', err);
        setSaveStatus('error');
      }
    }, 600);

    return () => clearTimeout(saveTimerRef.current);
  }, [elements, boardHeight, boardId, canvasElRef]);

  /* ── Save on unmount (tab close / navigate away) ─ */
  useEffect(() => {
    return () => {
      if (boardId) {
        batchSetElements(boardId, elementsRef.current).catch(() => {});
      }
    };
  }, [boardId]);

  return { saveStatus };
}