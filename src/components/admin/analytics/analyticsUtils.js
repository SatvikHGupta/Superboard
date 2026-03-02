//numbers mason, what od they mean??

export function tsMillis(ts) {
  if (!ts) return 0;
  return ts?.toMillis?.() || new Date(ts).getTime();
}

export function fmtBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / (1024 * 1024)).toFixed(2) + ' MB';
}
