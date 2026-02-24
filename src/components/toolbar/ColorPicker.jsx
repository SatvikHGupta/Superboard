/**
 * ColorPicker — Custom styled color picker that works on mobile/tablet.
 * Replaces the native <input type="color"> which opens the OS color picker
 * (looks out of place). Shows a styled modal with swatches + hex input.
 */
import { useState, useEffect, useRef } from 'react';
import { COLORS } from '../../constants/colors.js';

export default function ColorPicker({ color, setColor }) {
  const [open,      setOpen]      = useState(false);
  const [hexInput,  setHexInput]  = useState('');
  const [customHex, setCustomHex] = useState('');
  const panelRef = useRef(null);
  const isCustom = !COLORS.includes(color);

  // Sync hex input when color changes externally
  useEffect(() => {
    setHexInput(color || '#000000');
    if (!COLORS.includes(color)) setCustomHex(color || '#000000');
  }, [color]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('pointerdown', handle);
    return () => document.removeEventListener('pointerdown', handle);
  }, [open]);

  function applyHex(val) {
    const cleaned = val.startsWith('#') ? val : '#' + val;
    if (/^#[0-9a-fA-F]{6}$/.test(cleaned)) {
      setColor(cleaned);
      setOpen(false);
    }
  }

  return (
    <div ref={panelRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6, padding: '0 4px' }}>

      {/* Preset swatches — shown inline in toolbar */}
      {COLORS.map(c => (
        <button
          key={c}
          className={'color-swatch' + (color === c ? ' active' : '') + (c.toUpperCase() === '#FFFFFF' ? ' color-swatch-white' : '')}
          style={{ background: c }}
          onClick={() => { setColor(c); setOpen(false); }}
          title={c}
        />
      ))}

      {/* Custom colour button — opens our panel */}
      <button
        className={'color-swatch' + (isCustom ? ' active' : '')}
        title="Custom colour"
        onClick={() => setOpen(v => !v)}
        style={{
          background: isCustom
            ? color
            : 'conic-gradient(red,yellow,lime,cyan,blue,magenta,red)',
          border: isCustom ? '2px solid white' : '2px solid rgba(255,255,255,0.3)',
          position: 'relative',
        }}
      />

      {/* Colour picker panel */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 10px)',
          left: '-4px',
          zIndex: 9999,
          background: 'var(--bg-2, #1a1d2e)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 14,
          padding: '16px',
          boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
          backdropFilter: 'blur(24px)',
          minWidth: 220,
          animation: 'fadeIn 0.15s ease',
        }}>
          <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>

          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>
            Select Colour
          </div>

          {/* All swatches in a grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 14 }}>
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => { setColor(c); setOpen(false); }}
                title={c}
                style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: c,
                  border: color === c ? '2px solid white' : '2px solid transparent',
                  cursor: 'pointer',
                  boxShadow: color === c ? '0 0 8px rgba(255,255,255,0.4)' : 'none',
                  transition: 'all 0.12s',
                  outline: c.toUpperCase() === '#FFFFFF' ? '1px solid rgba(255,255,255,0.15)' : 'none',
                  outlineOffset: -1,
                }}
              />
            ))}
          </div>

          {/* Current colour display */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: isCustom ? customHex || color : color,
              border: '1px solid rgba(255,255,255,0.15)',
              flexShrink: 0,
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 3 }}>HEX CODE</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  value={hexInput}
                  onChange={e => {
                    setHexInput(e.target.value);
                    const v = e.target.value.startsWith('#') ? e.target.value : '#' + e.target.value;
                    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
                      setCustomHex(v);
                    }
                  }}
                  onKeyDown={e => { if (e.key === 'Enter') applyHex(hexInput); }}
                  placeholder="#rrggbb"
                  style={{
                    flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 6, padding: '4px 8px', color: 'white', fontSize: 12, fontFamily: 'monospace',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={() => applyHex(hexInput)}
                  style={{
                    padding: '4px 10px', background: 'var(--a, #6366f1)', border: 'none',
                    borderRadius: 6, color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Set
                </button>
              </div>
            </div>
          </div>

          {/* Native colour wheel as fallback for precise picking */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0 0 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Colour wheel</span>
            <input
              type="color"
              value={customHex || color}
              onChange={e => { setCustomHex(e.target.value); setHexInput(e.target.value); }}
              onBlur={e => { setColor(e.target.value); setOpen(false); }}
              style={{ width: 32, height: 28, cursor: 'pointer', borderRadius: 4, border: 'none', background: 'transparent', padding: 0 }}
            />
          </div>
        </div>
      )}
    </div>
  );
}