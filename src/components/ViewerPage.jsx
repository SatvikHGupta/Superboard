import { useState, useEffect, useRef } from 'react';
import { getBoardById, getElements } from '../utils/storage.js';
import { renderCanvas, exportAsPNG, exportAsPDF } from '../utils/drawing/index.js';

export default function ViewerPage({ boardId }) {
  var [board, setBoard] = useState(null);
  var [elements, setElements] = useState([]);
  var [loading, setLoading] = useState(true);
  var canvasRef = useRef(null);
  var [exportOpen, setExportOpen] = useState(false);
  var [exportReady, setExportReady] = useState(null);

  useEffect(function () {
    var b = getBoardById(boardId);
    setBoard(b);
    if (b) {
      var els = getElements(boardId);
      setElements(els);
    }
    setLoading(false);
  }, [boardId]);

  useEffect(function () {
    if (!board) return;
    var canvas = canvasRef.current;
    if (!canvas) return;
    var dpr = window.devicePixelRatio || 1;
    var w = board.boardWidth || 1200;
    var h = board.boardHeight || 1600;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    renderCanvas(ctx, elements, w, h, false, null);
  }, [board, elements]);

  if (loading) {
    return (
      <div className="error-page">
        <div style={{ color: 'var(--tx-3)' }}>Loading...</div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="error-page">
        <div className="glass-card error-card">
          <div className="error-icon" style={{ background: 'rgba(239,68,68,0.1)' }}>⚠️</div>
          <div className="error-title">Board Not Found</div>
          <div className="error-text">This board may have been deleted or does not exist.</div>
          <a className="btn btn-primary" href="#/" style={{ textDecoration: 'none' }}>Go Home</a>
        </div>
      </div>
    );
  }

  if (board.visibility !== 'public') {
    return (
      <div className="error-page">
        <div className="glass-card error-card">
          <div className="error-icon" style={{ background: 'rgba(245,158,11,0.1)' }}>🔒</div>
          <div className="error-title">Private Board</div>
          <div className="error-text">This board is private. Ask the owner for access.</div>
          <a className="btn btn-primary" href="#/" style={{ textDecoration: 'none' }}>Go Home</a>
        </div>
      </div>
    );
  }

  var bw = board.boardWidth || 1200;
  var bh = board.boardHeight || 1600;

  function handleExport(type) {
    try {
      var result;
      if (type === 'png') {
        result = exportAsPNG(elements, bw, bh);
      } else {
        result = exportAsPDF(elements, bw, bh);
      }
      setExportReady(result);
    } catch (err) {
      alert('Export failed: ' + err.message);
    }
  }

  return (
    <div className="viewer-page">
      <header className="viewer-header glass-strong">
        <div className="viewer-header-left">
          <a className="btn-icon" href="#/" title="Home">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </a>
          <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--tx-1)' }}>{board.name}</span>
          <span className="badge badge-blue">View-only</span>
        </div>
        <div className="viewer-header-right" style={{ position: 'relative' }}>
          <button className="btn-icon" onClick={function () { setExportOpen(!exportOpen); setExportReady(null); }} title="Export">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
          {exportOpen && (
            <div className="dropdown-menu" style={{ minWidth: 220 }}>
              {exportReady ? (
                <div style={{ padding: 16, textAlign: 'center' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"
                    style={{ margin: '0 auto 8px', display: 'block' }}>
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  <div style={{ color: 'var(--tx-1)', fontWeight: 600, fontSize: 14, marginBottom: 10 }}>
                    Ready to download!
                  </div>
                  <a
                    href={exportReady.url}
                    download={exportReady.filename}
                    onClick={function () { setTimeout(function () { setExportOpen(false); setExportReady(null); }, 300); }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      padding: '8px 18px', background: 'var(--a)', color: '#fff',
                      borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 13
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Download {exportReady.filename}
                  </a>
                  <div style={{ marginTop: 10 }}>
                    <button className="btn-ghost" onClick={function () { setExportReady(null); }}
                      style={{ fontSize: 11, padding: '3px 8px' }}>
                      ← Back
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button className="dropdown-item" onClick={function () { handleExport('png'); }}>
                    <span style={{ color: 'var(--tx-1)' }}>Download PNG</span>
                  </button>
                  <button className="dropdown-item" onClick={function () { handleExport('pdf'); }}>
                    <span style={{ color: 'var(--tx-1)' }}>Download PDF</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="viewer-canvas-area">
        <canvas ref={canvasRef} className="canvas-element" style={{ background: '#fff' }} />
      </div>
    </div>
  );
}
