import { useEffect, useState } from 'react';
import { initWasm } from '../lib/processor';

export function useWasm() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await initWasm();
        if (!cancelled) {
          setReady(true);
        }
      } catch (initError) {
        if (!cancelled) {
          setError(initError instanceof Error ? initError.message : 'Failed to initialize Pixelforge runtime');
          setReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { ready, error, setError };
}
