import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import BackButton from "@/components/ui/BackButton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Trash2,
  Beaker,
  Truck,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Search,
  Package,
  ArrowRight,
} from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast as sonnerToast } from "sonner";
import BarcodeScanner from "@/components/ui/BarcodeScanner";
import { createPageUrl } from "@/utils";

import { Reagent } from "@/api/entities";
import { apiClient } from "@/api/client";

function unwrapResponse(response) {
  if (
    response &&
    typeof response === "object" &&
    response.success &&
    "data" in response
  ) {
    return response.data;
  }
  return response;
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  try {
    const d =
      typeof dateStr === "string" ? parseISO(dateStr) : new Date(dateStr);
    return format(d, "dd/MM/yyyy", { locale: he });
  } catch {
    return "-";
  }
}

const DESTRUCTION_REASONS = [
  { value: "expired", label: "נגמר תוקף" },
  { value: "damaged", label: "פגם / נזק" },
  { value: "manager_decision", label: "החלטת מנהל" },
  { value: "other", label: "אחר" },
];

const WASTE_OPTIONS = [
  { value: "1", label: "100%" },
  { value: "0.75", label: "75%" },
  { value: "0.5", label: "50%" },
  { value: "0.25", label: "25%" },
];

const TAB_CONFIG = {
  destroy: {
    label: "השמדה",
    icon: Trash2,
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  usage: {
    label: "שימוש",
    icon: Beaker,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  shipment: {
    label: "משלוח",
    icon: Truck,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  other: {
    label: "סיבה אחרת",
    icon: FileText,
    color: "text-slate-600",
    bgColor: "bg-slate-50",
  },
};

export default function InventoryRemoval() {
  const [searchParams] = useSearchParams();
  const initialPreset = searchParams.get("preset") || "destroy";
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState(initialPreset);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Destruction tab state
  const [candidates, setCandidates] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [itemReasons, setItemReasons] = useState({});
  const [itemWaste, setItemWaste] = useState({});
  const [itemNotes, setItemNotes] = useState({});

  // Usage tab state
  const [batches, setBatches] = useState([]);
  const [reagents, setReagents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [dispenseQuantity, setDispenseQuantity] = useState(1);
  const [dispensePurpose, setDispensePurpose] = useState("");
  const [dispenseNotes, setDispenseNotes] = useState("");
  const [dispenseDialogOpen, setDispenseDialogOpen] = useState(false);
  const [dispenseRequestId, setDispenseRequestId] = useState(null);

  // Other tab state
  const [otherBatch, setOtherBatch] = useState(null);
  const [otherQuantity, setOtherQuantity] = useState(1);
  const [otherReason, setOtherReason] = useState("");
  const [otherNotes, setOtherNotes] = useState("");
  const [otherDialogOpen, setOtherDialogOpen] = useState(false);

  // Recent activity
  const [recentDispenses, setRecentDispenses] = useState([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [candidatesRes, batchData, reagentData, historyRes] =
        await Promise.all([
          apiClient.get("/disposal/destruction-candidates"),
          apiClient.get("/batches/quality?limit=200"),
          Reagent.list(),
          apiClient.get("/dispense/history?limit=5"),
        ]);

      const candidatesList = unwrapResponse(candidatesRes);
      setCandidates(Array.isArray(candidatesList) ? candidatesList : []);

      // Pre-select expired items and set default reasons
      const expiredIds = new Set();
      const defaultReasons = {};
      const defaultWaste = {};
      if (Array.isArray(candidatesList)) {
        candidatesList.forEach((c) => {
          if (c.isExpired) {
            expiredIds.add(c.id);
            defaultReasons[c.id] = "expired";
          }
          defaultWaste[c.id] = "1";
        });
      }
      setSelectedItems(expiredIds);
      setItemReasons(defaultReasons);
      setItemWaste(defaultWaste);

      const qualityBatches = unwrapResponse(batchData);
      setBatches(
        (Array.isArray(qualityBatches) ? qualityBatches : []).map((batch) => ({
          ...batch,
          reagentId: batch.reagent?.id ?? batch.reagentId,
          batchNumber: batch.batchNumber ?? batch.batch_number,
          currentQuantity: batch.availableQuantity,
          reagentName: batch.reagent?.name,
          catalogNumber: batch.reagent?.catalogNumber,
        })),
      );
      setReagents(Array.isArray(reagentData) ? reagentData : []);

      const history = unwrapResponse(historyRes);
      setRecentDispenses(Array.isArray(history) ? history : []);
    } catch (err) {
      toast({
        title: "שגיאה בטעינת נתונים",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reagent lookup map
  const reagentMap = useMemo(() => {
    const map = {};
    reagents.forEach((r) => {
      map[r.id] = r;
    });
    return map;
  }, [reagents]);

  // Handle barcode scan
  const handleBarcodeScan = useCallback(
    async (rawData) => {
      try {
        const parseRes = await apiClient.post("/barcode/parse", { rawData });
        const parsed = unwrapResponse(parseRes);

        if (!parsed?.lotNumber && !parsed?.catalogNumber) {
          sonnerToast.warning("לא ניתן לזהות נתוני ברקוד");
          return;
        }

        // Try to find matching batch
        const allBatches = [...candidates, ...batches];
        let matched = null;

        if (parsed.lotNumber) {
          matched = allBatches.find((b) => b.batchNumber === parsed.lotNumber);
        }
        if (!matched && parsed.catalogNumber) {
          matched = allBatches.find((b) => {
            const reagent = reagentMap[b.reagentId];
            return reagent?.catalogNumber === parsed.catalogNumber;
          });
        }

        if (!matched) {
          sonnerToast.warning("לא נמצאה אצווה תואמת לברקוד");
          return;
        }

        // Smart auto-detection
        const now = new Date();
        const expiryDate = matched.expiryDate
          ? new Date(matched.expiryDate)
          : null;
        const daysUntilExpiry = expiryDate
          ? differenceInDays(expiryDate, now)
          : 999;

        if (daysUntilExpiry <= 0) {
          // Expired → auto-switch to Destruction tab
          setActiveTab("destroy");
          setSelectedItems((prev) => new Set([...prev, matched.id]));
          setItemReasons((prev) => ({ ...prev, [matched.id]: "expired" }));
          setItemWaste((prev) => ({ ...prev, [matched.id]: "1" }));
          sonnerToast.error(`פריט פג תוקף! עבר אוטומטית ללשונית השמדה`, {
            description: `${matched.reagentName || reagentMap[matched.reagentId]?.name} - אצווה ${matched.batchNumber}`,
          });
        } else if (daysUntilExpiry <= 30) {
          // Near expiry → suggest destruction
          sonnerToast.warning(`פריט קרוב לתוקף (${daysUntilExpiry} ימים)`, {
            description: "מומלץ לעבור ללשונית השמדה",
            action: {
              label: "עבור להשמדה",
              onClick: () => {
                setActiveTab("destroy");
                setSelectedItems((prev) => new Set([...prev, matched.id]));
              },
            },
          });
        } else {
          // Active batch
          if (activeTab === "usage") {
            setSelectedBatch(matched);
            setDispenseRequestId(crypto.randomUUID());
            setDispenseDialogOpen(true);
          } else if (activeTab === "other") {
            setOtherBatch(matched);
            setOtherDialogOpen(true);
          } else if (activeTab === "destroy") {
            sonnerToast.info(`פריט פעיל — לא מיועד להשמדה`, {
              description:
                'עבור ללשונית "שימוש" או "סיבה אחרת" לטיפול בפריט זה',
              action: {
                label: "עבור לשימוש",
                onClick: () => setActiveTab("usage"),
              },
            });
            return;
          } else if (activeTab === "shipment") {
            sonnerToast.success(`נמצאה אצווה: ${matched.batchNumber}`, {
              description: "עבור לדף משלוח חדש לביצוע העברה",
            });
            return;
          }
          sonnerToast.success(`נמצאה אצווה: ${matched.batchNumber}`, {
            description:
              matched.reagentName || reagentMap[matched.reagentId]?.name,
          });
        }
      } catch (err) {
        sonnerToast.error("שגיאה בפענוח ברקוד", { description: err.message });
      }
    },
    [candidates, batches, reagentMap, activeTab],
  );

  // Destruction handlers
  const toggleSelectAll = () => {
    if (selectedItems.size === candidates.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(candidates.map((c) => c.id)));
    }
  };

  const toggleSelectItem = (id) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDestroy = async () => {
    if (selectedItems.size === 0) {
      toast({ title: "לא נבחרו פריטים", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const items = [...selectedItems].map((id) => {
        const candidate = candidates.find((c) => c.id === id);
        return {
          batchId: id,
          quantity: candidate?.currentQuantity || 0,
          reason:
            DESTRUCTION_REASONS.find((r) => r.value === itemReasons[id])
              ?.label || "פגי תוקף",
          wasteFraction: parseFloat(itemWaste[id] || "1"),
          notes: itemNotes[id] || "",
        };
      });

      const res = await apiClient.post("/disposal/bulk-destroy", { items });
      const result = unwrapResponse(res);

      sonnerToast.success(`${result.processed} פריטים הושמדו בהצלחה`);
      if (result.failed?.length > 0) {
        sonnerToast.warning(`${result.failed.length} פריטים נכשלו`);
      }

      setSelectedItems(new Set());
      loadData();
    } catch (err) {
      toast({
        title: "שגיאה בהשמדה",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Usage (Dispense) handler
  const handleDispense = async () => {
    if (!selectedBatch) return;
    setSubmitting(true);
    try {
      await apiClient.post("/dispense", {
        clientRequestId: dispenseRequestId || crypto.randomUUID(),
        reagentId: selectedBatch.reagentId,
        batchId: selectedBatch.id,
        quantity: dispenseQuantity,
        purpose: dispensePurpose,
        notes: dispenseNotes,
      });
      sonnerToast.success("פריט הוצא מהמלאי בהצלחה");
      setDispenseDialogOpen(false);
      setSelectedBatch(null);
      setDispenseRequestId(null);
      setDispenseQuantity(1);
      setDispensePurpose("");
      setDispenseNotes("");
      loadData();
    } catch (err) {
      toast({
        title: "שגיאה בהוצאה",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Other removal handler
  const handleOtherRemoval = async () => {
    if (!otherBatch || !otherReason) return;
    setSubmitting(true);
    try {
      await apiClient.post("/dispense", {
        clientRequestId: crypto.randomUUID(),
        reagentId: otherBatch.reagentId,
        batchId: otherBatch.id,
        quantity: otherQuantity,
        purpose: otherReason,
        notes: otherNotes,
      });
      sonnerToast.success("פריט הוצא מהמלאי בהצלחה");
      setOtherDialogOpen(false);
      setOtherBatch(null);
      setOtherQuantity(1);
      setOtherReason("");
      setOtherNotes("");
      loadData();
    } catch (err) {
      toast({
        title: "שגיאה בהוצאה",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Filter batches for search
  const filteredBatches = useMemo(() => {
    if (!searchTerm.trim()) return batches;
    const term = searchTerm.toLowerCase();
    return batches.filter((b) => {
      const reagent = reagentMap[b.reagentId];
      return (
        (reagent?.name || "").toLowerCase().includes(term) ||
        (b.batchNumber || "").toLowerCase().includes(term) ||
        (reagent?.catalogNumber || "").toLowerCase().includes(term)
      );
    });
  }, [batches, searchTerm, reagentMap]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-teal-500" />
        <span className="ms-3 text-lg text-gray-600">טוען נתונים...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">הוצאה מהמלאי</h1>
            <p className="text-sm text-slate-500 mt-1">
              השמדה, שימוש, משלוח או הוצאה מסיבה אחרת
            </p>
          </div>
        </div>
      </div>

      {/* Barcode Scanner */}
      <div className="mb-6">
        <BarcodeScanner
          onScan={handleBarcodeScan}
          placeholder="סרוק ברקוד או הזן מספר אצווה..."
        />
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid grid-cols-4 w-full">
          {Object.entries(TAB_CONFIG).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <TabsTrigger
                key={key}
                value={key}
                className="gap-1.5 text-xs sm:text-sm"
              >
                <Icon
                  className={cn("h-4 w-4", activeTab === key && config.color)}
                />
                <span className="hidden sm:inline">{config.label}</span>
                <span className="sm:hidden">{config.label.split(" ")[0]}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* ═══ DESTRUCTION TAB ═══ */}
        <TabsContent value="destroy" className="space-y-4">
          <Card className="border-red-200">
            <CardHeader className="py-3 px-4 bg-red-50/50 rounded-t-xl">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-base font-semibold text-red-800">
                  <Trash2 className="h-5 w-5 me-2" />
                  פריטים להשמדה
                  <Badge
                    variant="outline"
                    className="ms-2 border-red-300 text-red-700"
                  >
                    {candidates.length} פריטים
                  </Badge>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSelectAll}
                    className="text-xs"
                  >
                    {selectedItems.size === candidates.length
                      ? "בטל בחירה"
                      : `בחר הכל (${candidates.length})`}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDestroy}
                    disabled={selectedItems.size === 0 || submitting}
                    className="gap-1"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    בצע השמדה ({selectedItems.size})
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {candidates.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-3" />
                  <p className="text-slate-500">
                    אין פריטים פגי תוקף או קרובים לתוקף
                  </p>
                </div>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <div className="space-y-0">
                    {candidates.map((candidate) => (
                      <div
                        key={candidate.id}
                        className={cn(
                          "p-4 border-b last:border-b-0 transition-colors",
                          candidate.isExpired ? "bg-red-50" : "bg-amber-50/50",
                          selectedItems.has(candidate.id) &&
                            "ring-1 ring-inset ring-red-300",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedItems.has(candidate.id)}
                            onCheckedChange={() =>
                              toggleSelectItem(candidate.id)
                            }
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="font-medium text-sm text-slate-900 truncate">
                                {candidate.reagentName}
                              </span>
                              {candidate.isExpired ? (
                                <Badge className="bg-red-100 text-red-700 border-red-300 text-[10px]">
                                  פג תוקף
                                </Badge>
                              ) : (
                                <Badge className="bg-amber-100 text-amber-700 border-amber-300 text-[10px]">
                                  קרוב לתוקף ({candidate.daysUntilExpiry} ימים)
                                </Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600">
                              <div>
                                <span className="text-slate-400">אצווה: </span>
                                <span className="font-mono">
                                  {candidate.batchNumber}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400">תוקף: </span>
                                {formatDate(candidate.expiryDate)}
                              </div>
                              <div>
                                <span className="text-slate-400">כמות: </span>
                                {candidate.currentQuantity} יח'
                              </div>
                              <div>
                                <span className="text-slate-400">קטלוג: </span>
                                <span className="font-mono">
                                  {candidate.catalogNumber || "-"}
                                </span>
                              </div>
                            </div>
                            {selectedItems.has(candidate.id) && (
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
                                <Select
                                  value={itemReasons[candidate.id] || ""}
                                  onValueChange={(v) =>
                                    setItemReasons((prev) => ({
                                      ...prev,
                                      [candidate.id]: v,
                                    }))
                                  }
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="סיבה" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {DESTRUCTION_REASONS.map((r) => (
                                      <SelectItem key={r.value} value={r.value}>
                                        {r.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Select
                                  value={itemWaste[candidate.id] || "1"}
                                  onValueChange={(v) =>
                                    setItemWaste((prev) => ({
                                      ...prev,
                                      [candidate.id]: v,
                                    }))
                                  }
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="אחוז בזבוז" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {WASTE_OPTIONS.map((w) => (
                                      <SelectItem key={w.value} value={w.value}>
                                        {w.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Input
                                  value={itemNotes[candidate.id] || ""}
                                  onChange={(e) =>
                                    setItemNotes((prev) => ({
                                      ...prev,
                                      [candidate.id]: e.target.value,
                                    }))
                                  }
                                  placeholder="הערות (אופציונלי)"
                                  className="h-8 text-xs"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ USAGE TAB ═══ */}
        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader className="py-3 px-4 bg-emerald-50/50 rounded-t-xl">
              <CardTitle className="flex items-center text-base font-semibold text-emerald-800">
                <Beaker className="h-5 w-5 me-2" />
                הוצאה לשימוש
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="חיפוש לפי שם ריאגנט, מספר אצווה או קטלוגי..."
                    className="ps-9"
                  />
                </div>
              </div>

              <ScrollArea className="max-h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">ריאגנט</TableHead>
                      <TableHead className="text-right">אצווה</TableHead>
                      <TableHead className="text-right">כמות</TableHead>
                      <TableHead className="text-right">תוקף</TableHead>
                      <TableHead className="text-right">פעולה</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBatches.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-8 text-slate-500"
                        >
                          {searchTerm ? "לא נמצאו תוצאות" : "אין אצוות פעילות"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBatches.slice(0, 50).map((batch) => {
                        const reagent = reagentMap[batch.reagentId];
                        return (
                          <TableRow
                            key={batch.id}
                            className="hover:bg-emerald-50/30"
                          >
                            <TableCell className="font-medium text-sm">
                              {reagent?.name || "-"}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {batch.batchNumber}
                            </TableCell>
                            <TableCell className="text-sm">
                              {batch.currentQuantity} יח'
                            </TableCell>
                            <TableCell className="text-xs">
                              {formatDate(batch.expiryDate)}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs gap-1 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                                onClick={() => {
                                  setSelectedBatch(batch);
                                  setDispenseRequestId(crypto.randomUUID());
                                  setDispenseDialogOpen(true);
                                }}
                              >
                                <Beaker className="h-3 w-3" />
                                הוצא
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>

              {/* Recent dispenses */}
              {recentDispenses.length > 0 && (
                <div className="mt-4 border-t pt-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">
                    הוצאות אחרונות
                  </h3>
                  <div className="space-y-1.5">
                    {recentDispenses.map((d, i) => (
                      <div
                        key={d.id || i}
                        className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2 rounded"
                      >
                        <span>
                          {d.reagent?.name || "-"} - אצווה{" "}
                          {d.batch?.batchNumber || "-"}
                        </span>
                        <span>
                          {d.quantity} יח' | {d.purpose || "-"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ SHIPMENT TAB ═══ */}
        <TabsContent value="shipment" className="space-y-4">
          <Card>
            <CardHeader className="py-3 px-4 bg-blue-50/50 rounded-t-xl">
              <CardTitle className="flex items-center text-base font-semibold text-blue-800">
                <Truck className="h-5 w-5 me-2" />
                משלוח / העברה
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-center">
              <Truck className="h-12 w-12 text-blue-300 mx-auto mb-3" />
              <p className="text-slate-600 mb-4">
                ליצירת משלוח חדש עם בחירת פריטים ויעד
              </p>
              <Link to={createPageUrl("NewShipment")}>
                <Button className="gap-2">
                  <Truck className="h-4 w-4" />
                  עבור ליצירת משלוח
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ OTHER TAB ═══ */}
        <TabsContent value="other" className="space-y-4">
          <Card>
            <CardHeader className="py-3 px-4 bg-slate-50/50 rounded-t-xl">
              <CardTitle className="flex items-center text-base font-semibold text-slate-800">
                <FileText className="h-5 w-5 me-2" />
                הוצאה מסיבה אחרת
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500 mb-4">
                הוצאה למחקר, העברה פנימית, או סיבה חריגה. סרוק ברקוד או חפש
                אצווה ידנית.
              </p>

              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="חיפוש אצווה..."
                    className="ps-9"
                  />
                </div>
              </div>

              <ScrollArea className="max-h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">ריאגנט</TableHead>
                      <TableHead className="text-right">אצווה</TableHead>
                      <TableHead className="text-right">כמות</TableHead>
                      <TableHead className="text-right">פעולה</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBatches.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center py-8 text-slate-500"
                        >
                          לא נמצאו אצוות
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBatches.slice(0, 30).map((batch) => {
                        const reagent = reagentMap[batch.reagentId];
                        return (
                          <TableRow
                            key={batch.id}
                            className="hover:bg-slate-50"
                          >
                            <TableCell className="font-medium text-sm">
                              {reagent?.name || "-"}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {batch.batchNumber}
                            </TableCell>
                            <TableCell className="text-sm">
                              {batch.currentQuantity} יח'
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs gap-1"
                                onClick={() => {
                                  setOtherBatch(batch);
                                  setOtherDialogOpen(true);
                                }}
                              >
                                <Package className="h-3 w-3" />
                                הוצא
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ═══ DISPENSE DIALOG (Usage tab) ═══ */}
      <Dialog open={dispenseDialogOpen} onOpenChange={setDispenseDialogOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Beaker className="h-5 w-5 text-emerald-600" />
              הוצאה לשימוש
            </DialogTitle>
          </DialogHeader>
          {selectedBatch && (
            <div className="space-y-4">
              <div className="bg-emerald-50 p-3 rounded-lg text-sm">
                <p className="font-medium">
                  {reagentMap[selectedBatch.reagentId]?.name || "-"}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  אצווה: {selectedBatch.batchNumber} | כמות זמינה:{" "}
                  {selectedBatch.currentQuantity} יח'
                </p>
              </div>
              <div>
                <Label className="text-sm">כמות להוצאה</Label>
                <Input
                  type="number"
                  min={1}
                  max={selectedBatch.currentQuantity}
                  value={dispenseQuantity}
                  onChange={(e) => setDispenseQuantity(Number(e.target.value))}
                  className="mt-1"
                />
                {dispenseQuantity >= selectedBatch.currentQuantity && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    הכמות תרוקן את האצווה
                  </p>
                )}
              </div>
              <div>
                <Label className="text-sm">מטרה</Label>
                <Input
                  value={dispensePurpose}
                  onChange={(e) => setDispensePurpose(e.target.value)}
                  placeholder="בדיקה, מעבדה, מחקר..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm">הערות</Label>
                <Textarea
                  value={dispenseNotes}
                  onChange={(e) => setDispenseNotes(e.target.value)}
                  placeholder="הערות נוספות..."
                  className="mt-1"
                  rows={2}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDispenseDialogOpen(false)}
            >
              ביטול
            </Button>
            <Button
              onClick={handleDispense}
              disabled={submitting || !selectedBatch || dispenseQuantity < 1}
              className="bg-emerald-600 hover:bg-emerald-700 gap-1"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              אשר הוצאה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ OTHER REMOVAL DIALOG ═══ */}
      <Dialog open={otherDialogOpen} onOpenChange={setOtherDialogOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-slate-600" />
              הוצאה מסיבה אחרת
            </DialogTitle>
          </DialogHeader>
          {otherBatch && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg text-sm">
                <p className="font-medium">
                  {reagentMap[otherBatch.reagentId]?.name || "-"}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  אצווה: {otherBatch.batchNumber} | כמות זמינה:{" "}
                  {otherBatch.currentQuantity} יח'
                </p>
              </div>
              <div>
                <Label className="text-sm">כמות להוצאה</Label>
                <Input
                  type="number"
                  min={1}
                  max={otherBatch.currentQuantity}
                  value={otherQuantity}
                  onChange={(e) => setOtherQuantity(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm">סיבת ההוצאה *</Label>
                <Input
                  value={otherReason}
                  onChange={(e) => setOtherReason(e.target.value)}
                  placeholder="מחקר, העברה פנימית, סיבה אחרת..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm">הערות</Label>
                <Textarea
                  value={otherNotes}
                  onChange={(e) => setOtherNotes(e.target.value)}
                  placeholder="פירוט נוסף..."
                  className="mt-1"
                  rows={2}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOtherDialogOpen(false)}>
              ביטול
            </Button>
            <Button
              onClick={handleOtherRemoval}
              disabled={
                submitting || !otherBatch || !otherReason || otherQuantity < 1
              }
              className="gap-1"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              אשר הוצאה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
