import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { apiClient } from "@/api/client";
import { DataGrid } from "@/components/data-grid";
import useDataGridPreferences from "@/hooks/useDataGridPreferences";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const unwrap = (response) => (response?.success ? response.data : response);

export default function CurrentInventory() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const response = await apiClient.get("/inventory/current");
      setRows(Array.isArray(unwrap(response)) ? unwrap(response) : []);
    } catch (caught) { setError(caught); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const columns = useMemo(() => [
    { id: "name", header: "ריאגנט", accessorKey: "name", mobilePrimary: true, filter: { type: "text", label: "ריאגנט" } },
    { id: "catalog", header: "קטלוג", accessorKey: "catalogNumber" },
    { id: "supplier", header: "ספק", accessorFn: (row) => row.supplier?.name || "—", filter: { type: "text", label: "ספק" } },
    { id: "physical", header: "פיזי", accessorKey: "physicalQuantity", type: "number" },
    { id: "available", header: "זמין לשימוש", accessorKey: "availableQuantity", type: "number" },
    { id: "pending", header: "ממתין QA", accessorKey: "pendingQaQuantity", type: "number" },
    { id: "held", header: "מוחזק", accessorKey: "heldQuantity", type: "number" },
    { id: "expired", header: "פג תוקף", accessorKey: "expiredQuantity", type: "number" },
    { id: "minimum", header: "מינימום", accessorKey: "minStockLevel", type: "number" },
    { id: "status", header: "מצב", accessorKey: "stockStatus", filter: { type: "text", label: "מצב" }, cell: (row) => <Badge>{row.stockStatus}</Badge> },
    { id: "onOrder", header: "בדרך", accessorFn: (row) => row.replenishment?.onOrderQuantity ?? 0, type: "number" },
    { id: "recommendation", header: "המלצה", accessorFn: (row) => row.replenishment?.suggestedQuantity ?? 0, type: "number" },
  ], []);
  const { state, setState, reset } = useDataGridPreferences({ gridId: "current-inventory", userId: user?.id || "anonymous", version: 1, columns, pinnedRight: ["name"] });
  return <main className="space-y-5" dir="rtl"><header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">מלאי נוכחי</h1><p className="text-sm text-slate-600">מלאי פיזי וזמין מחושבים מאצוות ותנועות סמכותיות.</p></div><Button className="min-h-11" variant="outline" onClick={load}><RefreshCw className="h-4 w-4 ms-1" />רענון</Button></header>{loading ? <div className="min-h-48 grid place-items-center"><Loader2 className="animate-spin" /></div> : error ? <div role="alert" className="rounded border border-red-200 bg-red-50 p-5">הנתונים אינם זמינים: {error.message}</div> : <DataGrid ariaLabel="טבלת מלאי נוכחי" columns={columns} rows={rows} state={state} onStateChange={setState} onResetPreferences={reset} rowKey={(row) => row.reagentId} emptyMessage="אין מלאי להצגה" />}</main>;
}
