
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, addYears } from 'date-fns';
import { he } from "date-fns/locale";
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Package, Loader2, ArrowLeft, AlertTriangle, Paperclip, Upload, X, FileText, Save, Search, CheckCircle, Check, ChevronDown, ChevronUp, FileStack, Info, Download, PackagePlus, ListPlus
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import { UploadFile } from '@/api/integrations';

import { Delivery } from '@/api/entities';
import { DeliveryItem } from '@/api/entities';
import { Order } from '@/api/entities';
import { OrderItem } from '@/api/entities';
import { ReagentBatch } from '@/api/entities';
import { InventoryTransaction } from '@/api/entities';
import { WithdrawalRequest } from '@/api/entities';
import { WithdrawalItem } from '@/api/entities';
import { User } from '@/api/entities';
import { Reagent } from '@/api/entities';
import { Supplier } from '@/api/entities';
import { ReagentReceiptEvent } from "@/api/entities";

import { updateReagentInventory } from "@/api/functions";

import DateField from "@/components/ui/DateField";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSystemLock } from '@/components/ui/system-lock';
import { formatQuantity } from "@/components/utils/formatters";
import PrintDialog from '@/components/ui/PrintDialog'; // Import the new PrintDialog component

// Helper function to safely fetch data with retry logic
const safeFetch = async (fetchFunction, name, retries = 2) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[NewDelivery] Fetching ${name} (attempt ${attempt}/${retries})`);
      const result = await fetchFunction();
      console.log(`[NewDelivery] Successfully fetched ${name}:`, Array.isArray(result) ? result.length : 'non-array');
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.warn(`[NewDelivery] Failed to fetch ${name} on attempt ${attempt}:`, error.message);
      if (attempt === retries) {
        console.error(`[NewDelivery] All attempts failed for ${name}`);
        return [];
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  return [];
};

// Item Row Component
const DeliveryItemRow = ({ item, index, updateItem, deleteItem, toggleApprove, reagents, validationState, setCurrentItemKeyForSearch, setShowItemSearch, deliveryData, toast }) => {
    const selectedReagentDetails = reagents.find(r => r.id === item.reagent_id);
    const isLinked = item.isPreFilled;
    const itemValidation = validationState[item.key] || {};

    const requiresBatches = selectedReagentDetails?.requires_batches !== false;
    const requiresExpiryDate = selectedReagentDetails?.requires_expiry_date !== false;
    const requiresCOA = selectedReagentDetails?.requires_coa !== false;

    const [isItemExpanded, setIsItemExpanded] = useState(false);

    useEffect(() => {
        // Expand new items by default if not pre-filled and not approved
        if (!item.isPreFilled && !item.reagent_id && !item.approved) {
            setIsItemExpanded(true);
        }
    }, [item.isPreFilled, item.reagent_id, item.approved]);


    return (
        <div key={item.key} className={`p-4 border rounded-lg relative mb-3 ${
            item.approved ? 'bg-green-50 border-green-200' :
            isLinked ? 'bg-blue-50 border-blue-200' :
            selectedReagentDetails?.category === 'consumables' ? 'bg-yellow-50 border-yellow-200' : // Consumables might have a different color
            'bg-white border-gray-200'
        }`}>
            {/* Header row */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    {item.approved ? (
                        <Badge className="bg-green-100 text-green-700">מאושר</Badge>
                    ) : (
                        <Badge variant="outline" className="text-gray-600">טיוטה</Badge>
                    )}
                    <span className="font-medium">{item.reagent_name || 'בחר פריט...'}</span>
                    {item.quantity_ordered_snapshot !== null && (
                        <span className="text-sm text-gray-600">
                            (הוזמן: {formatQuantity(item.quantity_ordered_snapshot)} | נותר: {formatQuantity(item.quantity_remaining_snapshot)})
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        title={isItemExpanded ? "סגור" : "פתח לעריכה"}
                        onClick={() => setIsItemExpanded(!isItemExpanded)}
                    >
                        {isItemExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500"
                        onClick={() => deleteItem(item.key)}
                        title="מחיקת פריט"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <AnimatePresence>
                {isItemExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* שם פריט */}
                            <div className="space-y-2 lg:col-span-2">
                                <Label>שם הפריט *</Label>
                                {item.reagent_name && isLinked ? (
                                    <div className={`w-full p-2 bg-gray-100 border rounded text-right ${itemValidation.reagent_id ? 'border-2 border-red-500' : ''}`}>
                                        {item.reagent_name}
                                    </div>
                                ) : (
                                    <Button
                                        variant="outline"
                                        className={`w-full justify-start text-right ${itemValidation.reagent_id ? 'border-2 border-red-500' : ''}`}
                                        onClick={() => {
                                            if (!deliveryData.supplier) {
                                                toast({
                                                    title: "יש לבחור ספק תחילה",
                                                    description: "בחר ספק בפרטי המשלוח כדי לראות את הריאגנטים הזמינים",
                                                    variant: "destructive"
                                                });
                                                return;
                                            }
                                            setCurrentItemKeyForSearch(item.key);
                                            setShowItemSearch(true);
                                        }}
                                        disabled={isLinked}
                                    >
                                        {item.reagent_id && item.reagent_name ? item.reagent_name : "בחר פריט..."}
                                    </Button>
                                )}
                            </div>

                            {/* מס' אצווה */}
                            <div className="space-y-2">
                                <Label>
                                    {requiresBatches ? 'מס\' אצווה *' : 'סוג פריט'}
                                </Label>
                                {requiresBatches ? (
                                    <Input
                                        value={item.batch_number}
                                        onChange={(e) => updateItem(item.key, 'batch_number', e.target.value)}
                                        placeholder="מספר אצווה"
                                        className={`text-right placeholder:text-right ${itemValidation.batch_number ? 'border-2 border-red-500' : ''}`}
                                    />
                                ) : (
                                    <div className="p-2 bg-gray-100 border rounded text-sm text-gray-600">
                                        מתכל - ללא אצווה
                                    </div>
                                )}
                            </div>

                            {/* תאריך תפוגה */}
                            <div className="space-y-2">
                                <Label>
                                    {requiresExpiryDate ? 'תאריך תפוגה *' : 'תוקף'}
                                </Label>
                                {requiresExpiryDate ? (
                                    <DateField
                                        value={item.expiry_date || ''}
                                        onChange={(val) => updateItem(item.key, 'expiry_date', val)}
                                        className={`${itemValidation.expiry_date ? 'border-2 border-red-500' : ''}`}
                                    />
                                ) : (
                                    <div className="p-2 bg-gray-100 border rounded text-sm text-gray-600">
                                        ללא תאריך תפוגה
                                    </div>
                                )}
                            </div>

                            {/* כמות */}
                            <div className="space-y-2">
                                <Label>כמות שהתקבלה *</Label>
                                <Input
                                    type="number"
                                    step="any"
                                    min="0"
                                    max={isLinked && typeof item.quantity_remaining_available === 'number' && item.quantity_remaining_available > 0 ? item.quantity_remaining_available : undefined}
                                    value={item.quantity_received || ''}
                                    onChange={(e) => updateItem(item.key, 'quantity_received', e.target.value)}
                                    className={`text-right placeholder:text-right ${itemValidation.quantity_received ? 'border-2 border-red-500' : ''}`}
                                />
                                {isLinked && typeof item.quantity_remaining_available === 'number' && item.quantity_remaining_available > 0 && (
                                    <div className="text-xs text-gray-500 mt-1">
                                        צפוי לקבלה: {formatQuantity(item.quantity_remaining_available)}
                                    </div>
                                )}
                            </div>

                            {/* עלות יחידה */}
                            <div className="space-y-2">
                                <Label>עלות יחידה (אופציונלי)</Label>
                                <Input
                                    type="number"
                                    value={item.unit_cost || ''}
                                    onChange={(e) => updateItem(item.key, 'unit_cost', parseFloat(e.target.value) || null)}
                                    placeholder="₪"
                                    step="0.01"
                                    min="0"
                                    className="text-right placeholder:text-right"
                                />
                            </div>

                            {/* הערות */}
                            <div className="space-y-2 lg:col-span-3">
                                <Label>הערות לפריט</Label>
                                <Input
                                    value={item.notes}
                                    onChange={(e) => updateItem(item.key, 'notes', e.target.value)}
                                    placeholder="הערות נוספות לפריט זה"
                                    className="text-right placeholder:text-right"
                                />
                            </div>
                        </div>

                        {requiresCOA && (
                            <div className="space-y-2 mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 ml-1 text-yellow-600" />
                                    <Label htmlFor={`coa_file_${item.key}`} className="font-medium">
                                        תעודת אנליזה (COA) - נדרש
                                    </Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button asChild variant="outline" className="flex-1">
                                        <Label htmlFor={`coa_file_${item.key}`} className="cursor-pointer flex items-center justify-center">
                                            <Upload className="h-4 w-4 ml-2" />
                                            {item.coaFileName ? 'החלף קובץ' : 'בחר קובץ COA'}
                                        </Label>
                                    </Button>
                                    <Input
                                        id={`coa_file_${item.key}`}
                                        type="file"
                                        className="hidden"
                                        onChange={(e) => updateItem(item.key, 'coa_file', e.target.files ? e.target.files[0] : null)}
                                        accept=".pdf,.jpg,.jpeg,.png"
                                    />
                                </div>
                                {item.coaFileName && (
                                    <div className="mt-2 p-2 bg-white border rounded flex items-center justify-between">
                                        <div className="flex items-center text-sm text-gray-700">
                                            <Paperclip className="h-4 w-4 ml-1" />
                                            <span>{item.coaFileName}</span>
                                            <Badge variant="outline" className="mr-2 text-green-600">
                                                מוכן להעלאה
                                            </Badge>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => updateItem(item.key, 'coa_file', null)}
                                            className="h-auto p-1 text-red-500 hover:text-red-700"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                )}
                                <p className="text-xs text-gray-600">
                                    קבצים נתמכים: PDF, JPG, PNG. תעודת האנליזה תישמר עם פרטי האצווה.
                                </p>
                            </div>
                        )}

                        {/* Approve button at bottom */}
                        <div className="mt-6 pt-4 border-t border-gray-200/80 flex justify-center">
                            <Button
                                onClick={() => toggleApprove(item.key)}
                                className={`${item.approved ? "bg-red-100 text-red-700 hover:bg-red-200" : "bg-green-100 text-green-700 hover:bg-green-200"} px-6 py-2 text-lg font-medium transition-colors`}
                                title={item.approved ? "בטל אישור והחזר לעריכה" : "אשר פרטי הפריט והוסף לרשימת הפריטים שהתקבלו"}
                            >
                                {item.approved ? (
                                    <>
                                        <X className="h-5 w-5 ml-2" />
                                        בטל אישור
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-5 w-5 ml-2" />
                                        <Plus className="h-4 w-4 mr-1" />
                                        אשר פריט
                                    </>
                                )}
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// No Items Row component
const NoItemsRow = ({ onAddItem, supplierSelected }) => (
    <div className="text-center py-8 text-gray-500">
        {!supplierSelected ? (
            <div>
                <p>יש לבחור ספק תחילה</p>
                <p className="text-sm mt-2">לאחר בחירת הספק ניתן יהיה להוסיף פריטים</p>
            </div>
        ) : (
            "אין פריטים במשלוח. לחץ על כפתור + להוספה."
        )}
        <Button onClick={onAddItem} className="mt-4" disabled={!supplierSelected}>
            <Plus className="h-4 w-4 ml-2" />
            הוסף פריט
        </Button>
    </div>
);


export default function NewDeliveryPage() { // Renamed component as per outline
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const orderId = searchParams.get('order_id');
  const withdrawalId = searchParams.get('withdrawal_id');

  // System lock hook with corrected destructuring
  const { lockSystem, updateLockProgress, clearSystemLock, isLocked } = useSystemLock();

  // State for page data
  const [reagents, setReagents] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [activeWithdrawals, setActiveWithdrawals] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // State for delivery form
  const [deliveryData, setDeliveryData] = useState({
    supplier: '',
    delivery_number: '',
    delivery_date: format(new Date(), 'yyyy-MM-dd'),
    order_number: '',
    linked_order_id: '',
    linked_withdrawal_id: '',
    delivery_type: 'with_order',
    notes: ''
  });

  const [items, setItems] = useState([]);
  const [deliveryCertificate, setDeliveryCertificate] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [validationState, setValidationState] = useState({});

  // UI related states for item selection dialog
  const [showItemSearch, setShowItemSearch] = useState(false);
  const [currentItemKeyForSearch, setCurrentItemKeyForSearch] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNoBalanceAlert, setShowNoBalanceAlert] = useState(false);
  const [itemToApprove, setItemToApprove] = useState(null);

  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);

  // New state for mobile filters as per outline (though not used in this specific change)
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Add print dialog state
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [newDeliveryId, setNewDeliveryId] = useState(null);

  // Function to reset the form state
  const resetForm = useCallback(() => {
    setDeliveryData({
      supplier: '',
      delivery_number: `DN-${format(new Date(), 'yyyyMMdd')}-${Math.floor(Math.random() * 9000) + 1000}`,
      delivery_date: format(new Date(), 'yyyy-MM-dd'),
      order_number: '',
      linked_order_id: '',
      linked_withdrawal_id: '',
      delivery_type: 'with_order',
      notes: ''
    });
    setItems([]);
    setDeliveryCertificate(null);
    setValidationState({});
    // Do NOT reset newDeliveryId here, it's needed for the print dialog before form reset
    // Do NOT reset showPrintDialog here, it's actively managing the dialog
  }, []);

  // Handle prefill data for linked orders or withdrawals
  const handlePrefillData = useCallback(async (withdrawalId, orderId, reagentsData, ordersData, withdrawalsData) => {
    try {
      let prefilledDeliveryForm = {
        supplier: '',
        delivery_number: `DN-${format(new Date(), 'yyyyMMdd')}-${Math.floor(Math.random() * 9000) + 1000}`,
        delivery_date: format(new Date(), 'yyyy-MM-dd'),
        order_number: '',
        linked_order_id: '',
        linked_withdrawal_id: '',
        delivery_type: 'with_order',
        notes: ''
      };
      let prefilledItemsMapped = [];

      if (withdrawalId) {
        console.log(`[NewDelivery] Processing prefill for withdrawal: ${withdrawalId}`);
        const withdrawal = withdrawalsData.find(w => w.id === withdrawalId);

        if (withdrawal) {
          const withdrawalItems = await safeFetch(() => WithdrawalItem.filter({ withdrawal_request_id: withdrawalId }), 'withdrawal items');

          prefilledDeliveryForm = {
            ...prefilledDeliveryForm,
            supplier: withdrawal.supplier_snapshot || '',
            order_number: withdrawal.framework_order_number_snapshot || '',
            linked_order_id: `withdrawal_${withdrawal.id}`,
            linked_withdrawal_id: withdrawal.id,
            delivery_type: 'withdrawal',
            notes: withdrawal.notes || ''
          };

          prefilledItemsMapped = withdrawalItems
            .filter(item => {
              const remaining = (item.quantity_requested || 0) - (item.quantity_received || 0);
              return remaining > 0 && item.line_status !== 'delivered' && item.line_status !== 'cancelled' && item.line_status !== 'rejected';
            })
            .map(item => {
              const remaining = (item.quantity_requested || 0) - (item.quantity_received || 0);
              const reagent = reagentsData.find(r => r.id === item.reagent_id);
              return {
                reagent_id: item.reagent_id,
                reagent_name: item.reagent_name_snapshot,
                batch_number: '',
                expiry_date: '',
                quantity_received: remaining,
                reagent_catalog_id: reagent?.catalog_item_id || '',
                linked_item_id: item.id,
                quantity_remaining_available: remaining,
                isNewItem: false,
                isPreFilled: true,
                quantity_ordered_snapshot: item.quantity_requested,
                quantity_remaining_snapshot: remaining,
                key: Math.random(),
                coaFile: null,
                coaFileName: '',
                category: reagent?.category || '',
                unit_cost: null,
                notes: item.notes || '',
                approved: false,
              };
            });
        }
      } else if (orderId) {
        console.log(`[NewDelivery] Processing prefill for order: ${orderId}`);
        const order = ordersData.find(o => o.id === orderId);

        if (order) {
          const orderItems = await safeFetch(() => OrderItem.filter({
            order_id: orderId,
            line_status: { $in: ['open', 'partially_received'] }
          }), 'order items');

          prefilledDeliveryForm = {
            ...prefilledDeliveryForm,
            supplier: order.supplier_name_snapshot || '',
            order_number: order.order_number_temp || order.order_number_permanent || order.purchase_order_number_sap || '',
            linked_order_id: `order_${order.id}`,
            linked_withdrawal_id: '',
            delivery_type: 'with_order',
            notes: order.notes || ''
          };

          prefilledItemsMapped = orderItems
            .filter(item => {
              const remaining = (item.quantity_ordered || 0) - (item.quantity_received || 0);
              return remaining > 0 && item.line_status !== 'fully_received' && item.line_status !== 'cancelled';
            })
            .map(item => {
              const remaining = (item.quantity_ordered || 0) - (item.quantity_received || 0);
              const reagent = reagentsData.find(r => r.id === item.reagent_id);
              return {
                reagent_id: item.reagent_id,
                reagent_name: item.reagent_name_snapshot,
                batch_number: '',
                expiry_date: '',
                quantity_received: remaining,
                reagent_catalog_id: item.reagent_catalog_id_snapshot || reagent?.catalog_item_id || '',
                linked_item_id: item.id,
                quantity_remaining_available: remaining,
                isNewItem: false,
                isPreFilled: true,
                quantity_ordered_snapshot: item.quantity_ordered,
                quantity_remaining_snapshot: remaining,
                key: Math.random(),
                coaFile: null,
                coaFileName: '',
                category: reagent?.category || '',
                unit_cost: item.unit_price_ordered || null,
                notes: item.notes || '',
                approved: false,
              };
            });
        }
      }

      setDeliveryData(prefilledDeliveryForm);
      setItems(prefilledItemsMapped);

      if (prefilledItemsMapped.length > 0) {
        toast({
          title: "נתונים נטענו אוטומטית",
          description: `נטענו ${prefilledItemsMapped.length} פריטים מהמקור המקושר.`,
          variant: "default"
        });
      } else {
        toast({
          title: "מקור מקושר ללא יתרה",
          description: "המקור המקושר ריק או שכל הפריטים בו כבר התקבלו.",
          variant: "default"
        });
      }

    } catch (prefillError) {
      console.error('[NewDelivery] Error handling prefill data:', prefillError);
      toast({
        title: "שגיאה בטעינת נתונים מקדימים",
        description: "לא ניתן היה לטעון נתונים מהמקור המקושר.",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Initialize page data by fetching directly from entities
  const initPage = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      console.log('[NewDelivery] Starting to load page data directly from entities...');

      // Get current user
      const user = await User.me();
      setCurrentUser(user);
      console.log('[NewDelivery] Current user loaded:', user?.email);

      // Fetch all required data in parallel with retry logic
      const [
        reagentsData,
        suppliersData,
        ordersData,
        withdrawalsData
      ] = await Promise.all([
        safeFetch(() => Reagent.list(), 'reagents'),
        safeFetch(() => Supplier.filter({ is_active: true }), 'suppliers'),
        safeFetch(() => Order.filter({
          status: { $in: ['approved', 'partially_received', 'pending_sap_permanent_id', 'pending_sap_po_number'] }
        }), 'active orders'),
        safeFetch(() => WithdrawalRequest.filter({
          status: { $in: ['approved', 'in_delivery', 'submitted'] }
        }), 'active withdrawals')
      ]);

      // Set the fetched data
      setReagents(reagentsData);
      setSuppliers(suppliersData);
      setAvailableOrders(ordersData);
      setActiveWithdrawals(withdrawalsData);

      console.log(`[NewDelivery] Loaded data: ${reagentsData.length} reagents, ${suppliersData.length} suppliers, ${ordersData.length} orders, ${withdrawalsData.length} withdrawals`);

      // Handle prefill data if URL parameters are provided
      if (withdrawalId || orderId) {
        await handlePrefillData(withdrawalId, orderId, reagentsData, ordersData, withdrawalsData);
      } else {
        // Set default delivery number and clear items if not prefilled
        resetForm(); // Use the resetForm function here
      }

      // Clear URL parameters after processing
      if (orderId || withdrawalId) {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }

    } catch (err) {
      console.error('[NewDelivery] Critical error loading page data:', err);
      setError('שגיאה בטעינת נתוני הדף. נסה לרענן.');
      toast({
        title: "שגיאה בטעינה",
        description: "לא ניתן לטעון את נתוני הדף. נסה לרענן את הדפדפן.",
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast, orderId, withdrawalId, handlePrefillData, resetForm]);

  useEffect(() => {
    initPage();
  }, [initPage]);

  // Unified handler for deliveryData changes
  const handleDeliveryDataChange = (field, value) => {
    setDeliveryData(prev => ({ ...prev, [field]: value }));

    if (field === 'delivery_type') {
      setDeliveryData(prev => ({
        ...prev,
        linked_order_id: '',
        linked_withdrawal_id: '',
        order_number: '',
        supplier: prev.supplier
      }));
      setItems([]);
    } else if (field === 'linked_order_id') {
        handleLinkedSourceSelection(value);
    }
  };

  const updateItem = (keyToUpdate, field, value) => {
    setItems(prevItems => {
      return prevItems.map(item => {
        if (item.key === keyToUpdate) {
          const newItem = { ...item };
          if (field === 'quantity_received') {
            const numericValue = parseFloat(value);

            if (isNaN(numericValue)) {
              newItem[field] = value;
            } else {
              if (item.isPreFilled) {
                const maxQuantity = item.quantity_remaining_available || Infinity;
                if (numericValue > maxQuantity) {
                  toast({
                    title: "כמות חורגת מהיתרה",
                    description: `הכמות המקסימלית לקבלה היא ${formatQuantity(maxQuantity)}.`,
                    variant: "destructive"
                  });
                  newItem[field] = maxQuantity;
                } else if (numericValue < 0) {
                  newItem[field] = 0;
                } else {
                  newItem[field] = numericValue;
                }
              } else {
                if (numericValue < 0) {
                  newItem[field] = 0;
                } else {
                  newItem[field] = numericValue;
                }
              }
            }
          } else if (field === 'coa_file') {
            newItem.coaFile = value;
            newItem.coaFileName = value ? value.name : '';
          } else {
            newItem[field] = value;
          }
          return newItem;
        }
        return item;
      });
    });
  };

  const addItem = () => {
    if (!deliveryData.supplier) {
        toast({
            title: "יש לבחור ספק תחילה",
            description: "בחר ספק בפרטי המשלוח כדי להוסיף פריטים",
            variant: "destructive"
        });
        return;
    }
    const newItemKey = Math.random();
    setItems(prevItems => ([...prevItems, {
      reagent_id: '',
      reagent_name: '',
      batch_number: '',
      expiry_date: '',
      quantity_received: 0,
      reagent_catalog_id: '',
      linked_item_id: '',
      quantity_remaining_available: 0,
      isNewItem: true,
      isPreFilled: false,
      quantity_ordered_snapshot: null,
      quantity_remaining_snapshot: null,
      key: newItemKey,
      coaFile: null,
      coaFileName: '',
      category: '',
      unit_cost: null,
      notes: '',
      approved: false,
    }]));
  };

  const deleteItem = (keyToDelete) => {
    setItems(prevItems => {
      return prevItems.filter(item => item.key !== keyToDelete);
    });
  };

  const handleLinkedSourceSelection = useCallback(async (value) => {
    setDeliveryData(prev => ({ ...prev, linked_order_id: value, linked_withdrawal_id: '' }));

    if (value && value !== 'no-link') {
      const [type, id] = value.split('_');

      if (type === 'order') {
        const selectedOrderData = availableOrders.find(o => o.id === id);
        if (selectedOrderData) {
          setDeliveryData(prev => ({
            ...prev,
            supplier: selectedOrderData.supplier_name_snapshot,
            order_number: selectedOrderData.order_number_temp || selectedOrderData.order_number_permanent || selectedOrderData.purchase_order_number_sap,
            delivery_type: 'with_order',
            linked_withdrawal_id: ''
          }));

          try {
            const orderItemsData = await safeFetch(() => OrderItem.filter({
              order_id: id,
              line_status: { $in: ['open', 'partially_received'] }
            }), 'order items for linking');
            const itemsWithRemaining = orderItemsData.filter(item => {
              const remaining = (item.quantity_ordered || 0) - (item.quantity_received || 0);
              return remaining > 0 && item.line_status !== 'fully_received' && item.line_status !== 'cancelled';
            });

            if (itemsWithRemaining.length > 0) {
              const preFilledDeliveryItems = itemsWithRemaining.map((orderItem) => {
                const remaining = (orderItem.quantity_ordered || 0) - (orderItem.quantity_received || 0);
                const reagent = reagents.find(r => r.id === orderItem.reagent_id);
                return {
                  reagent_id: orderItem.reagent_id,
                  reagent_name: orderItem.reagent_name_snapshot,
                  batch_number: '',
                  expiry_date: '',
                  quantity_received: remaining,
                  reagent_catalog_id: orderItem.reagent_catalog_id_snapshot || reagent?.catalog_item_id || '',
                  linked_item_id: orderItem.id,
                  quantity_remaining_available: remaining,
                  isNewItem: false,
                  isPreFilled: true,
                  quantity_ordered_snapshot: orderItem.quantity_ordered,
                  quantity_remaining_snapshot: remaining,
                  key: Math.random(),
                  coaFile: null,
                  coaFileName: '',
                  category: reagent?.category || '',
                  unit_cost: orderItem.unit_price_ordered || null,
                  notes: orderItem.notes || '',
                  approved: false,
                };
              });
              setItems(preFilledDeliveryItems);
              toast({
                title: "נתונים נטענו מההזמנה",
                description: `נטענו ${preFilledDeliveryItems.length} פריטים מההזמנה`,
                variant: "default"
              });
            } else {
              toast({
                title: "הזמנה ללא יתרה",
                description: "ההזמנה המקושרת אינה מכילה פריטים עם יתרה לקבלה.",
                variant: "default"
              });
              setItems([]);
            }
          } catch (itemFetchError) {
            console.error("Error fetching order items for manual link:", itemFetchError);
            toast({
              title: "שגיאה בטעינת פריטי הזמנה",
              description: `לא ניתן לטעון פריטים עבור הזמנה זו.`,
              variant: "destructive"
            });
            setItems([]);
          }
        }
      } else if (type === 'withdrawal') {
        const selectedWithdrawalData = activeWithdrawals.find(wr => wr.id === id);
        if (selectedWithdrawalData) {
          setDeliveryData(prev => ({
            ...prev,
            supplier: selectedWithdrawalData.supplier_snapshot || '',
            order_number: selectedWithdrawalData.framework_order_number_snapshot || '',
            delivery_type: 'withdrawal',
            linked_withdrawal_id: selectedWithdrawalData.id,
            linked_order_id: value
          }));

          try {
            const withdrawalItemsData = await safeFetch(() => WithdrawalItem.filter({ withdrawal_request_id: id }), 'withdrawal items for linking');
            const itemsWithRemaining = withdrawalItemsData.filter(item => {
              const remaining = (item.quantity_requested || 0) - (item.quantity_received || 0);
              return remaining > 0 && item.line_status !== 'delivered' && item.line_status !== 'cancelled' && item.line_status !== 'rejected';
            });

            if (itemsWithRemaining.length > 0) {
              const preFilledDeliveryItems = itemsWithRemaining.map((withdrawalItem) => {
                const remaining = (withdrawalItem.quantity_requested || 0) - (withdrawalItem.quantity_received || 0);
                const reagent = reagents.find(r => r.id === withdrawalItem.reagent_id);
                return {
                  reagent_id: withdrawalItem.reagent_id,
                  reagent_name: withdrawalItem.reagent_name_snapshot,
                  batch_number: '',
                  expiry_date: '',
                  quantity_received: remaining,
                  reagent_catalog_id: reagent?.catalog_item_id || '',
                  linked_item_id: withdrawalItem.id,
                  quantity_remaining_available: remaining,
                  isNewItem: false,
                  isPreFilled: true,
                  quantity_ordered_snapshot: withdrawalItem.quantity_requested,
                  quantity_remaining_snapshot: remaining,
                  key: Math.random(),
                  coaFile: null, coaFileName: '', category: reagent?.category || '',
                  unit_cost: null, notes: withdrawalItem.notes || '',
                  approved: false,
                };
              });
              setItems(preFilledDeliveryItems);
              toast({
                title: "נתונים נטענו מבקשת משיכה",
                description: `נטענו ${preFilledDeliveryItems.length} פריטים מבקשת המשיכה`,
                variant: "default"
              });
            } else {
              toast({
                title: "בקשת משיכה ללא יתרה",
                description: "בקשת המשיכה המקושרת ריקה או שכל הפריטים בה כבר התקבלו.",
                variant: "default"
              });
              setItems([]);
            }
          } catch (itemFetchError) {
            console.error("Error fetching withdrawal items for manual link:", itemFetchError);
            toast({
              title: "שגיאה בטעינת פריטי משיכה",
              description: `לא ניתן לטעון פריטים עבור בקשת משיכה זו.`,
              variant: "destructive"
            });
            setItems([]);
          }
        }
      }
    } else {
      setDeliveryData(prev => ({
        ...prev,
        linked_order_id: '',
        linked_withdrawal_id: '',
        order_number: '',
        supplier: ''
      }));
      setItems([]);
    }
  }, [availableOrders, activeWithdrawals, reagents, toast]);

  const handleReagentSelection = (reagent) => {
    if (currentItemKeyForSearch === null) return;

    setItems(prevItems => prevItems.map(item => {
      if (item.key === currentItemKeyForSearch) {
        const updatedItem = { ...item };
        updatedItem.reagent_id = reagent.id;
        updatedItem.reagent_name = reagent.name;
        updatedItem.reagent_catalog_id = reagent.catalog_item_id;
        updatedItem.quantity_received = 0;
        updatedItem.category = reagent.category || '';

        if (reagent.requires_batches === false) {
          updatedItem.batch_number = 'N/A';
        } else {
          updatedItem.batch_number = '';
        }

        if (reagent.requires_expiry_date === false) {
          updatedItem.expiry_date = '';
        } else {
          updatedItem.expiry_date = '';
        }

        updatedItem.linked_item_id = '';
        updatedItem.quantity_remaining_available = 0;
        updatedItem.isNewItem = true;
        updatedItem.isPreFilled = false;
        updatedItem.quantity_ordered_snapshot = null;
        updatedItem.quantity_remaining_snapshot = null;
        updatedItem.unit_cost = null;
        updatedItem.approved = false;
        return updatedItem;
      }
      return item;
    }));

    setShowItemSearch(false);
    setCurrentItemKeyForSearch(null);
    setSearchTerm('');
  };

  const handleApproveConfirmation = () => {
    if (!itemToApprove) return;

    setItems(prev => prev.map(it => it.key === itemToApprove.key ? { ...it, approved: true, unit_cost: 0, notes: `${it.notes || ''} (נקלט ללא עלות עבון חוסר יתרה)`.trim() } : it));

    toast({ title: "הפריט אושר ונוסף לרשימת הפריטים שהתקבלו (ללא עלות)" });

    setShowNoBalanceAlert(false);
    setItemToApprove(null);
  };


  const toggleApprove = (keyToToggle) => {
    const item = items.find(i => i.key === keyToToggle);
    if (!item) return;

    if (item.approved) {
      setItems(prev => prev.map(it => it.key === keyToToggle ? { ...it, approved: false } : it));
      toast({ title: "הפריט הוחזר לעריכה" });
    } else {
      if (item.isPreFilled && item.quantity_remaining_available <= 0 && parseFloat(item.quantity_received) > 0) {
        setItemToApprove(item);
        setShowNoBalanceAlert(true);
      } else {
        setItems(prev => prev.map(it => it.key === keyToToggle ? { ...it, approved: true } : it));
        toast({ title: "הפריט אושר ונוסף לרשימת הפריטים שהתקבלו" });
      }
    }
  };

  const updateWithdrawalStatus = useCallback(async (withdrawalId) => {
    try {
      const linkedWithdrawal = await WithdrawalRequest.get(withdrawalId);
      if (linkedWithdrawal) {
        const updatedWithdrawalItems = await WithdrawalItem.filter({ withdrawal_request_id: withdrawalId }).catch(() => []);
        if (Array.isArray(updatedWithdrawalItems)) {
          const allItemsFullyDelivered = updatedWithdrawalItems.every(wi =>
            wi.line_status === 'delivered' || wi.line_status === 'cancelled' || wi.line_status === 'rejected'
          );
          const anyItemsPartiallyDelivered = updatedWithdrawalItems.some(wi =>
            wi.line_status === 'partially_delivered'
          );

          let newWithdrawalStatus = linkedWithdrawal.status;
          if (allItemsFullyDelivered) {
            newWithdrawalStatus = 'completed';
          } else if (anyItemsPartiallyDelivered) {
            newWithdrawalStatus = 'in_delivery';
          } else if (updatedWithdrawalItems.every(wi => (wi.quantity_received || 0) === 0)) {
            newWithdrawalStatus = 'approved';
          }

          if (newWithdrawalStatus !== linkedWithdrawal.status) {
            await WithdrawalRequest.update(linkedWithdrawal.id, { status: newWithdrawalStatus });
            console.log(`[NewDelivery] Updated withdrawal request status to: ${newWithdrawalStatus}`);
          }

          if (linkedWithdrawal.framework_order_id) {
            try {
              const frameworkOrder = await Order.get(linkedWithdrawal.framework_order_id);
              if (frameworkOrder) {
                const frameworkOrderItems = await OrderItem.filter({ order_id: frameworkOrder.id });

                let totalFrameworkReceivedMap = new Map();
                const allWithdrawalsForFramework = await WithdrawalRequest.filter({ framework_order_id: frameworkOrder.id }).catch(() => []);
                for (const wr of allWithdrawalsForFramework) {
                  const wrItems = await WithdrawalItem.filter({ withdrawal_request_id: wr.id }).catch(() => []);
                  for (const wri of wrItems) {
                    totalFrameworkReceivedMap.set(wri.reagent_id, (totalFrameworkReceivedMap.get(wri.reagent_id) || 0) + (wri.quantity_received || 0));
                  }
                }

                for (const foi of frameworkOrderItems) {
                  const newFrameworkQuantityReceived = totalFrameworkReceivedMap.get(foi.reagent_id) || 0;
                  const newFrameworkQuantityRemaining = Math.max(0, (foi.quantity_ordered || 0) - newFrameworkQuantityReceived);

                  let newFrameworkLineStatus = 'open';
                  if (newFrameworkQuantityRemaining <= 0) {
                    newFrameworkLineStatus = 'fully_received';
                  } else if (newFrameworkQuantityReceived > 0) {
                    newFrameworkLineStatus = 'partially_received';
                  }

                  if (newFrameworkQuantityReceived !== (foi.quantity_received || 0) || newFrameworkLineStatus !== foi.line_status) {
                    await OrderItem.update(foi.id, {
                      quantity_received: newFrameworkQuantityReceived,
                      quantity_remaining: newFrameworkQuantityRemaining,
                      line_status: newFrameworkLineStatus
                    });
                    console.log(`[NewDelivery] Updated framework order item ${foi.id}: received=${newFrameworkQuantityReceived}, remaining=${newFrameworkQuantityRemaining}`);
                  }
                }

                const allUpdatedFrameworkItems = await OrderItem.filter({ order_id: frameworkOrder.id });

                const allFrameworkItemsFullyReceived = allUpdatedFrameworkItems.every(foi =>
                  foi.line_status === 'fully_received' || foi.line_status === 'cancelled'
                );
                const anyFrameworkItemsReceived = allUpdatedFrameworkItems.some(foi =>
                  foi.line_status === 'partially_received' || foi.line_status === 'fully_received'
                );

                let newFrameworkOrderStatus = frameworkOrder.status;
                if (allFrameworkItemsFullyReceived && frameworkOrder.status !== 'fully_received') {
                  newFrameworkOrderStatus = 'fully_received';
                } else if (anyFrameworkItemsReceived && frameworkOrder.status === 'approved') {
                  newFrameworkOrderStatus = 'partially_received';
                }

                if (newFrameworkOrderStatus !== frameworkOrder.status) {
                  await Order.update(frameworkOrder.id, { status: newFrameworkOrderStatus });
                  console.log(`[NewDelivery] Updated framework order status to: ${newFrameworkOrderStatus}`);
                }
              }
            } catch (frameworkError) {
              console.error(`[NewDelivery] Error updating framework order for withdrawal ${withdrawalId}:`, frameworkError);
            }
          }
        }
      }
    } catch (err) {
      console.error(`Error updating withdrawal status for ID ${withdrawalId}:`, err);
    }
  }, []);

  const updateOrderStatus = useCallback(async (orderId) => {
    try {
      const linkedOrder = await Order.get(orderId);
      if (linkedOrder) {
        const updatedOrderItems = await OrderItem.filter({ order_id: orderId });

        if (Array.isArray(updatedOrderItems)) {
          const allItemsFullyReceived = updatedOrderItems.every(oi =>
            oi.line_status === 'fully_received' || oi.line_status === 'cancelled'
          );
          const anyItemsReceived = updatedOrderItems.some(oi =>
            oi.line_status === 'partially_received' || oi.line_status === 'fully_received'
          );

          let newOrderStatus = linkedOrder.status;
          if (allItemsFullyReceived && linkedOrder.status !== 'fully_received') {
            newOrderStatus = 'fully_received';
          } else if (anyItemsReceived && linkedOrder.status === 'approved') {
            newOrderStatus = 'partially_received';
          }

          if (newOrderStatus !== linkedOrder.status) {
            await Order.update(linkedOrder.id, { status: newOrderStatus });
            console.log(`[NewDelivery] Updated order status to: ${newOrderStatus}`);
          }
        }
      }
    } catch (err) {
      console.error(`Error updating order status for ID ${orderId}:`, err);
    }
  }, []);

  const handleSaveDelivery = async (isFinal = true) => {
    lockSystem(
      'מעבד קליטת משלוח...',
      ['ניהול מלאי', 'דוחות ומעקב', 'סטטוס הזמנות'],
      (items.length * 0.5) + 5
    );

    const itemsToProcess = isFinal ? items.filter(i => i.approved) : items;

    if (isFinal && itemsToProcess.length === 0) {
      toast({
        title: "אין פריטים מאושרים",
        description: "אנא אשר לפחות פריט אחד בלחיצה על סימון ה-V בכרטיס הפריט.",
        variant: "destructive"
      });
      clearSystemLock();
      return;
    }

    setError('');
    setSaving(true);
    setUploading(false);
    setValidationState({});

    if (!deliveryData.supplier) {
      toast({ title: "שדה חובה חסר", description: "יש לבחור ספק למשלוח.", variant: "destructive" });
      setSaving(false);
      clearSystemLock();
      return;
    }

    const validationErrors = {};
    let hasItemErrors = false;

    itemsToProcess.forEach(item => {
      const itemErrors = {};
      const reagentDetails = reagents.find(r => r.id === item.reagent_id);

      if (!item.reagent_id || !reagentDetails) {
        itemErrors.reagent_id = true;
        hasItemErrors = true;
      } else {
        const requiresBatches = reagentDetails.requires_batches !== false;
        const requiresExpiry = reagentDetails.requires_expiry_date !== false;

        if (requiresBatches && (!item.batch_number || item.batch_number.trim() === '' || item.batch_number === 'N/A')) {
          itemErrors.batch_number = true;
          hasItemErrors = true;
        }
        if (requiresExpiry && (!item.expiry_date || item.expiry_date.trim() === '')) {
          itemErrors.expiry_date = true;
          hasItemErrors = true;
        }
      }

      const receivedQuantity = parseFloat(String(item.quantity_received));
      if (isNaN(receivedQuantity) || receivedQuantity <= 0) {
        itemErrors.quantity_received = true;
        hasItemErrors = true;
      }

      if (Object.keys(itemErrors).length > 0) {
        validationErrors[item.key] = itemErrors;
      }
    });

    if (hasItemErrors) {
      setValidationState(validationErrors);
      toast({
        title: "שדות חובה חסרים או לא תקינים",
        description: "נא להשלים את הפרטים ולנסות שוב.",
        variant: "destructive",
        duration: 5000
      });
      setSaving(false);
      clearSystemLock();
      return;
    }

    try {
      console.log('[handleSave] Starting delivery save process...');
      updateLockProgress(5, 'יוצר רשומת משלוח ראשית...');

      if (!currentUser) {
        toast({
          title: "שגיאת התחברות",
          description: "נראה שהתנתקת מהמערכת. אנא התחבר מחדש.",
          variant: "destructive"
        });
        setSaving(false);
        clearSystemLock();
        return;
      }

      let documentUrl = null;
      if (deliveryCertificate) {
        setUploading(true);
        toast({ title: "מעלה תעודת משלוח..." });
        try {
          updateLockProgress(10, 'מעלה תעודת משלוח...');
          const { file_url } = await UploadFile({ file: deliveryCertificate });
          documentUrl = file_url;
          toast({ title: "תעודת משלוח הועלתה בהצלחה", variant: "default" });
        } catch (uploadError) {
          console.error("Error uploading certificate:", uploadError);
          toast({
            title: "שגיאה בהעלאת תעודת משלוח",
            description: `לא ניתן היה להעלות את התעודה עבור ${deliveryCertificate.name}. המשלוח יישמר ללא התעודה: ${uploadError.message}`,
            variant: "destructive"
          });
        } finally {
          setUploading(false);
        }
      }

      let actualLinkedOrderId = null;
      let actualLinkedWithdrawalId = null;

      if (deliveryData.linked_order_id) {
        const [type, id] = deliveryData.linked_order_id.split('_');
        if (type === 'order') {
          actualLinkedOrderId = id;
        } else if (type === 'withdrawal') {
          actualLinkedWithdrawalId = id;
        }
      }
      
      let totalItemsReceived = itemsToProcess.length;
      let hasNonOrderItems = itemsToProcess.some(item => !item.isPreFilled);
      let hasPartialItems = itemsToProcess.some(item =>
        item.isPreFilled && parseFloat(item.quantity_received) < (item.quantity_remaining_available || 0)
      );

      const deliveryDocData = {
        supplier: deliveryData.supplier,
        delivery_number: deliveryData.delivery_number || `DEL-${Date.now()}`,
        delivery_date: deliveryData.delivery_date,
        order_number: deliveryData.order_number,
        linked_order_id: actualLinkedOrderId,
        linked_withdrawal_id: actualLinkedWithdrawalId,
        delivery_type: deliveryData.delivery_type,
        notes: deliveryData.notes,
        status: isFinal ? 'processed' : 'draft', // Changed status as per outline
        total_items_received: totalItemsReceived,
        document_url: documentUrl,
        // New fields from outline
        completion_type: hasPartialItems ? 'partial' : 'full',
        has_non_order_items: hasNonOrderItems,
        has_replacements: false, // Defaulting as not handled in form
        delivery_reason_text: deliveryData.notes, // Using notes as a proxy for now
        created_by: currentUser.email,
        updated_by: currentUser.email,
      };

      console.log('[handleSave] Creating delivery document:', deliveryDocData);
      const newDelivery = await Delivery.create(deliveryDocData);
      console.log('[handleSave] Created delivery:', newDelivery.id);
      updateLockProgress(20, 'מעבד פריטי משלוח...');

      let processedItemsCount = 0;
      const errors = [];
      const affectedReagentIds = new Set();
      const deliveryItemsToCreate = [];
      const inventoryTransactionsToCreate = [];
      const receiptEventsToCreate = [];

      for (const [index, item] of itemsToProcess.entries()) {
        try {
          const progressStep = (80 - 20) / itemsToProcess.length;
          updateLockProgress(20 + (index * progressStep), `מעבד פריט ${index + 1}/${itemsToProcess.length}: ${item.reagent_name}`);

          console.log(`[handleSave] Processing item ${index + 1}/${itemsToProcess.length}:`, item.reagent_name);

          let reagentData = reagents.find(r => r.id === item.reagent_id);
          if (!reagentData) {
            console.warn(`[handleSave] Reagent not found in cache, fetching from server for ID: ${item.reagent_id}`);
            try {
              reagentData = await Reagent.get(item.reagent_id);
            } catch (fetchError) {
              console.error(`[handleSave] Failed to fetch reagent ${item.reagent_id}:`, fetchError);
              throw new Error(`לא ניתן למצוא נתוני ריאגנט עבור ${item.reagent_name}`);
            }
          }

          const requiresBatches = reagentData.requires_batches !== false;
          const requiresExpiry = reagentData.requires_expiry_date !== false;
          const requiresCoa = reagentData.requires_coa !== false;

          console.log(`[handleSave] Reagent data for ${item.reagent_name}:`, reagentData);

          if (!reagentData.catalog_item_id) {
            console.warn(`[handleSave] Missing catalog_item_id for ${item.reagent_name}, setting fallback for batch creation.`);
            reagentData.catalog_item_id = reagentData.id || `fallback_${item.reagent_id}`;
          }

          let coaUrl = null;
          if (requiresCoa && item.coaFile) {
            console.log(`[handleSave] Uploading COA for ${item.reagent_name}...`);
            try {
              const { file_url } = await UploadFile({ file: item.coaFile });
              coaUrl = file_url;
              console.log(`[handleSave] COA uploaded: ${coaUrl}`);
            } catch (uploadError) {
              console.warn(`[handleSave] Failed to upload COA for ${item.reagent_name}:`, uploadError);
              toast({
                title: "שגיאה בהעלאת תעודת אנליזה",
                description: `לא ניתן היה להעלות את התעודה עבור ${item.reagent_name}. הפריט יישמר ללא תעודה זו.`,
                variant: "destructive"
              });
            }
          }

          let reagentBatch;
          const batchNumberToUse = requiresBatches ? item.batch_number : 'N/A';
          const existingBatches = await ReagentBatch.filter({ reagent_id: reagentData.id, batch_number: batchNumberToUse }).catch(() => []);

          if (existingBatches.length > 0) {
            reagentBatch = existingBatches[0];
            const newQuantity = (reagentBatch.current_quantity || 0) + parseFloat(item.quantity_received.toString());

            await ReagentBatch.update(reagentBatch.id, {
              current_quantity: newQuantity,
              expiry_date: requiresExpiry ? item.expiry_date : reagentBatch.expiry_date,
              status: 'active',
              received_date: newDelivery.delivery_date,
              received_by: currentUser.email,
              ...(coaUrl && {
                coa_document_url: coaUrl,
                coa_upload_date: new Date().toISOString(),
                coa_uploaded_by: currentUser.email
              })
            });

            console.log(`[handleSave] Updated existing batch ${reagentBatch.id} with quantity ${newQuantity}`);
            reagentBatch = { ...reagentBatch, current_quantity: newQuantity }; // Update local copy for use in other records
          } else {
            const batchData = {
              catalog_item_id: reagentData.catalog_item_id,
              reagent_id: reagentData.id,
              batch_number: batchNumberToUse,
              expiry_date: requiresExpiry ? (item.expiry_date || format(addYears(new Date(), 100), 'yyyy-MM-dd')) : null,
              initial_quantity: parseFloat(item.quantity_received.toString()),
              current_quantity: parseFloat(item.quantity_received.toString()),
              status: 'active',
              received_date: newDelivery.delivery_date,
              received_by: currentUser.email,
              delivery_reference: newDelivery.delivery_number,
              order_reference: deliveryData.order_number,
              ...(coaUrl && {
                coa_document_url: coaUrl,
                coa_upload_date: new Date().toISOString(),
                coa_uploaded_by: currentUser.email
              })
            };

            console.log(`[handleSave] Creating new batch with data:`, batchData);

            reagentBatch = await ReagentBatch.create(batchData);
            console.log(`[handleSave] Created new batch ${reagentBatch.id}`);
          }

          deliveryItemsToCreate.push({
            delivery_id: newDelivery.id,
            linked_source_type: actualLinkedOrderId ? 'order' : (actualLinkedWithdrawalId ? 'withdrawal' : null),
            linked_source_id: actualLinkedOrderId || actualLinkedWithdrawalId,
            linked_item_id: item.linked_item_id || null,
            reagent_id: item.reagent_id,
            reagent_batch_id: reagentBatch.id,
            reagent_name_snapshot: item.reagent_name,
            quantity_received: parseFloat(item.quantity_received.toString()),
            batch_number: batchNumberToUse,
            expiry_date: requiresExpiry ? item.expiry_date : null,
            notes: item.notes || null,
            unit_cost: item.unit_cost || null
          });

          inventoryTransactionsToCreate.push({
            reagent_id: item.reagent_id,
            transaction_type: 'delivery',
            quantity: parseFloat(item.quantity_received.toString()),
            batch_number: batchNumberToUse,
            expiry_date: requiresExpiry ? item.expiry_date : null,
            document_number: newDelivery.delivery_number,
            notes: `קליטת משלוח ${newDelivery.delivery_number} - פריט ${item.reagent_name}`
          });
          
          // NEW: Create a ReagentReceiptEvent
          receiptEventsToCreate.push({
            reagent_id: item.reagent_id,
            reagent_batch_id: reagentBatch.id,
            reagent_name_snapshot: item.reagent_name,
            batch_number: batchNumberToUse,
            expiry_date: requiresExpiry ? item.expiry_date : null,
            receipt_quantity: parseFloat(item.quantity_received.toString()),
            receipt_date: deliveryData.delivery_date,
            delivery_id: newDelivery.id,
            delivery_number: newDelivery.delivery_number,
            order_number: deliveryData.order_number,
            received_by: currentUser.email,
            notes: `פריט התקבל במשלוח ${newDelivery.delivery_number}`,
            coa_document_url: coaUrl,
          });

          processedItemsCount++;

          if (actualLinkedWithdrawalId) { // Only update if it's actually linked to a withdrawal
            const withdrawalItem = await WithdrawalItem.get(item.linked_item_id);
            if (withdrawalItem) {
              const newQuantityReceived = (withdrawalItem.quantity_received || 0) + parseFloat(item.quantity_received.toString());
              const isFullyReceived = newQuantityReceived >= (withdrawalItem.quantity_requested || 0);

              await WithdrawalItem.update(item.linked_item_id, {
                quantity_received: newQuantityReceived,
                line_status: isFullyReceived ? 'delivered' : 'partially_delivered'
              });
              console.log(`[NewDelivery] Updated withdrawal item ${item.linked_item_id}`);
            }
          } else if (actualLinkedOrderId) { // Only update if it's actually linked to an order
            const orderItem = await OrderItem.get(item.linked_item_id);
            if (orderItem) {
              const newQuantityReceived = (orderItem.quantity_received || 0) + parseFloat(item.quantity_received.toString());
              const isFullyReceived = newQuantityReceived >= (orderItem.quantity_ordered || 0);

              await OrderItem.update(item.linked_item_id, {
                quantity_received: newQuantityReceived,
                quantity_remaining: Math.max(0, (orderItem.quantity_ordered || 0) - newQuantityReceived),
                line_status: isFullyReceived ? 'fully_received' : 'partially_received'
              });
              console.log(`[NewDelivery] Updated order item ${item.linked_item_id}`);
            }
          }

          affectedReagentIds.add(item.reagent_id);

        } catch (itemError) {
          console.error(`Error processing delivery item ${item.reagent_name}:`, itemError);
          errors.push(`שגיאה בעיבוד ${item.reagent_name}: ${itemError.message}`);
        }
      }

      // Bulk create collected records after the loop
      if (deliveryItemsToCreate.length > 0) {
        await DeliveryItem.bulkCreate(deliveryItemsToCreate);
        console.log(`[handleSave] Bulk created ${deliveryItemsToCreate.length} Delivery Items`);
      }
      if (inventoryTransactionsToCreate.length > 0) {
        await InventoryTransaction.bulkCreate(inventoryTransactionsToCreate);
        console.log(`[handleSave] Bulk created ${inventoryTransactionsToCreate.length} Inventory Transactions`);
      }
      if (receiptEventsToCreate.length > 0) {
        await ReagentReceiptEvent.bulkCreate(receiptEventsToCreate);
        console.log(`[handleSave] Bulk created ${receiptEventsToCreate.length} Reagent Receipt Events`);
      }

      updateLockProgress(85, 'מעדכן סטטוסים ומלאי...');

      await Delivery.update(newDelivery.id, {
        status: errors.length > 0 ? 'processed_with_errors' : 'processed', // Update final status based on errors
        total_items_received: processedItemsCount
      });

      if (actualLinkedWithdrawalId) {
        await updateWithdrawalStatus(actualLinkedWithdrawalId);
      } else if (actualLinkedOrderId) {
        await updateOrderStatus(actualLinkedOrderId);
      }

      console.log(`🔄 Updating inventory for ${affectedReagentIds.size} affected reagents...`);
      try {
        for (const reagentId of affectedReagentIds) {
          const response = await updateReagentInventory({ reagentId, supplierName: deliveryData.supplier });
          if (response?.data?.success) {
            console.log(`✅ Updated inventory for reagent ${reagentId}`);
          }
        }
        console.log(`✅ Inventory updated for all affected reagents`);
      } catch (inventoryError) {
        console.warn(`⚠️ Could not update inventory automatically:`, inventoryError);
      }

      updateLockProgress(100, 'השלמת תהליך...');
      console.log('[handleSave] Delivery process completed successfully');

      if (errors.length > 0) {
        toast({
          title: `המשלוח הושלם עם ${errors.length} שגיאות`,
          description: `עובדו ${processedItemsCount} פריטים. ${errors.slice(0, 2).join(', ')}. בדוק לוגים לפרטים.`,
          variant: "destructive",
          duration: 8000
        });
      } else {
        toast({
          title: "המשלוח נקלט בהצלחה",
          description: `נוצר משלוח ${newDelivery.delivery_number} עם ${processedItemsCount} פריטים`,
          variant: "default"
        });
      }

      // Show print dialog automatically
      setNewDeliveryId(newDelivery.id);
      setShowPrintDialog(true);

    } catch (error) {
      console.error('Error completing delivery:', error);
      toast({
        title: "שגיאה בשמירת המשלוח",
        description: error.message,
        variant: "destructive"
      });
      setError(error.message);
    } finally {
      setSaving(false);
      clearSystemLock();
    }
  };

  const approvedCount = React.useMemo(() => items.filter(i => i.approved).length, [items]);

  const filteredReagents = useMemo(() => {
    if (!deliveryData.supplier) {
      return [];
    }

    let relevantReagents = reagents.filter(r => r.supplier === deliveryData.supplier);

    if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        relevantReagents = relevantReagents.filter(reagent =>
            (reagent?.name && reagent.name.toLowerCase().includes(searchLower)) ||
            (reagent?.catalog_number && reagent.catalog_number.toLowerCase().includes(searchLower))
        );
    }
    return relevantReagents;
  }, [reagents, deliveryData.supplier, searchTerm]);

  const preFilledSourceInfo = useMemo(() => {
    if (!deliveryData.linked_order_id) return null;
    const [type, id] = deliveryData.linked_order_id.split('_');
    if (type === 'order') {
      const order = availableOrders.find(o => o.id === id);
      if (order) return { type: 'Order', object_type: 'Order', order_number_temp: order.order_number_temp, order_number_permanent: order.order_number_permanent, supplier: order.supplier_name_snapshot, id: order.id };
    } else if (type === 'withdrawal') {
      const withdrawal = activeWithdrawals.find(w => w.id === id);
      if (withdrawal) return { type: 'Withdrawal', object_type: 'Withdrawal', withdrawal_number: withdrawal.withdrawal_number, supplier_snapshot: withdrawal.supplier_snapshot, id: withdrawal.id };
    }
    return null;
  }, [deliveryData.linked_order_id, availableOrders, activeWithdrawals]);

  const hasPreFilledItems = useMemo(() => {
    return items.some(item => item.isPreFilled);
  }, [items]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">טוען נתוני הדף...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 md:p-6" dir="rtl">
      {/* Dialogs and Mobile Filters */}
      <AnimatePresence>
        {isMobileFiltersOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-40 md:hidden"
            onClick={() => setIsMobileFiltersOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute right-0 top-0 h-full w-4/5 max-w-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg shadow-2xl p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <DialogHeader>
                <DialogTitle>סינון פריטים</DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-4">
                {/* Reagent Filter */}
                <p className="text-gray-500">תוכן סינון ריאגנטים יופיע כאן</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-2">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="mr-2" onClick={() => navigate(createPageUrl('Deliveries'))}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg md:text-xl font-bold">
            קליטת משלוח חדש
            {preFilledSourceInfo && (
              <span className="text-lg font-normal text-blue-600 mr-2">
                (מ{preFilledSourceInfo.object_type === 'Order' ? 'הזמנה' : 'בקשת משיכה'}:
                {preFilledSourceInfo.object_type === 'Order' ?
                  (preFilledSourceInfo.order_number_temp || preFilledSourceInfo.order_number_permanent) :
                  preFilledSourceInfo.withdrawal_number
                })
              </span>
            )}
          </h1>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleSaveDelivery(false)} disabled={saving || isLocked || items.length === 0}>
             <Save className="h-4 w-4 ml-2" />
             שמור טיוטה
          </Button>
          <Button
            className="bg-amber-500 hover:bg-amber-600 text-white"
            size="sm"
            onClick={() => handleSaveDelivery(true)}
            disabled={saving || isLocked || items.filter(i => i.approved).length === 0} // Disabled if no items are approved for final save
          >
            {saving ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Check className="h-4 w-4 ml-2" />}
            קבלת המשלוח
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {hasPreFilledItems && preFilledSourceInfo && (
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <Package className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <strong>קליטה מ{preFilledSourceInfo.object_type === 'Order' ? 'הזמנה' : 'בקשת משיכה'}:</strong>
                {preFilledSourceInfo.object_type === 'Order' ?
                  (preFilledSourceInfo.order_number_temp || preFilledSourceInfo.order_number_permanent) :
                  preFilledSourceInfo.withdrawal_number
                }
                <br />
                <span className="text-sm text-gray-600">
                  הפרטים נטענו אוטומטית מ{preFilledSourceInfo.object_type === 'Order' ? 'ההזמנה' : 'בקשת המשיכה'}. אשר כל פריט כדי להעבירו לרשימת הפריטים שהתקבלו.
                </span>
                <br />
                <div className="mt-2 flex gap-2">
                  <Badge variant="outline" className="text-blue-700">
                    ספק: {preFilledSourceInfo.object_type === 'Order' ? preFilledSourceInfo.supplier : preFilledSourceInfo.supplier_snapshot}
                  </Badge>
                  <Badge variant="outline" className="mr-2 text-blue-700">
                    {items.filter(item => item.isPreFilled).length} פריטים נטענו
                  </Badge>
                </div>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Delivery Details Card - Collapsible */}
      <Card className="mb-4 overflow-hidden">
          <CardHeader
              className="p-4 flex flex-row items-center justify-between cursor-pointer hover:bg-slate-50"
              onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
          >
              <div className="flex items-center">
                  <FileText className="h-5 w-5 ml-3" />
                  <CardTitle className="text-base font-semibold">פרטי משלוח</CardTitle>
                  {preFilledSourceInfo && (
                    <Badge className="mr-2 bg-blue-100 text-blue-800">
                      מקושר ל{preFilledSourceInfo.object_type === 'Order' ? 'הזמנה' : 'משיכה'}
                    </Badge>
                  )}
              </div>
              {isHeaderCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
          </CardHeader>
          <AnimatePresence>
              {!isHeaderCollapsed && (
                  <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                  >
                      <CardContent className="p-4 pt-0">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                              {/* Supplier */}
                              <div className="space-y-2 sm:col-span-1">
                                  <Label htmlFor="supplier">ספק *</Label>
                                  <Select
                                      id="supplier"
                                      value={deliveryData.supplier}
                                      onValueChange={(value) => handleDeliveryDataChange('supplier', value)}
                                      disabled={!!preFilledSourceInfo || items.length > 0}
                                      dir="rtl"
                                  >
                                      <SelectTrigger className="text-right justify-start [&>span]:pr-0">
                                          <SelectValue placeholder="יש לבחור ספק" />
                                      </SelectTrigger>
                                      <SelectContent>
                                          {suppliers.map((s) => (
                                              <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                                          ))}
                                      </SelectContent>
                                  </Select>
                                  {!deliveryData.supplier && !preFilledSourceInfo && (
                                      <p className="text-xs text-red-600">שדה חובה - יש לבחור ספק</p>
                                  )}
                                  {preFilledSourceInfo && (
                                      <p className="text-xs text-blue-600">ספק נקבע אוטומטית מ{preFilledSourceInfo.object_type === 'Order' ? 'ההזמנה' : 'המשיכה'} המקושרת</p>
                                  )}
                              </div>

                              {/* Delivery Date */}
                              <div className="space-y-2 sm:col-span-1">
                                  <Label htmlFor="delivery_date">תאריך משלוח</Label>
                                  <DateField
                                      value={deliveryData.delivery_date}
                                      onChange={(val) => handleDeliveryDataChange('delivery_date', val)}
                                      className="text-right"
                                  />
                              </div>

                              {/* מספר תעודת משלוח + העלאת קובץ */}
                              <div className="space-y-2 sm:col-span-2">
                                  <Label htmlFor="delivery_number">מספר תעודת משלוח</Label>
                                  <div className="flex items-center gap-2">
                                       <Input
                                          id="delivery_number"
                                          value={deliveryData.delivery_number}
                                          onChange={(e) => handleDeliveryDataChange('delivery_number', e.target.value)}
                                          placeholder="מספר תעודת משלוח מהספק"
                                          className="text-right placeholder:text-right text-sm flex-grow"
                                       />
                                       <Button asChild variant="ghost" size="icon" title="צרף תעודת משלוח (קובץ או צילום)">
                                         <Label htmlFor="delivery_certificate" className="cursor-pointer">
                                           <Paperclip className="h-5 w-5 text-gray-600" />
                                         </Label>
                                       </Button>
                                       <Input
                                          id="delivery_certificate"
                                          type="file"
                                          className="hidden"
                                          onChange={(e) => setDeliveryCertificate(e.target.files ? e.target.files[0] : null)}
                                          accept="image/*,application/pdf"
                                       />
                                       {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                                  </div>
                                  {deliveryCertificate && <span className="text-xs text-gray-500 truncate block">{deliveryCertificate.name}</span>}
                              </div>

                              {/* סוג משלוח ומקור מקושר - משולב */}
                              <div className="space-y-2 sm:col-span-2">
                                  <Label htmlFor="delivery_type">קישור למסמך מקור (אופציונלי)</Label>
                                  <div className="flex gap-2">
                                    <Select
                                      id="delivery_type"
                                      value={deliveryData.delivery_type}
                                      onValueChange={(value) => handleDeliveryDataChange('delivery_type', value)}
                                      disabled={!!preFilledSourceInfo}
                                      className="w-1/3"
                                    >
                                      <SelectTrigger className="text-right justify-start [&>span]:pr-0">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="with_order">עם מסמך רכש</SelectItem>
                                        <SelectItem value="withdrawal">משיכה</SelectItem>
                                        <SelectItem value="no_charge">ללא חיוב</SelectItem>
                                        <SelectItem value="replacement">החלפה</SelectItem>
                                        <SelectItem value="other">אחר</SelectItem>
                                      </SelectContent>
                                    </Select>

                                    {(deliveryData.delivery_type === 'with_order' || deliveryData.delivery_type === 'withdrawal') && (
                                      <Select
                                        value={deliveryData.linked_order_id || 'no-link'}
                                        onValueChange={handleLinkedSourceSelection}
                                        disabled={!!preFilledSourceInfo}
                                        className="w-2/3"
                                      >
                                        <SelectTrigger className="text-right justify-start [&>span]:pr-0">
                                          <SelectValue placeholder="בחר מסמך לקישור" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="no-link">ללא קישור למסמך</SelectItem>
                                          {availableOrders
                                            .filter(order => order && (
                                              order.status === 'approved' ||
                                              order.status === 'partially_received' ||
                                              order.status === 'pending_sap_permanent_id' ||
                                              order.status === 'pending_sap_po_number'
                                            ))
                                            .map(order => (
                                              <SelectItem key={`order_${order.id}`} value={`order_${order.id}`}>
                                                הזמנה: {order.order_number_temp || order.order_number_permanent} - {order.supplier_name_snapshot}
                                                {order.purchase_order_number_sap && ` (${order.purchase_order_number_sap})`}
                                              </SelectItem>
                                            ))}
                                          {activeWithdrawals
                                            .filter(wr => wr && (wr.status === 'submitted' || wr.status === 'approved' || wr.status === 'in_delivery'))
                                            .map(wr => (
                                              <SelectItem key={`withdrawal_${wr.id}`} value={`withdrawal_${wr.id}`}>
                                                משיכה: {wr.withdrawal_number} - {wr.supplier_snapshot || 'לא ידוע'}
                                              </SelectItem>
                                            ))}
                                        </SelectContent>
                                      </Select>
                                    )}
                                  </div>
                              </div>

                              <div className="space-y-2 sm:col-span-2">
                                  <Label htmlFor="order_number">מספר מסמך רכש/משיכה</Label>
                                  <Input
                                    id="order_number"
                                    value={deliveryData.order_number}
                                    onChange={(e) => handleDeliveryDataChange('order_number', e.target.value)}
                                    placeholder="מספר דרישה זמני או קבוע"
                                    className="text-right placeholder:text-right"
                                    disabled={!!preFilledSourceInfo}
                                  />
                              </div>

                              <div className="space-y-2 sm:col-span-2">
                                  <Label htmlFor="notes">הערות</Label>
                                  <Textarea
                                    id="notes"
                                    value={deliveryData.notes}
                                    onChange={(e) => handleDeliveryDataChange('notes', e.target.value)}
                                    placeholder="הערות נוספות למשלוח"
                                    className="text-right placeholder:text-right"
                                  />
                              </div>
                          </div>
                      </CardContent>
                  </motion.div>
              )}
          </AnimatePresence>
      </Card>

      {/* Items Section */}
      <Card>
        <CardHeader>
          <div className="mb-4">
            <CardTitle className="flex items-center mb-2">
              <Package className="h-5 w-5 ml-2" />
              קליטת פריטים ({approvedCount})
            </CardTitle>
            <div className="flex gap-2 justify-start">
              <Button onClick={addItem} size="sm" title="הוסף פריט" className="px-3" disabled={!deliveryData.supplier}>
                <div className="flex items-center gap-1">
                  <Plus className="h-4 w-4" />
                  <Package className="h-4 w-4" />
                </div>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px] pr-4">
            <div className="p-4">
              {items.length === 0 ? (
                <NoItemsRow onAddItem={addItem} supplierSelected={!!deliveryData.supplier} />
              ) : (
                items.map((item, index) => (
                  <DeliveryItemRow
                    key={item.key}
                    item={item}
                    index={index}
                    updateItem={updateItem}
                    deleteItem={deleteItem}
                    toggleApprove={toggleApprove}
                    reagents={reagents}
                    validationState={validationState}
                    setCurrentItemKeyForSearch={setCurrentItemKeyForSearch}
                    setShowItemSearch={setShowItemSearch}
                    deliveryData={deliveryData}
                    toast={toast}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
        {/* CardFooter removed as per outline, actions moved to header/mobile bar */}
      </Card>

      <Dialog open={showItemSearch} onOpenChange={setShowItemSearch}>
        <DialogContent className="max-w-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg shadow-2xl">
          <DialogHeader>
            <DialogTitle>
              בחר ריאגנט
              {deliveryData.supplier ? (
                <span className="text-sm font-normal text-gray-600 mr-2">
                  (מסונן לספק: {deliveryData.supplier})
                </span>
              ) : (
                <span className="text-sm font-normal text-red-600 mr-2">
                  (יש לבחור ספק תחילה)
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <Input
            placeholder={deliveryData.supplier ? "חפש ריאגנט לפי שם או מקט..." : "יש לבחור ספק תחילה"}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4 text-right placeholder:text-right"
            disabled={!deliveryData.supplier}
          />
          <ScrollArea className="h-[300px]">
            {filteredReagents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {!deliveryData.supplier ?
                  "יש לבחור ספק תחילה כדי לראות ריאגנטים זמינים" :
                  searchTerm === '' ?
                    "לא נמצאו ריאגנטים מהספק הנבחר." :
                    "לא נמצאו ריאגנטים מתאימים"
                }
              </div>
            ) : (
              filteredReagents.map(reagent => {
                let quantityInfo = '';
                const linkedItem = items.find(item => item.isPreFilled && item.reagent_id === reagent.id);
                if (linkedItem) {
                  quantityInfo = ` | יתרה זמינה: ${formatQuantity(linkedItem.quantity_remaining_snapshot)}`;
                }

                return (
                  <div
                    key={reagent.id}
                    className="p-2 hover:bg-gray-100 cursor-pointer rounded-md border mb-2"
                    onClick={() => handleReagentSelection(reagent)}
                  >
                    <div className="font-medium">
                      {reagent.name}
                      {reagent.category === 'consumables' && (
                        <span className="text-xs text-blue-600 bg-blue-50 px-1 py-0.5 rounded mr-2">
                          מתכל
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      ספק: {reagent.supplier} | קטלוג: {reagent.catalog_item_id}
                      {reagent.total_quantity_all_batches !== undefined && ` | מלאי כולל: ${formatQuantity(reagent.total_quantity_all_batches || 0)}`}
                      {quantityInfo && (
                        <span className="text-blue-600 font-medium">
                          {quantityInfo}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showNoBalanceAlert} onOpenChange={setShowNoBalanceAlert}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>קליטת פריט ללא יתרה</AlertDialogTitle>
            <AlertDialogDescription>
              לא קיימת יתרה פתוחה לקליטה עבור פריט זה ({itemToApprove?.reagent_name}).
              <br/>
              האם ברצונך לקלוט את הפריט ללא עלות? פעולה זו תעדכן את המלאי אך לא תחויב במסמך המקור.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToApprove(null)}>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleApproveConfirmation} className="bg-blue-600 hover:bg-blue-700">
              כן, קלוט ללא עלות
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mobile Action Buttons */}
      <div className="sm:hidden mt-4 p-2 bg-white/80 backdrop-blur-md border-t border-gray-200 sticky bottom-0 z-10">
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => handleSaveDelivery(false)} disabled={saving || isLocked || items.length === 0}>
             <Save className="h-4 w-4 ml-2" />
             שמור טיוטה
          </Button>
          <Button
            className="bg-amber-500 hover:bg-amber-600 text-white"
            onClick={() => handleSaveDelivery(true)}
            disabled={saving || isLocked || items.filter(i => i.approved).length === 0} // Disabled if no items are approved for final save
          >
            {saving ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Check className="h-4 w-4 ml-2" />}
            קבלת המשלוח
          </Button>
        </div>
      </div>

      {/* Add Print Dialog */}
      <PrintDialog
        isOpen={showPrintDialog}
        onClose={() => {
          setShowPrintDialog(false);
          setNewDeliveryId(null);
          resetForm();
          navigate(createPageUrl('Deliveries'));
        }}
        documentId={newDeliveryId}
        documentType="delivery"
        title="תעודת קליטת משלוח חדשה"
      />
    </div>
  );
}
