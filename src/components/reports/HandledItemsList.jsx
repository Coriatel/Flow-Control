import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, parseISO, differenceInDays } from "date-fns";
import { he } from "date-fns/locale";
import { CheckCircle, AlertTriangle, Trash2, RefreshCw } from "lucide-react";

export default function HandledItemsList({ handledExpiredLogs, loading = false }) {
  // Helper functions
  const getActionLabel = (action) => {
    switch (action) {
      case 'disposed': return 'הושמד';
      case 'other_use': return 'שימוש אחר';
      case 'not_in_stock': return 'לא נמצא במלאי';
      default: return action;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'disposed': return 'bg-red-100 text-red-800';
      case 'other_use': return 'bg-blue-100 text-blue-800';
      case 'not_in_stock': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'disposed': return <Trash2 className="h-4 w-4" />;
      case 'other_use': return <RefreshCw className="h-4 w-4" />;
      case 'not_in_stock': return <AlertTriangle className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getDaysFromExpiry = (expiryDate) => {
    const today = new Date();
    const expiry = parseISO(expiryDate);
    const daysDiff = differenceInDays(today, expiry);
    
    if (daysDiff > 0) {
      return `פג לפני ${daysDiff} ימים`;
    } else if (daysDiff === 0) {
      return 'פג היום';
    } else {
      return `יפוג בעוד ${Math.abs(daysDiff)} ימים`;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-2 text-gray-600">טוען רשימת פריטים שטופלו...</p>
      </div>
    );
  }

  if (!handledExpiredLogs || handledExpiredLogs.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">אין פריטים שטופלו</h3>
        <p className="text-gray-600">כל הפריטים פגי התוקף טרם טופלו או שאין פריטים כאלה כרגע</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        מציג {handledExpiredLogs.length} פריטים שטופלו
      </div>
      
      <div className="grid gap-4">
        {handledExpiredLogs.map((log) => (
          <Card key={log.id} className="border-l-4 border-l-green-400">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-lg text-gray-900 mb-2">
                    {log.reagent_name_snapshot}
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">תאריך תפוגה מקורי:</span>
                      <div className="mt-1">
                        {format(parseISO(log.original_expiry_date), 'dd/MM/yyyy', { locale: he })}
                      </div>
                      <div className="text-xs text-gray-500">
                        {getDaysFromExpiry(log.original_expiry_date)}
                      </div>
                    </div>
                    
                    <div>
                      <span className="font-medium text-gray-600">תאריך טיפול:</span>
                      <div className="mt-1">
                        {format(parseISO(log.documented_date), 'dd/MM/yyyy HH:mm', { locale: he })}
                      </div>
                    </div>
                    
                    {log.batch_number_snapshot && (
                      <div>
                        <span className="font-medium text-gray-600">מספר אצווה:</span>
                        <div className="mt-1 font-mono">{log.batch_number_snapshot}</div>
                      </div>
                    )}
                    
                    {log.quantity_affected && (
                      <div>
                        <span className="font-medium text-gray-600">כמות שהושפעה:</span>
                        <div className="mt-1">{log.quantity_affected}</div>
                      </div>
                    )}
                  </div>
                  
                  {log.action_notes && (
                    <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                      <span className="font-medium text-gray-600">הערות:</span>
                      <div className="mt-1">{log.action_notes}</div>
                    </div>
                  )}
                </div>
                
                <div className="mr-4 flex flex-col items-end gap-2">
                  <Badge className={`${getActionColor(log.action_taken)} flex items-center gap-1`}>
                    {getActionIcon(log.action_taken)}
                    {getActionLabel(log.action_taken)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}