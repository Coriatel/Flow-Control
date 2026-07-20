import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createDefaultGridState,
  normalizeGridPreferences,
} from "@/lib/data-grid/gridState";
import {
  loadGridPreferences,
  resetGridPreferences,
  saveGridPreferences,
} from "@/lib/data-grid/preferences";

const DEFAULT_PAGE_SIZES = [10, 25, 50];
const DEFAULT_PINNED_COLUMNS = [];

export default function useDataGridPreferences({
  gridId,
  userId = "anonymous",
  columns,
  version = 1,
  initialSort = null,
  pinnedRight = DEFAULT_PINNED_COLUMNS,
  pinnedLeft = DEFAULT_PINNED_COLUMNS,
  pageSize = 25,
  pageSizes = DEFAULT_PAGE_SIZES,
  storage = typeof window !== "undefined" ? window.localStorage : null,
}) {
  const identity = useMemo(
    () => ({ gridId, userId, version }),
    [gridId, userId, version],
  );
  const options = useMemo(
    () => ({
      version,
      initialSort,
      pageSize,
      pageSizes,
      pinnedRight,
      pinnedLeft,
    }),
    [
      version,
      initialSort,
      pageSize,
      pageSizes,
      pinnedRight,
      pinnedLeft,
    ],
  );
  const defaults = useMemo(
    () => createDefaultGridState(columns, options),
    [columns, options],
  );
  const [state, setState] = useState(() => {
    const saved = loadGridPreferences(storage, identity);
    return normalizeGridPreferences(saved, columns, options);
  });

  useEffect(() => {
    setState((current) =>
      normalizeGridPreferences(
        { ...current, version },
        columns,
        options,
      ),
    );
  }, [columns, options, version]);

  useEffect(() => {
    saveGridPreferences(storage, identity, { ...state, version });
  }, [identity, state, storage, version]);

  const reset = useCallback(() => {
    resetGridPreferences(storage, identity);
    setState(defaults);
  }, [defaults, identity, storage]);

  return { state, setState, reset, preferenceIdentity: identity };
}
