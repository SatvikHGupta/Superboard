// src/utils/drawing/elements/drawShapes.js
//
// Primitive shape renderers: line, rectangle, ellipse (circle), arrow.
// Each function receives a fully configured ctx (strokeStyle, lineWidth already set).

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ startX:number, startY:number, endX:number, endY:number }} el
 */
export function drawLine(ctx, el) {
  ctx.beginPath();
  ctx.moveTo(el.startX, el.startY);
  ctx.lineTo(el.endX,   el.endY);
  ctx.stroke();
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ startX:number, startY:number, endX:number, endY:number }} el
 */
export function drawRectangle(ctx, el) {
  const x = Math.min(el.startX, el.endX);
  const y = Math.min(el.startY, el.endY);
  const w = Math.abs(el.endX - el.startX);
  const h = Math.abs(el.endY - el.startY);
  if (w < 1 && h < 1) return;
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.stroke();
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ startX:number, startY:number, endX:number, endY:number }} el
 */
export function drawEllipse(ctx, el) {
  const cx = (el.startX + el.endX) / 2;
  const cy = (el.startY + el.endY) / 2;
  const rx = Math.abs(el.endX - el.startX) / 2;
  const ry = Math.abs(el.endY - el.startY) / 2;
  if (rx < 1 && ry < 1) return;
  ctx.beginPath();
  ctx.ellipse(cx, cy, Math.max(rx, 0.5), Math.max(ry, 0.5), 0, 0, Math.PI * 2);
  ctx.stroke();
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ startX:number, startY:number, endX:number, endY:number, strokeWidth:number }} el
 */
export function drawArrow(ctx, el) {
  const dx  = el.endX - el.startX;
  const dy  = el.endY - el.startY;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 2) return;

  const angle   = Math.atan2(dy, dx);
  const headLen = Math.min(Math.max(14, ctx.lineWidth * 3.5), len * 0.4);

  // Shaft
  ctx.beginPath();
  ctx.moveTo(el.startX, el.startY);
  ctx.lineTo(el.endX,   el.endY);
  ctx.stroke();

  // Arrowhead (two lines)
  ctx.beginPath();
  ctx.moveTo(el.endX, el.endY);
  ctx.lineTo(
    el.endX - headLen * Math.cos(angle - Math.PI / 7),
    el.endY - headLen * Math.sin(angle - Math.PI / 7),
  );
  ctx.moveTo(el.endX, el.endY);
  ctx.lineTo(
    el.endX - headLen * Math.cos(angle + Math.PI / 7),
    el.endY - headLen * Math.sin(angle + Math.PI / 7),
  );
  ctx.stroke();
}