// texting but no reply - uski tarah

import { wrapText } from '../wrapText.js';

const FONT_FAMILY = '"Times New Roman", "Times", Georgia, serif';

/**
 * Renders a plain text element with optional word-wrapping.
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ text:string, startX:number, startY:number, fontSize:number,
 *           color:string, maxWidth?:number }} el
 */
export function drawText(ctx, el) {
  if (!el.text) return;

  const size       = el.fontSize || 20;
  const lineHeight = size * 1.5;

  ctx.font         = `${size}px ${FONT_FAMILY}`;
  ctx.textBaseline = 'top';
  ctx.fillStyle    = el.color || '#000';

  const lines = wrapText(ctx, el.text, el.maxWidth || null);
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], el.startX, el.startY + i * lineHeight);
  }
}