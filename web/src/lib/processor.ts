import { decodeHeif, initHeif, isHeifFile } from './heif';

export interface ProcessedImage {
  data: Uint8Array;
  format: string;
  width: number;
  height: number;
}

export type ResizeMode = 'none' | 'dimensions' | 'percentage';

export interface ConversionOptions {
  targetFormat: string;
  quality: number;
  maintainAspect: boolean;
  resizeMode: ResizeMode;
  targetWidth: number;
  targetHeight: number;
  scalePercent: number;
}

export interface ImageMetadata {
  format: string;
  width: number;
  height: number;
  color_type: string;
  file_size: string;
  file_size_bytes: number;
  pixel_count: number;
  has_alpha: boolean;
  is_animated: boolean;
  estimated_memory_mb: number;
}

export interface ExifData {
  make?: string;
  model?: string;
  dateTime?: string;
  exposureTime?: string;
  fNumber?: string;
  iso?: string;
  focalLength?: string;
  gps?: { latitude: number; longitude: number };
}

interface ImageSource {
  bitmap: ImageBitmap;
  width: number;
  height: number;
}

let wasmModule: any = null;
let wasmInitPromise: Promise<void> | null = null;

function toArrayBuffer(data: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(data.length);
  copy.set(data);
  return copy.buffer;
}

function bytesToSize(bytes: number): string {

  function extractExifFromJpeg(data: Uint8Array): ExifData | null {
    try {
      // Look for EXIF marker (0xFFE1)
      let pos = 2; // Skip SOI marker
      while (pos < data.length - 8) {
        if (data[pos] !== 0xff) {
          pos++;
          continue;
        }

        const marker = data[pos + 1];
        const length = (data[pos + 2] << 8) | data[pos + 3];

        if (marker === 0xe1 && length > 8) {
          const exifHeader = String.fromCharCode(
            data[pos + 4],
            data[pos + 5],
            data[pos + 6],
            data[pos + 7],
            data[pos + 8],
            data[pos + 9]
          );

          if (exifHeader === 'Exif\0\0') {
            const exifStart = pos + 10;
            const exifData = data.slice(exifStart, exifStart + length - 8);
            return parseExifTags(exifData);
          }
        }

        pos += length + 2;
      }
    } catch {
      // silently fail on parsing errors
    }
    return null;
  }

  function parseExifTags(data: Uint8Array): ExifData {
    const result: ExifData = {};

    try {
      // Simple tag extraction from EXIF IFD
      // Tag 0x010F = Make
      // Tag 0x0110 = Model
      // Tag 0x0132 = DateTime
      // Tag 0x829A = ExposureTime
      // Tag 0x829D = FNumber
      // Tag 0x8827 = ISO
      // Tag 0x920A = FocalLength

      const textDecoder = new TextDecoder('utf-8');

      // Minimal parsing: scan for common ASCII tags
      for (let i = 0; i < data.length - 8; i++) {
        // Look for ASCII strings after tag markers
        if (
          i + 4 < data.length &&
          data[i] >= 32 &&
          data[i] <= 126 &&
          data[i + 1] >= 32 &&
          data[i + 1] <= 126
        ) {
          const str = textDecoder.decode(data.slice(i, Math.min(i + 32, data.length)));
          const cleaned = str.split('\0')[0].trim();

          if (cleaned.match(/^[A-Z][a-z]+/)) {
            if (!result.make && cleaned.length < 20) result.make = cleaned;
            else if (!result.model && cleaned.length < 30 && result.make)
              result.model = cleaned;
          }
        }
      }
    } catch {
      // silently fail
    }

    return result;
  }
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(2)} MB`;
}

async function loadImageBitmapFromBytes(data: Uint8Array, type: string): Promise<ImageBitmap> {
  return createImageBitmap(new Blob([toArrayBuffer(data)], { type }));
}

async function decodeSource(imageData: Uint8Array, sourceFormat: string): Promise<ImageSource> {
  if (sourceFormat === 'heic' || sourceFormat === 'heif') {
    const decoded = await decodeHeif(toArrayBuffer(imageData));
    const canvas = document.createElement('canvas');
    canvas.width = decoded.width;
    canvas.height = decoded.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D context is not available');

    const imageDataBuffer = new ImageData(new Uint8ClampedArray(decoded.rgbaPixels), decoded.width, decoded.height);
    context.putImageData(imageDataBuffer, 0, 0);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => (result ? resolve(result) : reject(new Error('Failed to render decoded HEIF image'))), 'image/png');
    });
    const bitmap = await createImageBitmap(blob);
    return { bitmap, width: decoded.width, height: decoded.height };
  }

  const bitmap = await loadImageBitmapFromBytes(imageData, `image/${sourceFormat}`);
  return { bitmap, width: bitmap.width, height: bitmap.height };
}

function computeTargetSize(width: number, height: number, options: ConversionOptions): { width: number; height: number } {
  if (options.resizeMode === 'percentage') {
    const scale = Math.max(1, options.scalePercent) / 100;
    return {
      width: Math.max(1, Math.round(width * scale)),
      height: Math.max(1, Math.round(height * scale)),
    };
  }

  if (options.resizeMode === 'dimensions') {
    if (options.maintainAspect) {
      const ratio = Math.min(options.targetWidth / width, options.targetHeight / height);
      return {
        width: Math.max(1, Math.round(width * ratio)),
        height: Math.max(1, Math.round(height * ratio)),
      };
    }

    return {
      width: Math.max(1, Math.round(options.targetWidth)),
      height: Math.max(1, Math.round(options.targetHeight)),
    };
  }

  return { width, height };
}

function encodeCanvas(canvas: HTMLCanvasElement, format: string, quality: number): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const mimeType = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error(`The browser could not encode ${format.toUpperCase()}`));
          return;
        }

        blob.arrayBuffer().then((buffer) => resolve(new Uint8Array(buffer))).catch(reject);
      },
      mimeType,
      quality > 1 ? Math.min(1, quality / 100) : quality,
    );
  });
}

async function renderImage(
  source: ImageSource,
  options: { width: number; height: number; rotation?: number; flipHorizontal?: boolean; flipVertical?: boolean },
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  const rotation = options.rotation ?? 0;
  const rotateQuarterTurns = ((rotation / 90) % 4 + 4) % 4;
  const width = rotateQuarterTurns % 2 === 0 ? options.width : options.height;
  const height = rotateQuarterTurns % 2 === 0 ? options.height : options.width;
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas 2D context is not available');
  }

  context.save();
  context.translate(width / 2, height / 2);
  if (options.flipHorizontal) {
    context.scale(-1, 1);
  }
  if (options.flipVertical) {
    context.scale(1, -1);
  }
  if (rotation !== 0) {
    context.rotate((rotation * Math.PI) / 180);
  }
  context.drawImage(source.bitmap, -options.width / 2, -options.height / 2, options.width, options.height);
  context.restore();

  return canvas;
}

export async function initWasm(): Promise<void> {
  if (wasmModule) {
    return;
  }

  if (!wasmInitPromise) {
    wasmInitPromise = (async () => {
      try {
        const script = document.createElement('script');
        script.src = '/wasm/pixelforge.js';
        script.async = true;

        await new Promise<void>((resolve, reject) => {
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Wasm bundle not found at /wasm/pixelforge.js'));
          document.head.appendChild(script);
        });

        if (typeof window.createPixelforgeModule === 'function') {
          wasmModule = await window.createPixelforgeModule({});
        }

        await initHeif();
      } catch {
        await initHeif();
      }
    })();
  }

  await wasmInitPromise;
}

export function hasWasm(): boolean {
  return wasmModule !== null;
    })();
  }

  await wasmInitPromise;
}

declare global {
  interface Window {
    createPixelforgeModule?: (config?: Record<string, unknown>) => Promise<any>;
  }
}

export async function loadImageFile(file: File): Promise<{ data: Uint8Array; format: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);

  if (isHeifFile(file.name, data)) {
    return { data, format: file.name.toLowerCase().endsWith('.avif') ? 'avif' : 'heic' };
  }

  const format = detectFormat(data, file.name);
  return { data, format };
}

export async function getImageMetadata(imageData: Uint8Array, format: string): Promise<ImageMetadata> {
  if (format === 'heic' || format === 'heif') {
    const decoded = await decodeHeif(toArrayBuffer(imageData));
    return {
      format,
      width: decoded.width,
      height: decoded.height,
      color_type: 'RGBA',
      file_size: bytesToSize(imageData.length),
      file_size_bytes: imageData.length,
      pixel_count: decoded.width * decoded.height,
      has_alpha: true,
      is_animated: false,
      estimated_memory_mb: Number(((decoded.width * decoded.height * 4) / (1024 * 1024)).toFixed(2)),
    };
  }

  const bitmap = await loadImageBitmapFromBytes(imageData, `image/${format}`);
  const hasAlpha = ['png', 'webp', 'gif', 'avif'].includes(format);
  const metadata: ImageMetadata = {
    format,
    width: bitmap.width,
    height: bitmap.height,
    color_type: hasAlpha ? 'RGBA' : 'RGB',
    file_size: bytesToSize(imageData.length),
    file_size_bytes: imageData.length,
    pixel_count: bitmap.width * bitmap.height,
    has_alpha: hasAlpha,
    is_animated: format === 'gif',
    estimated_memory_mb: Number(((bitmap.width * bitmap.height * 4) / (1024 * 1024)).toFixed(2)),
  };

  return metadata;
}

export async function convertImage(
  imageData: Uint8Array,
  sourceFormat: string,
  options: ConversionOptions,
): Promise<ProcessedImage> {
  const source = await decodeSource(imageData, sourceFormat);
  const target = computeTargetSize(source.width, source.height, options);
  const canvas = await renderImage(source, { ...target });
  const data = await encodeCanvas(canvas, options.targetFormat, options.quality);

  return {
    data,
    format: options.targetFormat,
    width: canvas.width,
    height: canvas.height,
  };
}

export async function resizeImage(
  imageData: Uint8Array,
  sourceFormat: string,
  options: ConversionOptions,
): Promise<ProcessedImage> {
  return convertImage(imageData, sourceFormat, options);
}

export async function rotateImage(
  imageData: Uint8Array,
  sourceFormat: string,
  degrees: number,
  targetFormat: string,
  quality: number,
): Promise<ProcessedImage> {
  const source = await decodeSource(imageData, sourceFormat);
  const canvas = await renderImage(source, { width: source.width, height: source.height, rotation: degrees });
  const data = await encodeCanvas(canvas, targetFormat, quality);

  return {
    data,
    format: targetFormat,
    width: canvas.width,
    height: canvas.height,
  };
}

export async function flipImage(
  imageData: Uint8Array,
  sourceFormat: string,
  horizontal: boolean,
  targetFormat: string,
  quality: number,
): Promise<ProcessedImage> {
  const source = await decodeSource(imageData, sourceFormat);
  const canvas = await renderImage(source, {
    width: source.width,
    height: source.height,
    flipHorizontal: horizontal,
  });
  const data = await encodeCanvas(canvas, targetFormat, quality);

  return {
    data,
    format: targetFormat,
    width: canvas.width,
    height: canvas.height,
  };
}

export async function generateThumbnail(imageData: Uint8Array, sourceFormat: string): Promise<Uint8Array> {
  const source = await decodeSource(imageData, sourceFormat);
  const maxDimension = 256;
  const scale = Math.min(maxDimension / source.width, maxDimension / source.height, 1);
  const canvas = await renderImage(source, {
    width: Math.max(1, Math.round(source.width * scale)),
    height: Math.max(1, Math.round(source.height * scale)),
  });
  return encodeCanvas(canvas, 'jpeg', 0.8);
}

export async function generateZipPayload(images: Array<{ name: string; converted?: ProcessedImage }>): Promise<Array<{ name: string; data: Uint8Array }>> {
  return images
    .filter((image): image is { name: string; converted: ProcessedImage } => Boolean(image.converted))
    .map((image) => ({
      name: `${image.name.replace(/\.[^.]+$/, '')}.${image.converted.format === 'jpeg' ? 'jpg' : image.converted.format}`,
      data: image.converted.data,
    }));
}

function detectFormat(data: Uint8Array, filename: string): string {
  const lower = filename.toLowerCase();
  const extension = lower.split('.').pop() ?? '';
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tif', 'tiff', 'ico', 'avif'].includes(extension)) {
    return extension === 'jpg' ? 'jpeg' : extension;
  }

  if (data.length >= 12 && data[4] === 0x66 && data[5] === 0x74 && data[6] === 0x79 && data[7] === 0x70) {
    const brand = String.fromCharCode(data[8], data[9], data[10], data[11]).toLowerCase();
    if (brand.includes('avif') || brand.includes('avis')) return 'avif';
    if (brand.includes('heic') || brand.includes('heix') || brand.includes('mif1') || brand.includes('msf1')) return 'heic';
    return 'heif';
  }

  if (data.length >= 4 && data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47) return 'png';
  if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return 'jpeg';
  if (data.length >= 4 && data[0] === 0x52 && data[1] === 0x49 && data[2] === 0x46 && data[3] === 0x46 && data[8] === 0x57 && data[9] === 0x45 && data[10] === 0x42 && data[11] === 0x50) return 'webp';
  if (data.length >= 3 && data[0] === 0x47 && data[1] === 0x49 && data[2] === 0x46) return 'gif';
  if (data.length >= 2 && data[0] === 0x42 && data[1] === 0x4d) return 'bmp';
  if (data.length >= 4 && ((data[0] === 0x49 && data[1] === 0x49 && data[2] === 0x2a && data[3] === 0x00) || (data[0] === 0x4d && data[1] === 0x4d && data[2] === 0x00 && data[3] === 0x2a))) return 'tiff';

  return 'unknown';
}
