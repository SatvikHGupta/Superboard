
import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc,
  deleteDoc, query, where, orderBy, serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from './config.js';

const BOARDS = 'boards';

/* Create a new board */
export async function createBoard(userId, userEmail, userName, name) {
  const docRef = await addDoc(collection(db, BOARDS), {
    name,
    ownerId: userId,
    ownerEmail: userEmail,
    ownerName: userName,
    visibility: 'private',
    editors: [],
    boardWidth: 1200,
    boardHeight: 1600,
    thumbnail: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/* Get all boards owned by user */
export async function getUserBoards(userId) {
  const q = query(
    collection(db, BOARDS),
    where('ownerId', '==', userId),
    orderBy('updatedAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/* Get all boards where user is an editor */
export async function getEditorBoards(userEmail) {
  const q = query(
    collection(db, BOARDS),
    where('editors', 'array-contains', userEmail),
    orderBy('updatedAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/* Get a single board */
export async function getBoard(boardId) {
  const snap = await getDoc(doc(db, BOARDS, boardId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/* Update board metadata */
export async function updateBoard(boardId, data) {
  await updateDoc(doc(db, BOARDS, boardId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/* Delete a board */
export async function deleteBoard(boardId) {
  await deleteDoc(doc(db, BOARDS, boardId));
}

/* Listen to board changes (real-time) */
export function onBoardChange(boardId, callback) {
  return onSnapshot(doc(db, BOARDS, boardId), (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() });
  });
}
