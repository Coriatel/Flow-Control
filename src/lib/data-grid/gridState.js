const DEFAULT_MIN_WIDTH = 72;
const DEFAULT_MAX_WIDTH = 640;
const DEFAULT_PAGE_SIZE = 25;

function columnValue(row, column) {
  if (typeof column.accessorFn === "function") return column.accessorFn(row);
  return column.accessorKey ? row?.[column.accessorKey] : row?.[column.id];
}

function normalizeText(value) {
  if (value == null) return "";
  if (Array.isArray(value)) return value.map(normalizeText).join(" ");
  if (typeof value === "object") return Object.values(value).map(normalizeText).join(" ");
  return String(value).toLocaleLowerCase("he");
}

export function cycleSort(currentSort, columnId) {
  if (!currentSort || currentSort.id !== columnId) {
    return { id: columnId, direction: "asc" };
  }
  if (currentSort.direction === "asc") {
    return { id: columnId, direction: "desc" };
  }
  return null;
}

export function moveColumn(order, activeId, overId) {
  if (activeId === overId) return [...order];
  const from = order.indexOf(activeId);
  const to = order.indexOf(overId);
  if (from < 0 || to < 0) return [...order];
  const next = [...order];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function resizeColumn(currentWidth, logicalDelta, options = {}) {
  const min = options.min ?? DEFAULT_MIN_WIDTH;
  const max = options.max ?? DEFAULT_MAX_WIDTH;
  return Math.min(max, Math.max(min, Number(currentWidth || min) + logicalDelta));
}

export function createDefaultGridState(columns, options = {}) {
  return {
    globalSearch: "",
    columnFilters: {},
    sort: options.initialSort ?? null,
    columnOrder: columns.map((column) => column.id),
    columnVisibility: Object.fromEntries(
      columns.map((column) => [column.id, column.defaultVisible !== false]),
    ),
    columnWidths: Object.fromEntries(
      columns.map((column) => [column.id, column.defaultWidth || 140]),
    ),
    pinnedColumns: {
      right: [...(options.pinnedRight || [])],
      left: [...(options.pinnedLeft || [])],
    },
    pageIndex: 0,
    pageSize: options.pageSize || DEFAULT_PAGE_SIZE,
  };
}

export function normalizeGridPreferences(
  preferences,
  columns,
  options = {},
) {
  const defaults = createDefaultGridState(columns, options);
  if (!preferences || preferences.version !== options.version) return defaults;

  const validIds = new Set(columns.map((column) => column.id));
  const requestedOrder = Array.isArray(preferences.columnOrder)
    ? preferences.columnOrder.filter((id) => validIds.has(id))
    : [];
  const columnOrder = [
    ...new Set([...requestedOrder, ...defaults.columnOrder]),
  ];

  const columnVisibility = { ...defaults.columnVisibility };
  for (const column of columns) {
    if (
      column.alwaysVisible !== true &&
      typeof preferences.columnVisibility?.[column.id] === "boolean"
    ) {
      columnVisibility[column.id] = preferences.columnVisibility[column.id];
    }
  }

  const columnWidths = { ...defaults.columnWidths };
  for (const column of columns) {
    const storedWidth = Number(preferences.columnWidths?.[column.id]);
    if (Number.isFinite(storedWidth)) {
      columnWidths[column.id] = resizeColumn(
        0,
        storedWidth,
        {
          min: column.minWidth ?? DEFAULT_MIN_WIDTH,
          max: column.maxWidth ?? DEFAULT_MAX_WIDTH,
        },
      );
    }
  }

  const normalizePins = (value) =>
    Array.isArray(value)
      ? [...new Set(value.filter((id) => validIds.has(id)))]
      : [];
  const pageSizes = options.pageSizes || [10, 25, 50];

  return {
    ...defaults,
    globalSearch:
      typeof preferences.globalSearch === "string"
        ? preferences.globalSearch
        : "",
    columnFilters:
      preferences.columnFilters && typeof preferences.columnFilters === "object"
        ? Object.fromEntries(
            Object.entries(preferences.columnFilters).filter(([id]) =>
              validIds.has(id),
            ),
          )
        : {},
    sort:
      preferences.sort && validIds.has(preferences.sort.id)
        ? preferences.sort
        : defaults.sort,
    columnOrder,
    columnVisibility,
    columnWidths,
    pinnedColumns: {
      right: normalizePins(preferences.pinnedColumns?.right),
      left: normalizePins(preferences.pinnedColumns?.left),
    },
    pageSize: pageSizes.includes(preferences.pageSize)
      ? preferences.pageSize
      : defaults.pageSize,
  };
}

export function applyGridPipeline(rows, columns, state) {
  const searchableColumns = columns.filter(
    (column) =>
      column.searchable === true ||
      (column.searchable !== false && (column.accessorKey || column.accessorFn)),
  );
  const search = normalizeText(state.globalSearch).trim();

  let filteredRows = [...(rows || [])].filter((row) => {
    if (
      search &&
      !searchableColumns.some((column) =>
        normalizeText(columnValue(row, column)).includes(search),
      )
    ) {
      return false;
    }
    return Object.entries(state.columnFilters || {}).every(
      ([columnId, filterValue]) => {
        if (filterValue == null || filterValue === "") return true;
        const column = columns.find((candidate) => candidate.id === columnId);
        if (!column) return true;
        const value = columnValue(row, column);
        if (typeof column.filterFn === "function") {
          return column.filterFn(value, filterValue, row);
        }
        return normalizeText(value).includes(normalizeText(filterValue));
      },
    );
  });

  if (state.sort?.id) {
    const column = columns.find((candidate) => candidate.id === state.sort.id);
    if (column) {
      filteredRows = filteredRows
        .map((row, index) => ({ row, index }))
        .sort((a, b) => {
          const aValue = columnValue(a.row, column);
          const bValue = columnValue(b.row, column);
          let result;
          if (typeof column.sortFn === "function") {
            result = column.sortFn(aValue, bValue, a.row, b.row);
          } else if (column.type === "number") {
            result = Number(aValue || 0) - Number(bValue || 0);
          } else {
            result = normalizeText(aValue).localeCompare(
              normalizeText(bValue),
              "he",
              { numeric: true },
            );
          }
          if (result === 0) return a.index - b.index;
          return state.sort.direction === "desc" ? -result : result;
        })
        .map(({ row }) => row);
    }
  }

  const pageSize = Math.max(1, Number(state.pageSize) || DEFAULT_PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const pageIndex = Math.min(
    Math.max(0, Number(state.pageIndex) || 0),
    pageCount - 1,
  );
  const start = pageIndex * pageSize;

  return {
    filteredRows,
    pageRows: filteredRows.slice(start, start + pageSize),
    filteredCount: filteredRows.length,
    pageCount,
    pageIndex,
  };
}

export function getExportRows(rows, columns, state) {
  return applyGridPipeline(rows, columns, {
    ...state,
    pageIndex: 0,
    pageSize: Math.max(1, rows?.length || 1),
  }).filteredRows;
}
