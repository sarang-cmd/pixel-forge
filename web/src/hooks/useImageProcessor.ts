import { useCallback, useState } from 'react';
import {
  convertImage,
  flipImage,
  getImageMetadata,
  loadImageFile,
  rotateImage,
  type ConversionOptions as ProcessorConversionOptions,
  type ProcessedImage as ProcessorProcessedImage,
} from '../lib/processor';

export type ConversionOptions = ProcessorConversionOptions;
export type ProcessedImage = ProcessorProcessedImage;

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

export function useImageProcessor() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [options, setOptions] = useState<ConversionOptions>({
    targetFormat: 'jpeg',
    quality: 85,
    maintainAspect: true,
    resizeMode: 'none',
    targetWidth: 1920,
    targetHeight: 1080,
    scalePercent: 100,
  });

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const entries = await Promise.all(
      Array.from(files).map(async (file) => {
        const { data, format } = await loadImageFile(file);
        const metadata = await getImageMetadata(data, format).catch(() => undefined);

        return {
          id: `${file.name}-${file.size}-${file.lastModified}`,
          file,
          name: file.name,
          data,
          format,
          size: formatBytes(file.size),
          previewUrl: URL.createObjectURL(file),
          metadata,
          status: 'idle' as const,
        };
      })
    );

    setImages((current) => [...current, ...entries]);
    setActiveIndex((current) => (current === 0 && entries.length > 0 ? 0 : current));
  }, []);

  const addDemoFile = useCallback(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const context = canvas.getContext('2d');

    if (!context) {
      return;
    }

    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#66a3ff');
    gradient.addColorStop(1, '#88f0c2');
    context.fillStyle = '#12141b';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = gradient;
    context.fillRect(80, 100, 1120, 480);
    context.fillStyle = '#0b0c10';
    context.font = '700 64px Inter, sans-serif';
    context.fillText('Pixelforge Demo', 120, 220);
    context.font = '400 32px Inter, sans-serif';
    context.fillText('Browser-native processing preview', 120, 280);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) {
      return;
    }

    const file = new File([blob], `pixelforge-demo-${Date.now()}.png`, { type: 'image/png' });
    await addFiles([file]);
  }, [addFiles]);

  const convertSingle = useCallback(async (imageId: string) => {
    const source = images.find((image) => image.id === imageId);
    if (!source) {
      return;
    }

    setImages((current) =>
      current.map((image) => (image.id === imageId ? { ...image, status: 'converting' as const, error: undefined } : image))
    );

    try {
      const converted = await convertImage(source.data, source.format, options);
      const convertedUrl = URL.createObjectURL(new Blob([converted.data], { type: mimeFromFormat(converted.format) }));
      const metadata = await getImageMetadata(converted.data, converted.format).catch(() => source.metadata);

      setImages((current) =>
        current.map((image) => {
          if (image.id !== imageId) {
            return image;
          }

          if (image.convertedUrl) {
            URL.revokeObjectURL(image.convertedUrl);
          }

          return {
            ...image,
            converted,
            convertedUrl,
            metadata,
            status: 'done' as const,
            error: undefined,
          };
        })
      );
    } catch (error) {
      setImages((current) =>
        current.map((image) =>
          image.id === imageId
            ? {
                ...image,
                status: 'error' as const,
                error: error instanceof Error ? error.message : 'Failed to convert image',
              }
            : image
        )
      );
    }
  }, [images, options]);

  const convertAll = useCallback(async () => {
    for (const image of images) {
      await convertSingle(image.id);
    }
  }, [convertSingle, images]);

  const rotate = useCallback(async (imageId: string, degrees: number) => {
    const source = images.find((image) => image.id === imageId);
    if (!source) {
      return;
    }

    setImages((current) =>
      current.map((image) => (image.id === imageId ? { ...image, status: 'converting' as const, error: undefined } : image))
    );

    try {
      const rotated = await rotateImage(source.data, source.format, degrees, options.targetFormat, options.quality);
      const blob = new Blob([rotated.data], { type: mimeFromFormat(rotated.format) });
      const nextPreviewUrl = URL.createObjectURL(blob);
      const metadata = await getImageMetadata(rotated.data, rotated.format).catch(() => source.metadata);

      setImages((current) =>
        current.map((image) => {
          if (image.id !== imageId) {
            return image;
          }

          URL.revokeObjectURL(image.previewUrl);
          if (image.convertedUrl) {
            URL.revokeObjectURL(image.convertedUrl);
          }

          return {
            ...image,
            data: rotated.data,
            format: rotated.format,
            previewUrl: nextPreviewUrl,
            converted: rotated,
            convertedUrl: nextPreviewUrl,
            metadata,
            status: 'done' as const,
            error: undefined,
          };
        })
      );
    } catch (error) {
      setImages((current) =>
        current.map((image) =>
          image.id === imageId
            ? {
                ...image,
                status: 'error' as const,
                error: error instanceof Error ? error.message : 'Failed to rotate image',
              }
            : image
        )
      );
    }
  }, [images, options.quality, options.targetFormat]);

  const flip = useCallback(async (imageId: string, horizontal: boolean) => {
    const source = images.find((image) => image.id === imageId);
    if (!source) {
      return;
    }

    setImages((current) =>
      current.map((image) => (image.id === imageId ? { ...image, status: 'converting' as const, error: undefined } : image))
    );

    try {
      const flipped = await flipImage(source.data, source.format, horizontal, options.targetFormat, options.quality);
      const blob = new Blob([flipped.data], { type: mimeFromFormat(flipped.format) });
      const nextPreviewUrl = URL.createObjectURL(blob);
      const metadata = await getImageMetadata(flipped.data, flipped.format).catch(() => source.metadata);

      setImages((current) =>
        current.map((image) => {
          if (image.id !== imageId) {
            return image;
          }

          URL.revokeObjectURL(image.previewUrl);
          if (image.convertedUrl) {
            URL.revokeObjectURL(image.convertedUrl);
          }

          return {
            ...image,
            data: flipped.data,
            format: flipped.format,
            previewUrl: nextPreviewUrl,
            converted: flipped,
            convertedUrl: nextPreviewUrl,
            metadata,
            status: 'done' as const,
            error: undefined,
          };
        })
      );
    } catch (error) {
      setImages((current) =>
        current.map((image) =>
          image.id === imageId
            ? {
                ...image,
                status: 'error' as const,
                error: error instanceof Error ? error.message : 'Failed to flip image',
              }
            : image
        )
      );
    }
  }, [images, options.quality, options.targetFormat]);

  const downloadImage = useCallback((imageId: string) => {
    const image = images.find((entry) => entry.id === imageId);
    if (!image || !image.convertedUrl || !image.converted) {
      return;
    }

    const link = document.createElement('a');
    link.href = image.convertedUrl;
    link.download = `${image.name.replace(/\.[^.]+$/, '')}.${extensionFromFormat(image.converted.format)}`;
    link.click();
  }, [images]);

  const clearAll = useCallback(() => {
    images.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    images.forEach((image) => {
      if (image.convertedUrl) {
        URL.revokeObjectURL(image.convertedUrl);
      }
    });
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
    flip,
    downloadImage,
    clearAll,
  };
}

function mimeFromFormat(format: string): string {
  if (format === 'jpeg' || format === 'jpg') return 'image/jpeg';
  return `image/${format}`;
}

function extensionFromFormat(format: string): string {
  if (format === 'jpeg') return 'jpg';
  return format;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
