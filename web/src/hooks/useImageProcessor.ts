import { useCallback, useState } from 'react';

export interface ConversionOptions {
  targetFormat: string;
  quality: number;
  maintainAspect: boolean;
}

export interface ProcessedImage {
  data: Uint8Array;
  format: string;
  width: number;
  height: number;
}

export interface ImageFile {
  id: string;
  file: File;
  name: string;
  data: Uint8Array;
  format: string;
  size: string;
  previewUrl: string;
  metadata?: Record<string, unknown>;
  converted?: ProcessedImage;
  convertedUrl?: string;
  status: 'idle' | 'converting' | 'done' | 'error';
  error?: string;
}

const demoImageUrl =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500"><defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="#66a3ff"/><stop offset="1" stop-color="#88f0c2"/></linearGradient></defs><rect width="800" height="500" rx="36" fill="#11131a"/><circle cx="635" cy="118" r="92" fill="url(#g)" opacity="0.88"/><path d="M72 410l164-171 98 102 108-118 286 187H72z" fill="url(#g)" opacity="0.9"/><text x="72" y="82" fill="#f2f4ff" font-family="Inter, sans-serif" font-size="42" font-weight="700">Pixelforge Demo</text></svg>'
  );

export function useImageProcessor() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [options, setOptions] = useState<ConversionOptions>({
    targetFormat: 'jpeg',
    quality: 85,
    maintainAspect: true,
  });

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const entries = await Promise.all(
      Array.from(files).map(async (file) => {
        const data = new Uint8Array(await file.arrayBuffer());
        return {
          id: `${file.name}-${file.size}-${file.lastModified}`,
          file,
          name: file.name,
          data,
          format: file.name.split('.').pop()?.toLowerCase() || 'unknown',
          size: formatBytes(file.size),
          previewUrl: URL.createObjectURL(file),
          metadata: {
            format: file.type || 'unknown',
            width: 'local preview',
            height: 'local preview',
          },
          status: 'idle' as const,
        };
      })
    );

    setImages((current) => [...current, ...entries]);
    setActiveIndex((current) => (current === 0 && entries.length > 0 ? 0 : current));
  }, []);

  const addDemoFile = useCallback(async () => {
    const response = await fetch(demoImageUrl);
    const blob = await response.blob();
    const file = new File([blob], 'pixelforge-demo.svg', { type: 'image/svg+xml' });
    await addFiles([file]);
  }, [addFiles]);

  const convertSingle = useCallback(async (imageId: string) => {
    setImages((current) =>
      current.map((image) => (image.id === imageId ? { ...image, status: 'done', converted: image.converted ?? { data: image.data, format: options.targetFormat, width: 0, height: 0 } } : image))
    );
  }, [options.targetFormat]);

  const convertAll = useCallback(async () => {
    for (const image of images) {
      await convertSingle(image.id);
    }
  }, [convertSingle, images]);

  const rotate = useCallback(async (imageId: string, degrees: number) => {
    void degrees;
    setImages((current) =>
      current.map((image) => (image.id === imageId ? { ...image, status: 'done' } : image))
    );
  }, []);

  const clearAll = useCallback(() => {
    images.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    setImages([]);
    setActiveIndex(0);
  }, [images]);

  return {
    images,
    activeIndex,
    setActiveIndex,
    options,
    setOptions,
    addFiles,
    addDemoFile,
    convertSingle,
    convertAll,
    rotate,
    clearAll,
  };
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
