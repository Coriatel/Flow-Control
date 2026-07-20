import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { apiClient } from "@/api/client";
import { DataGrid } from "@/components/data-grid";
import useDataGridPreferences from "@/hooks/useDataGridPreferences";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { createPageUrl } from "@/utils";

const unwrap = (response) => (response?.success ? response.data : response);

export default function BatchAndExpiryManagement() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get("/batches/quality?limit=200");
      setRows(Array.isArray(unwrap(response)) ? unwrap(response) : []);
    } catch (caught) {
      setError(caught);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const columns = useMemo(() => [
    { id: "reagent", header: "ריאגנט", accessorFn: (row) => row.reagent?.name || "—", mobilePrimary: true, filter: { type: "text", label: "ריאגנט" } },
    { id: "supplier", header: "ספק", accessorFn: (row) => row.supplier?.name || "—", filter: { type: "text", label: "ספק" } },
    { id: "catalog", header: "קטלוג", accessorFn: (row) => row.reagent?.catalogNumber || "—" },
    { id: "batch", header: "אצווה", accessorKey: "batchNumber", filter: { type: "text", label: "אצווה" } },
    { id: "quantity", header: "כמות", accessorKey: "currentQuantity", type: "number" },
    { id: "received", header: "תאריך קבלה", accessorKey: "receivedDate", type: "date", cell: (row) => new Date(row.receivedDate).toLocaleDateString("he-IL") },
    { id: "expiry", header: "תפוגה", accessorKey: "expiryDate", type: "date", cell: (row) => {
      const days = Math.ceil((new Date(row.expiryDate) - new Date()) / 86400000);
      return <span className={days <= 30 ? "font-semibold text-red-700" : ""}>{new Date(row.expiryDate).toLocaleDateString("he-IL")}{days <= 30 && <AlertTriangle className="inline h-4 w-4 me-1" />}</span>;
    } },
    { id: "qa", header: "QA", accessorKey: "qcStatus", filter: { type: "enum", options: ["PENDING", "APPROVED", "REQUIRES_REVIEW", "REJECTED"], label: "QA" }, cell: (row) => <Badge>{row.qcStatus}</Badge> },
    { id: "coa", header: "COA", accessorFn: (row) => row.coa?.url ? "קיים" : "חסר" },
    { id: "usability", header: "שמישות", accessorKey: "availabilityState", cell: (row) => <div>{row.availabilityState}{row.blockedReasons?.map((reason) => <div className="text-xs text-red-700" key={reason}>{reason}</div>)}</div> },
    { id: "actions", header: "פעולות", alwaysVisible: true, enableSorting: false, cell: () => <Link className="min-h-11 inline-flex items-center text-blue-700 underline" to={createPageUrl("QualityAssurance")}>QA ו-COA</Link> },
  ], []);
  const { state, setState, reset } = useDataGridPreferences({ gridId: "batch-expiry", userId: user?.id || "anonymous", version: 2, columns, pinnedRight: ["reagent"], pinnedLeft: ["actions"] });

  return <main className="space-y-5" dir="rtl">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">אצוות ותוקף</h1><p className="text-sm text-slate-600">כמות, איכות, COA ושמישות מחושבים מהמצב השמור.</p></div><Button className="min-h-11" variant="outline" onClick={load}><RefreshCw className="h-4 w-4 ms-1" />רענון</Button></header>
    {loading ? <div className="min-h-48 grid place-items-center"><Loader2 className="animate-spin" /></div> : error ? <div role="alert" className="rounded border border-red-200 bg-red-50 p-5">הנתונים אינם זמינים: {error.message}</div> : <DataGrid ariaLabel="טבלת אצוות ותוקף" columns={columns} rows={rows} state={state} onStateChange={setState} onResetPreferences={reset} rowKey={(row) => row.id} emptyMessage="אין אצוות להצגה" />}
  </main>;
}
