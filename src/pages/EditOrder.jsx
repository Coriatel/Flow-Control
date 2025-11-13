import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
    Loader2, Save, X, ArrowLeft, Edit, Eye, Trash2, 
    FileText, Package, Calendar, User, AlertCircle, ExternalLink, Truck, ShoppingCart
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { toast as sonnerToast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
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

export default function EditOrderPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('id');
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const [order, setOrder] = useState(null);
    const [items, setItems] = useState([]);
    const [originalData, setOriginalData] = useState(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [orderData, itemsData] = await Promise.all([
                base44.entities.Order.filter({ id: orderId }),
                base44.entities.OrderItem.filter({ order_id: orderId })
            ]);

            if (!orderData || orderData.length === 0) {
                throw new Error('הזמנה לא נמצאה');
            }

            setOrder(orderData[0]);
            setItems(itemsData || []);
            setOriginalData({
                order: orderData[0],
                items: itemsData || []
            });

        } catch (error) {
            console.error('Error loading order data:', error);
            toast({
                title: "שגיאה בטעינת נתונים",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }, [orderId, toast]);

    useEffect(() => {
        if (orderId) {
            loadData();
        }
    }, [orderId, loadData]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await base44.entities.Order.update(orderId, {
                order_number_permanent: order.order_number_permanent,
                purchase_order_number_sap: order.purchase_order_number_sap,
                expected_delivery_start_date: order.expected_delivery_start_date,
                expected_delivery_end_date: order.expected_delivery_end_date,
                notes: order.notes
            });

            sonnerToast.success('ההזמנה עודכנה בהצלחה');
            setIsEditMode(false);
            loadData();

        } catch (error) {
            console.error('Error saving order:', error);
            sonnerToast.error('שגיאה בשמירת השינויים', {
                description: error.message
            });
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setOrder(originalData.order);
        setItems(originalData.items);
        setIsEditMode(false);
    };

    const handleDelete = async () => {
        try {
            await base44.entities.Order.update(orderId, {
                is_deleted: true,
                deleted_date: new Date().toISOString(),
                deleted_by: (await base44.auth.me()).email,
                deleted_reason: 'נמחק על ידי המשתמש'
            });

            sonnerToast.success('ההזמנה נמחקה בהצלחה');
            navigate(createPageUrl('Orders'));
        } catch (error) {
            console.error('Error deleting order:', error);
            sonnerToast.error('שגיאה במחיקת ההזמנה', {
                description: error.message
            });
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            'pending_sap_details': { label: 'ממתין לפרטי SAP', className: 'bg-yellow-100 text-yellow-800' },
            'approved': { label: 'אושר', className: 'bg-green-100 text-green-800' },
            'partially_received': { label: 'התקבל חלקית', className: 'bg-blue-100 text-blue-800' },
            'fully_received': { label: 'התקבל במלואו', className: 'bg-purple-100 text-purple-800' },
            'closed': { label: 'סגור', className: 'bg-gray-100 text-gray-800' },
            'cancelled': { label: 'בוטל', className: 'bg-red-100 text-red-800' }
        };
        const config = statusConfig[status] || statusConfig['pending_sap_details'];
        return <Badge className={config.className}>{config.label}</Badge>;
    };

    const getOrderTypeBadge = (type) => {
        const typeConfig = {
            'immediate_delivery': { label: 'אספקה מיידית', className: 'bg-green-100 text-green-800' },
            'framework': { label: 'מסגרת', className: 'bg-purple-100 text-purple-800' }
        };
        const config = typeConfig[type] || typeConfig['immediate_delivery'];
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

    if (!order) {
        return (
            <div className="p-6" dir="rtl">
                <Card>
                    <CardContent className="py-12">
                        <div className="text-center">
                            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                            <p className="text-lg text-gray-700">הזמנה לא נמצאה</p>
                            <Button onClick={() => navigate(createPageUrl('Orders'))} className="mt-4">
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
                        onClick={() => navigate(createPageUrl('Orders'))}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            הזמנה: {order.order_number_temp}
                        </h1>
                        <p className="text-sm text-gray-600">
                            נוצר: {format(parseISO(order.created_date), 'dd/MM/yyyy HH:mm', { locale: he })}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {!isEditMode ? (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => setIsEditMode(true)}
                                disabled={order.status === 'closed' || order.status === 'cancelled'}
                            >
                                <Edit className="h-4 w-4 mr-2" />
                                עריכה
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setShowDeleteDialog(true)}
                                className="text-red-600 hover:text-red-700"
                                disabled={order.status === 'fully_received'}
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
                {getStatusBadge(order.status)}
                {getOrderTypeBadge(order.order_type)}
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
                            פרטי הזמנה
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>מספר הזמנה זמני</Label>
                                <p className="mt-1 text-sm font-medium">{order.order_number_temp}</p>
                            </div>

                            <div>
                                <Label htmlFor="order_number_permanent">מספר הזמנה קבוע</Label>
                                {isEditMode ? (
                                    <Input
                                        id="order_number_permanent"
                                        value={order.order_number_permanent || ''}
                                        onChange={(e) => setOrder({
                                            ...order,
                                            order_number_permanent: e.target.value
                                        })}
                                        placeholder="הזן מספר הזמנה קבוע"
                                    />
                                ) : (
                                    <p className="mt-1 text-sm">{order.order_number_permanent || 'לא הוזן'}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="purchase_order_number_sap">מספר דרישת רכש SAP</Label>
                                {isEditMode ? (
                                    <Input
                                        id="purchase_order_number_sap"
                                        value={order.purchase_order_number_sap || ''}
                                        onChange={(e) => setOrder({
                                            ...order,
                                            purchase_order_number_sap: e.target.value
                                        })}
                                        placeholder="הזן מספר דרישת רכש"
                                    />
                                ) : (
                                    <p className="mt-1 text-sm">{order.purchase_order_number_sap || 'לא הוזן'}</p>
                                )}
                            </div>

                            <div>
                                <Label>ספק</Label>
                                <p className="mt-1 text-sm font-medium">{order.supplier_name_snapshot || 'לא צוין'}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>תאריך הזמנה</Label>
                                <p className="mt-1 text-sm">
                                    {format(parseISO(order.order_date), 'dd/MM/yyyy', { locale: he })}
                                </p>
                            </div>

                            <div>
                                <Label>סוג הזמנה</Label>
                                <div className="mt-1">
                                    {getOrderTypeBadge(order.order_type)}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="expected_delivery_start_date">תאריך אספקה צפוי (התחלה)</Label>
                                {isEditMode ? (
                                    <Input
                                        id="expected_delivery_start_date"
                                        type="date"
                                        value={order.expected_delivery_start_date || ''}
                                        onChange={(e) => setOrder({
                                            ...order,
                                            expected_delivery_start_date: e.target.value
                                        })}
                                    />
                                ) : (
                                    <p className="mt-1 text-sm">
                                        {order.expected_delivery_start_date
                                            ? format(parseISO(order.expected_delivery_start_date), 'dd/MM/yyyy', { locale: he })
                                            : 'לא צוין'}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="expected_delivery_end_date">תאריך אספקה צפוי (סיום)</Label>
                                {isEditMode ? (
                                    <Input
                                        id="expected_delivery_end_date"
                                        type="date"
                                        value={order.expected_delivery_end_date || ''}
                                        onChange={(e) => setOrder({
                                            ...order,
                                            expected_delivery_end_date: e.target.value
                                        })}
                                    />
                                ) : (
                                    <p className="mt-1 text-sm">
                                        {order.expected_delivery_end_date
                                            ? format(parseISO(order.expected_delivery_end_date), 'dd/MM/yyyy', { locale: he })
                                            : 'לא צוין'}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="notes">הערות</Label>
                            {isEditMode ? (
                                <Textarea
                                    id="notes"
                                    value={order.notes || ''}
                                    onChange={(e) => setOrder({
                                        ...order,
                                        notes: e.target.value
                                    })}
                                    rows={3}
                                />
                            ) : (
                                <p className="mt-1 text-sm text-gray-600">
                                    {order.notes || 'אין הערות'}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Linked Documents */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center text-base">
                            <ShoppingCart className="h-5 w-5 ml-2 text-green-600" />
                            מסמכים מקושרים
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Linked Withdrawals */}
                        <div>
                            <Label className="text-sm font-semibold">בקשות משיכה</Label>
                            {order.linked_withdrawal_request_ids && order.linked_withdrawal_request_ids.length > 0 ? (
                                <div className="mt-2 space-y-2">
                                    {order.linked_withdrawal_request_ids.map((withdrawalId, idx) => (
                                        <Link
                                            key={withdrawalId}
                                            to={createPageUrl(`EditWithdrawalRequest?id=${withdrawalId}`)}
                                            className="flex items-center justify-between p-2 bg-green-50 rounded hover:bg-green-100 transition-colors"
                                        >
                                            <span className="text-sm font-medium text-green-800">
                                                משיכה #{idx + 1}
                                            </span>
                                            <ExternalLink className="h-3 w-3 text-green-600" />
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="mt-2 text-xs text-gray-500">
                                    אין בקשות משיכה מקושרות
                                </p>
                            )}
                        </div>

                        {/* Linked Deliveries */}
                        <div>
                            <Label className="text-sm font-semibold">משלוחים שהתקבלו</Label>
                            {order.linked_delivery_ids && order.linked_delivery_ids.length > 0 ? (
                                <div className="mt-2 space-y-2">
                                    {order.linked_delivery_ids.map((deliveryId, idx) => (
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
                                נוצר על ידי: {order.created_by || 'לא ידוע'}
                            </div>
                            <div className="flex items-center text-xs text-gray-500">
                                <Calendar className="h-3 w-3 ml-1" />
                                תאריך הזמנה: {format(parseISO(order.order_date), 'dd/MM/yyyy', { locale: he })}
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
                        פריטים בהזמנה ({items.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200" dir="rtl">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">פריט</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">מק"ט</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">כמות מוזמנת</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">כמות התקבלה</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">יתרה</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">סטטוס</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">הערות</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {items.length > 0 ? items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            {item.reagent_name_snapshot}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {item.reagent_catalog_number_snapshot || 'N/A'}
                                        </td>
                                        <td className="px-4 py-3 text-center text-sm text-gray-900">
                                            {item.quantity_ordered}
                                        </td>
                                        <td className="px-4 py-3 text-center text-sm text-gray-900">
                                            {item.quantity_received || 0}
                                        </td>
                                        <td className="px-4 py-3 text-center text-sm font-medium">
                                            {item.quantity_remaining || 0}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {item.line_status === 'fully_received' ? (
                                                <Badge className="bg-green-100 text-green-800">התקבל במלואו</Badge>
                                            ) : item.line_status === 'partially_received' ? (
                                                <Badge className="bg-blue-100 text-blue-800">התקבל חלקית</Badge>
                                            ) : (
                                                <Badge className="bg-yellow-100 text-yellow-800">פתוח</Badge>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {item.notes || '-'}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                                            אין פריטים בהזמנה
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
                        <AlertDialogTitle>האם למחוק את ההזמנה?</AlertDialogTitle>
                        <AlertDialogDescription>
                            פעולה זו תמחק את ההזמנה ואת כל הפריטים הקשורים אליה.
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