// src/hooks/useDrawingActions.js
// v1.4: markLocal.add(id) called when each element is finalized so persistence
// hook knows to write it. No other logic changes.

import { useState, useCallback } from 'react';
import { TOOLS }                 from '../constants/tools.js';
import { generateId, getCachedImage } from '../utils/drawing/index.js';

const MIN_POINT_DIST_SQ = 9;

export function useDrawingActions(
  setElements, elementsRef, pushToHistory,
  tool, color, strokeWidth, fontSize, setSelectedId,
  markLocal,
) {
  const [isDrawing,      setIsDrawing]      = useState(false);
  const [currentElement, setCurrentElement] = useState(null);

  const startDrawing = useCallback((x, y) => {
    if (tool === TOOLS.TEXT || tool === TOOLS.SELECT ||
        tool === TOOLS.ERASER || tool === TOOLS.NOTE) return;

    setSelectedId(null);

    const newEl = { id: generateId(), type: tool, color, strokeWidth, fontSize };
    if (tool === TOOLS.PEN) {
      newEl.points = [{ x, y }];
    } else {
      newEl.startX = x; newEl.startY = y;
      newEl.endX   = x; newEl.endY   = y;
    }

    pushToHistory(elementsRef.current);
    setCurrentElement(newEl);
    setIsDrawing(true);
  }, [tool, color, strokeWidth, fontSize, pushToHistory, elementsRef, setSelectedId]);

  const continueDrawing = useCallback((x, y) => {
    if (!isDrawing) return;
    setCurrentElement(prev => {
      if (!prev) return prev;
      if (prev.type === 'pen') {
        const last = prev.points[prev.points.length - 1];
        const dx = x - last.x, dy = y - last.y;
        if (dx * dx + dy * dy < MIN_POINT_DIST_SQ) return prev;
        return { ...prev, points: [...prev.points, { x, y }] };
      }
      return { ...prev, endX: x, endY: y };
    });
  }, [isDrawing]);

  // stopDrawing: element is finalized → register as local → add to state
  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    setCurrentElement(prev => {
      if (prev) {
        markLocal?.add(prev.id);
        setElements(els => [...els, prev]);
      }
      return null;
    });
  }, [setElements, markLocal]);

  const addTextElement = useCallback((text, x, y, clr, size, maxWidth) => {
    if (!text?.trim()) return;
    pushToHistory(elementsRef.current);
    const id = generateId();
    markLocal?.add(id);
    setElements(prev => [...prev, {
      id, type: 'text',
      color: clr || color, strokeWidth: 1, fontSize: size || fontSize,
      startX: x, startY: y, text, maxWidth: maxWidth || undefined,
    }]);
  }, [color, fontSize, pushToHistory, elementsRef, setElements, markLocal]);

  const addNoteElement = useCallback((text, x, y, size, bgColor, width, height) => {
    pushToHistory(elementsRef.current);
    const id = generateId();
    markLocal?.add(id);
    setElements(prev => [...prev, {
      id, type: 'note',
      color: '#1f2937', strokeWidth: 1, fontSize: size || fontSize,
      startX: x, startY: y,
      width: width || 200, height: height || 150,
      text: text || '', bgColor: bgColor || '#fef08a',
    }]);
  }, [fontSize, pushToHistory, elementsRef, setElements, markLocal]);

  const addImageElement = useCallback((dataUrl, x, y, w, h) => {
    const id = generateId();
    getCachedImage(dataUrl);
    pushToHistory(elementsRef.current);
    markLocal?.add(id);
    setElements(prev => [...prev, {
      id, type: 'image', imageData: dataUrl,
      startX: x, startY: y, width: w, height: h,
      color: '#000', strokeWidth: 0,
    }]);
  }, [pushToHistory, elementsRef, setElements, markLocal]);

  const addPastedText = useCallback((text) => {
    if (!text?.trim()) return;
    addTextElement(text.trim(), 100, 100, color, fontSize, null);
  }, [addTextElement, color, fontSize]);

  return {
    isDrawing, currentElement,
    startDrawing, continueDrawing, stopDrawing,
    addTextElement, addNoteElement, addImageElement, addPastedText,
  };
}