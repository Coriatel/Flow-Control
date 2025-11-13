
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/components/ui/use-toast';
import QATable from '@/components/quality-assurance/QATable';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatQuantity } from '../components/utils/formatters';
import { AnimatePresence, motion } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { isValid, parseISO, format } from 'date-fns';
import { he } from 'date-fns/locale';
import {
  ArrowLeft,
  Search,
  SlidersHorizontal,
  Loader2,
  AlertTriangle,
  X,
  RefreshCw,
  Columns,
  Printer,
  CalendarIcon,
  Wrench
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import BackButton from '@/components/ui/BackButton';
import { cn } from '@/lib/utils';

// Initial column definitions
const initialColumns = [
  { accessor: 'reagent_name', Header: 'ריאגנט', width: 150, editable: false },
  { accessor: 'batch_number', Header: 'אצווה', width: 100, editable: false },
  { accessor: 'expiry_date', Header: 'תפוגה', width: 85, editable: true, inputType: 'date' },
  { accessor: 'receipt_quantity', Header: 'כמות קבלה', width: 90, editable: false },
  { accessor: 'status_quantity', Header: 'כמות (סטטוס)', width: 95, editable: false },
  { accessor: 'current_quantity', Header: 'כמות נוכחית', width: 90, editable: true, inputType: 'number' },
  { accessor: 'receipt_date', Header: 'ת. קבלה', width: 85, editable: true, inputType: 'date' },
  { accessor: 'delivery_number', Header: 'משלוח', width: 90, editable: false },
  { accessor: 'order_number', Header: 'הזמנה', width: 90, editable: false },
  { accessor: 'supplier', Header: 'ספק', width: 100, editable: false },
  { accessor: 'status', Header: 'סטטוס', width: 80, editable: true },
  { accessor: 'first_use_date', Header: 'שימוש ראשון', width: 110, editable: true, inputType: 'date' },
  { accessor: 'received_by', Header: 'נקלט ע"י', width: 100, editable: false },
  { accessor: 'coa_documents', Header: 'COA', width: 80, editable: false },
  { accessor: 'actions', Header: 'פעולות', width: 70, editable: false }
];

const createInitialVisibleColumnsState = (columnsArray) => {
  const obj = {};
  columnsArray.forEach(col => {
    obj[col.accessor] = true;
  });
  return obj;
};

export default function QualityAssurancePage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const availableStatuses = useMemo(() => [
    { value: 'active', label: 'פעיל' },
    { value: 'expired', label: 'פג תוקף' },
    { value: 'disposed', label: 'הושמד' },
    { value: 'consumed', label: 'נצרך' },
    { value: 'used_up', label: 'נוצל' },
    { value: 'quarantine', label: 'בהסגר' }
  ], []);

  // Load saved state from localStorage
  const loadSavedState = useCallback(() => {
    try {
      const savedFilters = localStorage.getItem('qaFilters');
      const savedColumns = localStorage.getItem('qaVisibleColumns');
      
      let parsedFilters = null;
      let parsedColumns = null;

      if (savedFilters) {
        try {
          parsedFilters = JSON.parse(savedFilters);
        } catch (e) {
          console.warn('Failed to parse filters:', e);
        }
      }

      if (savedColumns) {
        try {
          parsedColumns = JSON.parse(savedColumns);
        } catch (e) {
          console.warn('Failed to parse columns:', e);
        }
      }

      return {
        filters: parsedFilters ? {
          searchTerm: parsedFilters.searchTerm || '',
          dateFrom: parsedFilters.dateFrom ? parseISO(parsedFilters.dateFrom) : null,
          dateTo: parsedFilters.dateTo ? parseISO(parsedFilters.dateTo) : null,
          selectedStatuses: Array.isArray(parsedFilters.selectedStatuses) ? parsedFilters.selectedStatuses : availableStatuses.map(s => s.value),
          selectedReagents: Array.isArray(parsedFilters.selectedReagents) ? parsedFilters.selectedReagents : [],
          missingCOAOnly: parsedFilters.missingCOAOnly || false
        } : {
          searchTerm: '',
          dateFrom: null,
          dateTo: null,
          selectedStatuses: availableStatuses.map(s => s.value),
          selectedReagents: [],
          missingCOAOnly: false
        },
        columns: parsedColumns
      };
    } catch (error) {
      console.warn('Failed to load saved state:', error);
      return {
        filters: {
          searchTerm: '',
          dateFrom: null,
          dateTo: null,
          selectedStatuses: availableStatuses.map(s => s.value),
          selectedReagents: [],
          missingCOAOnly: false
        },
        columns: null
      };
    }
  }, [availableStatuses]);

  const savedState = useMemo(() => loadSavedState(), [loadSavedState]);

  // Filter states
  const [searchTerm, setSearchTerm] = useState(savedState.filters.searchTerm);
  const [dateFrom, setDateFrom] = useState(savedState.filters.dateFrom);
  const [dateTo, setDateTo] = useState(savedState.filters.dateTo);
  const [selectedStatuses, setSelectedStatuses] = useState(savedState.filters.selectedStatuses);
  const [selectedReagents, setSelectedReagents] = useState(savedState.filters.selectedReagents);
  const [missingCOAOnly, setMissingCOAOnly] = useState(savedState.filters.missingCOAOnly);

  const [sortConfig, setSortConfig] = useState({ key: 'receipt_date', direction: 'desc' });
  const [isEditMode, setIsEditMode] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Handle item dialog states
  const [handlingItemDialog, setHandlingItemDialog] = useState(null);
  const [actionType, setActionType] = useState('disposed');
  const [handlingQuantity, setHandlingQuantity] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [isHandlingAction, setIsHandlingAction] = useState(false);
  const [remainingQuantity, setRemainingQuantity] = useState(0);

  // Column visibility state
  const initialVisibleColumnsState = useMemo(() => createInitialVisibleColumnsState(initialColumns), []);
  const [visibleColumns, setVisibleColumns] = useState(savedState.columns || initialVisibleColumnsState);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ COA Management - מימוש מלא
  const [coaUploadDialog, setCoaUploadDialog] = useState(null); // האצווה שמעלים לה COA
  const [coaFile, setCoaFile] = useState(null);
  const [uploadingCOA, setUploadingCOA] = useState(false);

  // Save filters to localStorage
  useEffect(() => {
    try {
      const filtersToSave = {
        searchTerm,
        dateFrom: dateFrom ? dateFrom.toISOString() : null,
        dateTo: dateTo ? dateTo.toISOString() : null,
        selectedStatuses,
        selectedReagents,
        missingCOAOnly
      };
      localStorage.setItem('qaFilters', JSON.stringify(filtersToSave));
    } catch (error) {
      console.warn('Failed to save filters:', error);
    }
  }, [searchTerm, dateFrom, dateTo, selectedStatuses, selectedReagents, missingCOAOnly]);

  // Save visible columns to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('qaVisibleColumns', JSON.stringify(visibleColumns));
    } catch (error) {
      console.warn('Failed to save columns:', error);
    }
  }, [visibleColumns]);

  const currentColumns = useMemo(() => {
    return initialColumns.map(col => ({
      ...col,
      isVisible: visibleColumns[col.accessor] !== false
    }));
  }, [visibleColumns]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [user, { data: fetchedData }] = await Promise.all([
        base44.auth.me(),
        base44.functions.invoke('getQualityAssuranceData')
      ]);
      setCurrentUser(user);
      if (!Array.isArray(fetchedData)) throw new Error("Data format is incorrect");
      setData(fetchedData);
    } catch (err) {
      setError(err.message);
      toast({ title: "שגיאה בטעינת נתונים", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
  }, [fetchData]);

  const handleCOAUpdate = (itemId, coaData) => {
    setData(prevData =>
      prevData.map(item =>
        item.id === itemId
          ? { ...item, coa_documents: coaData.coas }
          : item
      )
    );
  };

  const toggleStatus = useCallback((statusValue) => {
    setSelectedStatuses(prev => {
      if (prev.includes(statusValue)) {
        return prev.filter(s => s !== statusValue);
      } else {
        return [...prev, statusValue];
      }
    });
  }, []);

  const toggleColumn = useCallback((key) => {
    setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearchTerm('');
    setDateFrom(null);
    setDateTo(null);
    setSelectedStatuses(availableStatuses.map(s => s.value));
    setSelectedReagents([]);
    setMissingCOAOnly(false);
    toast({title: "סינונים נוקו", description: "כל הסינונים הוסרו בהצלחה."});
  }, [availableStatuses, toast]);

  // ✅ פתיחת דיאלוג העלאת COA
  const handleCOAUpload = useCallback((item) => {
    setCoaUploadDialog(item);
    setCoaFile(null);
  }, []);

  // ✅ ביצוע העלאת COA בפועל
  const handleCOAUploadSubmit = async () => {
    if (!coaFile || !coaUploadDialog) {
      toast({
        title: "שגיאה",
        description: "לא נבחר קובץ להעלאה",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploadingCOA(true);
      
      // העלאת הקובץ
      const uploadResult = await base44.integrations.Core.UploadFile({ file: coaFile });
      
      if (uploadResult?.file_url) {
        // עדכון האצווה עם ה-COA
        // Note: `coa_document_url` on ReagentBatch is for single COA. `coa_documents` is for multiple.
        // We will update the array `coa_documents` on the ReagentBatch entity.
        // The `update` method on base44 entities performs a deep merge for objects or replaces for arrays.
        // So, we need to read the existing COAs first, then update.
        // Let's refine this to directly add to the array in the data state and trust `fetchData` to get the latest.
        // For actual database update, it's better to fetch current, append, then save.
        // However, the outline implies directly setting `coa_document_url` in the ReagentBatch table
        // and also updating the `coa_documents` array within the local state.
        // Given the outline structure, I will focus on updating the local state `coa_documents` array
        // and updating `coa_document_url`, `coa_upload_date`, `coa_uploaded_by` directly on the batch.

        const newCOADocument = {
          coa_document_url: uploadResult.file_url,
          upload_date: new Date().toISOString(),
          uploaded_by: currentUser?.email,
          source: 'manual_upload', // Assuming this is a manual upload
          filename: coaFile.name,
          mimetype: coaFile.type,
          size: coaFile.size,
        };

        // If coa_documents is a JSONB field, we should construct the full array to replace.
        // If it's just a single field, then the outline's `coa_document_url` approach is fine.
        // Assuming `coa_documents` is a JSONB array, we need to append.
        // For simplicity and matching the outline's intent for a single URL field and local state array,
        // I will update the `coa_document_url` field, and then refresh the whole data.
        // Or, if `coa_documents` is the true source of truth, then it needs to be fetched, appended, and updated.
        // Given the local `setData` update below, it implies the `coa_documents` in the `ReagentBatch` entity
        // should also be an array. The prompt implies there's a `coa_documents` array field.

        const existingCoaDocuments = coaUploadDialog.coa_documents || [];
        const updatedCoaDocumentsArray = [...existingCoaDocuments, newCOADocument];

        await base44.entities.ReagentBatch.update(coaUploadDialog.reagent_batch_id, {
          coa_documents: updatedCoaDocumentsArray, // Update the array field
          // These fields might be for single COA tracking, if `coa_documents` is for multiple.
          // Or they might be redundant if `coa_documents` is the primary.
          // For now, I'll update these too as per the outline's suggestion.
          coa_document_url: uploadResult.file_url, // For backward compatibility or single display
          coa_upload_date: new Date().toISOString(),
          coa_uploaded_by: currentUser?.email
        });

        toast({
          title: "✅ הועלה בהצלחה",
          description: `תעודת אנליזה הועלתה לאצווה ${coaUploadDialog.batch_number}`,
        });

        // Update the local data state
        setData(prevData => prevData.map(item =>
          item.reagent_batch_id === coaUploadDialog.reagent_batch_id
            ? { 
                ...item, 
                coa_documents: updatedCoaDocumentsArray,
                coa_document_url: uploadResult.file_url, // Also update this for consistency
                coa_upload_date: new Date().toISOString(),
                coa_uploaded_by: currentUser?.email
              }
            : item
        ));

        // סגירת הדיאלוג
        setCoaUploadDialog(null);
        setCoaFile(null);
      }
    } catch (error) {
      console.error('Error uploading COA:', error);
      toast({
        title: "❌ שגיאה בהעלאת COA",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploadingCOA(false);
    }
  };

  // ✅ צפייה ב-COA קיים
  const handleCOAView = useCallback((item) => {
    if (item.coa_documents && item.coa_documents.length > 0) {
      let urlToOpen = item.coa_documents[0].coa_document_url;
      
      // טיפול ב-URL של base44 - המרה ל-Supabase public storage URL
      // This is necessary if base44 returns an internal API URL that needs to be translated
      // to a direct public storage URL for browser access.
      if (urlToOpen.includes('base44.app/api/apps/') && urlToOpen.includes('/files/')) {
        const fileNameMatch = urlToOpen.match(/files\/(.+)$/);
        if (fileNameMatch && fileNameMatch[1]) {
          const fileName = fileNameMatch[1];
          // This specific Supabase URL structure might be environment-dependent,
          // but assuming it's for the given Supabase project from the outline.
          urlToOpen = `https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/${fileName}`;
        }
      }
      
      const newWindow = window.open(urlToOpen, '_blank', 'noopener,noreferrer');
      
      if (!newWindow) {
        toast({
          title: "חסימת קופצים",
          description: "אנא אפשר חלונות קופצים לצפייה בתעודה",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "אין תעודה",
        description: "לא קיימת תעודת אנליזה לאצווה זו",
        variant: "destructive"
      });
    }
  }, [toast, currentUser]);

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleRowUpdate = async (batchId, updatedFields) => {
    setData(prevData =>
      prevData.map(item =>
        item.reagent_batch_id === batchId
          ? { ...item, ...updatedFields }
          : item
      )
    );
  };

  const handleDeleteRow = async (batchId) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק אצווה זו? פעולה זו בלתי הפיכה.')) return;

    try {
      await base44.entities.ReagentBatch.delete(batchId);
      setData(prevData => prevData.filter(item => item.reagent_batch_id !== batchId));
      toast({ title: "האצווה נמחקה בהצלחה" });
    } catch (error) {
      toast({ title: "שגיאה במחיקת האצווה", description: error.message, variant: "destructive" });
    }
  };

  const handleHandleItem = (item) => {
    const batchToHandle = {
      id: item.reagent_batch_id,
      reagent_id: item.reagent_id,
      reagent_name: item.reagent_name,
      batch_number: item.batch_number,
      expiry_date: item.expiry_date,
      current_quantity: item.current_quantity,
      supplier: item.supplier,
      status: item.status
    };

    setHandlingItemDialog(batchToHandle);
    setRemainingQuantity(parseFloat(item.current_quantity) || 0);
    setHandlingQuantity(String(parseFloat(item.current_quantity) || 0));
    setActionType('disposed');
    setActionNotes('');
  };

  const handleProcessAction = async () => {
    if (!handlingItemDialog) return;

    setIsHandlingAction(true);
    try {
      const user = await base44.auth.me();
      const affectedQty = parseFloat(handlingQuantity) || 0;
      const currentQty = remainingQuantity;

      if (affectedQty <= 0 || affectedQty > currentQty) {
        toast({
          title: "כמות לא תקינה",
          description: `יש להזין כמות בין 1 ל-${formatQuantity(currentQty)}`,
          variant: "destructive"
        });
        setIsHandlingAction(false);
        return;
      }

      await base44.entities.ExpiredProductLog.create({
        reagent_id: handlingItemDialog?.reagent_id,
        reagent_name_snapshot: handlingItemDialog?.reagent_name || 'לא ידוע',
        batch_number_snapshot: handlingItemDialog?.batch_number,
        original_expiry_date: handlingItemDialog?.expiry_date,
        action_taken: actionType,
        quantity_affected: affectedQty,
        action_notes: actionNotes,
        documented_date: new Date().toISOString(),
        documented_by_user_id: user?.id
      });

      let newQuantity = currentQty - affectedQty;
      let newStatus = handlingItemDialog?.status;

      if (newQuantity <= 0) {
        newQuantity = 0;
        if (actionType === 'disposed') {
          newStatus = 'disposed';
        } else if (actionType === 'consumed_by_expiry') {
          newStatus = 'consumed';
        } else if (actionType === 'other_use') {
          newStatus = 'used_up';
        }
      }

      await base44.entities.ReagentBatch.update(handlingItemDialog?.id, {
        current_quantity: newQuantity,
        status: newStatus
      });

      const transactionType = actionType === 'consumed_by_expiry' ? 'withdrawal' :
                            actionType === 'disposed' ? 'disposal' : 'other_use_expired';

      await base44.entities.InventoryTransaction.create({
        reagent_id: handlingItemDialog?.reagent_id,
        transaction_type: transactionType,
        quantity: -affectedQty,
        batch_number: handlingItemDialog?.batch_number,
        expiry_date: handlingItemDialog?.expiry_date,
        notes: `טיפול בפג תוקף: ${getActionTakenLabel(actionType)} - ${actionNotes}`
      });

      toast({
        title: "הפעולה בוצעה בהצלחה",
        description: `${getActionTakenLabel(actionType)} - כמות: ${formatQuantity(affectedQty)}`,
        variant: "default"
      });

      setRemainingQuantity(newQuantity);
      setHandlingQuantity(String(newQuantity));

      if (newQuantity <= 0) {
        setHandlingItemDialog(null);
        setActionNotes('');
        await fetchData(); // Full refresh for simplicity
      } else {
        setData(prevData => prevData.map(item =>
          item.reagent_batch_id === handlingItemDialog?.id
            ? { ...item, current_quantity: newQuantity, status: newStatus }
            : item
        ));
      }

    } catch (error) {
      console.error('Error handling item:', error);
      toast({
        title: "שגיאה בביצוע הפעולה",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsHandlingAction(false);
    }
  };

  const getActionTakenLabel = (action) => {
    const labels = {
      'disposed': 'כמות הושמדה',
      'other_use': 'שימוש אחר',
      'consumed_by_expiry': 'נצרכה עקב תפוגה'
    };
    return labels[action] || action;
  };

  const getActionTypeLabel = (type) => {
    switch(type) {
      case 'disposed': return 'כמות להשמדה';
      case 'consumed_by_expiry': return 'כמות שנצרכה';
      case 'other_use': return 'כמות לשימוש אחר';
      default: return 'כמות לטיפול';
    }
  };

  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter(item => {
      const matchesSearch = !searchTerm ||
        Object.values(item).some(value =>
          value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );

      const itemExpiryDate = item.expiry_date ? parseISO(item.expiry_date) : null;
      const matchesDateFrom = !dateFrom || (itemExpiryDate && itemExpiryDate >= dateFrom);
      const matchesDateTo = !dateTo || (itemExpiryDate && itemExpiryDate <= dateTo);

      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(item.status);
      const matchesReagent = selectedReagents.length === 0 || selectedReagents.includes(item.reagent_name);
      const matchesMissingCOA = !missingCOAOnly || (missingCOAOnly && (!item.coa_documents || item.coa_documents.length === 0));

      return matchesSearch && matchesDateFrom && matchesDateTo && matchesStatus && matchesReagent && matchesMissingCOA;
    });

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];

        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        let comparison = 0;
        if (['expiry_date', 'receipt_date', 'first_use_date'].includes(sortConfig.key)) {
          const dateA = aVal ? parseISO(aVal).getTime() : 0;
          const dateB = bVal ? parseISO(bVal).getTime() : 0;
          comparison = dateA - dateB;
        } else if (typeof aVal === 'string' && typeof bVal === 'string') {
          comparison = aVal.localeCompare(bVal, 'he', { sensitivity: 'base' });
        } else {
          if (aVal > bVal) comparison = 1;
          if (aVal < bVal) comparison = -1;
        }

        return sortConfig.direction === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [data, searchTerm, dateFrom, dateTo, selectedStatuses, selectedReagents, missingCOAOnly, sortConfig]);

  const batches = data;
  const filteredBatches = filteredAndSortedData;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const printDocument = printWindow.document;

    const totalBatches = filteredAndSortedData.length;
    const totalReceiptQuantity = filteredAndSortedData.reduce((sum, item) => sum + (item.receipt_quantity || 0), 0);
    const totalStatusQuantity = filteredAndSortedData.reduce((sum, item) => sum + (item.status_quantity || 0), 0);

    const printHTML = `
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>דוח בקרת איכות אצוות</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; direction: rtl; }
            .print-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .print-title { font-size: 24px; font-weight: bold; margin: 0; color: #333; }
            .print-subtitle { font-size: 12px; color: #666; margin: 5px 0; }
            .print-summary { background: #eef2ff; border-top: 2px solid #6366f1; padding: 10px; margin: 20px 0; font-size: 13px; font-weight: bold; text-align: center; }
            .print-table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 10px; }
            .print-table th, .print-table td { border: 1px solid #ccc; padding: 4px 3px; text-align: center; }
            .print-table th { background-color: #f0f0f0; font-weight: bold; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1 class="print-title">דוח בקרת איכות אצוות</h1>
            <div class="print-subtitle">נוצר בתאריך: ${new Date().toLocaleDateString('he-IL')} ${new Date().toLocaleTimeString('he-IL')} | ע"י: ${currentUser?.full_name || 'לא ידוע'}</div>
            <div class="print-subtitle">סה"כ ${filteredAndSortedData.length} רשומות</div>
          </div>
          <div class="print-summary">
            סה"כ אצוות: ${totalBatches} | סה"כ כמות התקבלה: ${formatQuantity(totalReceiptQuantity)} | סה"כ כמות (סטטוס): ${formatQuantity(totalStatusQuantity)}
          </div>
          <table class="print-table">
            <thead>
              <tr>
                ${currentColumns.filter(c => c.isVisible && c.accessor !== 'actions').map(column => `<th>${column.Header}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${filteredAndSortedData.map(item => `
                <tr>
                  ${currentColumns.filter(c => c.isVisible && c.accessor !== 'actions').map(column => {
                    let cellValue = item[column.accessor];
                    if (cellValue === undefined || cellValue === null) {
                      cellValue = 'N/A';
                    } else if (['expiry_date', 'receipt_date', 'first_use_date'].includes(column.accessor)) {
                      try {
                        cellValue = item[column.accessor] ? format(parseISO(item[column.accessor]), 'dd/MM/yyyy') : 'N/A';
                      } catch (e) {
                        cellValue = 'תאריך לא תקין';
                      }
                    } else if (column.accessor === 'coa_documents') {
                      cellValue = Array.isArray(cellValue) && cellValue.length > 0 ? '✔️' : '❌';
                    } else if (typeof cellValue === 'number') {
                        cellValue = formatQuantity(cellValue);
                    }
                    return `<td>${cellValue}</td>`;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printDocument.write(printHTML);
    printDocument.close();
    printWindow.focus();
    printWindow.print();
  };

  if (loading && !refreshing) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-teal-500" />
        <span className="mr-3 text-lg text-gray-600">טוען דשבורד...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <p className="text-red-600 text-lg">{error}</p>
        <Button onClick={fetchData} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          נסה שוב
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(createPageUrl('Dashboard'))}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="text-center flex-1">
            <h1 className="text-lg font-bold text-slate-800 leading-tight">בקרת איכות אצוות</h1>
            <p className="text-xs text-slate-600 mt-0.5">
              {filteredBatches.length} אצוות מתוך {batches.length}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMobileFilters(true)}
          >
            <SlidersHorizontal className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Desktop Header */}
      <header className="hidden lg:block bg-white shadow-sm sticky top-0 z-20">
        <div className="px-4 py-3 bg-white">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4">
              <BackButton onClick={() => navigate(createPageUrl('Dashboard'))} />
              <div>
                <h1 className="text-xl font-bold text-slate-900">בקרת איכות</h1>
                <p className="text-sm text-slate-600">מציג {filteredBatches.length} מתוך {batches.length} אצוות</p>
              </div>
            </div>

            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="חיפוש אצווה..."
                className="w-full pl-4 pr-10 bg-white"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    סינון מתקדם
                    {(
                      (selectedStatuses.length > 0 && selectedStatuses.length < availableStatuses.length) ||
                      selectedReagents.length > 0 ||
                      missingCOAOnly ||
                      dateFrom ||
                      dateTo
                    ) && (
                      <span className="bg-amber-500 text-white text-xs rounded-full px-2 py-0.5">
                        {
                          (selectedStatuses.length > 0 && selectedStatuses.length < availableStatuses.length ? 1 : 0) +
                          (selectedReagents.length > 0 ? 1 : 0) +
                          (missingCOAOnly ? 1 : 0) +
                          (dateFrom ? 1 : 0) +
                          (dateTo ? 1 : 0)
                        }
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px]" align="start">
                  <div className="space-y-4" dir="rtl">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-2 block">מתאריך תפוגה</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-right font-normal",
                                !dateFrom && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="ml-2 h-4 w-4" />
                              {dateFrom ? format(dateFrom, 'dd/MM/yyyy', { locale: he }) : 'בחר תאריך'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={dateFrom}
                              onSelect={setDateFrom}
                              locale={he}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-2 block">עד תאריך תפוגה</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-right font-normal",
                                !dateTo && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="ml-2 h-4 w-4" />
                              {dateTo ? format(dateTo, 'dd/MM/yyyy', { locale: he }) : 'בחר תאריך'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={dateTo}
                              onSelect={setDateTo}
                              locale={he}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">סטטוס</label>
                      <div className="flex flex-wrap gap-2">
                        {availableStatuses.map((statusObj) => (
                          <Button
                            key={statusObj.value}
                            variant={selectedStatuses.includes(statusObj.value) ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleStatus(statusObj.value)}
                            className={selectedStatuses.includes(statusObj.value) ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-slate-300 text-slate-700 hover:bg-slate-100"}
                          >
                            {statusObj.label}
                          </Button>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-2">
                         <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedStatuses(availableStatuses.map(s => s.value))}
                          className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-100"
                        >
                          בחר הכל
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedStatuses([])}
                          className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-100"
                        >
                          נקה הכל
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                      <label htmlFor="missing-coa-switch" className="text-sm font-medium text-slate-700">רק אצוות ללא תעודת אנליזה</label>
                      <Switch
                        id="missing-coa-switch"
                        checked={missingCOAOnly}
                        onCheckedChange={setMissingCOAOnly}
                      />
                    </div>

                    <Button variant="outline" size="sm" onClick={clearAllFilters} className="w-full text-red-600 border-red-300 hover:bg-red-50">
                      <X className="h-4 w-4 ml-2" />
                      נקה את כל הסינונים
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              <Button variant="outline" size="sm" onClick={() => setShowColumnSelector(!showColumnSelector)} className="gap-2">
                <Columns className="h-4 w-4" />
                עמודות
              </Button>

              <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing} className="h-9 w-9">
                {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>

              <Button variant="outline" size="icon" onClick={handlePrint} className="h-9 w-9">
                <Printer className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showColumnSelector && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="px-4 py-3 bg-slate-50 border-t border-slate-200 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm text-slate-700">בחר עמודות להצגה</h4>
                <Button variant="ghost" size="sm" onClick={() => setShowColumnSelector(false)} className="h-auto p-1 text-slate-500 hover:text-slate-700">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {initialColumns.filter(col => col.accessor !== 'actions').map((column) => (
                  <label key={column.accessor} className="flex items-center gap-2 text-sm cursor-pointer py-1 px-2 rounded-md hover:bg-slate-100 transition-colors">
                    <Checkbox
                      checked={visibleColumns[column.accessor]}
                      onCheckedChange={() => toggleColumn(column.accessor)}
                      id={`col-select-${column.accessor}`}
                    />
                    <Label htmlFor={`col-select-${column.accessor}`} className="flex-1 text-slate-700 cursor-pointer">
                      {column.Header}
                    </Label>
                  </label>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* תפריט סינון מלא במובייל - עם כל הפקדים */}
      {showMobileFilters && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 lg:hidden">
          <div className="absolute inset-x-0 top-0 h-full bg-white/95 backdrop-blur-xl border-b border-slate-200/50 shadow-2xl">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-slate-200/50 bg-white">
                <h3 className="text-lg font-bold text-slate-800">סינון ועמודות</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowMobileFilters(false)}
                  className="p-1.5"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* חיפוש */}
                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">🔍 חיפוש</Label>
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="חיפוש בכל השדות..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10 bg-white border-slate-300"
                    />
                  </div>
                </div>

                {/* תאריכי תפוגה */}
                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">📅 תאריכי תפוגה</Label>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-600 mb-1 block">מתאריך</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-right font-normal",
                              !dateFrom && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="ml-2 h-4 w-4" />
                            {dateFrom ? format(dateFrom, 'dd/MM/yyyy', { locale: he }) : 'בחר תאריך'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="center">
                          <Calendar
                            mode="single"
                            selected={dateFrom}
                            onSelect={setDateFrom}
                            locale={he}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <label className="text-xs text-slate-600 mb-1 block">עד תאריך</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-right font-normal",
                              !dateTo && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="ml-2 h-4 w-4" />
                            {dateTo ? format(dateTo, 'dd/MM/yyyy', { locale: he }) : 'בחר תאריך'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="center">
                          <Calendar
                            mode="single"
                            selected={dateTo}
                            onSelect={setDateTo}
                            locale={he}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>

                {/* סינון לפי סטטוס */}
                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">📊 סטטוס</Label>
                  <div className="flex flex-wrap gap-2">
                    {availableStatuses.map((statusObj) => (
                      <Button
                        key={statusObj.value}
                        variant={selectedStatuses.includes(statusObj.value) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleStatus(statusObj.value)}
                        className={selectedStatuses.includes(statusObj.value) ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-slate-300 text-slate-700"}
                      >
                        {statusObj.label}
                      </Button>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedStatuses(availableStatuses.map(s => s.value))}
                      className="flex-1"
                    >
                      בחר הכל
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedStatuses([])}
                      className="flex-1"
                    >
                      נקה הכל
                    </Button>
                  </div>
                </div>

                {/* ללא תעודת אנליזה */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <label htmlFor="missing-coa-mobile" className="text-sm font-medium text-slate-700">רק ללא תעודת אנליזה</label>
                  <Switch
                    id="missing-coa-mobile"
                    checked={missingCOAOnly}
                    onCheckedChange={setMissingCOAOnly}
                  />
                </div>

                {/* בחירת עמודות */}
                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">📋 עמודות להצגה</Label>
                  <div className="space-y-2">
                    {initialColumns.filter(col => col.accessor !== 'actions').map((column) => (
                      <label key={column.accessor} className="flex items-center gap-2 text-sm cursor-pointer py-2 px-3 rounded-md hover:bg-slate-50 transition-colors bg-white border border-slate-200">
                        <Checkbox
                          checked={visibleColumns[column.accessor]}
                          onCheckedChange={() => toggleColumn(column.accessor)}
                          id={`mobile-col-${column.accessor}`}
                        />
                        <Label htmlFor={`mobile-col-${column.accessor}`} className="flex-1 text-slate-700 cursor-pointer">
                          {column.Header}
                        </Label>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-t border-slate-200/50 bg-white">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={clearAllFilters}
                    className="flex-1"
                  >
                    נקה סינון
                  </Button>
                  <Button
                    onClick={() => setShowMobileFilters(false)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    ✅ החל שינויים
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-3 lg:p-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <p className="mr-3 text-lg text-gray-600">טוען נתונים...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-lg text-red-600 mb-2">שגיאה בטעינת הנתונים</p>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchData} variant="outline">
              נסה שוב
            </Button>
          </div>
        ) : (
          <>
            <QATable
              data={filteredAndSortedData}
              visibleColumns={currentColumns.filter(c => c.isVisible)}
              sortField={sortConfig.key}
              sortDirection={sortConfig.direction}
              onSort={handleSort}
              isEditMode={isEditMode}
              onEdit={handleRowUpdate}
              onDelete={handleDeleteRow}
              onCOAUpload={handleCOAUpload}
              onCOAView={handleCOAView}
              onHandleItem={handleHandleItem}
            />

            {/* ✅ דיאלוג העלאת COA */}
            <AnimatePresence>
              {coaUploadDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/30 backdrop-blur-md"
                    onClick={() => {
                      setCoaUploadDialog(null);
                      setCoaFile(null);
                    }}
                  />

                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative bg-white/95 backdrop-blur-xl border border-slate-200/50 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
                  >
                    <div className="bg-gradient-to-r from-purple-50/90 to-slate-50/90 backdrop-blur-sm p-6 border-b border-slate-200/50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 mb-2">העלאת תעודת אנליזה (COA)</h3>
                          <p className="text-lg font-semibold text-purple-700 mb-1">{coaUploadDialog?.reagent_name}</p>
                          <p className="text-base font-mono font-medium text-slate-700">אצווה: {coaUploadDialog?.batch_number}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setCoaUploadDialog(null);
                            setCoaFile(null);
                          }}
                          className="h-8 w-8 text-slate-400 hover:text-slate-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="p-6 space-y-6">
                      <div className="space-y-3">
                        <Label className="text-base font-medium text-slate-800">בחר קובץ תעודת אנליזה</Label>
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          onChange={(e) => setCoaFile(e.target.files[0])}
                          className="block w-full text-sm text-slate-500 
                            file:mr-4 file:py-2 file:px-4 
                            file:rounded-full file:border-0 
                            file:text-sm file:font-semibold 
                            file:bg-purple-50 file:text-purple-700 
                            hover:file:bg-purple-100
                            border border-slate-300 rounded-lg p-2"
                        />
                        {coaFile && (
                          <p className="text-sm text-green-600 flex items-center gap-2 mt-2">
                            ✅ נבחר: {coaFile.name}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-50/80 backdrop-blur-sm p-6 border-t border-slate-200/50">
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setCoaUploadDialog(null);
                            setCoaFile(null);
                          }}
                          className="flex-1 bg-white/90 backdrop-blur-sm border-slate-300 hover:bg-slate-50"
                        >
                          ביטול
                        </Button>
                        <Button
                          onClick={handleCOAUploadSubmit}
                          disabled={uploadingCOA || !coaFile}
                          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
                        >
                          {uploadingCOA ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin ml-2" />
                              מעלה...
                            </>
                          ) : (
                            '📤 העלה תעודה'
                          )}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Handling Item Dialog */}
            <AnimatePresence>
              {handlingItemDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/30 backdrop-blur-md"
                    onClick={() => {
                      setHandlingItemDialog(null);
                      setActionNotes('');
                    }}
                  />

                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative bg-white/95 backdrop-blur-xl border border-slate-200/50 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
                  >
                    <div className="bg-gradient-to-r from-blue-50/90 to-slate-50/90 backdrop-blur-sm p-6 border-b border-slate-200/50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 mb-2">טיפול בפריטים</h3>
                          <p className="text-lg font-semibold text-blue-700 mb-1">{handlingItemDialog?.reagent_name}</p>
                          <p className="text-base font-mono font-medium text-slate-700">אצווה: {handlingItemDialog?.batch_number}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setHandlingItemDialog(null);
                            setActionNotes('');
                          }}
                          className="h-8 w-8 text-slate-400 hover:text-slate-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="p-6 space-y-6">
                      <div className="bg-blue-50/60 backdrop-blur-sm rounded-xl p-4 border border-blue-200/50">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="font-medium text-slate-600">ספק:</span>
                            <p className="text-slate-900 font-medium">{handlingItemDialog?.supplier}</p>
                          </div>
                          <div>
                            <span className="font-medium text-slate-600">תפוגה:</span>
                            <p className="text-slate-900 font-medium">
                              {handlingItemDialog?.expiry_date && isValid(parseISO(handlingItemDialog.expiry_date))
                                ? format(parseISO(handlingItemDialog.expiry_date), 'dd/MM/yyyy')
                                : 'אין'}
                            </p>
                          </div>
                          <div className="col-span-2 text-center">
                            <span className="font-medium text-slate-600">כמות זמינה:</span>
                            <p className="text-2xl font-bold text-blue-600 mt-1">{formatQuantity(remainingQuantity)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-base font-medium text-slate-800">בחר פעולה</Label>
                        <Select value={actionType} onValueChange={setActionType}>
                          <SelectTrigger className="w-full bg-white/90 backdrop-blur-sm border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="disposed">השמדה</SelectItem>
                            <SelectItem value="consumed_by_expiry">נצרך עקב תפוגה</SelectItem>
                            <SelectItem value="other_use">שימוש אחר</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-base font-medium text-slate-800">{getActionTypeLabel(actionType)}</Label>
                        <Input
                          type="number"
                          value={handlingQuantity}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || (!isNaN(val) && parseFloat(val) >= 0 && parseFloat(val) <= remainingQuantity)) {
                              setHandlingQuantity(val);
                            }
                          }}
                          placeholder="הזן כמות"
                          min="0"
                          max={remainingQuantity}
                          className="text-lg text-center font-mono bg-white/90 backdrop-blur-sm border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                        <p className="text-xs text-slate-500 text-center">
                          מקסימום: {formatQuantity(remainingQuantity)} יחידות
                        </p>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-base font-medium text-slate-800">הערות (אופציונלי)</Label>
                        <Textarea
                          placeholder="הוסף הערות על הטיפול בפריט..."
                          value={actionNotes}
                          onChange={(e) => setActionNotes(e.target.value)}
                          className="min-h-[60px] bg-white/90 backdrop-blur-sm border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="bg-slate-50/80 backdrop-blur-sm p-6 border-t border-slate-200/50">
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setHandlingItemDialog(null);
                            setActionNotes('');
                          }}
                          className="flex-1 bg-white/90 backdrop-blur-sm border-slate-300 hover:bg-slate-50"
                        >
                          ביטול
                        </Button>
                        <Button
                          onClick={handleProcessAction}
                          disabled={isHandlingAction || !handlingQuantity || parseFloat(handlingQuantity) <= 0}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                        >
                          {isHandlingAction ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin ml-2" />
                              מעבד...
                            </>
                          ) : (
                            'בצע פעולה'
                          )}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}
