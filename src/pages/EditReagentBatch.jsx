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
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import {
  Save,
  X,
  Edit3,
  Eye,
  Loader2,
  AlertTriangle,
  Package,
  Beaker,
  FileText,
  Activity,
  Upload,
  Download,
  ExternalLink,
  Calendar,
  MapPin,
  Thermometer,
  ShieldCheck
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { he } from 'date-fns/locale';
import BackButton from '@/components/ui/BackButton';
import COAManager from '@/components/quality-assurance/COAManager';

const statusLabels = {
  incoming: 'נכנס',
  quarantine: 'הסגר',
  qc_pending: 'ממתין לבקרה',
  active: 'פעיל',
  expired: 'פג תוקף',
  consumed: 'נצרך',
  recalled: 'נקרא חזרה',
  returned: 'הוחזר',
  disposed: 'הושמד',
  used_up: 'נוצל'
};

const statusColors = {
  incoming: 'bg-blue-100 text-blue-800 border-blue-300',
  quarantine: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  qc_pending: 'bg-orange-100 text-orange-800 border-orange-300',
  active: 'bg-green-100 text-green-800 border-green-300',
  expired: 'bg-red-100 text-red-800 border-red-300',
  consumed: 'bg-gray-100 text-gray-800 border-gray-300',
  recalled: 'bg-purple-100 text-purple-800 border-purple-300',
  returned: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  disposed: 'bg-red-100 text-red-800 border-red-300',
  used_up: 'bg-slate-100 text-slate-800 border-slate-300'
};

const qcStatusLabels = {
  not_required: 'לא נדרש',
  pending: 'ממתין',
  in_progress: 'בביצוע',
  passed: 'עבר',
  failed: 'נכשל',
  inconclusive: 'לא חד משמעי'
};

const qcStatusColors = {
  not_required: 'bg-gray-100 text-gray-600',
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  passed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  inconclusive: 'bg-orange-100 text-orange-800'
};

export default function EditReagentBatchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const batchId = searchParams.get('id');

  // States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Data states
  const [batch, setBatch] = useState(null);
  const [reagentData, setReagentData] = useState(null);
  const [relatedTransactions, setRelatedTransactions] = useState([]);
  const [deliveryItems, setDeliveryItems] = useState([]);
  const [shipmentItems, setShipmentItems] = useState([]);
  const [linkedDelivery, setLinkedDelivery] = useState(null);

  // Form states (for edit mode)
  const [formData, setFormData] = useState({
    storage_location: '',
    storage_conditions: '',
    notes: '',
    qc_status: '',
    qc_notes: '',
    expiry_date: '',
    received_by: '',
    delivery_reference: '',
    order_reference: ''
  });

  // Dialog states
  const [showExpiryChangeDialog, setShowExpiryChangeDialog] = useState(false);
  const [pendingExpiryDate, setPendingExpiryDate] = useState(null);

  // Load batch data
  useEffect(() => {
    if (!batchId) {
      toast.error('שגיאה', { description: 'מזהה אצווה חסר' });
      navigate(createPageUrl('ManageReagents'));
      return;
    }
    fetchBatchData();
  }, [batchId, navigate]);

  const fetchBatchData = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('getEditReagentBatchData', {
        batch_id: batchId
      });

      if (response.data.success) {
        const { batch, reagentData, relatedTransactions, deliveryItems, shipmentItems, linkedDelivery } = response.data.data;
        
        setBatch(batch);
        setReagentData(reagentData);
        setRelatedTransactions(relatedTransactions || []);
        setDeliveryItems(deliveryItems || []);
        setShipmentItems(shipmentItems || []);
        setLinkedDelivery(linkedDelivery);

        // Initialize form data
        setFormData({
          storage_location: batch.storage_location || '',
          storage_conditions: batch.storage_conditions || '',
          notes: batch.notes || '',
          qc_status: batch.qc_status || 'not_required',
          qc_notes: batch.qc_notes || '',
          expiry_date: batch.expiry_date || '',
          received_by: batch.received_by || '',
          delivery_reference: batch.delivery_reference || '',
          order_reference: batch.order_reference || ''
        });
      } else {
        throw new Error(response.data.error || 'Failed to load batch data');
      }
    } catch (error) {
      console.error('Error loading batch:', error);
      toast.error('שגיאה בטעינת נתוני אצווה', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Check if expiry date changed
    if (formData.expiry_date !== batch.expiry_date) {
      setPendingExpiryDate(formData.expiry_date);
      setShowExpiryChangeDialog(true);
      return;
    }

    await performSave();
  };

  const performSave = async () => {
    setSaving(true);
    try {
      const updateData = {
        storage_location: formData.storage_location,
        storage_conditions: formData.storage_conditions,
        notes: formData.notes,
        qc_status: formData.qc_status,
        qc_notes: formData.qc_notes,
        expiry_date: formData.expiry_date,
        received_by: formData.received_by,
        delivery_reference: formData.delivery_reference,
        order_reference: formData.order_reference
      };

      await base44.entities.ReagentBatch.update(batchId, updateData);

      toast.success('✅ האצווה עודכנה בהצלחה');
      setIsEditMode(false);
      await fetchBatchData(); // Reload fresh data
    } catch (error) {
      console.error('Error saving batch:', error);
      toast.error('שגיאה בשמירת האצווה', {
        description: error.message
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original values
    setFormData({
      storage_location: batch.storage_location || '',
      storage_conditions: batch.storage_conditions || '',
      notes: batch.notes || '',
      qc_status: batch.qc_status || 'not_required',
      qc_notes: batch.qc_notes || '',
      expiry_date: batch.expiry_date || '',
      received_by: batch.received_by || '',
      delivery_reference: batch.delivery_reference || '',
      order_reference: batch.order_reference || ''
    });
    setIsEditMode(false);
  };

  const confirmExpiryChange = async () => {
    setShowExpiryChangeDialog(false);
    await performSave();
  };

  const calculateDaysUntilExpiry = () => {
    if (!batch?.expiry_date) return null;
    const expiry = parseISO(batch.expiry_date);
    return differenceInDays(expiry, new Date());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        <span className="mr-3 text-lg">טוען נתוני אצווה...</span>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>שגיאה</AlertTitle>
          <AlertDescription>אצווה לא נמצאה</AlertDescription>
        </Alert>
      </div>
    );
  }

  const daysUntilExpiry = calculateDaysUntilExpiry();

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="h-7 w-7 text-amber-600" />
              פרטי אצווה: {batch.batch_number}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {reagentData?.name || 'טוען...'}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {!isEditMode ? (
            <Button
              onClick={() => setIsEditMode(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              <Edit3 className="h-4 w-4 ml-2" />
              עריכה
            </Button>
          ) : (
            <>
              <Button
                onClick={handleCancel}
                variant="outline"
                disabled={saving}
              >
                <X className="h-4 w-4 ml-2" />
                ביטול
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    שומר...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 ml-2" />
                    שמירה
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Expiry Warning Alert */}
      {daysUntilExpiry !== null && daysUntilExpiry <= 14 && (
        <Alert variant={daysUntilExpiry <= 0 ? "destructive" : "default"} className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {daysUntilExpiry <= 0 ? '⚠️ אצווה פגת תוקף' : '🔔 תפוגה מתקרבת'}
          </AlertTitle>
          <AlertDescription>
            {daysUntilExpiry <= 0 
              ? `האצווה פגה לפני ${Math.abs(daysUntilExpiry)} ימים. יש לטפל בהתאם לנוהל.`
              : `האצווה תפוג בעוד ${daysUntilExpiry} ימים.`
            }
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Right Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <Card className="border-2 border-amber-200">
            <CardHeader className="bg-gradient-to-l from-amber-50 to-white border-b-2 border-amber-200">
              <CardTitle className="flex items-center text-lg">
                <Package className="h-5 w-5 ml-2 text-amber-600" />
                מידע בסיסי
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Read-Only Fields */}
                <div>
                  <Label className="text-sm font-semibold text-gray-600">מספר אצווה</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="font-mono text-lg font-bold text-gray-900">{batch.batch_number}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">🔒 שדה מוגן - לא ניתן לעריכה</p>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-gray-600">ריאגנט משויך</Label>
                  <div className="mt-1">
                    {reagentData ? (
                      <Link 
                        to={createPageUrl(`EditReagent?id=${reagentData.id}`)}
                        className="flex items-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                      >
                        <Beaker className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-900">{reagentData.name}</span>
                        <ExternalLink className="h-3 w-3 text-blue-600 mr-auto" />
                      </Link>
                    ) : (
                      <p className="p-3 bg-gray-50 rounded-lg border border-gray-200">טוען...</p>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">🔒 קישור קבוע - לא ניתן לשינוי</p>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-gray-600">כמות נוכחית</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-lg font-bold text-gray-900">
                      {batch.current_quantity} {reagentData?.unit_of_measure || 'יח\''}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">🔒 מעודכן דרך תנועות מלאי בלבד</p>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-gray-600">כמות התחלתית</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-lg font-medium text-gray-700">
                      {batch.initial_quantity} {reagentData?.unit_of_measure || 'יח\''}
                    </p>
                  </div>
                </div>

                {/* Status & QC Status */}
                <div>
                  <Label className="text-sm font-semibold text-gray-600">סטטוס אצווה</Label>
                  <div className="mt-1">
                    <Badge className={`${statusColors[batch.status]} text-base px-4 py-2`}>
                      {statusLabels[batch.status] || batch.status}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-gray-600">סטטוס בקרת איכות</Label>
                  {isEditMode ? (
                    <Select 
                      value={formData.qc_status} 
                      onValueChange={(value) => setFormData({...formData, qc_status: value})}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(qcStatusLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="mt-1">
                      <Badge className={`${qcStatusColors[batch.qc_status]} text-base px-4 py-2`}>
                        {qcStatusLabels[batch.qc_status] || batch.qc_status}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Expiry Date - Critical Field */}
                <div className="md:col-span-2">
                  <Label className="text-sm font-semibold text-gray-600">תאריך תפוגה</Label>
                  {isEditMode ? (
                    <>
                      <Input
                        type="date"
                        value={formData.expiry_date}
                        onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                        className="mt-1 border-amber-300 focus:border-amber-500"
                      />
                      <Alert className="mt-2 bg-amber-50 border-amber-300">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-sm text-amber-800">
                          ⚠️ שינוי תאריך תפוגה משפיע על חישובי מלאי ויומן פעילות. יידרש אישור.
                        </AlertDescription>
                      </Alert>
                    </>
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-lg font-medium text-gray-900 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-600" />
                        {batch.expiry_date ? format(parseISO(batch.expiry_date), 'dd/MM/yyyy', { locale: he }) : 'לא צוין'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Storage & Handling Card */}
          <Card>
            <CardHeader className="bg-gradient-to-l from-blue-50 to-white">
              <CardTitle className="flex items-center text-lg">
                <MapPin className="h-5 w-5 ml-2 text-blue-600" />
                אחסון וטיפול
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>מיקום אחסון</Label>
                  {isEditMode ? (
                    <Input
                      value={formData.storage_location}
                      onChange={(e) => setFormData({...formData, storage_location: e.target.value})}
                      placeholder="לדוגמה: מקרר 2, מדף 3"
                      className="mt-1"
                    />
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900">{batch.storage_location || 'לא צוין'}</p>
                    </div>
                  )}
                </div>

                <div>
                  <Label>תנאי אחסון</Label>
                  {isEditMode ? (
                    <Input
                      value={formData.storage_conditions}
                      onChange={(e) => setFormData({...formData, storage_conditions: e.target.value})}
                      placeholder="לדוגמה: 2-8°C"
                      className="mt-1"
                    />
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900 flex items-center gap-2">
                        <Thermometer className="h-4 w-4 text-blue-600" />
                        {batch.storage_conditions || 'לא צוין'}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <Label>התקבל על ידי</Label>
                  {isEditMode ? (
                    <Input
                      value={formData.received_by}
                      onChange={(e) => setFormData({...formData, received_by: e.target.value})}
                      placeholder="שם העובד"
                      className="mt-1"
                    />
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900">{batch.received_by || 'לא צוין'}</p>
                    </div>
                  )}
                </div>

                <div>
                  <Label>תאריך קבלה</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-900">
                      {batch.received_date ? format(parseISO(batch.received_date), 'dd/MM/yyyy', { locale: he }) : 'לא צוין'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QC Notes Card */}
          <Card>
            <CardHeader className="bg-gradient-to-l from-green-50 to-white">
              <CardTitle className="flex items-center text-lg">
                <ShieldCheck className="h-5 w-5 ml-2 text-green-600" />
                בקרת איכות
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label>הערות בקרת איכות</Label>
                {isEditMode ? (
                  <Textarea
                    value={formData.qc_notes}
                    onChange={(e) => setFormData({...formData, qc_notes: e.target.value})}
                    placeholder="הערות על בדיקות QC, תוצאות, וכו'"
                    rows={3}
                    className="mt-1"
                  />
                ) : (
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg border border-gray-200 min-h-[80px]">
                    <p className="text-gray-900 whitespace-pre-wrap">{batch.qc_notes || 'אין הערות'}</p>
                  </div>
                )}
              </div>

              {batch.qc_date && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">תאריך בדיקה:</span>
                    <p className="font-medium">{format(parseISO(batch.qc_date), 'dd/MM/yyyy', { locale: he })}</p>
                  </div>
                  {batch.qc_performed_by && (
                    <div>
                      <span className="text-gray-600">בוצע על ידי:</span>
                      <p className="font-medium">{batch.qc_performed_by}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* General Notes Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <FileText className="h-5 w-5 ml-2 text-gray-600" />
                הערות כלליות
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {isEditMode ? (
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="הערות נוספות על האצווה..."
                  rows={4}
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 min-h-[100px]">
                  <p className="text-gray-900 whitespace-pre-wrap">{batch.notes || 'אין הערות'}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transactions History Card */}
          {relatedTransactions.length > 0 && (
            <Card>
              <CardHeader className="bg-gradient-to-l from-purple-50 to-white">
                <CardTitle className="flex items-center text-lg">
                  <Activity className="h-5 w-5 ml-2 text-purple-600" />
                  היסטוריית תנועות ({relatedTransactions.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">תאריך</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">סוג פעולה</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">כמות</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">הערות</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {relatedTransactions.map((transaction, idx) => (
                        <tr key={transaction.id || idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">
                            {format(parseISO(transaction.created_date), 'dd/MM/yyyy HH:mm', { locale: he })}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <Badge variant="outline">{transaction.transaction_type}</Badge>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={transaction.quantity > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                              {transaction.quantity > 0 ? '+' : ''}{transaction.quantity}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {transaction.notes || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Left Column - Linked Entities & COA */}
        <div className="space-y-6">
          {/* COA Management */}
          <Card>
            <CardHeader className="bg-gradient-to-l from-indigo-50 to-white">
              <CardTitle className="flex items-center text-lg">
                <FileText className="h-5 w-5 ml-2 text-indigo-600" />
                תעודת אנליזה (COA)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <COAManager
                batchId={batchId}
                currentCOA={batch.coa_document_url}
                uploadDate={batch.coa_upload_date}
                uploadedBy={batch.coa_uploaded_by}
                onUploadSuccess={fetchBatchData}
              />
            </CardContent>
          </Card>

          {/* Linked Delivery */}
          {linkedDelivery && (
            <Card>
              <CardHeader className="bg-gradient-to-l from-green-50 to-white">
                <CardTitle className="flex items-center text-lg">
                  <Package className="h-5 w-5 ml-2 text-green-600" />
                  משלוח מקושר
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <Link
                  to={createPageUrl(`EditDelivery?id=${linkedDelivery.id}`)}
                  className="flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
                >
                  <div>
                    <p className="font-medium text-green-900">{linkedDelivery.delivery_number}</p>
                    <p className="text-sm text-green-700">
                      {linkedDelivery.delivery_date ? format(parseISO(linkedDelivery.delivery_date), 'dd/MM/yyyy', { locale: he }) : ''}
                    </p>
                    <p className="text-xs text-green-600">{linkedDelivery.supplier}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-green-600" />
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Delivery Items (if any) */}
          {deliveryItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-sm">
                  <Package className="h-4 w-4 ml-2 text-gray-600" />
                  משלוחים ({deliveryItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {deliveryItems.map((item, idx) => (
                  <div key={idx} className="p-2 bg-gray-50 rounded border text-sm">
                    <p className="font-medium">{item.delivery_number}</p>
                    <p className="text-xs text-gray-600">
                      כמות: {item.quantity_received} | {item.delivery_date}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Shipment Items (if any) */}
          {shipmentItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-sm">
                  <Activity className="h-4 w-4 ml-2 text-gray-600" />
                  שליחות ({shipmentItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {shipmentItems.map((item, idx) => (
                  <div key={idx} className="p-2 bg-gray-50 rounded border text-sm">
                    <p className="font-medium">{item.shipment_number}</p>
                    <p className="text-xs text-gray-600">
                      כמות: {item.quantity_sent} | {item.shipment_date}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Expiry Date Change Confirmation Dialog */}
      <Dialog open={showExpiryChangeDialog} onOpenChange={setShowExpiryChangeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
              אישור שינוי תאריך תפוגה
            </DialogTitle>
            <DialogDescription className="text-right">
              <div className="space-y-3 text-sm">
                <p className="font-medium">
                  האם אתה בטוח שברצונך לשנות את תאריך התפוגה?
                </p>
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <p className="text-amber-800">
                    <strong>תאריך נוכחי:</strong> {batch?.expiry_date ? format(parseISO(batch.expiry_date), 'dd/MM/yyyy', { locale: he }) : 'לא צוין'}
                  </p>
                  <p className="text-amber-800 mt-1">
                    <strong>תאריך חדש:</strong> {pendingExpiryDate ? format(parseISO(pendingExpiryDate), 'dd/MM/yyyy', { locale: he }) : ''}
                  </p>
                </div>
                <p className="text-gray-600">
                  ⚠️ שינוי זה ישפיע על חישובי תפוגה, התראות, ויומן הפעילות.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowExpiryChangeDialog(false)}
            >
              ביטול
            </Button>
            <Button
              onClick={confirmExpiryChange}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              אישור שינוי
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}