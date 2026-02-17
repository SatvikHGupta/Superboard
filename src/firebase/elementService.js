

import {
  collection, doc, setDoc, deleteDoc, onSnapshot,
  writeBatch, serverTimestamp
} from 'firebase/firestore';
import { db } from './config.js';

/* Add or update an element */
export async function setElement(boardId, element) {
  const ref = doc(db, 'boards', boardId, 'elements', element.id);
  await setDoc(ref, {
    ...element,
    updatedAt: serverTimestamp(),
  });
}

/* Delete an element */
export async function removeElement(boardId, elementId) {
  await deleteDoc(doc(db, 'boards', boardId, 'elements', elementId));
}

/* Batch write multiple elements (for initial load or paste) */
export async function batchSetElements(boardId, elements) {
  const batch = writeBatch(db);
  elements.forEach(el => {
    const ref = doc(db, 'boards', boardId, 'elements', el.id);
    batch.set(ref, { ...el, updatedAt: serverTimestamp() });
  });
  await batch.commit();
}

/* Listen to all elements (real-time) */
export function onElementsChange(boardId, callback) {
  const ref = collection(db, 'boards', boardId, 'elements');
  return onSnapshot(ref, (snap) => {
    const elements = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(elements);
  });
}
