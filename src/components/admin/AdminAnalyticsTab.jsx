import { useState, useEffect } from 'react';
import { getAuditLogs, pruneAuditLogs } from '../../firebase/auditService.js';
import LiveUsersPanel        from './analytics/LiveUsersPanel.jsx';
import ActivityHeatmap       from './analytics/ActivityHeatmap.jsx';
import StorageHealthPanel    from './analytics/StorageHealthPanel.jsx';
import BoardHealthPanel      from './analytics/BoardHealthPanel.jsx';
import UsageAttributionPanel from './analytics/UsageAttributionPanel.jsx';
import AuditLogPanel         from './analytics/AuditLogPanel.jsx';

export default function AdminAnalyticsTab({ boards, users }) {
  const [logs,        setLogs]        = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [pruning,     setPruning]     = useState(false);

  useEffect(() => {
    getAuditLogs(200).then(l => { setLogs(l); setLogsLoading(false); });
  }, []);

  async function handlePrune() {
    setPruning(true);
    const deleted = await pruneAuditLogs(30);
    const fresh   = await getAuditLogs(200);
    setLogs(fresh);
    setPruning(false);
    alert(`Pruned ${deleted} log entries older than 30 days.`);
  }

  return (
    <div className="analytics-page">
      <UsageAttributionPanel logs={logs} />
      <LiveUsersPanel />
      <ActivityHeatmap boards={boards} />
      <StorageHealthPanel boards={boards} />
      <BoardHealthPanel boards={boards} users={users} />
      {logsLoading
        ? <div className="analytics-panel"><div className="analytics-loading">Loading audit log…</div></div>
        : <AuditLogPanel logs={logs} onPrune={handlePrune} pruning={pruning} />
      }
    </div>
  );
}