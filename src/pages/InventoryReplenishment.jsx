import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from "@/components/ui/use-toast";
import { Loader2, RefreshCw, Search, SlidersHorizontal, FileDown, Trash2, ArrowDownToLine, ChevronDown, ChevronUp, AlertCircle, Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { addDays, isBefore, parseISO } from 'date-fns';
import { formatQuantity } from "@/components/utils/formatters";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import BackButton from '@/components/ui/BackButton';
import PrintDialog from '@/components/ui/PrintDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { base44 } from '@/api/base44Client';
import SmartTooltip from '@/components/ui/SmartTooltip';
import TableHeaderTooltip from '@/components/ui/TableHeaderTooltip';
import { COLUMN_DESCRIPTIONS } from '@/components/utils/tooltipDescriptions';

const calculateSuggestionsLogic = (
    reagentsToProcess, 
    allBatches, 
    allFrameworkOrderItems, 
    allOpenOrders, 
    params, 
    pendingWithdrawalByReagent = {}, 
    inDeliveryByReagent = {},
    quantityInTransitByReagent = {},
    quantityInTransitWithoutTempByReagent = {}
) => {
    if (!reagentsToProcess || reagentsToProcess.length === 0) return [];

    const today = new Date();
    const nearExpiryLimit = addDays(today, 30);
    const planningHorizonMonths = (params?.planningHorizonWeeks / 4.33) || 3;

    return reagentsToProcess.map(reagent => {
        const batchesForReagent = (allBatches || []).filter(b => b.reagent_id === reagent.id);
        const currentStock = batchesForReagent.reduce((sum, b) => sum + (b.current_quantity || 0), 0);
        
        const nearExpiryBatchesForReagent = batchesForReagent.filter(b => b.expiry_date && isBefore(parseISO(b.expiry_date), nearExpiryLimit));
        const nearExpiryQuantity = nearExpiryBatchesForReagent.reduce((sum, b) => sum + (b.current_quantity || 0), 0);

        const frameworkOrderItems = (allFrameworkOrderItems || []).filter(item => item.reagent_id === reagent.id);
        const availableFromFramework = frameworkOrderItems.reduce((sum, item) => {
            const remaining = (item.quantity_ordered || 0) - (item.quantity_received || 0);
            return sum + Math.max(0, remaining);
        }, 0);
        
        const detailedFrameworkItems = frameworkOrderItems.map(item => ({
          orderNumber: (allOpenOrders || []).find(o => o.id === item.order_id)?.order_number_permanent || 'N/A',
          orderId: item.order_id,
          remaining: Math.max(0, (item.quantity_ordered || 0) - (item.quantity_received || 0))
        })).filter(item => item.remaining > 0);

        const effectiveMonthlyUsage = reagent.use_manual_usage && reagent.manual_monthly_usage > 0 ? reagent.manual_monthly_usage : (reagent.average_monthly_usage || 0);
        const months_of_stock = effectiveMonthlyUsage > 0 ? currentStock / effectiveMonthlyUsage : Infinity;

        let current_stock_status = 'in_stock';
        if (currentStock === 0) current_stock_status = 'out_of_stock';
        else if (months_of_stock < 1) current_stock_status = 'low_stock';

        const planningHorizonUsage = effectiveMonthlyUsage * planningHorizonMonths;
        const safetyStockUsage = (effectiveMonthlyUsage / 4.33) * 2;
        const totalRequired = planningHorizonUsage + safetyStockUsage;
        
        const totalInTransit = quantityInTransitByReagent[reagent.id] || 0;
        const netStock = currentStock + totalInTransit;
        let suggestedQuantity = Math.round(totalRequired - netStock);
        if (suggestedQuantity < 0) suggestedQuantity = 0;

        const totalInTransitWithoutTemp = quantityInTransitWithoutTempByReagent[reagent.id] || 0;
        const netStockWithoutTemp = currentStock + totalInTransitWithoutTemp;
        let suggestedQuantityWithoutTemp = Math.round(totalRequired - netStockWithoutTemp);
        if (suggestedQuantityWithoutTemp < 0) suggestedQuantityWithoutTemp = 0;

        const quantityInPendingWithdrawals = pendingWithdrawalByReagent[reagent.id] || 0;
        const quantityInDelivery = inDeliveryByReagent[reagent.id] || 0;

        return {
            ...reagent,
            total_quantity_all_batches: currentStock,
            current_stock_status,
            months_of_stock,
            suggested_order_quantity: suggestedQuantity,
            suggested_order_quantity_without_temp: suggestedQuantityWithoutTemp,
            has_temporary_orders: suggestedQuantity !== suggestedQuantityWithoutTemp,
            available_framework_quantity: availableFromFramework,
            detailed_framework_items: detailedFrameworkItems,
            quantity_in_transit: totalInTransit,
            effective_monthly_usage: effectiveMonthlyUsage,
            near_expiry_quantity: nearExpiryQuantity,
            quantity_in_pending_withdrawals: quantityInPendingWithdrawals,
            quantity_in_delivery: quantityInDelivery
        };
    });
};

export default function InventoryReplenishmentPage() {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [rawReagents, setRawReagents] = useState([]);
    const [allBatches, setAllBatches] = useState([]);
    const [allOpenOrderItems, setAllOpenOrderItems] = useState([]);
    const [allPendingWithdrawalItems, setAllPendingWithdrawalItems] = useState([]);
    const [allOpenOrders, setAllOpenOrders] = useState([]);
    const [allFrameworkOrderItems, setAllFrameworkOrderItems] = useState([]);
    const [processedReagents, setProcessedReagents] = useState([]);
    const [filteredReagents, setFilteredReagents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [supplierFilter, setSupplierFilter] = useState('all');
    const [availableFrameworkFilter, setAvailableFrameworkFilter] = useState('all');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedReagents, setSelectedReagents] = useState(new Set());
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
    const [showOrderTypeDialog, setShowOrderTypeDialog] = useState(false);
    const [processingItems, setProcessingItems] = useState([]);

    const [pendingWithdrawalByReagentState, setPendingWithdrawalByReagentState] = useState({});
    const [inDeliveryByReagentState, setInDeliveryByReagentState] = useState({});
    const [quantityInTransitByReagentState, setQuantityInTransitByReagentState] = useState({});
    const [quantityInTransitWithoutTempByReagentState, setQuantityInTransitWithoutTempByReagentState] = useState({});
    
    const [showMissingDetailsDialog, setShowMissingDetailsDialog] = useState(false);
    const [pendingWithdrawalAction, setPendingWithdrawalAction] = useState(null);

    const [showPrintDialog, setShowPrintDialog] = useState(false);
    const [printDocumentId, setPrintDocumentId] = useState(null);
    const [printDocumentType, setPrintDocumentType] = useState(null);

    const [columnWidths, setColumnWidths] = useState(() => {
        try {
            const stored = localStorage.getItem('inventoryReplenishment_columnWidths');
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.error('Failed to parse column widths from localStorage', e);
        }
        return {
            selection: 50,
            name: 250,
            effective_monthly_usage: 120,
            total_quantity_all_batches: 120,
            months_of_stock: 120,
            available_framework_quantity: 120,
            suggested_order_quantity: 150
        };
    });

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await base44.functions.invoke('getReplenishmentData', {});
            if (response.data && !response.data.error) {
                const {
                    reagentsData = [], 
                    batchesData = [], 
                    openOrderItemsData = [],
                    withdrawalRequestsData = [], 
                    openOrdersData = [], 
                    frameworkOrdersData = [],
                    frameworkOrderItemsData = [],
                    pendingWithdrawalByReagent = {},
                    inDeliveryByReagent = {},
                    quantityInTransitByReagent = {},
                    quantityInTransitWithoutTempByReagent = {}
                } = response.data;

                setRawReagents(Array.isArray(reagentsData) ? reagentsData : []);
                setAllBatches(Array.isArray(batchesData) ? batchesData : []);
                setAllOpenOrderItems(Array.isArray(openOrderItemsData) ? openOrderItemsData : []);
                setAllPendingWithdrawalItems(Array.isArray(withdrawalRequestsData) ? withdrawalRequestsData : []);
                setAllOpenOrders([
                    ...(Array.isArray(openOrdersData) ? openOrdersData : []), 
                    ...(Array.isArray(frameworkOrdersData) ? frameworkOrdersData : [])
                ]);
                setAllFrameworkOrderItems(Array.isArray(frameworkOrderItemsData) ? frameworkOrderItemsData : []);
                setPendingWithdrawalByReagentState(pendingWithdrawalByReagent || {});
                setInDeliveryByReagentState(inDeliveryByReagent || {});
                setQuantityInTransitByReagentState(quantityInTransitByReagent || {});
                setQuantityInTransitWithoutTempByReagentState(quantityInTransitWithoutTempByReagent || {});
            } else {
                throw new Error(response.data?.error || "No data returned from server function.");
            }
        } catch (err) {
            console.error('[InventoryReplenishment] Error:', err);
            setError(`שגיאה בטעינת נתונים: ${err.message}`);
            toast({
                title: "שגיאה בטעינת נתונים",
                description: err.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    }, [fetchData]);

    useEffect(() => {
        handleRefresh();
    }, [handleRefresh]);

    useEffect(() => {
        if (loading || !rawReagents || rawReagents.length === 0) return;
        const timer = setTimeout(() => {
            const suggestions = calculateSuggestionsLogic(
                rawReagents,
                allBatches,
                allFrameworkOrderItems,
                allOpenOrders,
                { planningHorizonWeeks: 12 },
                pendingWithdrawalByReagentState,
                inDeliveryByReagentState,
                quantityInTransitByReagentState,
                quantityInTransitWithoutTempByReagentState
            );
            setProcessedReagents(Array.isArray(suggestions) ? suggestions : []);
        }, 50);
        return () => clearTimeout(timer);
    }, [loading, rawReagents, allBatches, allFrameworkOrderItems, allOpenOrders, pendingWithdrawalByReagentState, inDeliveryByReagentState, quantityInTransitByReagentState, quantityInTransitWithoutTempByReagentState]);

    useEffect(() => {
        let result = Array.isArray(processedReagents) ? [...processedReagents] : [];

        if (searchTerm) {
            result = result.filter(r =>
                (r.name && r.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (r.catalog_number && r.catalog_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (r.supplier && r.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        if (filter === 'suggested') result = result.filter(r => r.suggested_order_quantity > 0);
        else if (filter === 'low_stock') result = result.filter(r => r.current_stock_status === 'low_stock' || r.current_stock_status === 'out_of_stock');
        else if (filter === 'out_of_stock') result = result.filter(r => r.current_stock_status === 'out_of_stock');

        if (categoryFilter !== 'all') result = result.filter(r => r.category === categoryFilter);
        if (supplierFilter !== 'all') result = result.filter(r => r.supplier === supplierFilter);
        
        if (availableFrameworkFilter === 'with_framework') {
            result = result.filter(r => {
                const netAvailable = (r.available_framework_quantity || 0) - (r.quantity_in_pending_withdrawals || 0) - (r.quantity_in_delivery || 0);
                return netAvailable > 0;
            });
        } else if (availableFrameworkFilter === 'without_framework') {
            result = result.filter(r => {
                const netAvailable = (r.available_framework_quantity || 0) - (r.quantity_in_pending_withdrawals || 0) - (r.quantity_in_delivery || 0);
                return netAvailable <= 0;
            });
        }

        if (sortConfig.key) {
            result.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                if (typeof aValue === 'string' && typeof bValue === 'string') return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        setFilteredReagents(result);
    }, [filter, searchTerm, categoryFilter, supplierFilter, availableFrameworkFilter, processedReagents, sortConfig]);

    const handleSelectReagent = useCallback((reagentId, initialSuggestedQuantity) => {
        setSelectedReagents(prev => {
            const newSet = new Set(prev);
            const existingItem = [...newSet].find(item => item.id === reagentId);
            if (existingItem) {
                newSet.delete(existingItem);
            } else {
                const currentQuantity = (processedReagents || []).find(r => r.id === reagentId)?.suggested_order_quantity || initialSuggestedQuantity;
                newSet.add({ id: reagentId, quantity: currentQuantity });
            }
            return newSet;
        });
    }, [processedReagents]);

    const handleSelectAllFiltered = useCallback(() => {
        setSelectedReagents(prev => {
            if (prev.size === filteredReagents.length && filteredReagents.length > 0) {
                return new Set();
            }
            return new Set((filteredReagents || []).map(r => ({ id: r.id, quantity: r.suggested_order_quantity })));
        });
    }, [filteredReagents]);

    const clearSelection = useCallback(() => setSelectedReagents(new Set()), []);

    const handleQuantityChange = useCallback((reagentId, newQuantity) => {
        const parsedQuantity = Math.max(0, Number(newQuantity) || 0);
        
        setProcessedReagents(prevReagents => 
            (prevReagents || []).map(r => r.id === reagentId ? { ...r, suggested_order_quantity: parsedQuantity } : r)
        );

        setSelectedReagents(prevSelected => {
            const newSet = new Set(prevSelected);
            const existingItem = [...newSet].find(item => item.id === reagentId);
            if (existingItem) {
                newSet.delete(existingItem);
                newSet.add({ id: reagentId, quantity: parsedQuantity });
            }
            return newSet;
        });
    }, []);

    const handleSort = useCallback((key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    }, []);

    const createDocument = async (documentType) => {
        const items = Array.from(selectedReagents).map(selected => {
            const reagent = (processedReagents || []).find(r => r.id === selected.id);
            return { ...reagent, quantity: selected.quantity };
        }).filter(item => (item.quantity || 0) > 0);

        if (items.length === 0) {
            return toast({ title: 'לא נבחרו פריטים', description: 'יש לבחור לפחות פריט אחד עם כמות גדולה מ-0.', variant: 'destructive' });
        }
        
        const suppliers = [...new Set(items.map(item => item.supplier))];
        if (suppliers.length > 1) {
            return toast({ title: 'ספקים מרובים', description: 'יש לבחור פריטים מספק אחד בלבד.', variant: 'destructive' });
        }

        if (documentType === 'withdrawal') {
            await handleWithdrawalCreation(items, suppliers[0]);
        } else {
            setProcessingItems(items);
            setShowOrderTypeDialog(true);
        }
    };

    const handleWithdrawalCreation = async (items, supplier) => {
        try {
            setLoading(true);

            if (!items || items.length === 0) {
                toast({ 
                    title: 'לא נבחרו פריטים', 
                    description: 'יש לבחור לפחות פריט אחד למשיכה.', 
                    variant: 'destructive' 
                });
                setLoading(false);
                return;
            }

            for (const item of items) {
                const processedReagent = (processedReagents || []).find(r => r.id === item.id);
                const netAvailable = (processedReagent?.available_framework_quantity || 0) - (processedReagent?.quantity_in_pending_withdrawals || 0) - (processedReagent?.quantity_in_delivery || 0);
                if (netAvailable < item.quantity) {
                    toast({ 
                        title: 'יתרה לא מספקת', 
                        description: `לפריט ${item.name} חסרות יתרות זמינות ממסגרת עבור הכמות המבוקשת.`, 
                        variant: 'destructive' 
                    });
                    setLoading(false);
                    return;
                }
            }

            const relevantFrameworkOrders = (allOpenOrders || []).filter(o => 
                o.order_type === 'framework' && 
                o.supplier_name_snapshot === supplier && 
                [
                    'approved', 
                    'partially_received', 
                    'pending_sap_details', 
                    'pending_sap_permanent_id', 
                    'pending_sap_po_number'
                ].includes(o.status)
            );

            if (relevantFrameworkOrders.length === 0) {
                toast({ 
                    title: 'לא נמצאה הזמנת מסגרת', 
                    description: `לא קיימת הזמנת מסגרת (גם לא זמנית) עבור ספק ${supplier}.`, 
                    variant: 'destructive' 
                });
                setLoading(false);
                return;
            }

            let selectedFrameworkOrder = null;

            for (const order of relevantFrameworkOrders) {
                const canSupplyAll = items.every(itm => {
                    const fwItem = (allFrameworkOrderItems || []).find(foi => 
                        foi.order_id === order.id && foi.reagent_id === itm.id
                    );
                    if (!fwItem) return false;
                    const remaining = (fwItem.quantity_ordered || 0) - (fwItem.quantity_received || 0);
                    return remaining >= itm.quantity;
                });

                if (canSupplyAll) {
                    selectedFrameworkOrder = order;
                    break;
                }
            }

            if (!selectedFrameworkOrder) {
                toast({ 
                    title: 'לא נמצאה הזמנת מסגרת מתאימה', 
                    description: `לא נמצאה הזמנת מסגרת אחת שיכולה לספק את כל הפריטים שנבחרו מספק ${supplier}.`, 
                    variant: 'destructive' 
                });
                setLoading(false);
                return;
            }

            const hasPermanentNumber = selectedFrameworkOrder.order_number_permanent && selectedFrameworkOrder.order_number_permanent.trim() !== '';
            const hasPONumber = selectedFrameworkOrder.purchase_order_number_sap && selectedFrameworkOrder.purchase_order_number_sap.trim() !== '';

            if (!hasPermanentNumber && !hasPONumber) {
                setPendingWithdrawalAction({ 
                    frameworkOrderId: selectedFrameworkOrder.id,
                    frameworkOrderNumber: selectedFrameworkOrder.order_number_temp,
                    items: items.map(item => ({ 
                        reagent_id: item.id, 
                        reagent_name: item.name, 
                        quantity: item.quantity 
                    }))
                });
                setShowMissingDetailsDialog(true);
                setLoading(false);
                return;
            }

            await executeWithdrawalCreation(selectedFrameworkOrder.id, items);

        } catch (error) {
            console.error('Error in handleWithdrawalCreation:', error);
            toast({
                title: "שגיאה ביצירת משיכה",
                description: error.message,
                variant: "destructive"
            });
            setLoading(false);
        }
    };

    const executeWithdrawalCreation = async (frameworkOrderId, items) => {
        try {
            setLoading(true);

            const itemsPayload = items.map(item => ({
                reagent_id: item.id,
                reagent_name: item.name,
                quantity: item.quantity
            }));

            const response = await base44.functions.invoke('createAutomaticWithdrawal', {
                frameworkOrderId: frameworkOrderId,
                items: itemsPayload,
                urgencyLevel: 'routine'
            });

            if (response.data?.success) {
                const newWithdrawalId = response.data.withdrawalId;
                const newWithdrawalNumber = response.data.withdrawalNumber;

                toast({
                    title: "משיכה נוצרה בהצלחה",
                    description: `משיכה ${newWithdrawalNumber} נוצרה בהצלחה.`
                });

                setSelectedReagents(new Set());
                await handleRefresh();

                navigate(createPageUrl(`EditWithdrawalRequest?id=${newWithdrawalId}`));
                
                setTimeout(() => {
                    setShowPrintDialog(true);
                    setPrintDocumentId(newWithdrawalId);
                    setPrintDocumentType('withdrawal');
                }, 500);
            } else {
                throw new Error(response.data?.error || 'Failed to create withdrawal');
            }
        } catch (error) {
            console.error('Error in executeWithdrawalCreation:', error);
            toast({
                title: "שגיאה ביצירת משיכה",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleOrderCreation = async (orderType) => {
        setShowOrderTypeDialog(false);
        
        try {
            setLoading(true);
            
            const supplier = processingItems[0].supplier;
            const response = await base44.functions.invoke('createAutomaticOrder', {
                supplier,
                orderType,
                items: processingItems.map(item => ({
                    reagent_id: item.id,
                    reagent_name: item.name,
                    catalog_number: item.catalog_number,
                    quantity: item.quantity,
                    cost_per_unit: item.unit_cost || null
                }))
            });

            if (response.data.success) {
                toast({
                    title: "דרישת רכש נוצרה בהצלחה",
                    description: `מספר דרישה: ${response.data.orderNumber} - עובר לעריכת הדרישה`,
                });

                clearSelection();
                
                navigate(createPageUrl('EditOrder') + `?orderId=${response.data.orderId}`);
                
                setTimeout(() => {
                    setShowPrintDialog(true);
                    setPrintDocumentId(response.data.orderId);
                    setPrintDocumentType('order');
                }, 500);
            } else {
                throw new Error(response.data.error || "יצירת דרישה נכשלה");
            }
        } catch (error) {
            console.error('Error in handleOrderCreation:', error);
            toast({
                title: "שגיאה ביצירת דרישה",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleProceedWithMissingDetails = async () => {
        if (pendingWithdrawalAction) {
            setShowMissingDetailsDialog(false);
            await executeWithdrawalCreation(
                pendingWithdrawalAction.frameworkOrderId,
                pendingWithdrawalAction.items
            );
            setPendingWithdrawalAction(null);
        }
    };

    const handleCancelMissingDetails = () => {
        setShowMissingDetailsDialog(false);
        setPendingWithdrawalAction(null);
        setLoading(false);
    };

    const handlePrintDialogClose = () => {
        setShowPrintDialog(false);
        setPrintDocumentId(null);
        setPrintDocumentType(null);
    };

    const columns = useMemo(() => [
        { id: 'selection', header: '', width: 50, disableSort: true },
        { id: 'name', header: 'שם פריט', width: 250, description: COLUMN_DESCRIPTIONS.inventoryReplenishment.name },
        { id: 'effective_monthly_usage', header: 'צריכה חודשית', width: 120, description: COLUMN_DESCRIPTIONS.inventoryReplenishment.effective_monthly_usage },
        { id: 'total_quantity_all_batches', header: 'מלאי נוכחי', width: 120, description: COLUMN_DESCRIPTIONS.inventoryReplenishment.total_quantity_all_batches },
        { id: 'months_of_stock', header: 'חודשי מלאי', width: 120, description: COLUMN_DESCRIPTIONS.inventoryReplenishment.months_of_stock },
        { id: 'available_framework_quantity', header: 'יתרות זמינות', width: 120, description: COLUMN_DESCRIPTIONS.inventoryReplenishment.available_framework_quantity },
        { id: 'suggested_order_quantity', header: 'כמות מוצעת', width: 150, description: COLUMN_DESCRIPTIONS.inventoryReplenishment.suggested_order_quantity }
    ], []);

    const itemsWithTemporaryOrders = useMemo(() => {
        return (filteredReagents || []).filter(r => r.has_temporary_orders).length;
    }, [filteredReagents]);

    useEffect(() => {
        try {
            localStorage.setItem('inventoryReplenishment_columnWidths', JSON.stringify(columnWidths));
        } catch (e) {
            console.error('Failed to save column widths to localStorage', e);
        }
    }, [columnWidths]);

    const ResizableHeader = ({ column, children }) => {
        const resizerRef = useRef(null);
        
        const onMouseDown = (e) => {
            e.preventDefault();
            const startX = e.clientX;
            const startWidth = columnWidths[column.id];
            
            const onMouseMove = (moveEvent) => {
                const diff = startX - moveEvent.clientX;
                const newWidth = Math.max(startWidth + diff, 50);
                setColumnWidths(prev => ({...prev, [column.id]: newWidth}));
            };
            
            const onMouseUp = () => {
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
            };
            
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        };
        
        return (
            <div className="relative p-0" style={{ width: columnWidths[column.id] }}>
                <div className="flex items-center justify-center h-full px-3 py-3 font-medium text-slate-600 text-center">
                    {children}
                </div>
                {!column.disableSort && (
                    <div 
                        ref={resizerRef} 
                        onMouseDown={onMouseDown} 
                        className="absolute top-0 left-0 h-full w-2 cursor-col-resize hover:bg-blue-400/30 transition-colors"
                    />
                )}
            </div>
        );
    };

    const availableCategories = useMemo(() => [...new Set((processedReagents || []).map(r => r.category).filter(Boolean))].sort(), [processedReagents]);
    const availableSuppliers = useMemo(() => [...new Set((processedReagents || []).map(r => r.supplier).filter(Boolean))].sort(), [processedReagents]);
    
    const clearAllFilters = () => { 
        setSearchTerm(''); 
        setFilter('all'); 
        setCategoryFilter('all'); 
        setSupplierFilter('all'); 
        setAvailableFrameworkFilter('all');
    };

    if (loading && !refreshing) return <div className="flex items-center justify-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-amber-500" /></div>;
    if (error) return <div className="p-6 text-center"><AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" /><h2 className="text-xl font-semibold text-red-700">שגיאה בטעינת הנתונים</h2><p className="text-gray-600 mt-2">{error}</p><Button onClick={handleRefresh} className="mt-4 bg-amber-500 hover:bg-amber-600"><RefreshCw className="h-4 w-4 ml-2" />נסה שוב</Button></div>;

    return (
        <>
            <div className="p-4 md:p-6 min-h-screen bg-slate-50" dir="rtl">
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <BackButton />
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-slate-800">חישוב והשלמת מלאי</h1>
                                <div className="flex items-center gap-3 mt-1">
                                    <p className="text-sm text-slate-500">
                                        מציג {filteredReagents.length} פריטים | {selectedReagents.size} נבחרו
                                    </p>
                                    {itemsWithTemporaryOrders > 0 && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-medium cursor-help">
                                                        <Info className="h-3 w-3" />
                                                        <span>{itemsWithTemporaryOrders} עם הזמנות זמניות</span>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-xs text-right" dir="rtl">
                                                    <p className="text-sm">
                                                        {itemsWithTemporaryOrders} פריטים מוצגים עם כמות מוצעת המתחשבת בדרישות רכש זמניות (ללא מספר קבוע). 
                                                        המספר בסוגריים מציג את הכמות ללא התחשבות בדרישות אלו.
                                                    </p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="hidden md:flex items-center gap-2">
                            <Button onClick={handleRefresh} variant="outline" size="sm" className="h-9" disabled={refreshing}><RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /></Button>
                            <Button onClick={() => createDocument('withdrawal')} disabled={selectedReagents.size === 0} variant="outline" className="bg-blue-600 hover:bg-blue-700 text-white h-9"><ArrowDownToLine className="h-4 w-4 ml-2" /> צור משיכה</Button>
                            <Button onClick={() => createDocument('order')} disabled={selectedReagents.size === 0} className="bg-amber-500 hover:bg-amber-600 h-9"><FileDown className="h-4 w-4 ml-2" /> צור דרישה</Button>
                        </div>
                    </div>

                    <Card className="p-4 bg-white/90 backdrop-blur-sm shadow-sm">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-grow">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input placeholder="חפש ריאגנט..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pr-10"/>
                            </div>
                            <Select value={filter} onValueChange={setFilter}>
                                <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="סנן לפי..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">הצג הכל</SelectItem>
                                    <SelectItem value="suggested">הצג מוצעים להזמנה</SelectItem>
                                    <SelectItem value="low_stock">מלאי נמוך</SelectItem>
                                    <SelectItem value="out_of_stock">אזל מהמלאי</SelectItem>
                                </SelectContent>
                            </Select>
                            <Popover open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline">
                                        <SlidersHorizontal className="h-4 w-4 ml-2" />
                                        סינון מתקדם
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80" align="end">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-medium">סינון מתקדם</h4>
                                            <Button variant="ghost" size="sm" onClick={clearAllFilters}>נקה הכל</Button>
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <Label>קטגוריה</Label>
                                                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                                    <SelectTrigger><SelectValue placeholder="כל הקטגוריות" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">כל הקטגוריות</SelectItem>
                                                        {availableCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label>ספק</Label>
                                                <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                                                    <SelectTrigger><SelectValue placeholder="כל הספקים" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">כל הספקים</SelectItem>
                                                        {availableSuppliers.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label className="flex items-center gap-2">
                                                    יתרות זמינות
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Info className="h-3 w-3 text-slate-400 cursor-help" />
                                                            </TooltipTrigger>
                                                            <TooltipContent className="max-w-xs text-right" dir="rtl">
                                                                <p className="text-sm">
                                                                    סנן פריטים לפי קיום יתרות זמינות למשיכה מהזמנות מסגרת (מתאים במיוחד למובייל)
                                                                </p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </Label>
                                                <Select value={availableFrameworkFilter} onValueChange={setAvailableFrameworkFilter}>
                                                    <SelectTrigger><SelectValue placeholder="כל הפריטים" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">כל הפריטים</SelectItem>
                                                        <SelectItem value="with_framework">
                                                            <div className="flex items-center gap-2">
                                                                <span>עם יתרות זמינות</span>
                                                                <span className="text-xs text-blue-600">✓</span>
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="without_framework">ללא יתרות זמינות</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            {isMobile && (
                                                <div>
                                                    <Label>מיון</Label>
                                                    <Select value={`${sortConfig.key}-${sortConfig.direction}`} onValueChange={(v) => { const [k, d] = v.split('-'); setSortConfig({ key: k, direction: d });}}>
                                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="name-asc">שם (א-ת)</SelectItem>
                                                            <SelectItem value="name-desc">שם (ת-א)</SelectItem>
                                                            <SelectItem value="months_of_stock-asc">חודשי מלאי (נמוך-גבוה)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                            <Button onClick={clearSelection} variant="ghost" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50" disabled={selectedReagents.size === 0}>
                                <Trash2 className="h-4 w-4 ml-2" />
                                נקה בחירה
                            </Button>
                        </div>
                    </Card>
                </div>

                {isMobile ? (
                    <div className="space-y-3 pb-24">
                        {(filteredReagents || []).map(reagent => {
                            const netAvailable = (reagent.available_framework_quantity || 0) - (reagent.quantity_in_pending_withdrawals || 0) - (reagent.quantity_in_delivery || 0);
                            return (
                                <Card 
                                    key={reagent.id} 
                                    className={`p-3 border-l-4 bg-white transition-all ${
                                        reagent.current_stock_status === 'out_of_stock' ? 'border-red-500' : 
                                        reagent.current_stock_status === 'low_stock' ? 'border-amber-500' : 
                                        'border-slate-300'
                                    } ${reagent.has_temporary_orders ? 'shadow-md ring-1 ring-purple-200' : ''}`}
                                >
                                    {reagent.has_temporary_orders && (
                                        <div className="bg-purple-50 border border-purple-200 rounded-md px-2 py-1 mb-2 flex items-center gap-1 text-xs text-purple-700">
                                            <Info className="h-3 w-3" />
                                            <span>מתחשב בהזמנות זמניות</span>
                                        </div>
                                    )}
                                    <div className="flex items-start gap-3">
                                        <Checkbox className="mt-1" checked={[...selectedReagents].some(item => item.id === reagent.id)} onCheckedChange={() => handleSelectReagent(reagent.id, reagent.suggested_order_quantity)} />
                                        <div className="flex-grow">
                                            <div className="text-center mb-2">
                                                <SmartTooltip content={reagent.name} className="font-bold text-base text-slate-800 block" isMobile={true}>
                                                    <div className="font-bold text-base text-slate-800">{reagent.name}</div>
                                                </SmartTooltip>
                                                <SmartTooltip content={`${reagent.catalog_number} | ${reagent.supplier}`} className="text-xs text-slate-500 block" isMobile={true}>
                                                    <div className="text-xs text-slate-500">{reagent.catalog_number} | {reagent.supplier}</div>
                                                </SmartTooltip>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-center text-xs">
                                                <div className="bg-slate-50 p-1.5 rounded-lg"><Label className="text-xs font-medium text-slate-600 block">מלאי נוכחי</Label><p className="font-semibold text-slate-800 text-sm">{formatQuantity(reagent.total_quantity_all_batches)}</p></div>
                                                <div className="bg-blue-50 p-1.5 rounded-lg">
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <button className="w-full text-blue-600 hover:text-blue-800 underline disabled:text-slate-400 disabled:no-underline" disabled={!(reagent.available_framework_quantity || reagent.quantity_in_pending_withdrawals || reagent.quantity_in_delivery)}>
                                                                <Label className="text-xs font-medium text-blue-600 underline block">יתרות זמינות</Label>
                                                                <p className="font-semibold text-blue-800 text-sm">{formatQuantity(netAvailable)}</p>
                                                            </button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-72 text-right" dir="rtl">
                                                            <div className="space-y-2 text-sm">
                                                                <h4 className="font-semibold text-slate-800 mb-3">פירוט יתרות זמינות:</h4>
                                                                <div className="flex justify-between">
                                                                    <span className="text-slate-600">יתרות מסגרת בפועל:</span>
                                                                    <span className="font-medium text-slate-900">{formatQuantity(reagent.available_framework_quantity || 0)}</span>
                                                                </div>
                                                                {(reagent.quantity_in_pending_withdrawals || 0) > 0 && (
                                                                    <div className="flex justify-between text-amber-700 bg-amber-50 px-2 py-1 rounded">
                                                                        <span>בבקשות משיכה ממתינות:</span>
                                                                        <span className="font-medium">-{formatQuantity(reagent.quantity_in_pending_withdrawals)}</span>
                                                                    </div>
                                                                )}
                                                                {(reagent.quantity_in_delivery || 0) > 0 && (
                                                                    <div className="flex justify-between text-blue-700 bg-blue-50 px-2 py-1 rounded">
                                                                        <span>במשיכה באספקה (בדרך):</span>
                                                                        <span className="font-medium">-{formatQuantity(reagent.quantity_in_delivery)}</span>
                                                                    </div>
                                                                )}
                                                                <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between font-semibold text-slate-900">
                                                                    <span>יתרה נטו פנויה:</span>
                                                                    <span className="text-blue-600">{formatQuantity(netAvailable)}</span>
                                                                </div>
                                                                <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
                                                                    <p>💡 יתרה נטו = יתרות מסגרת מינוס משיכות ממתינות ומינוס משיכות באספקה</p>
                                                                </div>
                                                            </div>
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>
                                                <div className="bg-slate-50 p-1.5 rounded-lg"><Label className="text-xs font-medium text-slate-600 block">צריכה חודשית</Label><p className="font-semibold text-slate-800 text-sm">{formatQuantity(reagent.effective_monthly_usage)}</p></div>
                                                <div className="bg-slate-50 p-1.5 rounded-lg"><Label className="text-xs font-medium text-slate-600 block">חודשי מלאי</Label><p className="font-semibold text-slate-800 text-sm">{isFinite(reagent.months_of_stock) ? reagent.months_of_stock?.toFixed(1) : '∞'}</p></div>
                                            </div>
                                            <div className="mt-3 flex items-center justify-between gap-2">
                                                <div className="flex-1">
                                                    <Label htmlFor={`q-${reagent.id}`} className="text-xs font-medium text-slate-600 mb-1 block">כמות להזמנה</Label>
                                                    <div className="flex items-center gap-1">
                                                        <Input 
                                                            id={`q-${reagent.id}`} 
                                                            type="number" 
                                                            value={reagent.suggested_order_quantity || 0} 
                                                            onChange={(e) => handleQuantityChange(reagent.id, e.target.value)} 
                                                            className="w-full text-center text-sm font-bold text-slate-800 border-slate-300 focus:border-amber-500 focus:ring-amber-500 h-9"
                                                        />
                                                        {reagent.has_temporary_orders && (
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <div className="text-xs text-purple-600 font-medium cursor-help">
                                                                            ({reagent.suggested_order_quantity_without_temp})
                                                                        </div>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent className="max-w-xs text-right" dir="rtl">
                                                                        <p className="text-sm">
                                                                            כמות מוצעת ללא התחשבות בדרישות זמניות: {reagent.suggested_order_quantity_without_temp}
                                                                        </p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <Card className="shadow-sm border-slate-200/60 bg-white">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto max-h-[calc(100vh-320px)]">
                                <div className="min-w-full">
                                    <div className="bg-slate-50 border-b flex sticky top-0 z-10">
                                        {columns.map(column => (
                                            <ResizableHeader key={column.id} column={column}>
                                                {column.id === 'selection' ? 
                                                    <Checkbox checked={selectedReagents.size > 0 && selectedReagents.size === filteredReagents.length && filteredReagents.length > 0} onCheckedChange={handleSelectAllFiltered}/> : 
                                                column.disableSort ? column.header : (
                                                    <button onClick={() => handleSort(column.id)} className="flex items-center gap-2 w-full justify-center hover:text-amber-600">
                                                        <TableHeaderTooltip 
                                                            header={column.header} 
                                                            description={column.description}
                                                        />
                                                        {sortConfig.key === column.id && (sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                                                    </button>
                                                )}
                                            </ResizableHeader>
                                        ))}
                                    </div>
                                    <div className="divide-y divide-slate-100">
                                        {(filteredReagents || []).map((row) => {
                                            const netAvailable = (row.available_framework_quantity || 0) - (row.quantity_in_pending_withdrawals || 0) - (row.quantity_in_delivery || 0);
                                            return (
                                                <div 
                                                    key={row.id} 
                                                    className={`flex items-center transition-colors hover:bg-slate-50 ${
                                                        [...selectedReagents].some(item => item.id === row.id) ? 'bg-amber-50' : ''
                                                    } ${row.has_temporary_orders ? 'bg-purple-50/30' : ''}`}
                                                >
                                                    {columns.map(column => (
                                                        <div key={column.id} className="p-3 text-center flex items-center justify-center" style={{ width: columnWidths[column.id] }}>
                                                            {column.id === 'selection' && <Checkbox checked={[...selectedReagents].some(item => item.id === row.id)} onCheckedChange={() => handleSelectReagent(row.id, row.suggested_order_quantity)}/>}
                                                            {column.id === 'name' && (
                                                                <div className="font-semibold text-slate-800 text-right w-full">
                                                                    <div className="flex items-center gap-2">
                                                                        {row.has_temporary_orders && (
                                                                            <TooltipProvider>
                                                                                <Tooltip>
                                                                                    <TooltipTrigger asChild>
                                                                                        <div className="flex-shrink-0">
                                                                                            <Info className="h-4 w-4 text-purple-500" />
                                                                                        </div>
                                                                                    </TooltipTrigger>
                                                                                    <TooltipContent className="max-w-xs text-right" dir="rtl">
                                                                                        <p className="text-sm">
                                                                                            כמות מוצעת מתחשבת בדרישות רכש זמניות (ללא מספר קבוע)
                                                                                        </p>
                                                                                    </TooltipContent>
                                                                                </Tooltip>
                                                                            </TooltipProvider>
                                                                        )}
                                                                        <SmartTooltip content={row.name}>
                                                                            {row.name}
                                                                        </SmartTooltip>
                                                                    </div>
                                                                    <div className="text-xs text-slate-500 font-normal">
                                                                        <SmartTooltip content={`${row.catalog_number} | ${row.supplier}`}>
                                                                            {row.catalog_number} | {row.supplier}
                                                                        </SmartTooltip>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {column.id === 'effective_monthly_usage' && <div>{formatQuantity(row.effective_monthly_usage)}</div>}
                                                            {column.id === 'total_quantity_all_batches' && <div>{formatQuantity(row.total_quantity_all_batches)}</div>}
                                                            {column.id === 'months_of_stock' && <div>{isFinite(row.months_of_stock) ? row.months_of_stock?.toFixed(1) : '∞'}</div>}
                                                            {column.id === 'available_framework_quantity' && (
                                                                <Popover>
                                                                    <PopoverTrigger asChild>
                                                                        <button className="w-full text-blue-600 hover:text-blue-800 underline disabled:text-slate-400 disabled:no-underline" disabled={!(row.available_framework_quantity || row.quantity_in_pending_withdrawals || row.quantity_in_delivery)}>
                                                                            {formatQuantity(netAvailable)}
                                                                        </button>
                                                                    </PopoverTrigger>
                                                                    <PopoverContent className="w-80 text-right" dir="rtl">
                                                                        <div className="space-y-2 text-sm">
                                                                            <h4 className="font-semibold text-slate-800 mb-3">פירוט יתרות זמינות:</h4>
                                                                            <div className="flex justify-between">
                                                                                <span className="text-slate-600">יתרות מסגרת בפועל:</span>
                                                                                <span className="font-medium text-slate-900">{formatQuantity(row.available_framework_quantity || 0)}</span>
                                                                            </div>
                                                                            {(row.quantity_in_pending_withdrawals || 0) > 0 && (
                                                                                <div className="flex justify-between text-amber-700 bg-amber-50 px-2 py-1 rounded">
                                                                                    <span>בבקשות משיכה ממתינות:</span>
                                                                                    <span className="font-medium">-{formatQuantity(row.quantity_in_pending_withdrawals)}</span>
                                                                                </div>
                                                                            )}
                                                                            {(row.quantity_in_delivery || 0) > 0 && (
                                                                                <div className="flex justify-between text-blue-700 bg-blue-50 px-2 py-1 rounded">
                                                                                    <span>במשיכה באספקה (בדרך):</span>
                                                                                    <span className="font-medium">-{formatQuantity(row.quantity_in_delivery)}</span>
                                                                                </div>
                                                                            )}
                                                                            <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between font-semibold text-slate-900">
                                                                                <span>יתרה נטו פנויה:</span>
                                                                                <span className="text-blue-600">{formatQuantity(netAvailable)}</span>
                                                                            </div>
                                                                            <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
                                                                                <p>💡 יתרה נטו = יתרות מסגרת מינוס משיכות ממתינות ומינוס משיכות באספקה</p>
                                                                            </div>
                                                                        </div>
                                                                    </PopoverContent>
                                                                </Popover>
                                                            )}
                                                            {column.id === 'suggested_order_quantity' && (
                                                                <div className="flex items-center justify-center gap-1">
                                                                    <Input 
                                                                        type="number" 
                                                                        value={row.suggested_order_quantity || 0} 
                                                                        onChange={(e) => handleQuantityChange(row.id, e.target.value)} 
                                                                        className="w-20 text-center font-bold text-slate-800 border-slate-300 focus:border-amber-500 focus:ring-amber-500"
                                                                    />
                                                                    {row.has_temporary_orders && (
                                                                        <TooltipProvider>
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <div className="text-xs text-purple-600 font-medium cursor-help whitespace-nowrap">
                                                                                        ({row.suggested_order_quantity_without_temp})
                                                                                    </div>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent className="max-w-xs text-right" dir="rtl">
                                                                                    <p className="text-sm">
                                                                                        כמות מוצעת ללא התחשבות בדרישות זמניות: {row.suggested_order_quantity_without_temp}
                                                                                    </p>
                                                                                </TooltipContent>
                                                                            </Tooltip>
                                                                        </TooltipProvider>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm p-3 border-t grid grid-cols-2 gap-3 z-20">
                    <Button onClick={() => createDocument('withdrawal')} disabled={selectedReagents.size === 0} variant="outline" className="bg-blue-600 hover:bg-blue-700 text-white h-12"><ArrowDownToLine className="h-4 w-4 ml-2" /> צור משיכה</Button>
                    <Button onClick={() => createDocument('order')} disabled={selectedReagents.size === 0} className="bg-amber-500 hover:bg-amber-600 h-12"><FileDown className="h-4 w-4 ml-2" /> צור דרישה</Button>
                </div>
            </div>

            <Dialog open={showOrderTypeDialog} onOpenChange={setShowOrderTypeDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>בחר סוג דרישת רכש</DialogTitle>
                        <DialogDescription>בחר את סוג דרישת הרכש שברצונך ליצור.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Button onClick={() => handleOrderCreation('immediate_delivery')} className="bg-teal-600 hover:bg-teal-700">
                            פתוחה (מיידי)
                        </Button>
                        <Button onClick={() => handleOrderCreation('framework')} className="bg-sky-600 hover:bg-sky-700">
                            מסגרת
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={showMissingDetailsDialog} onOpenChange={setShowMissingDetailsDialog}>
                <AlertDialogContent className="max-w-2xl" dir="rtl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-xl">
                            <AlertCircle className="h-6 w-6 text-amber-500" />
                            נמצאה הזמנת מסגרת, אך חסר מספר הזמנה קבוע
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-right space-y-4 text-base">
                            <p className="font-semibold text-gray-800">
                                המערכת מצאה הזמנת מסגרת מתאימה עם יתרות זמינות,
                                אך אין לה עדיין <span className="text-amber-600">מספר הזמנה קבוע</span> (מספר קבוע מה-SAP או מספר PO).
                            </p>

                            <div className="bg-amber-50 border-r-4 border-amber-400 p-4 rounded">
                                <h4 className="font-semibold text-amber-800 mb-2">למה זה חשוב?</h4>
                                <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside mr-2">
                                    <li>מספר הזמנה קבוע דרוש למעקב ותיעוד מול הספק ומערכת ה-SAP.</li>
                                    <li>ללא מספר קבוע, עלול להיווצר קושי בזיהוי וטיפול בהזמנה בעתיד.</li>
                                    <li>יתכנו עיכובים באספקה אם הספק לא יקבל מספר PO רשמי.</li>
                                </ul>
                            </div>

                            <div className="bg-blue-50 border-r-4 border-blue-400 p-4 rounded">
                                <h4 className="font-semibold text-blue-800 mb-2">מה מומלץ לעשות?</h4>
                                <p className="text-sm text-blue-700">
                                    מומלץ לעבור תחילה למסך <strong>"ניהול דרישות רכש"</strong>, למצוא את ההזמנה (מספר דרישה זמני: {pendingWithdrawalAction?.frameworkOrderNumber || 'לא זמין'}),
                                    ולהשלים את המספר הקבוע לפני ביצוע המשיכה.
                                </p>
                            </div>

                            <p className="text-gray-700">
                                <strong>האם ברצונך להמשיך ליצירת המשיכה בכל זאת?</strong>
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                        <AlertDialogCancel onClick={handleCancelMissingDetails} className="w-full sm:w-auto">
                            בטל
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleProceedWithMissingDetails}
                            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600"
                        >
                            המשך למשיכה בכל זאת
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <PrintDialog
                isOpen={showPrintDialog}
                onClose={handlePrintDialogClose}
                documentId={printDocumentId}
                documentType={printDocumentType}
                title={printDocumentType === 'order' ? 'דרישת רכש' : 'בקשת משיכה'}
            />
        </>
    );
}