
import {
  doc, setDoc, deleteDoc, collection, onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config.js';

/* Cursor colors assigned to remote users */
const CURSOR_COLORS = [
  '#ef4444', '#f59e0b', '#22c55e', '#3b82f6',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
];

/* Broadcast cursor position (throttled — call every 100ms max) */
export async function broadcastCursor(boardId, userId, userName, x, y) {
  const ref = doc(db, 'boards', boardId, 'cursors', userId);
  await setDoc(ref, {
    userId,
    userName,
    x,
    y,
    color: CURSOR_COLORS[hashCode(userId) % CURSOR_COLORS.length],
    lastUpdate: serverTimestamp(),
  });
}

/* Remove cursor when user leaves */
export async function removeCursor(boardId, userId) {
  await deleteDoc(doc(db, 'boards', boardId, 'cursors', userId));
}

/* Listen to all cursors (real-time) */
export function onCursorsChange(boardId, currentUserId, callback) {
  const ref = collection(db, 'boards', boardId, 'cursors');
  return onSnapshot(ref, (snap) => {
    const cursors = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(c => c.userId !== currentUserId); // exclude self
    callback(cursors);
  });
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}
