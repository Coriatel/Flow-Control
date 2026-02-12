import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getSupplyTrackingData } from '@/api/functions';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from 'sonner';
import { createPageUrl } from "@/utils";
import {
  Search, RefreshCw, Loader2, Columns3, Package, Truck, Clock, AlertCircle
} from "lucide-react";
import { format, parseISO, isValid, differenceInDays } from 'date-fns';
import { he } from 'date-fns/locale';
import BackButton from '@/components/ui/BackButton';
import { useNavigate, Link } from "react-router-dom";
import ResizableTable from '@/components/ui/ResizableTable';

/**
 * SupplyTracking Frontend Logic
 * ==============================
 * 
 * מה שקורה ב-FRONTEND:
 * --------------------
 * 1. קריאה אחת לפונקציית Backend: getSupplyTrackingData()
 * 2. קבלת רשימת אספקות מאוחדת ומעובדת מהשרת
 * 3. סינון מקומי בלבד (searchTerm, typeFilter, urgencyFilter, supplierFilter)
 * 4. מיון מקומי (sortField, sortDirection)
 * 5. הצגת הנתונים בטבלה או כרטיסים
 * 
 * מה שלא קורה ב-FRONTEND (הועבר לשרת):
 * -------------------------------------
 * ❌ אין קריאות מרובות ל-Order, WithdrawalRequest, OrderItem, WithdrawalItem
 * ❌ אין לוגיקה של איחוד הזמנות ובקשות משיכה
 * ❌ אין חישוב של days_waiting
 * ❌ אין העשרת נתונים עם פריטים
 * 
 * מה שקורה ב-BACKEND (functions/getSupplyTrackingData.js):
 * ========================================================
 * 
 * 1. טעינת כל הנתונים הדרושים במקביל:
 *    - Order (approved, partially_received)
 *    - WithdrawalRequest (submitted, approved, in_delivery)
 *    - OrderItem (open, partially_received)
 *    - WithdrawalItem (pending, approved)
 * 
 * 2. איחוד למבנה אחיד:
 *    - כל הזמנה/בקשה הופכת לאובייקט Supply
 *    - הוספת שדות: type, document_number, days_waiting, items
 * 
 * 3. חישובים:
 *    - days_waiting לכל אספקה
 *    - סיכום: totalSupplies, ordersCount, withdrawalsCount, urgentCount
 * 
 * 4. מיון ראשוני (לפי request_date)
 * 
 * 5. החזרת JSON מובנה:
 *    - supplies: [...]
 *    - summary: {...}
 * 
 * יתרונות הגישה החדשה:
 * =====================
 * ✅ קריאה אחת במקום 4 קריאות נפרדות
 * ✅ איחוד ועיבוד בשרת (יותר מהיר)
 * ✅ פחות עומס על הדפדפן
 * ✅ קוד פשוט יותר ב-Frontend
 */

export default function SupplyTracking() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [supplies, setSupplies] = useState([]);
  const [summary, setSummary] = useState({});
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [sortField, setSortField] = useState('request_date');
  const [sortDirection, setSortDirection] = useState('desc');

  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState([
    'document_number', 'type', 'request_date', 'supplier', 'status', 'urgency', 'days_waiting', 'actions'
  ]);

  const allColumns = [
    { key: 'document_number', label: 'מס\' מסמך', alwaysVisible: true, defaultWidth: 180 },
    { key: 'type', label: 'סוג', alwaysVisible: true, defaultWidth: 140 },
    { key: 'request_date', label: 'תאריך בקשה', defaultWidth: 120 },
    { key: 'expected_delivery', label: 'אספקה צפויה', defaultWidth: 120 },
    { key: 'supplier', label: 'ספק', defaultWidth: 150 },
    { key: 'status', label: 'סטטוס', defaultWidth: 120 },
    { key: 'urgency', label: 'דחיפות', defaultWidth: 100 },
    { key: 'total_items', label: 'פריטים', defaultWidth: 100 },
    { key: 'days_waiting', label: 'ימי המתנה', defaultWidth: 110 },
    { key: 'actions', label: 'פעולות', alwaysVisible: true, defaultWidth: 100 }
  ];

  /**
   * 🎯 הפונקציה המרכזית - קריאה אחת לשרת בלבד!
   */
  const fetchSupplies = useCallback(async () => {
    setLoading(true);
    try {
      console.log('[SupplyTracking Frontend] Fetching supplies from backend...');

      const response = await getSupplyTrackingData({
        limit: '100',
        sortBy: sortDirection === 'desc' ? `-${sortField}` : sortField
      });

      const success = response?.data?.success ?? response?.success;
      const payload = response?.data?.data ?? response?.data ?? {};

      if (success) {
        setSupplies(payload.supplies || []);
        setSummary(payload.summary || {});
        console.log('✅ [SupplyTracking Frontend] Data loaded:', payload.supplies?.length || 0);
      } else {
        throw new Error(response?.data?.error || response?.error || 'Failed to fetch supplies');
      }
    } catch (error) {
      console.error('❌ [SupplyTracking Frontend] Error:', error);
      toast.error('שגיאה בטעינת אספקות', {
        description: error.message
      });
      setSupplies([]);
    } finally {
      setLoading(false);
    }
  }, [sortField, sortDirection]);

  useEffect(() => {
    fetchSupplies();
  }, [fetchSupplies]);

  // Get unique suppliers for filter
  const uniqueSuppliers = useMemo(() => {
    const suppliers = new Set(supplies.map(s => s.supplier).filter(Boolean));
    return Array.from(suppliers).sort();
  }, [supplies]);

  /**
   * סינון מקומי (קליל) - רק חיפוש טקסט וסינון פשוט
   */
  const filteredAndSortedSupplies = useMemo(() => {
    let filtered = [...supplies];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(supply =>
        supply.document_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supply.supplier?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(supply => supply.type === typeFilter);
    }

    // Urgency filter
    if (urgencyFilter !== "all") {
      filtered = filtered.filter(supply => supply.urgency === urgencyFilter);
    }

    // Supplier filter
    if (supplierFilter !== "all") {
      filtered = filtered.filter(supply => supply.supplier === supplierFilter);
    }

    return filtered;
  }, [supplies, searchTerm, typeFilter, urgencyFilter, supplierFilter]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleColumnVisibility = (columnKey) => {
    const column = allColumns.find(c => c.key === columnKey);
    if (column?.alwaysVisible) return;

    setVisibleColumns(prev =>
      prev.includes(columnKey)
        ? prev.filter(k => k !== columnKey)
        : [...prev, columnKey]
    );
  };

  const getStatusBadge = (status, type) => {
    const statusMap = {
      approved: { label: 'מאושר', class: 'bg-blue-100 text-blue-800' },
      partially_received: { label: 'התקבל חלקי', class: 'bg-yellow-100 text-yellow-800' },
      submitted: { label: 'נשלח', class: 'bg-purple-100 text-purple-800' },
      in_delivery: { label: 'באספקה', class: 'bg-orange-100 text-orange-800' }
    };
    
    const config = statusMap[status] || { label: status, class: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.class}>{config.label}</Badge>;
  };

  const getUrgencyBadge = (urgency) => {
    const urgencyMap = {
      routine: { label: 'שגרתי', class: 'bg-gray-100 text-gray-800' },
      urgent: { label: 'דחוף', class: 'bg-orange-100 text-orange-800' },
      emergency: { label: 'חירום', class: 'bg-red-100 text-red-800' }
    };
    
    const config = urgencyMap[urgency] || urgencyMap.routine;
    return <Badge className={config.class}>{config.label}</Badge>;
  };

  const getTypeBadge = (type) => {
    const typeMap = {
      order: { label: 'דרישת רכש', class: 'bg-blue-100 text-blue-800', icon: Package },
      withdrawal: { label: 'משיכה', class: 'bg-purple-100 text-purple-800', icon: Truck }
    };
    
    const config = typeMap[type];
    const Icon = config.icon;
    
    return (
      <Badge className={config.class}>
        <Icon className="h-3 w-3 ms-1" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '---';
    const date = parseISO(dateString);
    return isValid(date) ? format(date, 'dd/MM/yyyy', { locale: he }) : '---';
  };

  const renderCell = (supply, columnKey) => {
    switch (columnKey) {
      case 'document_number':
        const targetPage = supply.type === 'order' ? 'EditOrder' : 'EditWithdrawalRequest';
        return (
          <Link 
            to={createPageUrl(`${targetPage}?id=${supply.id}`)}
            className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
          >
            {supply.document_number}
          </Link>
        );
      case 'type':
        return getTypeBadge(supply.type);
      case 'request_date':
        return formatDate(supply.request_date);
      case 'expected_delivery':
        return formatDate(supply.expected_delivery);
      case 'supplier':
        return supply.supplier || '-';
      case 'status':
        return getStatusBadge(supply.status, supply.type);
      case 'urgency':
        return getUrgencyBadge(supply.urgency);
      case 'total_items':
        return <Badge variant="outline">{supply.total_items}</Badge>;
      case 'days_waiting':
        return (
          <div className={`inline-flex items-center gap-1 ${
            supply.days_waiting > 14 ? 'text-red-600' :
            supply.days_waiting > 7 ? 'text-orange-600' : 'text-gray-600'
          }`}>
            {supply.days_waiting > 7 && <AlertCircle className="h-4 w-4" />}
            <span className="font-medium">{supply.days_waiting || 0}</span>
          </div>
        );
      case 'actions':
        const page = supply.type === 'order' ? 'EditOrder' : 'EditWithdrawalRequest';
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(createPageUrl(`${page}?id=${supply.id}`))}
          >
            פרטים
          </Button>
        );
      default:
        return supply[columnKey] || '';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="me-3 text-lg text-gray-600">טוען אספקות...</p>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto p-4 sm:p-6" dir="rtl">
      <BackButton />
      
      <Card className="mt-4">
        <CardHeader className="border-b border-gray-200 bg-gradient-to-l from-blue-50 to-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
                <Clock className="h-6 w-6 ms-2 text-blue-600" />
                מעקב אספקות ({filteredAndSortedSupplies.length})
              </CardTitle>
              {summary && (
                <div className="flex gap-3 mt-2 text-sm text-gray-600">
                  <span>הזמנות: {summary.ordersCount || 0}</span>
                  <span>משיכות: {summary.withdrawalsCount || 0}</span>
                  {summary.urgentCount > 0 && (
                    <span className="text-orange-600 font-medium">דחופות: {summary.urgentCount}</span>
                  )}
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSupplies}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="me-2">רענן</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Filters */}
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative lg:col-span-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="חפש לפי מספר מסמך..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pe-10"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="סוג מסמך" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הסוגים</SelectItem>
                <SelectItem value="order">דרישות רכש</SelectItem>
                <SelectItem value="withdrawal">משיכות</SelectItem>
              </SelectContent>
            </Select>

            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
              <SelectTrigger>
                <SelectValue placeholder="ספק" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הספקים</SelectItem>
                {uniqueSuppliers.map(supplier => (
                  <SelectItem key={supplier} value={supplier}>{supplier}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="דחיפות" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הרמות</SelectItem>
                <SelectItem value="routine">שגרתי</SelectItem>
                <SelectItem value="urgent">דחוף</SelectItem>
                <SelectItem value="emergency">חירום</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Columns3 className="h-4 w-4 ms-2" />
                  עמודות
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56" align="end">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">הצג עמודות</h4>
                  {allColumns.map(column => (
                    <div key={column.key} className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id={column.key}
                        checked={visibleColumns.includes(column.key)}
                        onCheckedChange={() => toggleColumnVisibility(column.key)}
                        disabled={column.alwaysVisible}
                      />
                      <label
                        htmlFor={column.key}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {column.label}
                      </label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Table */}
          {filteredAndSortedSupplies.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-lg text-gray-500">אין אספקות ממתינות</p>
            </div>
          ) : (
            <div className="hidden md:block">
              <Card>
                <CardContent className="p-0">
                  <ResizableTable
                    columns={allColumns}
                    data={filteredAndSortedSupplies}
                    visibleColumns={visibleColumns}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    renderCell={renderCell}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {filteredAndSortedSupplies.map(supply => (
              <Card key={`${supply.type}-${supply.id}`} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <Link 
                    to={createPageUrl(`${supply.type === 'order' ? 'EditOrder' : 'EditWithdrawalRequest'}?id=${supply.id}`)}
                    className="font-bold text-lg text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {supply.document_number}
                  </Link>
                  {getTypeBadge(supply.type)}
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">ספק:</span>
                    <span className="font-medium">{supply.supplier || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">תאריך:</span>
                    <span>{formatDate(supply.request_date)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">סטטוס:</span>
                    {getStatusBadge(supply.status, supply.type)}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">ימי המתנה:</span>
                    <div className={`inline-flex items-center gap-1 ${
                      supply.days_waiting > 14 ? 'text-red-600' :
                      supply.days_waiting > 7 ? 'text-orange-600' : 'text-gray-600'
                    }`}>
                      {supply.days_waiting > 7 && <AlertCircle className="h-4 w-4" />}
                      <span className="font-medium">{supply.days_waiting || 0}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
