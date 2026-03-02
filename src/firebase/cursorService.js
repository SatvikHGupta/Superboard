//80ms cursor update ki full logic

import {
  doc, setDoc, deleteDoc, collection, onSnapshot,
} from 'firebase/firestore';
import { db } from './config.js';

const CURSOR_COLORS = [
  '#ef4444', '#f59e0b', '#22c55e', '#3b82f6',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
];

// Per-user throttle state matlab prevents flooding if caller doesn't throttle
const lastBroadcastTime = new Map();
const BROADCAST_MIN_INTERVAL_MS = 80; // hard flooring; Canvas throttles to 500ms

/*Boardcasting cursor */
export function broadcastCursor(boardId, userId, userName, x, y) {
  // Don't write cursors when the tab is hidden  matlab saves writes for users who have the board open in a background tab.
  if (document.hidden) return;

  const now = Date.now();
  const lastTime = lastBroadcastTime.get(userId) || 0;
  if (now - lastTime < BROADCAST_MIN_INTERVAL_MS) return;
  lastBroadcastTime.set(userId, now);

  const ref = doc(db, 'boards', boardId, 'cursors', userId);
  setDoc(ref, {
    userId,
    userName,
    x,
    y,
    color: CURSOR_COLORS[hashCode(userId) % CURSOR_COLORS.length],
    lastUpdate: now,  
  }, { merge: true }).catch(() => {
  });
}

/*new tab khulega toh gayab */
export async function removeCursor(boardId, userId) {
  lastBroadcastTime.delete(userId);
  await deleteDoc(doc(db, 'boards', boardId, 'cursors', userId));
}

/*user ke alawa */
export function onCursorsChange(boardId, currentUserId, callback) {
  const ref = collection(db, 'boards', boardId, 'cursors');
  return onSnapshot(ref, snap => {
    const cursors = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(c => c.userId !== currentUserId);
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