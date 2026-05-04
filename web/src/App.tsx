import { useMemo } from 'react';
import Header from './components/Header';
import FileDropzone from './components/FileDropzone';
import ImageViewer from './components/ImageViewer';
import FormatPanel from './components/FormatPanel';
import MetadataPanel from './components/MetadataPanel';
import BatchPanel from './components/BatchPanel';
import { useImageProcessor } from './hooks/useImageProcessor';
import { useWasm } from './hooks/useWasm';

export default function App() {
  const wasm = useWasm();
  const processor = useImageProcessor();

  const activeImage = useMemo(
    () => processor.images[processor.activeIndex],
    [processor.activeIndex, processor.images]
  );

  if (wasm.error) {
    return (
      <div className="shell shell-center">
        <div className="hero-card error-card">
          <h1>Pixelforge could not start</h1>
          <p>{wasm.error}</p>
          <p className="muted">
            The UI is scaffolded, but the Wasm bundle still needs to be built.
          </p>
        </div>
      </div>
    );
  }

  if (!wasm.ready) {
    return (
      <div className="shell shell-center">
        <div className="hero-card loading-card">
          <div className="spinner" />
          <h1>Loading Pixelforge</h1>
          <p>Preparing the browser image studio.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="shell">
      <Header imageCount={processor.images.length} onClear={processor.clearAll} />

      <main className="content-grid">
        {processor.images.length === 0 ? (
          <FileDropzone onFiles={processor.addFiles} />
        ) : (
          <>
            <aside className="sidebar">
              <div className="sidebar-head">
                <div>
                  <p className="eyebrow">Library</p>
                  <h2>{processor.images.length} files loaded</h2>
                </div>
                <button className="ghost-button" onClick={processor.addDemoFile}>
                  Add demo
                </button>
              </div>

              <div className="file-list">
                {processor.images.map((image, index) => (
                  <button
                    key={image.id}
                    className={`file-item ${index === processor.activeIndex ? 'active' : ''}`}
                    onClick={() => processor.setActiveIndex(index)}
                  >
                    <div className="file-thumb">
                      {image.previewUrl ? <img src={image.previewUrl} alt={image.name} /> : <span>IMG</span>}
                    </div>
                    <div className="file-meta">
                      <strong>{image.name}</strong>
                      <span>{image.format.toUpperCase()} · {image.size}</span>
                    </div>
                  </button>
                ))}
              </div>

              {processor.images.length > 1 ? (
                <BatchPanel images={processor.images} onConvertAll={processor.convertAll} />
              ) : null}
            </aside>

            <section className="viewer-panel">
              {activeImage ? (
                <ImageViewer
                  image={activeImage}
                  onRotate={(degrees) => processor.rotate(activeImage.id, degrees)}
                  onFlipHorizontal={() => processor.flip(activeImage.id, true)}
                  onFlipVertical={() => processor.flip(activeImage.id, false)}
                />
              ) : null}
            </section>

            <aside className="control-panel">
              <FormatPanel
                options={processor.options}
                onChange={processor.setOptions}
                onConvert={() => activeImage && processor.convertSingle(activeImage.id)}
                onDownload={() => activeImage && processor.downloadImage(activeImage.id)}
                image={activeImage}
              />
              {activeImage?.metadata ? <MetadataPanel metadata={activeImage.metadata} /> : null}
            </aside>
          </>
        )}
      </main>
    </div>
  );
}
