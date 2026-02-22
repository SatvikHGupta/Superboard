// src/firebase/elementService.js
// v1.4: No API changes — all existing exports preserved.
// setElement (single doc write) is now used by useBoardPersistence for
// individual dirty element flushes, enabling per-element writes that don't
// overwrite concurrent users' work.

import {
  collection, doc, setDoc, deleteDoc,
  onSnapshot, writeBatch, serverTimestamp,
} from 'firebase/firestore';
import { db } from './config.js';

const CHUNK_SIZE = 490;

/* ── Add / update a single element ──────────────────────────────────────── */
export async function setElement(boardId, element) {
  const ref = doc(db, 'boards', boardId, 'elements', element.id);
  await setDoc(ref, { ...element, updatedAt: serverTimestamp() });
}

/* ── Delete a single element ─────────────────────────────────────────────── */
export async function removeElement(boardId, elementId) {
  await deleteDoc(doc(db, 'boards', boardId, 'elements', elementId));
}

/* ── Batch write — chunked to stay under Firestore's 500-op limit ────────── */
export async function batchSetElements(boardId, elements) {
  if (!elements || elements.length === 0) return;

  for (let i = 0; i < elements.length; i += CHUNK_SIZE) {
    const chunk = elements.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    chunk.forEach(el => {
      const ref = doc(db, 'boards', boardId, 'elements', el.id);
      batch.set(ref, { ...el, updatedAt: serverTimestamp() });
    });
    await batch.commit();
  }
}

/* ── Batch delete ─────────────────────────────────────────────────────────── */
export async function batchDeleteElements(boardId, elementIds) {
  if (!elementIds || elementIds.length === 0) return;

  for (let i = 0; i < elementIds.length; i += CHUNK_SIZE) {
    const chunk = elementIds.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    chunk.forEach(id => {
      batch.delete(doc(db, 'boards', boardId, 'elements', id));
    });
    await batch.commit();
  }
}

/* ── Listen to all elements (real-time) ──────────────────────────────────── */
export function onElementsChange(boardId, callback) {
  const ref = collection(db, 'boards', boardId, 'elements');
  return onSnapshot(ref, snap => {
    const elements = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(elements);
  });
}