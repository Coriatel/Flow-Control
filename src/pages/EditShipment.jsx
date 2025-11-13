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
  Package,
  Truck,
  FileText,
  Snowflake,
  ExternalLink,
  CheckCircle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import BackButton from '@/components/ui/BackButton';

const statusLabels = {
  draft: 'טיוטה',
  prepared: 'מוכן לשליחה',
  sent: 'נשלח',
  delivered: 'הגיע ליעד',
  confirmed: 'אושר הגעה',
  cancelled: 'בוטל'
};

const statusColors = {
  draft: 'bg-gray-100 text-gray-800 border-gray-300',
  prepared: 'bg-blue-100 text-blue-800 border-blue-300',
  sent: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  delivered: 'bg-green-100 text-green-800 border-green-300',
  confirmed: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300'
};

const shipmentTypeLabels = {
  standard_outbound: 'שליחה רגילה',
  return_to_supplier: 'החזרה לספק',
  replacement_out: 'החלפה יוצאת',
  transfer_out: 'העברה חיצונית'
};

const recipientTypeLabels = {
  internal: 'גוף פנימי',
  external: 'גוף חיצוני',
  supplier: 'ספק',
  other: 'אחר'
};

export default function EditShipmentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const shipmentId = searchParams.get('id');

  // States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Data states
  const [shipment, setShipment] = useState(null);
  const [shipmentItems, setShipmentItems] = useState([]);
  const [linkedDelivery, setLinkedDelivery] = useState(null);
  const [linkedOrder, setLinkedOrder] = useState(null);

  // Form states (for edit mode)
  const [formData, setFormData] = useState({
    notes: '',
    special_instructions: '',
    confirmation_notes: '',
    status: '',
    confirmation_received: false
  });

  // Dialog states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusChangeDialog, setShowStatusChangeDialog] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState(null);

  // Load shipment data
  useEffect(() => {
    if (!shipmentId) {
      toast.error('שגיאה', { description: 'מזהה משלוח חסר' });
      navigate(createPageUrl('OutgoingShipments'));
      return;
    }
    fetchShipmentData();
  }, [shipmentId, navigate]);

  const fetchShipmentData = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('getEditShipmentData', {
        shipment_id: shipmentId
      });

      if (response.data.success) {
        const { shipment, shipmentItems, linkedDelivery, linkedOrder } = response.data.data;
        
        setShipment(shipment);
        setShipmentItems(shipmentItems || []);
        setLinkedDelivery(linkedDelivery);
        setLinkedOrder(linkedOrder);

        // Initialize form data
        setFormData({
          notes: shipment.notes || '',
          special_instructions: shipment.special_instructions || '',
          confirmation_notes: shipment.confirmation_notes || '',
          status: shipment.status || 'draft',
          confirmation_received: shipment.confirmation_received || false
        });
      } else {
        throw new Error(response.data.error || 'Failed to load shipment data');
      }
    } catch (error) {
      console.error('Error loading shipment:', error);
      toast.error('שגיאה בטעינת נתוני משלוח', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Check if status changed and needs confirmation
    if (formData.status !== shipment.status) {
      // Critical status changes require confirmation
      if (['sent', 'delivered', 'confirmed'].includes(formData.status)) {
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
        special_instructions: formData.special_instructions,
        confirmation_notes: formData.confirmation_notes,
        status: formData.status,
        confirmation_received: formData.confirmation_received
      };

      // If marking as confirmed, add confirmation date
      if (formData.confirmation_received && !shipment.confirmation_received) {
        updateData.confirmation_date = new Date().toISOString();
      }

      await base44.entities.Shipment.update(shipmentId, updateData);

      toast.success('המשלוח עודכן בהצלחה');
      setIsEditMode(false);
      await fetchShipmentData(); // Reload to get fresh data
    } catch (error) {
      console.error('Error saving shipment:', error);
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
      const response = await base44.functions.invoke('deleteShipment', {
        shipmentId: shipmentId,
        deleteReason: 'נמחק על ידי המשתמש במסך עריכה'
      });

      if (response.data.success) {
        toast.success('המשלוח נמחק בהצלחה');
        navigate(createPageUrl('OutgoingShipments'));
      } else {
        throw new Error(response.data.error || 'Failed to delete shipment');
      }
    } catch (error) {
      console.error('Error deleting shipment:', error);
      toast.error('שגיאה במחיקת המשלוח', {
        description: error.message
      });
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      notes: shipment.notes || '',
      special_instructions: shipment.special_instructions || '',
      confirmation_notes: shipment.confirmation_notes || '',
      status: shipment.status || 'draft',
      confirmation_received: shipment.confirmation_received || false
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

  if (!shipment) {
    return (
      <div className="text-center py-12" dir="rtl">
        <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <p className="text-red-600 text-lg">משלוח לא נמצא</p>
        <Button onClick={() => navigate(createPageUrl('OutgoingShipments'))} className="mt-4">
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
              <Truck className="h-7 w-7 text-amber-600" />
              {isEditMode ? 'עריכת משלוח יוצא' : 'פרטי משלוח יוצא'}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              תעודת משלוח: <span className="font-semibold">{shipment.shipment_number || `משלוח ${shipment.id.slice(-6)}`}</span>
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
              {['draft', 'prepared'].includes(shipment.status) && (
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
                {/* Shipment Number - Read Only */}
                <div>
                  <Label className="text-sm font-medium text-slate-700">מספר תעודת משלוח</Label>
                  <Input
                    value={shipment.shipment_number || `משלוח ${shipment.id.slice(-6)}`}
                    disabled
                    className="mt-1 bg-slate-50"
                  />
                </div>

                {/* Shipment Type - Read Only */}
                <div>
                  <Label className="text-sm font-medium text-slate-700">סוג משלוח</Label>
                  <Input
                    value={shipmentTypeLabels[shipment.shipment_type] || shipment.shipment_type || ''}
                    disabled
                    className="mt-1 bg-slate-50"
                  />
                </div>

                {/* Recipient Name - Read Only */}
                <div>
                  <Label className="text-sm font-medium text-slate-700">שם נמען</Label>
                  <Input
                    value={shipment.recipient_name || ''}
                    disabled
                    className="mt-1 bg-slate-50"
                  />
                </div>

                {/* Recipient Type - Read Only */}
                <div>
                  <Label className="text-sm font-medium text-slate-700">סוג נמען</Label>
                  <Input
                    value={recipientTypeLabels[shipment.recipient_type] || shipment.recipient_type || ''}
                    disabled
                    className="mt-1 bg-slate-50"
                  />
                </div>

                {/* Shipment Date - Read Only */}
                <div>
                  <Label className="text-sm font-medium text-slate-700">תאריך שליחה</Label>
                  <Input
                    value={shipment.shipment_date ? format(parseISO(shipment.shipment_date), 'dd/MM/yyyy', { locale: he }) : ''}
                    disabled
                    className="mt-1 bg-slate-50"
                  />
                </div>

                {/* Contact Person - Read Only */}
                <div>
                  <Label className="text-sm font-medium text-slate-700">איש קשר</Label>
                  <Input
                    value={shipment.contact_person || 'לא צוין'}
                    disabled
                    className="mt-1 bg-slate-50"
                  />
                </div>

                {/* Status - Editable with Warning */}
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium text-slate-700">סטטוס</Label>
                  {!isEditMode ? (
                    <div className="mt-1">
                      <Badge className={`${statusColors[shipment.status]} px-3 py-1 text-sm`}>
                        {statusLabels[shipment.status]}
                      </Badge>
                    </div>
                  ) : (
                    <>
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
                      <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        שינוי סטטוס ל-"נשלח" או "הגיע ליעד" ישפיע על מעקב המשלוח
                      </p>
                    </>
                  )}
                </div>

                {/* Total Items Sent - Read Only */}
                <div>
                  <Label className="text-sm font-medium text-slate-700">סה"כ פריטים נשלחו</Label>
                  <Input
                    value={shipment.total_items_sent || 0}
                    disabled
                    className="mt-1 bg-slate-50"
                  />
                </div>

                {/* Requires Cold Storage - Read Only */}
                {shipment.requires_cold_storage && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Snowflake className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">דורש שמירה בקור</span>
                  </div>
                )}

                {/* Confirmation Received - Editable Checkbox */}
                {isEditMode && (
                  <div className="md:col-span-2 flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                    <Checkbox
                      id="confirmation"
                      checked={formData.confirmation_received}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, confirmation_received: checked }))}
                    />
                    <Label htmlFor="confirmation" className="text-sm font-medium text-green-900 cursor-pointer">
                      אישור קבלה מהנמען
                    </Label>
                  </div>
                )}
                
                {!isEditMode && shipment.confirmation_received && (
                  <div className="md:col-span-2 flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <span className="text-sm font-medium text-green-900">אושר קבלה בתאריך: </span>
                      <span className="text-sm text-green-700">
                        {shipment.confirmation_date ? format(parseISO(shipment.confirmation_date), 'dd/MM/yyyy HH:mm', { locale: he }) : '-'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Special Instructions - Editable */}
              <div>
                <Label className="text-sm font-medium text-slate-700">הוראות מיוחדות</Label>
                {!isEditMode ? (
                  <p className="mt-1 p-3 bg-slate-50 rounded-md text-sm text-slate-700">
                    {shipment.special_instructions || 'אין הוראות מיוחדות'}
                  </p>
                ) : (
                  <Textarea
                    value={formData.special_instructions}
                    onChange={(e) => setFormData(prev => ({ ...prev, special_instructions: e.target.value }))}
                    className="mt-1"
                    rows={2}
                    placeholder="הזן הוראות מיוחדות..."
                  />
                )}
              </div>

              {/* Notes - Editable */}
              <div>
                <Label className="text-sm font-medium text-slate-700">הערות</Label>
                {!isEditMode ? (
                  <p className="mt-1 p-3 bg-slate-50 rounded-md text-sm text-slate-700">
                    {shipment.notes || 'אין הערות'}
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

              {/* Confirmation Notes - Editable */}
              <div>
                <Label className="text-sm font-medium text-slate-700">הערות אישור</Label>
                {!isEditMode ? (
                  <p className="mt-1 p-3 bg-slate-50 rounded-md text-sm text-slate-700">
                    {shipment.confirmation_notes || 'אין הערות אישור'}
                  </p>
                ) : (
                  <Textarea
                    value={formData.confirmation_notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmation_notes: e.target.value }))}
                    className="mt-1"
                    rows={2}
                    placeholder="הזן הערות אישור..."
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Shipment Items Card */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-gradient-to-l from-slate-50 to-white border-b border-slate-200">
              <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Package className="h-5 w-5 text-amber-600" />
                פריטי המשלוח ({shipmentItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {shipmentItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  אין פריטים במשלוח זה
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">שם ריאגנט</th>
                        <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">מספר אצווה</th>
                        <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">תאריך תפוגה</th>
                        <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">כמות נשלחה</th>
                        <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">אחסון</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shipmentItems.map((item, index) => (
                        <tr key={item.id || index} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm text-slate-700">{item.reagent_current_name || item.reagent_name_snapshot}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{item.batch_number}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {item.expiry_date ? format(parseISO(item.expiry_date), 'dd/MM/yyyy', { locale: he }) : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-700">{item.quantity_sent}</td>
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {item.storage_requirements || '-'}
                            {(item.storage_requirements?.includes('cold') || item.storage_requirements?.includes('קור')) && (
                              <Snowflake className="h-3 w-3 inline ml-1 text-blue-500" />
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
          
          {/* Linked Delivery Card */}
          {linkedDelivery && (
            <Card className="shadow-sm border-green-200 bg-gradient-to-br from-white to-green-50">
              <CardHeader className="pb-3 border-b border-green-200">
                <CardTitle className="text-base font-semibold text-green-900 flex items-center gap-2">
                  <Package className="h-4 w-4 text-green-600" />
                  משלוח נכנס מקושר
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2">
                <div>
                  <Label className="text-xs font-medium text-green-700">מספר תעודת משלוח</Label>
                  <Link
                    to={createPageUrl(`EditDelivery?id=${linkedDelivery.id}`)}
                    className="text-sm font-semibold text-green-700 hover:text-green-900 hover:underline flex items-center gap-1 mt-1"
                  >
                    {linkedDelivery.delivery_number}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
                <div>
                  <Label className="text-xs font-medium text-green-700">תאריך קבלה</Label>
                  <p className="text-sm text-green-900 mt-1">
                    {linkedDelivery.delivery_date ? format(parseISO(linkedDelivery.delivery_date), 'dd/MM/yyyy', { locale: he }) : '-'}
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-green-700">ספק</Label>
                  <p className="text-sm text-green-900 mt-1">{linkedDelivery.supplier || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-green-700">סטטוס</Label>
                  <Badge className="mt-1 text-xs bg-green-100 text-green-800 border-green-300">
                    {linkedDelivery.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

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
                {linkedOrder.order_number_permanent && (
                  <div>
                    <Label className="text-xs font-medium text-amber-700">מספר הזמנה קבוע</Label>
                    <p className="text-sm text-amber-900 mt-1">{linkedOrder.order_number_permanent}</p>
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

          {/* Metadata Card */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-gradient-to-l from-slate-50 to-white border-b border-slate-200 pb-3">
              <CardTitle className="text-base font-semibold text-slate-800">מטא נתונים</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2 text-sm">
              <div>
                <Label className="text-xs font-medium text-slate-600">נוצר בתאריך</Label>
                <p className="text-slate-700 mt-1">
                  {shipment.created_date ? format(parseISO(shipment.created_date), 'dd/MM/yyyy HH:mm', { locale: he }) : '-'}
                </p>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600">נוצר על ידי</Label>
                <p className="text-slate-700 mt-1">{shipment.created_by || '-'}</p>
              </div>
              {shipment.updated_date && (
                <div>
                  <Label className="text-xs font-medium text-slate-600">עודכן לאחרונה</Label>
                  <p className="text-slate-700 mt-1">
                    {format(parseISO(shipment.updated_date), 'dd/MM/yyyy HH:mm', { locale: he })}
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
              <span className="font-semibold">ניתן למחוק רק משלוחים בסטטוס טיוטה או מוכן לשליחה.</span>
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
              {pendingStatusChange === 'sent' && (
                <p className="text-amber-700 font-medium">
                  שינוי זה יסמן את המשלוח כנשלח ויתחיל מעקב משלוח.
                </p>
              )}
              {pendingStatusChange === 'delivered' && (
                <p className="text-amber-700 font-medium">
                  שינוי זה יסמן את המשלוח כהגיע ליעד.
                </p>
              )}
              {pendingStatusChange === 'confirmed' && (
                <p className="text-amber-700 font-medium">
                  שינוי זה יסמן את המשלוח כמאושר קבלה על ידי הנמען.
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