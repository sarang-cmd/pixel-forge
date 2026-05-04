import JSZip from 'jszip';
import { DownloadCloud, Layers3 } from 'lucide-react';
import type { ImageFile } from '../hooks/useImageProcessor';

interface BatchPanelProps {
  images: ImageFile[];
  onConvertAll: () => Promise<void>;
}

export default function BatchPanel({ images, onConvertAll }: BatchPanelProps) {
  const converted = images.filter((image) => image.status === 'done').length;

  return (
    <div className="panel">
      <p className="panel-title">Batch</p>
      <div className="muted" style={{ marginBottom: 10 }}>
        <Layers3 size={16} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />
        {converted}/{images.length} converted
      </div>

      <button className="convert-button" type="button" onClick={onConvertAll} style={{ width: '100%' }}>
        Convert all
      </button>

      <button
        className="download-button"
        type="button"
        style={{ width: '100%', marginTop: 10 }}
        onClick={async () => {
          const zip = new JSZip();
          for (const image of images) {
            if (image.converted) {
              zip.file(`${image.name.replace(/\.[^.]+$/, '')}.${image.converted.format}`, image.converted.data);
            }
          }
          await zip.generateAsync({ type: 'blob' });
        }}
      >
        <DownloadCloud size={16} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />
        Download ZIP
      </button>
    </div>
  );
}
