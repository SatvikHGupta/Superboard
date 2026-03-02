// Hacker ki jagah heckler ban gaye

import { signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, googleProvider } from './config.js';

/* Google popup */
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Sign-in error:', error);
    throw error;
  }
}

/* Sign out */
export async function signOut() {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Sign-out error:', error);
    throw error;
  }
}

/* Pakdo */
export function getCurrentUser() {
  return auth.currentUser;
}
