
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom'; // Keep Link for potential future use or if createPageUrl links to other pages
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Plus, Search, RefreshCw, Loader2, Columns3, Edit2, Trash2, SlidersHorizontal, FileDown, Users
} from 'lucide-react';
import BackButton from '@/components/ui/BackButton';
import ResizableTable from '@/components/ui/ResizableTable';
import ContactCard from '../components/contacts/ContactCard';
import ContactForm from '../components/contacts/ContactForm';
import { getContactsData } from '@/api/functions';
import { SupplierContact } from '@/api/entities';

export default function ContactsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [contactTypeFilter, setContactTypeFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'full_name', direction: 'ascending' });
  const [contactToDelete, setContactToDelete] = useState(null);
  const [deletingContact, setDeletingContact] = useState(false);
  
  const [editingContact, setEditingContact] = useState(null);
  const [showContactForm, setShowContactForm] = useState(false);

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [visibleColumns, setVisibleColumns] = useState([
    'full_name', 'supplier', 'contact_type', 'phone', 'mobile', 'email', 'actions'
  ]);

  const allColumns = [
    { key: 'full_name', label: 'שם מלא', alwaysVisible: true, defaultWidth: 180 },
    { key: 'supplier', label: 'ספק', defaultWidth: 150 },
    { key: 'contact_type', label: 'סוג קשר', defaultWidth: 120 },
    { key: 'job_title', label: 'תפקיד', defaultWidth: 150 },
    { key: 'phone', label: 'טלפון', defaultWidth: 130 },
    { key: 'mobile', label: 'נייד', defaultWidth: 130 },
    { key: 'email', label: 'אימייל', defaultWidth: 200 },
    { key: 'department', label: 'מחלקה', defaultWidth: 120 },
    { key: 'preferred_contact_method', label: 'דרך קשר מועדפת', defaultWidth: 150 },
    { key: 'actions', label: 'פעולות', alwaysVisible: true, defaultWidth: 120 }
  ];

  // Read supplier filter from URL query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const supplierParam = params.get('supplier');
    if (supplierParam) {
      setSupplierFilter(supplierParam);
    }
  }, [location.search]);

  /**
   * FRONTEND LOGIC (משודרג):
   * =========================
   * 
   * לפני השדרוג:
   * ------------
   * 1. SupplierContact.list() - טעינת כל הרשימה
   * 
   * אחרי השדרוג:
   * ------------
   * 1. base44.functions.invoke('getContactsData') - קריאה אחת מהירה!
   * 2. קבלת נתונים מעובדים מהשרת
   * 3. עדכון state ישירות
   * 
   * = טעינה מהירה יותר, מוכן להרחבה עתידית!
   */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      console.log("[Contacts Frontend] Fetching from backend function...");
      
      // 🎯 קריאה אחת בלבד - כל הלוגיקה בשרת!
      const response = await getContactsData();

      const success = response?.success ?? response?.data?.success;
      const payload = response?.data?.data ?? response?.data ?? response ?? {};
      const errorMessage = response?.error || response?.data?.error;

      if (success) {
        setContacts(payload.contacts || []);
        console.log(`[Contacts Frontend] ✅ Loaded ${payload.contacts?.length || 0} contacts`);
      } else {
        throw new Error(errorMessage || 'Failed to load data');
      }
    } catch (error) {
      console.error('[Contacts Frontend] ❌ Error:', error);
      toast.error('שגיאה בטעינת נתונים', {
        description: 'לא ניתן היה לטעון את רשימת אנשי הקשר'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredAndSortedContacts = useMemo(() => {
    let filtered = [...contacts];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(contact =>
        contact.full_name?.toLowerCase().includes(term) ||
        contact.supplier?.toLowerCase().includes(term) ||
        contact.job_title?.toLowerCase().includes(term) ||
        contact.phone?.toLowerCase().includes(term) ||
        contact.mobile?.toLowerCase().includes(term) ||
        contact.email?.toLowerCase().includes(term) ||
        contact.department?.toLowerCase().includes(term)
      );
    }

    // Supplier filter
    if (supplierFilter !== 'all') {
      filtered = filtered.filter(contact => contact.supplier === supplierFilter);
    }

    // Contact type filter
    if (contactTypeFilter !== 'all') {
      filtered = filtered.filter(contact => contact.contact_type === contactTypeFilter);
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

      if (sortConfig.direction === 'ascending') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [contacts, searchTerm, supplierFilter, contactTypeFilter, sortConfig]);

  const uniqueSuppliers = useMemo(() => {
    const suppliers = [...new Set(contacts.map(c => c.supplier).filter(Boolean))];
    return suppliers.sort();
  }, [contacts]);

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
    setSupplierFilter('all');
    setContactTypeFilter('all');
  };

  const handleEditContact = (contact) => {
    setEditingContact(contact);
    setShowContactForm(true);
  };

  const handleContactFormSuccess = async () => {
    setShowContactForm(false);
    setEditingContact(null);
    await fetchData();
  };

  const handleDeleteContact = async () => {
    if (!contactToDelete) return;

    setDeletingContact(true);
    try {
      await SupplierContact.delete(contactToDelete.id);
      toast.success('איש הקשר נמחק בהצלחה');
      await fetchData();
      setContactToDelete(null);
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('שגיאה במחיקת איש קשר', {
        description: error.message
      });
    } finally {
      setDeletingContact(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['שם מלא', 'ספק', 'סוג קשר', 'תפקיד', 'טלפון', 'נייד', 'אימייל', 'מחלקה', 'הערות'];
    const csvData = filteredAndSortedContacts.map(contact => [
      contact.full_name || '',
      contact.supplier || '',
      contact.contact_type || '',
      contact.job_title || '',
      contact.phone || '',
      contact.mobile || '',
      contact.email || '',
      contact.department || '',
      contact.notes || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${(cell + '').replace(/"/g, '""')}"`).join(',')) // Handle commas and quotes within cells
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); // Add BOM for UTF-8 in Excel
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `אנשי_קשר_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const renderCell = (contact, columnKey) => {
    switch (columnKey) {
      case 'full_name':
        return <span className="font-medium">{contact.full_name}</span>;
      case 'supplier':
        return contact.supplier || <span className="text-gray-400">-</span>;
      case 'contact_type':
        return contact.contact_type || <span className="text-gray-400">-</span>;
      case 'job_title':
        return contact.job_title || <span className="text-gray-400">-</span>;
      case 'phone':
        return contact.phone ? (
          <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
            {contact.phone}
          </a>
        ) : <span className="text-gray-400">-</span>;
      case 'mobile':
        return contact.mobile ? (
          <a href={`tel:${contact.mobile}`} className="text-blue-600 hover:underline">
            {contact.mobile}
          </a>
        ) : <span className="text-gray-400">-</span>;
      case 'email':
        return contact.email ? (
          <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
            {contact.email}
          </a>
        ) : <span className="text-gray-400">-</span>;
      case 'department':
        return contact.department || <span className="text-gray-400">-</span>;
      case 'preferred_contact_method':
        // Assuming preferred_contact_method values are already human-readable or can be mapped here
        const methodLabels = {
          phone: 'טלפון',
          mobile: 'נייד',
          email: 'אימייל',
          any: 'כל דרך',
          '': '-' // Handle empty string case
        };
        return methodLabels[contact.preferred_contact_method] || contact.preferred_contact_method || <span className="text-gray-400">-</span>;
      case 'actions':
        return (
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEditContact(contact)}
              title="עריכה"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setContactToDelete(contact)}
              title="מחק"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        );
      default:
        return contact[columnKey] || '';
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
          <h1 className="text-2xl font-bold me-3">אנשי קשר</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <FileDown className="h-4 w-4 ms-2" />
            ייצוא
          </Button>
          <Button onClick={fetchData} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => {
            setEditingContact(null);
            setShowContactForm(true);
          }}>
            <Plus className="h-4 w-4 ms-2" />
            איש קשר חדש
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
                placeholder="חיפוש לפי שם, ספק, תפקיד, טלפון, אימייל..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pe-10"
              />
            </div>

            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="כל הספקים" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הספקים</SelectItem>
                {uniqueSuppliers.map(supplier => (
                  <SelectItem key={supplier} value={supplier}>{supplier}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={contactTypeFilter} onValueChange={setContactTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="כל סוגי הקשר" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל סוגי הקשר</SelectItem>
                <SelectItem value="service">שירות</SelectItem>
                <SelectItem value="manager">מנהל</SelectItem>
                <SelectItem value="general">כללי</SelectItem>
                <SelectItem value="technical">טכני</SelectItem>
                <SelectItem value="sales">מכירות</SelectItem>
                <SelectItem value="orders">הזמנות</SelectItem>
                <SelectItem value="logistics">לוגיסטיקה</SelectItem>
                <SelectItem value="other">אחר</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button variant="outline" onClick={clearFilters} size="sm">
                נקה
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <Columns3 className="h-4 w-4 ms-2" />
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

      {/* Mobile Filters */}
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
                  className="pe-10"
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

      {/* Mobile Filter Sheet */}
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
            <SheetTitle className="text-white">סינון אנשי קשר</SheetTitle>
            <SheetDescription className="text-gray-300">
              בחר אפשרויות לסינון רשימת אנשי הקשר
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6 space-y-4">
            <div>
              <Label className="text-white">ספק</Label>
              <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הספקים</SelectItem>
                  {uniqueSuppliers.map(supplier => (
                    <SelectItem key={supplier} value={supplier}>{supplier}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white">סוג קשר</Label>
              <Select value={contactTypeFilter} onValueChange={setContactTypeFilter}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל סוגי הקשר</SelectItem>
                  <SelectItem value="service">שירות</SelectItem>
                  <SelectItem value="manager">מנהל</SelectItem>
                  <SelectItem value="general">כללי</SelectItem>
                  <SelectItem value="technical">טכני</SelectItem>
                  <SelectItem value="sales">מכירות</SelectItem>
                  <SelectItem value="orders">הזמנות</SelectItem>
                  <SelectItem value="logistics">לוגיסטיקה</SelectItem>
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
        מציג {filteredAndSortedContacts.length} מתוך {contacts.length} אנשי קשר
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block">
        <Card>
          <CardHeader>
            <CardTitle>רשימת אנשי קשר</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ResizableTable
              columns={allColumns}
              data={filteredAndSortedContacts}
              visibleColumns={visibleColumns}
              sortField={sortConfig.key}
              sortDirection={sortConfig.direction === 'ascending' ? 'asc' : 'desc'}
              onSort={handleSort}
              renderCell={renderCell}
            />
            {filteredAndSortedContacts.length === 0 && (
              <div className="text-center py-16">
                <div className="mx-auto w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <Users className="h-7 w-7 text-slate-400" />
                </div>
                <p className="text-slate-600 font-medium mb-1">לא נמצאו אנשי קשר</p>
                <p className="text-sm text-slate-400">נסה לשנות את מילות החיפוש או להסיר מסננים</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden">
        {filteredAndSortedContacts.length > 0 ? (
          filteredAndSortedContacts.map(contact => (
            <ContactCard 
              key={contact.id} 
              contact={contact}
              onEdit={handleEditContact}
              onDelete={() => setContactToDelete(contact)}
            />
          ))
        ) : (
          <Card className="p-8">
            <div className="text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <Users className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium mb-1">לا נמצאו אנשי קשר</p>
              <p className="text-sm text-slate-400">נסה לשנות את החיפוש או להסיר מסננים</p>
            </div>
          </Card>
        )}
      </div>

      {/* Edit Contact Dialog */}
      <Dialog open={showContactForm} onOpenChange={setShowContactForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingContact ? 'עריכת איש קשר' : 'איש קשר חדש'}
            </DialogTitle>
          </DialogHeader>
          <ContactForm
            contact={editingContact}
            onSuccess={handleContactFormSuccess}
            onCancel={() => {
              setShowContactForm(false);
              setEditingContact(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!contactToDelete} onOpenChange={setContactToDelete}> {/* Simplified onOpenChange */}
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת איש קשר</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את איש הקשר <strong>{contactToDelete?.full_name}</strong>?
              <br /><br />
              פעולה זו בלתי הפיכה.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingContact}>ביטול</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteContact} 
              disabled={deletingContact}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingContact ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ms-2" />
                  מוחק...
                </>
              ) : (
                'מחק'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
