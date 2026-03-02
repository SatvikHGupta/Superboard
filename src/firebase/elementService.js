// element actions

import {
  collection, doc, setDoc, deleteDoc,
  onSnapshot, writeBatch, serverTimestamp,
} from 'firebase/firestore';
import { db } from './config.js';

const CHUNK_SIZE = 490;

/* add/update 1 shit */
export async function setElement(boardId, element) {
  const ref = doc(db, 'boards', boardId, 'elements', element.id);
  await setDoc(ref, { ...element, updatedAt: serverTimestamp() });
}

/* 1 khoon maaf */
export async function removeElement(boardId, elementId) {
  await deleteDoc(doc(db, 'boards', boardId, 'elements', elementId));
}

/* Batch write to be under 500 for FB */
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

/* Batch delete */
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

/* Real time */
export function onElementsChange(boardId, callback) {
  const ref = collection(db, 'boards', boardId, 'elements');
  return onSnapshot(ref, snap => {
    const elements = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(elements);
  });
}