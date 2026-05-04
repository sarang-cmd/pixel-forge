import { useCallback, useEffect, useRef, useState } from 'react';
import { FlipHorizontal, FlipVertical, Maximize2, RotateCcw, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import type { ImageFile } from '../hooks/useImageProcessor';

interface ImageViewerProps {
  image: ImageFile;
  onRotate: (degrees: number) => void;
  onFlipHorizontal: () => void;
  onFlipVertical: () => void;
}

export default function ImageViewer({ image, onRotate, onFlipHorizontal, onFlipVertical }: ImageViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const offsetStart = useRef({ x: 0, y: 0 });

  const displayUrl = image.convertedUrl || image.previewUrl;

  useEffect(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [image.id]);

  const handleWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const factor = event.deltaY > 0 ? 0.92 : 1.08;
    setZoom((current) => Math.min(Math.max(current * factor, 0.2), 12));
  }, []);

  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    setDragging(true);
    dragStart.current = { x: event.clientX, y: event.clientY };
    offsetStart.current = { ...offset };
  }, [offset]);

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!dragging) {
      return;
    }

    setOffset({
      x: offsetStart.current.x + (event.clientX - dragStart.current.x),
      y: offsetStart.current.y + (event.clientY - dragStart.current.y),
    });
  }, [dragging]);

  const handleMouseUp = useCallback(() => {
    setDragging(false);
  }, []);

  return (
    <div className="viewer-shell">
      <div className="viewer-toolbar">
        <button className="tool-button" type="button" onClick={() => setZoom((current) => Math.min(current * 1.12, 12))}><ZoomIn size={16} /> Zoom in</button>
        <button className="tool-button" type="button" onClick={() => setZoom((current) => Math.max(current / 1.12, 0.2))}><ZoomOut size={16} /> Zoom out</button>
        <button className="tool-button" type="button" onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }}><Maximize2 size={16} /> Fit</button>
        <button className="tool-button" type="button" onClick={() => onRotate(-90)}><RotateCcw size={16} /> Rotate left</button>
        <button className="tool-button" type="button" onClick={() => onRotate(90)}><RotateCw size={16} /> Rotate right</button>
        <button className="tool-button" type="button" onClick={onFlipHorizontal}><FlipHorizontal size={16} /> Flip H</button>
        <button className="tool-button" type="button" onClick={onFlipVertical}><FlipVertical size={16} /> Flip V</button>
      </div>

      <div
        className="viewer-canvas-wrap"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {displayUrl ? (
          <img
            className="viewer-canvas"
            src={displayUrl}
            alt={image.name}
            draggable={false}
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              cursor: dragging ? 'grabbing' : 'grab',
              userSelect: 'none',
            }}
          />
        ) : (
          <div className="muted">No preview available</div>
        )}
      </div>

      <div className="viewer-footer">
        <div>
          <strong>{image.name}</strong>
          <div className="muted">{image.format.toUpperCase()} · {image.size}</div>
        </div>
        <div className="muted">Zoom {Math.round(zoom * 100)}% · drag to pan.</div>
      </div>
    </div>
  );
}
