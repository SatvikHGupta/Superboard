// ─── Hit Testing ─────────────────────────────────────
// Returns the topmost element at a given position, or null.

export function hitTest(elements, pos, threshold) {
  const t = threshold || 8;
  for (let i = elements.length - 1; i >= 0; i--) {
    if (hitTestElement(elements[i], pos, t)) return elements[i];
  }
  return null;
}

function hitTestElement(el, pos, t) {
  switch (el.type) {
    case "pen":
    case "eraser":
      return hitTestFreehand(el, pos, t);
    case "line":
    case "arrow":
      return hitTestLine(el, pos, t);
    case "rectangle":
      return hitTestRect(el, pos, t);
    case "circle":
      return hitTestEllipse(el, pos, t);
    case "text":
      return hitTestText(el, pos);
    case "note":
      return hitTestNote(el, pos);
    case "image":
      return hitTestImage(el, pos);
    default:
      return false;
  }
}

function hitTestFreehand(el, pos, t) {
  if (!el.points) return false;
  const threshold = t + (el.strokeWidth || 2);
  const thresholdSq = threshold * threshold;
  for (let i = 0; i < el.points.length; i++) {
    const dx = el.points[i].x - pos.x;
    const dy = el.points[i].y - pos.y;
    if (dx * dx + dy * dy < thresholdSq) return true;
  }
  return false;
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
}

function hitTestLine(el, pos, t) {
  return (
    distToSegment(pos.x, pos.y, el.startX, el.startY, el.endX, el.endY) <
    t + (el.strokeWidth || 2)
  );
}

function hitTestRect(el, pos, t) {
  const x = Math.min(el.startX, el.endX) - t;
  const y = Math.min(el.startY, el.endY) - t;
  const w = Math.abs(el.endX - el.startX) + t * 2;
  const h = Math.abs(el.endY - el.startY) + t * 2;
  return pos.x >= x && pos.x <= x + w && pos.y >= y && pos.y <= y + h;
}

function hitTestEllipse(el, pos, t) {
  const cx = (el.startX + el.endX) / 2;
  const cy = (el.startY + el.endY) / 2;
  const rx = Math.abs(el.endX - el.startX) / 2 + t;
  const ry = Math.abs(el.endY - el.startY) / 2 + t;
  if (rx === 0 || ry === 0) return false;
  const dx = pos.x - cx;
  const dy = pos.y - cy;
  return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1;
}

function hitTestText(el, pos) {
  if (!el.text) return false;
  const size = el.fontSize || 20;
  const lineH = size * 1.5;
  const rawLines = el.text.split("\n");
  let w, totalLines;

  if (el.maxWidth) {
    w = el.maxWidth;
    const approxCharW = size * 0.48;
    const charsPerLine = Math.max(1, Math.floor(el.maxWidth / approxCharW));
    totalLines = 0;
    for (const line of rawLines) {
      totalLines += line.length === 0 ? 1 : Math.max(1, Math.ceil(line.length / charsPerLine));
    }
  } else {
    totalLines = rawLines.length;
    w = Math.max(...rawLines.map((l) => l.length)) * size * 0.55 + 20;
  }

  const h = totalLines * lineH;
  return (
    pos.x >= el.startX - 6 &&
    pos.x <= el.startX + w + 6 &&
    pos.y >= el.startY - 6 &&
    pos.y <= el.startY + h + 6
  );
}

function hitTestNote(el, pos) {
  const w = el.width || 200;
  const h = el.height || 150;
  return (
    pos.x >= el.startX &&
    pos.x <= el.startX + w &&
    pos.y >= el.startY &&
    pos.y <= el.startY + h
  );
}

function hitTestImage(el, pos) {
  const w = el.width || 200;
  const h = el.height || 200;
  return (
    pos.x >= el.startX &&
    pos.x <= el.startX + w &&
    pos.y >= el.startY &&
    pos.y <= el.startY + h
  );
}
