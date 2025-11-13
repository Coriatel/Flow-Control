
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Trash2,
  Save,
  Loader2,
  ListPlus,
  Package,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from "@/components/ui/use-toast";
import { createPageUrl } from '@/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import BackButton from '@/components/ui/BackButton';
import PrintDialog from '@/components/ui/PrintDialog';

import { Order } from '@/api/entities';
import { OrderItem } from '@/api/entities';
import { Reagent } from '@/api/entities';
import { getRelevantSuppliers } from "@/components/utils/supplierHelpers";

const generateOrderNumber = async () => {
    try {
        const orders = await Order.list('-created_date', 1);
        if (orders && orders.length > 0) {
            const lastNumMatch = orders[0].order_number_temp.match(/FC-OR-(\d+)$/);
            if (lastNumMatch) {
                const lastNum = parseInt(lastNumMatch[1], 10);
                return `FC-OR-${(lastNum + 1).toString().padStart(5, '0')}`;
            }
        }
        return `FC-OR-00001`;
    } catch (error) {
        const timestamp = Date.now().toString().slice(-5);
        return `FC-OR-${timestamp}`;
    }
};

export default function NewOrderPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [order, setOrder] = useState({
    order_number_temp: '',
    supplier_name_snapshot: '',
    order_date: format(new Date(), 'yyyy-MM-dd'),
    status: 'pending_sap_details',
    order_type: 'immediate_delivery',
    notes: ''
  });

  const [items, setItems] = useState([]); // This will now hold selected items with quantities
  const [allReagents, setAllReagents] = useState([]);
  const [filteredReagents, setFilteredReagents] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [reagentFilters, setReagentFilters] = useState({ searchTerm: '', category: 'all' });
  const [isDetailsCollapsed, setIsDetailsCollapsed] = useState(false);

  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState(null);

  const initOrderNumber = useCallback(async () => {
    setOrder(prev => ({ ...prev, order_number_temp: 'טוען...' }));
    const newOrderNum = await generateOrderNumber();
    setOrder(prev => ({ ...prev, order_number_temp: newOrderNum }));
  }, []);

  const fetchData = useCallback(async () => {
    try {
        const [reagentsData, suppliersData] = await Promise.all([
            Reagent.list(),
            getRelevantSuppliers('new_order')
        ]);
        setAllReagents(reagentsData.sort((a, b) => a.name.localeCompare(b.name)));
        setSuppliers(suppliersData);
    } catch (error) {
      toast({ title: "שגיאה בטעינת נתונים", description: "לא ניתן לטעון ספקים וריאגנטים", variant: "destructive" });
    }
  }, [toast]);
  
  useEffect(() => {
    initOrderNumber();
    fetchData();
  }, [initOrderNumber, fetchData]);

  useEffect(() => {
    let result = allReagents;

    if (order.supplier_name_snapshot) {
      result = result.filter(r => r.supplier === order.supplier_name_snapshot);
    } else {
      result = []; // Show no reagents if no supplier is selected
    }

    if (reagentFilters.searchTerm) {
      result = result.filter(r =>
        (r.name && r.name.toLowerCase().includes(reagentFilters.searchTerm.toLowerCase())) ||
        (r.catalog_number && r.catalog_number.toLowerCase().includes(reagentFilters.searchTerm.toLowerCase()))
      );
    }

    if (reagentFilters.category !== 'all') {
      result = result.filter(r => r.category === reagentFilters.category);
    }
    
    setFilteredReagents(result);
  }, [order.supplier_name_snapshot, reagentFilters, allReagents]);


  const validateForm = useCallback(() => {
    if (!order.supplier_name_snapshot) {
      toast({ title: "שגיאה", description: "יש לבחור ספק.", variant: "destructive" });
      return false;
    }
    if (items.filter(item => (item.quantity_ordered || 0) > 0).length === 0) {
      toast({ title: "שגיאה", description: "יש לבחור לפחות פריט אחד ולהזין כמות.", variant: "destructive" });
      return false;
    }
    return true;
  }, [order.supplier_name_snapshot, items, toast]);

  const handleSave = useCallback(async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const newOrder = await Order.create(order);
      const itemsToSave = items.filter(item => (item.quantity_ordered || 0) > 0);
      for (const item of itemsToSave) {
        await OrderItem.create({ ...item, order_id: newOrder.id });
      }
      toast({ title: "דרישת רכש נוצרה בהצלחה" });
      
      // Open print dialog
      setCreatedOrderId(newOrder.id);
      setShowPrintDialog(true);
    } catch (error) {
      toast({ title: "שגיאה בשמירת הדרישה", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [order, items, toast, validateForm]);

  const handlePrintDialogClose = () => {
    setShowPrintDialog(false);
    setCreatedOrderId(null);
    navigate(createPageUrl('Orders'));
  };

  const handleItemSelectionChange = (reagentId, isChecked) => {
    setItems(prev => {
        const existingItem = prev.find(item => item.reagent_id === reagentId);
        if (isChecked) {
            if (!existingItem) {
                const reagent = allReagents.find(r => r.id === reagentId);
                return [...prev, {
                    reagent_id: reagent.id,
                    reagent_name_snapshot: reagent.name,
                    reagent_catalog_number_snapshot: reagent.catalog_number,
                    quantity_ordered: 1, // Default quantity
                    ui_id: reagent.id,
                }];
            }
            return prev;
        } else {
            return prev.filter(item => item.reagent_id !== reagentId);
        }
    });
  };
  
  const handleQuantityChange = (reagentId, quantity) => {
    setItems(prev => {
      // If quantity > 0 and item doesn't exist, create it
      if (quantity > 0) {
        const existingItem = prev.find(item => item.reagent_id === reagentId);
        if (!existingItem) {
          const reagent = allReagents.find(r => r.id === reagentId);
          return [...prev, {
            reagent_id: reagent.id,
            reagent_name_snapshot: reagent.name,
            reagent_catalog_number_snapshot: reagent.catalog_number,
            quantity_ordered: quantity,
            ui_id: reagent.id,
          }];
        }
        // Update existing item
        return prev.map(item =>
          item.reagent_id === reagentId ? { ...item, quantity_ordered: quantity } : item
        );
      }
      // If quantity is 0 or negative, remove item
      return prev.filter(item => item.reagent_id !== reagentId);
    });
  };

  const handleReagentNameClick = (reagentId) => {
    const existingItem = items.find(item => item.reagent_id === reagentId);
    const isCurrentlySelected = !!existingItem && (existingItem.quantity_ordered || 0) > 0;

    if (isCurrentlySelected) {
      // Unselect it by setting quantity to 0, which will also remove it from the list of selected items.
      handleQuantityChange(reagentId, 0);
    } else {
      // Select it by setting quantity to 1.
      handleQuantityChange(reagentId, 1);
    }
  };
  
  const selectedItems = useMemo(() => items.filter(i => (i.quantity_ordered || 0) > 0), [items]);

  const availableCategories = useMemo(() => {
    const supplierReagents = allReagents.filter(r => r.supplier === order.supplier_name_snapshot);
    return [...new Set(supplierReagents.map(r => r.category).filter(Boolean))].sort();
  }, [allReagents, order.supplier_name_snapshot]);

  return (
    <>
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6" dir="rtl">
        {/* Page Header */}
        <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 sm:p-6 mb-4 shadow-sm border">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <BackButton />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800">הקמת דרישת רכש חדשה</h1>
                <p className="text-sm text-slate-500">בחר ספק, סנן את הפריטים הרצויים, הזן כמויות וצור את הדרישה.</p>
              </div>
            </div>
            <Button 
              onClick={handleSave} 
              disabled={saving} 
              className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg disabled:bg-amber-300"
            >
              {saving ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Save className="ml-2 h-4 w-4" />}
              צור דרישה ({selectedItems.length})
            </Button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto space-y-4">
          {/* Order Details Accordion */}
          <Accordion type="single" collapsible defaultValue="details" onValueChange={val => setIsDetailsCollapsed(!val)}>
              <AccordionItem value="details" className="bg-white/80 backdrop-blur-md border rounded-xl shadow-sm">
                  <AccordionTrigger className="p-4 text-lg font-semibold hover:no-underline">
                     <div className="flex items-center gap-2">
                          <Package className="h-5 w-5 text-amber-600" />
                          פרטי דרישה
                     </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="space-y-1.5">
                              <Label className="text-sm font-medium">מספר דרישה (מערכת)</Label>
                              <Input value={order.order_number_temp} disabled className="font-mono bg-slate-100" />
                          </div>
                          <div className="space-y-1.5">
                              <Label htmlFor="order_date" className="text-sm font-medium">תאריך</Label>
                              <Input id="order_date" type="date" value={order.order_date} onChange={(e) => setOrder({...order, order_date: e.target.value})} />
                          </div>
                          <div className="space-y-1.5">
                              <Label htmlFor="supplier" className="text-sm font-medium">ספק *</Label>
                              <Select value={order.supplier_name_snapshot} onValueChange={(v) => {setOrder({...order, supplier_name_snapshot: v}); setItems([]); setReagentFilters({searchTerm: '', category: 'all'}); }}>
                                  <SelectTrigger id="supplier"><SelectValue placeholder="בחר ספק" /></SelectTrigger>
                                  <SelectContent>
                                    {suppliers.map(s => <SelectItem key={s.id} value={s.name}>{s.display_name || s.name}</SelectItem>)}
                                  </SelectContent>
                              </Select>
                          </div>
                          <div className="space-y-1.5">
                              <Label htmlFor="order_type" className="text-sm font-medium">סוג הזמנה *</Label>
                              <Select value={order.order_type} onValueChange={(v) => setOrder({...order, order_type: v})}>
                                  <SelectTrigger id="order_type"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="immediate_delivery">לאספקה מיידית</SelectItem>
                                      <SelectItem value="framework">הזמנת מסגרת</SelectItem>
                                  </SelectContent>
                              </Select>
                          </div>
                          <div className="space-y-1.5 md:col-span-2 lg:col-span-4">
                              <Label htmlFor="notes" className="text-sm font-medium">הערות</Label>
                              <Textarea id="notes" placeholder="הערות כלליות לדרישה" value={order.notes} onChange={(e) => setOrder({...order, notes: e.target.value})} className="resize-none" rows={2}/>
                          </div>
                      </div>
                  </AccordionContent>
              </AccordionItem>
          </Accordion>

          {/* Reagents Selection */}
          <Card className="glassmorphism border-white/20 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ListPlus className="h-5 w-5 text-amber-600" />
                    בחירת פריטים
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {order.supplier_name_snapshot ? `מוצגים ${filteredReagents.length} פריטים עבור ספק: ${order.supplier_name_snapshot}` : 'נא לבחור ספק כדי להציג פריטים.'}
                  </CardDescription>
                </div>
              </div>
              
              {/* Filters */}
              {order.supplier_name_snapshot && (
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="חיפוש לפי שם או מק״ט..." 
                      value={reagentFilters.searchTerm}
                      onChange={e => setReagentFilters(f => ({...f, searchTerm: e.target.value}))} 
                      className="pr-10 bg-white/50"
                    />
                  </div>
                  <Select value={reagentFilters.category} onValueChange={v => setReagentFilters(f => ({...f, category: v}))}>
                    <SelectTrigger className="w-full sm:w-48 bg-white/50">
                      <SelectValue placeholder="כל הקטגוריות" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">כל הקטגוריות</SelectItem>
                      {availableCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardHeader>
            
            <CardContent>
              {order.supplier_name_snapshot ? (
                <div className="border rounded-lg overflow-hidden max-h-[60vh]">
                  <ScrollArea className="h-full">
                    <div className="divide-y divide-slate-200">
                      {filteredReagents.length > 0 ? (
                        filteredReagents.map((reagent) => {
                          const currentItem = items.find(i => i.reagent_id === reagent.id);
                          const isSelected = !!currentItem && (currentItem.quantity_ordered || 0) > 0;
                          
                          return (
                            <div
                              key={reagent.id}
                              className={`flex items-center justify-between p-3 transition-colors ${
                                isSelected ? 'bg-amber-50' : 'bg-white hover:bg-slate-50'
                              }`}
                            >
                              <button
                                onClick={() => handleReagentNameClick(reagent.id)}
                                className="flex-1 flex flex-col text-right pr-2 sm:pr-4"
                              >
                                <span
                                  className={`font-medium ${
                                    isSelected ? 'text-amber-700 font-semibold' : 'text-slate-800'
                                  }`}
                                >
                                  {reagent.name}
                                </span>
                                <span className="text-xs text-slate-500">{reagent.catalog_number}</span>
                              </button>
                              
                              <div className="w-24">
                                <Input 
                                  type="number" 
                                  min="0" 
                                  value={currentItem?.quantity_ordered || ''}
                                  onChange={(e) => {
                                    const quantity = parseInt(e.target.value, 10) || 0;
                                    handleQuantityChange(reagent.id, quantity);
                                  }}
                                  onClick={e => e.target.select()}
                                  className="text-center h-9 text-base"
                                  placeholder="0"
                                />
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-8 text-center text-slate-500">
                          לא נמצאו פריטים התואמים לסינון
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500">
                  נא לבחור ספק כדי להציג פריטים
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selected Items Summary */}
          {selectedItems.length > 0 && (
            <Card className="glassmorphism border-white/20 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5 text-green-600" />
                  פריטים נבחרים ({selectedItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedItems.map((item) => (
                    <div key={item.reagent_id} className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                      <div>
                        <div className="font-medium">{item.reagent_name_snapshot}</div>
                        <div className="text-sm text-slate-600">{item.reagent_catalog_number_snapshot}</div>
                      </div>
                      <Badge className="bg-amber-100 text-amber-800">
                        כמות: {item.quantity_ordered}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <PrintDialog
        isOpen={showPrintDialog}
        onClose={handlePrintDialogClose}
        documentId={createdOrderId}
        documentType="order"
        title="דרישת רכש"
      />
    </>
  );
}
