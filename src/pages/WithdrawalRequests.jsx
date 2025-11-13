import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Plus, Search, Printer, Edit, Loader2, RefreshCw, Columns, MoreHorizontal, 
  PackageCheck, ExternalLink, Filter, X, Trash2, AlertCircle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
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
import BackButton from '@/components/ui/BackButton';
import ResizableTable from '@/components/ui/ResizableTable';

export default function WithdrawalRequestsPage() {
  const navigate = useNavigate();

  const [withdrawals, setWithdrawals] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [sortField, setSortField] = useState('request_date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [withdrawalToDelete, setWithdrawalToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const allColumns = useMemo(() => [
    { key: 'withdrawal_number', label: 'מס\' משיכה', alwaysVisible: true, defaultWidth: 140, sortable: true },
    { key: 'request_date', label: 'תאריך בקשה', alwaysVisible: true, defaultWidth: 120, sortable: true },
    { key: 'framework_order_number', label: 'מס\' הזמנת מסגרת', defaultWidth: 160, sortable: true },
    { key: 'supplier', label: 'ספק', defaultWidth: 150, sortable: true },
    { key: 'urgency_level', label: 'דחיפות', defaultWidth: 100, sortable: true },
    { key: 'status', label: 'סטטוס', defaultWidth: 120, sortable: true },
    { key: 'linked_deliveries', label: 'משלוחים מקושרים', defaultWidth: 160, sortable: false },
    { key: 'total_items', label: 'פריטים', defaultWidth: 80, sortable: true },
    { key: 'total_quantity_requested', label: 'כמות מבוקשת', defaultWidth: 110, sortable: true },
    { key: 'total_quantity_approved', label: 'כמות מאושרת', defaultWidth: 110, sortable: true },
    { key: 'requested_delivery_date', label: 'תאריך אספקה מבוקש', defaultWidth: 140, sortable: true },
    { key: 'actions', label: 'פעולות', alwaysVisible: true, defaultWidth: 100, sortable: false }
  ], []);

  const [visibleColumns, setVisibleColumns] = useState(() => {
    const alwaysVisibleKeys = allColumns.filter(col => col.alwaysVisible).map(col => col.key);
    const saved = localStorage.getItem('withdrawalRequestsVisibleColumns');
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
    localStorage.setItem('withdrawalRequestsVisibleColumns', JSON.stringify(savableColumns));
  }, [visibleColumns, allColumns]);

  const loadWithdrawals = useCallback(async () => {
    setLoading(true);
    try {
      console.log('[WithdrawalRequests Frontend] Fetching withdrawals from backend...');
      
      const response = await base44.functions.invoke('getWithdrawalRequestsData', {
        status: statusFilter !== 'all' ? statusFilter : null,
        urgency: urgencyFilter !== 'all' ? urgencyFilter : null,
        limit: '200'
      });

      if (response.data.success) {
        setWithdrawals(response.data.data.withdrawals || []);
        setSummary(response.data.data.summary || {});
        console.log('✅ [WithdrawalRequests Frontend] Data loaded:', response.data.data.withdrawals.length);
      } else {
        throw new Error(response.data.error || 'Failed to fetch withdrawals');
      }
    } catch (err) {
      console.error('❌ [WithdrawalRequests Frontend] Error:', err);
      toast.error('שגיאה בטעינת בקשות משיכה', {
        description: err.message
      });
    } finally {
      setLoading(false);
      setIsManualRefreshing(false);
    }
  }, [statusFilter, urgencyFilter]);

  useEffect(() => {
    loadWithdrawals();
  }, [loadWithdrawals]);

  const manualRefresh = () => {
    setIsManualRefreshing(true);
    loadWithdrawals();
  };

  const filteredAndSortedWithdrawals = useMemo(() => {
    let filtered = withdrawals.filter(withdrawal => {
      const matchesSearch =
        withdrawal.withdrawal_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        withdrawal.framework_order_number_snapshot?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        withdrawal.supplier_snapshot?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });

    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField.includes('date')) {
        aValue = aValue ? new Date(aValue) : new Date(0);
        bValue = bValue ? new Date(bValue) : new Date(0);
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
  }, [withdrawals, searchTerm, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleColumnToggle = (columnKey) => {
    setVisibleColumns(prev =>
      prev.includes(columnKey)
        ? prev.filter(col => col !== columnKey)
        : [...prev, columnKey]
    );
  };

  const handleDeleteClick = (withdrawal) => {
    setWithdrawalToDelete(withdrawal);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!withdrawalToDelete) return;

    setDeleting(true);
    try {
      const response = await base44.functions.invoke('deleteWithdrawal', {
        withdrawalId: withdrawalToDelete.id,
        reason: 'Deleted by user from WithdrawalRequests page'
      });

      if (response.data.success) {
        toast.success('בקשת המשיכה נמחקה בהצלחה');
        await loadWithdrawals();
      } else {
        throw new Error(response.data.error || 'Failed to delete withdrawal');
      }
    } catch (error) {
      console.error('Error deleting withdrawal:', error);
      toast.error('שגיאה במחיקת בקשת המשיכה', {
        description: error.message
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setWithdrawalToDelete(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'draft': { label: 'טיוטה', className: 'bg-gray-100 text-gray-800' },
      'submitted': { label: 'הוגשה', className: 'bg-blue-100 text-blue-800' },
      'approved': { label: 'אושרה', className: 'bg-green-100 text-green-800' },
      'rejected': { label: 'נדחתה', className: 'bg-red-100 text-red-800' },
      'in_delivery': { label: 'במשלוח', className: 'bg-purple-100 text-purple-800' },
      'completed': { label: 'הושלמה', className: 'bg-teal-100 text-teal-800' },
      'cancelled': { label: 'בוטלה', className: 'bg-orange-100 text-orange-800' }
    };

    const config = statusConfig[status] || statusConfig['submitted'];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getUrgencyBadge = (urgency) => {
    const urgencyConfig = {
      'routine': { label: 'רגיל', className: 'bg-slate-100 text-slate-800' },
      'urgent': { label: 'דחוף', className: 'bg-orange-100 text-orange-800' },
      'emergency': { label: 'חירום', className: 'bg-red-100 text-red-800' }
    };

    const config = urgencyConfig[urgency] || urgencyConfig['routine'];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'לא זמין';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch {
      return 'תאריך לא תקין';
    }
  };

  const renderCell = useCallback((withdrawal, columnKey) => {
    switch (columnKey) {
      case 'withdrawal_number':
        return (
          <Link
            to={createPageUrl('EditWithdrawalRequest') + `?id=${withdrawal.id}`}
            className="text-blue-600 hover:text-blue-800 font-medium hover:underline flex items-center gap-1"
          >
            {withdrawal.withdrawal_number}
            <ExternalLink className="h-3 w-3" />
          </Link>
        );
      case 'request_date':
        return formatDate(withdrawal.request_date);
      case 'framework_order_number':
        return withdrawal.framework_order_number_snapshot || '-';
      case 'supplier':
        return withdrawal.supplier_snapshot || 'לא צוין';
      case 'urgency_level':
        return getUrgencyBadge(withdrawal.urgency_level);
      case 'status':
        return getStatusBadge(withdrawal.status);
      case 'linked_deliveries':
        return withdrawal.linked_delivery_numbers && withdrawal.linked_delivery_numbers.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {withdrawal.linked_delivery_numbers.slice(0, 2).map((deliveryNumber, idx) => {
              const deliveryId = withdrawal.linked_delivery_ids?.[idx];
              return (
                <Link
                  key={deliveryId || idx}
                  to={createPageUrl(`EditDelivery?id=${deliveryId}`)}
                  className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200 flex items-center gap-1"
                >
                  {deliveryNumber}
                  <ExternalLink className="h-2 w-2" />
                </Link>
              );
            })}
            {withdrawal.linked_delivery_numbers.length > 2 && (
              <span className="text-xs text-gray-500">
                +{withdrawal.linked_delivery_numbers.length - 2}
              </span>
            )}
          </div>
        ) : '-';
      case 'total_items':
        return withdrawal.total_items || 0;
      case 'total_quantity_requested':
        return withdrawal.total_quantity_requested || 0;
      case 'total_quantity_approved':
        return withdrawal.total_quantity_approved || 0;
      case 'requested_delivery_date':
        return formatDate(withdrawal.requested_delivery_date);
      case 'actions':
        const canDelete = withdrawal.status === 'draft' || withdrawal.status === 'submitted';
        return (
          <div className="flex items-center gap-2">
            <Link to={createPageUrl('EditWithdrawalRequest') + `?id=${withdrawal.id}`}>
              <Button variant="ghost" size="sm">
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
            {canDelete && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleDeleteClick(withdrawal)}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            )}
          </div>
        );
      default:
        return withdrawal[columnKey] || '';
    }
  }, [getStatusBadge, getUrgencyBadge, formatDate]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <title>דוח בקשות משיכה</title>
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
          .print-date { text-align: left; color: #6b7280; font-size: 12px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="print-date">הופק בתאריך: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</div>
        <div class="header">
          <h1>דוח בקשות משיכה</h1>
          <p>מערכת ניהול מלאי ריאגנטים</p>
        </div>
        <div class="summary">
          <strong>סיכום:</strong> סה"כ ${filteredAndSortedWithdrawals.length} בקשות משיכה
        </div>
        <table>
          <thead>
            <tr>
              ${visibleColumns.filter(col => col !== 'actions' && col !== 'linked_deliveries').map(col => {
                const column = allColumns.find(c => c.key === col);
                return `<th>${column?.label || col}</th>`;
              }).join('')}
            </tr>
          </thead>
          <tbody>
            ${filteredAndSortedWithdrawals.map(withdrawal => `
              <tr>
                ${visibleColumns.filter(col => col !== 'actions' && col !== 'linked_deliveries').map(col => {
                  let value = '';
                  switch (col) {
                    case 'request_date':
                    case 'requested_delivery_date':
                      value = formatDate(withdrawal[col]);
                      break;
                    case 'status':
                      const statusLabels = {
                        'draft': 'טיוטה',
                        'submitted': 'הוגשה',
                        'approved': 'אושרה',
                        'rejected': 'נדחתה',
                        'in_delivery': 'במשלוח',
                        'completed': 'הושלמה',
                        'cancelled': 'בוטלה'
                      };
                      value = statusLabels[withdrawal.status] || withdrawal.status;
                      break;
                    case 'urgency_level':
                      const urgencyLabels = {
                        'routine': 'רגיל',
                        'urgent': 'דחוף',
                        'emergency': 'חירום'
                      };
                      value = urgencyLabels[withdrawal.urgency_level] || withdrawal.urgency_level;
                      break;
                    default:
                      value = withdrawal[col] || '';
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
    'draft': 'טיוטה',
    'submitted': 'הוגשה',
    'approved': 'אושרה',
    'rejected': 'נדחתה',
    'in_delivery': 'במשלוח',
    'completed': 'הושלמה',
    'cancelled': 'בוטלה'
  };

  const urgencyLabels = {
    'routine': 'רגיל',
    'urgent': 'דחוף',
    'emergency': 'חירום'
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setUrgencyFilter('all');
    setMobileFilterOpen(false);
  };

  const activeFiltersCount = [
    statusFilter !== 'all',
    urgencyFilter !== 'all'
  ].filter(Boolean).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="mr-2">טוען בקשות משיכה...</span>
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
                <PackageCheck className="h-5 w-5 sm:h-6 sm:w-6 ml-2 text-purple-600 flex-shrink-0" />
                <span className="truncate">ניהול בקשות משיכה</span>
              </h1>
            </div>
          </div>
          
          {/* Desktop: Full Button */}
          <Link to={createPageUrl('NewWithdrawalRequest')} className="hidden sm:block flex-shrink-0">
            <Button className="bg-amber-500 hover:bg-amber-600 text-white">
              <Plus className="h-4 w-4 mr-2" />
              בקשת משיכה חדשה
            </Button>
          </Link>

          {/* Mobile: Icon Only Button */}
          <Link to={createPageUrl('NewWithdrawalRequest')} className="sm:hidden flex-shrink-0">
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white px-3">
              <Plus className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Summary Stats */}
        <div className="flex flex-wrap gap-2 text-xs sm:text-sm text-gray-600">
          <span className="bg-blue-50 px-2 py-1 rounded">
            סה"כ: <strong>{summary.totalWithdrawals || 0}</strong>
          </span>
          <span className="bg-yellow-50 px-2 py-1 rounded">
            הוגשו: <strong>{summary.byStatus?.submitted || 0}</strong>
          </span>
          <span className="bg-green-50 px-2 py-1 rounded">
            אושרו: <strong>{summary.byStatus?.approved || 0}</strong>
          </span>
          <span className="bg-purple-50 px-2 py-1 rounded">
            במשלוח: <strong>{summary.byStatus?.in_delivery || 0}</strong>
          </span>
        </div>
      </div>

      {/* Filter and Action Controls */}
      <div className="flex flex-wrap items-end gap-3 mb-6">
        {/* Search Input - Always visible */}
        <div className="relative flex-1 min-w-[200px] sm:min-w-[unset]">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="חיפוש לפי מס' משיכה, הזמנה, ספק..."
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

          <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="דחיפות" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הדחיפויות</SelectItem>
              {Object.entries(urgencyLabels).map(([key, label]) => (
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
                      onCheckedChange={() => !column.alwaysVisible && handleColumnToggle(column.key)}
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
            <SheetTitle className="text-white">סינון בקשות משיכה</SheetTitle>
            <SheetDescription className="text-gray-300">
              בחר אפשרויות לסינון רשימת בקשות המשיכה
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
              <Label className="text-white">דחיפות</Label>
              <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הדחיפויות</SelectItem>
                  {Object.entries(urgencyLabels).map(([key, label]) => (
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              אישור מחיקה
            </AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את בקשת המשיכה <strong>{withdrawalToDelete?.withdrawal_number}</strong>?
              <br />
              פעולה זו תסמן את הבקשה כמבוטלת ולא ניתן לבטלה.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  מוחק...
                </>
              ) : (
                'מחק בקשה'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="p-0">
            <ResizableTable
              columns={allColumns}
              data={filteredAndSortedWithdrawals}
              visibleColumns={visibleColumns}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              renderCell={renderCell}
            />

            {filteredAndSortedWithdrawals.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">לא נמצאו בקשות משיכה התואמות לחיפוש</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredAndSortedWithdrawals.length === 0 ? (
          <Card className="p-6">
            <div className="text-center text-gray-500">
              <PackageCheck className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>לא נמצאו בקשות משיכה התואמות לחיפוש</p>
            </div>
          </Card>
        ) : (
          filteredAndSortedWithdrawals.map(withdrawal => (
            <Card key={withdrawal.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="space-y-3">
                {/* Header: Withdrawal Number + Actions */}
                <div className="flex justify-between items-start gap-2">
                  <Link 
                    to={createPageUrl(`EditWithdrawalRequest?id=${withdrawal.id}`)}
                    className="font-bold text-lg text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                  >
                    {withdrawal.withdrawal_number}
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => navigate(createPageUrl(`EditWithdrawalRequest?id=${withdrawal.id}`))}>
                        <Edit className="h-4 w-4 ml-2" />
                        עריכה
                      </DropdownMenuItem>
                      {(withdrawal.status === 'draft' || withdrawal.status === 'submitted') && (
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClick(withdrawal)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 ml-2" />
                          מחק
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Framework Order and Supplier */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <PackageCheck className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{withdrawal.supplier_snapshot || 'לא צוין'}</span>
                  </div>
                  <span className="text-gray-500">{formatDate(withdrawal.request_date)}</span>
                </div>

                {/* Status and Urgency Badges */}
                <div className="flex flex-wrap gap-2">
                  {getStatusBadge(withdrawal.status)}
                  {getUrgencyBadge(withdrawal.urgency_level)}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t">
                  <div>
                    <span className="text-gray-500 text-xs block">פריטים</span>
                    <span className="font-semibold text-gray-900">{withdrawal.total_items || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs block">כמות מבוקשת</span>
                    <span className="font-semibold text-gray-900">{withdrawal.total_quantity_requested || 0}</span>
                  </div>
                  {withdrawal.framework_order_number_snapshot && (
                    <div className="col-span-2">
                      <span className="text-gray-500 text-xs block">הזמנת מסגרת</span>
                      <span className="font-medium text-gray-900">{withdrawal.framework_order_number_snapshot}</span>
                    </div>
                  )}
                  {withdrawal.linked_delivery_count > 0 && (
                    <div className="col-span-2">
                      <span className="text-gray-500 text-xs block mb-1">משלוחים מקושרים</span>
                      <div className="flex flex-wrap gap-1">
                        {withdrawal.linked_delivery_numbers?.slice(0, 3).map((deliveryNumber, idx) => {
                          const deliveryId = withdrawal.linked_delivery_ids?.[idx];
                          return (
                            <Link
                              key={deliveryId || idx}
                              to={createPageUrl(`EditDelivery?id=${deliveryId}`)}
                              className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200 flex items-center gap-1"
                            >
                              {deliveryNumber}
                              <ExternalLink className="h-2 w-2" />
                            </Link>
                          );
                        })}
                        {withdrawal.linked_delivery_numbers?.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{withdrawal.linked_delivery_numbers.length - 3}
                          </span>
                        )}
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