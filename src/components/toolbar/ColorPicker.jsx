/* go go power rangers */

import { useState, useEffect, useRef }  from 'react';
import { createPortal }                  from 'react-dom';
import { COLORS }                        from '../../constants/colors.js';

const POPUP_W = 220;
const POPUP_H = 295; // approximate — used for direction test only

export default function ColorPicker({ color, setColor }) {
  const [open,      setOpen]      = useState(false);
  const [pos,       setPos]       = useState(null);
  const [hexInput,  setHexInput]  = useState('');
  const [customHex, setCustomHex] = useState('');
  const triggerRef = useRef(null);
  const panelRef   = useRef(null);
  const isCustom   = !COLORS.includes(color);

  // Keep hex input in sync when colour changes externally (e.g. undo)
  useEffect(() => {
    setHexInput(color || '#000000');
    if (!COLORS.includes(color)) setCustomHex(color || '#000000');
  }, [color]);

  // ── Position calculation ─────────────────────────────────────────────
  function calcPos() {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;

    // RIGHT-align with the trigger's right edge, clamp to stay on screen
    let left = r.right - POPUP_W;
    left = Math.max(8, Math.min(left, window.innerWidth - POPUP_W - 8));

    const spaceBelow = window.innerHeight - r.bottom;
    if (spaceBelow >= POPUP_H + 16) {
      // Enough space below → drop down
      setPos({ top: r.bottom + 6, left, dir: 'down' });
    } else {
      // Not enough space → pop up (top of popup is POPUP_H above trigger top)
      setPos({ top: r.top - POPUP_H - 6, left, dir: 'up' });
    }
  }

  useEffect(() => {
    if (!open) return;
    calcPos();
    window.addEventListener('resize', calcPos);
    return () => window.removeEventListener('resize', calcPos);
  }, [open]); 

  // Close on outside pointer-down
  useEffect(() => {
    if (!open) return;
    function handle(e) {
      if (
        panelRef.current   && !panelRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)
      ) setOpen(false);
    }
    const id = setTimeout(() => document.addEventListener('pointerdown', handle), 80);
    return () => { clearTimeout(id); document.removeEventListener('pointerdown', handle); };
  }, [open]);

  function applyHex(val) {
    const cleaned = val.startsWith('#') ? val : '#' + val;
    if (/^#[0-9a-fA-F]{6}$/.test(cleaned)) {
      setColor(cleaned);
      setCustomHex(cleaned);
      setHexInput(cleaned);
      setOpen(false);
    }
  }

  const wheelValue = (customHex || color || '#000000').slice(0, 7);

  // Portal popup
  const popup = open && pos ? createPortal(
    <>
      <style>{`
        @keyframes cpDown { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes cpUp   { from{opacity:0;transform:translateY(6px)}  to{opacity:1;transform:translateY(0)} }
      `}</style>
      <div
        ref={panelRef}
        style={{
          position: 'fixed',
          top:    pos.top,
          left:   pos.left,
          width:  POPUP_W,
          zIndex: 2147483647,
          background:   'var(--bg-2, #1a1d2e)',
          border:       '1px solid rgba(255,255,255,0.12)',
          borderRadius: 14,
          padding:      '16px',
          boxShadow: pos.dir === 'down'
            ? '0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)'
            : '0 -8px 32px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(24px)',
          animation: pos.dir === 'down' ? 'cpDown 0.15s ease' : 'cpUp 0.15s ease',
        }}
      >
        {/* ── Color wheel (visual) + hidden native picker ── */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, marginBottom:14 }}>
          <div style={{ position:'relative', width:110, height:110 }}>
            <div style={{
              width:110, height:110, borderRadius:'50%',
              background:'conic-gradient(red,yellow,lime,cyan,blue,magenta,red)',
              boxShadow:'0 0 0 3px rgba(255,255,255,0.1), 0 4px 20px rgba(0,0,0,0.4)',
            }} />
            {/* Current colour dot */}
            <div style={{
              position:'absolute', top:'50%', left:'50%',
              transform:'translate(-50%,-50%)',
              width:42, height:42, borderRadius:'50%',
              background: color,
              border:'3px solid rgba(255,255,255,0.9)',
              boxShadow:'0 2px 8px rgba(0,0,0,0.5)',
              pointerEvents:'none',
            }} />
            {/* Invisible native colour input */}
            <input
              type="color"
              value={wheelValue}
              onChange={e => {
                const v = e.target.value;
                setCustomHex(v); setHexInput(v); setColor(v);
              }}
              style={{
                position:'absolute', inset:0,
                width:'100%', height:'100%',
                opacity:0, cursor:'pointer', zIndex:2,
                padding:0, border:'none',
              }}
            />
          </div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', fontWeight:600 }}>
            Tap to open colour picker
          </div>
        </div>

        {/* ── Hex input ── */}
        <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)', paddingTop:12 }}>
          <div style={{
            fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.4)',
            textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:8,
          }}>
            Hex value
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
            <div style={{
              width:30, height:30, borderRadius:6,
              background: isCustom ? customHex || color : color,
              border:'1px solid rgba(255,255,255,0.15)', flexShrink:0,
            }} />
            <input
              value={hexInput}
              onChange={e => {
                setHexInput(e.target.value);
                const v = e.target.value.startsWith('#') ? e.target.value : '#' + e.target.value;
                if (/^#[0-9a-fA-F]{6}$/.test(v)) setCustomHex(v);
              }}
              onKeyDown={e => { if (e.key === 'Enter') applyHex(hexInput); }}
              placeholder="#rrggbb"
              style={{
                flex:1, background:'rgba(255,255,255,0.06)',
                border:'1px solid rgba(255,255,255,0.1)',
                borderRadius:6, padding:'5px 8px',
                color:'white', fontSize:12,
                fontFamily:'monospace', outline:'none', minWidth:0,
              }}
            />
          </div>
          <button
            onClick={() => applyHex(hexInput)}
            style={{
              width:'100%', padding:'7px 0',
              background:'var(--a, #6366f1)',
              border:'none', borderRadius:6,
              color:'white', fontSize:13, fontWeight:600, cursor:'pointer',
            }}
          >
            Apply colour
          </button>
        </div>
      </div>
    </>,
    document.body
  ) : null;

  return (
    <>
      <div style={{ position:'relative', display:'flex', alignItems:'center', gap:6, padding:'0 4px' }}>
        {/* Preset swatches */}
        {COLORS.map(c => (
          <button
            key={c}
            className={'color-swatch' + (color === c ? ' active' : '') + (c.toUpperCase() === '#FFFFFF' ? ' color-swatch-white' : '')}
            style={{ background: c }}
            onClick={() => { setColor(c); setOpen(false); }}
            title={c}
          />
        ))}
        {/* Custom colour trigger */}
        <button
          ref={triggerRef}
          className={'color-swatch' + (isCustom ? ' active' : '')}
          title="Custom colour"
          onClick={() => setOpen(v => !v)}
          style={{
            background: isCustom
              ? color
              : 'conic-gradient(red,yellow,lime,cyan,blue,magenta,red)',
            border: isCustom ? '2px solid white' : '2px solid rgba(255,255,255,0.3)',
          }}
        />
      </div>
      {popup}
    </>
  );
}