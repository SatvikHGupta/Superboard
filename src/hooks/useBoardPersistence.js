// isko chedne waale tera monitor crt, iske bina kuch nhi hoga

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  onElementsChange,
  batchSetElements,
  batchDeleteElements,
} from '../firebase/elementService.js';
import { updateBoard } from '../firebase/boardService.js';
import { generateThumbnail } from '../utils/thumbnail.js';

const AUTOSAVE_INTERVAL_MS = 1500;
const THUMB_THROTTLE_MS    = 300_000; // 5 minutes

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
  const lastSavedBoardHeightRef = useRef(null); // null = not saved yet

  boardHeightRef.current = boardHeight;
  elementsRef.current    = elements;

  const localElementIds  = useRef(new Set());
  const pendingDeleteIds = useRef(new Set());
  const prevElementsSnapshotRef = useRef(elements);
  const dirtyRef = useRef(false);

  // markLocal ye stable API object h jo kaafi important h
  const markLocal = useRef({
    add(id) {
      localElementIds.current.add(id);
      pendingDeleteIds.current.delete(id);
      dirtyRef.current = true;
    },
    delete(id) {
      localElementIds.current.delete(id);
      pendingDeleteIds.current.add(id);
      dirtyRef.current = true;
    },
    restore(id) {
      localElementIds.current.add(id);
      pendingDeleteIds.current.delete(id);
      dirtyRef.current = true;
    },
  });

  // Firestore element listener ye MERGE karega, not overwrite 
  useEffect(() => {
    if (!boardId) return;
    let mounted = true;

    const unsub = onElementsChange(boardId, serverElements => {
      if (!mounted) return;

      setElements(prev => {
        const prevMap   = new Map(prev.map(el => [el.id, el]));
        const serverMap = new Map(serverElements.map(el => [el.id, el]));

        const merged = new Map(serverMap);

        localElementIds.current.forEach(id => {
          const localEl = prevMap.get(id);
          if (localEl) merged.set(id, localEl);
        });

        pendingDeleteIds.current.forEach(id => merged.delete(id));

        return Array.from(merged.values());
      });
    });

    return () => { mounted = false; unsub(); };
  }, [boardId, setElements]);

  //  Core save
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

      // Only clear dirty flag on success agar failure keeps it true so next interval retries automatically.
      dirtyRef.current = false;

      // Build a single update object to avoid multiple round trips.
      const boardUpdate = {};

      // Only include boardHeight when it changed since last successful save.
      const currentHeight = boardHeightRef.current;
      if (currentHeight !== lastSavedBoardHeightRef.current) {
        boardUpdate.boardHeight = currentHeight;
      }

      // Thumbnail: throttled, and only when force or interval elapsed.
      const now = Date.now();
      if (force || now - lastThumbTime.current > THUMB_THROTTLE_MS) {
        const thumb = generateThumbnail(canvasElRef?.current);
        if (thumb) {
          boardUpdate.thumbnail = thumb;
          lastThumbTime.current = now;
        }
      }

      // Only write to Firestore if there's actually something to update.
      if (Object.keys(boardUpdate).length > 0) {
        await tryUpdateBoard(boardId, boardUpdate);
        // Mark boardHeight as saved only after a successful write.
        if (boardUpdate.boardHeight !== undefined) {
          lastSavedBoardHeightRef.current = boardUpdate.boardHeight;
        }
      }

      const d = new Date();
      setSaveTimestamp(
        d.getHours().toString().padStart(2, '0') + ':' +
        d.getMinutes().toString().padStart(2, '0'),
      );
      setSaveStatus('saved');
    } catch (err) {
      console.error('Save failed:', err);
      // dirtyRef stays true matlab next interval me will retry.
      setSaveStatus('error');
    }
  }, [boardId]);

  // Interval autosave
  useEffect(() => {
    if (!boardId) return;

    const interval = setInterval(() => {
      if (isManuallySaving.current) return;

      const current  = elementsRef.current;
      const prev     = prevElementsSnapshotRef.current;
      const prevIds  = new Set(prev.map(el => el.id));
      const currIds  = new Set(current.map(el => el.id));

      let foundNew = false;
      currIds.forEach(id => {
        if (!prevIds.has(id)) {
          localElementIds.current.add(id);
          foundNew = true;
        }
      });

      prevIds.forEach(id => {
        if (!currIds.has(id)) {
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

  // Manual save 
  const manualSave = useCallback(async () => {
    if (!boardId || isManuallySaving.current) return;
    isManuallySaving.current = true;
    setSaveStatus('saving');

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

  // Flush on unmount
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

  return { saveStatus, saveTimestamp, manualSave, markLocal: markLocal.current };
}