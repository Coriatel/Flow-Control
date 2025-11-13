
import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';

const WithdrawalRequestCard = ({ request }) => {
    const getStatusVariant = (status) => {
        switch (status) {
            case 'approved':
            case 'completed':
                return 'default'; // נשתמש בצבע ברירת מחדל ונעצב אותו בנפרד
            case 'in_delivery':
                return 'secondary';
            case 'submitted':
                return 'outline';
            case 'rejected':
            case 'cancelled':
                return 'destructive';
            case 'draft':
            default:
                return 'secondary';
        }
    };

    const getStatusColor = (status) => {
        // צבעים מותאמים לגוון amber של קבוצת רכש והזמנות
        switch (status) {
            case 'approved':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'completed':
                return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'in_delivery':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'submitted':
                return 'bg-amber-50 text-amber-700 border-amber-300';
            case 'rejected':
            case 'cancelled':
                return 'bg-red-100 text-red-700 border-red-200';
            case 'draft':
            default:
                return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    const getStatusLabel = (status) => {
        const labels = {
            draft: 'טיוטה',
            submitted: 'נשלח', // וידוא שהתווית נכונה
            approved: 'מאושר',
            rejected: 'נדחה',
            in_delivery: 'באספקה',
            completed: 'הושלם',
            cancelled: 'בוטל'
        };
        return labels[status] || status;
    };
    
    return (
        <Card className="hover:shadow-lg hover:border-amber-400 transition-all duration-200 bg-white border border-slate-200 mb-3">
            <CardContent className="p-3">
                <Link to={createPageUrl(`EditWithdrawalRequest?id=${request.id}`)} className="block">
                    <div className="flex justify-between items-start">
                        <div className="text-right">
                            <p className="text-sm font-bold text-slate-800">{request.withdrawal_number}</p>
                            <p className="text-xs text-slate-500">{request.supplier_snapshot}</p>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(request.status)}`}>
                            {getStatusLabel(request.status)}
                        </span>
                    </div>
                </Link>
                <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                    <div className="flex justify-between items-center">
                        {request.framework_order_id ? (
                            <Link to={createPageUrl(`EditOrder?id=${request.framework_order_id}`)} className="font-medium text-blue-600 hover:text-blue-700 hover:underline">
                                {request.framework_order_number_snapshot || 'פתח הזמנה'}
                            </Link>
                        ) : (
                            <span className="font-medium text-amber-700">ללא הזמנת מסגרת</span>
                        )}
                        <span className="flex items-center text-slate-500"><ShoppingCart className="w-3 h-3 ml-1"/>הזמנת מסגרת</span>
                    </div>
                     <div className="flex justify-between items-center">
                         <span className="font-medium text-slate-700">
                            {request.request_date ? format(parseISO(request.request_date), 'dd/MM/yy', { locale: he }) : 'לא צוין'}
                        </span>
                        <span className="flex items-center text-slate-500"><Calendar className="w-3 h-3 ml-1"/>תאריך בקשה</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default WithdrawalRequestCard;
