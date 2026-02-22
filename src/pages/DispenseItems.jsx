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
  Loader2, Search, ScanLine, Package, ArrowDownToLine, AlertTriangle, CheckCircle2, History
} from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { he } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import BarcodeScanner from '@/components/ui/BarcodeScanner';

import { Reagent, ReagentBatch, Supplier } from '@/api/entities';
import { apiClient } from '@/api/client';

function unwrapResponse(response) {
  if (response && typeof response === 'object' && response.success && 'data' in response) {
    return response.data;
  }
  return response;
}

export default function DispenseItems() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState([]);
  const [reagents, setReagents] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [dispensing, setDispensing] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [dispenseQuantity, setDispenseQuantity] = useState(1);
  const [dispensePurpose, setDispensPurpose] = useState('');
  const [dispenseNotes, setDispenseNotes] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [recentDispenses, setRecentDispenses] = useState([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [batchData, reagentData, supplierData, historyRes] = await Promise.all([
        ReagentBatch.list({ status: 'ACTIVE' }),
        Reagent.list(),
        Supplier.list(),
        apiClient.get('/dispense/history?limit=10'),
      ]);
      setBatches(Array.isArray(batchData) ? batchData : []);
      setReagents(Array.isArray(reagentData) ? reagentData : []);
      setSuppliers(Array.isArray(supplierData) ? supplierData : []);
      const history = unwrapResponse(historyRes);
      setRecentDispenses(Array.isArray(history) ? history : []);
    } catch (err) {
      toast({ title: "שגיאה בטעינת נתונים", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadData(); }, [loadData]);

  // Build lookup maps
  const reagentMap = React.useMemo(() => {
    const map = {};
    reagents.forEach(r => { map[r.id] = r; });
    return map;
  }, [reagents]);

  const supplierMap = React.useMemo(() => {
    const map = {};
    suppliers.forEach(s => { map[s.id] = s; });
    return map;
  }, [suppliers]);

  // Get unique categories
  const categories = React.useMemo(() => {
    const cats = new Set();
    reagents.forEach(r => { if (r.category) cats.add(r.category); });
    return Array.from(cats).sort();
  }, [reagents]);

  // Filter batches
  const filteredBatches = React.useMemo(() => {
    return batches.filter(batch => {
      const reagent = reagentMap[batch.reagentId];
      if (!reagent) return false;
      if (batch.currentQuantity <= 0) return false;

      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const match = (
          reagent.name?.toLowerCase().includes(term) ||
          reagent.catalogNumber?.toLowerCase().includes(term) ||
          batch.batchNumber?.toLowerCase().includes(term) ||
          batch.lotNumber?.toLowerCase().includes(term)
        );
        if (!match) return false;
      }

      // Supplier filter
      if (filterSupplier !== 'all' && reagent.supplierId !== filterSupplier) return false;

      // Category filter
      if (filterCategory !== 'all' && reagent.category !== filterCategory) return false;

      return true;
    });
  }, [batches, reagentMap, searchTerm, filterSupplier, filterCategory]);

  // Handle barcode scan
  const handleScan = async (rawData) => {
    try {
      const response = await apiClient.post('/barcode/parse', { rawData });
      const parsed = unwrapResponse(response);
      setScanResult(parsed);

      // Try to find matching batch
      if (parsed.lotNumber) {
        const match = batches.find(b =>
          b.batchNumber === parsed.lotNumber || b.lotNumber === parsed.lotNumber
        );
        if (match) {
          setSelectedBatch(match);
          setDispenseQuantity(1);
          toast({ title: "אצווה נמצאה!", description: `${reagentMap[match.reagentId]?.name} - ${match.batchNumber}` });
          return;
        }
      }

      toast({
        title: "ברקוד נקרא",
        description: parsed.lotNumber
          ? `מספר אצווה: ${parsed.lotNumber} - לא נמצאה אצווה תואמת`
          : "לא ניתן לזהות מספר אצווה מהברקוד",
        variant: parsed.lotNumber ? "default" : "destructive"
      });
    } catch (err) {
      toast({ title: "שגיאה בקריאת ברקוד", description: err.message, variant: "destructive" });
    }
  };

  // Handle dispense
  const handleDispense = async () => {
    if (!selectedBatch) return;

    try {
      setDispensing(true);
      const reagent = reagentMap[selectedBatch.reagentId];

      await apiClient.post('/dispense', {
        reagentId: selectedBatch.reagentId,
        batchId: selectedBatch.id,
        quantity: dispenseQuantity,
        scanMethod: scanResult ? 'BARCODE' : 'MANUAL',
        rawScanData: scanResult ? JSON.stringify(scanResult) : undefined,
        purpose: dispensePurpose || undefined,
        notes: dispenseNotes || undefined,
      });

      toast({
        title: "הוצאה מהמלאי בוצעה בהצלחה",
        description: `${reagent?.name} - אצווה ${selectedBatch.batchNumber} - כמות: ${dispenseQuantity}`,
      });

      setSelectedBatch(null);
      setDispenseQuantity(1);
      setDispensPurpose('');
      setDispenseNotes('');
      setScanResult(null);
      loadData();
    } catch (err) {
      toast({ title: "שגיאה בהוצאה מהמלאי", description: err.message, variant: "destructive" });
    } finally {
      setDispensing(false);
    }
  };

  const getExpiryBadge = (expiryDate) => {
    if (!expiryDate) return null;
    const date = typeof expiryDate === 'string' ? parseISO(expiryDate) : new Date(expiryDate);
    const days = differenceInDays(date, new Date());
    if (days < 0) return <Badge variant="destructive">פג תוקף</Badge>;
    if (days <= 30) return <Badge className="bg-red-100 text-red-800 border-red-200">{days} ימים</Badge>;
    if (days <= 90) return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">{days} ימים</Badge>;
    return <Badge className="bg-green-100 text-green-800 border-green-200">{days} ימים</Badge>;
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
            <h1 className="text-2xl font-bold text-gray-900">הוצאה מהמלאי</h1>
            <p className="text-sm text-muted-foreground">סרוק ברקוד או חפש פריט להוצאה</p>
          </div>
        </div>
        <Badge variant="outline" className="text-sm">
          <Package className="h-4 w-4 ml-1" />
          {filteredBatches.length} אצוות זמינות
        </Badge>
      </div>

      {/* Barcode Scanner */}
      <BarcodeScanner
        onScan={handleScan}
        onError={(err) => console.error('Scan error:', err)}
        allowManual={true}
        placeholder="הזן מספר אצווה או נתוני ברקוד..."
      />

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="חפש לפי שם, מספר קטלוגי, מספר אצווה..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-9"
              />
            </div>
            <Select value={filterSupplier} onValueChange={setFilterSupplier}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="כל הספקים" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הספקים</SelectItem>
                {suppliers.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="כל הקטגוריות" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הקטגוריות</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Available Batches Table */}
      <Card>
        <CardContent className="p-0">
          <div className="max-h-[400px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow>
                  <TableHead className="text-right">ריאגנט</TableHead>
                  <TableHead className="text-right">ספק</TableHead>
                  <TableHead className="text-right">מספר אצווה</TableHead>
                  <TableHead className="text-center">כמות זמינה</TableHead>
                  <TableHead className="text-center">תפוגה</TableHead>
                  <TableHead className="text-center">פעולה</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBatches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'לא נמצאו תוצאות' : 'אין אצוות זמינות'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBatches.map(batch => {
                    const reagent = reagentMap[batch.reagentId];
                    const supplier = reagent ? supplierMap[reagent.supplierId] : null;
                    return (
                      <TableRow key={batch.id} className="hover:bg-blue-50/50 cursor-pointer"
                        onClick={() => { setSelectedBatch(batch); setDispenseQuantity(1); }}>
                        <TableCell className="font-medium">
                          {reagent?.name || 'לא ידוע'}
                          {reagent?.catalogNumber && (
                            <span className="text-xs text-muted-foreground block">{reagent.catalogNumber}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{supplier?.name || '-'}</TableCell>
                        <TableCell className="text-sm font-mono">{batch.batchNumber || batch.lotNumber}</TableCell>
                        <TableCell className="text-center font-semibold">{batch.currentQuantity}</TableCell>
                        <TableCell className="text-center">
                          {batch.expiryDate && (
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-xs">
                                {format(new Date(batch.expiryDate), 'dd/MM/yyyy')}
                              </span>
                              {getExpiryBadge(batch.expiryDate)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBatch(batch);
                              setDispenseQuantity(1);
                            }}
                          >
                            <ArrowDownToLine className="h-3.5 w-3.5" />
                            הוצא
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Dispenses */}
      {recentDispenses.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <History className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium text-sm">הוצאות אחרונות</h3>
            </div>
            <div className="space-y-2">
              {recentDispenses.slice(0, 5).map(event => (
                <div key={event.id} className="flex items-center justify-between text-sm bg-gray-50 rounded px-3 py-2">
                  <div>
                    <span className="font-medium">{event.reagent?.name || 'ריאגנט'}</span>
                    <span className="text-muted-foreground mr-2">אצווה {event.batch?.batchNumber}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">כמות: {event.quantity}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {event.dispensedAt && format(new Date(event.dispensedAt), 'dd/MM HH:mm', { locale: he })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dispense Confirmation Dialog */}
      <Dialog open={!!selectedBatch} onOpenChange={(open) => { if (!open) setSelectedBatch(null); }}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">אישור הוצאה מהמלאי</DialogTitle>
          </DialogHeader>
          {selectedBatch && (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-3 space-y-1">
                <p className="font-semibold">{reagentMap[selectedBatch.reagentId]?.name}</p>
                <p className="text-sm text-muted-foreground">
                  אצווה: {selectedBatch.batchNumber} | זמין: {selectedBatch.currentQuantity}
                </p>
                {selectedBatch.expiryDate && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs">תפוגה: {format(new Date(selectedBatch.expiryDate), 'dd/MM/yyyy')}</span>
                    {getExpiryBadge(selectedBatch.expiryDate)}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <Label>כמות להוצאה</Label>
                  <Input
                    type="number"
                    min={1}
                    max={selectedBatch.currentQuantity}
                    value={dispenseQuantity}
                    onChange={(e) => setDispenseQuantity(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>מטרת השימוש (אופציונלי)</Label>
                  <Input
                    value={dispensePurpose}
                    onChange={(e) => setDispensPurpose(e.target.value)}
                    placeholder="לדוגמה: שימוש שוטף, בדיקות..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>הערות (אופציונלי)</Label>
                  <Input
                    value={dispenseNotes}
                    onChange={(e) => setDispenseNotes(e.target.value)}
                    placeholder="הערות נוספות..."
                    className="mt-1"
                  />
                </div>
              </div>

              {dispenseQuantity === selectedBatch.currentQuantity && (
                <div className="flex items-center gap-2 bg-yellow-50 text-yellow-800 rounded p-2 text-sm">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span>כמות זו תרוקן את כל המלאי באצווה. האצווה תעבור לסטטוס "בשימוש".</span>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setSelectedBatch(null)}>ביטול</Button>
            <Button
              onClick={handleDispense}
              disabled={dispensing || !dispenseQuantity || dispenseQuantity <= 0 || dispenseQuantity > selectedBatch?.currentQuantity}
              className="gap-1"
            >
              {dispensing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              אשר הוצאה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
