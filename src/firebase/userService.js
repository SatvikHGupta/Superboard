// src/firebase/userService.js
// Tracks every user who has ever logged into Superboard.
// setDoc with merge:true = no-op if data unchanged = effectively free for returning users.

import {
  doc, setDoc, getDoc, getDocs, collection, serverTimestamp
} from 'firebase/firestore';
import { db } from './config.js';

const ref = (uid) => doc(db, 'users', uid);

/**
 * Called on every successful auth resolve.
 * Upserts the user record; sets firstSeen only once.
 */
export async function trackUserLogin(user) {
  try {
    const existing = await getDoc(ref(user.uid));
    if (!existing.exists()) {
      await setDoc(ref(user.uid), {
        uid:         user.uid,
        email:       user.email,
        displayName: user.displayName || null,
        firstSeen:   serverTimestamp(),
        lastSeen:    serverTimestamp(),
      });
    } else {
      await setDoc(ref(user.uid), {
        email:       user.email,
        displayName: user.displayName || null,
        lastSeen:    serverTimestamp(),
      }, { merge: true });
    }
  } catch (_) {
    // Non-critical — never block the auth flow
  }
}

/**
 * Get all tracked users (admin panel only).
 */
export async function getAllUsers() {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Track an anonymous public board view.
 * Stores a lightweight record in /public_views/{boardId}/sessions/{sessionId}.
 * Used by ViewerPage so we can count how many people view public boards.
 * Costs 1 Firestore write per anonymous visitor per board per day.
 */
export async function trackPublicView(boardId) {
  try {
    // Use sessionStorage to avoid duplicate writes on re-render
    const key = `sb_view_${boardId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');

    const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
    const { db } = await import('./config.js');
    await addDoc(collection(db, 'public_views'), {
      boardId,
      ts: serverTimestamp(),
      userAgent: navigator.userAgent.slice(0, 100),
    });
  } catch (_) {
    // Never block the viewer
  }
}