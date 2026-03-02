//i am stalking you - shg

import {
  doc, setDoc, getDoc, getDocs, collection, serverTimestamp
} from 'firebase/firestore';
import { db } from './config.js';

const ref = (uid) => doc(db, 'users', uid);

/* important
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
    // Non-critical meaning never block the auth flow
  }
}

/*all users for admin*/
export async function getAllUsers() {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/*track public board visitor - 1 write per visit*/

export async function trackPublicView(boardId) {
  try {
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