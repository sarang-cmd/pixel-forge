import { Settings2 } from 'lucide-react';

interface OptimizePanelProps {
  format: string;
  options: {
    quality: number;
    progressiveJpeg?: boolean;
    chromaSubsampling?: '4:4:4' | '4:2:2' | '4:2:0';
  };
  onChange: (opts: any) => void;
}

export default function OptimizePanel({ format, options, onChange }: OptimizePanelProps) {
  const isJpeg = format === 'jpeg' || format === 'jpg';
  const isPng = format === 'png';
  const isWebp = format === 'webp';

  return (
    <div className="panel">
      <p className="panel-title">
        <Settings2 size={14} style={{ vertical Align: 'middle', marginRight: 6 }} />
        Optimize
      </p>

      {isJpeg ? (
        <>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <input
              type="checkbox"
              checked={options.progressiveJpeg || false}
              onChange={(event) => onChange({ ...options, progressiveJpeg: event.currentTarget.checked })}
            />
            <span className="muted">Progressive JPEG</span>
          </label>

          <div style={{ marginBottom: 12 }}>
            <label className="muted" htmlFor="chroma">
              Chroma subsampling
            </label>
            <select
              id="chroma"
              style={{ width: '100%', marginTop: 6 }}
              value={options.chromaSubsampling || '4:2:0'}
              onChange={(event) => onChange({ ...options, chromaSubsampling: event.currentTarget.value })}
            >
              <option value="4:4:4">4:4:4 (No subsampling)</option>
              <option value="4:2:2">4:2:2 (Standard)</option>
              <option value="4:2:0">4:2:0 (Maximum compression)</option>
            </select>
            <div className="muted" style={{ fontSize: '0.75rem', marginTop: 6, lineHeight: 1.4 }}>
              Lower values = smaller file size, potential color banding
            </div>
          </div>
        </>
      ) : null}

      {isPng ? (
        <div className="muted" style={{ fontSize: '0.85rem' }}>
          PNG uses lossless compression. File size depends on image complexity and alpha channel usage.
        </div>
      ) : null}

      {isWebp ? (
        <div className="muted" style={{ fontSize: '0.85rem' }}>
          WebP provides superior compression. Quality slider controls the trade-off between file size and visual fidelity.
        </div>
      ) : null}

      <div style={{ marginTop: 14, fontSize: '0.75rem', color: 'var(--muted)' }}>
        Quality: {options.quality}
      </div>
    </div>
  );
}
