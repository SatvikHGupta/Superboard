import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc,
  deleteDoc, query, where, serverTimestamp, onSnapshot,
  writeBatch, setDoc,
} from 'firebase/firestore';
import { db } from './config.js';

const BOARDS   = 'boards';
const DELETED  = 'deleted_boards';
const CHUNK    = 490; // Firestore batch limit is 500; stay safely below

// Sort boards newest-updated-first so dashboard shows recent work at top.
function sortByUpdatedAt(list) {
  return [...list].sort((a, b) => {
    const at = a.updatedAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
    const bt = b.updatedAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
    return bt - at;
  });
}


/** Creates a new board document. Returns the new board's Firestore ID. */
export async function createBoard(userId, userEmail, userName, name) {
  const ref = await addDoc(collection(db, BOARDS), {
    name,
    ownerId:     userId,
    ownerEmail:  userEmail,
    ownerName:   userName,
    visibility:  'private',
    editors:     [],
    boardWidth:  1200,
    boardHeight: 1600,
    thumbnail:   '',
    createdAt:   serverTimestamp(),
    updatedAt:   serverTimestamp(),
  });
  return ref.id;
}


export async function getBoard(boardId) {
  const snap = await getDoc(doc(db, BOARDS, boardId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Both use incremental docChanges() so only changed docs are processed on each
// snapshot — keeps re-renders and Firestore read counts low.

/** Live listener for boards owned by this user. Calls callback with sorted array. */
export function onUserBoardsChange(userId, callback) {
  const q   = query(collection(db, BOARDS), where('ownerId', '==', userId));
  const map = new Map();

  return onSnapshot(q, snap => {
    snap.docChanges().forEach(change => {
      if (change.type === 'removed') {
        map.delete(change.doc.id);
      } else {
        map.set(change.doc.id, { id: change.doc.id, ...change.doc.data() });
      }
    });
    callback(sortByUpdatedAt([...map.values()]));
  }, () => callback([]));
}

/** Live listener for boards where this user is an editor. */
export function onEditorBoardsChange(userEmail, callback) {
  if (!userEmail) { callback([]); return () => {}; }
  const email = userEmail.toLowerCase();
  const q     = query(collection(db, BOARDS), where('editors', 'array-contains', email));
  const map   = new Map();

  return onSnapshot(q, snap => {
    snap.docChanges().forEach(change => {
      if (change.type === 'removed') {
        map.delete(change.doc.id);
      } else {
        map.set(change.doc.id, { id: change.doc.id, ...change.doc.data() });
      }
    });
    callback(sortByUpdatedAt([...map.values()]));
  }, () => callback([]));
}

/** Live listener for a single board document. Calls callback(null) when deleted. */
export function onBoardChange(boardId, callback) {
  return onSnapshot(doc(db, BOARDS, boardId), snap => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}


/** Merges fields into a board document and bumps updatedAt. */
export async function updateBoard(boardId, data) {
  await updateDoc(doc(db, BOARDS, boardId), { ...data, updatedAt: serverTimestamp() });
}


/** Permanently deletes a board and its element / cursor subcollections. */
export async function deleteBoard(boardId) {
  await deleteSubcollection(boardId, 'elements');
  await deleteSubcollection(boardId, 'cursors');
  await deleteDoc(doc(db, BOARDS, boardId));
}

/** Deletes all docs in a named subcollection using 490-doc batches. */
export async function deleteSubcollection(boardId, sub) {
  const snap = await getDocs(collection(db, BOARDS, boardId, sub));
  if (snap.empty) return;
  for (let i = 0; i < snap.docs.length; i += CHUNK) {
    const batch = writeBatch(db);
    snap.docs.slice(i, i + CHUNK).forEach(d => batch.delete(d.ref));
    await batch.commit();
  }
}

// Atomic writeBatch: copies board doc to /deleted_boards, removes it from
// /boards in the same commit. No window where the board exists in both or
// neither collection.

export async function softDeleteBoard(boardId, deletedByEmail = '') {
  const snap = await getDoc(doc(db, BOARDS, boardId));
  if (!snap.exists()) throw new Error('Board not found');

  const batch = writeBatch(db);
  batch.set(doc(db, DELETED, boardId), {
    ...snap.data(),
    originalId: boardId,
    deletedAt:  serverTimestamp(),
    deletedBy:  deletedByEmail,
  });
  batch.delete(doc(db, BOARDS, boardId));
  await batch.commit();
}


/** Atomically moves a soft-deleted board back to /boards. */
export async function restoreBoard(boardId) {
  const snap = await getDoc(doc(db, DELETED, boardId));
  if (!snap.exists()) throw new Error('Deleted board not found');

  const { deletedAt, deletedBy, originalId, ...data } = snap.data();
  const batch = writeBatch(db);
  batch.set(doc(db, BOARDS, boardId), { ...data, updatedAt: serverTimestamp(), restoredAt: serverTimestamp() });
  batch.delete(doc(db, DELETED, boardId));
  await batch.commit();
}


/** Permanently deletes a soft-deleted board (subcollections + deleted_boards doc). */
export async function purgeSoftDeletedBoard(boardId) {
  await deleteSubcollection(boardId, 'elements');
  await deleteSubcollection(boardId, 'cursors');
  await deleteDoc(doc(db, DELETED, boardId));
}

export async function getSoftDeletedBoards() {
  const snap = await getDocs(collection(db, DELETED));
  return sortByUpdatedAt(snap.docs.map(d => ({ id: d.id, ...d.data() })));
}


export async function getAllBoards() {
  const snap = await getDocs(collection(db, BOARDS));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}


/** One-shot fetch of all boards owned by a specific user. Used by admin UserBoardsModal. */
export async function getBoardsByUserId(userId) {
  const q    = query(collection(db, BOARDS), where('ownerId', '==', userId));
  const snap = await getDocs(q);
  return sortByUpdatedAt(snap.docs.map(d => ({ id: d.id, ...d.data() })));
}