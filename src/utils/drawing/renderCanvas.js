import { drawElement } from "./drawElement";
import { drawSelectionHighlight } from "./selection";
import { drawBoxGrid } from "./grid";

export function renderCanvas(ctx, elements, width, height, showGrid, selectedId) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  if (showGrid) drawBoxGrid(ctx, width, height);

  for (let i = 0; i < elements.length; i++) {
    drawElement(ctx, elements[i]);
    if (selectedId && elements[i].id === selectedId) {
      drawSelectionHighlight(ctx, elements[i]);
    }
  }
}
