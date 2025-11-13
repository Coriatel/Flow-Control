
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, Send, Loader2 } from 'lucide-react'; // Removed ArrowLeft
import { format } from 'date-fns';
import { useToast } from "@/components/ui/use-toast";
import { createPageUrl } from '@/utils';
import { Badge } from "@/components/ui/badge";

import { Order } from '@/api/entities';
import { OrderItem } from '@/api/entities';
import { WithdrawalRequest } from '@/api/entities';
import { WithdrawalItem } from '@/api/entities';
import { User } from '@/api/entities';
import WithdrawalItemRow from '../components/withdrawal/WithdrawalItemRow';
import BackButton from '@/components/ui/BackButton'; // Added import
import PrintDialog from '@/components/ui/PrintDialog'; // Added import

export default function NewWithdrawalRequestPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [withdrawalForm, setWithdrawalForm] = useState({
    withdrawal_number: '',
    framework_order_id: '',
    request_date: format(new Date(), 'yyyy-MM-dd'),
    requested_delivery_date: '',
    urgency_level: 'routine',
    requester_notes: '',
    contact_person_delivery: ''
  });

  const [frameworkOrders, setFrameworkOrders] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  
  const [savingRequest, setSavingRequest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showPrintDialog, setShowPrintDialog] = useState(false); // Added state
  const [createdWithdrawalId, setCreatedWithdrawalId] = useState(null); // Added state

  // Using ref to store raw data to avoid state-related re-renders and loops
  const allFrameworkOrderItemsRef = useRef([]);

  const urgencyLevels = {
    "routine": "שגרתי", "urgent": "דחוף", "emergency": "חירום"
  };

  const generateWithdrawalNumber = () => {
    const today = format(new Date(), 'yyyyMMdd');
    const randomSuffix = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `WD-${today}-${randomSuffix}`;
  };

  useEffect(() => {
    setWithdrawalForm(prev => ({
      ...prev,
      withdrawal_number: generateWithdrawalNumber()
    }));
  }, []);

  const handleFrameworkOrderChange = useCallback((orderId) => {
    const selectedOrder = frameworkOrders.find(order => order.id === orderId);
    if (!selectedOrder) return;
    
    setWithdrawalForm(prev => ({ ...prev, framework_order_id: orderId }));
    
    const orderItems = allFrameworkOrderItemsRef.current.filter(item => item.order_id === orderId);
    
    const itemsWithQuantities = (orderItems || [])
        .filter(item => {
            const isUsableStatus = ['open', 'partially_received', 'approved'].includes(item.line_status);
            const remaining = (item.quantity_ordered || 0) - (item.quantity_received || 0);
            return isUsableStatus && remaining > 0;
        })
        .map(item => ({
          ...item,
          requested_quantity: 0,
          max_quantity: (item.quantity_ordered || 0) - (item.quantity_received || 0),
          is_prefilled: false,
        }));
    
    setAvailableItems(itemsWithQuantities);
  }, [frameworkOrders]);

  useEffect(() => {
    const initializePage = async () => {
      setLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams(location.search);
        const source = queryParams.get('source');
        const prefilledFrameworkOrderId = queryParams.get('framework_order_id');
        const prefilledItemsRaw = queryParams.get('items');
        let prefilledItemsData = [];
        if (prefilledItemsRaw) {
          try {
            prefilledItemsData = JSON.parse(decodeURIComponent(prefilledItemsRaw));
          } catch (e) {
            console.error("Failed to parse prefilled items:", e);
          }
        }
        
        // Step 1: Fetch all raw data once
        const [allOrders, allItems] = await Promise.all([
          Order.filter({ order_type: 'framework', status: { $in: ['approved', 'partially_received'] } }),
          OrderItem.list()
        ]);
        
        setFrameworkOrders(allOrders);
        allFrameworkOrderItemsRef.current = allItems;
        
        // Step 2: Process prefilled data if it exists
        if (source === 'inventory_replenishment' && prefilledFrameworkOrderId && prefilledItemsData.length > 0) {
          const selectedOrder = allOrders.find(o => o.id === prefilledFrameworkOrderId);
          if (selectedOrder) {
            setWithdrawalForm(prev => ({ ...prev, framework_order_id: prefilledFrameworkOrderId }));

            const orderItems = allItems.filter(item => item.order_id === prefilledFrameworkOrderId);
            const itemsWithQuantities = (orderItems || [])
              .filter(item => {
                  const isUsableStatus = ['open', 'partially_received', 'approved'].includes(item.line_status);
                  const remaining = (item.quantity_ordered || 0) - (item.quantity_received || 0);
                  return isUsableStatus && remaining > 0;
              })
              .map(item => {
                  const matchingPrefilled = prefilledItemsData.find(p => p.reagent_id === item.reagent_id);
                  const maxQuantity = (item.quantity_ordered || 0) - (item.quantity_received || 0);
                  const requestedQuantity = matchingPrefilled ? Math.min(matchingPrefilled.quantity || 0, maxQuantity) : 0;
                  
                  return {
                    ...item,
                    requested_quantity: requestedQuantity,
                    max_quantity: maxQuantity,
                    is_prefilled: !!matchingPrefilled
                  };
              });
            
            setAvailableItems(itemsWithQuantities);
          } else {
            toast({ title: "שגיאה", description: "הזמנת המסגרת שצוינה לא נמצאה או שאינה פעילה.", variant: "destructive" });
          }
        }
      } catch (err) {
        console.error("Error initializing page:", err);
        setError("שגיאה בטעינת נתוני הדף.");
        toast({ title: "שגיאת טעינה", description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, [location.search, toast]);

  const handleItemQuantityChange = useCallback((itemId, newQuantity) => {
    setAvailableItems(prevItems => prevItems.map(item => {
      if (item.id === itemId) {
        const maxQuant = item.max_quantity || 0;
        const quantity = Math.max(0, Math.min(parseInt(newQuantity, 10) || 0, maxQuant));
        return { ...item, requested_quantity: quantity };
      }
      return item;
    }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSavingRequest(true);

    const itemsToSubmit = availableItems.filter(item => item.requested_quantity > 0);

    if (itemsToSubmit.length === 0) {
      toast({ title: "אין פריטים למשיכה", description: "יש להזין כמות לפחות לפריט אחד.", variant: "destructive" });
      setSavingRequest(false);
      return;
    }

    try {
      const withdrawalReq = await WithdrawalRequest.create({
        ...withdrawalForm,
        status: 'submitted',
      });

      for (const item of itemsToSubmit) {
        await WithdrawalItem.create({
          withdrawal_request_id: withdrawalReq.id,
          reagent_id: item.reagent_id,
          reagent_name_snapshot: item.reagent_name_snapshot,
          quantity_requested: item.requested_quantity,
          line_status: 'pending'
        });
      }

      toast({
        title: "בקשת משיכה נשלחה בהצלחה",
        description: `בקשה מספר ${withdrawalForm.withdrawal_number} נוצרה ונשלחה.`,
        variant: "success",
      });
      
      // Open print dialog
      setCreatedWithdrawalId(withdrawalReq.id);
      setShowPrintDialog(true);

    } catch (err) {
      console.error("Error creating withdrawal request:", err);
      toast({ title: "שגיאה ביצירת הבקשה", description: err.message, variant: "destructive" });
    } finally {
      setSavingRequest(false);
    }
  };

  const handlePrintDialogClose = () => {
    setShowPrintDialog(false);
    setCreatedWithdrawalId(null);
    navigate(createPageUrl('WithdrawalRequests'));
  };

  const totalItemsSelected = useMemo(() => {
    return availableItems.reduce((count, item) => item.requested_quantity > 0 ? count + 1 : count, 0);
  }, [availableItems]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="mr-3 text-lg">טוען נתונים...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-600 p-8">{error}</div>;
  }

  return (
    <>
      <div className="p-4 md:p-6" dir="rtl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BackButton /> {/* Replaced ArrowLeft button with BackButton */}
            <h1 className="text-2xl font-bold">בקשת משיכה מהזמנת מסגרת</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>פרטי בקשת המשיכה</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <Label>מספר בקשה</Label>
                <Input value={withdrawalForm.withdrawal_number} disabled className="bg-gray-100" />
              </div>
              <div>
                <Label htmlFor="request_date">תאריך בקשה</Label>
                <Input id="request_date" type="date" value={withdrawalForm.request_date} onChange={(e) => setWithdrawalForm(f => ({ ...f, request_date: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="urgency_level">רמת דחיפות</Label>
                <Select value={withdrawalForm.urgency_level} onValueChange={(val) => setWithdrawalForm(f => ({ ...f, urgency_level: val }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(urgencyLevels).map(([key, value]) => (
                      <SelectItem key={key} value={key}>{value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="lg:col-span-1">
                <Label htmlFor="framework_order_id">הזמנת מסגרת *</Label>
                <Select
                  value={withdrawalForm.framework_order_id}
                  onValueChange={handleFrameworkOrderChange}
                  required
                  disabled={loading || frameworkOrders.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר הזמנת מסגרת..." />
                  </SelectTrigger>
                  <SelectContent>
                    {frameworkOrders.map(order => (
                      <SelectItem key={order.id} value={order.id}>
                        {order.order_number_permanent || order.order_number_temp} - {order.supplier_name_snapshot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="requested_delivery_date">תאריך אספקה מבוקש</Label>
                <Input id="requested_delivery_date" type="date" value={withdrawalForm.requested_delivery_date} onChange={(e) => setWithdrawalForm(f => ({ ...f, requested_delivery_date: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="contact_person_delivery">איש קשר לקבלת האספקה</Label>
                <Input id="contact_person_delivery" value={withdrawalForm.contact_person_delivery} onChange={(e) => setWithdrawalForm(f => ({ ...f, contact_person_delivery: e.target.value }))} />
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <Label htmlFor="requester_notes">הערות כלליות לבקשה</Label>
                <Input id="requester_notes" value={withdrawalForm.requester_notes} onChange={(e) => setWithdrawalForm(f => ({ ...f, requester_notes: e.target.value }))} />
              </div>
            </CardContent>
          </Card>

          {withdrawalForm.framework_order_id && (
            <Card>
              <CardHeader>
                <CardTitle>פריטים למשיכה מהזמנת המסגרת</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] p-2">
                  <div className="space-y-4">
                    {availableItems.length > 0 ? (
                      availableItems.map((item) => (
                        <WithdrawalItemRow
                          key={item.id}
                          item={item}
                          onQuantityChange={handleItemQuantityChange}
                        />
                      ))
                    ) : (
                      <div className="text-center py-10 text-gray-500">
                        לא נמצאו פריטים זמינים למשיכה בהזמנה זו.
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          <div className="mt-8 flex justify-between items-center">
            <div>
              <Button type="submit" disabled={savingRequest || totalItemsSelected === 0}>
                {savingRequest ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Send className="h-4 w-4 ml-2" />}
                שלח לאישור
              </Button>
              <Button type="button" variant="outline" className="mr-3" onClick={() => navigate(createPageUrl('WithdrawalRequests'))}>
                ביטול
              </Button>
            </div>
            <div className="text-sm text-gray-600">
              {totalItemsSelected} פריטים נבחרו למשיכה
            </div>
          </div>
        </form>
      </div>

      <PrintDialog
        isOpen={showPrintDialog}
        onClose={handlePrintDialogClose}
        documentId={createdWithdrawalId}
        documentType="withdrawal"
        title="בקשת משיכה"
      />
    </>
  );
}
