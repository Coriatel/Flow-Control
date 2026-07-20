import { useCallback, useEffect, useMemo, useState } from "react";
import { FileCheck2, Loader2, RefreshCw, ShieldCheck } from "lucide-react";

import { apiClient } from "@/api/client";
import { DataGrid } from "@/components/data-grid";
import useDataGridPreferences from "@/hooks/useDataGridPreferences";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const unwrap = (response) =>
  response?.success && "data" in response ? response.data : response;

const statusTone = {
  APPROVED: "bg-emerald-100 text-emerald-800",
  PENDING: "bg-amber-100 text-amber-900",
  REQUIRES_REVIEW: "bg-orange-100 text-orange-900",
  REJECTED: "bg-red-100 text-red-800",
};

export default function QualityAssurancePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState(null);
  const [notes, setNotes] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  useEffect(() => {
    load();
  }, [load]);

  const openAction = useCallback((row, nextMode) => {
    setSelected(row);
    setMode(nextMode);
    setNotes("");
    setDocumentUrl(row.coa?.url || "");
  }, []);

  const columns = useMemo(
    () => [
      {
        id: "reagent",
        header: "ריאגנט",
        accessorFn: (row) => row.reagent?.name || "—",
        mobilePrimary: true,
        filter: { type: "text", label: "ריאגנט" },
        defaultWidth: 180,
      },
      {
        id: "batchNumber",
        header: "אצווה",
        accessorKey: "batchNumber",
        filter: { type: "text", label: "אצווה" },
      },
      {
        id: "quantity",
        header: "כמות",
        accessorKey: "currentQuantity",
        type: "number",
      },
      {
        id: "expiryDate",
        header: "תפוגה",
        accessorKey: "expiryDate",
        type: "date",
        cell: (row) => new Date(row.expiryDate).toLocaleDateString("he-IL"),
      },
      {
        id: "qcStatus",
        header: "QA",
        accessorKey: "qcStatus",
        filter: { type: "enum", options: Object.keys(statusTone), label: "QA" },
        cell: (row) => (
          <Badge className={statusTone[row.qcStatus] || "bg-slate-100 text-slate-800"}>
            {row.qcStatus}
          </Badge>
        ),
      },
      {
        id: "coa",
        header: "COA",
        accessorFn: (row) => (row.coa?.url ? "קיים" : "חסר"),
        cell: (row) =>
          row.coa?.url ? (
            <a
              className="text-blue-700 underline min-h-11 inline-flex items-center"
              href={row.coa.url}
              target="_blank"
              rel="noreferrer"
            >
              פתיחה
            </a>
          ) : (
            "חסר"
          ),
      },
      {
        id: "usability",
        header: "שמישות",
        accessorKey: "availabilityState",
        cell: (row) => (
          <div>
            <div>{row.availabilityState}</div>
            {row.blockedReasons?.map((reason) => (
              <div className="text-xs text-red-700" key={reason}>
                {reason}
              </div>
            ))}
          </div>
        ),
      },
      {
        id: "actions",
        header: "פעולות",
        alwaysVisible: true,
        enableSorting: false,
        cell: (row) => (
          <div className="flex flex-wrap gap-2">
            <Button className="min-h-11" variant="outline" onClick={() => openAction(row, "coa")}>
              <FileCheck2 className="h-4 w-4 ms-1" />
              COA
            </Button>
            {["PENDING", "REQUIRES_REVIEW"].includes(row.qcStatus) && (
              <>
                <Button className="min-h-11" onClick={() => openAction(row, "APPROVE")}>
                  שחרור
                </Button>
                <Button className="min-h-11" variant="outline" onClick={() => openAction(row, "HOLD")}>
                  החזקה
                </Button>
                <Button className="min-h-11" variant="destructive" onClick={() => openAction(row, "REJECT")}>
                  דחייה
                </Button>
              </>
            )}
          </div>
        ),
      },
    ],
    [openAction],
  );

  const { state, setState, reset } = useDataGridPreferences({
    gridId: "quality-authoritative",
    userId: user?.id || "anonymous",
    version: 2,
    columns,
    pinnedRight: ["reagent"],
    pinnedLeft: ["actions"],
  });

  const submit = async () => {
    if (!selected || !mode) return;
    setSubmitting(true);
    try {
      const clientRequestId = crypto.randomUUID();
      if (mode === "coa") {
        await apiClient.post(`/batches/${selected.id}/coa`, {
          clientRequestId,
          documentUrl,
        });
      } else {
        await apiClient.post(`/batches/${selected.id}/quality-decision`, {
          clientRequestId,
          decision: mode,
          notes,
        });
      }
      setMode(null);
      setSelected(null);
      await load();
      toast({ title: "מצב האצווה עודכן", variant: "success" });
    } catch (caught) {
      toast({ title: "העדכון נכשל", description: caught.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="space-y-5" dir="rtl">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6" />
            איכות, אצוות ו-COA
          </h1>
          <p className="text-sm text-slate-600">קבלה יוצרת אצווה ממתינה; רק החלטת QA משחררת אותה לשימוש.</p>
        </div>
        <Button className="min-h-11" variant="outline" onClick={load}>
          <RefreshCw className="h-4 w-4 ms-1" />
          רענון
        </Button>
      </header>

      {loading ? (
        <div className="min-h-48 grid place-items-center"><Loader2 className="animate-spin" /></div>
      ) : error ? (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-5">
          נתוני האיכות אינם זמינים: {error.message}
        </div>
      ) : (
        <DataGrid
          ariaLabel="טבלת איכות ואצוות"
          columns={columns}
          rows={rows}
          state={state}
          onStateChange={setState}
          onResetPreferences={reset}
          rowKey={(row) => row.id}
          emptyMessage="אין אצוות להצגה"
        />
      )}

      <Dialog open={Boolean(mode)} onOpenChange={(open) => !open && setMode(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>{mode === "coa" ? "קישור COA מאושר" : "החלטת איכות"}</DialogTitle>
          </DialogHeader>
          {mode === "coa" ? (
            <div className="space-y-2">
              <Label htmlFor="coa-reference">הפניית קובץ מאושרת</Label>
              <Input
                id="coa-reference"
                value={documentUrl}
                onChange={(event) => setDocumentUrl(event.target.value)}
                placeholder="/api/files/download/..."
              />
              <p className="text-xs text-slate-500">זהו קישור מטא-דאטה בטוח לנתיב הקבצים הקיים; אין כאן העלאה חדשה.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="qa-reason">נימוק מבקר</Label>
              <Textarea id="qa-reason" value={notes} onChange={(event) => setNotes(event.target.value)} />
            </div>
          )}
          <DialogFooter>
            <Button
              className="min-h-11"
              onClick={submit}
              disabled={submitting || (mode === "coa" ? !documentUrl.trim() : !notes.trim())}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "אישור"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
