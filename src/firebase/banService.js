// tu phela phela ban h meraaaaaaa

import {
  doc, setDoc, deleteDoc, getDoc, getDocs,
  collection, serverTimestamp,
} from 'firebase/firestore';
import { db } from './config.js';

const ref = (uid) => doc(db, 'banned_users', uid);

/* aladeen an user*/

export async function banUser(uid, email, reason, adminEmail) {
  await setDoc(ref(uid), {
    uid,
    email,
    reason:    reason || 'No reason given',
    bannedBy:  adminEmail,
    bannedAt:  serverTimestamp(),
  });
}

/*welcome back*/
export async function unbanUser(uid) {
  await deleteDoc(ref(uid));
}

/** per user check
 * Check if a single user is banned. Returns the ban doc or null.
 * Called on every auth resolve — costs 1 Firestore read per session.
 */
export async function isBanned(uid) {
  if (!uid) return null;
  const snap = await getDoc(ref(uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/*Get all currently banned users (admin panel)*/
export async function getBannedUsers() {
  const snap = await getDocs(collection(db, 'banned_users'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}