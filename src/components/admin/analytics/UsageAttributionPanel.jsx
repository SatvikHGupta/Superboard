//actual per person usage

import { useState } from 'react';

const LIMITS = { reads: 50_000, writes: 20_000, realtime: 50_000 };

function StatPill({ label, value, color, limit }) {
  const pct = Math.min(100, Math.round((value / limit) * 100));
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '10px 18px', borderRadius: 12, minWidth: 80,
      background: `${color}12`, border: `1px solid ${color}30`,
    }}>
      <span style={{ fontSize: 22, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.5px' }}>{value}</span>
      <span style={{ fontSize: 10, fontWeight: 700, color: `${color}aa`, textTransform: 'uppercase', letterSpacing: '0.7px', marginTop: 2 }}>{label}</span>
      {value > 0 && (
        <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: pct + '%', background: color, borderRadius: 2, transition: 'width 0.5s' }} />
        </div>
      )}
    </div>
  );
}

export default function UsageAttributionPanel({ logs }) {
  const [expanded, setExpanded] = useState(null);

  const byUser = {};
  logs.forEach(log => {
    const key = log.actorEmail || log.actorId || 'unknown';
    if (!byUser[key]) byUser[key] = { email: key, writes: 0, reads: 0, realtime: 0, actions: [] };
    if (log.cost === 'write')    byUser[key].writes++;
    if (log.cost === 'read')     byUser[key].reads++;
    if (log.cost === 'realtime') byUser[key].realtime++;
    byUser[key].actions.unshift(log.label);
  });

  const rows = Object.values(byUser).sort((a, b) => (b.writes + b.reads) - (a.writes + a.reads));
  const totalReads = rows.reduce((s, r) => s + r.reads, 0);
  const totalWrites = rows.reduce((s, r) => s + r.writes, 0);

  return (
    <div className="analytics-panel">
      <div className="analytics-panel-header">
        <div>
          <h3 className="analytics-panel-title">Firebase Usage Attribution</h3>
          <p className="analytics-panel-sub">Estimated reads/writes per user — from this session's audit log</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <StatPill label="Reads" value={totalReads} color="#3b82f6" limit={LIMITS.reads} />
          <StatPill label="Writes" value={totalWrites} color="#f59e0b" limit={LIMITS.writes} />
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="analytics-empty">No audit data yet — actions appear here as they happen.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map(row => {
            const isExpanded = expanded === row.email;
            const uniqueActions = [...new Set(row.actions)];
            return (
              <div
                key={row.email}
                onClick={() => setExpanded(isExpanded ? null : row.email)}
                style={{
                  padding: '14px 18px',
                  background: isExpanded ? 'rgba(99,102,241,0.07)' : 'rgba(255,255,255,0.025)',
                  border: `1px solid ${isExpanded ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 12,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  {/* Avatar */}
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))',
                    border: '1px solid rgba(99,102,241,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700, color: '#a5b4fc', flexShrink: 0,
                  }}>
                    {row.email.charAt(0).toUpperCase()}
                  </div>

                  {/* Email */}
                  <div style={{ flex: 1, minWidth: 120 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx-1)' }}>{row.email}</div>
                    <div style={{ fontSize: 11, color: 'var(--tx-4)', marginTop: 2 }}>
                      {uniqueActions.slice(0, 2).join(' · ')}{uniqueActions.length > 2 ? ` +${uniqueActions.length - 2} more` : ''}
                    </div>
                  </div>

                  {/* Stats pills */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', fontSize: 12, fontWeight: 700, color: '#3b82f6' }}>
                      {row.reads}R
                    </span>
                    <span style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>
                      {row.writes}W
                    </span>
                    {row.realtime > 0 && (
                      <span style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', fontSize: 12, fontWeight: 700, color: '#8b5cf6' }}>
                        {row.realtime}RT
                      </span>
                    )}
                  </div>

                  {/* Chevron */}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--tx-4)" strokeWidth="2"
                    style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--tx-4)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 8 }}>All Actions</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {uniqueActions.map((a, i) => (
                        <span key={i} style={{ padding: '2px 8px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 11, color: 'var(--tx-3)' }}>
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}