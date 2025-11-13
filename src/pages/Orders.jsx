import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Loader2, Search, Plus, RefreshCw, Printer,
  Edit, Trash2, MoreHorizontal, FileText,
  ArrowUpDown, ArrowUp, ArrowDown, Columns, ExternalLink, Filter, X
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import BackButton from '@/components/ui/BackButton';
import { toast } from 'sonner';
import { format } from 'date-fns';
import ResizableTable from '@/components/ui/ResizableTable';

export default function OrdersPage() {
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isManualRefreshing, setIsManualRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [orderTypeFilter, setOrderTypeFilter] = useState('all');
    const [sortField, setSortField] = useState('order_date');
    const [sortDirection, setSortDirection] = useState('desc');
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

    // Column visibility state
    const [visibleColumns, setVisibleColumns] = useState(() => {
        const saved = localStorage.getItem('ordersVisibleColumns');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                return [
                    'order_number_temp', 'order_date', 'supplier', 'status', 'order_type',
                    'linked_withdrawals', 'linked_deliveries', 'total_items', 'actions'
                ];
            }
        }
        return [
            'order_number_temp', 'order_date', 'supplier', 'status', 'order_type',
            'linked_withdrawals', 'linked_deliveries', 'total_items', 'actions'
        ];
    });

    const allColumns = [
        { key: 'order_number_temp', label: 'מס\' הזמנה זמני', alwaysVisible: true, defaultWidth: 140, sortable: true },
        { key: 'order_number_permanent', label: 'מס\' הזמנה קבוע', defaultWidth: 140, sortable: true },
        { key: 'purchase_order_number_sap', label: 'מס\' דרישת רכש SAP', defaultWidth: 160, sortable: true },
        { key: 'order_date', label: 'תאריך הזמנה', alwaysVisible: true, defaultWidth: 120, sortable: true },
        { key: 'supplier', label: 'ספק', defaultWidth: 150, sortable: true },
        { key: 'order_type', label: 'סוג הזמנה', defaultWidth: 120, sortable: true },
        { key: 'status', label: 'סטטוס', defaultWidth: 140, sortable: true },
        { key: 'linked_withdrawals', label: 'משיכות מקושרות', defaultWidth: 160, sortable: false },
        { key: 'linked_deliveries', label: 'משלוחים מקושרים', defaultWidth: 160, sortable: false },
        { key: 'total_items', label: 'פריטים', defaultWidth: 80, sortable: true },
        { key: 'total_quantity_ordered', label: 'כמות מוזמנת', defaultWidth: 110, sortable: true },
        { key: 'total_quantity_received', label: 'כמות התקבלה', defaultWidth: 110, sortable: true },
        { key: 'total_quantity_remaining', label: 'יתרה', defaultWidth: 80, sortable: true },
        { key: 'expected_delivery_start_date', label: 'תאריך אספקה צפוי', defaultWidth: 130, sortable: true },
        { key: 'actions', label: 'פעולות', alwaysVisible: true, defaultWidth: 100, sortable: false }
    ];

    // Save visible columns to localStorage
    useEffect(() => {
        localStorage.setItem('ordersVisibleColumns', JSON.stringify(visibleColumns));
    }, [visibleColumns]);

    const loadOrders = useCallback(async () => {
        setLoading(true);
        try {
            console.log('[Orders Frontend] Fetching orders from backend...');

            const response = await base44.functions.invoke('getOrdersData', {
                status: statusFilter !== 'all' ? statusFilter : null,
                orderType: orderTypeFilter !== 'all' ? orderTypeFilter : null,
                limit: '200'
            });

            if (response.data.success) {
                setOrders(response.data.data.orders || []);
                console.log('✅ [Orders Frontend] Data loaded:', response.data.data.orders.length);
            } else {
                throw new Error(response.data.error || 'Failed to fetch orders');
            }
        } catch (err) {
            console.error('❌ [Orders Frontend] Error:', err);
            toast.error('שגיאה בטעינת הזמנות', {
                description: err.message
            });
        } finally {
            setLoading(false);
            setIsManualRefreshing(false);
        }
    }, [statusFilter, orderTypeFilter]);

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    const manualRefresh = () => {
        setIsManualRefreshing(true);
        loadOrders();
    };

    const filteredAndSortedOrders = useMemo(() => {
        let filtered = orders.filter(order => {
            const matchesSearch =
                order.order_number_temp?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.order_number_permanent?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.purchase_order_number_sap?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.supplier_name_snapshot?.toLowerCase().includes(searchTerm.toLowerCase());

            return matchesSearch;
        });

        // Sort
        filtered.sort((a, b) => {
            let aValue = a[sortField];
            let bValue = b[sortField];

            // Handle dates
            if (sortField.includes('date')) {
                aValue = aValue ? new Date(aValue) : new Date(0);
                bValue = bValue ? new Date(bValue) : new Date(0);
            }

            // Handle strings
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
    }, [orders, searchTerm, sortField, sortDirection]);

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
            'pending_sap_details': { label: 'ממתין לפרטי SAP', className: 'bg-yellow-100 text-yellow-800' },
            'pending_sap_permanent_id': { label: 'ממתין למספר קבוע', className: 'bg-orange-100 text-orange-800' },
            'pending_sap_po_number': { label: 'ממתין למספר דרישה', className: 'bg-orange-100 text-orange-800' },
            'approved': { label: 'מאושר', className: 'bg-green-100 text-green-800' },
            'partially_received': { label: 'התקבל חלקית', className: 'bg-blue-100 text-blue-800' },
            'fully_received': { label: 'התקבל במלואו', className: 'bg-teal-100 text-teal-800' },
            'closed': { label: 'סגור', className: 'bg-gray-100 text-gray-800' },
            'cancelled': { label: 'בוטל', className: 'bg-red-100 text-red-800' }
        };

        const config = statusConfig[status] || statusConfig['pending_sap_details'];
        return <Badge className={config.className}>{config.label}</Badge>;
    };

    const getOrderTypeBadge = (orderType) => {
        const typeConfig = {
            'immediate_delivery': { label: 'אספקה מיידית', className: 'bg-purple-100 text-purple-800' },
            'framework': { label: 'הזמנת מסגרת', className: 'bg-indigo-100 text-indigo-800' }
        };

        const config = typeConfig[orderType] || { label: orderType, className: 'bg-gray-100 text-gray-800' };
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

    const renderCell = useCallback((order, columnKey) => {
        switch (columnKey) {
            case 'order_number_temp':
                return (
                    <Link
                        to={createPageUrl('EditOrder') + `?id=${order.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium hover:underline flex items-center gap-1"
                    >
                        {order.order_number_temp}
                        <ExternalLink className="h-3 w-3" />
                    </Link>
                );
            case 'order_number_permanent':
                return order.order_number_permanent || '-';
            case 'purchase_order_number_sap':
                return order.purchase_order_number_sap || '-';
            case 'order_date':
                return formatDate(order.order_date);
            case 'supplier':
                return order.supplier_name_snapshot || 'לא צוין';
            case 'order_type':
                return getOrderTypeBadge(order.order_type);
            case 'status':
                return getStatusBadge(order.status);
            case 'linked_withdrawals':
                if (!order.linked_withdrawal_request_ids || order.linked_withdrawal_request_ids.length === 0) {
                    return <span className="text-gray-400">אין</span>;
                }
                return (
                    <div className="flex flex-wrap gap-1">
                        {order.linked_withdrawal_request_ids.slice(0, 2).map((withdrawalId, idx) => {
                            const withdrawal = order.linked_withdrawals?.find(w => w.id === withdrawalId);
                            return (
                                <Link
                                    key={withdrawalId}
                                    to={createPageUrl(`EditWithdrawalRequest?id=${withdrawalId}`)}
                                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                                >
                                    {withdrawal?.withdrawal_number || `משיכה ${idx + 1}`}
                                    <ExternalLink className="h-3 w-3" />
                                </Link>
                            );
                        })}
                        {order.linked_withdrawal_request_ids.length > 2 && (
                            <span className="text-xs text-gray-500">
                                +{order.linked_withdrawal_request_ids.length - 2}
                            </span>
                        )}
                    </div>
                );
            case 'linked_deliveries':
                return order.linked_delivery_numbers && order.linked_delivery_numbers.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                        {order.linked_delivery_numbers.map((deliveryNumber, idx) => {
                            const deliveryId = order.linked_delivery_ids[idx];
                            return (
                                <Link
                                    key={deliveryId}
                                    to={createPageUrl(`EditDelivery?id=${deliveryId}`)}
                                    className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200 flex items-center gap-1"
                                >
                                    {deliveryNumber}
                                    <ExternalLink className="h-2 w-2" />
                                </Link>
                            );
                        })}
                    </div>
                ) : '-';
            case 'total_items':
                return order.total_items || 0;
            case 'total_quantity_ordered':
                return order.total_quantity_ordered || 0;
            case 'total_quantity_received':
                return order.total_quantity_received || 0;
            case 'total_quantity_remaining':
                return order.total_quantity_remaining || 0;
            case 'expected_delivery_start_date':
                return formatDate(order.expected_delivery_start_date);
            case 'actions':
                return (
                    <div className="flex items-center gap-2">
                        <Link to={createPageUrl('EditOrder') + `?id=${order.id}`}>
                            <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                );
            default:
                return order[columnKey] || '';
        }
    }, [getStatusBadge, getOrderTypeBadge, formatDate]);

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        const printContent = `
            <!DOCTYPE html>
            <html dir="rtl">
            <head>
                <title>דוח הזמנות</title>
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
                    <h1>דוח הזמנות</h1>
                    <p>מערכת ניהול מלאי ריאגנטים</p>
                </div>
                <div class="summary">
                    <strong>סיכום:</strong> סה"כ ${filteredAndSortedOrders.length} הזמנות
                </div>
                <table>
                    <thead>
                        <tr>
                            ${visibleColumns.filter(col => col !== 'actions' && col !== 'linked_withdrawals' && col !== 'linked_deliveries').map(col => {
                                const column = allColumns.find(c => c.key === col);
                                return `<th>${column?.label || col}</th>`;
                            }).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredAndSortedOrders.map(order => `
                            <tr>
                                ${visibleColumns.filter(col => col !== 'actions' && col !== 'linked_withdrawals' && col !== 'linked_deliveries').map(col => {
                                    let value = '';
                                    switch (col) {
                                        case 'order_date':
                                        case 'expected_delivery_start_date':
                                            value = formatDate(order[col]);
                                            break;
                                        case 'status':
                                            const statusLabels = {
                                                'pending_sap_details': 'ממתין לפרטי SAP',
                                                'pending_sap_permanent_id': 'ממתין למספר קבוע',
                                                'pending_sap_po_number': 'ממתין למספר דרישה',
                                                'approved': 'מאושר',
                                                'partially_received': 'התקבל חלקית',
                                                'fully_received': 'התקבל במלואו',
                                                'closed': 'סגור',
                                                'cancelled': 'בוטל'
                                            };
                                            value = statusLabels[order.status] || order.status;
                                            break;
                                        case 'order_type':
                                            const typeLabels = {
                                                'immediate_delivery': 'אספקה מיידית',
                                                'framework': 'הזמנת מסגרת'
                                            };
                                            value = typeLabels[order.order_type] || order.order_type;
                                            break;
                                        default:
                                            value = order[col] || '';
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
        'pending_sap_details': 'ממתין לפרטי SAP',
        'pending_sap_permanent_id': 'ממתין למספר קבוע',
        'pending_sap_po_number': 'ממתין למספר דרישה',
        'approved': 'מאושר',
        'partially_received': 'התקבל חלקית',
        'fully_received': 'התקבל במלואו',
        'closed': 'סגור',
        'cancelled': 'בוטל'
    };

    const orderTypeLabels = {
        'immediate_delivery': 'אספקה מיידית',
        'framework': 'הזמנת מסגרת'
    };

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setOrderTypeFilter('all');
        setMobileFilterOpen(false);
    };

    const activeFiltersCount = [
        statusFilter !== 'all',
        orderTypeFilter !== 'all'
    ].filter(Boolean).length;

    // Calculate summary
    const summary = useMemo(() => {
        const byStatus = orders.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
        }, {});

        return {
            total: orders.length,
            ...byStatus
        };
    }, [orders]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="mr-2">טוען הזמנות...</span>
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
                                <FileText className="h-5 w-5 sm:h-6 sm:w-6 ml-2 text-blue-600 flex-shrink-0" />
                                <span className="truncate">ניהול דרישות רכש</span>
                            </h1>
                        </div>
                    </div>
                    
                    {/* Desktop: Full Button */}
                    <Link to={createPageUrl('NewOrder')} className="hidden sm:block flex-shrink-0">
                        <Button className="bg-amber-500 hover:bg-amber-600 text-white">
                            <Plus className="h-4 w-4 mr-2" />
                            דרישת רכש חדשה
                        </Button>
                    </Link>

                    {/* Mobile: Icon Only Button */}
                    <Link to={createPageUrl('NewOrder')} className="sm:hidden flex-shrink-0">
                        <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white px-3">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>

                {/* Summary Stats */}
                <div className="flex flex-wrap gap-2 text-xs sm:text-sm text-gray-600">
                    <span className="bg-blue-50 px-2 py-1 rounded">
                        סה"כ: <strong>{summary.total}</strong>
                    </span>
                    <span className="bg-yellow-50 px-2 py-1 rounded">
                        ממתינות: <strong>{summary.pending_sap_details || 0}</strong>
                    </span>
                    <span className="bg-green-50 px-2 py-1 rounded">
                        מאושרות: <strong>{summary.approved || 0}</strong>
                    </span>
                    <span className="bg-blue-50 px-2 py-1 rounded">
                        חלקיות: <strong>{summary.partially_received || 0}</strong>
                    </span>
                </div>
            </div>

            {/* Filter and Action Controls */}
            <div className="flex flex-wrap items-end gap-3 mb-6">
                {/* Search Input - Always visible */}
                <div className="relative flex-1 min-w-[200px] sm:min-w-[unset]">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        placeholder="חיפוש לפי מס' הזמנה, ספק..."
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
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="סטטוס" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">כל הסטטוסים</SelectItem>
                            {Object.entries(statusLabels).map(([key, label]) => (
                                <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={orderTypeFilter} onValueChange={setOrderTypeFilter}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="סוג הזמנה" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">כל הסוגים</SelectItem>
                            {Object.entries(orderTypeLabels).map(([key, label]) => (
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
                        <SheetTitle className="text-white">סינון הזמנות</SheetTitle>
                        <SheetDescription className="text-gray-300">
                            בחר אפשרויות לסינון רשימת ההזמנות
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
                            <Label className="text-white">סוג הזמנה</Label>
                            <Select value={orderTypeFilter} onValueChange={setOrderTypeFilter}>
                                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">כל הסוגים</SelectItem>
                                    {Object.entries(orderTypeLabels).map(([key, label]) => (
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
            <div className="hidden md:block">
                <Card>
                    <CardContent className="p-0">
                        <ResizableTable
                            columns={allColumns}
                            data={filteredAndSortedOrders}
                            visibleColumns={visibleColumns}
                            sortField={sortField}
                            sortDirection={sortDirection}
                            onSort={handleSort}
                            renderCell={renderCell}
                        />

                        {filteredAndSortedOrders.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-gray-500">לא נמצאו הזמנות התואמות לחיפוש</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
                {filteredAndSortedOrders.length === 0 ? (
                    <Card className="p-6">
                        <div className="text-center text-gray-500">
                            <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                            <p>לא נמצאו הזמנות התואמות לחיפוש</p>
                        </div>
                    </Card>
                ) : (
                    filteredAndSortedOrders.map(order => (
                        <Card key={order.id} className="p-4 hover:shadow-md transition-shadow">
                            <div className="space-y-3">
                                {/* Header: Order Number + Actions */}
                                <div className="flex justify-between items-start gap-2">
                                    <Link 
                                        to={createPageUrl(`EditOrder?id=${order.id}`)}
                                        className="font-bold text-lg text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                                    >
                                        {order.order_number_temp}
                                        <ExternalLink className="h-4 w-4" />
                                    </Link>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start">
                                            <DropdownMenuItem onClick={() => navigate(createPageUrl(`EditOrder?id=${order.id}`))}>
                                                <Edit className="h-4 w-4 ml-2" />
                                                עריכה
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {/* Supplier and Date */}
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-gray-400" />
                                        <span className="font-medium text-gray-900">{order.supplier_name_snapshot || 'לא צוין'}</span>
                                    </div>
                                    <span className="text-gray-500">{formatDate(order.order_date)}</span>
                                </div>

                                {/* Status and Type Badges */}
                                <div className="flex flex-wrap gap-2">
                                    {getStatusBadge(order.status)}
                                    {getOrderTypeBadge(order.order_type)}
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t">
                                    <div>
                                        <span className="text-gray-500 text-xs block">פריטים</span>
                                        <span className="font-semibold text-gray-900">{order.total_items || 0}</span>
                                    </div>
                                    {order.order_number_permanent && (
                                        <div>
                                            <span className="text-gray-500 text-xs block">מס' קבוע</span>
                                            <span className="font-medium text-gray-900">{order.order_number_permanent}</span>
                                        </div>
                                    )}
                                    {order.linked_withdrawal_count > 0 && (
                                        <div className="col-span-2">
                                            <span className="text-gray-500 text-xs block mb-1">משיכות מקושרות</span>
                                            <div className="flex flex-wrap gap-1">
                                                {order.linked_withdrawal_request_ids?.slice(0, 3).map((withdrawalId, idx) => (
                                                    <Link
                                                        key={withdrawalId}
                                                        to={createPageUrl(`EditWithdrawalRequest?id=${withdrawalId}`)}
                                                        className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded hover:bg-purple-200 flex items-center gap-1"
                                                    >
                                                        משיכה {idx + 1}
                                                        <ExternalLink className="h-2 w-2" />
                                                    </Link>
                                                ))}
                                                {order.linked_withdrawal_request_ids?.length > 3 && (
                                                    <span className="text-xs text-gray-500">
                                                        +{order.linked_withdrawal_request_ids.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {order.linked_delivery_count > 0 && (
                                        <div className="col-span-2">
                                            <span className="text-gray-500 text-xs block mb-1">משלוחים מקושרים</span>
                                            <div className="flex flex-wrap gap-1">
                                                {order.linked_delivery_numbers?.slice(0, 3).map((deliveryNumber, idx) => {
                                                    const deliveryId = order.linked_delivery_ids[idx];
                                                    return (
                                                        <Link
                                                            key={deliveryId}
                                                            to={createPageUrl(`EditDelivery?id=${deliveryId}`)}
                                                            className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200 flex items-center gap-1"
                                                        >
                                                            {deliveryNumber}
                                                            <ExternalLink className="h-2 w-2" />
                                                        </Link>
                                                    );
                                                })}
                                                {order.linked_delivery_numbers?.length > 3 && (
                                                    <span className="text-xs text-gray-500">
                                                        +{order.linked_delivery_numbers.length - 3}
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