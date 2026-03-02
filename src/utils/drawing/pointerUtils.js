//basically stylus support but made mouse better

/* ── Pointer position relative to canvas (in logical CSS pixels) ── */
export function getPointerPos(e, canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr  = window.devicePixelRatio || 1;

  // Support both mouse/pointer events (clientX/Y) and touch events
  let clientX, clientY;
  if (e.touches && e.touches.length > 0) {
    // Touch event — use first touch point
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }

  const logicalW = canvas.width / dpr;
  const logicalH = canvas.height / dpr;
  const scaleX   = logicalW / rect.width;
  const scaleY   = logicalH / rect.height;

  // Pressure: 0.5 for mouse/touch (no pressure data), real value for stylus
  // e.pressure is 0 on pointerdown for some devices — default to 0.5 in that case
  const rawPressure = e.pressure ?? 0.5;
  const pressure    = rawPressure === 0 ? 0.5 : rawPressure;

  // Tilt (degrees, -90 to 90) — only meaningful for stylus
  const tiltX = e.tiltX ?? 0;
  const tiltY = e.tiltY ?? 0;

  // Pointer type: 'mouse' | 'touch' | 'pen'
  const pointerType = e.pointerType ?? 'mouse';

  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top)  * scaleY,
    pressure,
    tiltX,
    tiltY,
    pointerType,
  };
}