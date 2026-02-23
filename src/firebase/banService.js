// src/firebase/banService.js
//
// Manages the /banned_users/{uid} collection.
// App.jsx checks isBanned() after auth resolves — banned users see a
// "suspended" screen regardless of which route they try to access.

import {
  doc, setDoc, deleteDoc, getDoc, getDocs,
  collection, serverTimestamp,
} from 'firebase/firestore';
import { db } from './config.js';

const ref = (uid) => doc(db, 'banned_users', uid);

/**
 * Ban a user. Stores reason, who banned them, and when.
 */
export async function banUser(uid, email, reason, adminEmail) {
  await setDoc(ref(uid), {
    uid,
    email,
    reason:    reason || 'No reason given',
    bannedBy:  adminEmail,
    bannedAt:  serverTimestamp(),
  });
}

/**
 * Lift a ban.
 */
export async function unbanUser(uid) {
  await deleteDoc(ref(uid));
}

/**
 * Check if a single user is banned. Returns the ban doc or null.
 * Called on every auth resolve — costs 1 Firestore read per session.
 */
export async function isBanned(uid) {
  if (!uid) return null;
  const snap = await getDoc(ref(uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Get all currently banned users (admin panel).
 */
export async function getBannedUsers() {
  const snap = await getDocs(collection(db, 'banned_users'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}