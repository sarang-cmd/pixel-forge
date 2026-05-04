declare module 'react' {
  const React: any;
  export default React;
  export const useState: any;
  export const useEffect: any;
  export const useMemo: any;
  export const useCallback: any;
  export const useRef: any;
  export const StrictMode: any;
}

declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

declare module 'react-dom/client' {
  export function createRoot(container: HTMLElement): {
    render: (node: any) => void;
  };
}

declare module 'lucide-react' {
  export const ImageIcon: any;
  export const Trash2: any;
  export const UploadCloud: any;
  export const ImagePlus: any;
  export const Maximize2: any;
  export const RotateCcw: any;
  export const RotateCw: any;
  export const ZoomIn: any;
  export const ZoomOut: any;
  export const Download: any;
  export const Sparkles: any;
  export const DownloadCloud: any;
  export const Layers3: any;
}

declare module 'file-saver' {
  export function saveAs(blob: Blob, filename?: string): void;
}

declare module 'jszip' {
  export default class JSZip {
    file(name: string, data: Uint8Array | Blob | string): JSZip;
    generateAsync(options: { type: 'blob' }): Promise<Blob>;
  }
}

declare namespace JSX {
  interface IntrinsicElements {
    [elementName: string]: any;
  }
}
