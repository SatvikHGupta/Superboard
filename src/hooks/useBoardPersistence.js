// src/hooks/useBoardPersistence.js
//
// BUG FIX: Previously, batchSetElements only wrote surviving elements — it never
// deleted Firestore documents for elements that were erased or cleared locally.
// onSnapshot would then read ALL documents including the "deleted" ones and
// restore them to the canvas.
//
// Fix: prevSavedIdsRef tracks the set of element IDs written in the last save.
// On each save we diff current IDs against that set and call batchDeleteElements
// for any IDs that have been removed.
//
// Other notes:
// • boardHeightRef prevents performSave from being recreated when boardHeight
//   changes — which would cause the autosave effect to re-run and produce a
//   spurious "saving" flash (the original save-loop bug).
// • skipNextAutosave guards against both element and board-height remote
//   updates from Firestore listeners triggering a redundant autosave.
// • generateThumbnail now imported from utils/thumbnail.js (extracted).

import { useState, useEffect, useRef, useCallback } from 'react';
import { onElementsChange, batchSetElements,
         batchDeleteElements }                      from '../firebase/elementService.js';
import { onBoardChange, updateBoard }               from '../firebase/boardService.js';
import { generateThumbnail }                        from '../utils/thumbnail.js';

const AUTOSAVE_DELAY_MS = 800;
const THUMB_THROTTLE_MS = 30_000;

// Attempt a board-doc update; silently skip on permission-denied.
// Editors can only write to elements/cursors subcollections, not the board
// document itself.  Swallowing the error here means the element save still
// shows "Saved" rather than "Failed" for editors.
async function tryUpdateBoard(boardId, data) {
  try {
    await updateBoard(boardId, data);
  } catch (err) {
    if (err?.code === 'permission-denied') return;
    throw err;
  }
}

export function useBoardPersistence(
  boardId,
  elements,
  setElements,
  boardHeight,
  setBoardHeight,
  canvasElRef,
) {
  const [saveStatus,    setSaveStatus]    = useState('saved');
  const [saveTimestamp, setSaveTimestamp] = useState(null);

  const saveTimerRef      = useRef(null);
  const elementsRef       = useRef(elements);
  const isManuallySaving  = useRef(false);
  const lastThumbTime     = useRef(0);

  // boardHeightRef lets performSave always read the latest boardHeight WITHOUT
  // having it as a useCallback dep (prevents save-loop recreation).
  const boardHeightRef    = useRef(boardHeight);
  boardHeightRef.current  = boardHeight;

  elementsRef.current = elements;

  // Tracks which element IDs were present at the last successful save so we
  // can compute the deletion diff on the next save.
  const prevSavedIdsRef = useRef(new Set());

  // Single flag shared by both Firestore listeners.  When set, the next
  // autosave effect tick is skipped — the incoming state change came from
  // the server, not from a local user action.
  const skipNextAutosave = useRef(false);

  // ── Firestore element listener — display only, never saves ─────────────
  useEffect(() => {
    if (!boardId) return;
    const unsub = onElementsChange(boardId, incoming => {
      skipNextAutosave.current = true;
      // Sync prevSavedIdsRef with what the server actually has, so our
      // deletion diff starts from the correct baseline after a remote update.
      prevSavedIdsRef.current = new Set(incoming.map(el => el.id));
      setElements(incoming);
    });
    return unsub;
  }, [boardId, setElements]);

  // ── Firestore board metadata listener ──────────────────────────────────
  useEffect(() => {
    if (!boardId) return;
    const unsub = onBoardChange(boardId, board => {
      if (board.boardHeight) {
        skipNextAutosave.current = true; // prevents save loop
        setBoardHeight(board.boardHeight);
      }
    });
    return unsub;
  }, [boardId, setBoardHeight]);

  // ── Core save — shared by autosave and manual save ─────────────────────
  // deps: only [boardId].  boardHeight read via ref.
  const performSave = useCallback(async (forceThumbnail = false) => {
    if (!boardId) return;
    try {
      const currentElements = elementsRef.current;
      const currentIds      = new Set(currentElements.map(el => el.id));

      // Compute which IDs were saved last time but are gone now
      const deletedIds = [...prevSavedIdsRef.current].filter(id => !currentIds.has(id));

      // Write surviving elements
      await batchSetElements(boardId, currentElements);

      // Delete removed elements from Firestore (the bug fix)
      if (deletedIds.length > 0) {
        await batchDeleteElements(boardId, deletedIds);
      }

      // Update the baseline for the next save
      prevSavedIdsRef.current = currentIds;

      // Board height — owner only (editor gets permission-denied, silently skipped)
      await tryUpdateBoard(boardId, { boardHeight: boardHeightRef.current });

      // Thumbnail — throttled; owner only
      const now = Date.now();
      if (forceThumbnail || now - lastThumbTime.current > THUMB_THROTTLE_MS) {
        const thumb = generateThumbnail(canvasElRef?.current);
        if (thumb) await tryUpdateBoard(boardId, { thumbnail: thumb });
        lastThumbTime.current = now;
      }

      const d = new Date();
      setSaveTimestamp(
        d.getHours().toString().padStart(2, '0') + ':' +
        d.getMinutes().toString().padStart(2, '0'),
      );
      setSaveStatus('saved');
    } catch (err) {
      console.error('Save failed:', err);
      setSaveStatus('error');
      throw err;
    }
  }, [boardId]); // boardHeight intentionally excluded — read via ref

  // ── Autosave — fires on local changes only ─────────────────────────────
  useEffect(() => {
    if (!boardId) return;

    if (skipNextAutosave.current) {
      skipNextAutosave.current = false;
      return;
    }

    setSaveStatus('saving');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(() => {
      performSave(false).catch(() => {});
    }, AUTOSAVE_DELAY_MS);

    return () => clearTimeout(saveTimerRef.current);
  }, [elements, boardHeight, boardId, performSave]);

  // ── Manual save — Ctrl+S or header button ─────────────────────────────
  const manualSave = useCallback(async () => {
    if (!boardId || isManuallySaving.current) return;
    isManuallySaving.current = true;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveStatus('saving');
    try {
      await performSave(true);
    } finally {
      isManuallySaving.current = false;
    }
  }, [boardId, performSave]);

  // ── Flush on unmount ───────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (boardId && elementsRef.current.length > 0) {
        batchSetElements(boardId, elementsRef.current).catch(() => {});
      }
    };
  }, [boardId]);

  return { saveStatus, saveTimestamp, manualSave };
}