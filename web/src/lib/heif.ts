export interface HeifDecodeResult {
  rgbaPixels: Uint8Array;
  width: number;
  height: number;
}

let heifModule: any = null;
let initPromise: Promise<void> | null = null;
let loadError: Error | null = null;

declare global {
  interface Window {
    createHeifModule?: (config?: Record<string, unknown>) => Promise<any>;
  }
}

export function getHeifAvailabilityError(): Error | null {
  return loadError;
}

export async function initHeif(): Promise<void> {
  if (heifModule || loadError) {
    return;
  }

  if (!initPromise) {
    initPromise = (async () => {
      try {
        if (typeof window.createHeifModule === 'function') {
          heifModule = await window.createHeifModule({});
          return;
        }

        const script = document.createElement('script');
        script.src = '/wasm/libheif/libheif.js';
        script.async = true;

        await new Promise<void>((resolve, reject) => {
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load /wasm/libheif/libheif.js'));
          document.head.appendChild(script);
        });

        if (typeof window.createHeifModule !== 'function') {
          throw new Error('createHeifModule is unavailable after loading libheif.js');
        }

        heifModule = await window.createHeifModule({});
      } catch (error) {
        loadError = error instanceof Error ? error : new Error(String(error));
      }
    })();
  }

  await initPromise;
}

export async function decodeHeif(arrayBuffer: ArrayBuffer): Promise<HeifDecodeResult> {
  await initHeif();

  if (!heifModule) {
    throw loadError ?? new Error('HEIF support is not available in this browser session.');
  }

  const inputBytes = new Uint8Array(arrayBuffer);
  const inputPtr = heifModule._malloc(inputBytes.length);
  const widthPtr = heifModule._malloc(4);
  const heightPtr = heifModule._malloc(4);

  try {
    heifModule.HEAPU8.set(inputBytes, inputPtr);

    const pixelsPtr = heifModule._heif_decode(inputPtr, inputBytes.length, widthPtr, heightPtr);
    if (pixelsPtr === 0) {
      throw new Error('libheif failed to decode the image');
    }

    const width = heifModule.getValue(widthPtr, 'i32');
    const height = heifModule.getValue(heightPtr, 'i32');
    const pixelSize = width * height * 4;
    const rgbaPixels = new Uint8Array(heifModule.HEAPU8.buffer, pixelsPtr, pixelSize).slice();

    heifModule._heif_free();

    return { rgbaPixels, width, height };
  } finally {
    heifModule._free(inputPtr);
    heifModule._free(widthPtr);
    heifModule._free(heightPtr);
  }
}

export function isHeifFile(filename: string, header: Uint8Array): boolean {
  const ext = filename.toLowerCase().split('.').pop() ?? '';
  if (['heic', 'heif', 'avif'].includes(ext)) {
    return true;
  }

  if (header.length < 12) {
    return false;
  }

  if (header[4] === 0x66 && header[5] === 0x74 && header[6] === 0x79 && header[7] === 0x70) {
    const brand = String.fromCharCode(header[8], header[9], header[10], header[11]).toLowerCase();
    return ['heic', 'heix', 'hevc', 'mif1', 'msf1', 'avif', 'avis'].some((token) => brand.includes(token));
  }

  return false;
}
