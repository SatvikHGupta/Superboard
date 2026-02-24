/**
 * QuotaWarningBanner — Shows a dismissible warning when Firestore daily
 * limits are approaching. Mounts inside App.jsx, appears site-wide.
 */
import { useState, useEffect } from 'react';
import { getQuotaStatus, LIMITS } from '../utils/quotaTracker.js';

export default function QuotaWarningBanner() {
  const [status,    setStatus]    = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    function check() {
      const s = getQuotaStatus();
      setStatus(s);
    }
    check();
    // Re-check every 2 minutes
    const t = setInterval(check, 120_000);
    return () => clearInterval(t);
  }, []);

  if (!status?.hasWarning || dismissed) return null;

  const pct = (current, limit) => Math.min(100, Math.round((current / limit) * 100));
  const isCritical = status.warnings.some(w => w.current >= w.limit * 0.95);

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      maxWidth: 520,
      width: 'calc(100vw - 32px)',
      background: isCritical ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.12)',
      border: `1px solid ${isCritical ? 'rgba(239,68,68,0.4)' : 'rgba(245,158,11,0.35)'}`,
      borderRadius: 14,
      padding: '14px 18px',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)',
    }}>
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateX(-50%) translateY(20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ fontSize: 20, flexShrink: 0 }}>{isCritical ? '🚨' : '⚠️'}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 700,
            color: isCritical ? '#ef4444' : '#f59e0b',
            marginBottom: 6,
          }}>
            {isCritical ? 'Firebase Quota Critical!' : 'Firebase Daily Quota Warning'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {status.warnings.map(w => (
              <div key={w.type}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 12, color: 'var(--tx-3)', textTransform: 'capitalize' }}>
                    {w.type}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx-2)' }}>
                    {w.current.toLocaleString()} / {w.limit.toLocaleString()}
                  </span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: pct(w.current, w.limit) + '%',
                    background: pct(w.current, w.limit) >= 95
                      ? 'linear-gradient(90deg,#ef4444,#dc2626)'
                      : 'linear-gradient(90deg,#f59e0b,#d97706)',
                    borderRadius: 4,
                    transition: 'width 0.3s',
                  }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--tx-4)', marginTop: 8 }}>
            Resets at midnight UTC. Counts reflect this client's operations today.
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          style={{
            flexShrink: 0, padding: 4, background: 'transparent', border: 'none',
            color: 'var(--tx-4)', cursor: 'pointer', borderRadius: 6, transition: 'all 0.12s',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  );
}