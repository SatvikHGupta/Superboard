// Smile - famous hone waale ho

export function generateThumbnail(canvasEl) {
  if (!canvasEl) return null;
  try {
    const dpr = window.devicePixelRatio || 1;

    // Get CSS px of source
    const srcCSSWidth  = canvasEl.width  / dpr;
    const srcCSSHeight = canvasEl.height / dpr;

    // Thumbnail target size
    const thumbW = 400;
    const thumbH = 225;

    // Padko top ko
    const scale        = thumbW / srcCSSWidth;
    const srcCropH     = Math.min(srcCSSHeight, thumbH / scale);

    // Source coordinates 
    const sw = canvasEl.width;
    const sh = srcCropH * dpr;

    const thumb = document.createElement('canvas');
    thumb.width  = thumbW;
    thumb.height = thumbH;
    const ctx = thumb.getContext('2d');

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, thumbW, thumbH);

    // Draw top
    ctx.drawImage(canvasEl, 0, 0, sw, sh, 0, 0, thumbW, srcCropH * scale);

    return thumb.toDataURL('image/jpeg', 0.7);
  } catch {
    return null;
  }
}