import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Plus, Search, Printer, Edit, Loader2, RefreshCw, Columns, MoreHorizontal, Truck, ExternalLink, Filter, X
} from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { he } from 'date-fns/locale';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import BackButton from '@/components/ui/BackButton';
import ResizableTable from '@/components/ui/ResizableTable';

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortField, setSortField] = useState('delivery_date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const allColumns = useMemo(() => [
    { key: 'delivery_number', label: 'מס\' תעודה', alwaysVisible: true, defaultWidth: 140, sortable: true },
    { key: 'delivery_date', label: 'תאריך קבלה', alwaysVisible: true, defaultWidth: 120, sortable: true },
    { key: 'supplier', label: 'ספק', defaultWidth: 150, sortable: true },
    { key: 'order_number_temp', label: 'מס\' הזמנה זמני', defaultWidth: 140, sortable: true },
    { key: 'order_number_permanent', label: 'מס\' הזמנה קבוע', defaultWidth: 140, sortable: true },
    { key: 'purchase_order_number_sap', label: 'מס\' דרישת רכש SAP', defaultWidth: 160, sortable: true },
    { key: 'linked_withdrawals', label: 'משיכות מקושרות', defaultWidth: 160, sortable: false },
    { key: 'delivery_type', label: 'סוג משלוח', defaultWidth: 130, sortable: true },
    { key: 'status', label: 'סטטוס', defaultWidth: 110, sortable: true },
    { key: 'total_items_received', label: 'פריטים שהתקבלו', defaultWidth: 120, sortable: true },
    { key: 'completion_type', label: 'סוג השלמה', defaultWidth: 110, sortable: true },
    { key: 'actions', label: 'פעולות', alwaysVisible: true, defaultWidth: 100, sortable: false }
  ], []);

  const [visibleColumns, setVisibleColumns] = useState(() => {
    const alwaysVisibleKeys = allColumns.filter(col => col.alwaysVisible).map(col => col.key);
    const saved = localStorage.getItem('deliveriesVisibleColumns');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.from(new Set([...parsed, ...alwaysVisibleKeys]));
      } catch {
        return alwaysVisibleKeys;
      }
    }
    return alwaysVisibleKeys;
  });

  useEffect(() => {
    const savableColumns = visibleColumns.filter(colKey => {
      const columnDef = allColumns.find(c => c.key === colKey);
      return columnDef ? !columnDef.alwaysVisible : true;
    });
    localStorage.setItem('deliveriesVisibleColumns', JSON.stringify(savableColumns));
  }, [visibleColumns, allColumns]);

  const loadDeliveries = useCallback(async () => {
    setLoading(true);
    try {
      console.log('[Deliveries Frontend] Fetching deliveries from backend...');
      
      const response = await base44.functions.invoke('getDeliveriesData', {
        status: statusFilter !== 'all' ? statusFilter : null,
        type: typeFilter !== 'all' ? typeFilter : null,
        limit: '500'
      });

      if (response.data.success) {
        setDeliveries(response.data.data.deliveries || []);
        setSummary(response.data.data.summary || {});
        console.log('✅ [Deliveries Frontend] Data loaded:', response.data.data.deliveries.length);
      } else {
        throw new Error(response.data.error || 'Failed to fetch deliveries');
      }
    } catch (err) {
      console.error('❌ [Deliveries Frontend] Error:', err);
      toast.error('שגיאה בטעינת משלוחים', {
        description: err.message
      });
    } finally {
      setLoading(false);
      setIsManualRefreshing(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    loadDeliveries();
  }, [loadDeliveries]);

  const manualRefresh = () => {
    setIsManualRefreshing(true);
    loadDeliveries();
  };

  const filteredAndSortedDeliveries = useMemo(() => {
    let filtered = [...deliveries];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(delivery =>
        delivery.delivery_number?.toLowerCase().includes(term) ||
        delivery.supplier?.toLowerCase().includes(term) ||
        delivery.order_number?.toLowerCase().includes(term) ||
        delivery.order_number_temp?.toLowerCase().includes(term) ||
        delivery.order_number_permanent?.toLowerCase().includes(term) ||
        delivery.purchase_order_number_sap?.toLowerCase().includes(term)
      );
    }

    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField.includes('date')) {
        aValue = aValue ? parseISO(aValue) : new Date(0);
        bValue = bValue ? parseISO(bValue) : new Date(0);
      }
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue?.toLowerCase() || '';
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [deliveries, searchTerm, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleColumnToggle = (columnKey) => {
    setVisibleColumns(prev => {
      const column = allColumns.find(c => c.key === columnKey);
      if (column && column.alwaysVisible) {
        return prev;
      }
      return prev.includes(columnKey) 
        ? prev.filter(col => col !== columnKey)
        : [...prev, columnKey]
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'open': { label: 'פתוח', className: 'bg-blue-100 text-blue-800' },
      'processing': { label: 'בעיבוד', className: 'bg-yellow-100 text-yellow-800' },
      'processed': { label: 'עובד', className: 'bg-green-100 text-green-800' },
      'closed': { label: 'סגור', className: 'bg-gray-100 text-gray-800' }
    };

    const config = statusConfig[status] || statusConfig['open'];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'לא זמין';
    const date = parseISO(dateString);
    return isValid(date) ? format(date, 'dd/MM/yyyy', { locale: he }) : 'תאריך לא תקין';
  };

  const renderCell = useCallback((delivery, columnKey) => {
    switch (columnKey) {
      case 'delivery_number':
        return (
          <Link 
            to={createPageUrl('EditDelivery') + `?id=${delivery.id}`}
            className="text-blue-600 hover:text-blue-800 font-medium hover:underline flex items-center gap-1"
          >
            {delivery.delivery_number}
            <ExternalLink className="h-3 w-3" />
          </Link>
        );
      case 'delivery_date':
        return formatDate(delivery.delivery_date);
      case 'supplier':
        return delivery.supplier || 'לא צוין';
      case 'order_number_temp':
        return delivery.order_number_temp ? (
          delivery.linked_order_id ? (
            <Link 
              to={createPageUrl('EditOrder') + `?id=${delivery.linked_order_id}`}
              className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
            >
              {delivery.order_number_temp}
              <ExternalLink className="h-3 w-3" />
            </Link>
          ) : (
            delivery.order_number_temp
          )
        ) : 'ללא הזמנה';
      case 'order_number_permanent':
        return delivery.order_number_permanent || '-';
      case 'purchase_order_number_sap':
        return delivery.purchase_order_number_sap || '-';
      case 'linked_withdrawals':
        return delivery.linked_withdrawal_numbers && delivery.linked_withdrawal_numbers.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {delivery.linked_withdrawal_numbers.map((withdrawalNumber, idx) => {
              const withdrawalId = delivery.linked_withdrawal_request_ids[idx];
              return (
                <Link
                  key={withdrawalId}
                  to={createPageUrl(`EditWithdrawalRequest?id=${withdrawalId}`)}
                  className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded hover:bg-purple-200 flex items-center gap-1"
                >
                  {withdrawalNumber}
                  <ExternalLink className="h-2 w-2" />
                </Link>
              );
            })}
          </div>
        ) : '-';
      case 'delivery_type':
        const types = {
          'with_order': 'עם הזמנה',
          'no_charge': 'ללא תמורה', 
          'replacement': 'החלפה',
          'other': 'אחר'
        };
        return types[delivery.delivery_type] || delivery.delivery_type || '';
      case 'status':
        return getStatusBadge(delivery.status);
      case 'total_items_received':
        return delivery.total_items_received || 0;
      case 'completion_type':
        const completionTypes = {
          'full': 'מלא',
          'partial': 'חלקי'
        };
        return completionTypes[delivery.completion_type] || delivery.completion_type || '';
      case 'actions':
        return (
          <div className="flex items-center gap-2">
            <Link to={createPageUrl('EditDelivery') + `?id=${delivery.id}`}>
              <Button variant="ghost" size="sm">
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        );
      default:
        return delivery[columnKey] || '';
    }
  }, []);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <title>דוח משלוחים נכנסים</title>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 20px; direction: rtl; }
          .header { text-align: center; margin-bottom: 20px; }
          .header h1 { color: #1f2937; margin: 0; }
          .header p { color: #6b7280; margin: 5px 0; }
          .summary { background: #f3f4f6; padding: 15px; margin: 20px 0; border-radius: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #d1d5db; padding: 8px; text-align: right; }
          th { background-color: #f9fafb; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9fafb; }
          .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
          .badge-open { background: #dbeafe; color: #1e40af; }
          .badge-closed { background: #f3f4f6; color: #374151; }
          .print-date { text-align: left; color: #6b7280; font-size: 12px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="print-date">הופק בתאריך: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: he })}</div>
        <div class="header">
          <h1>דוח משלוחים נכנסים</h1>
          <p>מערכת ניהול מלאי ריאגנטים</p>
        </div>
        <div class="summary">
          <strong>סיכום:</strong> סה"כ ${filteredAndSortedDeliveries.length} משלוחים | 
          סה"כ ${filteredAndSortedDeliveries.reduce((sum, d) => sum + (d.total_items_received || 0), 0)} פריטים התקבלו
        </div>
        <table>
          <thead>
            <tr>
              ${visibleColumns.filter(col => col !== 'actions' && col !== 'linked_withdrawals').map(col => {
                const column = allColumns.find(c => c.key === col);
                return `<th>${column?.label || col}</th>`;
              }).join('')}
            </tr>
          </thead>
          <tbody>
            ${filteredAndSortedDeliveries.map(delivery => `
              <tr>
                ${visibleColumns.filter(col => col !== 'actions' && col !== 'linked_withdrawals').map(col => {
                  let value = '';
                  switch (col) {
                    case 'delivery_date':
                      value = formatDate(delivery.delivery_date);
                      break;
                    case 'status':
                      const statusLabels = { 'open': 'פתוח', 'processing': 'בעיבוד', 'processed': 'עובד', 'closed': 'סגור' };
                      value = `<span class="badge badge-${delivery.status}">${statusLabels[delivery.status] || delivery.status}</span>`;
                      break;
                    case 'delivery_type':
                      const types = {
                        'with_order': 'עם הזמנה',
                        'no_charge': 'ללא תמורה', 
                        'replacement': 'החלפה',
                        'other': 'אחר'
                      };
                      value = types[delivery.delivery_type] || delivery.delivery_type || '';
                      break;
                    case 'completion_type':
                      const completionTypes = {
                        'full': 'מלא',
                        'partial': 'חלקי'
                      };
                      value = completionTypes[delivery.completion_type] || delivery.completion_type || '';
                      break;
                    default:
                      value = delivery[col] || '';
                  }
                  return `<td>${value}</td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const statusLabels = {
    'open': 'פתוח',
    'processing': 'בעיבוד',
    'processed': 'עובד',
    'closed': 'סגור'
  };

  const typeLabels = {
    'with_order': 'עם הזמנה',
    'no_charge': 'ללא תמורה',
    'replacement': 'החלפה',
    'other': 'אחר'
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
    setMobileFilterOpen(false);
  };

  const activeFiltersCount = [
    statusFilter !== 'all',
    typeFilter !== 'all'
  ].filter(Boolean).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="mr-2">טוען משלוחים...</span>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-full" dir="rtl">
      {/* Header - Responsive */}
      <div className="flex flex-col space-y-3 mb-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <BackButton />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 flex items-center truncate">
                <Truck className="h-5 w-5 sm:h-6 sm:w-6 ml-2 text-blue-600 flex-shrink-0" />
                <span className="truncate">משלוחים שהתקבלו</span>
              </h1>
            </div>
          </div>
          
          {/* Desktop: Full Button */}
          <Link to={createPageUrl('NewDelivery')} className="hidden sm:block flex-shrink-0">
            <Button className="bg-amber-500 hover:bg-amber-600 text-white">
              <Plus className="h-4 w-4 mr-2" />
              תעודת משלוח חדשה
            </Button>
          </Link>

          {/* Mobile: Icon Only Button */}
          <Link to={createPageUrl('NewDelivery')} className="sm:hidden flex-shrink-0">
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white px-3">
              <Plus className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Summary Stats */}
        <div className="flex flex-wrap gap-2 text-xs sm:text-sm text-gray-600">
          <span className="bg-blue-50 px-2 py-1 rounded">
            סה"כ: <strong>{deliveries.length}</strong>
          </span>
          <span className="bg-yellow-50 px-2 py-1 rounded">
            פתוחים: <strong>{summary.byStatus?.open || 0}</strong>
          </span>
          <span className="bg-orange-50 px-2 py-1 rounded">
            בעיבוד: <strong>{summary.byStatus?.processing || 0}</strong>
          </span>
          <span className="bg-green-50 px-2 py-1 rounded">
            עובדו: <strong>{summary.byStatus?.processed || 0}</strong>
          </span>
        </div>
      </div>

      {/* Filter and Action Controls */}
      <div className="flex flex-wrap items-end gap-3 mb-6">
        {/* Search Input - Always visible */}
        <div className="relative flex-1 min-w-[200px] sm:min-w-[unset]">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="חיפוש לפי מס' תעודה, ספק או הזמנה..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Desktop Filters and Actions */}
        <div className="hidden sm:flex gap-3 items-center flex-wrap">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="סטטוס" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הסטטוסים</SelectItem>
              {Object.entries(statusLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="סוג משלוח" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הסוגים</SelectItem>
              {Object.entries(typeLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4 mr-2" />
                פעולות
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={manualRefresh} disabled={isManualRefreshing}>
                {isManualRefreshing ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <RefreshCw className="h-4 w-4 ml-2" />}
                רענון
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePrint}>
                <Printer className="h-4 w-4 ml-2" />
                הדפס
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns className="h-4 w-4 mr-2" />
                עמודות
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="start">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">הצג עמודות</h4>
                {allColumns.map((column) => (
                  <div key={column.key} className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                      id={column.key}
                      checked={visibleColumns.includes(column.key)}
                      onCheckedChange={() => handleColumnToggle(column.key)}
                      disabled={column.alwaysVisible}
                    />
                    <label htmlFor={column.key} className="text-sm cursor-pointer">
                      {column.label}
                    </label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Mobile Action Buttons */}
        <div className="flex gap-2 sm:hidden w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMobileFilterOpen(true)}
            className="flex-1 relative"
          >
            <Filter className="h-4 w-4 mr-2" />
            סינון
            {activeFiltersCount > 0 && (
              <Badge className="absolute -top-2 -left-2 h-5 w-5 flex items-center justify-center p-0 bg-amber-500 text-white text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={manualRefresh} disabled={isManualRefreshing}>
                {isManualRefreshing ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <RefreshCw className="h-4 w-4 ml-2" />}
                רענון
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePrint}>
                <Printer className="h-4 w-4 ml-2" />
                הדפס
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Filter Sheet with Glassmorphism */}
      <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
        <SheetContent 
          side="right" 
          className="w-full sm:max-w-md"
          style={{
            background: 'rgba(30, 41, 59, 0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <SheetHeader>
            <SheetTitle className="text-white">סינון משלוחים</SheetTitle>
            <SheetDescription className="text-gray-300">
              בחר אפשרויות לסינון רשימת המשלוחים
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6 space-y-4">
            <div>
              <Label className="text-white">סטטוס</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הסטטוסים</SelectItem>
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white">סוג משלוח</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הסוגים</SelectItem>
                  {Object.entries(typeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white">עמודות גלויות</Label>
              <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                {allColumns.map(column => (
                  <div key={column.key} className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                      id={`mobile-${column.key}`}
                      checked={visibleColumns.includes(column.key)}
                      onCheckedChange={() => handleColumnToggle(column.key)}
                      disabled={column.alwaysVisible}
                      className="border-white/30"
                    />
                    <label htmlFor={`mobile-${column.key}`} className="text-sm text-white cursor-pointer flex-1">
                      {column.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={clearFilters} 
                className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                נקה
              </Button>
              <Button 
                onClick={() => setMobileFilterOpen(false)} 
                className="flex-1 bg-white text-gray-900 hover:bg-white/90"
              >
                החל
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Table View */}
      <div className="hidden sm:block">
        <Card>
          <CardContent className="p-0">
            <ResizableTable
              columns={allColumns}
              data={filteredAndSortedDeliveries}
              visibleColumns={visibleColumns}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              renderCell={renderCell}
            />
            
            {filteredAndSortedDeliveries.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">לא נמצאו משלוחים התואמים לחיפוש</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mobile Card View - Improved */}
      <div className="sm:hidden space-y-3">
        {filteredAndSortedDeliveries.length === 0 ? (
          <Card className="p-6">
            <div className="text-center text-gray-500">
              <Truck className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>לא נמצאו משלוחים התואמים לחיפוש</p>
            </div>
          </Card>
        ) : (
          filteredAndSortedDeliveries.map(delivery => (
            <Card key={delivery.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="space-y-3">
                {/* Header: Delivery Number + Actions */}
                <div className="flex justify-between items-start gap-2">
                  <Link 
                    to={createPageUrl(`EditDelivery?id=${delivery.id}`)}
                    className="font-bold text-lg text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                  >
                    {delivery.delivery_number}
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => window.location.href = createPageUrl(`EditDelivery?id=${delivery.id}`)}>
                        <Edit className="h-4 w-4 ml-2" />
                        עריכה
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Supplier and Date */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{delivery.supplier || 'לא צוין'}</span>
                  </div>
                  <span className="text-gray-500">{formatDate(delivery.delivery_date)}</span>
                </div>

                {/* Status and Type Badges */}
                <div className="flex flex-wrap gap-2">
                  {getStatusBadge(delivery.status)}
                  <Badge variant="outline" className="text-xs">
                    {typeLabels[delivery.delivery_type] || delivery.delivery_type}
                  </Badge>
                  {delivery.completion_type && (
                    <Badge variant="outline" className="text-xs">
                      {delivery.completion_type === 'full' ? 'מלא' : 'חלקי'}
                    </Badge>
                  )}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t">
                  <div>
                    <span className="text-gray-500 text-xs block">פריטים שהתקבלו</span>
                    <span className="font-semibold text-gray-900">{delivery.total_items_received || 0}</span>
                  </div>
                  {delivery.order_number_temp && (
                    <div>
                      <span className="text-gray-500 text-xs block">הזמנה</span>
                      {delivery.linked_order_id ? (
                        <Link 
                          to={createPageUrl(`EditOrder?id=${delivery.linked_order_id}`)}
                          className="text-blue-600 hover:underline text-sm font-medium flex items-center gap-1"
                        >
                          {delivery.order_number_temp}
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      ) : (
                        <span className="font-medium text-gray-900">{delivery.order_number_temp}</span>
                      )}
                    </div>
                  )}
                  {delivery.linked_withdrawal_count > 0 && (
                    <div className="col-span-2">
                      <span className="text-gray-500 text-xs block mb-1">משיכות מקושרות</span>
                      <div className="flex flex-wrap gap-1">
                        {delivery.linked_withdrawal_numbers.map((withdrawalNumber, idx) => {
                          const withdrawalId = delivery.linked_withdrawal_request_ids[idx];
                          return (
                            <Link
                              key={withdrawalId}
                              to={createPageUrl(`EditWithdrawalRequest?id=${withdrawalId}`)}
                              className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded hover:bg-purple-200 flex items-center gap-1"
                            >
                              {withdrawalNumber}
                              <ExternalLink className="h-2 w-2" />
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}