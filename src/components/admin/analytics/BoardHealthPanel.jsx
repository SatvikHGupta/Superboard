import { tsMillis } from './analyticsUtils.js';

export default function BoardHealthPanel({ boards, users }) {
  const knownOwnerIds = new Set(users.map(u => u.uid));
  const now        = Date.now();
  const THIRTY_D   = 30 * 86400000;

  const issues = boards.flatMap(b => {
    const flags = [];
    if (!b.thumbnail) flags.push({ type: 'warn', msg: 'No thumbnail (never saved)' });
    if (Array.isArray(b.editors) && b.editors.length > 5 && (now - tsMillis(b.updatedAt)) > THIRTY_D)
      flags.push({ type: 'warn', msg: `${b.editors.length} editors, inactive 30+ days` });
    if (!knownOwnerIds.has(b.ownerId))
      flags.push({ type: 'error', msg: 'Orphaned — owner has no boards' });
    return flags.length ? [{ ...b, flags }] : [];
  });

  return (
    <div className="analytics-panel">
      <div className="analytics-panel-header">
        <div>
          <h3 className="analytics-panel-title">Board Health</h3>
          <p className="analytics-panel-sub">Flags computed from already-loaded board data — no extra reads</p>
        </div>
        <span style={{
          fontSize: 13, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
          background: issues.length > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
          color:  issues.length > 0 ? 'var(--red)' : '#22c55e',
          border: `1px solid ${issues.length > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
        }}>
          {issues.length} issue{issues.length !== 1 ? 's' : ''}
        </span>
      </div>

      {issues.length === 0
        ? <div className="analytics-empty" style={{ color: '#22c55e' }}>✓ All boards look healthy</div>
        : <div className="health-list">
            {issues.map(b => (
              <div key={b.id} className="health-row">
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{b.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--tx-4)' }}>{b.ownerEmail}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                  {b.flags.map((f, i) => (
                    <span key={i} className={'badge badge-' + (f.type === 'error' ? 'red' : 'amber')}>{f.msg}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
      }
    </div>
  );
}
