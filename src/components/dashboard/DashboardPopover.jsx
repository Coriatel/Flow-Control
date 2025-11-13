import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ChevronLeft } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { he } from 'date-fns/locale';

const DashboardPopoverContent = ({ items, type }) => {
    if (!items || items.length === 0) {
        return <div className="p-4 text-center text-sm text-slate-500">אין פריטים להצגה.</div>;
    }

    const renderItem = (item, index) => {
        switch (type) {
            case 'expiring':
                // Defensive check for date validity
                const expDate = item.nearest_expiry_date ? parseISO(item.nearest_expiry_date) : null;
                const dateString = expDate && isValid(expDate) ? format(expDate, 'dd/MM/yy') : 'תאריך לא תקין';
                
                // Using correct properties: item.id and item.name
                return (
                    <Link to={createPageUrl(`BatchAndExpiryManagement?reagent_id=${item.id}`)} key={index} className="flex justify-between items-center text-xs p-1.5 hover:bg-slate-100 rounded-md">
                        <span>{item.name}</span>
                        <span className="font-mono text-red-600">{dateString}</span>
                    </Link>
                );
            case 'low_stock':
                 return (
                    <Link to={createPageUrl(`InventoryReplenishment?reagent_id=${item.id}`)} key={index} className="flex justify-between items-center text-xs p-1.5 hover:bg-slate-100 rounded-md">
                        <span>{item.name}</span>
                        <span className="font-mono text-amber-700">{Math.round(item.months_of_stock * 4.33)} שבועות</span>
                    </Link>
                );
            case 'pending_supplies':
                const isOrder = item.type === 'order';
                const link = isOrder ? `EditOrder?id=${item.id}` : `EditWithdrawalRequest?id=${item.id}`;
                const reqDate = item.requestDate ? parseISO(item.requestDate) : null;
                const reqDateString = reqDate && isValid(reqDate) ? format(reqDate, 'dd/MM/yy') : '-';

                return (
                    <Link to={createPageUrl(link)} key={index} className="flex justify-between items-center text-xs p-1.5 hover:bg-slate-100 rounded-md">
                        <span>{isOrder ? item.order_number_temp : item.withdrawal_number}</span>
                        <span className="font-mono text-blue-600">{reqDateString}</span>
                    </Link>
                );
            case 'pending_orders':
                return (
                    <Link to={createPageUrl(`EditOrder?id=${item.id}`)} key={index} className="flex justify-between items-center text-xs p-1.5 hover:bg-slate-100 rounded-md">
                        <span>{item.order_number_temp}</span>
                        <span className="font-mono text-purple-600">{item.supplier_name_snapshot}</span>
                    </Link>
                );
            default:
                return null;
        }
    };

    return (
        <div>
            <ScrollArea className="h-48">
                <div className="space-y-1 p-2">
                    {items.slice(0, 10).map(renderItem)}
                </div>
            </ScrollArea>
            {items.length > 10 && (
                <div className="p-2 text-center text-xs text-slate-500 border-t">
                    ועוד {items.length - 10} פריטים...
                </div>
            )}
        </div>
    );
};

export default DashboardPopoverContent;