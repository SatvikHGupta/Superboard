/**
 * LiveUsersPanel — uses polling getDocs instead of onSnapshot(collectionGroup).
 *
 * WHY: onSnapshot on a collectionGroup query triggers a known Firebase SDK bug:
 * when it gets permission-denied, the SDK's internal state machine crashes
 * (INTERNAL ASSERTION FAILED: Unexpected state ID: ca9 → b815), which then
 * breaks ALL subsequent Firestore operations for the entire session.
 * Polling getDocs fails gracefully with a catchable error and never corrupts
 * the SDK state.
 */
import { useState, useEffect, useRef } from 'react';
import { collectionGroup, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase/config.js';

const STALE_MS   = 5 * 60 * 1000;
const POLL_MS    = 30_000; // refresh every 30 s

export default function LiveUsersPanel() {
  const [sessions, setSessions] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const timerRef = useRef(null);

  async function poll() {
    try {
      const snap = await getDocs(collectionGroup(db, 'cursors'));
      const now  = Date.now();
      const alive = snap.docs
        .map(d => ({ ...d.data(), boardId: d.ref.parent.parent?.id }))
        .filter(c =>
          c.boardId &&
          (now - (c.lastUpdate?.toMillis?.() ?? c.lastUpdate ?? 0)) < STALE_MS
        );
      setSessions(alive);
      setError(null);
    } catch (err) {
      // Permission-denied means the collectionGroup rule isn't published yet.
      // Show a clear message instead of crashing.
      if (err?.code === 'permission-denied') {
        setError('pending-rules');
      } else {
        setError('error');
      }
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    poll();
    timerRef.current = setInterval(poll, POLL_MS);
    return () => clearInterval(timerRef.current);
  }, []);

  const byBoard = {};
  sessions.forEach(s => {
    if (!byBoard[s.boardId]) byBoard[s.boardId] = [];
    byBoard[s.boardId].push(s);
  });

  const boardCount = Object.keys(byBoard).length;

  return (
    <div className="analytics-panel">
      <div className="analytics-panel-header">
        <div>
          <h3 className="analytics-panel-title">
            <span className="live-dot" style={{ marginRight: 8 }} />
            Live Active Users
          </h3>
          <p className="analytics-panel-sub">
            Users with a board open right now · refreshes every 30 s
          </p>
        </div>
        <span className="analytics-big-badge" style={{
          background: sessions.length > 0 ? 'rgba(34,197,94,0.15)' : 'var(--bg-3)',
          color:      sessions.length > 0 ? '#22c55e' : 'var(--tx-4)',
          border:     sessions.length > 0 ? '1px solid rgba(34,197,94,0.3)' : '1px solid var(--br-2)',
        }}>
          {loading ? '…' : `${sessions.length} online`}
        </span>
      </div>

      {loading ? (
        <div className="analytics-loading">Loading live cursor data…</div>
      ) : error === 'pending-rules' ? (
        <div className="analytics-empty" style={{ color: '#f59e0b' }}>
          ⚠️ Firestore rules not yet published.<br />
          <span style={{ fontSize: 12, opacity: 0.8 }}>
            Publish the updated <code>firestore.txt</code> rules in Firebase Console → Firestore → Rules.
          </span>
        </div>
      ) : error ? (
        <div className="analytics-empty">
          Could not load live user data. Check console for details.
        </div>
      ) : sessions.length === 0 ? (
        <div className="analytics-empty">No active users right now.</div>
      ) : (
        <div className="live-sessions-list">
          {Object.entries(byBoard).map(([boardId, users]) => (
            <div key={boardId} className="live-session-row">
              <div className="live-session-board">
                <span className="live-dot-sm" />
                <a
                  href={`#/view/${boardId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--a)', fontSize: 13, fontWeight: 600 }}
                >
                  Board {boardId.slice(0, 8)}…
                </a>
              </div>
              <div className="live-session-users">
                {users.map((u, i) => (
                  <span
                    key={i}
                    className="live-user-chip"
                    style={{
                      borderColor: u.color || 'var(--br-2)',
                      background:  (u.color || '#6366f1') + '22',
                    }}
                  >
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: u.color || '#6366f1',
                      display: 'inline-block', marginRight: 5, flexShrink: 0,
                    }} />
                    {u.userName || 'Anonymous'}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}