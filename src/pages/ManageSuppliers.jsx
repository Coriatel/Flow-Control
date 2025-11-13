
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import {
  Plus, Search, RefreshCw, Loader2, Columns3, Edit2, Trash2, CheckCircle2, XCircle, Users, SlidersHorizontal
} from 'lucide-react';
import BackButton from '@/components/ui/BackButton';
import ResizableTable from '@/components/ui/ResizableTable';
import SupplierCard from '../components/suppliers/SupplierCard';
import SupplierForm from '../components/suppliers/SupplierForm';
import { base44 } from '@/api/base44Client';

export default function ManageSuppliersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const [deletingSupplier, setDeletingSupplier] = useState(false);
  
  // Edit supplier state
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [showSupplierForm, setShowSupplierForm] = useState(false);

  // Mobile filter sheet state
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState([
    'name', 'code', 'contact_person', 'phone', 'email', 'contacts_count', 'is_active', 'actions'
  ]);

  const allColumns = [
    { key: 'name', label: 'שם ספק', alwaysVisible: true, defaultWidth: 180 },
    { key: 'display_name', label: 'שם תצוגה', defaultWidth: 150 },
    { key: 'code', label: 'קוד', defaultWidth: 100 },
    { key: 'contact_person', label: 'איש קשר', defaultWidth: 150 },
    { key: 'phone', label: 'טלפון', defaultWidth: 130 },
    { key: 'email', label: 'אימייל', defaultWidth: 180 },
    { key: 'address', label: 'כתובת', defaultWidth: 200 },
    { key: 'website', label: 'אתר', defaultWidth: 180 },
    { key: 'contacts_count', label: 'אנשי קשר', defaultWidth: 120 },
    { key: 'is_active', label: 'סטטוס', defaultWidth: 100 },
    { key: 'has_associated_data', label: 'נתונים משוייכים', defaultWidth: 140 },
    { key: 'actions', label: 'פעולות', alwaysVisible: true, defaultWidth: 120 }
  ];

  // Read supplier filter from URL query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const supplierParam = params.get('supplier');
    if (supplierParam) {
      setSearchTerm(supplierParam);
    }
  }, [location.search]);

  /**
   * FRONTEND LOGIC (משודרג):
   * =========================
   * 
   * לפני השדרוג:
   * ------------
   * 1. Supplier.list() - קריאה ראשונה
   * 2. SupplierContact.list() - קריאה שנייה
   * 3. חישוב contactsCountMap - ב-JavaScript של הדפדפן
   * 
   * אחרי השדרוג:
   * ------------
   * 1. base44.functions.invoke('getManageSuppliersData') - קריאה אחת בלבד!
   * 2. קבלת נתונים מעובדים עם contacts_count מהשרת
   * 3. עדכון state ישירות
   * 
   * = טעינה מהירה יותר, פחות עומס על הדפדפן!
   */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      console.log("[ManageSuppliers Frontend] Fetching from backend function...");
      
      // 🎯 קריאה אחת בלבד - כל הלוגיקה בשרת!
      const response = await base44.functions.invoke('getManageSuppliersData');
      
      if (response.data.success) {
        setSuppliers(response.data.data.suppliers);
        console.log(`[ManageSuppliers Frontend] ✅ Loaded ${response.data.data.suppliers.length} suppliers`);
      } else {
        throw new Error(response.data.error || 'Failed to load data');
      }
    } catch (error) {
      console.error('[ManageSuppliers Frontend] ❌ Error:', error);
      toast.error('שגיאה בטעינת נתונים', {
        description: 'לא ניתן היה לטעון את רשימת הספקים'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter and sort
  const filteredAndSortedSuppliers = useMemo(() => {
    let filtered = [...suppliers];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(supplier =>
        supplier.name?.toLowerCase().includes(term) ||
        supplier.display_name?.toLowerCase().includes(term) ||
        supplier.code?.toLowerCase().includes(term) ||
        supplier.contact_person?.toLowerCase().includes(term) ||
        supplier.phone?.toLowerCase().includes(term) ||
        supplier.email?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      filtered = filtered.filter(supplier => supplier.is_active === isActive);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle strings
      if (typeof aValue === 'string') {
        aValue = aValue?.toLowerCase() || '';
        bValue = bValue?.toLowerCase() || '';
      }

      // Handle booleans
      if (typeof aValue === 'boolean') {
        aValue = aValue ? 1 : 0;
        bValue = bValue ? 1 : 0;
      }

      if (sortConfig.direction === 'ascending') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [suppliers, searchTerm, statusFilter, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending'
    }));
  };

  const toggleColumnVisibility = (columnKey) => {
    setVisibleColumns(prev =>
      prev.includes(columnKey)
        ? prev.filter(k => k !== columnKey)
        : [...prev, columnKey]
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  const handleEditSupplier = (supplier) => {
    setEditingSupplier(supplier);
    setShowSupplierForm(true);
  };

  const handleSupplierFormSuccess = () => {
    setShowSupplierForm(false);
    setEditingSupplier(null);
    fetchData();
  };

  const handleDeleteSupplier = async () => {
    if (!supplierToDelete) return;

    setDeletingSupplier(true);
    try {
      if (supplierToDelete.has_associated_data) {
        // Soft delete
        await base44.entities.Supplier.update(supplierToDelete.id, {
          is_active: false,
          deactivation_reason: 'הושבת על ידי המשתמש',
          deactivated_date: new Date().toISOString()
        });
        toast.success('הספק הושבת בהצלחה', {
          description: 'הספק סומן כלא פעיל'
        });
      } else {
        // Hard delete
        await base44.entities.Supplier.delete(supplierToDelete.id);
        toast.success('הספק נמחק בהצלחה');
      }
      
      await fetchData();
      setSupplierToDelete(null);
    } catch (error) {
      console.error('Error deleting supplier:', error);
      toast.error('שגיאה במחיקת ספק', {
        description: error.message
      });
    } finally {
      setDeletingSupplier(false);
    }
  };

  const renderCell = (supplier, columnKey) => {
    switch (columnKey) {
      case 'name':
        return (
          <span className="font-medium">
            {supplier.name}
          </span>
        );
      case 'display_name':
        return supplier.display_name || <span className="text-gray-400">-</span>;
      case 'code':
        return supplier.code || <span className="text-gray-400">-</span>;
      case 'contact_person':
        return supplier.contact_person || <span className="text-gray-400">-</span>;
      case 'phone':
        return supplier.phone ? (
          <a href={`tel:${supplier.phone}`} className="text-blue-600 hover:underline">
            {supplier.phone}
          </a>
        ) : <span className="text-gray-400">-</span>;
      case 'email':
        return supplier.email ? (
          <a href={`mailto:${supplier.email}`} className="text-blue-600 hover:underline">
            {supplier.email}
          </a>
        ) : <span className="text-gray-400">-</span>;
      case 'address':
        return supplier.address || <span className="text-gray-400">-</span>;
      case 'website':
        return supplier.website ? (
          <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            {supplier.website}
          </a>
        ) : <span className="text-gray-400">-</span>;
      case 'contacts_count':
        const contactCount = supplier.contacts_count || 0;
        return (
          <Link
            to={`${createPageUrl('Contacts')}?supplier=${encodeURIComponent(supplier.name)}`}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline"
          >
            <Users className="h-4 w-4" />
            <span>{contactCount} {contactCount === 1 ? 'איש קשר' : 'אנשי קשר'}</span>
          </Link>
        );
      case 'is_active':
        return supplier.is_active ? (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
            פעיל
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
            לא פעיל
          </Badge>
        );
      case 'has_associated_data':
        return supplier.has_associated_data ? (
          <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
        ) : (
          <XCircle className="h-4 w-4 text-gray-400 mx-auto" />
        );
      case 'actions':
        return (
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEditSupplier(supplier)}
              title="עריכה"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSupplierToDelete(supplier)}
              title={supplier.has_associated_data ? 'השבת ספק' : 'מחק ספק'}
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        );
      default:
        return supplier[columnKey] || '';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center">
          <BackButton />
          <h1 className="text-2xl font-bold mr-3">ניהול ספקים</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchData} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => {
            setEditingSupplier(null);
            setShowSupplierForm(true);
          }}>
            <Plus className="h-4 w-4 ml-2" />
            ספק חדש
          </Button>
        </div>
      </div>

      {/* Desktop Filters */}
      <Card className="mb-6 hidden lg:block">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="חיפוש לפי שם, קוד, איש קשר, טלפון, אימייל..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="כל הסטטוסים" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הסטטוסים</SelectItem>
                <SelectItem value="active">פעיל</SelectItem>
                <SelectItem value="inactive">לא פעיל</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button variant="outline" onClick={clearFilters} size="sm">
                נקה
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <Columns3 className="h-4 w-4 ml-2" />
                    עמודות
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64" align="end">
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
                        <label htmlFor={column.key} className="text-sm cursor-pointer flex-1">
                          {column.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Filters - Compact Bar with Sheet */}
      <div className="lg:hidden mb-4">
        <Card>
          <CardContent className="p-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="חיפוש..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setMobileFilterOpen(true)}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Filter Sheet with Glassmorphism */}
      <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
        <SheetContent 
          side="right" 
          className="w-full sm:max-w-md glassmorphism-dark"
          style={{
            background: 'rgba(30, 41, 59, 0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <SheetHeader>
            <SheetTitle className="text-white">סינון ספקים</SheetTitle>
            <SheetDescription className="text-gray-300">
              בחר אפשרויות לסינון רשימת הספקים
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
                  <SelectItem value="active">פעיל</SelectItem>
                  <SelectItem value="inactive">לא פעיל</SelectItem>
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
                      onCheckedChange={() => toggleColumnVisibility(column.key)}
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
              <Button variant="outline" onClick={clearFilters} className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20">
                נקה
              </Button>
              <Button onClick={() => setMobileFilterOpen(false)} className="flex-1 bg-white text-gray-900 hover:bg-white/90">
                החל
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Results Count */}
      <div className="mb-4 text-sm text-slate-600">
        מציג {filteredAndSortedSuppliers.length} מתוך {suppliers.length} ספקים
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block">
        <Card>
          <CardHeader>
            <CardTitle>רשימת ספקים</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ResizableTable
              columns={allColumns}
              data={filteredAndSortedSuppliers}
              visibleColumns={visibleColumns}
              sortField={sortConfig.key}
              sortDirection={sortConfig.direction === 'ascending' ? 'asc' : 'desc'}
              onSort={handleSort}
              renderCell={renderCell}
            />
            {filteredAndSortedSuppliers.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">לא נמצאו ספקים התואמים את הסינון</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden">
        {filteredAndSortedSuppliers.length > 0 ? (
          filteredAndSortedSuppliers.map(supplier => (
            <SupplierCard 
              key={supplier.id} 
              supplier={supplier} 
              contactsCount={supplier.contacts_count || 0}
              onEdit={handleEditSupplier}
            />
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">לא נמצאו ספקים</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Supplier Dialog */}
      <Dialog open={showSupplierForm} onOpenChange={setShowSupplierForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSupplier ? 'עריכת ספק' : 'ספק חדש'}
            </DialogTitle>
          </DialogHeader>
          <SupplierForm
            supplier={editingSupplier}
            onSuccess={handleSupplierFormSuccess}
            onCancel={() => {
              setShowSupplierForm(false);
              setEditingSupplier(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!supplierToDelete} onOpenChange={() => setSupplierToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {supplierToDelete?.has_associated_data ? 'השבת ספק' : 'מחיקת ספק'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {supplierToDelete?.has_associated_data ? (
                <>
                  לספק <strong>{supplierToDelete?.name}</strong> קיימים נתונים משוייכים (ריאגנטים, הזמנות וכו').
                  <br /><br />
                  הספק יסומן כלא פעיל אך לא יימחק לחלוטין.
                </>
              ) : (
                <>
                  האם אתה בטוח שברצונך למחוק את הספק <strong>{supplierToDelete?.name}</strong>?
                  <br /><br />
                  פעולה זו בלתי הפיכה.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingSupplier}>ביטול</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteSupplier} 
              disabled={deletingSupplier}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingSupplier ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  {supplierToDelete?.has_associated_data ? 'משבית...' : 'מוחק...'}
                </>
              ) : (
                supplierToDelete?.has_associated_data ? 'השבת' : 'מחק'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
