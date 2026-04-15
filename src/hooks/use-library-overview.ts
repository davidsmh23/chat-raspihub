import { useCallback, useEffect, useState } from "react";

import { api } from "@/lib/api";
import type { LibraryOverviewPayload } from "@/types/api";

export function useLibraryOverview() {
  const [data, setData] = useState<LibraryOverviewPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const next = await api.getOverview();
      setData(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar la biblioteca.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, isLoading, error, refresh };
}
