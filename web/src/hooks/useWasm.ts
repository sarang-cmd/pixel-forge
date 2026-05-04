import { useEffect, useState } from 'react';

export function useWasm() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 150);
    return () => window.clearTimeout(timer);
  }, []);

  return { ready, error, setError };
}
