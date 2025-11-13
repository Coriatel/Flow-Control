import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Save,
  X,
  Edit3,
  Trash2,
  Loader2,
  AlertTriangle,
  Package,
  FileText,
  TrendingDown,
  ExternalLink
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import BackButton from '@/components/ui/BackButton';

const statusLabels = {
  open: 'פתוח',
  processing: 'בעיבוד',
  processed: 'עובד',
  closed: 'סגור'
};

const statusColors = {
  open: 'bg-blue-100 text-blue-800 border-blue-300',
  processing: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  processed: 'bg-green-100 text-green-800 border-green-300',
  closed: 'bg-gray-100 text-gray-800 border-gray-300'
};

const deliveryTypeLabels = {
  with_order: 'עם הזמנה',
  no_charge: 'ללא תמורה',
  replacement: 'החלפה',
  other: 'אחר'
};

const completionTypeLabels = {
  full: 'מלאה',
  partial: 'חלקית'
};

export default function EditDeliveryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const deliveryId = searchParams.get('id');

  // States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Data states
  const [delivery, setDelivery] = useState(null);
  const [deliveryItems, setDeliveryItems] = useState([]);
  const [linkedOrder, setLinkedOrder] = useState(null);
  const [linkedWithdrawals, setLinkedWithdrawals] = useState([]);

  // Form states (for edit mode)
  const [formData, setFormData] = useState({
    notes: '',
    completion_notes: '',
    delivery_reason_text: '',
    status: ''
  });

  // Dialog states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusChangeDialog, setShowStatusChangeDialog] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState(null);

  // Load delivery data
  useEffect(() => {
    if (!deliveryId) {
      toast.error('שגיאה', { description: 'מזהה משלוח חסר' });
      navigate(createPageUrl('Deliveries'));
      return;
    }
    fetchDeliveryData();
  }, [deliveryId, navigate]);

  const fetchDeliveryData = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('getEditDeliveryData', {
        delivery_id: deliveryId
      });

      if (response.data.success) {
        const { delivery, deliveryItems, linkedOrder, linkedWithdrawals } = response.data.data;
        
        setDelivery(delivery);
        setDeliveryItems(deliveryItems || []);
        setLinkedOrder(linkedOrder);
        setLinkedWithdrawals(linkedWithdrawals || []); // ✅ תיקון: וידוא שזה מערך

        // Initialize form data
        setFormData({
          notes: delivery.notes || '',
          completion_notes: delivery.completion_notes || '',
          delivery_reason_text: delivery.delivery_reason_text || '',
          status: delivery.status || 'open'
        });
      } else {
        throw new Error(response.data.error || 'Failed to load delivery data');
      }
    } catch (error) {
      console.error('Error loading delivery:', error);
      toast.error('שגיאה בטעינת נתוני משלוח', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Check if status changed and needs confirmation
    if (formData.status !== delivery.status) {
      // Critical status changes require confirmation
      if (formData.status === 'processed' || formData.status === 'closed') {
        setPendingStatusChange(formData.status);
        setShowStatusChangeDialog(true);
        return;
      }
    }

    await performSave();
  };

  const performSave = async () => {
    setSaving(true);
    try {
      const updateData = {
        notes: formData.notes,
        completion_notes: formData.completion_notes,
        delivery_reason_text: formData.delivery_reason_text,
        status: formData.status
      };

      await base44.entities.Delivery.update(deliveryId, updateData);

      toast.success('המשלוח עודכן בהצלחה');
      setIsEditMode(false);
      await fetchDeliveryData(); // Reload to get fresh data
    } catch (error) {
      console.error('Error saving delivery:', error);
      toast.error('שגיאה בשמירת המשלוח', {
        description: error.message
      });
    } finally {
      setSaving(false);
      setShowStatusChangeDialog(false);
      setPendingStatusChange(null);
    }
  };

  const handleDelete = async () => {
    try {
      await base44.entities.Delivery.delete(deliveryId);
      toast.success('המשלוח נמחק בהצלחה');
      navigate(createPageUrl('Deliveries'));
    } catch (error) {
      console.error('Error deleting delivery:', error);
      toast.error('שגיאה במחיקת המשלוח', {
        description: error.message
      });
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      notes: delivery.notes || '',
      completion_notes: delivery.completion_notes || '',
      delivery_reason_text: delivery.delivery_reason_text || '',
      status: delivery.status || 'open'
    });
    setIsEditMode(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64" dir="rtl">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <p className="ml-3 text-lg text-gray-600">טוען נתוני משלוח...</p>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="text-center py-12" dir="rtl">
        <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <p className="text-red-600 text-lg">משלוח לא נמצא</p>
        <Button onClick={() => navigate(createPageUrl('Deliveries'))} className="mt-4">
          חזור לרשימת משלוחים
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="h-7 w-7 text-amber-600" />
              {isEditMode ? 'עריכת משלוח' : 'פרטי משלוח'}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              תעודת משלוח: <span className="font-semibold">{delivery.delivery_number}</span>
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
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">מחיקה</span>
              </Button>
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

      {/* Main Content - Cards Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Right Column - Main Details (2/3 width on large screens) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Basic Information Card */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-gradient-to-l from-slate-50 to-white border-b border-slate-200">
              <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <FileText className="h-5 w-5 text-amber-600" />
                מידע כללי
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Delivery Number - Read Only */}
                <div>
                  <Label className="text-sm font-medium text-slate-700">מספר תעודת משלוח</Label>
                  <Input
                    value={delivery.delivery_number}
                    disabled
                    className="mt-1 bg-slate-50"
                  />
                </div>

                {/* Supplier - Read Only */}
                <div>
                  <Label className="text-sm font-medium text-slate-700">ספק</Label>
                  <Input
                    value={delivery.supplier || ''}
                    disabled
                    className="mt-1 bg-slate-50"
                  />
                </div>

                {/* Delivery Date - Read Only */}
                <div>
                  <Label className="text-sm font-medium text-slate-700">תאריך קבלה</Label>
                  <Input
                    value={delivery.delivery_date ? format(parseISO(delivery.delivery_date), 'dd/MM/yyyy', { locale: he }) : ''}
                    disabled
                    className="mt-1 bg-slate-50"
                  />
                </div>

                {/* Delivery Type - Read Only */}
                <div>
                  <Label className="text-sm font-medium text-slate-700">סוג משלוח</Label>
                  <Input
                    value={deliveryTypeLabels[delivery.delivery_type] || delivery.delivery_type || ''}
                    disabled
                    className="mt-1 bg-slate-50"
                  />
                </div>

                {/* Status - Editable with Warning */}
                <div>
                  <Label className="text-sm font-medium text-slate-700">סטטוס</Label>
                  {!isEditMode ? (
                    <div className="mt-1">
                      <Badge className={`${statusColors[delivery.status]} px-3 py-1 text-sm`}>
                        {statusLabels[delivery.status]}
                      </Badge>
                    </div>
                  ) : (
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {isEditMode && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      שינוי ל-"עובד" או "סגור" ישנה את זמינות המשלוח
                    </p>
                  )}
                </div>

                {/* ✅ תוספת: Completion Type - Read Only */}
                <div>
                  <Label className="text-sm font-medium text-slate-700">סוג השלמה</Label>
                  <Input
                    value={completionTypeLabels[delivery.completion_type] || delivery.completion_type || 'לא צוין'}
                    disabled
                    className="mt-1 bg-slate-50"
                  />
                </div>

                {/* Total Items Received - Read Only */}
                <div>
                  <Label className="text-sm font-medium text-slate-700">סה"כ פריטים שהתקבלו</Label>
                  <Input
                    value={delivery.total_items_received || 0}
                    disabled
                    className="mt-1 bg-slate-50"
                  />
                </div>
              </div>

              {/* Delivery Reason Text - Editable */}
              {delivery.delivery_type !== 'with_order' && (
                <div>
                  <Label className="text-sm font-medium text-slate-700">סיבת המשלוח</Label>
                  {!isEditMode ? (
                    <p className="mt-1 p-3 bg-slate-50 rounded-md text-sm text-slate-700">
                      {delivery.delivery_reason_text || 'לא צוין'}
                    </p>
                  ) : (
                    <Textarea
                      value={formData.delivery_reason_text}
                      onChange={(e) => setFormData(prev => ({ ...prev, delivery_reason_text: e.target.value }))}
                      className="mt-1"
                      rows={2}
                      placeholder="הזן סיבת משלוח..."
                    />
                  )}
                </div>
              )}

              {/* Notes - Editable */}
              <div>
                <Label className="text-sm font-medium text-slate-700">הערות</Label>
                {!isEditMode ? (
                  <p className="mt-1 p-3 bg-slate-50 rounded-md text-sm text-slate-700">
                    {delivery.notes || 'אין הערות'}
                  </p>
                ) : (
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="mt-1"
                    rows={3}
                    placeholder="הזן הערות..."
                  />
                )}
              </div>

              {/* Completion Notes - Editable */}
              <div>
                <Label className="text-sm font-medium text-slate-700">הערות השלמה</Label>
                {!isEditMode ? (
                  <p className="mt-1 p-3 bg-slate-50 rounded-md text-sm text-slate-700">
                    {delivery.completion_notes || 'אין הערות השלמה'}
                  </p>
                ) : (
                  <Textarea
                    value={formData.completion_notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, completion_notes: e.target.value }))}
                    className="mt-1"
                    rows={2}
                    placeholder="הזן הערות השלמה..."
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Delivery Items Card */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-gradient-to-l from-slate-50 to-white border-b border-slate-200">
              <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Package className="h-5 w-5 text-amber-600" />
                פריטי המשלוח ({deliveryItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {deliveryItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  אין פריטים במשלוח זה
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">שם ריאגנט</th>
                        <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">מק"ט</th>
                        <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">מספר אצווה</th>
                        <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">תאריך תפוגה</th>
                        <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">כמות שהתקבלה</th>
                        <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">סטטוס</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deliveryItems.map((item, index) => (
                        <tr key={item.id || index} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm text-slate-700">{item.reagent_current_name || item.reagent_name_snapshot}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{item.reagent_catalog_number || '-'}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{item.batch_number}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {item.expiry_date ? format(parseISO(item.expiry_date), 'dd/MM/yyyy', { locale: he }) : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-700">{item.quantity_received}</td>
                          <td className="px-4 py-3 text-xs">
                            {/* ✅ תוספת: הצגת is_replacement */}
                            {item.is_replacement && (
                              <Badge className="bg-purple-100 text-purple-800 text-xs">החלפה</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Left Column - Related Information (1/3 width on large screens) */}
        <div className="space-y-6">
          
          {/* Linked Order Card */}
          {linkedOrder && (
            <Card className="shadow-sm border-amber-200 bg-gradient-to-br from-white to-amber-50">
              <CardHeader className="pb-3 border-b border-amber-200">
                <CardTitle className="text-base font-semibold text-amber-900 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-amber-600" />
                  הזמנה מקושרת
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2">
                <div>
                  <Label className="text-xs font-medium text-amber-700">מספר הזמנה זמני</Label>
                  <Link
                    to={createPageUrl(`EditOrder?id=${linkedOrder.id}`)}
                    className="text-sm font-semibold text-amber-700 hover:text-amber-900 hover:underline flex items-center gap-1 mt-1"
                  >
                    {linkedOrder.order_number_temp}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
                {/* ✅ תוספת: מספר הזמנה קבוע */}
                {linkedOrder.order_number_permanent && (
                  <div>
                    <Label className="text-xs font-medium text-amber-700">מספר הזמנה קבוע</Label>
                    <p className="text-sm text-amber-900 mt-1">{linkedOrder.order_number_permanent}</p>
                  </div>
                )}
                {/* ✅ תוספת: מספר דרישת רכש SAP */}
                {linkedOrder.purchase_order_number_sap && (
                  <div>
                    <Label className="text-xs font-medium text-amber-700">מס' דרישת רכש SAP</Label>
                    <p className="text-sm text-amber-900 mt-1">{linkedOrder.purchase_order_number_sap}</p>
                  </div>
                )}
                <div>
                  <Label className="text-xs font-medium text-amber-700">תאריך הזמנה</Label>
                  <p className="text-sm text-amber-900 mt-1">
                    {linkedOrder.order_date ? format(parseISO(linkedOrder.order_date), 'dd/MM/yyyy', { locale: he }) : '-'}
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-amber-700">סטטוס</Label>
                  <Badge className="mt-1 text-xs bg-amber-100 text-amber-800 border-amber-300">
                    {linkedOrder.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Linked Withdrawals Card */}
          {/* ✅ תיקון: בדיקה נכונה של מערך */}
          {linkedWithdrawals && linkedWithdrawals.length > 0 && (
            <Card className="shadow-sm border-purple-200 bg-gradient-to-br from-white to-purple-50">
              <CardHeader className="pb-3 border-b border-purple-200">
                <CardTitle className="text-base font-semibold text-purple-900 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-purple-600" />
                  בקשות משיכה מקושרות ({linkedWithdrawals.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {linkedWithdrawals.map((withdrawal) => (
                  <div key={withdrawal.id} className="p-3 bg-white rounded-lg border border-purple-200">
                    <Link
                      to={createPageUrl(`EditWithdrawalRequest?id=${withdrawal.id}`)}
                      className="text-sm font-semibold text-purple-700 hover:text-purple-900 hover:underline flex items-center gap-1"
                    >
                      {withdrawal.withdrawal_number}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                    <p className="text-xs text-purple-600 mt-1">
                      תאריך: {withdrawal.request_date ? format(parseISO(withdrawal.request_date), 'dd/MM/yyyy', { locale: he }) : '-'}
                    </p>
                    <Badge className="mt-1 text-xs bg-purple-100 text-purple-800 border-purple-300">
                      {withdrawal.status}
                    </Badge>
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
                  {delivery.created_date ? format(parseISO(delivery.created_date), 'dd/MM/yyyy HH:mm', { locale: he }) : '-'}
                </p>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600">נוצר על ידי</Label>
                <p className="text-slate-700 mt-1">{delivery.created_by || '-'}</p>
              </div>
              {delivery.updated_date && (
                <div>
                  <Label className="text-xs font-medium text-slate-600">עודכן לאחרונה</Label>
                  <p className="text-slate-700 mt-1">
                    {format(parseISO(delivery.updated_date), 'dd/MM/yyyy HH:mm', { locale: he })}
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
              האם אתה בטוח שברצונך למחוק משלוח זה?
              <br />
              <span className="font-semibold">פעולה זו אינה ניתנת לביטול!</span>
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

      {/* Status Change Warning Dialog */}
      <Dialog open={showStatusChangeDialog} onOpenChange={setShowStatusChangeDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              אזהרה: שינוי סטטוס
            </DialogTitle>
            <DialogDescription className="text-right space-y-2">
              <p>
                אתה עומד לשנות את סטטוס המשלוח ל-
                <span className="font-semibold"> {statusLabels[pendingStatusChange]}</span>.
              </p>
              {pendingStatusChange === 'processed' && (
                <p className="text-amber-700 font-medium">
                  שינוי זה ישפיע על זמינות המשלוח ויסמן אותו כמעובד.
                </p>
              )}
              {pendingStatusChange === 'closed' && (
                <p className="text-amber-700 font-medium">
                  שינוי זה יסגור את המשלוח ולא ניתן יהיה לבצע בו שינויים נוספים.
                </p>
              )}
              <p className="font-semibold">האם אתה בטוח?</p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              setShowStatusChangeDialog(false);
              setPendingStatusChange(null);
            }}>
              ביטול
            </Button>
            <Button
              onClick={performSave}
              disabled={saving}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
              אישור שינוי
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}