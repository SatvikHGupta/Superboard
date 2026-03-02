// john cena ko ICU kehne wala

import { tsMillis } from './analyticsUtils.js';

const ISSUE_CONFIG = {
  error: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', icon: '🔴' },
  warn:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', icon: '🟡' },
};

function IssueTag({ type, msg }) {
  const cfg = ISSUE_CONFIG[type] || ISSUE_CONFIG.warn;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20,
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      fontSize: 11, fontWeight: 600, color: cfg.color,
      whiteSpace: 'nowrap',
    }}>
      {cfg.icon} {msg}
    </span>
  );
}

export default function BoardHealthPanel({ boards, users }) {
  const knownOwnerIds = new Set(users.map(u => u.uid));
  const now      = Date.now();
  const THIRTY_D = 30 * 86400000;

  const issues = boards.flatMap(b => {
    const flags = [];
    if (!b.thumbnail)
      flags.push({ type: 'warn',  msg: 'No thumbnail — never saved' });
    if (Array.isArray(b.editors) && b.editors.length > 5 && (now - tsMillis(b.updatedAt)) > THIRTY_D)
      flags.push({ type: 'warn',  msg: `${b.editors.length} editors, inactive 30d+` });
    if (!knownOwnerIds.has(b.ownerId))
      flags.push({ type: 'error', msg: 'Orphaned — owner not in users' });
    return flags.length ? [{ ...b, flags }] : [];
  });

  const errorCount = issues.reduce((n, b) => n + b.flags.filter(f => f.type === 'error').length, 0);
  const warnCount  = issues.reduce((n, b) => n + b.flags.filter(f => f.type === 'warn').length, 0);

  return (
    <div className="analytics-panel">
      {/* Header */}
      <div className="analytics-panel-header">
        <div>
          <h3 className="analytics-panel-title">Board Health</h3>
          <p className="analytics-panel-sub">Flags computed from already-loaded board data — no extra reads</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {errorCount > 0 && (
            <span style={{
              padding: '5px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700,
              background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444',
            }}>
              🔴 {errorCount} error{errorCount !== 1 ? 's' : ''}
            </span>
          )}
          {warnCount > 0 && (
            <span style={{
              padding: '5px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700,
              background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b',
            }}>
              🟡 {warnCount} warning{warnCount !== 1 ? 's' : ''}
            </span>
          )}
          {issues.length === 0 && (
            <span style={{
              padding: '5px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700,
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#22c55e',
            }}>
              ✓ All healthy
            </span>
          )}
        </div>
      </div>

      {issues.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '32px 16px',
          background: 'rgba(34,197,94,0.04)', border: '1px dashed rgba(34,197,94,0.2)',
          borderRadius: 12,
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#22c55e' }}>All {boards.length} boards look healthy</div>
          <div style={{ fontSize: 12, color: 'var(--tx-4)', marginTop: 4 }}>No issues found across thumbnails, editors, or ownership.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {issues.map(b => (
            <div key={b.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: 14,
              padding: '14px 18px',
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 12,
              transition: 'background 0.12s',
            }}>
              {/* Thumbnail or initial */}
              <div style={{
                width: 44, height: 44, borderRadius: 8, flexShrink: 0, overflow: 'hidden',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {b.thumbnail
                  ? <img src={b.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.15)' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                      </svg>
                    </span>
                }
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--tx-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {b.name || 'Untitled'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--tx-4)', marginTop: 2 }}>{b.ownerEmail}</div>
              </div>

              {/* Flags */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-end', flexShrink: 0 }}>
                {b.flags.map((f, i) => <IssueTag key={i} {...f} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}