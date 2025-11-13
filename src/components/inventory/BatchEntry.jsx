import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Sparkles, History } from "lucide-react";

export default function BatchEntry({ 
  batch, 
  onChange, 
  onRemove, 
  isNewFromDelivery = false,
  lastCountedQuantity = null 
}) {
  return (
    <div className={`border rounded-lg p-3 ${isNewFromDelivery ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* 🆕 תג לאצווה חדשה */}
          {isNewFromDelivery && (
            <Badge className="bg-green-100 text-green-800 flex items-center gap-1 text-xs">
              <Sparkles className="h-3 w-3" />
              חדשה
            </Badge>
          )}
          {/* 🆕 הצגת כמות אחרונה */}
          {!isNewFromDelivery && lastCountedQuantity !== null && (
            <Badge variant="outline" className="flex items-center gap-1 text-xs">
              <History className="h-3 w-3" />
              אחרון: {lastCountedQuantity}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <Label className="text-xs">מספר אצווה</Label>
          <Input
            value={batch.batch_number || ''}
            onChange={(e) => onChange({ ...batch, batch_number: e.target.value })}
            placeholder="מספר אצווה"
            className="h-9"
          />
        </div>
        
        <div>
          <Label className="text-xs">תאריך תפוגה</Label>
          <Input
            type="date"
            value={batch.expiry_date || ''}
            onChange={(e) => onChange({ ...batch, expiry_date: e.target.value })}
            className="h-9"
          />
        </div>
        
        <div>
          <Label className="text-xs">כמות נספרת</Label>
          <Input
            type="number"
            min="0"
            step="0.1"
            value={batch.quantity || ''}
            onChange={(e) => onChange({ ...batch, quantity: parseFloat(e.target.value) || 0 })}
            placeholder="0"
            className="h-9"
          />
        </div>
      </div>
    </div>
  );
}