// text editor popup

import { useEffect } from 'react';

/**
 * @param {{
 *   textInput: {
 *     screenX: number, screenY: number,
 *     canvasX: number, canvasY: number,
 *     isNote: boolean,
 *     bgColor?: string,
 *     editingId?: string,
 *     originalElement?: object,
 *   } | null,
 *   fontSize: number,
 *   color: string,
 *   submittedRef: React.MutableRefObject<boolean>,
 *   taRef: React.MutableRefObject<HTMLTextAreaElement|null>,
 *   onSubmit: () => void,
 *   addTextElement: Function,
 *   addNoteElement: Function,
 *   onClose: () => void,
 * }} props
 */
export default function CanvasTextOverlay({
  textInput,
  fontSize,
  color,
  submittedRef,
  taRef,
  onSubmit,
  addTextElement,
  addNoteElement,
  onClose,
}) {
  // Focus the textarea and place cursor at end whenever it mounts
  useEffect(() => {
    if (!textInput) return;
    submittedRef.current = false;
    const id = setTimeout(() => {
      const ta = taRef?.current;
      if (ta) {
        ta.focus();
        const l = ta.value.length;
        ta.setSelectionRange(l, l);
      }
    }, 20);
    return () => clearTimeout(id);
  }, [textInput, submittedRef, taRef]);

  if (!textInput) return null;

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submittedRef.current = false;
      onSubmit();
      return;
    }

    if (e.key === 'Escape') {
      submittedRef.current = true;
      const orig = textInput.originalElement;
      if (textInput.editingId && orig) {
        // Restore the element that was deleted when editing started
        if (orig.type === 'note') {
          addNoteElement(
            orig.text, orig.startX, orig.startY,
            orig.fontSize, orig.bgColor, orig.width, orig.height,
          );
        } else {
          addTextElement(
            orig.text, orig.startX, orig.startY,
            orig.color, orig.fontSize, orig.maxWidth,
          );
        }
      }
      onClose();
    }
  }

  function handleBlur() {
    if (!submittedRef.current) onSubmit();
  }

  const isNote     = textInput.isNote;
  const origEl     = textInput.originalElement;
  const textStyle  = {
    left:            textInput.screenX,
    top:             textInput.screenY,
    fontSize:        origEl?.fontSize || fontSize,
    color:           isNote ? '#1a1a1a' : (origEl?.color || color),
    backgroundColor: isNote ? (textInput.bgColor || '#fef08a') : 'transparent',
  };

  return (
    <textarea
      id="canvas-text-area"
      ref={taRef}
      className={
        'canvas-text-input ' +
        (isNote ? 'canvas-text-input-note' : 'canvas-text-input-text')
      }
      style={textStyle}
      defaultValue={origEl?.text || ''}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  );
}