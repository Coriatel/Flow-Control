
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { createPageUrl } from "@/utils";
import BackButton from '@/components/ui/BackButton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Loader2,
  RefreshCw,
  FileText,
  ChevronUp,
  ChevronDown,
  Trash2,
  RotateCw,
  X,
  Upload,
  SlidersHorizontal,
  Search,
  AlertTriangle,
  Package,
  CheckCircle,
  Paperclip,
  Clock,
  TrendingUp,
  Filter,
  Eye,
  Edit3,
  FlaskConical,
  Printer,
  Calendar as CalendarIcon,
  Columns
} from "lucide-react";
import { format, parseISO, isValid, addDays, isAfter, isBefore, startOfToday, differenceInDays, startOfMonth, endOfMonth, isSameDay } from "date-fns";
import { he } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { formatQuantity } from '../components/utils/formatters';
import { AnimatePresence, motion } from 'framer-motion';

import { Reagent } from '@/api/entities';
import { ReagentBatch } from '@/api/entities';
import { InventoryTransaction } from '@/api/entities';
import { ExpiredProductLog } from '@/api/entities';
import { User } from '@/api/entities';
import { Supplier } from '@/api/entities';
import { UploadFile } from "@/api/integrations";
import { getBatchAndExpiryData } from '@/api/functions';

// Helper functions
const getActionTakenLabel = (action) => {
  const labels = {
    'disposed': 'כמות הושמדה',
    'other_use': 'שימוש אחר',
    'consumed_by_expiry': 'כמות שנצרכה לפני זמן התפוגה'
  };
  return labels[action] || action;
};

const getStatusDisplay = (status) => {
  switch (status) {
    case 'active': return 'פעיל';
    case 'expired': return 'פג תוקף';
    case 'disposed': return 'הושמד';
    case 'consumed': return 'נצרך';
    case 'quarantine': return 'בהסגר';
    case 'consumed_by_expiry': return 'נצרך (עקב תפוגה)';
    case 'other_use': return 'שימוש אחר';
    default: return status;
  }
};

// Refined color styling
const getExpiryColorClasses = (daysToExpiry) => {
  if (daysToExpiry === null || daysToExpiry === undefined) {
    return { bgColor: 'bg-slate-50 border-slate-200', textColor: 'text-slate-600', border: 'border-slate-300' };
  }

  if (daysToExpiry < 0) {
    return {
      bgColor: 'bg-red-100 border-red-300 shadow-sm',
      textColor: 'text-red-800 font-semibold',
      border: 'border-red-500'
    };
  } else if (daysToExpiry <= 3) {
    return {
      bgColor: 'bg-red-50 border-red-200 shadow-sm',
      textColor: 'text-red-700 font-medium',
      border: 'border-red-400'
    };
  } else if (daysToExpiry <= 7) {
    return {
      bgColor: 'bg-orange-50 border-orange-200 shadow-sm',
      textColor: 'text-orange-700 font-medium',
      border: 'border-orange-300'
    };
  } else if (daysToExpiry <= 14) {
    return {
      bgColor: 'bg-amber-50 border-amber-200 shadow-sm',
      textColor: 'text-amber-700',
      border: 'border-amber-300'
    };
  } else if (daysToExpiry <= 30) {
    return {
      bgColor: 'bg-blue-50 border-blue-200 shadow-sm',
      textColor: 'text-blue-700',
      border: 'border-blue-300'
    };
  } else {
    return {
      bgColor: 'bg-slate-50 border-slate-200',
      textColor: 'text-slate-600',
      border: 'border-slate-300'
    };
  }
};

const getStatusBadgeClasses = (status) => {
  switch (status) {
    case 'active':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-sm';
    case 'expired':
      return 'bg-red-100 text-red-800 border-red-300 shadow-sm';
    case 'disposed':
      return 'bg-slate-100 text-slate-800 border-slate-300 shadow-sm';
    case 'consumed':
      return 'bg-blue-100 text-blue-800 border-blue-300 shadow-sm';
    case 'quarantine':
      return 'bg-orange-100 text-orange-800 border-orange-300 shadow-sm';
    case 'consumed_by_expiry':
      return 'bg-purple-100 text-purple-800 border-purple-300 shadow-sm';
    case 'other_use':
      return 'bg-indigo-100 text-indigo-800 border-indigo-300 shadow-sm';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-300 shadow-sm';
  }
};

const categories = {
  "reagents": "ריאגנטים",
  "cells": "כדוריות",
  "controls": "בקרות",
  "solutions": "תמיסות",
  "consumables": "מתכלים"
};

// DatePicker component for filter controls
const DatePicker = ({ selected, onChange, placeholderText }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-right font-normal bg-white/50 backdrop-blur-sm border-slate-300 text-slate-800 hover:bg-white/70",
            !selected && "text-muted-foreground"
          )}
        >
          {selected ? format(selected, "PPP", { locale: he }) : <span>{placeholderText}</span>}
          <CalendarIcon className="mr-auto ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end" dir="rtl">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={onChange}
          initialFocus
          locale={he}
        />
      </PopoverContent>
    </Popover>
  );
};


// הגדרת שמות העמודות
const columns = {
  select: 'בחירה',
  reagent_name: 'שם ריאגנט',
  supplier: 'ספק',
  batch_number: 'מספר אצווה',
  expiry_date: 'תאריך תפוגה',
  days_to_expiry: 'ימים לתפוגה',
  current_quantity: 'כמות נוכחית',
  status: 'סטטוס',
  coa_status: 'ת. אנליזה',
  actions: 'פעולות',
};

// Default column widths for initial state and merging with loaded state
// This constant needs to be outside for loadSavedState to access it.
const initialDefaultColumnWidths = {
  select: 40,
  reagent_name: 200,
  supplier: 120,
  batch_number: 120,
  expiry_date: 130,
  days_to_expiry: 120,
  current_quantity: 100,
  status: 120,
  coa_status: 80,
  actions: 100
};

// Main Component
export default function BatchAndExpiryManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Unified data structure
  const [allData, setAllData] = useState({ allBatches: [], handledBatches: [], allSuppliers: [], reagentInfoCache: {} });

  // Load saved state from localStorage with safe fallbacks
  const loadSavedState = useCallback(() => {
    try {
      const savedFilters = localStorage.getItem('batchFilters');
      const savedColumns = localStorage.getItem('batchVisibleColumns');
      const savedColumnWidths = localStorage.getItem('batchColumnWidths');

      let parsedFilters = null;
      if (savedFilters) {
        try {
          parsedFilters = JSON.parse(savedFilters);
        } catch (parseError) {
          console.warn('Failed to parse saved filters from localStorage, using defaults:', parseError);
          parsedFilters = null;
        }
      }

      let parsedColumns = null;
      if (savedColumns) {
        try {
          parsedColumns = JSON.parse(savedColumns);
        } catch (parseError) {
          console.warn('Failed to parse visible columns from localStorage, using defaults:', parseError);
          parsedColumns = null;
        }
      }

      let parsedColumnWidths = null;
      if (savedColumnWidths) {
        try {
          parsedColumnWidths = JSON.parse(savedColumnWidths);
        } catch (parseError) {
          console.warn('Failed to parse saved column widths from localStorage, using defaults:', parseError);
          parsedColumnWidths = null;
        }
      }

      return {
        filters: parsedFilters ? {
          searchTerm: parsedFilters.searchTerm || '',
          selectedStatuses: Array.isArray(parsedFilters.selectedStatuses) ? parsedFilters.selectedStatuses : [],
          startDate: parsedFilters.startDate ? new Date(parsedFilters.startDate) : startOfMonth(new Date()),
          endDate: parsedFilters.endDate ? new Date(parsedFilters.endDate) : endOfMonth(new Date()),
          showHandled: parsedFilters.showHandled || false,
          showExpiredOnly: parsedFilters.showExpiredOnly || false,
          showInStockOnly: parsedFilters.showInStockOnly || false,
          showActiveOnly: parsedFilters.showActiveOnly !== undefined ? parsedFilters.showActiveOnly : true
        } : null,
        columns: parsedColumns || null,
        columnWidths: parsedColumnWidths ? { ...initialDefaultColumnWidths, ...parsedColumnWidths } : null // Merge with defaults
      };
    } catch (error) {
      console.warn('Failed to load saved state from localStorage:', error);
    }
    return { filters: null, columns: null, columnWidths: null };
  }, []); // initialDefaultColumnWidths removed from dependency array as it's a constant.

  const savedState = loadSavedState();

  // Initial visible columns definition (moved here for clarity and use in useState fallback)
  const initialVisibleColumns = {
    select: true, // For checkbox
    reagent_name: true,
    supplier: true,
    batch_number: true,
    expiry_date: true,
    days_to_expiry: true,
    current_quantity: true,
    status: true,
    coa_status: true,
    actions: true,
  };

  // NEW: Individual filter states replacing the `filters` object, initialized from savedState
  const [searchTerm, setSearchTerm] = useState(savedState.filters?.searchTerm ?? '');
  const [selectedStatuses, setSelectedStatuses] = useState(savedState.filters?.selectedStatuses ?? []);
  const [startDate, setStartDate] = useState(savedState.filters?.startDate ?? startOfMonth(new Date()));
  const [endDate, setEndDate] = useState(savedState.filters?.endDate ?? endOfMonth(new Date()));
  const [showHandled, setShowHandled] = useState(savedState.filters?.showHandled ?? false);
  const [showExpiredOnly, setShowExpiredOnly] = useState(savedState.filters?.showExpiredOnly ?? false);
  const [showInStockOnly, setShowInStockOnly] = useState(savedState.filters?.showInStockOnly ?? false);
  const [showActiveOnly, setShowActiveOnly] = useState(savedState.filters?.showActiveOnly ?? true); // Default to true if not specified

  // Column visibility states
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(savedState.columns ?? initialVisibleColumns);

  // Column width states
  const defaultColumnWidths = { // This is now inside the component as per the outline
    select: 60,
    reagent_name: 200,
    supplier: 140,
    batch_number: 130,
    expiry_date: 130,
    days_to_expiry: 130,
    current_quantity: 120,
    status: 120,
    coa_status: 100,
    actions: 140
  };
  // NEW: Column widths state, initialized from savedState or defaults
  const [columnWidths, setColumnWidths] = useState(savedState.columnWidths ?? defaultColumnWidths); // Used savedState.columnWidths for consistency

  // NEW: State for column resizing, moved from UnifiedBatchTable
  const [isResizing, setIsResizing] = useState(false);
  const [resizingColumn, setResizingColumn] = useState(null);

  // ✅ שימוש ב-useRef במקום state לשיפור ביצועים
  const resizeDataRef = useRef({
    startX: 0,
    startWidth: 0,
    currentColumn: null
  });

  // Filter panel state
  const [isMobileFilterMenuOpen, setIsMobileFilterMenuOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set()); // ✅ Fix applied here
  const [sortConfig, setSortConfig] = useState({ key: 'expiry_date', direction: 'asc' });

  // NEW: Enhanced dialog states for the new handling system
  const [handlingItemDialog, setHandlingItemDialog] = useState(null);
  const [actionType, setActionType] = useState('disposed');
  const [handlingQuantity, setHandlingQuantity] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [isHandlingAction, setIsHandlingAction] = useState(false);
  const [remainingQuantity, setRemainingQuantity] = useState(0);

  // COA Dialog states
  const [showCOADialog, setShowCOADialog] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [coaFile, setCoaFile] = useState(null);
  const [coaFileName, setCoaFileName] = useState('');
  const [uploadingCOA, setUploadingCOA] = useState(false);

  // Constants for filter labels
  const statusLabels = {
    'active': 'פעיל',
    'expired': 'פג תוקף',
    'disposed': 'הושמד',
    'consumed': 'נצרך',
    'quarantine': 'בהסגר',
    'consumed_by_expiry': 'נצרך (תפוגה)',
    'other_use': 'שימוש אחר'
  };

  // Save filters to localStorage whenever they change
  useEffect(() => {
    try {
      const filtersToSave = {
        searchTerm,
        selectedStatuses,
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate ? endDate.toISOString() : null,
        showHandled,
        showExpiredOnly,
        showInStockOnly,
        showActiveOnly
      };
      localStorage.setItem('batchFilters', JSON.stringify(filtersToSave));
    } catch (error) {
      console.warn('Failed to save filters to localStorage:', error);
    }
  }, [searchTerm, selectedStatuses, startDate, endDate, showHandled, showExpiredOnly, showInStockOnly, showActiveOnly]);

  // Save visible columns to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('batchVisibleColumns', JSON.stringify(visibleColumns));
    } catch (error) {
      console.warn('Failed to save visible columns to localStorage:', error);
    }
  }, [visibleColumns]);

  // NEW: Save column widths to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('batchColumnWidths', JSON.stringify(columnWidths));
    } catch (error) {
      console.warn('Failed to save column widths to localStorage:', error);
    }
  }, [columnWidths]);


  // Callbacks for filter changes
  const toggleStatus = useCallback((status) => {
    setSelectedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  }, []);

  const toggleColumn = useCallback((key) => {
    setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedStatuses([]);
    setStartDate(startOfMonth(new Date()));
    setEndDate(endOfMonth(new Date()));
    setShowHandled(false);
    setShowExpiredOnly(false);
    setShowInStockOnly(false);
    setShowActiveOnly(true); // Reset to default true

    // Also clear from localStorage
    try {
      localStorage.removeItem('batchFilters');
    } catch (error) {
      console.warn('Failed to clear filters from localStorage:', error);
    }
  }, []);

  // ✅ Column Resizing Handlers - מהירות משופרת פי 2
  const handleMouseDown = useCallback((e, columnKey) => {
    e.preventDefault();
    e.stopPropagation();

    const currentWidth = columnWidths[columnKey] || defaultColumnWidths[columnKey] || 100;

    // שמירת נתונים ב-ref במקום state (מהיר יותר)
    resizeDataRef.current = {
      startX: e.clientX,
      startWidth: currentWidth,
      currentColumn: columnKey
    };

    setIsResizing(true);
    setResizingColumn(columnKey); // Keep this to trigger useEffect for event listeners

    // Cursor וסגנון מיידי
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [columnWidths, defaultColumnWidths]);

  const handleMouseMove = useCallback((e) => {
    if (!isResizing || !resizeDataRef.current.currentColumn) {
      return;
    }

    // ✅ הכפלת מהירות התזוזה (x2)
    const diff = (resizeDataRef.current.startX - e.clientX) * 2; // הכפלה פה!
    const newWidth = Math.max(60, resizeDataRef.current.startWidth + diff);

    // עדכון מיידי של state
    setColumnWidths(prev => ({
      ...prev,
      [resizeDataRef.current.currentColumn]: newWidth
    }));
  }, [isResizing]); // Removed startX, startWidth, resizingColumn from dependencies as they are now in ref

  const handleMouseUp = useCallback(() => {
    if (isResizing) {
      setIsResizing(false);
      setResizingColumn(null); // Reset state

      // איפוס cursor וסגנון
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';

      // ניקוי ref
      resizeDataRef.current = {
        startX: 0,
        startWidth: 0,
        currentColumn: null
      };
    }
  }, [isResizing]);

  // ✅ תיקון קריטי: הוספת event listeners ל-document בצורה נכונה
  useEffect(() => {
    if (isResizing) {
      // הוספת event listeners כשמתחילים לגרור
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      // הסרת event listeners כשמסיימים לגרור
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto'; // Restore user-select
    }

    // Cleanup function
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);


  // Aggregate filter states into a single object for filteredAndSortedData useMemo
  const currentFilters = useMemo(() => {
    return {
      searchTerm,
      startDate,
      endDate,
      reagentIds: [], // Not implemented in UI yet
      supplier: [],   // Not implemented in UI yet
      showHandled,
      showExpiredOnly,
      showInStockOnly,
      showActiveOnly,
      selectedStatuses,
    };
  }, [searchTerm, startDate, endDate, showHandled, showExpiredOnly, showInStockOnly, showActiveOnly, selectedStatuses]);

  // NEW: Utility functions for button visibility and styling
  const utils = useMemo(() => {
    const canBeHandled = (item) => {
      // Determines if the "Handle" button should be visible at all
      return (item?.current_quantity || 0) > 0 && !item?.action_taken;
    };

    const isUrgentForColor = (item, daysToExpiry) => {
      // Determines if an item needs *urgent* handling (for button color)
      return (
        item?.expiry_date &&
        isValid(parseISO(item.expiry_date)) &&
        !item?.action_taken &&
        (item?.current_quantity || 0) > 0 &&
        daysToExpiry !== null && daysToExpiry <= 7
      );
    };

    return {
      canBeHandled,
      isUrgentForColor,
    };
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getBatchAndExpiryData();

      if (!data) {
        throw new Error("לא התקבל מידע מהשרת.");
      }

      const { allBatches, handledBatches, allSuppliers, reagentInfoCache } = data;

      setAllData({
        allBatches: allBatches || [],
        handledBatches: handledBatches || [],
        allSuppliers: allSuppliers || [],
        reagentInfoCache: reagentInfoCache || {}
      });

    } catch (error) {
      console.error("Error fetching reports data:", error);
      const description = error.message.includes("Network")
        ? "אירעה שגיאת רשת. אנא בדוק את חיבור האינטרנט שלך ונסה שוב."
        : error.message;
      toast({ title: "שגיאה בטעינת דוחות", description: description, variant: "destructive" });
      setError("שגיאה בטעינת נתוני האצוות. בדוק את חיבור האינטרנט ונסה לרענן.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const filteredAndSortedData = useMemo(() => {
    const activeBatches = allData.allBatches || [];
    const handledLogs = allData.handledBatches || [];

    const today = startOfToday();

    // 1. Filter active batches based on ALL filters
    let filteredActive = activeBatches.filter(item => {
      // Search filter
      if (currentFilters.searchTerm) {
        const searchTermLower = currentFilters.searchTerm.toLowerCase();
        const matchesSearch =
          item.reagent_name?.toLowerCase().includes(searchTermLower) ||
          (item.batch_number || '')?.toLowerCase().includes(searchTermLower) ||
          item.supplier?.toLowerCase().includes(searchTermLower);
        if (!matchesSearch) return false;
      }

      // Expiry Date range filter
      if (item?.expiry_date && isValid(parseISO(item.expiry_date))) {
        const expiryDate = parseISO(item.expiry_date);
        const fromDate = currentFilters.startDate;
        const toDate = currentFilters.endDate;
        if (fromDate && isBefore(expiryDate, fromDate)) return false;
        if (toDate && isAfter(expiryDate, addDays(toDate, 1))) return false;
      }

      // Status filter (new)
      if (currentFilters.selectedStatuses.length > 0 && !currentFilters.selectedStatuses.includes(item.status)) {
        return false;
      }

      // Reagent IDs and Supplier filters (still applied, but no UI in outline)
      if (currentFilters.reagentIds?.length > 0 && !currentFilters.reagentIds.includes(item.reagent_id)) return false;
      if (currentFilters.supplier?.length > 0 && !currentFilters.supplier.includes(item.supplier)) return false;

      // showInStockOnly filter
      if (currentFilters.showInStockOnly && (item.current_quantity === 0 || item.current_quantity === null)) {
        return false;
      }

      // showExpiredOnly filter
      if (currentFilters.showExpiredOnly && (!item.expiry_date || isAfter(parseISO(item.expiry_date), today))) {
        return false;
      }

      // showActiveOnly filter
      if (currentFilters.showActiveOnly && item.status !== 'active') {
        return false;
      }

      return true;
    });

    // 2. Filter handled logs if showHandled is true, also based on date and other filters
    let filteredHandled = [];
    if (currentFilters.showHandled) {
      filteredHandled = handledLogs.filter(log => {
        // Search filter for logs
        if (currentFilters.searchTerm) {
          const searchTermLower = currentFilters.searchTerm.toLowerCase();
          const matchesSearch =
            log.reagent_name_snapshot?.toLowerCase().includes(searchTermLower) ||
            (log.batch_number_snapshot || '')?.toLowerCase().includes(searchTermLower);
          if (!matchesSearch) return false;
        }

        // Date filter for logs (using original_expiry_date)
        if (log?.original_expiry_date && isValid(parseISO(log.original_expiry_date))) {
          const expiryDate = parseISO(log.original_expiry_date);
          const fromDate = currentFilters.startDate;
          const toDate = currentFilters.endDate;
          if (fromDate && isBefore(expiryDate, fromDate)) return false;
          if (toDate && isAfter(expiryDate, addDays(toDate, 1))) return false;
        }

        // Status filter for logs (using action_taken as status)
        if (currentFilters.selectedStatuses.length > 0 && !currentFilters.selectedStatuses.includes(log.action_taken)) {
          return false;
        }

        // Reagent and Supplier filters for logs
        if (currentFilters.reagentIds?.length > 0 && !currentFilters.reagentIds.includes(log.reagent_id)) return false;
        const reagentInfo = allData.reagentInfoCache[log.reagent_id];
        if (currentFilters.supplier?.length > 0 && !(reagentInfo && currentFilters.supplier.includes(reagentInfo.supplier))) return false;

        // showExpiredOnly also applies to handled logs
        if (currentFilters.showExpiredOnly && (!log.original_expiry_date || isAfter(parseISO(log.original_expiry_date), today))) {
          return false;
        }

        // Handled items are not 'in stock' or 'active' in the same sense,
        // so showInStockOnly and showActiveOnly don't apply here directly for logs.
        return true;
      });
    }

    // 3. Combine filtered data
    let combinedData = [...filteredActive];
    if (currentFilters.showHandled) {
      combinedData.push(...filteredHandled);
    }

    // Remove duplicates that might occur if a batch is in both lists and passes both filters
    const uniqueData = combinedData.filter((item, index, self) =>
      index === self.findIndex(t => t.id === item.id)
    );

    // 4. Sort the final combined data
    const sortedData = [...uniqueData].sort((a, b) => {
      let aValue, bValue;

      switch (sortConfig.key) {
        case 'days_to_expiry':
          aValue = (a?.expiry_date && isValid(parseISO(a.expiry_date))) ? differenceInDays(parseISO(a.expiry_date), new Date()) :
                   (a?.original_expiry_date && isValid(parseISO(a.original_expiry_date))) ? differenceInDays(parseISO(a.original_expiry_date), new Date()) : Infinity;
          bValue = (b?.expiry_date && isValid(parseISO(b.expiry_date))) ? differenceInDays(parseISO(b.expiry_date), new Date()) :
                   (b?.original_expiry_date && isValid(parseISO(b.original_expiry_date))) ? differenceInDays(parseISO(b.original_expiry_date), new Date()) : Infinity;
          break;
        case 'expiry_date':
          aValue = (a?.expiry_date && isValid(parseISO(a.expiry_date))) ? parseISO(a.expiry_date).getTime() :
                   (a?.original_expiry_date && isValid(parseISO(a.original_expiry_date))) ? parseISO(a.original_expiry_date).getTime() : Infinity;
          bValue = (b?.expiry_date && isValid(parseISO(b.expiry_date))) ? parseISO(b.expiry_date).getTime() :
                   (b?.original_expiry_date && isValid(parseISO(b.original_expiry_date))) ? parseISO(b.original_expiry_date).getTime() : Infinity;
          break;
        case 'current_quantity':
          aValue = Number(a?.current_quantity ?? a?.quantity_affected) || 0;
          bValue = Number(b?.current_quantity ?? b?.quantity_affected) || 0;
          break;
        case 'documented_date': // For handled batches
          aValue = (a?.documented_date && isValid(parseISO(a.documented_date))) ? parseISO(a.documented_date).getTime() : -Infinity;
          bValue = (b?.documented_date && isValid(parseISO(b.documented_date))) ? parseISO(b.documented_date).getTime() : -Infinity;
          break;
        case 'coa_status':
          aValue = a.coa_document_url ? 1 : 0;
          bValue = b.coa_document_url ? 1 : 0;
          break;
        case 'status':
          const statusOrder = {
            'active': 1,
            'quarantine': 2,
            'expired': 3,
            'consumed': 4,
            'disposed': 5,
            'consumed_by_expiry': 6,
            'other_use': 7,
          };
          const getSortableStatus = (item) => {
              if (item.action_taken) {
                  return item.action_taken;
              }
              if (!item.status && item.original_expiry_date) {
                  return isAfter(parseISO(item.original_expiry_date), today) ? 'active' : 'expired';
              }
              return item.status;
          };
          aValue = statusOrder[getSortableStatus(a)] || Infinity;
          bValue = statusOrder[getSortableStatus(b)] || Infinity;
          break;
        case 'reagent_name':
          aValue = String(a?.reagent_name || a?.reagent_name_snapshot || '').toLowerCase();
          bValue = String(b?.reagent_name || b?.reagent_name_snapshot || '').toLowerCase();
          break;
        case 'supplier':
          aValue = String(allData.reagentInfoCache[a?.reagent_id]?.supplier || a?.supplier || '').toLowerCase();
          bValue = String(allData.reagentInfoCache[b?.reagent_id]?.supplier || b?.supplier || '').toLowerCase();
          break;
        case 'batch_number':
          aValue = String(a?.batch_number || a?.batch_number_snapshot || '').toLowerCase();
          bValue = String(b?.batch_number || b?.batch_number_snapshot || '').toLowerCase();
          break;
        case 'action_taken':
        default:
          aValue = String(a?.[sortConfig.key] || '').toLowerCase();
          bValue = String(b?.[sortConfig.key] || '').toLowerCase();
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sortedData;
  }, [allData, currentFilters, sortConfig]);

  // Generate options for reagent multi-select (still exists but UI is not in filterControls)
  const reagentOptions = useMemo(() => {
    if (!allData.reagentInfoCache) return [];
    const uniqueReagents = new Map();
    [...allData.allBatches, ...allData.handledBatches].forEach(item => {
      if (item.reagent_id && !uniqueReagents.has(item.reagent_id)) {
        uniqueReagents.set(item.reagent_id, {
          value: item.reagent_id,
          label: allData.reagentInfoCache[item.reagent_id]?.name || item.reagent_name || 'ריאגנט לא ידוע'
        });
      }
    });
    return Array.from(uniqueReagents.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [allData]);


  const handleSort = useCallback((key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  }, [sortConfig]);

  const handleSelectItem = useCallback((itemId) => {
    setSelectedItems(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(itemId)) {
        newSelection.delete(itemId);
      } else {
        newSelection.add(itemId);
      }
      return newSelection;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedItems.size === filteredAndSortedData.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredAndSortedData.map(item => item.id)));
    }
  }, [selectedItems, filteredAndSortedData]);


  // COA handling functions
  const handleCOAUpload = (batch) => {
    setSelectedBatch(batch);
    setShowCOADialog(true);
    setCoaFile(null);
    setCoaFileName('');
  };

  const handleCOAFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setCoaFile(file);
      setCoaFileName(file.name);
    }
  };

  const saveCOA = async () => {
    if (!coaFile || !selectedBatch) {
      toast({
        title: "שגיאה",
        description: "אנא בחר קובץ להעלאה.",
        variant: "default"
      });
      return;
    }

    setUploadingCOA(true);
    try {
      const uploadResult = await UploadFile({ file: coaFile });

      if (uploadResult && uploadResult.file_url) {
        let currentUser;
        try {
          currentUser = await User.me();
        } catch (userError) {
          console.warn("Could not get current user for COA upload:", userError);
        }

        await ReagentBatch.update(selectedBatch.id, {
          coa_document_url: uploadResult.file_url,
          coa_upload_date: new Date().toISOString(),
          coa_uploaded_by: currentUser?.email || 'system'
        });

        toast({
          title: "הצלחה!",
          description: `תעודת האנליזה עבור אצווה ${selectedBatch.batch_number} הועלתה בהצלחה.`,
          variant: "default"
        });

        await fetchData(); // Refresh data after update

        setShowCOADialog(false);
        setSelectedBatch(null);
        setCoaFile(null);
        setCoaFileName('');
      } else {
        throw new Error('שגיאה בהעלאת הקובץ');
      }
    } catch (error) {
      console.error('Error uploading COA:', error);
      toast({
        title: "שגיאה בהעלאת תעודת האנליזה",
        description: error.message || "אירעה שגיאה בהעלאת הקובץ.",
        variant: "destructive"
      });
    } finally {
      setUploadingCOA(false);
    }
  };

  const handleCOAView = useCallback(async (batch) => {
    if (!batch?.coa_document_url) {
      toast({
        title: "אין תעודת אנליזה",
        description: "לא הועלתה תעודת אנליזה עבור אצווה זו.",
        variant: "default"
      });
      return;
    }

    try {
      let urlToOpen = batch.coa_document_url;

      if (urlToOpen.includes('base44.app/api/apps/')) {
        const fileNameMatch = urlToOpen.match(/files\/(.+)$/);
        if (fileNameMatch) {
          const fileName = fileNameMatch[1];
          urlToOpen = `https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/${fileName}`;
        }
      }

      const newWindow = window.open(urlToOpen, '_blank', 'noopener,noreferrer');

      if (!newWindow) {
        try {
          await navigator.clipboard.writeText(urlToOpen);
          toast({
            title: "קישור הועתק ללוח",
            description: "חלון קופץ נחסם. הקישור הועתק.",
            variant: "default"
          });
        } catch (clipboardError) {
          toast({
            title: "פתח ידנית",
            description: `קישור: ${urlToOpen}`,
            variant: "default"
          });
        }
      }
    } catch (error) {
      console.error('COA view error:', error);
      toast({
        title: "שגיאה בצפייה בתעודה",
        description: "לא ניתן לפתוח את תעודת האנליזה.",
        variant: "destructive"
      });
    }
  }, [toast]);

  // NEW: Enhanced handle expired item function
  const handleOpenHandlingDialog = (batch) => {
    setHandlingItemDialog(batch);
    setRemainingQuantity(parseFloat(batch?.current_quantity) || 0);
    setHandlingQuantity(String(parseFloat(batch?.current_quantity) || 0));
    setActionType('disposed');
    setActionNotes('');
  };

  // NEW: Process handling action
  const handleProcessAction = async () => {
    if (!handlingItemDialog) return;

    setIsHandlingAction(true);
    try {
        const user = await User.me();
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

        await ExpiredProductLog.create({
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
            newStatus = actionType === 'disposed' ? 'disposed' : 'consumed';
        }

        await ReagentBatch.update(handlingItemDialog?.id, {
            current_quantity: newQuantity,
            status: newStatus
        });

        const transactionType = actionType === 'consumed_by_expiry' ? 'withdrawal' :
                              actionType === 'disposed' ? 'disposal' : 'other_use_expired';

        await InventoryTransaction.create({
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

        // Update remaining quantity in dialog
        setRemainingQuantity(newQuantity);
        setHandlingQuantity(String(newQuantity));

        // If quantity reached 0, close dialog and refresh
        if (newQuantity <= 0) {
          setHandlingItemDialog(null);
          setActionNotes('');
          await fetchData(); // Refresh data after update
        }

    } catch (error) {
        console.error('Error handling expired item:', error);
        toast({
            title: "שגיאה בביצוע הפעולה",
            description: error.message,
            variant: "destructive"
        });
    } finally {
        setIsHandlingAction(false);
    }
  };

  const handleRestoreBatch = async (log) => {
    if (!log?.id) {
        toast({ title: "שגיאה קריטית", description: "לא ניתן למצוא את מזהה הרישום לשחזור.", variant: "destructive" });
        return;
    }

    try {
        const correspondingBatches = await ReagentBatch.filter({
            reagent_id: log?.reagent_id,
            batch_number: log?.batch_number_snapshot,
            expiry_date: log?.original_expiry_date,
        });

        if (correspondingBatches.length > 0) {
            const batchToUpdate = correspondingBatches[0];
            const quantityToRestore = log?.quantity_affected;

            await ReagentBatch.update(batchToUpdate.id, {
                current_quantity: (batchToUpdate.current_quantity || 0) + quantityToRestore,
                status: isAfter(parseISO(batchToUpdate.expiry_date), new Date()) ? 'active' : 'expired'
            });

            await InventoryTransaction.create({
                reagent_id: log?.reagent_id,
                transaction_type: 'inventory_correction',
                quantity: quantityToRestore,
                batch_number: log?.batch_number_snapshot,
                expiry_date: log?.original_expiry_date,
                notes: `שחזור טיפול בפג תוקף: ${getActionTakenLabel(log.action_taken)} - החזרת ${formatQuantity(quantityToRestore)} יח' למלאי`
            });
        } else {
             toast({ title: "שגיאה", description: `לא נמצאה אצווה מתאימה לשחזור עבור ${log?.reagent_name_snapshot}.`, variant: "destructive" });
             return;
        }

        await ExpiredProductLog.delete(log.id);

        toast({ title: "אצווה שוחזרה", description: `האצווה ${log?.batch_number_snapshot} שוחזרה והכמות עודכנה במלאי.`, variant: "default" });

        await fetchData(); // Refresh data after update
    } catch (error) {
        console.error('Error restoring batch:', error);
        toast({ title: "שגיאה בשחזור", description: error.message, variant: "destructive" });
    }
  };

  const handleEditBatch = (batch) => {
    navigate(createPageUrl(`EditReagentBatch?id=${batch?.id || batch?.reagent_batch_id}`));
  };

  // Enhanced print report function (from outline, replacing previous one)
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "חסימת קופצים",
        description: "אנא אפשר חלונות קופצים כדי להדפיס את הדוח.",
        variant: "destructive"
      });
      return;
    }
    const printDocument = printWindow.document;

    // Calculate summaries based on the currently filtered data
    const totalBatches = filteredAndSortedData.length;
    const totalQuantity = filteredAndSortedData.reduce((sum, item) => sum + (item.current_quantity || 0), 0);

    const printHTML = `
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>דוח אצוות ופגי תוקף</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; font-size: 10px; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: right; }
            th { background-color: #f2f2f2; }
            .print-header { text-align: center; margin-bottom: 20px; }
            .print-summary { background: #eef2ff; border-top: 2px solid #6366f1; padding: 10px; margin: 20px 0; font-size: 13px; font-weight: bold; text-align: center; }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1>דוח אצוות ופגי תוקף</h1>
            <p>נוצר בתאריך: ${new Date().toLocaleDateString('he-IL')}</p>
          </div>

          <div class="print-summary">
            סה"כ אצוות: ${totalBatches} | סה"כ כמות יחידות: ${formatQuantity(totalQuantity)}
          </div>

          <table>
            <thead>
              <tr>
                <th>שם ריאגנט</th>
                <th>אצווה</th>
                <th>תפוגה</th>
                <th>כמות נוכחית</th>
                <th>סטטוס</th>
                <th>ספק</th>
              </tr>
            </thead>
            <tbody>
              ${filteredAndSortedData.map(item => `
                <tr>
                  <td>${item.reagent_name || item.reagent_name_snapshot || ''}</td>
                  <td>${item.batch_number || item.batch_number_snapshot || ''}</td>
                  <td>${item.expiry_date && isValid(parseISO(item.expiry_date)) ? format(parseISO(item.expiry_date), 'dd/MM/yyyy') : (item.original_expiry_date && isValid(parseISO(item.original_expiry_date)) ? format(parseISO(item.original_expiry_date), 'dd/MM/yyyy') : '')}</td>
                  <td>${formatQuantity(item.current_quantity ?? item.quantity_affected ?? 0)}</td>
                  <td>${getStatusDisplay(item.action_taken || item.status || '')}</td>
                  <td>${allData.reagentInfoCache[item.reagent_id]?.supplier || item.supplier || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    printDocument.write(printHTML);
    printDocument.close();
    printWindow.print();
  };

  const handleExportCSV = () => {
    const data = filteredAndSortedData;
    if (data.length === 0) {
      toast({
        title: "אין נתונים לייצוא",
        description: "הטבלה ריקה, אין מה לייצא לקובץ CSV.",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      'שם ריאגנט', 'ספק', 'מספר אצווה', 'תאריך תפוגה', 'כמות נוכחית', 'סטטוס', 'ימים לתפוגה',
      'ת. אנליזה קיימת', 'ת. אנליזה הועלתה ע"י', 'ת. אנליזה תאריך העלאה', 'הערות פעולה (בטיפול)',
      'כמות שהושפעה (בטיפול)', 'תאריך תיעוד (בטיפול)', 'מטופל ע"י (בטיפול)'
    ];
    let csv = '\uFEFF' + headers.join(',') + '\n'; // Add BOM for Hebrew characters

    data.forEach(item => {
      const daysUntilExpiry = (item.expiry_date && isValid(parseISO(item.expiry_date))) ? differenceInDays(parseISO(item.expiry_date), new Date()) :
                              (item.original_expiry_date && isValid(parseISO(item.original_expiry_date))) ? differenceInDays(parseISO(item.original_expiry_date), new Date()) : 'N/A';
      const itemStatus = item.action_taken || item.status;
      const reagentInfo = allData.reagentInfoCache[item.reagent_id];

      const row = [
        `"${item.reagent_name || item.reagent_name_snapshot || ''}"`,
        `"${reagentInfo?.supplier || item.supplier || ''}"`,
        `"${item.batch_number || item.batch_number_snapshot || ''}"`,
        `"${(item.expiry_date && isValid(parseISO(item.expiry_date))) ? format(parseISO(item.expiry_date), 'dd/MM/yyyy') : (item.original_expiry_date && isValid(parseISO(item.original_expiry_date))) ? format(parseISO(item.original_expiry_date), 'dd/MM/yyyy') : ''}"`,
        `"${formatQuantity(item.current_quantity ?? item.quantity_affected ?? 0)}"`,
        `"${getStatusDisplay(itemStatus)}"`,
        `"${daysUntilExpiry}"`,
        `"${item.coa_document_url ? 'כן' : 'לא'}"`,
        `"${item.coa_uploaded_by || ''}"`,
        `"${item.coa_upload_date && isValid(parseISO(item.coa_upload_date)) ? format(parseISO(item.coa_upload_date), 'dd/MM/yyyy HH:mm') : ''}"`,
        `"${item.action_notes || ''}"`,
        `"${item.quantity_affected || ''}"`,
        `"${item.documented_date && isValid(parseISO(item.documented_date)) ? format(parseISO(item.documented_date), 'dd/MM/yyyy HH:mm') : ''}"`,
        `"${item.documented_by_user_id || ''}"` // This would ideally be a user's name
      ].join(',');
      csv += row + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `report_batches_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: "ייצוא הושלם",
        description: "הדוח יוצא בהצלחה לקובץ CSV.",
        variant: "default",
      });
    } else {
      toast({
        title: "שגיאת ייצוא",
        description: "הדפדפן אינו תומך בייצוא CSV ישיר.",
        variant: "destructive",
      });
    }
  };

  // UPDATED: Get action type labels with corrected texts
  const getActionTypeLabel = (type) => {
    switch(type) {
      case 'disposed': return 'כמות להשמדה';
      case 'consumed_by_expiry': return 'כמות שנצרכה';
      case 'other_use': return 'כמות לשימוש אחר';
      default: return 'כמות לטיפול';
    }
  };

  // filterControls JSX (reusable for mobile side menu)
  const filterControls = (
    <div className="p-6 text-white h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-100">סינון מתקדם</h2>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileFilterMenuOpen(false)} className="lg:hidden text-white hover:bg-white/10">
          <X className="h-6 w-6" />
        </Button>
      </div>

      <div className="space-y-6">
        <div>
          <Label className="text-slate-300 mb-2 block">טווח תאריכי תפוגה</Label>
          <div className="flex flex-col gap-2 mt-2">
            <DatePicker selected={startDate} onChange={setStartDate} placeholderText="מתאריך" />
            <DatePicker selected={endDate} onChange={setEndDate} placeholderText="עד תאריך" />
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-slate-300 mb-2 block">סטטוסים</Label>
          <div className="flex flex-wrap gap-2">
            {['active', 'expired', 'disposed', 'consumed', 'quarantine', 'consumed_by_expiry', 'other_use'].map((status) => (
              <Button
                key={status}
                variant={selectedStatuses.includes(status) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleStatus(status)}
                className={`text-white border-white/30 hover:bg-white/20
                            ${selectedStatuses.includes(status) ? 'bg-blue-600 hover:bg-blue-700 border-blue-600' : ''}`}
              >
                {statusLabels[status]}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="showHandled" className="text-slate-200 cursor-pointer">הצג אצוות שטופלו</Label>
            <Switch
              id="showHandled"
              checked={showHandled}
              onCheckedChange={setShowHandled}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="showExpiredOnly" className="text-slate-200 cursor-pointer">הצג פגי תוקף בלבד</Label>
            <Switch
              id="showExpiredOnly"
              checked={showExpiredOnly}
              onCheckedChange={setShowExpiredOnly}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>
           <div className="flex items-center justify-between">
            <Label htmlFor="showInStockOnly" className="text-slate-200 cursor-pointer">הצג במלאי בלבד</Label>
            <Switch
              id="showInStockOnly"
              checked={showInStockOnly}
              onCheckedChange={setShowInStockOnly}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>
           <div className="flex items-center justify-between">
            <Label htmlFor="showActiveOnly" className="text-slate-200 cursor-pointer">הצג אצוות פעילות בלבד</Label>
            <Switch
              id="showActiveOnly"
              checked={showActiveOnly}
              onCheckedChange={setShowActiveOnly}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>
        </div>
        <Button
          variant="outline"
          onClick={clearAllFilters}
          className="w-full text-white border-white/30 hover:bg-white/20"
        >
          נקה סינונים
        </Button>
      </div>
    </div>
  );


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50 p-6" dir="rtl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-12 w-12 mx-auto animate-spin text-blue-600 mb-4" />
            <p className="text-lg text-gray-600">טוען נתוני אצוות...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 bg-red-50 p-4 rounded-md max-w-md mx-auto">
          <AlertTriangle className="h-8 w-8 mx-auto mb-4" />
          <p className="mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline">
            נסה שוב
          </Button>
        </div>
      </div>
    );
  }

  const totalAllItems = allData.allBatches.length + allData.handledBatches.length;
  const activeFilterCount = [
    searchTerm ? 1 : 0,
    selectedStatuses.length > 0 ? 1 : 0,
    startDate && !isSameDay(startDate, startOfMonth(new Date())) ? 1 : 0,
    endDate && !isSameDay(endDate, endOfMonth(new Date())) ? 1 : 0,
    showHandled ? 1 : 0,
    showExpiredOnly ? 1 : 0,
    showInStockOnly ? 1 : 0,
    showActiveOnly ? 1 : 0,
  ].reduce((acc, val) => acc + val, 0);

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">

      {/* Mobile Header and Desktop header */}
      <header className="bg-white shadow-sm sticky top-0 z-20">
        {/* Mobile top bar */}
        <div className="px-4 py-3 border-b lg:hidden">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-800 truncate">ניהול אצוות ופגי תוקף</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {filteredAndSortedData.length} פריטים
              </p>
            </div>
            <div className="flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileFilterMenuOpen(true)}
                className="h-9 w-9"
              >
                <SlidersHorizontal className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile search and action buttons / Desktop full header */}
        <div className="px-4 py-2 bg-white/50 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            {/* Desktop navigation/title */}
            <div className="hidden lg:flex items-center gap-4 flex-grow">
              <BackButton />
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900">ניהול אצוות ופגי תוקף</h1>
                <p className="text-sm text-slate-600 mt-1">מציג {filteredAndSortedData.length} מתוך {totalAllItems} פריטים</p>
              </div>
            </div>

            {/* Search bar */}
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="חיפוש מהיר..."
                className="w-full pl-4 pr-10 bg-white"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Quality Assurance Button (always visible) */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => navigate(createPageUrl('QualityAssurance'))}
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 border-gray-300"
                    >
                      <FlaskConical className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>בקרת איכות</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>

               <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 border-gray-300"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 border-gray-300"
                onClick={handlePrint}
              >
                <Printer className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6">
        {/* Filters Section - Desktop: Collapsible Popover, Mobile: Current behavior */}
        <Card className="mb-6 shadow-sm">
            <CardContent className="p-4">
                {/* Desktop: Compact Filter Button */}
                <div className="hidden lg:flex items-center gap-3 flex-wrap">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <SlidersHorizontal className="h-4 w-4" />
                                סינון מתקדם
                                {activeFilterCount > 0 && (
                                    <span className="bg-amber-500 text-white text-xs rounded-full px-2 py-0.5">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px]" align="start">
                            <div className="space-y-4" dir="rtl">
                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-2 block">חיפוש</label>
                                    <div className="relative">
                                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            placeholder="חפש לפי שם, מס' אצווה או ספק..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pr-10"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-2 block">סטטוסים</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['active', 'expired', 'disposed', 'consumed', 'quarantine', 'consumed_by_expiry', 'other_use'].map((status) => (
                                            <Button
                                                key={status}
                                                variant={selectedStatuses.includes(status) ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => toggleStatus(status)}
                                                className={selectedStatuses.includes(status) ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
                                            >
                                                {statusLabels[status]}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 mb-2 block">מתאריך</label>
                                        <DatePicker selected={startDate} onChange={setStartDate} placeholderText="מתאריך" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 mb-2 block">עד תאריך</label>
                                        <DatePicker selected={endDate} onChange={setEndDate} placeholderText="עד תאריך" />
                                    </div>
                                </div>

                                <div className="space-y-2 pt-2 border-t">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-slate-700">הצג אצוות שטופלו</label>
                                        <Switch checked={showHandled} onCheckedChange={setShowHandled} />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-slate-700">הצג פגי תוקף בלבד</label>
                                        <Switch checked={showExpiredOnly} onCheckedChange={setShowExpiredOnly} />
                                     </div>
                                     <div className="flex items-center justify-between">
                                        <Label htmlFor="showInStockOnly" className="text-sm font-medium text-slate-700 cursor-pointer">הצג במלאי בלבד</Label>
                                        <Switch
                                          id="showInStockOnly"
                                          checked={showInStockOnly}
                                          onCheckedChange={setShowInStockOnly}
                                        />
                                    </div>
                                     <div className="flex items-center justify-between">
                                        <Label htmlFor="showActiveOnly" className="text-sm font-medium text-slate-700 cursor-pointer">הצג אצוות פעילות בלבד</Label>
                                        <Switch
                                          id="showActiveOnly"
                                          checked={showActiveOnly}
                                          onCheckedChange={setShowActiveOnly}
                                        />
                                    </div>
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearAllFilters}
                                    className="w-full"
                                >
                                    נקה סינונים
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <Button variant="outline" size="sm" onClick={() => setShowColumnSelector(!showColumnSelector)} className="gap-2">
                        <Columns className="h-4 w-4" />
                        עמודות
                    </Button>

                    <div className="flex-1" />

                    <span className="text-sm text-slate-600">
                        מציג {filteredAndSortedData.length} מתוך {totalAllItems}
                    </span>
                </div>

                {/* Mobile: Filter logic handled by the side menu (isMobileFilterMenuOpen) */}

                {/* Column Selector Popover (Desktop & Mobile) */}
                {showColumnSelector && (
                    <Card className="mt-4 p-4 bg-slate-50">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-sm">בחר עמודות להצגה</h4>
                            <Button variant="ghost" size="sm" onClick={() => setShowColumnSelector(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {Object.keys(initialVisibleColumns).map((key) => (
                                <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={visibleColumns[key]}
                                        onChange={() => toggleColumn(key)}
                                        className="rounded border-slate-300"
                                        disabled={key === 'reagent_name' || key === 'batch_number' || key === 'expiry_date' || key === 'status' || key === 'actions'} // Disable essential columns
                                    />
                                    <span>{columns[key]}</span>
                                </label>
                            ))}
                        </div>
                    </Card>
                )}
            </CardContent>
        </Card>

        {filteredAndSortedData.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-700 mb-2">אין נתונים להצגה</h3>
            <p className="text-slate-500">נסה לשנות את הפילטרים או לרענן את הנתונים</p>
          </div>
        ) : (
          <>
            {/* Mobile View - using new BatchCard component */}
            <div className="lg:hidden">
              <div className="space-y-1.5">
                {filteredAndSortedData.map((item) => (
                  <BatchCard
                    key={item.id}
                    item={item}
                    onHandleItem={handleOpenHandlingDialog}
                    onCOAUpload={handleCOAUpload}
                    onCOAView={handleCOAView}
                    onEdit={handleEditBatch}
                    onRestore={handleRestoreBatch}
                    utils={utils}
                    isSelected={selectedItems.has(item.id)}
                    onSelect={handleSelectItem}
                    reagentInfoCache={allData.reagentInfoCache}
                  />
                ))}
              </div>
            </div>

            {/* Desktop View - using UnifiedBatchTable */}
            <div className="hidden lg:block">
              <UnifiedBatchTable
                data={filteredAndSortedData}
                onSort={handleSort}
                sortConfig={sortConfig}
                onHandleExpired={handleOpenHandlingDialog}
                onCOAUpload={handleCOAUpload}
                onCOAView={handleCOAView}
                onEdit={handleEditBatch}
                onRestore={handleRestoreBatch}
                utils={utils}
                selectedItems={selectedItems}
                onSelectItem={handleSelectItem}
                onSelectAll={handleSelectAll}
                reagentInfoCache={allData.reagentInfoCache}
                visibleColumns={visibleColumns} // Pass visible columns
                columnsLabels={columns} // Pass column labels
                columnWidths={columnWidths} // Pass column widths for resizing
                onColumnResizeMouseDown={handleMouseDown} // Pass handler for resize mouse down
              />
            </div>
          </>
        )}
      </main>

      {/* Mobile Filter Side Menu */}
      <AnimatePresence>
        {isMobileFilterMenuOpen && (
          <div className="fixed inset-0 flex z-50 lg:hidden" dir="rtl">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/60"
              onClick={() => setIsMobileFilterMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative w-full max-w-xs h-full bg-slate-800/80 backdrop-blur-lg shadow-2xl"
            >
              {filterControls}
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* UPDATED: Enhanced Action Dialog with corrected texts, colors and larger headings */}
      <AnimatePresence>
        {handlingItemDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop with enhanced glassmorphism */}
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

            {/* Dialog Content - UPDATED: Better colors and typography */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white/95 backdrop-blur-xl border border-slate-200/50 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
            >
              {/* Header - UPDATED: System colors */}
              <div className="bg-gradient-to-r from-blue-50/90 to-slate-50/90 backdrop-blur-sm p-6 border-b border-slate-200/50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">טיפול בפריטים פגי תוקף</h3>
                    {/* UPDATED: Larger and more prominent reagent name and batch */}
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

              {/* Content - UPDATED: System colors */}
              <div className="p-6 space-y-6">
                {/* Batch Info - UPDATED: Better colors */}
                <div className="bg-blue-50/60 backdrop-blur-sm rounded-xl p-4 border border-blue-200/50">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-slate-600">ספק:</span>
                      <p className="text-slate-900 font-medium">{allData.reagentInfoCache[handlingItemDialog?.reagent_id]?.supplier || handlingItemDialog?.supplier || 'לא ידוע'}</p>
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

                {/* Action Type Selection - UPDATED: System colors */}
                <div className="space-y-3">
                  <Label className="text-base font-medium text-slate-800">בחר פעולה</Label>
                  <Select value={actionType} onValueChange={setActionType}>
                    <SelectTrigger className="w-full bg-white/90 backdrop-blur-sm border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="disposed">השמדה</SelectItem>
                      <SelectItem value="consumed_by_expiry">נצרך לפני זמן התפוגה</SelectItem>
                      <SelectItem value="other_use">שימוש אחר</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Quantity Input - UPDATED: System colors */}
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

                {/* Notes - UPDATED: System colors */}
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

              {/* Footer - UPDATED: System colors */}
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

      {/* UPDATED: COA Upload Dialog with new design */}
      <Dialog open={showCOADialog} onOpenChange={setShowCOADialog}>
        <DialogContent className="max-w-md bg-white border border-slate-300 rounded-2xl shadow-2xl" dir="rtl">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-3 text-xl font-bold text-slate-900">
              <div className="bg-amber-100 p-2 rounded-lg">
                <FileText className="h-6 w-6 text-amber-600" />
              </div>
              העלאת תעודת אנליזה
            </DialogTitle>
          </DialogHeader>

          {selectedBatch && (
            <div className="space-y-6">
              {/* Batch Info Card - Clear and prominent */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="text-sm font-medium text-slate-600 mb-2">פרטי האצווה:</div>
                <div className="text-2xl font-bold text-slate-900 mb-2">{selectedBatch?.reagent_name || selectedBatch?.reagent_name_snapshot}</div>
                <div className="text-lg font-semibold text-slate-800 mb-3">
                  אצווה: <span className="font-mono text-blue-700">{selectedBatch?.batch_number || selectedBatch?.batch_number_snapshot}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-700">
                  <span>תפוגה: {(selectedBatch?.expiry_date && isValid(parseISO(selectedBatch.expiry_date))) ? format(parseISO(selectedBatch.expiry_date), 'dd/MM/yyyy') : 'לא ידוע'}</span>
                  <span>ספק: {(allData.reagentInfoCache[selectedBatch.reagent_id]?.supplier) || selectedBatch?.supplier || 'לא ידוע'}</span>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="coa-file" className="text-base font-semibold text-slate-800">בחר קובץ תעודת אנליזה:</Label>
                <input
                  id="coa-file"
                  type="file"
                  accept="application/pdf,image/*"
                  capture="environment"
                  onChange={handleCOAFileSelect}
                  className="block w-full text-base text-slate-800 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-base file:font-semibold file:bg-amber-500 file:text-white hover:file:bg-amber-600 border border-slate-300 rounded-lg p-2"
                />
                {coaFileName && (
                  <div className="flex items-center gap-2 text-base font-medium text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
                    <CheckCircle className="h-5 w-5" />
                    קובץ נבחר: {coaFileName}
                  </div>
                )}
                <div className="text-sm text-slate-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                  📎 תמיכה בקבצי PDF ותמונות<br/>
                  📱 במובייל - לחץ לצילום ישיר של התעודה
                </div>
              </div>

              {selectedBatch?.coa_document_url && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-base font-medium text-blue-900 mb-2">
                    ⚠️ קיימת כבר תעודת אנליזה לאצווה זו
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCOAView(selectedBatch)}
                    className="bg-white border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <FileText className="h-4 w-4 ml-2" />
                    הצג תעודה קיימת
                  </Button>
                  <div className="text-sm text-blue-700 mt-2">
                    העלאת קובץ חדש תחליף את התעודה הקיימת
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-6 border-t border-slate-200">
            <Button
              variant="outline"
              onClick={() => setShowCOADialog(false)}
              className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              ביטול
            </Button>
            <Button
              onClick={saveCOA}
              disabled={!coaFile || uploadingCOA}
              className="bg-amber-500 hover:bg-amber-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadingCOA ? (
                <>
                  <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                  מעלה תעודה...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 ml-2" />
                  העלה תעודה
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ENHANCED: Unified Table Component with polished interactions
function UnifiedBatchTable({ data, onSort, sortConfig, onHandleExpired, onCOAUpload, onCOAView, onEdit, onRestore, utils, selectedItems, onSelectItem, onSelectAll, reagentInfoCache, visibleColumns, columnsLabels, columnWidths, onColumnResizeMouseDown }) {

  // Custom Sortable Header component for desktop table
  const SortableHeader = ({ field, label }) => (
    <div
      className={`flex items-center justify-between cursor-pointer hover:bg-gray-200 px-2 py-1 rounded transition-colors`}
      onClick={() => onSort(field)}
    >
      <span className="text-sm font-medium">{label}</span>
      <div className="flex flex-col items-center ml-1">
        <ChevronUp
          className={`h-3 w-3 ${
            sortConfig.key === field && sortConfig.direction === 'asc'
              ? 'text-blue-600' : 'text-gray-400'
          }`}
        />
        <ChevronDown
          className={`h-3 w-3 -mt-1 ${
            sortConfig.key === field && sortConfig.direction === 'desc'
              ? 'text-blue-600' : 'text-gray-400'
          }`}
        />
      </div>
    </div>
  );

  // Action buttons with better visual feedback
  const ActionButtonWithTooltip = ({ icon: Icon, onClick, tooltip, disabled }) => (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClick}
            disabled={disabled}
            className="h-8 w-8 hover:bg-slate-100 transition-colors duration-200 disabled:opacity-40"
          >
            <Icon className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-slate-800 text-white text-xs px-2 py-1">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  // NEW: Dedicated "Handle" button component for dynamic coloring
  const HandleActionButton = ({ item, isUrgent, onClick }) => (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            onClick={() => onClick(item)}
            className={`text-xs px-3 py-1.5 h-auto transition-colors duration-200
                        ${isUrgent ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}
                        text-white`}
          >
            טפל
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-slate-800 text-white text-xs px-2 py-1">
          <p>{isUrgent ? 'הפריט פג תוקף או עומד לפוג בקרוב' : 'טפל בפריט'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  // Better visual feedback for expiry date badges
  const ExpiryDateBadge = ({ date, daysLeft }) => {
    const expiryColors = getExpiryColorClasses(daysLeft);

    if (!date || !isValid(parseISO(date))) {
      return <span className="text-slate-500 text-xs">אין תאריך</span>;
    }

    const displayDate = format(parseISO(date), 'dd/MM/yyyy', { locale: he });

    return (
      <div className="flex items-center justify-center">
        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 hover:scale-105 ${expiryColors.bgColor} ${expiryColors.textColor}`}>
          {displayDate}
        </span>
      </div>
    );
  };

  // Days to expiry badge with better visual hierarchy
  const DaysToExpiryBadge = ({ daysLeft }) => {
    const expiryColors = getExpiryColorClasses(daysLeft);

    let daysDisplay;
    let urgencyIcon = null;

    if (daysLeft === null || daysLeft === undefined) {
      return <span className="text-slate-500 text-xs">N/A</span>;
    }

    if (daysLeft < 0) {
      daysDisplay = `עברו ${Math.abs(daysLeft)}`;
      urgencyIcon = '⚠️';
    } else if (daysLeft === 0) {
      daysDisplay = 'פג היום';
      urgencyIcon = '🔴';
    } else if (daysLeft <= 3) {
      daysDisplay = `${daysLeft} ימים`;
      urgencyIcon = '🟠';
    } else if (daysLeft <= 7) {
      daysDisplay = `${daysLeft} ימים`;
      urgencyIcon = '🟡';
    } else {
      daysDisplay = `${daysLeft} ימים`;
    }

    return (
      <div className="flex items-center justify-center">
        <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 hover:scale-105 ${expiryColors.bgColor} ${expiryColors.textColor}`}>
          {urgencyIcon && <span className="text-xs">{urgencyIcon}</span>}
          {daysDisplay}
        </span>
      </div>
    );
  };

  // Get table headers based on visible columns
  const getTableHeaders = () => Object.keys(columnsLabels)
    .map(key => ({ key, label: columnsLabels[key] }))
    .filter(header => visibleColumns[header.key]);

  // Desktop table row with better visual feedback
  const DesktopTableRow = ({ item, index, isSelected, onSelect }) => {
    const isHandled = !!item?.action_taken;
    const daysLeft = (item?.expiry_date && isValid(parseISO(item.expiry_date))) ? differenceInDays(parseISO(item.expiry_date), new Date()) :
                     (item?.original_expiry_date && isValid(parseISO(item.original_expiry_date))) ? differenceInDays(parseISO(item.original_expiry_date), new Date()) : null;
    const shouldShowHandleButton = utils.canBeHandled(item);
    const isUrgent = utils.isUrgentForColor(item, daysLeft);

    // Status display logic
    let statusDisplay = '';
    let statusBadgeClass = '';

    if (isHandled) {
      statusDisplay = getActionTakenLabel(item?.action_taken);
      statusBadgeClass = getStatusBadgeClasses(item?.action_taken);
    } else {
      statusDisplay = getStatusDisplay(item?.status);
      statusBadgeClass = getStatusBadgeClasses(item?.status);
    }

    return (
      <TableRow key={item.id || index} className={`border-b border-slate-200 transition-all duration-200 ${isSelected ? 'bg-blue-50/30' : (isHandled ? 'bg-slate-50/50' : 'bg-white')} hover:bg-slate-50/80 h-14`}>
        {visibleColumns.select && (
          <TableCell className="px-3 py-3 text-center" style={{width: columnWidths.select}}>
            <Checkbox checked={isSelected} onCheckedChange={() => onSelect(item.id)} />
          </TableCell>
        )}

        {visibleColumns.reagent_name && (
          <TableCell className="px-3 py-3 text-right text-sm text-slate-900 font-medium" style={{width: columnWidths.reagent_name}}>
            <div className="truncate">{item?.reagent_name || item?.reagent_name_snapshot}</div>
          </TableCell>
        )}

        {visibleColumns.supplier && (
          <TableCell className="px-3 py-3 text-right text-sm text-slate-600" style={{width: columnWidths.supplier}}>
            <div className="truncate">{reagentInfoCache[item.reagent_id]?.supplier || item.supplier || 'לא ידוע'}</div>
          </TableCell>
        )}

        {visibleColumns.batch_number && (
          <TableCell className="px-3 py-3 text-center font-mono text-sm" style={{width: columnWidths.batch_number}}>
            <Link
              to={createPageUrl(`EditReagentBatch?id=${item?.id}`)}
              className="text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200 font-medium"
            >
              {item?.batch_number || item?.batch_number_snapshot}
            </Link>
          </TableCell>
        )}

        {visibleColumns.expiry_date && (
          <TableCell className="px-3 py-3 text-center" style={{width: columnWidths.expiry_date}}>
            <ExpiryDateBadge date={item?.expiry_date || item?.original_expiry_date} daysLeft={daysLeft} />
          </TableCell>
        )}

        {visibleColumns.days_to_expiry && (
          <TableCell className="px-3 py-3 text-center" style={{width: columnWidths.days_to_expiry}}>
            <DaysToExpiryBadge daysLeft={daysLeft} />
          </TableCell>
        )}

        {visibleColumns.current_quantity && (
          <TableCell className="px-3 py-3 text-center font-mono text-sm font-medium" style={{width: columnWidths.current_quantity}}>
            {formatQuantity(item?.current_quantity ?? item?.quantity_affected)}
          </TableCell>
        )}

        {visibleColumns.status && (
          <TableCell className="px-3 py-3 text-center" style={{width: columnWidths.status}}>
            <Badge className={`${statusBadgeClass} border text-xs px-2 py-1 transition-all duration-200 hover:scale-105`}>
              {statusDisplay}
            </Badge>
          </TableCell>
        )}

        {visibleColumns.coa_status && (
          <TableCell className="px-3 py-3 text-center" style={{width: columnWidths.coa_status}}>
            <div className="flex items-center justify-center gap-1">
              {item?.coa_document_url && (
                <ActionButtonWithTooltip
                  icon={Eye}
                  onClick={() => onCOAView(item)}
                  tooltip="הצג תעודת אנליזה"
                />
              )}
              <ActionButtonWithTooltip
                icon={Upload}
                onClick={() => onCOAUpload(item)}
                tooltip={item?.coa_document_url ? 'עדכן תעודת אנליזה' : 'העלה תעודת אנליזה'}
              />
            </div>
          </TableCell>
        )}

        {visibleColumns.actions && (
          <TableCell className="px-3 py-3 text-center" style={{width: columnWidths.actions}}>
            <div className="flex items-center justify-center gap-1">
              <ActionButtonWithTooltip
                icon={Edit3}
                onClick={() => onEdit(item)}
                tooltip="ערוך אצווה"
              />

              {!isHandled ? (
                shouldShowHandleButton ? (
                  <HandleActionButton
                    item={item}
                    isUrgent={isUrgent}
                    onClick={onHandleExpired}
                  />
                ) : (
                  <span className="text-xs text-slate-400">-</span>
                )
              ) : (
                <ActionButtonWithTooltip
                  icon={RotateCw}
                  onClick={() => onRestore(item)}
                  tooltip="שחזר טיפול"
                />
              )}
            </div>
          </TableCell>
        )}
      </TableRow>
    );
  };

  const tableHeaders = getTableHeaders();

  return (
    <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm">
      <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
            <TableRow className="border-b-2 border-slate-200">
              {tableHeaders.map((header) => (
                <TableHead
                  key={header.key}
                  className="px-3 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider border-r border-slate-200 last:border-r-0 relative select-none bg-gradient-to-b from-slate-100 to-slate-50"
                  style={{ width: columnWidths[header.key] }}
                >
                  {header.key === 'select' ? (
                    <Checkbox
                      checked={selectedItems.size === data.length && data.length > 0}
                      onCheckedChange={onSelectAll}
                      disabled={data.length === 0}
                    />
                  ) : header.key === 'actions' ? (
                    <span className="block">{header.label}</span>
                  ) : (
                    <SortableHeader field={header.key} label={header.label} />
                  )}

                  {/* Resize handle - positioned on LEFT for RTL. Disabled for 'select' and 'actions' */}
                  {!(header.key === 'select' || header.key === 'actions') && (
                    <div
                      className="absolute top-0 left-0 w-2 h-full cursor-col-resize hover:bg-blue-400/30 bg-transparent transition-colors duration-200 active:bg-blue-500/40"
                      onMouseDown={(e) => onColumnResizeMouseDown(e, header.key)}
                      title="גרור לשינוי רוחב העמודה"
                    />
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white divide-y divide-slate-200">
            {data.map((item, index) => (
              <DesktopTableRow
                key={item.id || index}
                item={item}
                index={index}
                isSelected={selectedItems.has(item.id)}
                onSelect={onSelectItem}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// NEW: BatchCard component for mobile view, extracted from UnifiedBatchTable
function BatchCard({ item, onHandleItem, onCOAUpload, onCOAView, onEdit, onRestore, utils, isSelected, onSelect, reagentInfoCache }) {
  const isHandled = !!item?.action_taken;
  const daysLeft = (item?.expiry_date && isValid(parseISO(item.expiry_date))) ? differenceInDays(parseISO(item.expiry_date), new Date()) :
                   (item?.original_expiry_date && isValid(parseISO(item.original_expiry_date))) ? differenceInDays(parseISO(item.original_expiry_date), new Date()) : null;
  const shouldShowHandleButton = utils.canBeHandled(item);
  const isUrgent = utils.isUrgentForColor(item, daysLeft);

  const ExpiryDateBadge = ({ date, daysLeft }) => {
    const expiryColors = getExpiryColorClasses(daysLeft);

    if (!date || !isValid(parseISO(date))) {
      return <span className="text-slate-500 text-xs">אין תאריך</span>;
    }

    const displayDate = format(parseISO(date), 'dd/MM/yyyy', { locale: he });

    return (
      <div className="flex items-center justify-center">
        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 hover:scale-105 ${expiryColors.bgColor} ${expiryColors.textColor}`}>
          {displayDate}
        </span>
      </div>
    );
  };

  // Action buttons with better visual feedback
  const ActionButtonWithTooltip = ({ icon: Icon, onClick, tooltip, disabled, className = "" }) => (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClick}
            disabled={disabled}
            className={`h-8 w-8 hover:bg-slate-100 transition-colors duration-200 disabled:opacity-40 ${className}`}
          >
            <Icon className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-slate-800 text-white text-xs px-2 py-1">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const HandleActionButton = ({ item, isUrgent, onClick }) => (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            onClick={() => onClick(item)}
            className={`text-xs px-3 py-1.5 h-auto transition-colors duration-200
                        ${isUrgent ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}
                        text-white`}
          >
            טפל
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-slate-800 text-white text-xs px-2 py-1">
          <p>{isUrgent ? 'הפריט פג תוקף או עומד לפוג בקרוב' : 'טפל בפריט'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );


  return (
    <div className={`bg-white/80 backdrop-blur-sm border rounded-lg p-2 shadow-sm hover:shadow-md transition-all duration-200 ${isSelected ? 'border-blue-500 bg-blue-50/20' : 'border-slate-200'}`}>
      <div className="flex items-start justify-between mb-1">
        {/* Checkbox */}
        <div className="flex-shrink-0 ml-2 pt-1">
          <Checkbox checked={isSelected} onCheckedChange={() => onSelect(item.id)} />
        </div>

        {/* Left side - Main info in horizontal layout */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="font-semibold text-sm text-slate-800 truncate mr-2">{item?.reagent_name || item?.reagent_name_snapshot}</div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {!isHandled ? (
                <Badge variant="outline" className="font-mono text-xs px-1 py-0">
                  {formatQuantity(item?.current_quantity)}
                </Badge>
              ) : (
                <Badge className={`text-xs border px-1 py-0 ${getStatusBadgeClasses(item?.action_taken)}`}>
                  {getActionTakenLabel(item?.action_taken)}
                </Badge>
              )}
            </div>
          </div>

          {/* Compact info row */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span>{reagentInfoCache[item.reagent_id]?.supplier || item.supplier || 'לא ידוע'}</span>
              <span>•</span>
              <Link to={createPageUrl(`EditReagentBatch?id=${item?.id}`)} className="text-blue-600 hover:underline font-mono">
                {item?.batch_number || item?.batch_number_snapshot}
              </Link>
            </div>
            <div className="flex items-center gap-1">
              <ExpiryDateBadge date={item?.expiry_date || item?.original_expiry_date} daysLeft={daysLeft} />
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex justify-end gap-1 border-t border-slate-100 pt-2 -mx-2 px-2">
        {/* COA action */}
        {item?.coa_document_url ? (
          <ActionButtonWithTooltip
            icon={Eye}
            onClick={() => onCOAView(item)}
            tooltip="הצג COA"
          />
        ) : (
          <ActionButtonWithTooltip
            icon={Upload}
            onClick={() => onCOAUpload(item)}
            tooltip="העלה COA"
          />
        )}

        {/* Main action */}
        {!isHandled ? (
          shouldShowHandleButton ? (
            <HandleActionButton
              item={item}
              isUrgent={isUrgent}
              onClick={onHandleItem}
            />
          ) : (
            <span className="text-xs text-slate-400 flex items-center justify-center px-3 py-1.5">-</span>
          )
        ) : (
          <ActionButtonWithTooltip
            icon={RotateCw}
            onClick={() => onRestore(item)}
            tooltip="שחזר"
          />
        )}
        {/* Edit Button */}
        <ActionButtonWithTooltip
          icon={Edit3}
          onClick={() => onEdit(item)}
          tooltip="ערוך אצווה"
        />
      </div>
    </div>
  );
}
