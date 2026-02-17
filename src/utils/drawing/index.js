// Barrel re-export — all drawing utils accessible from "utils/drawing"
export { generateId } from "./idGenerator";
export { getCachedImage, cacheImage } from "./imageCache";
export { getPointerPos } from "./pointerUtils";
export { drawElement } from "./drawElement";
export { hitTest } from "./hitTest";
export { drawSelectionHighlight, getElementBounds, isOnResizeHandle } from "./selection";
export { drawBoxGrid } from "./grid";
export { renderCanvas } from "./renderCanvas";
export { exportAsPNG, exportAsPDF } from "./exportCanvas";
