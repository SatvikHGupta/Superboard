// iska z-index touch nhi karne ka

import { useState, useRef, useEffect } from 'react';
import { createPortal }                 from 'react-dom';
import { exportAsPNG, exportAsPDF }     from '../../utils/drawing/index.js';

const MENU_W = 270;
const MENU_H = 180; // approx — used for direction test

export default function ExportDropdown({ elements, boardWidth, boardHeight, boardName }) {
  const btnRef = useRef(null);

  const [open,       setOpen]       = useState(false);
  const [pos,        setPos]        = useState(null);
  const [generating, setGenerating] = useState(false);
  const [ready,      setReady]      = useState(null); // { url (object URL), filename }

  //  Position calculation 
  function calcPos() {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;

    // Right-align menu with button's right edge, clamp to viewport
    let left = r.right - MENU_W;
    left = Math.max(8, Math.min(left, window.innerWidth - MENU_W - 8));

    const spaceBelow = window.innerHeight - r.bottom;
    if (spaceBelow >= MENU_H + 16) {
      setPos({ top: r.bottom + 6, left, dir: 'down' });
    } else {
      setPos({ top: r.top - MENU_H - 6, left, dir: 'up' });
    }
  }

  function openMenu() {
    calcPos();
    setOpen(true);
    setReady(null);
  }

  function closeMenu() {
    if (ready?.url) URL.revokeObjectURL(ready.url);
    setOpen(false);
    setPos(null);
    setReady(null);
  }

  useEffect(() => {
    if (!open) return;
    window.addEventListener('resize', calcPos);
    return () => window.removeEventListener('resize', calcPos);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onOutside(e) {
      if (btnRef.current && !btnRef.current.contains(e.target) &&
          (!panelRef.current || !panelRef.current.contains(e.target))) {
        closeMenu();
      }
    }
    const id = setTimeout(() => document.addEventListener('pointerdown', onOutside), 80);
    return () => { clearTimeout(id); document.removeEventListener('pointerdown', onOutside); };
  }, [open, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const panelRef = useRef(null);

  // Export
  async function handleExport(type) {
    setGenerating(true);
    setReady(null);
    try {
      const result = type === 'png'
        ? await exportAsPNG(elements, boardWidth, boardHeight, boardName)
        : await exportAsPDF(elements, boardWidth, boardHeight, boardName);

      // Convert data URL → Blob → object URL (no browser size limits)
      const objectUrl = dataUrlToObjectUrl(result.url);
      setReady({ url: objectUrl, filename: result.filename });
    } catch (err) {
      alert('Export failed: ' + err.message);
    } finally {
      setGenerating(false);
    }
  }

  // Trigger actual download 
  function triggerDownload() {
    if (!ready) return;
    const a = document.createElement('a');
    a.href     = ready.url;
    a.download = ready.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Revoke object URL after browser has a moment to start the download
    setTimeout(() => {
      URL.revokeObjectURL(ready.url);
      closeMenu();
    }, 1000);
  }

  //  Portal menu
  const menu = open && pos ? createPortal(
    <>
      <style>{`
        @keyframes expDown { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes expUp   { from{opacity:0;transform:translateY(6px)}  to{opacity:1;transform:translateY(0)} }
      `}</style>
      <div
        ref={panelRef}
        style={{
          position: 'fixed',
          top:      pos.top,
          left:     pos.left,
          width:    MENU_W,
          zIndex:   2147483647,
          background:   'var(--bg-2)',
          border:       '1px solid var(--br-2)',
          borderRadius: 'var(--r-lg)',
          boxShadow: pos.dir === 'down'
            ? '0 8px 40px rgba(0,0,0,0.5)'
            : '0 -4px 32px rgba(0,0,0,0.5)',
          padding: 6,
          animation: pos.dir === 'down' ? 'expDown 0.15s ease' : 'expUp 0.15s ease',
        }}
      >
        {/* ── Generating spinner ── */}
        {generating && (
          <div style={{ padding:'24px 16px', textAlign:'center' }}>
            <div style={{
              width:28, height:28, margin:'0 auto 10px',
              border:'3px solid var(--bg-4)',
              borderTopColor:'var(--a)',
              borderRadius:'50%',
              animation:'spin 0.6s linear infinite',
            }} />
            <div style={{ color:'var(--tx-2)', fontSize:13 }}>Generating file…</div>
          </div>
        )}

        {/* ── Ready — download button ── */}
        {!generating && ready && (
          <div style={{ padding:16, textAlign:'center' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
              stroke="#22c55e" strokeWidth="2.5"
              style={{ margin:'0 auto 8px', display:'block' }}>
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <div style={{ color:'var(--tx-1)', fontWeight:600, fontSize:14, marginBottom:12 }}>
              Ready to download!
            </div>
            <button
              onClick={triggerDownload}
              style={{
                display:'inline-flex', alignItems:'center', gap:8,
                padding:'10px 20px',
                background:'var(--a)', color:'#fff',
                border:'none', borderRadius:8,
                fontWeight:600, fontSize:14, cursor:'pointer',
              }}
              onMouseOver={e => e.currentTarget.style.opacity='0.85'}
              onMouseOut={e  => e.currentTarget.style.opacity='1'}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download {ready.filename}
            </button>
            <div style={{ marginTop:10 }}>
              <button
                className="btn-ghost"
                onClick={() => { URL.revokeObjectURL(ready.url); setReady(null); }}
                style={{ fontSize:12, padding:'4px 10px' }}
              >
                ← Back to options
              </button>
            </div>
          </div>
        )}

        {/* ── Format selection ── */}
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
                <div style={{ color:'var(--tx-1)', fontWeight:500 }}>PNG Image</div>
                <div style={{ fontSize:11, color:'var(--tx-4)' }}>High resolution · all layers</div>
              </div>
            </button>

            <button className="dropdown-item" onClick={() => handleExport('pdf')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="#ef4444" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <div>
                <div style={{ color:'var(--tx-1)', fontWeight:500 }}>PDF Document</div>
                <div style={{ fontSize:11, color:'var(--tx-4)' }}>Print-ready format</div>
              </div>
            </button>
          </>
        )}
      </div>
    </>,
    document.body
  ) : null;

  return (
    <>
      <button
        ref={btnRef}
        className="btn-icon"
        onClick={() => open ? closeMenu() : openMenu()}
        title="Export board"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </button>
      {menu}
    </>
  );
}

// Helper: data URL → Blob → object URL 
// Avoids all browser data-URL-in-href size limits (Chrome >2MB, iOS Safari).
function dataUrlToObjectUrl(dataUrl) {
  try {
    const [header, base64] = dataUrl.split(',');
    const mime   = header.match(/:(.*?);/)[1];
    const binary = atob(base64);
    const bytes  = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return URL.createObjectURL(new Blob([bytes], { type: mime }));
  } catch {
    return dataUrl; // fallback for small exports
  }
}