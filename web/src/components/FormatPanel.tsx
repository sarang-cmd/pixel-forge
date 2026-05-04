import type { ConversionOptions, ImageFile } from '../hooks/useImageProcessor';
import { Download, Sparkles } from 'lucide-react';

interface FormatPanelProps {
  options: ConversionOptions;
  onChange: (next: ConversionOptions) => void;
  onConvert: () => void;
  onDownload?: () => void;
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

export default function FormatPanel({ options, onChange, onConvert, onDownload, image }: FormatPanelProps) {
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

      <div style={{ marginTop: 16 }}>
        <label className="muted" htmlFor="resize-mode">Resize mode</label>
        <select
          id="resize-mode"
          style={{ width: '100%', marginTop: 8 }}
          value={options.resizeMode}
          onChange={(event) =>
            onChange({
              ...options,
              resizeMode: event.currentTarget.value as ConversionOptions['resizeMode'],
            })
          }
        >
          <option value="none">No resize</option>
          <option value="dimensions">Dimensions</option>
          <option value="percentage">Scale percentage</option>
        </select>
      </div>

      {options.resizeMode === 'dimensions' ? (
        <div className="segment-grid" style={{ marginTop: 12 }}>
          <label>
            <span className="muted">Width</span>
            <input
              type="number"
              min={1}
              value={options.targetWidth}
              onChange={(event) => onChange({ ...options, targetWidth: Number(event.currentTarget.value) || 1 })}
              style={{ width: '100%', marginTop: 6 }}
            />
          </label>
          <label>
            <span className="muted">Height</span>
            <input
              type="number"
              min={1}
              value={options.targetHeight}
              onChange={(event) => onChange({ ...options, targetHeight: Number(event.currentTarget.value) || 1 })}
              style={{ width: '100%', marginTop: 6 }}
            />
          </label>
        </div>
      ) : null}

      {options.resizeMode === 'percentage' ? (
        <div style={{ marginTop: 12 }}>
          <label className="muted" htmlFor="scale-percent">Scale: {options.scalePercent}%</label>
          <input
            id="scale-percent"
            style={{ width: '100%', marginTop: 8 }}
            type="range"
            min={10}
            max={400}
            value={options.scalePercent}
            onChange={(event) => onChange({ ...options, scalePercent: Number(event.currentTarget.value) })}
          />
        </div>
      ) : null}

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

      <button className="download-button" type="button" disabled={!image?.convertedUrl} onClick={onDownload} style={{ width: '100%', marginTop: 10 }}>
        <Download size={16} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />
        Download output
      </button>
    </div>
  );
}
