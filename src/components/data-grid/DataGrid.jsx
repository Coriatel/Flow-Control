/* eslint-disable react/prop-types */
import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  Columns3,
  GripVertical,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
} from "lucide-react";

import {
  applyGridPipeline,
  cycleSort,
  moveColumn,
  resizeColumn,
} from "@/lib/data-grid/gridState";

function resolveCell(row, column) {
  if (typeof column.cell === "function") return column.cell(row);
  const value =
    typeof column.accessorFn === "function"
      ? column.accessorFn(row)
      : row?.[column.accessorKey || column.id];
  if (value == null || value === "") return <span className="text-slate-400">—</span>;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function withAccessibleActionSize(content) {
  if (!React.isValidElement(content)) return content;
  return React.cloneElement(content, {
    className: [
      content.props.className,
      "min-h-11 min-w-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
    ]
      .filter(Boolean)
      .join(" "),
  });
}

function StateShell({ status, error, onRetry }) {
  const states = {
    loading: {
      icon: <Loader2 className="h-8 w-8 animate-spin text-blue-600" />,
      title: "טוען נתונים",
      description: "הטבלה תופיע מיד עם השלמת הטעינה.",
    },
    empty: {
      icon: <Columns3 className="h-8 w-8 text-slate-400" />,
      title: "אין נתונים להצגה",
      description: "לא קיימות רשומות בתצוגה זו.",
    },
    error: {
      icon: <AlertCircle className="h-8 w-8 text-red-600" />,
      title: "שגיאה בטעינת הנתונים",
      description: error?.message || "לא ניתן לטעון את הנתונים.",
    },
    unauthorized: {
      icon: <ShieldAlert className="h-8 w-8 text-amber-600" />,
      title: "אין הרשאה לצפות בנתונים",
      description: "יש לפנות למנהל המערכת לקבלת הרשאה.",
    },
  };
  const current = states[status];
  if (!current) return null;
  return (
    <div
      className="min-h-52 rounded-xl border border-slate-200 bg-white p-8 text-center flex flex-col items-center justify-center gap-3"
      role={status === "error" ? "alert" : "status"}
    >
      {current.icon}
      <h3 className="font-semibold text-slate-800">{current.title}</h3>
      <p className="text-sm text-slate-500">{current.description}</p>
      {status === "error" && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="min-h-11 px-4 rounded-md border border-slate-300 inline-flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <RefreshCw className="h-4 w-4" />
          נסה שוב
        </button>
      )}
    </div>
  );
}

export default function DataGrid({
  ariaLabel,
  columns,
  rows = [],
  state,
  onStateChange,
  status = "ready",
  error = null,
  stale = false,
  onRetry,
  onResetPreferences,
  rowKey = (row) => row.id,
  pageSizes = [10, 25, 50],
}) {
  const [expandedRows, setExpandedRows] = useState(() => new Set());
  const [draggedColumn, setDraggedColumn] = useState(null);
  const pipeline = useMemo(
    () => applyGridPipeline(rows, columns, state),
    [rows, columns, state],
  );
  const updateState = (updater) => onStateChange(updater);

  const pinnedStyle = (column) => {
    const right = state.pinnedColumns?.right || [];
    const left = state.pinnedColumns?.left || [];
    if (right.includes(column.id)) {
      const index = right.indexOf(column.id);
      const offset = right
        .slice(0, index)
        .reduce((sum, id) => sum + (state.columnWidths[id] || 0), 0);
      return {
        position: "sticky",
        right: offset,
        zIndex: 5,
        background: "inherit",
      };
    }
    if (left.includes(column.id)) {
      const index = left.indexOf(column.id);
      const offset = left
        .slice(0, index)
        .reduce((sum, id) => sum + (state.columnWidths[id] || 0), 0);
      return {
        position: "sticky",
        left: offset,
        zIndex: 5,
        background: "inherit",
      };
    }
    return {};
  };

  const visibleColumns = useMemo(() => {
    const byId = new Map(columns.map((column) => [column.id, column]));
    const ordered = state.columnOrder
      .map((id) => byId.get(id))
      .filter(Boolean)
      .filter((column) => state.columnVisibility[column.id] !== false);
    const right = new Set(state.pinnedColumns?.right || []);
    const left = new Set(state.pinnedColumns?.left || []);
    return [
      ...ordered.filter((column) => right.has(column.id)),
      ...ordered.filter((column) => !right.has(column.id) && !left.has(column.id)),
      ...ordered.filter((column) => left.has(column.id)),
    ];
  }, [columns, state.columnOrder, state.columnVisibility, state.pinnedColumns]);

  if (status !== "ready") {
    return <StateShell status={status} error={error} onRetry={onRetry} />;
  }
  if (rows.length === 0) {
    return <StateShell status="empty" />;
  }

  const setSearch = (value) =>
    updateState((current) => ({
      ...current,
      globalSearch: value,
      pageIndex: 0,
    }));
  const setColumnFilter = (columnId, value) =>
    updateState((current) => ({
      ...current,
      columnFilters: { ...current.columnFilters, [columnId]: value },
      pageIndex: 0,
    }));
  const handleSort = (column) => {
    if (column.enableSorting === false) return;
    updateState((current) => ({
      ...current,
      sort: cycleSort(current.sort, column.id),
      pageIndex: 0,
    }));
  };
  const handleReorder = (activeId, overId) =>
    updateState((current) => ({
      ...current,
      columnOrder: moveColumn(current.columnOrder, activeId, overId),
    }));
  const handleResize = (column, delta) =>
    updateState((current) => ({
      ...current,
      columnWidths: {
        ...current.columnWidths,
        [column.id]: resizeColumn(current.columnWidths[column.id], delta, {
          min: column.minWidth,
          max: column.maxWidth,
        }),
      },
    }));

  return (
    <section className="space-y-3" aria-label={ariaLabel} dir="rtl">
      {stale && (
        <div
          role="status"
          className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900"
        >
          ייתכן שהנתונים אינם מעודכנים. אפשר לרענן לפני ביצוע פעולה.
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-3">
        <div className="flex flex-col md:flex-row gap-2">
          <label className="relative flex-1">
            <span className="sr-only">חיפוש בטבלה</span>
            <Search className="absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="search"
              aria-label="חיפוש בטבלה"
              value={state.globalSearch}
              onChange={(event) => setSearch(event.target.value)}
              className="min-h-11 w-full rounded-md border border-slate-300 pe-10 ps-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              placeholder="חיפוש בכל העמודות…"
            />
          </label>
          <details className="relative">
            <summary className="min-h-11 cursor-pointer list-none rounded-md border border-slate-300 px-4 inline-flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-blue-500">
              <Columns3 className="h-4 w-4" />
              עמודות
            </summary>
            <div className="absolute left-0 z-30 mt-2 w-72 rounded-lg border border-slate-200 bg-white p-3 shadow-xl space-y-2">
              {columns.map((column) => (
                <div
                  key={column.id}
                  className="min-h-11 flex items-center gap-1 rounded px-2 hover:bg-slate-50"
                >
                  <label className="flex flex-1 items-center gap-2">
                    <input
                      type="checkbox"
                      checked={state.columnVisibility[column.id] !== false}
                      disabled={column.alwaysVisible}
                      onChange={(event) =>
                        updateState((current) => ({
                          ...current,
                          columnVisibility: {
                            ...current.columnVisibility,
                            [column.id]: event.target.checked,
                          },
                        }))
                      }
                    />
                    <span>{column.header}</span>
                  </label>
                  <button
                    type="button"
                    aria-label={`הצמד עמודה ${column.header} לימין`}
                    title="הצמד/בטל הצמדה לימין"
                    onClick={() =>
                      updateState((current) => ({
                        ...current,
                        pinnedColumns: {
                          right: current.pinnedColumns.right.includes(column.id)
                            ? current.pinnedColumns.right.filter(
                                (id) => id !== column.id,
                              )
                            : [
                                ...current.pinnedColumns.right,
                                column.id,
                              ],
                          left: current.pinnedColumns.left.filter(
                            (id) => id !== column.id,
                          ),
                        },
                      }))
                    }
                    className="min-h-11 min-w-11 rounded flex items-center justify-center"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`הצמד עמודה ${column.header} לשמאל`}
                    title="הצמד/בטל הצמדה לשמאל"
                    onClick={() =>
                      updateState((current) => ({
                        ...current,
                        pinnedColumns: {
                          right: current.pinnedColumns.right.filter(
                            (id) => id !== column.id,
                          ),
                          left: current.pinnedColumns.left.includes(column.id)
                            ? current.pinnedColumns.left.filter(
                                (id) => id !== column.id,
                              )
                            : [...current.pinnedColumns.left, column.id],
                        },
                      }))
                    }
                    className="min-h-11 min-w-11 rounded flex items-center justify-center"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                aria-label="איפוס תצוגת הטבלה"
                onClick={onResetPreferences}
                className="min-h-11 w-full rounded-md border border-slate-300 px-3 flex items-center justify-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                איפוס לברירת מחדל
              </button>
            </div>
          </details>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {columns
            .filter((column) => column.filter)
            .map((column) => (
              <label key={column.id} className="text-xs text-slate-600">
                <span className="mb-1 block">{column.filter.label || column.header}</span>
                <input
                  aria-label={column.filter.label || `סינון ${column.header}`}
                  value={state.columnFilters[column.id] || ""}
                  onChange={(event) =>
                    setColumnFilter(column.id, event.target.value)
                  }
                  className="min-h-11 w-full rounded-md border border-slate-300 px-3"
                />
              </label>
            ))}
        </div>
      </div>

      {pipeline.filteredCount === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <h3 className="font-semibold text-slate-800">לא נמצאו תוצאות</h3>
          <p className="mt-1 text-sm text-slate-500">אפשר לשנות את החיפוש או המסננים.</p>
        </div>
      ) : (
        <>
          <div className="hidden md:block overflow-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full border-collapse" aria-label={ariaLabel}>
              <thead className="sticky top-0 z-10 bg-slate-50">
                <tr>
                  {visibleColumns.map((column) => {
                    const sortValue =
                      state.sort?.id === column.id
                        ? state.sort.direction === "asc"
                          ? "ascending"
                          : "descending"
                        : "none";
                    return (
                      <th
                        key={column.id}
                        scope="col"
                        aria-sort={column.enableSorting === false ? undefined : sortValue}
                        draggable
                        onDragStart={() => setDraggedColumn(column.id)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => {
                          if (draggedColumn) handleReorder(draggedColumn, column.id);
                          setDraggedColumn(null);
                        }}
                        className="relative border-b border-slate-200 px-3 py-2 text-right text-sm font-semibold text-slate-700"
                        style={{
                          width: state.columnWidths[column.id],
                          minWidth: state.columnWidths[column.id],
                          ...pinnedStyle(column),
                        }}
                      >
                        <div className="flex items-center gap-1">
                          {column.headerCell ? (
                            column.headerCell(column)
                          ) : column.enableSorting === false ? (
                            <span>{column.header}</span>
                          ) : (
                            <button
                              type="button"
                              aria-label={`מיין לפי ${column.header}`}
                              onClick={() => handleSort(column)}
                              className="min-h-11 flex-1 flex items-center gap-2 text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                            >
                              <span>{column.header}</span>
                              {sortValue === "ascending" ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : sortValue === "descending" ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronsUpDown className="h-4 w-4 text-slate-400" />
                              )}
                            </button>
                          )}
                          <button
                            type="button"
                            aria-label={`הזז עמודה ${column.header}`}
                            title="גרירה או Alt+חצים להזזת העמודה"
                            onKeyDown={(event) => {
                              if (!event.altKey) return;
                              const index = state.columnOrder.indexOf(column.id);
                              const logicalDelta =
                                event.key === "ArrowLeft"
                                  ? 1
                                  : event.key === "ArrowRight"
                                    ? -1
                                    : 0;
                              const target = state.columnOrder[index + logicalDelta];
                              if (target) {
                                event.preventDefault();
                                handleReorder(column.id, target);
                              }
                            }}
                            className="min-h-11 min-w-11 flex items-center justify-center rounded focus-visible:ring-2 focus-visible:ring-blue-500"
                          >
                            <GripVertical className="h-4 w-4 text-slate-400" />
                          </button>
                        </div>
                        <div
                          role="separator"
                          tabIndex={0}
                          aria-orientation="vertical"
                          aria-label={`שנה רוחב עמודה ${column.header}`}
                          aria-valuemin={column.minWidth || 72}
                          aria-valuemax={column.maxWidth || 640}
                          aria-valuenow={state.columnWidths[column.id]}
                          onPointerDown={(event) => {
                            const startX = event.clientX;
                            const startWidth = state.columnWidths[column.id];
                            event.currentTarget.setPointerCapture?.(event.pointerId);
                            const target = event.currentTarget;
                            target.onpointermove = (moveEvent) => {
                              const rtlDelta = startX - moveEvent.clientX;
                              handleResize(column, startWidth + rtlDelta - state.columnWidths[column.id]);
                            };
                            target.onpointerup = () => {
                              target.onpointermove = null;
                              target.onpointerup = null;
                            };
                          }}
                          onKeyDown={(event) => {
                            const delta =
                              event.key === "ArrowLeft"
                                ? 8
                                : event.key === "ArrowRight"
                                  ? -8
                                  : 0;
                            if (delta) {
                              event.preventDefault();
                              handleResize(column, delta);
                            }
                          }}
                          className="absolute left-0 top-0 h-full w-3 cursor-col-resize focus-visible:bg-blue-300"
                        />
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {pipeline.pageRows.map((row) => (
                  <tr key={rowKey(row)} className="border-b border-slate-100 hover:bg-slate-50">
                    {visibleColumns.map((column) => (
                      <td
                        key={column.id}
                        className="px-3 py-2 text-sm text-slate-700"
                        style={{
                          width: state.columnWidths[column.id],
                          minWidth: state.columnWidths[column.id],
                          ...pinnedStyle(column),
                        }}
                      >
                        {column.id === "actions"
                          ? withAccessibleActionSize(resolveCell(row, column))
                          : resolveCell(row, column)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3" data-testid="data-grid-mobile">
            {pipeline.pageRows.map((row) => {
              const id = rowKey(row);
              const expanded = expandedRows.has(id);
              const primary =
                visibleColumns.find((column) => column.mobilePrimary) ||
                visibleColumns[0];
              const accessibleRowName =
                row.name ||
                row.reagent_name ||
                row.delivery_number ||
                row.order_number_temp ||
                id;
              const details = visibleColumns.filter(
                (column) => column.id !== primary?.id && column.id !== "actions",
              );
              const actions = visibleColumns.find((column) => column.id === "actions");
              return (
                <article key={id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 font-semibold text-slate-900">
                      {primary ? resolveCell(row, primary) : id}
                    </div>
                    <button
                      type="button"
                      aria-expanded={expanded}
                      aria-label={`${expanded ? "הסתר" : "הצג"} פרטים ${accessibleRowName}`}
                      onClick={() =>
                        setExpandedRows((current) => {
                          const next = new Set(current);
                          if (next.has(id)) next.delete(id);
                          else next.add(id);
                          return next;
                        })
                      }
                      className="min-h-11 min-w-11 rounded-md border border-slate-300 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      {expanded ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {expanded && (
                    <dl className="mt-3 divide-y divide-slate-100">
                      {details.map((column) => (
                        <div key={column.id} className="py-2 flex justify-between gap-3">
                          <dt className="text-xs text-slate-500">{column.header}</dt>
                          <dd className="text-sm text-slate-800 text-left">
                            {resolveCell(row, column)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}
                  {actions && (
                    <div className="mt-3 border-t border-slate-100 pt-3 flex gap-2">
                      {withAccessibleActionSize(resolveCell(row, actions))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}

      {pipeline.filteredCount > 0 && (
        <nav
          aria-label="עימוד טבלה"
          className="rounded-xl border border-slate-200 bg-white p-3 flex flex-wrap items-center justify-between gap-3"
        >
          <span className="text-sm text-slate-600">
            עמוד {pipeline.pageIndex + 1} מתוך {pipeline.pageCount} ·{" "}
            {pipeline.filteredCount} רשומות
          </span>
          <div className="flex items-center gap-2">
            <label className="text-sm flex items-center gap-2">
              שורות בעמוד
              <select
                aria-label="שורות בעמוד"
                value={state.pageSize}
                onChange={(event) =>
                  updateState((current) => ({
                    ...current,
                    pageSize: Number(event.target.value),
                    pageIndex: 0,
                  }))
                }
                className="min-h-11 rounded-md border border-slate-300 px-2"
              >
                {pageSizes.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              aria-label="לעמוד הקודם"
              disabled={pipeline.pageIndex === 0}
              onClick={() =>
                updateState((current) => ({
                  ...current,
                  pageIndex: Math.max(0, pipeline.pageIndex - 1),
                }))
              }
              className="min-h-11 min-w-11 rounded-md border border-slate-300 flex items-center justify-center disabled:opacity-40"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="לעמוד הבא"
              disabled={pipeline.pageIndex >= pipeline.pageCount - 1}
              onClick={() =>
                updateState((current) => ({
                  ...current,
                  pageIndex: Math.min(
                    pipeline.pageCount - 1,
                    pipeline.pageIndex + 1,
                  ),
                }))
              }
              className="min-h-11 min-w-11 rounded-md border border-slate-300 flex items-center justify-center disabled:opacity-40"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>
        </nav>
      )}
    </section>
  );
}
