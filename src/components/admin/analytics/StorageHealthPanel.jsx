import { useState } from 'react';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '../../../firebase/config.js';
import { fmtBytes } from './analyticsUtils.js';

export default function StorageHealthPanel({ boards }) {
  const [scanData, setScanData] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);

  async function runScan() {
    setScanning(true); setScanData(null); setProgress(0);
    const results = [];
    for (let i = 0; i < boards.length; i++) {
      const board = boards[i];
      try {
        const snap   = await getDocs(collection(db, 'boards', board.id, 'elements'));
        const elems  = snap.docs.map(d => d.data());
        const bytes  = elems.reduce((s, el) => s + JSON.stringify(el).length, 0);
        results.push({
          id: board.id, name: board.name, owner: board.ownerEmail,
          elemCount: elems.length, imageCount: elems.filter(el => el.type === 'image').length,
          totalBytes: bytes, warning: bytes > 800_000,
        });
      } catch { /* permission denied or missing — skip */ }
      setProgress(Math.round(((i + 1) / boards.length) * 100));
    }
    results.sort((a, b) => b.totalBytes - a.totalBytes);
    setScanData(results);
    setScanning(false);
  }

  return (
    <div className="analytics-panel">
      <div className="analytics-panel-header">
        <div>
          <h3 className="analytics-panel-title">Storage Usage</h3>
          <p className="analytics-panel-sub">Element counts and estimated size per board. Images (base64) dominate cost. Use sparingly — reads every elements subcollection.</p>
        </div>
        <button className="btn btn-primary" onClick={runScan} disabled={scanning}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {scanning
            ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>{progress}%</>
            : <>Run Scan</>}
        </button>
      </div>

      {!scanData && !scanning && (
        <div className="analytics-empty">Click "Run Scan" to analyse storage per board.</div>
      )}

      {scanData && (
        <table className="boards-table" style={{ marginTop: 0 }}>
          <thead>
            <tr>
              <th>Board</th><th>Owner</th>
              <th style={{ textAlign: 'right' }}>Elements</th>
              <th style={{ textAlign: 'right' }}>Images</th>
              <th style={{ textAlign: 'right' }}>Est. Size</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {scanData.map(row => (
              <tr key={row.id} style={{ background: row.warning ? 'rgba(239,68,68,0.06)' : undefined }}>
                <td><div style={{ fontWeight: 600, fontSize: 13 }}>{row.name}</div><div style={{ fontSize: 11, color: 'var(--tx-4)' }}>{row.id.slice(0, 10)}…</div></td>
                <td style={{ fontSize: 12, color: 'var(--tx-3)' }}>{row.owner}</td>
                <td style={{ textAlign: 'right' }}>{row.elemCount}</td>
                <td style={{ textAlign: 'right' }}>{row.imageCount}</td>
                <td style={{ textAlign: 'right', fontWeight: 600, color: row.warning ? 'var(--red)' : 'var(--tx-2)' }}>{fmtBytes(row.totalBytes)}</td>
                <td>{row.warning ? <span className="badge badge-red">⚠ Near limit</span> : <span className="badge badge-green">OK</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
