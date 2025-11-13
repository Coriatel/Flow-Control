import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
    Loader2, Save, X, ArrowLeft, Edit, Eye, Trash2, 
    FileText, Package, Calendar, User, AlertCircle, ExternalLink, Truck
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { toast as sonnerToast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import WithdrawalItemRow from '@/components/withdrawal/WithdrawalItemRow';
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

export default function EditWithdrawalRequestPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const withdrawalId = searchParams.get('id');
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const [withdrawalRequest, setWithdrawalRequest] = useState(null);
    const [frameworkOrder, setFrameworkOrder] = useState(null);
    const [items, setItems] = useState([]);
    const [originalData, setOriginalData] = useState(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await base44.functions.invoke('getEditWithdrawalData', {
                withdrawal_request_id: withdrawalId
            });

            if (!response.data.withdrawalRequest) {
                throw new Error('בקשת משיכה לא נמצאה');
            }

            setWithdrawalRequest(response.data.withdrawalRequest);
            setFrameworkOrder(response.data.frameworkOrder);
            setItems(response.data.items || []);
            setOriginalData({
                withdrawalRequest: response.data.withdrawalRequest,
                items: response.data.items || []
            });

        } catch (error) {
            console.error('Error loading withdrawal data:', error);
            toast({
                title: "שגיאה בטעינת נתונים",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }, [withdrawalId, toast]);

    useEffect(() => {
        if (withdrawalId) {
            loadData();
        }
    }, [withdrawalId, loadData]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await base44.entities.WithdrawalRequest.update(withdrawalId, {
                urgency_level: withdrawalRequest.urgency_level,
                requested_delivery_date: withdrawalRequest.requested_delivery_date,
                requester_notes: withdrawalRequest.requester_notes,
                special_instructions: withdrawalRequest.special_instructions
            });

            for (const item of items) {
                if (item.withdrawal_item_id) {
                    await base44.entities.WithdrawalItem.update(item.withdrawal_item_id, {
                        quantity_requested: item.requested_quantity,
                        justification: item.justification,
                        notes: item.notes
                    });
                } else if (item.requested_quantity > 0) {
                    await base44.entities.WithdrawalItem.create({
                        withdrawal_request_id: withdrawalId,
                        reagent_id: item.reagent_id,
                        reagent_name_snapshot: item.reagent_name_snapshot,
                        quantity_requested: item.requested_quantity,
                        justification: item.justification,
                        notes: item.notes
                    });
                }
            }

            sonnerToast.success('בקשת המשיכה עודכנה בהצלחה');
            setIsEditMode(false);
            loadData();

        } catch (error) {
            console.error('Error saving withdrawal:', error);
            sonnerToast.error('שגיאה בשמירת השינויים', {
                description: error.message
            });
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setWithdrawalRequest(originalData.withdrawalRequest);
        setItems(originalData.items);
        setIsEditMode(false);
    };

    const handleDelete = async () => {
        try {
            const response = await base44.functions.invoke('deleteWithdrawal', {
                withdrawalId: withdrawalId
            });

            if (response.data.success) {
                sonnerToast.success('בקשת המשיכה נמחקה בהצלחה');
                navigate(createPageUrl('WithdrawalRequests'));
            } else {
                throw new Error(response.data.error || 'Failed to delete');
            }
        } catch (error) {
            console.error('Error deleting withdrawal:', error);
            sonnerToast.error('שגיאה במחיקת בקשת המשיכה', {
                description: error.message
            });
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            'draft': { label: 'טיוטה', className: 'bg-gray-100 text-gray-800' },
            'submitted': { label: 'הוגש', className: 'bg-blue-100 text-blue-800' },
            'approved': { label: 'אושר', className: 'bg-green-100 text-green-800' },
            'rejected': { label: 'נדחה', className: 'bg-red-100 text-red-800' },
            'in_delivery': { label: 'במשלוח', className: 'bg-yellow-100 text-yellow-800' },
            'completed': { label: 'הושלם', className: 'bg-purple-100 text-purple-800' },
            'cancelled': { label: 'בוטל', className: 'bg-gray-100 text-gray-800' }
        };
        const config = statusConfig[status] || statusConfig['draft'];
        return <Badge className={config.className}>{config.label}</Badge>;
    };

    const getUrgencyBadge = (urgency) => {
        const urgencyConfig = {
            'routine': { label: 'שגרתי', className: 'bg-gray-100 text-gray-800' },
            'urgent': { label: 'דחוף', className: 'bg-orange-100 text-orange-800' },
            'emergency': { label: 'חירום', className: 'bg-red-100 text-red-800' }
        };
        const config = urgencyConfig[urgency] || urgencyConfig['routine'];
        return <Badge className={config.className}>{config.label}</Badge>;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64" dir="rtl">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="mr-2">טוען נתונים...</span>
            </div>
        );
    }

    if (!withdrawalRequest) {
        return (
            <div className="p-6" dir="rtl">
                <Card>
                    <CardContent className="py-12">
                        <div className="text-center">
                            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                            <p className="text-lg text-gray-700">בקשת משיכה לא נמצאה</p>
                            <Button onClick={() => navigate(createPageUrl('WithdrawalRequests'))} className="mt-4">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                חזרה לרשימה
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto" dir="rtl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4 space-x-reverse">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(createPageUrl('WithdrawalRequests'))}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            בקשת משיכה: {withdrawalRequest.withdrawal_number}
                        </h1>
                        <p className="text-sm text-gray-600">
                            נוצר: {format(parseISO(withdrawalRequest.created_date), 'dd/MM/yyyy HH:mm', { locale: he })}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {!isEditMode ? (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => setIsEditMode(true)}
                                disabled={withdrawalRequest.status === 'completed' || withdrawalRequest.status === 'cancelled'}
                            >
                                <Edit className="h-4 w-4 mr-2" />
                                עריכה
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setShowDeleteDialog(true)}
                                className="text-red-600 hover:text-red-700"
                                disabled={withdrawalRequest.status === 'completed'}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                מחיקה
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                onClick={handleCancel}
                                disabled={saving}
                            >
                                <X className="h-4 w-4 mr-2" />
                                ביטול
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-amber-500 hover:bg-amber-600"
                            >
                                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                שמירה
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Status & Mode Indicator */}
            <div className="flex items-center gap-3 mb-6">
                {getStatusBadge(withdrawalRequest.status)}
                {getUrgencyBadge(withdrawalRequest.urgency_level)}
                {isEditMode && (
                    <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
                        <Edit className="h-3 w-3" />
                        מצב עריכה
                    </Badge>
                )}
                {!isEditMode && (
                    <Badge className="bg-gray-100 text-gray-800 flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        מצב צפייה
                    </Badge>
                )}
            </div>

            {/* Main Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <FileText className="h-5 w-5 ml-2 text-blue-600" />
                            פרטי בקשה
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>מספר הזמנת מסגרת</Label>
                                {frameworkOrder ? (
                                    <div className="mt-1">
                                        <Link
                                            to={createPageUrl(`EditOrder?id=${frameworkOrder.id}`)}
                                            className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                                        >
                                            {frameworkOrder.order_number_temp}
                                            <ExternalLink className="h-3 w-3" />
                                        </Link>
                                        {frameworkOrder.order_number_permanent && (
                                            <p className="text-xs text-gray-500">
                                                ({frameworkOrder.order_number_permanent})
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="mt-1 text-sm text-gray-600">לא זמין</p>
                                )}
                            </div>

                            <div>
                                <Label>ספק</Label>
                                <p className="mt-1 text-sm font-medium">{withdrawalRequest.supplier_snapshot || 'לא צוין'}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="requested_delivery_date">תאריך אספקה מבוקש</Label>
                                {isEditMode ? (
                                    <Input
                                        id="requested_delivery_date"
                                        type="date"
                                        value={withdrawalRequest.requested_delivery_date || ''}
                                        onChange={(e) => setWithdrawalRequest({
                                            ...withdrawalRequest,
                                            requested_delivery_date: e.target.value
                                        })}
                                    />
                                ) : (
                                    <p className="mt-1 text-sm">
                                        {withdrawalRequest.requested_delivery_date
                                            ? format(parseISO(withdrawalRequest.requested_delivery_date), 'dd/MM/yyyy', { locale: he })
                                            : 'לא צוין'}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="urgency_level">דחיפות</Label>
                                {isEditMode ? (
                                    <Select
                                        value={withdrawalRequest.urgency_level}
                                        onValueChange={(value) => setWithdrawalRequest({
                                            ...withdrawalRequest,
                                            urgency_level: value
                                        })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="routine">שגרתי</SelectItem>
                                            <SelectItem value="urgent">דחוף</SelectItem>
                                            <SelectItem value="emergency">חירום</SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <div className="mt-1">
                                        {getUrgencyBadge(withdrawalRequest.urgency_level)}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="requester_notes">הערות מבקש</Label>
                            {isEditMode ? (
                                <Textarea
                                    id="requester_notes"
                                    value={withdrawalRequest.requester_notes || ''}
                                    onChange={(e) => setWithdrawalRequest({
                                        ...withdrawalRequest,
                                        requester_notes: e.target.value
                                    })}
                                    rows={3}
                                />
                            ) : (
                                <p className="mt-1 text-sm text-gray-600">
                                    {withdrawalRequest.requester_notes || 'אין הערות'}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="special_instructions">הוראות מיוחדות</Label>
                            {isEditMode ? (
                                <Textarea
                                    id="special_instructions"
                                    value={withdrawalRequest.special_instructions || ''}
                                    onChange={(e) => setWithdrawalRequest({
                                        ...withdrawalRequest,
                                        special_instructions: e.target.value
                                    })}
                                    rows={2}
                                />
                            ) : (
                                <p className="mt-1 text-sm text-gray-600">
                                    {withdrawalRequest.special_instructions || 'אין הוראות מיוחדות'}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Linked Documents */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center text-base">
                            <Truck className="h-5 w-5 ml-2 text-purple-600" />
                            מסמכים מקושרים
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Linked Deliveries */}
                        <div>
                            <Label className="text-sm font-semibold">משלוחים שהתקבלו</Label>
                            {withdrawalRequest.linked_delivery_ids && withdrawalRequest.linked_delivery_ids.length > 0 ? (
                                <div className="mt-2 space-y-2">
                                    {withdrawalRequest.linked_delivery_ids.map((deliveryId, idx) => (
                                        <Link
                                            key={deliveryId}
                                            to={createPageUrl(`EditDelivery?id=${deliveryId}`)}
                                            className="flex items-center justify-between p-2 bg-purple-50 rounded hover:bg-purple-100 transition-colors"
                                        >
                                            <span className="text-sm font-medium text-purple-800">
                                                משלוח #{idx + 1}
                                            </span>
                                            <ExternalLink className="h-3 w-3 text-purple-600" />
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="mt-2 text-xs text-gray-500">
                                    טרם התקבלו משלוחים
                                </p>
                            )}
                        </div>

                        {/* Created By / Date */}
                        <div className="pt-4 border-t">
                            <div className="flex items-center text-xs text-gray-500 mb-2">
                                <User className="h-3 w-3 ml-1" />
                                נוצר על ידי: {withdrawalRequest.created_by || 'לא ידוע'}
                            </div>
                            <div className="flex items-center text-xs text-gray-500">
                                <Calendar className="h-3 w-3 ml-1" />
                                תאריך בקשה: {format(parseISO(withdrawalRequest.request_date), 'dd/MM/yyyy', { locale: he })}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Items Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Package className="h-5 w-5 ml-2 text-green-600" />
                        פריטים בבקשה ({items.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200" dir="rtl">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">פריט</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">מק"ט</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">מלאי נוכחי</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">כמות מבוקשת</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">כמות מאושרת</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">הערות</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {items.length > 0 ? items.map((item, index) => (
                                    <WithdrawalItemRow
                                        key={item.id || index}
                                        item={item}
                                        isEditMode={isEditMode}
                                        onUpdate={(updatedItem) => {
                                            const newItems = [...items];
                                            newItems[index] = updatedItem;
                                            setItems(newItems);
                                        }}
                                    />
                                )) : (
                                    <tr>
                                        <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                                            אין פריטים בבקשה
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent dir="rtl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>האם למחוק את בקשת המשיכה?</AlertDialogTitle>
                        <AlertDialogDescription>
                            פעולה זו תמחק את בקשת המשיכה ואת כל הפריטים הקשורים אליה.
                            המחיקה היא סופית ולא ניתנת לשחזור.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            מחק
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}