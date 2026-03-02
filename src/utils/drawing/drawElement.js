// kya kaise kon draw hoga

import { drawFreehand }                          from './elements/drawFreehand.js';
import { drawLine, drawRectangle,
         drawEllipse, drawArrow }                from './elements/drawShapes.js';
import { drawText }                              from './elements/drawText.js';
import { drawNote }                              from './elements/drawNote.js';
import { drawImage }                             from './elements/drawImage.js';

/**
 * Renders a single element onto ctx.
 * ctx.save() / ctx.restore() wraps every call so element renderers can mutate
 * state freely without leaking into adjacent elements.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} element
 */
export function drawElement(ctx, element) {
  ctx.save();

  // Shared defaults applied before every draw call
  ctx.lineCap              = 'round';
  ctx.lineJoin             = 'round';
  ctx.strokeStyle          = element.color || '#000';
  ctx.fillStyle            = element.color || '#000';
  ctx.lineWidth            = element.strokeWidth || 2;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  switch (element.type) {
    case 'pen':
    case 'eraser':    drawFreehand(ctx, element);   break;
    case 'line':      drawLine(ctx, element);        break;
    case 'rectangle': drawRectangle(ctx, element);  break;
    case 'circle':    drawEllipse(ctx, element);     break;
    case 'arrow':     drawArrow(ctx, element);       break;
    case 'text':      drawText(ctx, element);        break;
    case 'note':      drawNote(ctx, element);        break;
    case 'image':     drawImage(ctx, element);       break;
    default:          break;
  }

  ctx.restore();
}