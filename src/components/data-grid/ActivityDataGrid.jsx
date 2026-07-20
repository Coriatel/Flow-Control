/* eslint-disable react/prop-types */
import { useEffect, useMemo } from "react";

import useDataGridPreferences from "@/hooks/useDataGridPreferences";
import { getExportRows } from "@/lib/data-grid/gridState";

import DataGrid from "./DataGrid";

const PAGE_SIZES = [10, 25, 50];
const PINNED_RIGHT = ["action"];

function formatActivityDate(value) {
  if (!value) return "לא ידוע";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "לא ידוע";
  return new Intl.DateTimeFormat("he-IL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

const ACTIVITY_COLUMNS = [
  {
    id: "action",
    header: "פעולה",
    accessorKey: "action",
    defaultWidth: 180,
    alwaysVisible: true,
    mobilePrimary: true,
    filter: { label: "סינון פעולה" },
    cell: (activity) => (
      <span className="font-semibold text-slate-900">
        {activity.action || "—"}
      </span>
    ),
  },
  {
    id: "date",
    header: "תאריך",
    accessorKey: "date",
    defaultWidth: 160,
    sortFn: (a, b) =>
      new Date(a || 0).getTime() - new Date(b || 0).getTime(),
    cell: (activity) => formatActivityDate(activity.date),
  },
  {
    id: "description",
    header: "תיאור",
    accessorKey: "description",
    defaultWidth: 240,
  },
  {
    id: "details",
    header: "פרטים",
    accessorKey: "details",
    defaultWidth: 220,
  },
  {
    id: "user",
    header: "משתמש",
    accessorKey: "user",
    defaultWidth: 150,
    filter: { label: "סינון משתמש" },
  },
  {
    id: "impact",
    header: "השפעה על מלאי",
    accessorKey: "impact",
    defaultWidth: 150,
    cell: (activity) =>
      activity.impact ? (
        <span className="font-medium text-orange-700">{activity.impact}</span>
      ) : (
        "—"
      ),
  },
  {
    id: "label",
    header: "סוג",
    accessorKey: "label",
    defaultWidth: 140,
    filter: { label: "סינון סוג" },
    cell: (activity) => (
      <span className="inline-flex min-h-7 items-center rounded-full bg-slate-100 px-2 text-xs font-medium text-slate-700">
        {activity.label || "לא מסווג"}
      </span>
    ),
  },
];

export default function ActivityDataGrid({
  activities = [],
  userId = "anonymous",
  onViewRowsChange,
}) {
  const initialSort = useMemo(
    () => ({ id: "date", direction: "desc" }),
    [],
  );
  const { state, setState, reset } = useDataGridPreferences({
    gridId: "activity-log",
    userId,
    columns: ACTIVITY_COLUMNS,
    version: 1,
    initialSort,
    pinnedRight: PINNED_RIGHT,
    pageSize: 25,
    pageSizes: PAGE_SIZES,
  });
  const viewRows = useMemo(
    () => getExportRows(activities, ACTIVITY_COLUMNS, state),
    [activities, state],
  );

  useEffect(() => {
    onViewRowsChange?.(viewRows);
  }, [onViewRowsChange, viewRows]);

  return (
    <DataGrid
      ariaLabel="יומן פעילות"
      columns={ACTIVITY_COLUMNS}
      rows={activities}
      state={state}
      onStateChange={setState}
      onResetPreferences={reset}
      rowKey={(activity) => activity.id}
      pageSizes={PAGE_SIZES}
    />
  );
}
