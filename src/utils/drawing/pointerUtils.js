/* ── Pointer position relative to canvas (in logical CSS pixels) ── */
/* Canvas.jsx calls: getPointerPos(e, canvas) — event first, canvas second */

export function getPointerPos(e, canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const logicalW = canvas.width / dpr;
  const logicalH = canvas.height / dpr;
  const scaleX = logicalW / rect.width;
  const scaleY = logicalH / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}
