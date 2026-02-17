import { useState, useRef, useEffect } from 'react';
import { exportAsPNG, exportAsPDF } from '../../utils/drawing/index.js';

export default function ExportDropdown({ elements, boardWidth, boardHeight }) {
  var wrapRef = useRef(null);
  var [open, setOpen] = useState(false);
  var [generating, setGenerating] = useState(false);
  /* ready holds { url, filename } when export is done */
  var [ready, setReady] = useState(null);

  useEffect(function () {
    function onClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setReady(null);
      }
    }
    if (open) document.addEventListener('mousedown', onClick);
    return function () { document.removeEventListener('mousedown', onClick); };
  }, [open]);

  function handleExport(type) {
    setGenerating(true);
    setReady(null);
    setTimeout(function () {
      try {
        var result;
        if (type === 'png') {
          result = exportAsPNG(elements, boardWidth, boardHeight);
        } else {
          result = exportAsPDF(elements, boardWidth, boardHeight);
        }
        setReady(result);
      } catch (err) {
        alert('Export failed: ' + err.message);
      }
      setGenerating(false);
    }, 50);
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        className="btn-icon"
        onClick={function () { setOpen(!open); setReady(null); }}
        title="Export"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </button>

      {open && (
        <div className="dropdown-menu" style={{ minWidth: 240 }}>

          {/* ── Generating spinner ── */}
          {generating && (
            <div style={{ padding: '24px 16px', textAlign: 'center' }}>
              <div style={{
                width: 28, height: 28, margin: '0 auto 10px',
                border: '3px solid var(--b-2, #334155)',
                borderTopColor: 'var(--a, #6366f1)',
                borderRadius: '50%',
                animation: 'spin 0.6s linear infinite'
              }} />
              <div style={{ color: 'var(--tx-2, #94a3b8)', fontSize: 13 }}>
                Generating file...
              </div>
            </div>
          )}

          {/* ── Ready — show download link user clicks ── */}
          {!generating && ready && (
            <div style={{ padding: '16px', textAlign: 'center' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"
                style={{ margin: '0 auto 8px', display: 'block' }}>
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <div style={{
                color: 'var(--tx-1, #e2e8f0)',
                fontWeight: 600, fontSize: 14, marginBottom: 12
              }}>
                Ready to download!
              </div>

              {/* THIS IS THE KEY — a real <a> tag the user physically clicks */}
              <a
                href={ready.url}
                download={ready.filename}
                onClick={function () {
                  setTimeout(function () { setOpen(false); setReady(null); }, 500);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 20px',
                  background: 'var(--a, #6366f1)',
                  color: '#fff',
                  borderRadius: 8,
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseOver={function (e) { e.currentTarget.style.background = 'var(--a-h, #818cf8)'; }}
                onMouseOut={function (e) { e.currentTarget.style.background = 'var(--a, #6366f1)'; }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download {ready.filename}
              </a>

              <div style={{ marginTop: 12 }}>
                <button
                  className="btn-ghost"
                  onClick={function () { setReady(null); }}
                  style={{ fontSize: 12, padding: '4px 10px' }}
                >
                  ← Back to options
                </button>
              </div>
            </div>
          )}

          {/* ── Format selection buttons ── */}
          {!generating && !ready && (
            <>
              <button className="dropdown-item" onClick={function () { handleExport('png'); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <div>
                  <div style={{ color: 'var(--tx-1, #e2e8f0)', fontWeight: 500 }}>PNG Image</div>
                  <div style={{ fontSize: 11, color: 'var(--tx-4, #475569)' }}>High resolution image</div>
                </div>
              </button>
              <button className="dropdown-item" onClick={function () { handleExport('pdf'); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <div>
                  <div style={{ color: 'var(--tx-1, #e2e8f0)', fontWeight: 500 }}>PDF Document</div>
                  <div style={{ fontSize: 11, color: 'var(--tx-4, #475569)' }}>Print-ready format</div>
                </div>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
