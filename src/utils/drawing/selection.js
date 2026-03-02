// blue = good

//selection highlight
export function drawSelectionHighlight(ctx, el) {
  ctx.save();
  const bounds = getElementBounds(el);
  if (!bounds) { ctx.restore(); return; }

  const pad = 8;
  const bx = bounds.x - pad;
  const by = bounds.y - pad;
  const bw = bounds.w + pad * 2;
  const bh = bounds.h + pad * 2;

  // Dashed border
  ctx.strokeStyle = "#6366f1";
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(bx, by, bw, bh);
  ctx.setLineDash([]);

  // Corner circles (top-left, top-right, bottom-left)
  const circles = [
    [bx, by],
    [bx + bw, by],
    [bx, by + bh],
  ];
  ctx.fillStyle = "#6366f1";
  for (const [cx, cy] of circles) {
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Bottom-right: filled square (resize handle)
  const rhx = bx + bw;
  const rhy = by + bh;
  ctx.fillStyle = "#6366f1";
  ctx.fillRect(rhx - 5, rhy - 5, 10, 10);

  ctx.restore();
}

// Resize Handle Detection 
export function isOnResizeHandle(x, y, bounds) {
  if (!bounds) return false;
  const pad = 8;
  const hx = bounds.x + bounds.w + pad;
  const hy = bounds.y + bounds.h + pad;
  return Math.abs(x - hx) < 12 && Math.abs(y - hy) < 12;
}

// Bounding Box Calculator

export function getElementBounds(el) {
  switch (el.type) {
    case "pen":
    case "eraser": {
      if (!el.points || el.points.length === 0) return null;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const p of el.points) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      }
      const sw = (el.strokeWidth || 2) / 2;
      return { x: minX - sw, y: minY - sw, w: maxX - minX + sw * 2, h: maxY - minY + sw * 2 };
    }
    case "line":
    case "arrow":
    case "rectangle":
    case "circle": {
      const x = Math.min(el.startX, el.endX);
      const y = Math.min(el.startY, el.endY);
      return { x, y, w: Math.abs(el.endX - el.startX), h: Math.abs(el.endY - el.startY) };
    }
    case "text": {
      if (!el.text) return null;
      const size = el.fontSize || 24;
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
      return { x: el.startX, y: el.startY, w: Math.max(w, 20), h: totalLines * lineH };
    }
    case "note":
      return { x: el.startX, y: el.startY, w: el.width || 200, h: el.height || 150 };
    case "image":
      return { x: el.startX, y: el.startY, w: el.width || 200, h: el.height || 200 };
    default:
      return null;
  }
}
