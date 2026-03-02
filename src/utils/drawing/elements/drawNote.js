// sticky note likhna tha but Gaddi wala note hogaya h toh leaving it like that

import { wrapText } from '../wrapText.js';

const FONT_FAMILY = '"Times New Roman", "Times", Georgia, serif';

/**
 * Renders a sticky-note element: rounded-rect background + clipped wrapped text.
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ startX:number, startY:number, width:number, height:number,
 *           bgColor:string, text:string, fontSize:number }} el
 */
export function drawNote(ctx, el) {
  const w = el.width  || 200;
  const h = el.height || 150;
  const x = el.startX;
  const y = el.startY;
  const r = 6; // corner radius

  //  Rounded rectangle background
  ctx.fillStyle = el.bgColor || '#FDE68A';
  ctx.beginPath();
  ctx.moveTo(x + r,     y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y,         x + w, y + r);
  ctx.lineTo(x + w,     y + h - r);
  ctx.quadraticCurveTo(x + w, y + h,     x + w - r, y + h);
  ctx.lineTo(x + r,     y + h);
  ctx.quadraticCurveTo(x,     y + h,     x, y + h - r);
  ctx.lineTo(x,         y + r);
  ctx.quadraticCurveTo(x,     y,         x + r, y);
  ctx.closePath();
  ctx.fill();

  // Subtle border
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth   = 1;
  ctx.stroke();

  // Text with clipping so it never overflows
  if (!el.text) return;

  const size       = el.fontSize || 16;
  const lineHeight = size * 1.5;
  const padding    = 10;
  const maxW       = w - padding * 2;

  ctx.font         = `${size}px ${FONT_FAMILY}`;
  ctx.textBaseline = 'top';
  ctx.fillStyle    = '#1f2937';

  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 1, y + 1, w - 2, h - 2);
  ctx.clip();

  const lines = wrapText(ctx, el.text, maxW);
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x + padding, y + padding + i * lineHeight);
  }

  ctx.restore();
}