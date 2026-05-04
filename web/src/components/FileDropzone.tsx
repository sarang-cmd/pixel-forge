import { UploadCloud, ImagePlus } from 'lucide-react';
import { useRef } from 'react';

interface FileDropzoneProps {
  onFiles: (files: FileList | File[]) => void;
}

export default function FileDropzone({ onFiles }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <label className="dropzone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
      event.preventDefault();
      onFiles(event.dataTransfer.files);
    }}>
      <div className="dropzone-inner">
        <ImagePlus size={48} color="var(--accent)" />
        <h1>Drop images here</h1>
        <p>Or click to open files. The app is wired for local-only processing.</p>
        <div className="chip-row">
          {['HEIC', 'HEIF', 'JPEG', 'PNG', 'WebP', 'AVIF', 'GIF', 'BMP', 'TIFF'].map((format) => (
            <span className="chip" key={format}>
              {format}
            </span>
          ))}
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          accept="image/*,.heic,.heif,.avif,.bmp,.gif,.tiff,.ico"
          onChange={(event) => {
            if (event.currentTarget.files) {
              onFiles(event.currentTarget.files);
            }
            event.currentTarget.value = '';
          }}
        />
      </div>
      <button type="button" className="ghost-button" onClick={() => inputRef.current?.click()} style={{ position: 'absolute', top: 18, right: 18 }}>
        <UploadCloud size={16} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />
        Browse files
      </button>
    </label>
  );
}
