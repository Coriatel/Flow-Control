import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import BackButton from '@/components/ui/BackButton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Loader2, Search, Package, AlertTriangle, Trash2, RotateCcw, Clock, FlaskConical
} from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { he } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from '@/api/client';

function unwrapResponse(response) {
  if (response && typeof response === 'object' && response.success && 'data' in response) {
    return response.data;
  }
  return response;
}

const DISPOSAL_REASONS = [
  { value: 'EXPIRED_IN_USE', label: 'פג תוקף בזמן שימוש' },
  { value: 'CONTAMINATED', label: 'מזוהם' },
  { value: 'DAMAGED', label: 'ניזוק' },
  { value: 'OTHER', label: 'אחר' },
];

const PORTION_OPTIONS = [
  { value: 0.25, label: 'רבע (25%)' },
  { value: 0.50, label: 'חצי (50%)' },
  { value: 0.75, label: 'שלושה רבעים (75%)' },
  { value: 1.00, label: 'מלא (100%)' },
];

export default function ItemsInUse() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterExpiry, setFilterExpiry] = useState('all'); // all, expired, expiring_soon, ok

  // Disposal dialog state
  const [disposalBatch, setDisposalBatch] = useState(null);
  const [disposalPortion, setDisposalPortion] = useState(0.25);
  const [disposalReason, setDisposalReason] = useState('');
  const [disposalNotes, setDisposalNotes] = useState('');
  const [submittingDisposal, setSubmittingDisposal] = useState(false);

  // Return dialog state
  const [returnBatch, setReturnBatch] = useState(null);
  const [submittingReturn, setSubmittingReturn] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/dispense/in-use');
      const data = unwrapResponse(response);
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      toast({ title: "שגיאה בטעינת נתונים", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadData(); }, [loadData]);

  // Statistics
  const stats = React.useMemo(() => {
    const expired = items.filter(i => i.isExpired).length;
    const expiringSoon = items.filter(i => !i.isExpired && i.daysUntilExpiry <= 30).length;
    const ok = items.filter(i => !i.isExpired && i.daysUntilExpiry > 30).length;
    return { total: items.length, expired, expiringSoon, ok };
  }, [items]);

  // Filter items
  const filteredItems = React.useMemo(() => {
    return items.filter(item => {
      // Search
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const match = (
          item.reagent?.name?.toLowerCase().includes(term) ||
          item.batchNumber?.toLowerCase().includes(term) ||
          item.reagent?.catalogNumber?.toLowerCase().includes(term)
        );
        if (!match) return false;
      }

      // Expiry filter
      if (filterExpiry === 'expired' && !item.isExpired) return false;
      if (filterExpiry === 'expiring_soon' && (item.isExpired || item.daysUntilExpiry > 30)) return false;
      if (filterExpiry === 'ok' && (item.isExpired || item.daysUntilExpiry <= 30)) return false;

      return true;
    });
  }, [items, searchTerm, filterExpiry]);

  // Handle partial disposal
  const handleDisposal = async () => {
    if (!disposalBatch || !disposalReason) return;

    try {
      setSubmittingDisposal(true);
      await apiClient.post('/disposal/partial', {
        batchId: disposalBatch.id,
        portionDisposed: disposalPortion,
        reason: disposalReason,
        notes: disposalNotes || undefined,
      });

      const portionLabel = PORTION_OPTIONS.find(p => p.value === disposalPortion)?.label || '';
      toast({
        title: "השלכה נרשמה בהצלחה",
        description: `${disposalBatch.reagent?.name} - ${portionLabel}`,
      });

      setDisposalBatch(null);
      setDisposalPortion(0.25);
      setDisposalReason('');
      setDisposalNotes('');
      loadData();
    } catch (err) {
      toast({ title: "שגיאה ברישום השלכה", description: err.message, variant: "destructive" });
    } finally {
      setSubmittingDisposal(false);
    }
  };

  // Handle return to inventory
  const handleReturn = async () => {
    if (!returnBatch) return;

    try {
      setSubmittingReturn(true);
      await apiClient.post(`/dispense/${returnBatch.id}/return`);

      toast({
        title: "הוחזר למלאי",
        description: `${returnBatch.reagent?.name} - אצווה ${returnBatch.batchNumber}`,
      });

      setReturnBatch(null);
      loadData();
    } catch (err) {
      toast({ title: "שגיאה בהחזרה למלאי", description: err.message, variant: "destructive" });
    } finally {
      setSubmittingReturn(false);
    }
  };

  const getExpiryStyle = (item) => {
    if (item.isExpired) return 'bg-red-50 border-red-200';
    if (item.daysUntilExpiry <= 7) return 'bg-red-50/50 border-red-100';
    if (item.daysUntilExpiry <= 30) return 'bg-yellow-50 border-yellow-100';
    return '';
  };

  const getExpiryBadge = (item) => {
    if (item.isExpired) return <Badge variant="destructive">פג תוקף!</Badge>;
    if (item.daysUntilExpiry <= 7) return <Badge className="bg-red-100 text-red-800 border-red-200">{item.daysUntilExpiry} ימים</Badge>;
    if (item.daysUntilExpiry <= 30) return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">{item.daysUntilExpiry} ימים</Badge>;
    return <Badge className="bg-green-100 text-green-800 border-green-200">{item.daysUntilExpiry} ימים</Badge>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">פריטים בשימוש</h1>
            <p className="text-sm text-muted-foreground">פריטים שהוצאו מהמלאי ונמצאים כרגע בשימוש</p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="cursor-pointer hover:shadow-md" onClick={() => setFilterExpiry('all')}>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs text-muted-foreground">סה"כ בשימוש</div>
          </CardContent>
        </Card>
        <Card className={cn("cursor-pointer hover:shadow-md", stats.expired > 0 && "border-red-300 bg-red-50")}
          onClick={() => setFilterExpiry('expired')}>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
            <div className="text-xs text-red-700">פגי תוקף!</div>
          </CardContent>
        </Card>
        <Card className={cn("cursor-pointer hover:shadow-md", stats.expiringSoon > 0 && "border-yellow-300 bg-yellow-50")}
          onClick={() => setFilterExpiry('expiring_soon')}>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.expiringSoon}</div>
            <div className="text-xs text-yellow-700">עומדים לפוג (30 יום)</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md" onClick={() => setFilterExpiry('ok')}>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.ok}</div>
            <div className="text-xs text-green-700">תקינים</div>
          </CardContent>
        </Card>
      </div>

      {/* Expired Alert Banner */}
      {stats.expired > 0 && (
        <div className="flex items-center gap-3 bg-red-100 border border-red-300 rounded-lg p-3">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-800">
              {stats.expired} פריטים בשימוש פגי תוקף!
            </p>
            <p className="text-sm text-red-700">יש להפסיק להשתמש בפריטים אלו ולרשום השלכה.</p>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="חפש לפי שם, מספר אצווה..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-9"
          />
        </div>
        <Select value={filterExpiry} onValueChange={setFilterExpiry}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הפריטים</SelectItem>
            <SelectItem value="expired">פגי תוקף בלבד</SelectItem>
            <SelectItem value="expiring_soon">עומדים לפוג (30 יום)</SelectItem>
            <SelectItem value="ok">תקינים</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Items Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">ריאגנט</TableHead>
                  <TableHead className="text-right">ספק</TableHead>
                  <TableHead className="text-right">מספר אצווה</TableHead>
                  <TableHead className="text-center">תאריך תפוגה</TableHead>
                  <TableHead className="text-center">זמן לתפוגה</TableHead>
                  <TableHead className="text-center">תאריך הוצאה</TableHead>
                  <TableHead className="text-center">כמות שהוצאה</TableHead>
                  <TableHead className="text-center">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      <FlaskConical className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p>{items.length === 0 ? 'אין פריטים בשימוש כרגע' : 'לא נמצאו תוצאות'}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map(item => (
                    <TableRow key={item.id} className={cn(getExpiryStyle(item))}>
                      <TableCell className="font-medium">
                        {item.reagent?.name || 'לא ידוע'}
                        {item.reagent?.catalogNumber && (
                          <span className="text-xs text-muted-foreground block">{item.reagent.catalogNumber}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{item.reagent?.supplier?.name || '-'}</TableCell>
                      <TableCell className="text-sm font-mono">{item.batchNumber}</TableCell>
                      <TableCell className="text-center text-sm">
                        {item.expiryDate ? format(new Date(item.expiryDate), 'dd/MM/yyyy') : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {getExpiryBadge(item)}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {item.dispensedAt ? format(new Date(item.dispensedAt), 'dd/MM HH:mm', { locale: he }) : '-'}
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {item.dispensedQuantity || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setDisposalBatch(item);
                              setDisposalReason(item.isExpired ? 'EXPIRED_IN_USE' : '');
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                            השלכה
                          </Button>
                          {user?.role === 'ADMIN' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 gap-1"
                              onClick={() => setReturnBatch(item)}
                            >
                              <RotateCcw className="h-3 w-3" />
                              החזר
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Partial Disposal Dialog */}
      <Dialog open={!!disposalBatch} onOpenChange={(open) => { if (!open) setDisposalBatch(null); }}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">רישום השלכה חלקית</DialogTitle>
          </DialogHeader>
          {disposalBatch && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                <p className="font-semibold">{disposalBatch.reagent?.name}</p>
                <p className="text-sm text-muted-foreground">
                  אצווה: {disposalBatch.batchNumber}
                </p>
                {disposalBatch.isExpired && (
                  <Badge variant="destructive" className="mt-1">פג תוקף</Badge>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <Label>כמה הושלך?</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {PORTION_OPTIONS.map(option => (
                      <Button
                        key={option.value}
                        variant={disposalPortion === option.value ? 'default' : 'outline'}
                        size="sm"
                        className="w-full"
                        onClick={() => setDisposalPortion(option.value)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>סיבת ההשלכה</Label>
                  <Select value={disposalReason} onValueChange={setDisposalReason}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="בחר סיבה..." />
                    </SelectTrigger>
                    <SelectContent>
                      {DISPOSAL_REASONS.map(r => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>הערות (אופציונלי)</Label>
                  <Input
                    value={disposalNotes}
                    onChange={(e) => setDisposalNotes(e.target.value)}
                    placeholder="פרטים נוספים..."
                    className="mt-1"
                  />
                </div>

                {disposalPortion === 1.0 && (
                  <div className="flex items-center gap-2 bg-yellow-50 text-yellow-800 rounded p-2 text-sm">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    <span>השלכה מלאה - הפריט יסומן כ"הושמד"</span>
                  </div>
                )}

                {disposalBatch.dispensedQuantity && (
                  <div className="bg-blue-50 rounded p-2 text-sm">
                    <p>כמות שהוצאה: <strong>{disposalBatch.dispensedQuantity}</strong></p>
                    <p>
                      בזבוז: <strong>{(disposalBatch.dispensedQuantity * disposalPortion).toFixed(2)}</strong>
                      {' | '}
                      צריכה בפועל: <strong>{(disposalBatch.dispensedQuantity * (1 - disposalPortion)).toFixed(2)}</strong>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDisposalBatch(null)}>ביטול</Button>
            <Button
              onClick={handleDisposal}
              disabled={submittingDisposal || !disposalReason}
              variant="destructive"
              className="gap-1"
            >
              {submittingDisposal ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              רשום השלכה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return to Inventory Dialog (Admin only) */}
      <Dialog open={!!returnBatch} onOpenChange={(open) => { if (!open) setReturnBatch(null); }}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">החזרה למלאי</DialogTitle>
          </DialogHeader>
          {returnBatch && (
            <div className="space-y-4">
              <p>האם להחזיר את הפריט הבא למלאי?</p>
              <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                <p className="font-semibold">{returnBatch.reagent?.name}</p>
                <p className="text-sm text-muted-foreground">אצווה: {returnBatch.batchNumber}</p>
              </div>
              <div className="flex items-center gap-2 bg-blue-50 text-blue-800 rounded p-2 text-sm">
                <RotateCcw className="h-4 w-4 flex-shrink-0" />
                <span>הפריט יחזור לסטטוס "פעיל" במלאי</span>
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setReturnBatch(null)}>ביטול</Button>
            <Button
              onClick={handleReturn}
              disabled={submittingReturn}
              className="gap-1"
            >
              {submittingReturn ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
              החזר למלאי
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
