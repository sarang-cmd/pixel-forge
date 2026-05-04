import { Maximize2, RotateCcw, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import type { ImageFile } from '../hooks/useImageProcessor';

interface ImageViewerProps {
  image: ImageFile;
  onRotate: (degrees: number) => void;
}

export default function ImageViewer({ image, onRotate }: ImageViewerProps) {
  return (
    <div className="viewer-shell">
      <div className="viewer-toolbar">
        <button className="tool-button" type="button"><ZoomIn size={16} /> Zoom in</button>
        <button className="tool-button" type="button"><ZoomOut size={16} /> Zoom out</button>
        <button className="tool-button" type="button"><Maximize2 size={16} /> Fit</button>
        <button className="tool-button" type="button" onClick={() => onRotate(-90)}><RotateCcw size={16} /> Rotate</button>
        <button className="tool-button" type="button" onClick={() => onRotate(90)}><RotateCw size={16} /> Rotate</button>
      </div>

      <div className="viewer-canvas-wrap">
        {image.previewUrl ? (
          <img className="viewer-canvas" src={image.previewUrl} alt={image.name} />
        ) : (
          <div className="muted">No preview available</div>
        )}
      </div>

      <div className="viewer-footer">
        <div>
          <strong>{image.name}</strong>
          <div className="muted">{image.format.toUpperCase()} · {image.size}</div>
        </div>
        <div className="muted">Converted output appears here once the Rust Wasm pipeline is connected.</div>
      </div>
    </div>
  );
}
