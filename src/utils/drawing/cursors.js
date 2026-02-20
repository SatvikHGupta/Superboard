// src/utils/drawing/cursors.js
//
// Remote cursor rendering — extracted from Canvas.jsx's RAF loop.
// Draws a coloured dot with a white border and a name pill for each
// collaborator currently on the board.
//
// The inline roundRect implementation (quadraticCurveTo path) is kept
// deliberately to avoid CanvasRenderingContext2D.roundRect compatibility
// issues on older Chrome / Safari versions still in the wild.

/**
 * Draw all remote cursors onto ctx.
 * Called inside the RAF loop — ctx transform is already set by the caller.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Record<string, {x:number,y:number,color:string,userName:string}>} cursors
 */
export function drawRemoteCursors(ctx, cursors) {
  if (!cursors || typeof cursors !== 'object') return;

  for (const cursor of Object.values(cursors)) {
    if (!cursor || cursor.x == null) continue;
    drawCursorDot(ctx, cursor);
    if (cursor.userName) drawCursorLabel(ctx, cursor);
  }
}

// ── Filled dot with white border ─────────────────────────────────────────────
function drawCursorDot(ctx, { x, y, color = '#ef4444' }) {
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fillStyle   = color;
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth   = 1.5;
  ctx.stroke();
}

// ── Coloured name pill above the dot ─────────────────────────────────────────
function drawCursorLabel(ctx, { x, y, color = '#ef4444', userName }) {
  ctx.font = 'bold 11px system-ui,sans-serif';

  const tw = ctx.measureText(userName).width;
  const px = 6;          // horizontal padding inside pill
  const lx = x + 10;    // pill left edge
  const ly = y - 22;    // pill top-centre baseline

  // Pill dimensions
  const r  = 4;                      // corner radius
  const rx = lx - px;
  const ry = ly - 13;
  const rw = tw + px * 2;
  const rh = 18;

  // Rounded rect (manual — avoids ctx.roundRect compat issues)
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(rx + r,      ry);
  ctx.lineTo(rx + rw - r, ry);
  ctx.quadraticCurveTo(rx + rw, ry,      rx + rw, ry + r);
  ctx.lineTo(rx + rw,     ry + rh - r);
  ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - r, ry + rh);
  ctx.lineTo(rx + r,      ry + rh);
  ctx.quadraticCurveTo(rx,      ry + rh, rx, ry + rh - r);
  ctx.lineTo(rx,          ry + r);
  ctx.quadraticCurveTo(rx,      ry,      rx + r, ry);
  ctx.closePath();
  ctx.fill();

  // Label text
  ctx.fillStyle = '#ffffff';
  ctx.fillText(userName, lx, ly);
}