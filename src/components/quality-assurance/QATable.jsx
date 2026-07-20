/* eslint-disable react/prop-types */
import { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { format, isValid, parseISO } from "date-fns";
import { Edit, Eye, ShieldAlert, Trash2, Upload, Wrench } from "lucide-react";

import { DataGrid } from "@/components/data-grid";
import useDataGridPreferences from "@/hooks/useDataGridPreferences";
import { Badge } from "@/components/ui/badge";
import { createPageUrl } from "@/utils";
import { formatQuantity } from "@/components/utils/formatters";

const QA_PINNED_RIGHT = ["reagent_name"];
const QA_PINNED_LEFT = ["actions"];

function ActionButton({ label, onClick, children, tone = "slate" }) {
  const tones = {
    blue: "text-blue-700 hover:bg-blue-50",
    amber: "text-amber-700 hover:bg-amber-50",
    red: "text-red-700 hover:bg-red-50",
    slate: "text-slate-700 hover:bg-slate-100",
  };
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`min-h-11 min-w-11 rounded-md inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

function formatDate(value) {
  if (!value) return "—";
  const parsed = parseISO(value);
  return isValid(parsed) ? format(parsed, "dd/MM/yyyy") : "תאריך לא תקין";
}

function qaStatusCell(item) {
  const qaStatus = item.qaStatus ?? item.qc_status ?? "UNAVAILABLE";
  const styles = {
    RELEASED: "bg-green-100 text-green-800",
    APPROVED: "bg-green-100 text-green-800",
    PENDING: "bg-amber-100 text-amber-800",
    ON_HOLD: "bg-orange-100 text-orange-900",
    REJECTED: "bg-red-100 text-red-800",
    UNAVAILABLE: "bg-slate-100 text-slate-700",
  };
  const reasons = Array.isArray(item.blockedReasons) ? item.blockedReasons : [];
  return (
    <div className="space-y-1">
      <Badge className={styles[String(qaStatus).toUpperCase()] || styles.UNAVAILABLE}>
        {qaStatus}
      </Badge>
      {reasons.map((reason) => (
        <div key={reason} className="text-xs text-red-700">
          {reason}
        </div>
      ))}
    </div>
  );
}

export default function QATable({
  data = [],
  visibleColumns = [],
  sortField,
  sortDirection,
  onSort,
  onSortStateChange,
  onHandleItem,
  onCOAUpload,
  onCOAView,
  onEdit,
  onDelete,
  userId = "anonymous",
}) {
  const columns = useMemo(
    () =>
      visibleColumns.map((column, index) => {
        const id = column.accessor;
        const definition = {
          id,
          header: column.Header,
          accessorKey: id,
          defaultWidth: column.width || 120,
          mobilePrimary: index === 0,
          alwaysVisible: id === "actions",
          enableSorting: id !== "actions",
        };

        if (["reagent_name", "batch_number", "status", "qaStatus"].includes(id)) {
          definition.filter = {
            type: "text",
            label: `סינון ${column.Header}`,
          };
        }
        if (
          [
            "current_quantity",
            "initial_quantity",
            "receipt_quantity",
            "status_quantity",
          ].includes(id)
        ) {
          definition.type = "number";
          definition.cell = (item) => formatQuantity(item[id]);
        } else if (
          [
            "expiry_date",
            "receipt_date",
            "first_use_date",
            "manufacture_date",
          ].includes(id)
        ) {
          definition.cell = (item) => formatDate(item[id]);
          definition.sortFn = (a, b) =>
            new Date(a || 0).getTime() - new Date(b || 0).getTime();
        } else if (id === "batch_number") {
          definition.cell = (item) => (
            <Link
              to={createPageUrl(`EditReagentBatch?id=${item.reagent_batch_id}`)}
              className="font-mono text-blue-700 underline-offset-2 hover:underline"
            >
              {item.batch_number || "—"}
            </Link>
          );
        } else if (id === "qaStatus") {
          definition.accessorFn = (item) =>
            item.qaStatus ?? item.qc_status ?? "UNAVAILABLE";
          definition.cell = qaStatusCell;
        } else if (id === "status") {
          definition.cell = (item) => (
            <Badge variant="outline">{item.status || "—"}</Badge>
          );
        } else if (id === "coa_documents") {
          definition.accessorFn = (item) =>
            Array.isArray(item.coa_documents) && item.coa_documents.length
              ? "קיים"
              : "חסר";
        } else if (id === "actions") {
          definition.cell = (item) => {
            const hasCoa =
              Array.isArray(item.coa_documents) && item.coa_documents.length > 0;
            return (
              <div className="flex flex-wrap items-center gap-1">
                {hasCoa ? (
                  <ActionButton
                    label={`צפה ב-COA ${item.batch_number}`}
                    onClick={() => onCOAView?.(item)}
                    tone="blue"
                  >
                    <Eye className="h-4 w-4" />
                  </ActionButton>
                ) : (
                  <ActionButton
                    label={`העלה COA ${item.batch_number}`}
                    onClick={() => onCOAUpload?.(item)}
                    tone="amber"
                  >
                    <Upload className="h-4 w-4" />
                  </ActionButton>
                )}

                {item.canDispense === true && (
                  <ActionButton
                    label={`טפל באצווה ${item.batch_number}`}
                    onClick={() => onHandleItem?.(item)}
                    tone="blue"
                  >
                    <Wrench className="h-4 w-4" />
                  </ActionButton>
                )}
                {item.canDispense !== true &&
                  Array.isArray(item.blockedReasons) &&
                  item.blockedReasons.length > 0 && (
                    <span
                      className="min-h-11 min-w-11 inline-flex items-center justify-center text-red-700"
                      title={item.blockedReasons.join(", ")}
                      aria-label={`האצווה חסומה: ${item.blockedReasons.join(", ")}`}
                    >
                      <ShieldAlert className="h-4 w-4" />
                    </span>
                  )}

                <ActionButton
                  label={`ערוך אצווה ${item.batch_number}`}
                  onClick={() => onEdit?.(item)}
                >
                  <Edit className="h-4 w-4" />
                </ActionButton>
                <ActionButton
                  label={`מחק אצווה ${item.batch_number}`}
                  onClick={() => onDelete?.(item)}
                  tone="red"
                >
                  <Trash2 className="h-4 w-4" />
                </ActionButton>
              </div>
            );
          };
        }
        return definition;
      }),
    [
      visibleColumns,
      onCOAView,
      onCOAUpload,
      onHandleItem,
      onEdit,
      onDelete,
    ],
  );
  const initialSort = useMemo(
    () =>
      sortField
        ? { id: sortField, direction: sortDirection || "asc" }
        : null,
    [sortField, sortDirection],
  );
  const { state, setState, reset } = useDataGridPreferences({
    gridId: "quality-assurance",
    userId,
    columns,
    version: 1,
    initialSort,
    pageSize: 25,
    pinnedRight: QA_PINNED_RIGHT,
    pinnedLeft: QA_PINNED_LEFT,
  });
  const previousSort = useRef(state.sort);

  useEffect(() => {
    const previous = previousSort.current;
    const current = state.sort;
    if (
      previous?.id === current?.id &&
      previous?.direction === current?.direction
    ) {
      return;
    }
    previousSort.current = current;
    if (onSortStateChange) onSortStateChange(current);
    else if (current?.id && onSort) onSort(current.id);
  }, [state.sort, onSortStateChange, onSort]);

  return (
    <DataGrid
      ariaLabel="טבלת בקרת איכות ואצוות"
      columns={columns}
      rows={data}
      state={state}
      onStateChange={setState}
      onResetPreferences={reset}
      rowKey={(item) => item.reagent_batch_id || item.id}
      pageSizes={[10, 25, 50]}
    />
  );
}
