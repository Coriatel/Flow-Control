import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Plus, Search, Printer, Edit, Loader2, RefreshCw, Columns3, MoreHorizontal,
  Package, AlertTriangle, CheckCircle2, ExternalLink, Filter, X
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

export default function OutgoingShipmentsPage() {
  const [shipments, setShipments] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [recipientTypeFilter, setRecipientTypeFilter] = useState('all');
  const [sortField, setSortField] = useState('shipment_date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const allColumns = useMemo(() => [
    { key: 'shipment_number', label: 'מס\' משלוח', alwaysVisible: true, defaultWidth: 140, sortable: true },
    { key: 'shipment_date', label: 'תאריך שליחה', alwaysVisible: true, defaultWidth: 120, sortable: true },
    { key: 'recipient_name', label: 'נמען', defaultWidth: 180, sortable: true },
    { key: 'recipient_type', label: 'סוג נמען', defaultWidth: 110, sortable: true },
    { key: 'status', label: 'סטטוס', defaultWidth: 110, sortable: true },
    { key: 'total_items_sent', label: 'פריטים', defaultWidth: 90, sortable: true },
    { key: 'special_requirements', label: 'דרישות מיוחדות', defaultWidth: 140, sortable: false },
    { key: 'confirmation_status', label: 'אישור קבלה', defaultWidth: 120, sortable: false },
    { key: 'actions', label: 'פעולות', alwaysVisible: true, defaultWidth: 100, sortable: false }
  ], []);

  const [visibleColumns, setVisibleColumns] = useState(() => {
    const alwaysVisibleKeys = allColumns.filter(col => col.alwaysVisible).map(col => col.key);
    const saved = localStorage.getItem('outgoingShipmentsVisibleColumns');
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
    localStorage.setItem('outgoingShipmentsVisibleColumns', JSON.stringify(savableColumns));
  }, [visibleColumns, allColumns]);

  const loadShipments = useCallback(async () => {
    setLoading(true);
    try {
      console.log('[OutgoingShipments Frontend] Fetching shipments from backend...');
      
      const response = await base44.functions.invoke('getOutgoingShipmentsData', {
        status: statusFilter !== 'all' ? statusFilter : null,
        recipientType: recipientTypeFilter !== 'all' ? recipientTypeFilter : null,
        includeDeleted: 'false',
        limit: '500'
      });

      if (response.data.success) {
        setShipments(response.data.data.shipments || []);
        setSummary(response.data.data.summary || {});
        console.log('✅ [OutgoingShipments Frontend] Data loaded:', response.data.data.shipments.length);
      } else {
        throw new Error(response.data.error || 'Failed to fetch shipments');
      }
    } catch (err) {
      console.error('❌ [OutgoingShipments Frontend] Error:', err);
      setError(`שגיאה בטעינת משלוחים: ${err.message}`);
      toast.error('שגיאה בטעינת משלוחים', {
        description: err.message
      });
    } finally {
      setLoading(false);
      setIsManualRefreshing(false);
    }
  }, [statusFilter, recipientTypeFilter]);

  useEffect(() => {
    loadShipments();
  }, [loadShipments]);

  const manualRefresh = () => {
    setIsManualRefreshing(true);
    loadShipments();
  };

  const filteredAndSortedShipments = useMemo(() => {
    let filtered = shipments.filter(shipment => {
      const matchesSearch = 
        shipment.shipment_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.contact_person?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });

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
  }, [shipments, searchTerm, sortField, sortDirection]);

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

  const getStatusBadge = (status) => {
    const statusConfig = {
      'draft': { label: 'טיוטה', className: 'bg-gray-100 text-gray-800' },
      'prepared': { label: 'מוכן', className: 'bg-blue-100 text-blue-800' },
      'sent': { label: 'נשלח', className: 'bg-yellow-100 text-yellow-800' },
      'delivered': { label: 'הגיע ליעד', className: 'bg-green-100 text-green-800' },
      'confirmed': { label: 'אושר', className: 'bg-emerald-100 text-emerald-800' },
      'cancelled': { label: 'בוטל', className: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status] || statusConfig['draft'];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'לא זמין';
    const date = parseISO(dateString);
    return isValid(date) ? format(date, 'dd/MM/yyyy', { locale: he }) : 'תאריך לא תקין';
  };

  const renderCell = (shipment, columnKey) => {
    switch (columnKey) {
      case 'shipment_number':
        return (
          <Link 
            to={createPageUrl('EditShipment') + `?id=${shipment.id}`}
            className="text-blue-600 hover:text-blue-800 font-medium hover:underline flex items-center gap-1"
          >
            {shipment.shipment_number}
            <ExternalLink className="h-3 w-3" />
          </Link>
        );
      case 'shipment_date':
        return formatDate(shipment.shipment_date);
      case 'recipient_name':
        return shipment.recipient_name || 'לא צוין';
      case 'recipient_type':
        const recipientTypes = {
          'internal': 'פנימי',
          'external': 'חיצוני',
          'supplier': 'ספק',
          'other': 'אחר'
        };
        return recipientTypes[shipment.recipient_type] || shipment.recipient_type || '';
      case 'status':
        return getStatusBadge(shipment.status);
      case 'total_items_sent':
        return shipment.total_items_sent || 0;
      case 'special_requirements':
        return (
          <div className="flex gap-1 flex-wrap">
            {shipment.requires_cold_storage && (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                קירור
              </Badge>
            )}
            {shipment.requires_special_handling && (
              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                טיפול מיוחד
              </Badge>
            )}
            {shipment.emergency_items > 0 && (
              <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                חירום
              </Badge>
            )}
          </div>
        );
      case 'confirmation_status':
        return shipment.confirmation_received ? (
          <div className="flex items-center text-green-600">
            <CheckCircle2 className="h-4 w-4 mr-1" />
            <span className="text-xs">אושר</span>
          </div>
        ) : shipment.status === 'sent' ? (
          <div className="flex items-center text-amber-600">
            <AlertTriangle className="h-4 w-4 mr-1" />
            <span className="text-xs">ממתין</span>
          </div>
        ) : (
          <span className="text-xs text-gray-400">-</span>
        );
      case 'actions':
        return (
          <div className="flex items-center gap-2">
            <Link to={createPageUrl('EditShipment') + `?id=${shipment.id}`}>
              <Button variant="ghost" size="sm">
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        );
      default:
        return shipment[columnKey] || '';
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <title>דוח משלוחים יוצאים</title>
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
          .print-date { text-align: left; color: #6b7280; font-size: 12px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="print-date">הופק בתאריך: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</div>
        <div class="header">
          <h1>דוח משלוחים יוצאים</h1>
          <p>מערכת ניהול מלאי ריאגנטים</p>
        </div>
        <div class="summary">
          <strong>סיכום:</strong> סה"כ ${filteredAndSortedShipments.length} משלוחים | 
          סה"כ ${filteredAndSortedShipments.reduce((sum, s) => sum + (s.total_items_sent || 0), 0)} פריטים נשלחו
        </div>
        <table>
          <thead>
            <tr>
              ${visibleColumns.filter(col => col !== 'actions' && col !== 'special_requirements' && col !== 'confirmation_status').map(col => {
                const column = allColumns.find(c => c.key === col);
                return `<th>${column?.label || col}</th>`;
              }).join('')}
            </tr>
          </thead>
          <tbody>
            ${filteredAndSortedShipments.map(shipment => `
              <tr>
                ${visibleColumns.filter(col => col !== 'actions' && col !== 'special_requirements' && col !== 'confirmation_status').map(col => {
                  let value = '';
                  switch (col) {
                    case 'shipment_date':
                      value = formatDate(shipment.shipment_date);
                      break;
                    case 'status':
                      const statusLabels = { 'draft': 'טיוטה', 'prepared': 'מוכן', 'sent': 'נשלח', 'delivered': 'הגיע', 'confirmed': 'אושר', 'cancelled': 'בוטל' };
                      value = statusLabels[shipment.status] || shipment.status;
                      break;
                    case 'recipient_type':
                      const types = { 'internal': 'פנימי', 'external': 'חיצוני', 'supplier': 'ספק', 'other': 'אחר' };
                      value = types[shipment.recipient_type] || shipment.recipient_type || '';
                      break;
                    default:
                      value = shipment[col] || '';
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

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setRecipientTypeFilter('all');
    setMobileFilterOpen(false);
  };

  const activeFiltersCount = [
    statusFilter !== 'all',
    recipientTypeFilter !== 'all'
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
                <Package className="h-5 w-5 sm:h-6 sm:w-6 ml-2 text-indigo-600 flex-shrink-0" />
                <span className="truncate">משלוחים יוצאים</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                מציג {filteredAndSortedShipments.length} משלוחים מתוך {shipments.length}
              </p>
            </div>
          </div>
          
          {/* Desktop: Full Button */}
          <Link to={createPageUrl('NewShipment')} className="hidden sm:block flex-shrink-0">
            <Button className="bg-amber-500 hover:bg-amber-600 text-white">
              <Plus className="h-4 w-4 mr-2" />
              משלוח חדש
            </Button>
          </Link>

          {/* Mobile: Icon Only Button */}
          <Link to={createPageUrl('NewShipment')} className="sm:hidden flex-shrink-0">
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white px-3">
              <Plus className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="flex flex-wrap gap-2 text-xs sm:text-sm text-gray-600">
            <span className="bg-blue-50 px-2 py-1 rounded">
              נשלחו: <strong>{summary.byStatus?.sent || 0}</strong>
            </span>
            <span className="bg-green-50 px-2 py-1 rounded">
              הגיעו: <strong>{summary.byStatus?.delivered || 0}</strong>
            </span>
            <span className="bg-yellow-50 px-2 py-1 rounded">
              ממתינים לאישור: <strong>{summary.awaitingConfirmation || 0}</strong>
            </span>
            <span className="bg-purple-50 px-2 py-1 rounded">
              סה"כ פריטים: <strong>{summary.totalItemsSent || 0}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Filter and Action Controls */}
      <div className="flex flex-wrap items-end gap-3 mb-6">
        {/* Search Input - Always visible */}
        <div className="relative flex-1 min-w-[200px] sm:min-w-[unset]">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="חיפוש לפי מספר משלוח, נמען או איש קשר..."
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
              <SelectItem value="draft">טיוטה</SelectItem>
              <SelectItem value="prepared">מוכן</SelectItem>
              <SelectItem value="sent">נשלח</SelectItem>
              <SelectItem value="delivered">הגיע</SelectItem>
              <SelectItem value="confirmed">אושר</SelectItem>
              <SelectItem value="cancelled">בוטל</SelectItem>
            </SelectContent>
          </Select>

          <Select value={recipientTypeFilter} onValueChange={setRecipientTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="סוג נמען" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הסוגים</SelectItem>
              <SelectItem value="internal">פנימי</SelectItem>
              <SelectItem value="external">חיצוני</SelectItem>
              <SelectItem value="supplier">ספק</SelectItem>
              <SelectItem value="other">אחר</SelectItem>
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
                <Columns3 className="h-4 w-4 mr-2" />
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
            <SheetTitle className="text-white">סינון משלוחים יוצאים</SheetTitle>
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
                  <SelectItem value="draft">טיוטה</SelectItem>
                  <SelectItem value="prepared">מוכן</SelectItem>
                  <SelectItem value="sent">נשלח</SelectItem>
                  <SelectItem value="delivered">הגיע</SelectItem>
                  <SelectItem value="confirmed">אושר</SelectItem>
                  <SelectItem value="cancelled">בוטל</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white">סוג נמען</Label>
              <Select value={recipientTypeFilter} onValueChange={setRecipientTypeFilter}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הסוגים</SelectItem>
                  <SelectItem value="internal">פנימי</SelectItem>
                  <SelectItem value="external">חיצוני</SelectItem>
                  <SelectItem value="supplier">ספק</SelectItem>
                  <SelectItem value="other">אחר</SelectItem>
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
      <div className="hidden md:block">
        <Card>
          <CardContent className="p-0">
            <ResizableTable
              columns={allColumns}
              data={filteredAndSortedShipments}
              visibleColumns={visibleColumns}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              renderCell={renderCell}
            />
            
            {filteredAndSortedShipments.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">לא נמצאו משלוחים התואמים לחיפוש</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredAndSortedShipments.length === 0 ? (
          <Card className="p-6">
            <div className="text-center text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>לא נמצאו משלוחים התואמים לחיפוש</p>
            </div>
          </Card>
        ) : (
          filteredAndSortedShipments.map(shipment => (
            <Card key={shipment.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="space-y-3">
                {/* Header: Shipment Number + Actions */}
                <div className="flex justify-between items-start gap-2">
                  <Link 
                    to={createPageUrl(`EditShipment?id=${shipment.id}`)}
                    className="font-bold text-lg text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                  >
                    {shipment.shipment_number}
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => window.location.href = createPageUrl(`EditShipment?id=${shipment.id}`)}>
                        <Edit className="h-4 w-4 ml-2" />
                        עריכה
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Recipient and Date */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{shipment.recipient_name || 'לא צוין'}</span>
                  </div>
                  <span className="text-gray-500">{formatDate(shipment.shipment_date)}</span>
                </div>

                {/* Status Badge */}
                <div className="flex flex-wrap gap-2">
                  {getStatusBadge(shipment.status)}
                  {shipment.requires_cold_storage && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                      קירור
                    </Badge>
                  )}
                  {shipment.requires_special_handling && (
                    <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700">
                      טיפול מיוחד
                    </Badge>
                  )}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t">
                  <div>
                    <span className="text-gray-500 text-xs block">פריטים</span>
                    <span className="font-semibold text-gray-900">{shipment.total_items_sent || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs block">סוג נמען</span>
                    <span className="font-semibold text-gray-900">
                      {shipment.recipient_type === 'internal' ? 'פנימי' : 
                       shipment.recipient_type === 'external' ? 'חיצוני' : 
                       shipment.recipient_type === 'supplier' ? 'ספק' : 'אחר'}
                    </span>
                  </div>
                  {shipment.confirmation_received && (
                    <div className="col-span-2">
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-xs font-medium">קבלת המשלוח אושרה</span>
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