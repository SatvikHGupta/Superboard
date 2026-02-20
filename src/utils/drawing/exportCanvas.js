// src/utils/drawing/exportCanvas.js
//
// B4: both functions are now async — they await image preloading before render
// B4: boardName parameter → filename = sanitised board name
// B10: preloadImages() ensures all pasted images are decoded before export

import jsPDF from 'jspdf';
import { renderCanvas } from './renderCanvas.js';
import { getCachedImage } from './imageCache.js';

// ── Sanitise board name for use as a filename ──────────────────────────
function safeFilename(boardName) {
  return (boardName || 'whiteboard')
    .trim()
    .replace(/[^a-z0-9_\-\s]/gi, '')  // keep alphanumeric, dash, underscore, space
    .replace(/\s+/g, '_')              // spaces → underscores
    .replace(/_{2,}/g, '_')            // collapse multiple underscores
    .slice(0, 80)                       // cap length
    || 'whiteboard';
}

// ── Wait for all image elements to decode before rendering ────────────
function preloadImages(elements) {
  const imageEls = elements.filter(el => el.type === 'image' && el.imageData);
  if (imageEls.length === 0) return Promise.resolve();

  const promises = imageEls.map(el => new Promise(resolve => {
    const img = getCachedImage(el.imageData);
    if (img.complete && img.naturalWidth > 0) {
      resolve();
    } else {
      img.onload  = resolve;
      img.onerror = resolve; // resolve on error — don't block export
    }
  }));

  return Promise.all(promises);
}

// ── Export as PNG ──────────────────────────────────────────────────────
export async function exportAsPNG(elements, boardWidth, boardHeight, boardName) {
  // Wait for all images to be fully decoded
  await preloadImages(elements);

  const scale = 2;
  const c = document.createElement('canvas');
  c.width  = boardWidth  * scale;
  c.height = boardHeight * scale;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  renderCanvas(ctx, elements, boardWidth, boardHeight, false, null);

  const filename = safeFilename(boardName) + '.png';
  return { url: c.toDataURL('image/png'), filename };
}

// ── Export as PDF ──────────────────────────────────────────────────────
export async function exportAsPDF(elements, boardWidth, boardHeight, boardName) {
  await preloadImages(elements);

  const scale = 2;
  const c = document.createElement('canvas');
  c.width  = boardWidth  * scale;
  c.height = boardHeight * scale;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  renderCanvas(ctx, elements, boardWidth, boardHeight, false, null);

  const imgData   = c.toDataURL('image/jpeg', 0.92);
  const landscape = boardWidth > boardHeight;
  const pdf = new jsPDF({
    orientation: landscape ? 'landscape' : 'portrait',
    unit: 'px',
    format: [boardWidth, boardHeight],
  });
  pdf.addImage(imgData, 'JPEG', 0, 0, boardWidth, boardHeight);

  const filename = safeFilename(boardName) + '.pdf';
  return { url: pdf.output('datauristring'), filename };
}