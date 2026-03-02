//when hoo active

import { useState } from 'react';
import { tsMillis } from './analyticsUtils.js';

export default function ActivityHeatmap({ boards }) {
  const [range, setRange] = useState(30);
  const now      = Date.now();
  const msPerDay = 86400000;

  const counts = {};
  boards.forEach(b => {
    const t = tsMillis(b.updatedAt || b.createdAt);
    if (!t) return;
    const offset = Math.floor((now - t) / msPerDay);
    if (offset >= 0 && offset < range) counts[offset] = (counts[offset] || 0) + 1;
  });

  const maxCount = Math.max(1, ...Object.values(counts));

  function cellColor(count) {
    if (!count) return 'var(--bg-3)';
    const i = count / maxCount;
    if (i > 0.75) return '#6366f1';
    if (i > 0.5)  return 'rgba(99,102,241,0.65)';
    if (i > 0.25) return 'rgba(99,102,241,0.4)';
    return 'rgba(99,102,241,0.2)';
  }

  const weeks = Math.ceil(range / 7);
  const grid  = Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => { const o = w * 7 + d; return o < range ? o : null; })
  );

  function label(offset) {
    return new Date(now - offset * msPerDay).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return (
    <div className="analytics-panel">
      <div className="analytics-panel-header">
        <div>
          <h3 className="analytics-panel-title">Activity Heatmap</h3>
          <p className="analytics-panel-sub">Board edit activity per day (from updatedAt timestamps — no extra reads)</p>
        </div>
        <div className="filter-group">
          {[7, 30, 90].map(r => (
            <button key={r} className={'filter-btn' + (range === r ? ' active' : '')} onClick={() => setRange(r)}>{r}d</button>
          ))}
        </div>
      </div>

      <div className="heatmap-grid" style={{ gridTemplateColumns: `repeat(${weeks}, 1fr)` }}>
        {grid.map((col, w) => (
          <div key={w} className="heatmap-col">
            {col.map((offset, d) =>
              offset === null
                ? <div key={d} className="heatmap-cell empty" />
                : <div key={d} className="heatmap-cell"
                    style={{ background: cellColor(counts[offset] || 0) }}
                    title={`${label(offset)}: ${counts[offset] || 0} board${counts[offset] !== 1 ? 's' : ''} updated`}
                  />
            )}
          </div>
        ))}
      </div>

      <div className="heatmap-legend">
        <span style={{ fontSize: 11, color: 'var(--tx-4)' }}>Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
          <div key={i} className="heatmap-cell" style={{ background: cellColor(v * maxCount), flexShrink: 0 }} />
        ))}
        <span style={{ fontSize: 11, color: 'var(--tx-4)' }}>More</span>
      </div>
    </div>
  );
}
