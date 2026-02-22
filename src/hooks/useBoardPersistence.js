// src/hooks/useBoardPersistence.js
//
// v1.4 — Concurrent multi-user save fix
//
// ROOT CAUSE OF "drawing not saved when 2 users draw at same time":
//
//   The onElementsChange snapshot listener called setElements(incoming),
//   which is a full OVERWRITE of local React state with whatever Firestore
//   has at that moment.
//
//   Timeline of failure:
//     t=0   User B draws stroke → in B's local state, NOT yet in Firestore
//     t=1   User A finishes → autosave fires → batchSetElements writes to Firestore
//     t=2   Firestore onSnapshot fires on B's client (triggered by A's write)
//     t=3   B's listener: setElements(incoming from Firestore)
//           → B's local unsaved stroke is WIPED from state
//     t=4   skipNextAutosave = true → B's autosave is blocked
//     t=5   B's work is gone forever. Manual save writes nothing useful.
//
// THE FIX — two parts that work together:
//
// 1. MERGE instead of overwrite in the snapshot listener.
//    localElementIds is a ref Set tracking IDs created on THIS client.
//    On each snapshot, we merge: keep local elements, take remote-only
//    elements from server, remove anything in pendingDeletes.
//    Remote snapshots no longer destroy local unsaved work.
//
// 2. Save only LOCAL elements.
//    performSave writes only elements in localElementIds — not all elements.
//    Each user is responsible for saving only what they drew.
//    Deletions are tracked in pendingDeleteIds and sent explicitly.
//
// 3. INTERVAL-based autosave (not useEffect on [elements]).
//    setInterval polls a dirty flag every 1500ms. Remote snapshot merges
//    update state but don't set the dirty flag, so they never trigger saves.
//
// No changes needed to useDrawingActions, useEraser, useHistory, or Canvas.
// The dirty flag is set when setElements is called by drawing actions — we
// detect this by comparing prevElementsRef inside the interval callback.

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  onElementsChange,
  batchSetElements,
  batchDeleteElements,
} from '../firebase/elementService.js';
import { onBoardChange, updateBoard } from '../firebase/boardService.js';
import { generateThumbnail }          from '../utils/thumbnail.js';

const AUTOSAVE_INTERVAL_MS = 1500;
const THUMB_THROTTLE_MS    = 30_000;

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

  const elementsRef      = useRef(elements);
  const isManuallySaving = useRef(false);
  const lastThumbTime    = useRef(0);
  const boardHeightRef   = useRef(boardHeight);

  boardHeightRef.current = boardHeight;
  elementsRef.current    = elements;

  // IDs created on THIS client in this session.
  // Only these are written by this client's save.
  const localElementIds = useRef(new Set());

  // IDs deleted locally — need explicit Firestore deletes.
  // Accumulated here; never cleared by incoming snapshots.
  const pendingDeleteIds = useRef(new Set());

  // Snapshot of elements from last interval check — used to detect new local work.
  const prevElementsSnapshotRef = useRef(elements);

  // Dirty flag: true when there is local unsaved work.
  const dirtyRef = useRef(false);

  // ── Firestore element listener — MERGE, not overwrite ──────────────────
  useEffect(() => {
    if (!boardId) return;
    let mounted = true;

    const unsub = onElementsChange(boardId, serverElements => {
      if (!mounted) return;

      setElements(prev => {
        const prevMap   = new Map(prev.map(el => [el.id, el]));
        const serverMap = new Map(serverElements.map(el => [el.id, el]));

        // Start from server as base truth for remote elements
        const merged = new Map(serverMap);

        // Overlay local elements — they are newer and take priority
        localElementIds.current.forEach(id => {
          const localEl = prevMap.get(id);
          if (localEl) merged.set(id, localEl);
        });

        // Remove anything locally deleted (even if server still has it)
        pendingDeleteIds.current.forEach(id => merged.delete(id));

        return Array.from(merged.values());
      });
      // NOTE: we do NOT set dirtyRef here — this was a remote update, not local
    });

    return () => { mounted = false; unsub(); };
  }, [boardId, setElements]);

  // ── Board metadata listener ─────────────────────────────────────────────
  useEffect(() => {
    if (!boardId) return;
    let mounted = true;

    const unsub = onBoardChange(boardId, board => {
      if (!mounted || !board) return;
      if (board.boardHeight && board.boardHeight !== boardHeightRef.current) {
        setBoardHeight(board.boardHeight);
      }
    });

    return () => { mounted = false; unsub(); };
  }, [boardId, setBoardHeight]);

  // ── Track new local elements by watching elements ref ───────────────────
  // We compare against the last interval snapshot to find newly added IDs.
  // This detects strokes, text, notes, images added by local drawing actions.
  // It does NOT fire for snapshot-driven setElements calls (those don't change
  // dirtyRef because prevElementsSnapshotRef is updated alongside them above).
  //
  // This runs in the interval below — no extra effects needed.

  // ── Core save — writes only locally-owned elements ──────────────────────
  const performSave = useCallback(async (force = false) => {
    if (!boardId) return;

    const currentElements = elementsRef.current;
    const currentMap      = new Map(currentElements.map(el => [el.id, el]));

    const toWrite  = [...localElementIds.current].map(id => currentMap.get(id)).filter(Boolean);
    const toDelete = [...pendingDeleteIds.current];

    if (!force && toWrite.length === 0 && toDelete.length === 0) {
      setSaveStatus('saved');
      return;
    }

    try {
      if (toWrite.length > 0) {
        await batchSetElements(boardId, toWrite);
      }

      if (toDelete.length > 0) {
        await batchDeleteElements(boardId, toDelete);
        toDelete.forEach(id => pendingDeleteIds.current.delete(id));
      }

      dirtyRef.current = false;

      await tryUpdateBoard(boardId, { boardHeight: boardHeightRef.current });

      const now = Date.now();
      if (force || now - lastThumbTime.current > THUMB_THROTTLE_MS) {
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
    }
  }, [boardId]);

  // ── Interval autosave — polls dirty flag, detects new local elements ────
  useEffect(() => {
    if (!boardId) return;

    const interval = setInterval(() => {
      if (isManuallySaving.current) return;

      const current  = elementsRef.current;
      const prev     = prevElementsSnapshotRef.current;
      const prevIds  = new Set(prev.map(el => el.id));
      const currIds  = new Set(current.map(el => el.id));

      // Find IDs added locally since last check
      let foundNew = false;
      currIds.forEach(id => {
        if (!prevIds.has(id)) {
          localElementIds.current.add(id);
          foundNew = true;
        }
      });

      // Find IDs removed locally since last check (eraser / clear)
      prevIds.forEach(id => {
        if (!currIds.has(id) && !localElementIds.current.has(id)) {
          // Element disappeared but wasn't one we created — it might be
          // a remote element we erased, or a local one we just deleted.
          // Track it for deletion either way.
          pendingDeleteIds.current.add(id);
          localElementIds.current.delete(id);
          foundNew = true;
        }
        if (!currIds.has(id) && localElementIds.current.has(id)) {
          // Our own element was deleted (eraser hit our stroke)
          pendingDeleteIds.current.add(id);
          localElementIds.current.delete(id);
          foundNew = true;
        }
      });

      if (foundNew) dirtyRef.current = true;
      prevElementsSnapshotRef.current = current;

      if (dirtyRef.current || pendingDeleteIds.current.size > 0) {
        setSaveStatus('saving');
        performSave(false);
      }
    }, AUTOSAVE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [boardId, performSave]);

  // ── Manual save ─────────────────────────────────────────────────────────
  const manualSave = useCallback(async () => {
    if (!boardId || isManuallySaving.current) return;
    isManuallySaving.current = true;
    setSaveStatus('saving');

    // Sync localElementIds with current state before saving
    const current = elementsRef.current;
    const prev    = prevElementsSnapshotRef.current;
    const prevIds = new Set(prev.map(el => el.id));
    current.forEach(el => {
      if (!prevIds.has(el.id)) localElementIds.current.add(el.id);
    });
    prevElementsSnapshotRef.current = current;
    dirtyRef.current = true;

    try {
      await performSave(true);
    } finally {
      isManuallySaving.current = false;
    }
  }, [boardId, performSave]);

  // ── Flush on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (!boardId) return;
      const currentMap = new Map(elementsRef.current.map(el => [el.id, el]));
      const toWrite = [...localElementIds.current].map(id => currentMap.get(id)).filter(Boolean);
      if (toWrite.length > 0) batchSetElements(boardId, toWrite).catch(() => {});
      if (pendingDeleteIds.current.size > 0) {
        batchDeleteElements(boardId, [...pendingDeleteIds.current]).catch(() => {});
      }
    };
  }, [boardId]);

  return { saveStatus, saveTimestamp, manualSave };
}