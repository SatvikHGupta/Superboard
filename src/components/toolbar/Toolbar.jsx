import { TOOLS, TOOL_LIST } from '../../constants/tools.js';
import { COLORS } from '../../constants/colors.js';
import { FONT_SIZES } from '../../constants/defaults.js';
import { ToolIcon } from './ToolIcon.jsx';
import ColorPicker from './ColorPicker.jsx';
import StrokeControl from './StrokeControl.jsx';

export default function Toolbar({
  tool, setTool, color, setColor, strokeWidth, setStrokeWidth,
  fontSize, setFontSize,
}) {
  const showTextSizes = tool === TOOLS.TEXT || tool === TOOLS.NOTE;

  return (
    <div className="toolbar">
      <div className="toolbar-bar glass-strong">
        {/* Tools */}
        {TOOL_LIST.map(t => (
          <button
            key={t.id}
            className={'tool-btn' + (tool === t.id ? ' active' : '')}
            onClick={() => setTool(t.id)}
            title={`${t.label} (${t.shortcut})`}
          >
            <ToolIcon toolId={t.id} />
          </button>
        ))}

        <div className="toolbar-divider" />

        {/* Colors */}
        <ColorPicker color={color} setColor={setColor} />

        <div className="toolbar-divider" />

        {/* Stroke / Text size */}
        {showTextSizes ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 4px' }}>
            {FONT_SIZES.map(s => (
              <button
                key={s}
                className={'size-preset-btn' + (fontSize === s ? ' active' : '')}
                onClick={() => setFontSize(s)}
              >
                {s}
              </button>
            ))}
          </div>
        ) : (
          <StrokeControl strokeWidth={strokeWidth} setStrokeWidth={setStrokeWidth} />
        )}
      </div>
    </div>
  );
}