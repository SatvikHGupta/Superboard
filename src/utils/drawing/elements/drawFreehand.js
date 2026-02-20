// src/utils/drawing/elements/drawFreehand.js
//
// Renders pen and eraser strokes using quadratic Bézier curves for smooth output.

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ points: {x:number,y:number}[] }} el
 */
export function drawFreehand(ctx, el) {
  const pts = el.points;
  if (!pts || pts.length === 0) return;

  // Single point — draw a filled dot
  if (pts.length === 1) {
    ctx.beginPath();
    ctx.arc(pts[0].x, pts[0].y, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  // Two points — simple straight line
  if (pts.length === 2) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.lineTo(pts[1].x, pts[1].y);
    ctx.stroke();
    return;
  }

  // Three or more — smooth quadratic Bézier through midpoints
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
}