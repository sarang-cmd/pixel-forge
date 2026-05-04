import type { ConversionOptions, ImageFile } from '../hooks/useImageProcessor';
import { Download, Sparkles } from 'lucide-react';

interface FormatPanelProps {
  options: ConversionOptions;
  onChange: (next: ConversionOptions) => void;
  onConvert: () => void;
  image?: ImageFile;
}

const formats = [
  ['jpeg', 'JPEG'],
  ['png', 'PNG'],
  ['webp', 'WebP'],
  ['avif', 'AVIF'],
  ['bmp', 'BMP'],
  ['tiff', 'TIFF'],
] as const;

export default function FormatPanel({ options, onChange, onConvert, image }: FormatPanelProps) {
  return (
    <div className="panel">
      <p className="panel-title">Convert</p>
      <div className="segment-grid">
        {formats.map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`segment-button ${options.targetFormat === value ? 'active' : ''}`}
            onClick={() => onChange({ ...options, targetFormat: value })}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <label className="muted" htmlFor="quality">Quality: {options.quality}</label>
        <input
          id="quality"
          style={{ width: '100%', marginTop: 8 }}
          type="range"
          min={1}
          max={100}
          value={options.quality}
          onChange={(event) => onChange({ ...options, quality: Number(event.currentTarget.value) })}
        />
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
        <input
          type="checkbox"
          checked={options.maintainAspect}
          onChange={(event) => onChange({ ...options, maintainAspect: event.currentTarget.checked })}
        />
        Maintain aspect ratio
      </label>

      <button className="convert-button" type="button" onClick={onConvert} disabled={!image} style={{ width: '100%', marginTop: 16 }}>
        <Sparkles size={16} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />
        Convert active file
      </button>

      <button className="download-button" type="button" disabled={!image?.convertedUrl} style={{ width: '100%', marginTop: 10 }}>
        <Download size={16} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />
        Download output
      </button>
    </div>
  );
}
