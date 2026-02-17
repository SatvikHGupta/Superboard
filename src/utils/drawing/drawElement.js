import { getCachedImage } from "./imageCache";

const FONT_FAMILY = '"Times New Roman", "Times", Georgia, serif';

export function drawElement(ctx, element) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = element.color || "#000";
  ctx.fillStyle = element.color || "#000";
  ctx.lineWidth = element.strokeWidth || 2;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  switch (element.type) {
    case "pen":
    case "eraser":
      drawFreehand(ctx, element);
      break;
    case "line":
      drawLine(ctx, element);
      break;
    case "rectangle":
      drawRectangle(ctx, element);
      break;
    case "circle":
      drawEllipse(ctx, element);
      break;
    case "arrow":
      drawArrow(ctx, element);
      break;
    case "text":
      drawText(ctx, element);
      break;
    case "note":
      drawNote(ctx, element);
      break;
    case "image":
      drawImage(ctx, element);
      break;
    default:
      break;
  }
  ctx.restore();
}

// ─── Word-wrap utility ───────────────────────────────
// Splits text into lines that fit within maxWidth.
// Handles newlines, word wrapping, and character-level breaks for long words.
function wrapText(ctx, text, maxWidth) {
  if (!maxWidth || maxWidth <= 0) return text.split("\n");
  const rawLines = text.split("\n");
  const result = [];

  for (const rawLine of rawLines) {
    if (!rawLine) {
      result.push("");
      continue;
    }
    const words = rawLine.split(" ");
    let currentLine = "";

    for (const word of words) {
      // If the word alone exceeds maxWidth, break character by character
      if (ctx.measureText(word).width > maxWidth) {
        if (currentLine) {
          result.push(currentLine);
          currentLine = "";
        }
        let chunk = "";
        for (const ch of word) {
          if (ctx.measureText(chunk + ch).width > maxWidth && chunk) {
            result.push(chunk);
            chunk = ch;
          } else {
            chunk += ch;
          }
        }
        currentLine = chunk;
        continue;
      }

      const testLine = currentLine ? currentLine + " " + word : word;
      if (ctx.measureText(testLine).width > maxWidth) {
        result.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine !== "") result.push(currentLine);
  }

  return result.length > 0 ? result : [""];
}

// ─── Smooth Freehand ─────────────────────────────────
function drawFreehand(ctx, el) {
  const pts = el.points;
  if (!pts || pts.length === 0) return;

  if (pts.length === 1) {
    ctx.beginPath();
    ctx.arc(pts[0].x, pts[0].y, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (pts.length === 2) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.lineTo(pts[1].x, pts[1].y);
    ctx.stroke();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);

  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    const my = (pts[i].y + pts[i + 1].y) / 2;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
  }

  const last = pts[pts.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();
}

// ─── Line ────────────────────────────────────────────
function drawLine(ctx, el) {
  ctx.beginPath();
  ctx.moveTo(el.startX, el.startY);
  ctx.lineTo(el.endX, el.endY);
  ctx.stroke();
}

// ─── Rectangle ───────────────────────────────────────
function drawRectangle(ctx, el) {
  const x = Math.min(el.startX, el.endX);
  const y = Math.min(el.startY, el.endY);
  const w = Math.abs(el.endX - el.startX);
  const h = Math.abs(el.endY - el.startY);
  if (w < 1 && h < 1) return;
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.stroke();
}

// ─── Ellipse ─────────────────────────────────────────
function drawEllipse(ctx, el) {
  const cx = (el.startX + el.endX) / 2;
  const cy = (el.startY + el.endY) / 2;
  const rx = Math.abs(el.endX - el.startX) / 2;
  const ry = Math.abs(el.endY - el.startY) / 2;
  if (rx < 1 && ry < 1) return;
  ctx.beginPath();
  ctx.ellipse(cx, cy, Math.max(rx, 0.5), Math.max(ry, 0.5), 0, 0, Math.PI * 2);
  ctx.stroke();
}

// ─── Arrow ───────────────────────────────────────────
function drawArrow(ctx, el) {
  const dx = el.endX - el.startX;
  const dy = el.endY - el.startY;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 2) return;
  const angle = Math.atan2(dy, dx);
  const headLen = Math.min(Math.max(14, ctx.lineWidth * 3.5), len * 0.4);

  ctx.beginPath();
  ctx.moveTo(el.startX, el.startY);
  ctx.lineTo(el.endX, el.endY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(el.endX, el.endY);
  ctx.lineTo(
    el.endX - headLen * Math.cos(angle - Math.PI / 7),
    el.endY - headLen * Math.sin(angle - Math.PI / 7)
  );
  ctx.moveTo(el.endX, el.endY);
  ctx.lineTo(
    el.endX - headLen * Math.cos(angle + Math.PI / 7),
    el.endY - headLen * Math.sin(angle + Math.PI / 7)
  );
  ctx.stroke();
}

// ─── Text (with word wrapping) ───────────────────────
function drawText(ctx, el) {
  if (!el.text) return;
  const size = el.fontSize || 20;
  ctx.font = `${size}px ${FONT_FAMILY}`;
  ctx.textBaseline = "top";
  ctx.fillStyle = el.color || "#000";
  const lineHeight = size * 1.5;
  const lines = wrapText(ctx, el.text, el.maxWidth || null);
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], el.startX, el.startY + i * lineHeight);
  }
}

// ─── Sticky Note (with clipping + wrapping) ──────────
function drawNote(ctx, el) {
  const w = el.width || 200;
  const h = el.height || 150;
  const x = el.startX;
  const y = el.startY;
  const r = 6;

  // Draw rounded rectangle background
  ctx.fillStyle = el.bgColor || "#FDE68A";
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(0,0,0,0.15)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Draw text with clipping so it doesn't overflow
  if (el.text) {
    const size = el.fontSize || 16;
    ctx.font = `${size}px ${FONT_FAMILY}`;
    ctx.textBaseline = "top";
    ctx.fillStyle = "#1f2937";
    const padding = 10;
    const maxW = w - padding * 2;
    const lineHeight = size * 1.5;

    // Clip to note bounds
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
}

// ─── Image ───────────────────────────────────────────
function drawImage(ctx, el) {
  const imgSrc = el.imageData || el.src;
  if (!imgSrc) return;
  const img = getCachedImage(imgSrc);
  if (img.complete && img.naturalWidth > 0) {
    ctx.drawImage(
      img,
      el.startX,
      el.startY,
      el.width || img.naturalWidth,
      el.height || img.naturalHeight
    );
  }
}
