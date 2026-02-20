// src/components/whiteboard/ExportDropdown.jsx
//
// B4: accept boardName prop — passed to export functions for correct filename
// B4: handleExport is now async (export functions are async for image preloading)

import { useState, useRef, useEffect } from 'react';
import { exportAsPNG, exportAsPDF } from '../../utils/drawing/index.js';

export default function ExportDropdown({ elements, boardWidth, boardHeight, boardName }) {
  const wrapRef = useRef(null);
  const [open,       setOpen]       = useState(false);
  const [generating, setGenerating] = useState(false);
  const [ready,      setReady]      = useState(null); // { url, filename }

  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setReady(null);
      }
    }
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  // Now async — awaits image preloading inside the export functions
  async function handleExport(type) {
    setGenerating(true);
    setReady(null);
    try {
      let result;
      if (type === 'png') {
        result = await exportAsPNG(elements, boardWidth, boardHeight, boardName);
      } else {
        result = await exportAsPDF(elements, boardWidth, boardHeight, boardName);
      }
      setReady(result);
    } catch (err) {
      alert('Export failed: ' + err.message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        className="btn-icon"
        onClick={() => { setOpen(!open); setReady(null); }}
        title="Export board"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </button>

      {open && (
        <div className="dropdown-menu" style={{ minWidth: 240 }}>

          {/* Generating spinner */}
          {generating && (
            <div style={{ padding: '24px 16px', textAlign: 'center' }}>
              <div style={{
                width: 28, height: 28, margin: '0 auto 10px',
                border: '3px solid var(--bg-4)',
                borderTopColor: 'var(--a)',
                borderRadius: '50%',
                animation: 'spin 0.6s linear infinite',
              }} />
              <div style={{ color: 'var(--tx-2)', fontSize: 13 }}>
                Generating file…
              </div>
            </div>
          )}

          {/* Ready — download link */}
          {!generating && ready && (
            <div style={{ padding: 16, textAlign: 'center' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                stroke="#22c55e" strokeWidth="2.5"
                style={{ margin: '0 auto 8px', display: 'block' }}>
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <div style={{ color: 'var(--tx-1)', fontWeight: 600, fontSize: 14, marginBottom: 12 }}>
                Ready to download!
              </div>
              <a
                href={ready.url}
                download={ready.filename}
                onClick={() => setTimeout(() => { setOpen(false); setReady(null); }, 500)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 20px', background: 'var(--a)', color: '#fff',
                  borderRadius: 8, textDecoration: 'none', fontWeight: 600,
                  fontSize: 14, cursor: 'pointer',
                }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--a-light)'}
                onMouseOut={e  => e.currentTarget.style.background = 'var(--a)'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download {ready.filename}
              </a>
              <div style={{ marginTop: 12 }}>
                <button className="btn-ghost" onClick={() => setReady(null)}
                  style={{ fontSize: 12, padding: '4px 10px' }}>
                  ← Back to options
                </button>
              </div>
            </div>
          )}

          {/* Format selection */}
          {!generating && !ready && (
            <>
              <button className="dropdown-item" onClick={() => handleExport('png')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="#3b82f6" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <div>
                  <div style={{ color: 'var(--tx-1)', fontWeight: 500 }}>PNG Image</div>
                  <div style={{ fontSize: 11, color: 'var(--tx-4)' }}>High resolution · all layers</div>
                </div>
              </button>
              <button className="dropdown-item" onClick={() => handleExport('pdf')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="#ef4444" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <div>
                  <div style={{ color: 'var(--tx-1)', fontWeight: 500 }}>PDF Document</div>
                  <div style={{ fontSize: 11, color: 'var(--tx-4)' }}>Print-ready format</div>
                </div>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}