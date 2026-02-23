import { useState } from 'react';

const COST_COLOR = { write: '#f59e0b', read: '#3b82f6', realtime: '#8b5cf6' };

function fmtTs(ts) {
  if (!ts) return '—';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function AuditLogPanel({ logs, onPrune, pruning }) {
  const [filter, setFilter] = useState('all');
  const shown = filter === 'all' ? logs : logs.filter(l => l.cost === filter);

  return (
    <div className="analytics-panel">
      <div className="analytics-panel-header">
        <div>
          <h3 className="analytics-panel-title">Audit Log</h3>
          <p className="analytics-panel-sub">Last 200 platform events — who did what and when</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="filter-group">
            {['all', 'write', 'read'].map(t => (
              <button key={t} className={'filter-btn' + (filter === t ? ' active' : '')} onClick={() => setFilter(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <button className="btn btn-ghost" onClick={onPrune} disabled={pruning} style={{ fontSize: 12, padding: '5px 10px' }}>
            {pruning ? 'Pruning…' : 'Prune 30d+'}
          </button>
        </div>
      </div>

      <div className="audit-log-scroll">
        {shown.length === 0
          ? <div className="analytics-empty">No events match this filter.</div>
          : shown.map(log => (
            <div key={log.id} className="audit-row">
              <span className="audit-ts">{fmtTs(log.ts)}</span>
              <span className="audit-cost" style={{ color: COST_COLOR[log.cost] || 'var(--tx-4)' }}>{log.cost}</span>
              <span className="audit-label">{log.label}</span>
              <span className="audit-actor">{log.actorEmail || log.actorId || '—'}</span>
              {log.boardName && <span className="audit-board" title={log.boardId}>{log.boardName.slice(0, 20)}{log.boardName.length > 20 ? '…' : ''}</span>}
              {log.detail    && <span className="audit-detail">{log.detail}</span>}
            </div>
          ))
        }
      </div>
    </div>
  );
}
