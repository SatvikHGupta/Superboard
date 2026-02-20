// src/constants/admin.js
//
// Single source of truth for admin email addresses.
// Imported by: Dashboard.jsx, AdminPage.jsx
// Also manually mirrored in Firestore security rules (firebase.rules)
// — if you add an email here, add it to the rules too.

export const ADMIN_EMAILS = [
  'shg090404@gmail.com',
  'face69troll69@gmail.com',
];

export function isAdminEmail(email) {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}