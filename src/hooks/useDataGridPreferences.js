import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createDefaultGridState,
  normalizeGridPreferences,
} from "@/lib/data-grid/gridState";
import {
  loadGridPreferences,
  createGridPreferenceKey,
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
  const identityKey = createGridPreferenceKey(identity);
  const savedIdentityKey = useRef(identityKey);

  useEffect(() => {
    const saved = loadGridPreferences(storage, identity);
    setState(normalizeGridPreferences(saved, columns, options));
  }, [identity, identityKey, columns, options, storage]);

  useEffect(() => {
    if (savedIdentityKey.current !== identityKey) {
      savedIdentityKey.current = identityKey;
      return;
    }
    saveGridPreferences(storage, identity, { ...state, version });
  }, [identity, identityKey, state, storage, version]);

  const reset = useCallback(() => {
    resetGridPreferences(storage, identity);
    setState(defaults);
  }, [defaults, identity, storage]);

  return { state, setState, reset, preferenceIdentity: identity };
}
