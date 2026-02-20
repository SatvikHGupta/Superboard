// src/utils/drawing/elements/drawImage.js

import { getCachedImage } from '../imageCache.js';

/**
 * Renders a pasted/uploaded image element.
 * Image is loaded via the LRU cache — if not yet decoded the frame is skipped
 * and the RAF loop will pick it up on the next tick once img.onload fires.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ imageData?:string, src?:string,
 *           startX:number, startY:number,
 *           width?:number, height?:number }} el
 */
export function drawImage(ctx, el) {
  const imgSrc = el.imageData || el.src;
  if (!imgSrc) return;

  const img = getCachedImage(imgSrc);
  if (img.complete && img.naturalWidth > 0) {
    ctx.drawImage(
      img,
      el.startX,
      el.startY,
      el.width  || img.naturalWidth,
      el.height || img.naturalHeight,
    );
  }
}