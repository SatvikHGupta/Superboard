import { COLORS } from '../../constants/colors.js';

export default function ColorPicker({ color, setColor }) {
  const isCustom = !COLORS.includes(color);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 4px' }}>
      {COLORS.map(c => (
        <button
          key={c}
          className={
            'color-swatch' +
            (color === c ? ' active' : '') +
            (c.toUpperCase() === '#FFFFFF' ? ' color-swatch-white' : '')
          }
          style={{ background: c }}
          onClick={() => setColor(c)}
          title={c}
        />
      ))}

      {/* Hex picker */}
      <label className={'hex-picker-label' + (isCustom ? ' hex-picker-active' : '')}>
        <div className="hex-picker-gradient" />
        <input
          className="hex-picker-input"
          type="color"
          value={isCustom ? color : '#ff6600'}
          onChange={e => setColor(e.target.value)}
          title="Custom color"
        />
      </label>
    </div>
  );
}
