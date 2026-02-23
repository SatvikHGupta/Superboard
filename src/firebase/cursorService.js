// src/firebase/cursorService.js
// v1.4.1 optimisations:
//   • serverTimestamp() removed from broadcastCursor.
//     serverTimestamp() requires a server round-trip on every write — for
//     cursor positions updated 25+ times/sec this was the single largest
//     Firebase cost driver.  Replaced with Date.now() (client clock).
//     Cursor data is ephemeral so server-authoritative time is unnecessary.
//   • broadcastCursor is now fire-and-forget (no await, errors silenced).
//     Cursor writes do not block the pointer-move handler and a dropped
//     cursor frame is invisible to users.
//   • { merge: true } added so Firestore only diffs the changed fields
//     rather than rewriting the full cursor document on every update.
//   • Throttle is now enforced here as well as in Canvas.jsx so callers
//     that forget to throttle don't accidentally flood Firestore.

import {
  doc, setDoc, deleteDoc, collection, onSnapshot,
} from 'firebase/firestore';
import { db } from './config.js';

const CURSOR_COLORS = [
  '#ef4444', '#f59e0b', '#22c55e', '#3b82f6',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
];

// Per-user throttle state — prevents flooding if caller doesn't throttle
const lastBroadcastTime = new Map();
const BROADCAST_MIN_INTERVAL_MS = 80; // hard floor; Canvas throttles to 500ms

/**
 * Broadcast cursor position. Fire-and-forget — never awaited by callers.
 * Skips write when the tab is not visible (user has switched away).
 */
export function broadcastCursor(boardId, userId, userName, x, y) {
  // Don't write cursors when the tab is hidden — saves writes for users who
  // have the board open in a background tab.
  if (document.hidden) return;

  const now = Date.now();
  const lastTime = lastBroadcastTime.get(userId) || 0;
  if (now - lastTime < BROADCAST_MIN_INTERVAL_MS) return;
  lastBroadcastTime.set(userId, now);

  const ref = doc(db, 'boards', boardId, 'cursors', userId);
  // setDoc with merge:true only sends changed fields to Firestore.
  // No await — cursor writes are best-effort.
  setDoc(ref, {
    userId,
    userName,
    x,
    y,
    color: CURSOR_COLORS[hashCode(userId) % CURSOR_COLORS.length],
    lastUpdate: now,  // client timestamp — no server round-trip
  }, { merge: true }).catch(() => {
    // Silently swallow cursor write failures.
    // A dropped cursor frame is completely invisible to users.
  });
}

/** Remove cursor doc when user leaves the board. */
export async function removeCursor(boardId, userId) {
  lastBroadcastTime.delete(userId);
  await deleteDoc(doc(db, 'boards', boardId, 'cursors', userId));
}

/** Subscribe to all remote cursors (excludes the current user). */
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