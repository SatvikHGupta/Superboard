// src/utils/drawing/elements/drawFreehand.js
// v1.4: Added pressure-sensitive variable-width strokes for stylus input.
// Points now optionally carry { x, y, pressure } — when pressure data is
// present and varies, the stroke is drawn as a filled polygon (variable width)
// instead of a single stroked path.  Mouse and touch strokes are unaffected.

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ points: {x:number, y:number, pressure?:number}[], strokeWidth:number, color:string }} el
 */
export function drawFreehand(ctx, el) {
  const pts = el.points;
  if (!pts || pts.length === 0) return;

  // Check if this stroke has meaningful pressure variation (stylus)
  const hasPressure = pts.some(p => p.pressure !== undefined && p.pressure !== 0.5);

  // Single point — draw a dot
  if (pts.length === 1) {
    const r = (el.strokeWidth / 2) * (hasPressure ? (pts[0].pressure ?? 0.5) * 2 : 1);
    ctx.beginPath();
    ctx.arc(pts[0].x, pts[0].y, Math.max(r, 0.5), 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (!hasPressure) {
    // ── Standard smooth path (mouse / touch) ────────────────────────────
    if (pts.length === 2) {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      ctx.lineTo(pts[1].x, pts[1].y);
      ctx.stroke();
      return;
    }

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2;
      const my = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    const last = pts[pts.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
    return;
  }

  // ── Pressure-sensitive variable-width stroke (stylus) ─────────────────
  // Draw each segment as a tapered line by varying lineWidth per segment.
  // This avoids the heavy polygon approach while still giving a natural feel.
  const baseWidth = el.strokeWidth;
  const saved = {
    lineWidth:   ctx.lineWidth,
    strokeStyle: ctx.strokeStyle,
    lineCap:     ctx.lineCap,
    lineJoin:    ctx.lineJoin,
  };

  ctx.lineCap  = 'round';
  ctx.lineJoin = 'round';

  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[i - 1];
    const p1 = pts[i];
    // Interpolate pressure between adjacent points
    const pressure = ((p0.pressure ?? 0.5) + (p1.pressure ?? 0.5)) / 2;
    // Map pressure 0→1 to width 0.3×base→1.8×base
    const w = baseWidth * (0.3 + pressure * 1.5);

    ctx.beginPath();
    ctx.lineWidth = Math.max(w, 0.5);
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
  }

  // Restore
  ctx.lineWidth   = saved.lineWidth;
  ctx.strokeStyle = saved.strokeStyle;
  ctx.lineCap     = saved.lineCap;
  ctx.lineJoin    = saved.lineJoin;
}