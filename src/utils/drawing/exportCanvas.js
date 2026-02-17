import jsPDF from 'jspdf';
import { renderCanvas } from './renderCanvas.js';

/* ──────────────────────────────────────────────────
   Export as PNG — returns { url, filename } for user to click
   ────────────────────────────────────────────────── */
export function exportAsPNG(elements, boardWidth, boardHeight) {
  var scale = 2;
  var c = document.createElement('canvas');
  c.width = boardWidth * scale;
  c.height = boardHeight * scale;
  var ctx = c.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  renderCanvas(ctx, elements, boardWidth, boardHeight, false, null);

  /* Return data URL — synchronous, works everywhere */
  var dataUrl = c.toDataURL('image/png');
  return { url: dataUrl, filename: 'whiteboard.png' };
}

/* ──────────────────────────────────────────────────
   Export as PDF — returns { url, filename } for user to click
   ────────────────────────────────────────────────── */
export function exportAsPDF(elements, boardWidth, boardHeight) {
  var scale = 2;
  var c = document.createElement('canvas');
  c.width = boardWidth * scale;
  c.height = boardHeight * scale;
  var ctx = c.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  renderCanvas(ctx, elements, boardWidth, boardHeight, false, null);

  var imgData = c.toDataURL('image/jpeg', 0.92);
  var landscape = boardWidth > boardHeight;
  var pdf = new jsPDF({
    orientation: landscape ? 'landscape' : 'portrait',
    unit: 'px',
    format: [boardWidth, boardHeight],
  });
  pdf.addImage(imgData, 'JPEG', 0, 0, boardWidth, boardHeight);

  /* Return data URI — synchronous, works everywhere */
  var pdfDataUri = pdf.output('datauristring');
  return { url: pdfDataUri, filename: 'whiteboard.pdf' };
}
