// agar email kara yaha se padhke toh reply nhi karunga
//add email here, add it to the FB rules

export const ADMIN_EMAILS = [
  'shg090404@gmail.com',
  'face69troll69@gmail.com',
];

export function isAdminEmail(email) {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}