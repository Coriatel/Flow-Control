/* eslint-disable react/prop-types */
import { useMemo } from "react";

import DataGrid from "@/components/data-grid/DataGrid";
import useDataGridPreferences from "@/hooks/useDataGridPreferences";

const PAGE_SIZES = [10, 25, 50];

function resolveGridId(columns) {
  const keys = columns.map((column) => column.key);
  if (keys.includes("delivery_number")) return "deliveries";
  if (keys.includes("order_number_temp")) return "orders";
  return `shared-table-${keys.join("-") || "empty"}`;
}

/**
 * Compatibility adapter for the operational tables that already use
 * ResizableTable. Business cell renderers remain owned by their pages while
 * presentation state is delegated to the shared, namespaced RTL data grid.
 */
export default function ResizableTable({
  columns = [],
  data = [],
  visibleColumns = [],
  sortField = "",
  sortDirection = "asc",
  renderCell = () => null,
  renderHeader = null,
}) {
  const gridId = useMemo(() => resolveGridId(columns), [columns]);
  const gridColumns = useMemo(
    () =>
      columns.map((column) => {
        const customHeader = renderHeader?.(column);
        return {
          id: column.key,
          header: column.label,
          accessorKey: column.key,
          defaultWidth: column.defaultWidth || 150,
          minWidth: column.minWidth || 72,
          maxWidth: column.maxWidth || 640,
          enableSorting: column.sortable !== false,
          alwaysVisible: column.alwaysVisible === true,
          defaultVisible:
            column.alwaysVisible === true || visibleColumns.includes(column.key),
          mobilePrimary:
            column.mobilePrimary === true ||
            ["delivery_number", "order_number_temp"].includes(column.key),
          cell: (row) => renderCell(row, column.key),
          headerCell:
            customHeader == null ? null : () => customHeader,
        };
      }),
    [columns, renderCell, renderHeader, visibleColumns],
  );
  const initialSort = useMemo(
    () =>
      sortField
        ? {
            id: sortField,
            direction: sortDirection === "desc" ? "desc" : "asc",
          }
        : null,
    [sortDirection, sortField],
  );
  const pinnedRight = useMemo(() => {
    const primary = gridColumns.find((column) => column.mobilePrimary);
    return primary ? [primary.id] : [];
  }, [gridColumns]);
  const pinnedLeft = useMemo(
    () =>
      gridColumns.some((column) => column.id === "actions")
        ? ["actions"]
        : [],
    [gridColumns],
  );
  const { state, setState, reset } = useDataGridPreferences({
    gridId,
    columns: gridColumns,
    initialSort,
    pinnedRight,
    pinnedLeft,
    pageSize: 25,
    pageSizes: PAGE_SIZES,
  });

  return (
    <DataGrid
      ariaLabel={gridId === "orders" ? "הזמנות" : gridId === "deliveries" ? "משלוחים" : "טבלת נתונים"}
      columns={gridColumns}
      rows={data}
      state={state}
      onStateChange={setState}
      onResetPreferences={reset}
      pageSizes={PAGE_SIZES}
    />
  );
}
