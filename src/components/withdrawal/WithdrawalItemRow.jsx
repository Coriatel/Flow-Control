import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Package } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function WithdrawalItemRow({
  item,
  onQuantityChange,
  onUpdate,
  isEditing = true,
  isEditMode,
  variant = 'card'
}) {
  const editing = typeof isEditMode === 'boolean' ? isEditMode : isEditing;
  const isOverMax = item.requested_quantity > item.max_quantity;
  const isOverStock = item.requested_quantity > item.current_stock;
  const hasWarning = isOverMax || isOverStock;

  if (!editing && item.requested_quantity === 0) {
    return null; // Don't render item if not in edit mode and quantity is 0
  }

  const handleQuantityChange = (value) => {
    if (onUpdate) {
      onUpdate({ ...item, requested_quantity: Number(value) || 0 });
    }
    if (onQuantityChange) {
      onQuantityChange(item.id, value);
    }
  };

  const handleNotesChange = (value) => {
    if (onUpdate) {
      onUpdate({ ...item, notes: value });
    }
  };

  if (variant === 'table') {
    return (
      <tr>
        <td className="px-4 py-3 text-right text-sm text-gray-900">
          {item.reagent_name_snapshot || '-'}
        </td>
        <td className="px-4 py-3 text-right text-sm text-gray-600">
          {item.reagent_catalog_number_snapshot || item.catalog_number_snapshot || 'לא ידוע'}
        </td>
        <td className="px-4 py-3 text-center text-sm text-gray-700">
          {item.current_stock ?? '-'}
        </td>
        <td className="px-4 py-3 text-center text-sm text-gray-700">
          {editing ? (
            <Input
              type="number"
              value={item.requested_quantity ?? 0}
              onChange={(e) => handleQuantityChange(e.target.value)}
              min="0"
              className="w-24 text-center"
            />
          ) : (
            item.requested_quantity ?? 0
          )}
        </td>
        <td className="px-4 py-3 text-center text-sm text-gray-700">
          {item.approved_quantity ?? '-'}
        </td>
        <td className="px-4 py-3 text-right text-sm text-gray-700">
          {editing ? (
            <Input
              value={item.notes || ''}
              onChange={(e) => handleNotesChange(e.target.value)}
            />
          ) : (
            item.notes || '-'
          )}
        </td>
      </tr>
    );
  }

  return (
    <div className={`p-3 rounded-lg border transition-all ${editing ? 'bg-white' : 'bg-slate-50'} ${hasWarning ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}>
      <div className="flex justify-between items-start">
        <div className="flex-grow text-right">
          <p className="font-bold text-slate-800">{item.reagent_name_snapshot}</p>
          <p className="text-xs text-slate-500">מק"ט: {item.catalog_number_snapshot || 'לא ידוע'}</p>
        </div>
        {editing ? (
          <div className="w-24 ms-4">
            <Label htmlFor={`item-${item.id}`} className="sr-only">כמות</Label>
            <Input
              id={`item-${item.id}`}
              type="number"
              value={item.requested_quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              min="0"
              max={item.max_quantity}
              className={`text-center font-bold ${hasWarning ? 'border-red-500' : ''}`}
            />
          </div>
        ) : (
          <div className="text-left ms-4">
            <p className="text-sm text-slate-500">כמות מבוקשת</p>
            <p className="font-bold text-lg text-slate-800">{item.requested_quantity}</p>
          </div>
        )}
      </div>
      
      {editing && (
        <div className="mt-2 text-xs text-slate-600 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                <span>יתרה במלאי: {item.current_stock}</span>
                            </span>
                        </TooltipTrigger>
                        <TooltipContent><p>כמות נוכחית זמינה במלאי הכללי</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <span className="text-slate-400">|</span>
                <span>יתרה בהזמנה: {item.max_quantity}</span>
            </div>
            {hasWarning && (
                <div className="flex items-center text-red-600">
                    <AlertCircle className="h-3 w-3 ms-1" />
                    <span>{isOverMax ? 'חריגה מיתרת ההזמנה' : 'חריגה מיתרת המלאי'}</span>
                </div>
            )}
        </div>
      )}
    </div>
  );
}
