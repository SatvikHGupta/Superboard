/**
 * quotaTracker.js — lightweight per-client daily Firestore quota tracking.
 *
 * Firebase free tier limits (per day):
 *   Reads:    50,000  — warn at 40,000
 *   Writes:   20,000  — warn at 16,000
 *   Deletes:  20,000  — (counted with writes here)
 *
 * Strategy: count in localStorage per user per UTC day.
 * We also support a "platform-wide" estimate via Firestore shared doc,
 * but that is opt-in (costs 1 extra write per session).
 */

const TODAY = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD

function storageKey(type) { return `sb_quota_${type}_${TODAY()}`; }

function increment(type, by = 1) {
  try {
    const k = storageKey(type);
    const v = parseInt(localStorage.getItem(k) || '0', 10) + by;
    localStorage.setItem(k, String(v));
    return v;
  } catch (_) { return 0; }
}

function getCount(type) {
  try { return parseInt(localStorage.getItem(storageKey(type)) || '0', 10); }
  catch (_) { return 0; }
}

export function trackRead(n = 1)     { return increment('reads', n); }
export function trackWrite(n = 1)    { return increment('writes', n); }
export function trackRealtime(n = 1) { return increment('realtime', n); }

export const LIMITS = {
  reads:    50_000,
  writes:   20_000,
  realtime: 50_000,
};

export const WARN_AT = {
  reads:    40_000,   // 80%
  writes:   16_000,   // 80%
  realtime: 40_000,   // 80%
};

export function getQuotaStatus() {
  const reads    = getCount('reads');
  const writes   = getCount('writes');
  const realtime = getCount('realtime');

  const warnings = [];
  if (reads    >= WARN_AT.reads)    warnings.push({ type: 'reads',    current: reads,    limit: LIMITS.reads    });
  if (writes   >= WARN_AT.writes)   warnings.push({ type: 'writes',   current: writes,   limit: LIMITS.writes   });
  if (realtime >= WARN_AT.realtime) warnings.push({ type: 'realtime', current: realtime, limit: LIMITS.realtime });

  return { reads, writes, realtime, warnings, hasWarning: warnings.length > 0 };
}

export function getCounts() {
  return {
    reads:    getCount('reads'),
    writes:   getCount('writes'),
    realtime: getCount('realtime'),
  };
}