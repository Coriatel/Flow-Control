import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import {
  ArrowLeft,
  Save,
  X,
  Edit3,
  Eye,
  Trash2,
  Loader2,
  AlertTriangle,
  Beaker,
  Package,
  TrendingDown,
  Clock,
  ShoppingCart,
  ExternalLink,
  Building2,
  Activity
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { he } from 'date-fns/locale';
import BackButton from '@/components/ui/BackButton';

const categoryLabels = {
  reagents: 'ריאגנטים',
  cells: 'תאים',
  controls: 'בקרות',
  solutions: 'תמיסות',
  consumables: 'מתכלים'
};

const stockStatusColors = {
  in_stock: 'bg-green-100 text-green-800 border-green-300',
  low_stock: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  out_of_stock: 'bg-red-100 text-red-800 border-red-300',
  overstocked: 'bg-blue-100 text-blue-800 border-blue-300'
};

const stockStatusLabels = {
  in_stock: 'במלאי',
  low_stock: 'מלאי נמוך',
  out_of_stock: 'אזל מהמלאי',
  overstocked: 'עודף מלאי'
};

export default function EditReagentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reagentId = searchParams.get('id');

  // States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Data states
  const [reagent, setReagent] = useState(null);
  const [activeBatches, setActiveBatches] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [relatedOrders, setRelatedOrders] = useState([]);
  const [supplierData, setSupplierData] = useState(null);

  // Form states (for edit mode)
  const [formData, setFormData] = useState({
    notes: '',
    custom_storage_location: '',
    custom_min_stock: '',
    custom_max_stock: '',
    is_critical: false
  });

  // Dialog states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Load reagent data
  useEffect(() => {
    if (!reagentId) {
      toast.error('שגיאה', { description: 'מזהה ריאגנט חסר' });
      navigate(createPageUrl('ManageReagents'));
      return;
    }
    fetchReagentData();
  }, [reagentId, navigate]);

  const fetchReagentData = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('getEditReagentData', {
        reagent_id: reagentId
      });

      if (response.data.success) {
        const { reagent, activeBatches, recentTransactions, relatedOrders, supplierData } = response.data.data;
        
        setReagent(reagent);
        setActiveBatches(activeBatches || []);
        setRecentTransactions(recentTransactions || []);
        setRelatedOrders(relatedOrders || []);
        setSupplierData(supplierData);

        // Initialize form data
        setFormData({
          notes: reagent.notes || '',
          custom_storage_location: reagent.custom_storage_location || '',
          custom_min_stock: reagent.custom_min_stock || '',
          custom_max_stock: reagent.custom_max_stock || '',
          is_critical: reagent.is_critical || false
        });
      } else {
        throw new Error(response.data.error || 'Failed to load reagent data');
      }
    } catch (error) {
      console.error('Error loading reagent:', error);
      toast.error('שגיאה בטעינת נתוני ריאגנט', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData = {
        notes: formData.notes,
        custom_storage_location: formData.custom_storage_location,
        custom_min_stock: formData.custom_min_stock ? parseFloat(formData.custom_min_stock) : null,
        custom_max_stock: formData.custom_max_stock ? parseFloat(formData.custom_max_stock) : null,
        is_critical: formData.is_critical
      };

      await base44.entities.Reagent.update(reagentId, updateData);

      toast.success('הריאגנט עודכן בהצלחה');
      setIsEditMode(false);
      await fetchReagentData(); // Reload to get fresh data
    } catch (error) {
      console.error('Error saving reagent:', error);
      toast.error('שגיאה בשמירת הריאגנט', {
        description: error.message
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await base44.functions.invoke('deleteReagent', {
        reagentId: reagentId
      });

      if (response.data.success) {
        toast.success('הריאגנט נמחק בהצלחה');
        navigate(createPageUrl('ManageReagents'));
      } else {
        throw new Error(response.data.error || 'Failed to delete reagent');
      }
    } catch (error) {
      console.error('Error deleting reagent:', error);
      toast.error('שגיאה במחיקת הריאגנט', {
        description: error.message
      });
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      notes: reagent.notes || '',
      custom_storage_location: reagent.custom_storage_location || '',
      custom_min_stock: reagent.custom_min_stock || '',
      custom_max_stock: reagent.custom_max_stock || '',
      is_critical: reagent.is_critical || false
    });
    setIsEditMode(false);
  };

  // Calculate days until nearest expiry
  const getDaysUntilExpiry = () => {
    if (!reagent.nearest_expiry_date) return null;
    return differenceInDays(parseISO(reagent.nearest_expiry_date), new Date());
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64" dir="rtl">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <p className="ml-3 text-lg text-gray-600">טוען נתוני ריאגנט...</p>
      </div>
    );
  }

  if (!reagent) {
    return (
      <div className="text-center py-12" dir="rtl">
        <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <p className="text-red-600 text-lg">ריאגנט לא נמצא</p>
        <Button onClick={() => navigate(createPageUrl('ManageReagents'))} className="mt-4">
          חזור לרשימת ריאגנטים
        </Button>
      </div>
    );
  }

  const daysUntilExpiry = getDaysUntilExpiry();

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Beaker className="h-7 w-7 text-amber-600" />
              {isEditMode ? 'עריכת ריאגנט' : 'פרטי ריאגנט'}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              <span className="font-semibold">{reagent.name}</span>
              {' • '}
              <span>מק"ט: {reagent.catalog_number}</span>
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {!isEditMode ? (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditMode(true)}
                className="flex items-center gap-2"
              >
                <Edit3 className="h-4 w-4" />
                <span className="hidden sm:inline">עריכה</span>
              </Button>
              {activeBatches.length === 0 && (
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">מחיקה</span>
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                ביטול
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-2"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                שמירה
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Alert banners */}
      <div className="space-y-3 mb-6">
        {/* Expiry warning */}
        {daysUntilExpiry !== null && daysUntilExpiry <= 30 && (
          <div className={`p-4 rounded-lg border flex items-start gap-3 ${
            daysUntilExpiry <= 7 
              ? 'bg-red-50 border-red-300' 
              : 'bg-yellow-50 border-yellow-300'
          }`}>
            <Clock className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
              daysUntilExpiry <= 7 ? 'text-red-600' : 'text-yellow-600'
            }`} />
            <div>
              <p className={`font-semibold ${
                daysUntilExpiry <= 7 ? 'text-red-900' : 'text-yellow-900'
              }`}>
                תפוגה קרובה!
              </p>
              <p className={`text-sm ${
                daysUntilExpiry <= 7 ? 'text-red-700' : 'text-yellow-700'
              }`}>
                תאריך תפוגה קרוב ביותר: {format(parseISO(reagent.nearest_expiry_date), 'dd/MM/yyyy', { locale: he })}
                {' '}
                ({daysUntilExpiry} ימים)
              </p>
            </div>
          </div>
        )}

        {/* Low stock warning */}
        {reagent.current_stock_status === 'low_stock' && (
          <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg flex items-start gap-3">
            <TrendingDown className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-900">מלאי נמוך!</p>
              <p className="text-sm text-yellow-700">
                נותרו {reagent.total_quantity_all_batches || 0} יחידות
                {reagent.months_of_stock && (
                  <> ({reagent.months_of_stock.toFixed(1)} חודשי מלאי)</>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Out of stock warning */}
        {reagent.current_stock_status === 'out_of_stock' && (
          <div className="p-4 bg-red-50 border border-red-300 rounded-lg flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">אזל מהמלאי!</p>
              <p className="text-sm text-red-700">אין אצוות פעילות זמינות</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Content - Cards Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Right Column - Main Details (2/3 width on large screens) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Basic Information Card */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-gradient-to-l from-slate-50 to-white border-b border-slate-200">
              <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Beaker className="h-5 w-5 text-amber-600" />
                מידע בסיסי
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name - Read Only */}
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium text-slate-700">שם הריאגנט</Label>
                  <Input
                    value={reagent.name}
                    disabled
                    className="mt-1 bg-slate-50 font-semibold"
                  />
                </div>

                {/* Catalog Number - Read Only */}
                <div>
                  <Label className="text-sm font-medium text-slate-700">מק"ט</Label>
                  <Input
                    value={reagent.catalog_number}
                    disabled
                    className="mt-1 bg-slate-50"
                  />
                </div>

                {/* Category - Read Only */}
                <div>
                  <Label className="text-sm font-medium text-slate-700">קטגוריה</Label>
                  <Input
                    value={categoryLabels[reagent.category] || reagent.category}
                    disabled
                    className="mt-1 bg-slate-50"
                  />
                </div>

                {/* Supplier - Read Only with Link */}
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium text-slate-700">ספק נוכחי</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      value={reagent.supplier || 'לא צוין'}
                      disabled
                      className="bg-slate-50 flex-1"
                    />
                    {supplierData && (
                      <Link
                        to={createPageUrl(`ManageSuppliers?supplierId=${supplierData.id}`)}
                        className="text-amber-600 hover:text-amber-800"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </div>

                {/* Package Type - Read Only */}
                <div>
                  <Label className="text-sm font-medium text-slate-700">סוג אריזה</Label>
                  <Input
                    value={reagent.package_type === 'single_unit' ? 'יחידה בודדת' : reagent.package_type === 'package' ? 'חבילה' : 'אחר'}
                    disabled
                    className="mt-1 bg-slate-50"
                  />
                </div>

                {/* Requires Batches - Read Only */}
                <div>
                  <Label className="text-sm font-medium text-slate-700">דורש ניהול אצוות</Label>
                  <Input
                    value={reagent.requires_batches ? 'כן' : 'לא'}
                    disabled
                    className="mt-1 bg-slate-50"
                  />
                </div>

                {/* Custom Storage Location - Editable */}
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium text-slate-700">מיקום אחסון מותאם אישית</Label>
                  {!isEditMode ? (
                    <p className="mt-1 p-3 bg-slate-50 rounded-md text-sm text-slate-700">
                      {reagent.custom_storage_location || 'לא צוין'}
                    </p>
                  ) : (
                    <Input
                      value={formData.custom_storage_location}
                      onChange={(e) => setFormData(prev => ({ ...prev, custom_storage_location: e.target.value }))}
                      className="mt-1"
                      placeholder="למשל: מקרר A, מדף 3"
                    />
                  )}
                </div>

                {/* Custom Min/Max Stock - Editable */}
                <div>
                  <Label className="text-sm font-medium text-slate-700">מלאי מינימלי מותאם</Label>
                  {!isEditMode ? (
                    <p className="mt-1 p-3 bg-slate-50 rounded-md text-sm text-slate-700">
                      {reagent.custom_min_stock || 'לא הוגדר'}
                    </p>
                  ) : (
                    <Input
                      type="number"
                      value={formData.custom_min_stock}
                      onChange={(e) => setFormData(prev => ({ ...prev, custom_min_stock: e.target.value }))}
                      className="mt-1"
                      placeholder="0"
                    />
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-700">מלאי מקסימלי מותאם</Label>
                  {!isEditMode ? (
                    <p className="mt-1 p-3 bg-slate-50 rounded-md text-sm text-slate-700">
                      {reagent.custom_max_stock || 'לא הוגדר'}
                    </p>
                  ) : (
                    <Input
                      type="number"
                      value={formData.custom_max_stock}
                      onChange={(e) => setFormData(prev => ({ ...prev, custom_max_stock: e.target.value }))}
                      className="mt-1"
                      placeholder="0"
                    />
                  )}
                </div>

                {/* Is Critical - Editable Checkbox */}
                <div className="md:col-span-2">
                  {!isEditMode ? (
                    reagent.is_critical ? (
                      <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <span className="text-sm font-medium text-red-900">ריאגנט קריטי</span>
                      </div>
                    ) : null
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                      <Checkbox
                        id="is_critical"
                        checked={formData.is_critical}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_critical: checked }))}
                      />
                      <Label htmlFor="is_critical" className="text-sm font-medium text-slate-700 cursor-pointer">
                        סמן כריאגנט קריטי
                      </Label>
                    </div>
                  )}
                </div>

                {/* Notes - Editable */}
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium text-slate-700">הערות</Label>
                  {!isEditMode ? (
                    <p className="mt-1 p-3 bg-slate-50 rounded-md text-sm text-slate-700 whitespace-pre-wrap">
                      {reagent.notes || 'אין הערות'}
                    </p>
                  ) : (
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      className="mt-1"
                      rows={4}
                      placeholder="הזן הערות..."
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Summary Card */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-gradient-to-l from-slate-50 to-white border-b border-slate-200">
              <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Package className="h-5 w-5 text-amber-600" />
                סיכום מלאי
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs font-medium text-blue-700 mb-1">כמות כוללת</p>
                  <p className="text-2xl font-bold text-blue-900">{reagent.total_quantity_all_batches || 0}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs font-medium text-green-700 mb-1">אצוות פעילות</p>
                  <p className="text-2xl font-bold text-green-900">{reagent.active_batches_count || 0}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-xs font-medium text-purple-700 mb-1">חודשי מלאי</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {reagent.months_of_stock ? reagent.months_of_stock.toFixed(1) : '-'}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-xs font-medium text-slate-700 mb-1">סטטוס מלאי</p>
                  <Badge className={`${stockStatusColors[reagent.current_stock_status]} text-xs`}>
                    {stockStatusLabels[reagent.current_stock_status]}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Batches Card */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-gradient-to-l from-slate-50 to-white border-b border-slate-200">
              <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Package className="h-5 w-5 text-amber-600" />
                אצוות פעילות ({activeBatches.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {activeBatches.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  אין אצוות פעילות
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">מספר אצווה</th>
                        <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">תאריך תפוגה</th>
                        <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">כמות נוכחית</th>
                        <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">סטטוס</th>
                        <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">פעולות</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeBatches.map((batch, index) => (
                        <tr key={batch.id || index} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm font-medium text-slate-700">{batch.batch_number}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {batch.expiry_date ? format(parseISO(batch.expiry_date), 'dd/MM/yyyy', { locale: he }) : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-700">{batch.current_quantity}</td>
                          <td className="px-4 py-3">
                            <Badge className="text-xs bg-green-100 text-green-800">
                              {batch.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              to={createPageUrl(`EditReagentBatch?id=${batch.id}`)}
                              className="text-amber-600 hover:text-amber-800 text-sm flex items-center gap-1"
                            >
                              צפה <ExternalLink className="h-3 w-3" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Transactions Card */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-gradient-to-l from-slate-50 to-white border-b border-slate-200">
              <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Activity className="h-5 w-5 text-amber-600" />
                תנועות מלאי אחרונות ({recentTransactions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {recentTransactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  אין תנועות מלאי
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentTransactions.slice(0, 5).map((transaction, index) => (
                    <div key={transaction.id || index} className="p-4 hover:bg-slate-50 flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">
                          {transaction.transaction_type}
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          אצווה: {transaction.batch_number || '-'}
                        </p>
                        {transaction.notes && (
                          <p className="text-xs text-slate-500 mt-1">{transaction.notes}</p>
                        )}
                      </div>
                      <div className="text-left">
                        <p className={`text-sm font-semibold ${
                          transaction.quantity > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.quantity > 0 ? '+' : ''}{transaction.quantity}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {transaction.created_date ? format(parseISO(transaction.created_date), 'dd/MM/yy', { locale: he }) : '-'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Left Column - Related Information (1/3 width on large screens) */}
        <div className="space-y-6">
          
          {/* Supplier Card */}
          {supplierData && (
            <Card className="shadow-sm border-amber-200 bg-gradient-to-br from-white to-amber-50">
              <CardHeader className="pb-3 border-b border-amber-200">
                <CardTitle className="text-base font-semibold text-amber-900 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-amber-600" />
                  ספק
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2">
                <div>
                  <Label className="text-xs font-medium text-amber-700">שם הספק</Label>
                  <p className="text-sm font-semibold text-amber-900 mt-1">{supplierData.display_name || supplierData.name}</p>
                </div>
                {supplierData.phone && (
                  <div>
                    <Label className="text-xs font-medium text-amber-700">טלפון</Label>
                    <p className="text-sm text-amber-900 mt-1 dir-ltr text-right">{supplierData.phone}</p>
                  </div>
                )}
                {supplierData.email && (
                  <div>
                    <Label className="text-xs font-medium text-amber-700">אימייל</Label>
                    <p className="text-sm text-amber-900 mt-1">{supplierData.email}</p>
                  </div>
                )}
                <Link
                  to={createPageUrl(`ManageSuppliers?supplierId=${supplierData.id}`)}
                  className="inline-flex items-center gap-1 text-sm font-medium text-amber-700 hover:text-amber-900 hover:underline mt-2"
                >
                  פרטים מלאים <ExternalLink className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Related Orders Card */}
          {relatedOrders.length > 0 && (
            <Card className="shadow-sm border-blue-200 bg-gradient-to-br from-white to-blue-50">
              <CardHeader className="pb-3 border-b border-blue-200">
                <CardTitle className="text-base font-semibold text-blue-900 flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-blue-600" />
                  הזמנות קשורות ({relatedOrders.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 max-h-64 overflow-y-auto">
                {relatedOrders.slice(0, 5).map((order, index) => (
                  <div key={order.id || index} className="p-3 bg-white rounded-lg border border-blue-100">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <Link
                          to={createPageUrl(`EditOrder?id=${order.order_id}`)}
                          className="text-sm font-semibold text-blue-700 hover:text-blue-900 hover:underline flex items-center gap-1"
                        >
                          {order.order_number_temp}
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                        <p className="text-xs text-blue-600 mt-1">
                          {order.order_date ? format(parseISO(order.order_date), 'dd/MM/yyyy', { locale: he }) : '-'}
                        </p>
                      </div>
                      <Badge className="text-xs bg-blue-100 text-blue-800">
                        {order.order_status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-blue-600">
                      <span>הוזמן: {order.quantity_ordered}</span>
                      <span>התקבל: {order.quantity_received || 0}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Metadata Card */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-gradient-to-l from-slate-50 to-white border-b border-slate-200 pb-3">
              <CardTitle className="text-base font-semibold text-slate-800">מטא נתונים</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2 text-sm">
              <div>
                <Label className="text-xs font-medium text-slate-600">נוצר בתאריך</Label>
                <p className="text-slate-700 mt-1">
                  {reagent.created_date ? format(parseISO(reagent.created_date), 'dd/MM/yyyy HH:mm', { locale: he }) : '-'}
                </p>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600">נוצר על ידי</Label>
                <p className="text-slate-700 mt-1">{reagent.created_by || '-'}</p>
              </div>
              {reagent.updated_date && (
                <div>
                  <Label className="text-xs font-medium text-slate-600">עודכן לאחרונה</Label>
                  <p className="text-slate-700 mt-1">
                    {format(parseISO(reagent.updated_date), 'dd/MM/yyyy HH:mm', { locale: he })}
                  </p>
                </div>
              )}
              {reagent.last_count_date && (
                <div>
                  <Label className="text-xs font-medium text-slate-600">ספירה אחרונה</Label>
                  <p className="text-slate-700 mt-1">
                    {format(parseISO(reagent.last_count_date), 'dd/MM/yyyy', { locale: he })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              אישור מחיקה
            </DialogTitle>
            <DialogDescription className="text-right">
              האם אתה בטוח שברצונך למחוק ריאגנט זה?
              <br />
              <span className="font-semibold text-red-600">לא ניתן למחוק ריאגנט שיש לו אצוות פעילות!</span>
              <br />
              <br />
              <span className="text-slate-600">שם הריאגנט: {reagent.name}</span>
              <br />
              <span className="text-slate-600">מק"ט: {reagent.catalog_number}</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              ביטול
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              אישור מחיקה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}