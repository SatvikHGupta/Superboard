export default function UsageAttributionPanel({ logs }) {
  const byUser = {};
  logs.forEach(log => {
    const key = log.actorEmail || log.actorId || 'unknown';
    if (!byUser[key]) byUser[key] = { email: key, writes: 0, reads: 0, realtime: 0, actions: [] };
    if (log.cost === 'write')    byUser[key].writes++;
    if (log.cost === 'read')     byUser[key].reads++;
    if (log.cost === 'realtime') byUser[key].realtime++;
    byUser[key].actions.push(log.label);
  });

  const rows = Object.values(byUser).sort((a, b) => (b.writes + b.reads) - (a.writes + a.reads));

  return (
    <div className="analytics-panel">
      <div className="analytics-panel-header">
        <div>
          <h3 className="analytics-panel-title">Firebase Usage Attribution</h3>
          <p className="analytics-panel-sub">Estimated reads/writes per user from this session's audit log</p>
        </div>
      </div>

      {rows.length === 0
        ? <div className="analytics-empty">No audit data yet — actions will appear here as they happen.</div>
        : <table className="boards-table" style={{ marginTop: 0 }}>
            <thead>
              <tr>
                <th>User</th>
                <th style={{ textAlign: 'right' }}>Writes</th>
                <th style={{ textAlign: 'right' }}>Reads</th>
                <th style={{ textAlign: 'right' }}>Realtime</th>
                <th>Recent Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.email}>
                  <td style={{ fontWeight: 600, fontSize: 13 }}>{row.email}</td>
                  <td style={{ textAlign: 'right', color: '#f59e0b', fontWeight: 600 }}>{row.writes}</td>
                  <td style={{ textAlign: 'right', color: '#3b82f6', fontWeight: 600 }}>{row.reads}</td>
                  <td style={{ textAlign: 'right', color: '#8b5cf6', fontWeight: 600 }}>{row.realtime}</td>
                  <td style={{ fontSize: 12, color: 'var(--tx-3)', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {[...new Set(row.actions)].slice(0, 4).join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      }
    </div>
  );
}
