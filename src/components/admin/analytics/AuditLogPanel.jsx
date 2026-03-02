//admin bhi safe nhi h

import { useState } from 'react';

const COST_COLOR = { write: '#f59e0b', read: '#3b82f6', realtime: '#8b5cf6' };
const COST_BG    = { write: 'rgba(245,158,11,0.1)', read: 'rgba(59,130,246,0.1)', realtime: 'rgba(139,92,246,0.1)' };
const PAGE_SIZE  = 20;

function fmtTs(ts) {
  if (!ts) return '—';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function AuditLogPanel({ logs, onPrune, pruning }) {
  const [filter, setFilter] = useState('all');
  const [page,   setPage]   = useState(1);

  const shown     = filter === 'all' ? logs : logs.filter(l => l.cost === filter);
  const totalPages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const curPage   = Math.min(page, totalPages);
  const paged     = shown.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE);

  function handleFilter(f) { setFilter(f); setPage(1); }

  return (
    <div className="analytics-panel">
      {/* Header */}
      <div className="analytics-panel-header">
        <div>
          <h3 className="analytics-panel-title">Audit Log</h3>
          <p className="analytics-panel-sub">Last 200 platform events — who did what and when</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="filter-group">
            {['all', 'write', 'read'].map(t => (
              <button key={t} className={'filter-btn' + (filter === t ? ' active' : '')} onClick={() => handleFilter(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <button className="btn btn-ghost" onClick={onPrune} disabled={pruning}
            style={{ fontSize: 12, padding: '5px 12px' }}>
            {pruning ? 'Pruning…' : 'Prune 30d+'}
          </button>
        </div>
      </div>

      {/* Log entries */}
      {shown.length === 0 ? (
        <div className="analytics-empty">No events match this filter.</div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 16 }}>
            {paged.map((log, idx) => (
              <div key={log.id || idx} style={{
                display: 'grid',
                gridTemplateColumns: '140px 60px 1fr auto',
                alignItems: 'center',
                gap: 10,
                padding: '9px 14px',
                borderRadius: 8,
                background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.018)',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.018)'}
              >
                {/* Timestamp */}
                <span style={{ fontSize: 11, color: 'var(--tx-4)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                  {fmtTs(log.ts)}
                </span>

                {/* Cost badge */}
                <span style={{
                  fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                  padding: '2px 7px', borderRadius: 10,
                  color: COST_COLOR[log.cost] || 'var(--tx-4)',
                  background: COST_BG[log.cost] || 'rgba(255,255,255,0.05)',
                  whiteSpace: 'nowrap', textAlign: 'center',
                }}>
                  {log.cost}
                </span>

                {/* Label + actor */}
                <div style={{ minWidth: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--tx-1)' }}>{log.label}</span>
                  {log.boardName && (
                    <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--a-light)', background: 'rgba(99,102,241,0.1)', padding: '1px 6px', borderRadius: 6 }}>
                      {log.boardName.slice(0, 18)}{log.boardName.length > 18 ? '…' : ''}
                    </span>
                  )}
                  {log.detail && (
                    <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--tx-4)', fontStyle: 'italic' }}>{log.detail}</span>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--tx-4)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.actorEmail || log.actorId || '—'}
                  </div>
                </div>

                {/* Board ID short */}
                {log.boardId && (
                  <span style={{ fontSize: 10, color: 'var(--tx-4)', fontFamily: 'monospace', flexShrink: 0 }}>
                    {log.boardId.slice(0, 6)}…
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)',
            }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={curPage === 1}
                style={{
                  padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.04)', color: curPage === 1 ? 'var(--tx-4)' : 'var(--tx-2)',
                  cursor: curPage === 1 ? 'default' : 'pointer', fontSize: 13, fontWeight: 500,
                  opacity: curPage === 1 ? 0.4 : 1,
                }}
              >← Prev</button>

              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                let p;
                if (totalPages <= 7) { p = i + 1; }
                else if (curPage <= 4) { p = i + 1; }
                else if (curPage >= totalPages - 3) { p = totalPages - 6 + i; }
                else { p = curPage - 3 + i; }
                return (
                  <button key={p} onClick={() => setPage(p)} style={{
                    width: 34, height: 34, borderRadius: 8, border: '1px solid',
                    borderColor: curPage === p ? 'var(--a)' : 'rgba(255,255,255,0.08)',
                    background: curPage === p ? 'var(--a)' : 'rgba(255,255,255,0.04)',
                    color: curPage === p ? 'white' : 'var(--tx-3)',
                    cursor: 'pointer', fontSize: 13, fontWeight: curPage === p ? 700 : 400,
                    boxShadow: curPage === p ? '0 0 10px var(--a-glow)' : 'none',
                  }}>{p}</button>
                );
              })}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={curPage === totalPages}
                style={{
                  padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.04)', color: curPage === totalPages ? 'var(--tx-4)' : 'var(--tx-2)',
                  cursor: curPage === totalPages ? 'default' : 'pointer', fontSize: 13, fontWeight: 500,
                  opacity: curPage === totalPages ? 0.4 : 1,
                }}
              >Next →</button>

              <span style={{ fontSize: 12, color: 'var(--tx-4)', marginLeft: 8 }}>
                {shown.length} events · Page {curPage}/{totalPages}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}