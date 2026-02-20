// src/components/toolbar/Toolbar.jsx
//
// B3: accept canDraw prop — when false (viewer/stranger), entire toolbar
//     is visually dimmed and all inputs are disabled.

import { TOOLS, TOOL_LIST } from '../../constants/tools.js';
import { COLORS }           from '../../constants/colors.js';
import { FONT_SIZES }       from '../../constants/defaults.js';
import { ToolIcon }         from './ToolIcon.jsx';
import ColorPicker          from './ColorPicker.jsx';
import StrokeControl        from './StrokeControl.jsx';

export default function Toolbar({
  tool, setTool, color, setColor, strokeWidth, setStrokeWidth,
  fontSize, setFontSize,
  canDraw, // boolean — when false, toolbar is read-only / dimmed
}) {
  const showTextSizes = tool === TOOLS.TEXT || tool === TOOLS.NOTE;
  const disabled = canDraw === false;

  return (
    <div className="toolbar" style={disabled ? { opacity: 0.45, pointerEvents: 'none' } : {}}>
      <div className="toolbar-bar glass-strong">

        {TOOL_LIST.map(t => (
          <button
            key={t.id}
            className={'tool-btn' + (tool === t.id ? ' active' : '')}
            onClick={() => !disabled && setTool(t.id)}
            disabled={disabled}
            title={disabled ? 'View only' : `${t.label} (${t.shortcut})`}
          >
            <ToolIcon toolId={t.id} />
          </button>
        ))}

        <div className="toolbar-divider" />

        <ColorPicker color={color} setColor={disabled ? () => {} : setColor} />

        <div className="toolbar-divider" />

        {showTextSizes ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 4px' }}>
            {FONT_SIZES.map(s => (
              <button
                key={s}
                className={'size-preset-btn' + (fontSize === s ? ' active' : '')}
                onClick={() => !disabled && setFontSize(s)}
                disabled={disabled}
              >
                {s}
              </button>
            ))}
          </div>
        ) : (
          <StrokeControl strokeWidth={strokeWidth} setStrokeWidth={disabled ? () => {} : setStrokeWidth} />
        )}
      </div>
    </div>
  );
}