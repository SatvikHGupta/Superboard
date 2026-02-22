// src/firebase/boardService.js
// v1.4: onBoardChange now passes null to callback when doc doesn't exist,
// so WhiteboardContext can set boardMissing correctly via the real-time listener.

import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc,
  deleteDoc, query, where, serverTimestamp, onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db } from './config.js';

const BOARDS = 'boards';
const CHUNK  = 490; // Firestore batch limit is 500

function sortByUpdatedAt(boards) {
  return boards.sort((a, b) => {
    const at = a.updatedAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
    const bt = b.updatedAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
    return bt - at;
  });
}

/* ── Create ──────────────────────────────────────────────────────────────── */
export async function createBoard(userId, userEmail, userName, name) {
  const docRef = await addDoc(collection(db, BOARDS), {
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
  return docRef.id;
}

/* ── Read ────────────────────────────────────────────────────────────────── */
export async function getUserBoards(userId) {
  const q    = query(collection(db, BOARDS), where('ownerId', '==', userId));
  const snap = await getDocs(q);
  return sortByUpdatedAt(snap.docs.map(d => ({ id: d.id, ...d.data() })));
}

export async function getEditorBoards(userEmail) {
  if (!userEmail) return [];
  const email = userEmail.toLowerCase();
  const q     = query(collection(db, BOARDS), where('editors', 'array-contains', email));
  const snap  = await getDocs(q);
  return sortByUpdatedAt(snap.docs.map(d => ({ id: d.id, ...d.data() })));
}

export async function getBoardsByUserId(userId) {
  const q    = query(collection(db, BOARDS), where('ownerId', '==', userId));
  const snap = await getDocs(q);
  return sortByUpdatedAt(snap.docs.map(d => ({ id: d.id, ...d.data() })));
}

export async function getBoard(boardId) {
  const snap = await getDoc(doc(db, BOARDS, boardId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/* ── Update ──────────────────────────────────────────────────────────────── */
export async function updateBoard(boardId, data) {
  await updateDoc(doc(db, BOARDS, boardId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/* ── Delete (with cascade) ───────────────────────────────────────────────── */
export async function deleteBoard(boardId) {
  await deleteSubcollection(boardId, 'elements');
  await deleteSubcollection(boardId, 'cursors');
  await deleteDoc(doc(db, BOARDS, boardId));
}

async function deleteSubcollection(boardId, subcollection) {
  const ref  = collection(db, BOARDS, boardId, subcollection);
  const snap = await getDocs(ref);
  if (snap.empty) return;

  const docs = snap.docs;
  for (let i = 0; i < docs.length; i += CHUNK) {
    const batch = writeBatch(db);
    docs.slice(i, i + CHUNK).forEach(d => batch.delete(d.ref));
    await batch.commit();
  }
}

export { deleteSubcollection };

/* ── Real-time listener ──────────────────────────────────────────────────── */
// v1.4: passes null to callback when document doesn't exist (deleted/missing),
// so callers can correctly set boardMissing state.
export function onBoardChange(boardId, callback) {
  return onSnapshot(doc(db, BOARDS, boardId), snap => {
    if (snap.exists()) {
      callback({ id: snap.id, ...snap.data() });
    } else {
      callback(null);
    }
  });
}