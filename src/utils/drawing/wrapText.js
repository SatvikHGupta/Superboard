// src/utils/drawing/wrapText.js
//
// Word-wrap utility shared by drawText and drawNote.
// Splits text into lines that fit within maxWidth.
// Handles: newlines, word wrapping, character-level breaks for very long words.

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {number|null} maxWidth  — null / 0 means no wrapping (split on \n only)
 * @returns {string[]}
 */
export function wrapText(ctx, text, maxWidth) {
  if (!maxWidth || maxWidth <= 0) return text.split('\n');

  const rawLines = text.split('\n');
  const result   = [];

  for (const rawLine of rawLines) {
    if (!rawLine) {
      result.push('');
      continue;
    }

    const words = rawLine.split(' ');
    let currentLine = '';

    for (const word of words) {
      // If a single word exceeds maxWidth, break it character by character
      if (ctx.measureText(word).width > maxWidth) {
        if (currentLine) {
          result.push(currentLine);
          currentLine = '';
        }
        let chunk = '';
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

      const testLine = currentLine ? currentLine + ' ' + word : word;
      if (ctx.measureText(testLine).width > maxWidth) {
        result.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine !== '') result.push(currentLine);
  }

  return result.length > 0 ? result : [''];
}