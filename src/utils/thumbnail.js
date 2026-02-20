// src/utils/thumbnail.js
//
// Canvas thumbnail generator — extracted from storage.js so useBoardPersistence
// can import it directly without pulling in the legacy localStorage helpers.

export function generateThumbnail(canvasEl) {
  if (!canvasEl) return null;
  try {
    const dpr = window.devicePixelRatio || 1;

    // Get the CSS pixel dimensions of the source canvas
    const srcCSSWidth  = canvasEl.width  / dpr;
    const srcCSSHeight = canvasEl.height / dpr;

    // Thumbnail target size
    const thumbW = 400;
    const thumbH = 225;

    // Calculate how much of the top of the canvas to grab
    const scale        = thumbW / srcCSSWidth;
    const srcCropH     = Math.min(srcCSSHeight, thumbH / scale);

    // Source coordinates in actual canvas pixels (accounting for DPR)
    const sw = canvasEl.width;
    const sh = srcCropH * dpr;

    const thumb = document.createElement('canvas');
    thumb.width  = thumbW;
    thumb.height = thumbH;
    const ctx = thumb.getContext('2d');

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, thumbW, thumbH);

    // Draw the top portion of the main canvas scaled to fill thumbnail width
    ctx.drawImage(canvasEl, 0, 0, sw, sh, 0, 0, thumbW, srcCropH * scale);

    return thumb.toDataURL('image/jpeg', 0.7);
  } catch {
    return null;
  }
}