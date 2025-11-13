import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Package, Truck, Calculator, Trash2, ArrowUpDown } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { he } from "date-fns/locale";

// Import entities
import { Delivery } from '@/api/entities';
import { Shipment } from '@/api/entities';
import { CompletedInventoryCount } from '@/api/entities';
import { ExpiredProductLog } from '@/api/entities';

export default function InventoryMovementsList() {
  const [loading, setLoading] = useState(true);
  const [movements, setMovements] = useState([]);

  useEffect(() => {
    const fetchInventoryMovements = async () => {
      setLoading(true);
      try {
        // Fetch all inventory movement data
        const [deliveries, shipments, inventoryCounts, expiredLogs] = await Promise.all([
          Delivery.list().catch(() => []),
          Shipment.list().catch(() => []),
          CompletedInventoryCount.list().catch(() => []),
          ExpiredProductLog.list().catch(() => [])
        ]);

        const allMovements = [];

        // Process Deliveries (Inventory Additions)
        deliveries.forEach(delivery => {
          allMovements.push({
            id: `delivery_${delivery.id}`,
            type: 'delivery',
            typeLabel: 'קליטת משלוח',
            description: `משלוח ${delivery.delivery_number || 'ללא מספר'} מספק ${delivery.supplier}`,
            details: `${delivery.total_items_received || 0} פריטים התקבלו`,
            date: delivery.delivery_date || delivery.created_date,
            user: delivery.created_by,
            impact: 'הוספה למלאי',
            impactType: 'positive',
            icon: Truck,
            color: 'bg-green-100 text-green-800'
          });
        });

        // Process Shipments (Inventory Removals)
        shipments.forEach(shipment => {
          allMovements.push({
            id: `shipment_${shipment.id}`,
            type: 'shipment',
            typeLabel: 'שליחת ריאגנטים',
            description: `שליחה ${shipment.shipment_number || 'ללא מספר'} לנמען ${shipment.recipient_name}`,
            details: `${shipment.total_items_sent || 0} פריטים נשלחו`,
            date: shipment.shipment_date || shipment.created_date,
            user: shipment.created_by,
            impact: 'גריעה מהמלאי',
            impactType: 'negative',
            icon: Package,
            color: 'bg-red-100 text-red-800'
          });
        });

        // Process Inventory Counts (Inventory Adjustments)
        inventoryCounts.forEach(count => {
          allMovements.push({
            id: `count_${count.id}`,
            type: 'count',
            typeLabel: 'ספירת מלאי',
            description: `ספירת מלאי מיום ${count.count_date ? format(parseISO(count.count_date), 'dd/MM/yyyy') : 'לא ידוע'}`,
            details: `${count.reagents_updated_count || 0}/${count.reagents_total_count || 0} פריטים עודכנו`,
            date: count.count_date || count.created_date,
            user: count.created_by,
            impact: 'עדכון מלאי וחישוב צריכה',
            impactType: 'adjustment',
            icon: Calculator,
            color: 'bg-blue-100 text-blue-800'
          });
        });

        // Process Expired Product Logs (Inventory Disposals)
        expiredLogs.forEach(log => {
          const actionMap = {
            'disposed': 'השמדת פג תוקף',
            'other_use': 'שימוש אחר בפג תוקף',
            'not_in_stock': 'סימון לא במלאי'
          };
          
          allMovements.push({
            id: `expired_${log.id}`,
            type: 'expired',
            typeLabel: actionMap[log.action_taken] || 'טיפול בפג תוקף',
            description: `${log.reagent_name_snapshot} - ${log.batch_number_snapshot || 'ללא אצווה'}`,
            details: `כמות שטופלה: ${log.quantity_affected || 'לא צוין'}`,
            date: log.documented_date,
            user: log.created_by,
            impact: log.action_taken === 'disposed' ? 'השמדה' : 'שימוש אחר',
            impactType: log.action_taken === 'disposed' ? 'negative' : 'adjustment',
            icon: Trash2,
            color: 'bg-orange-100 text-orange-800'
          });
        });

        // Sort by date (newest first)
        allMovements.sort((a, b) => {
          const dateA = a.date ? parseISO(a.date) : new Date(0);
          const dateB = b.date ? parseISO(b.date) : new Date(0);
          if (!isValid(dateA) || !isValid(dateB)) return 0;
          return dateB.getTime() - dateA.getTime();
        });

        setMovements(allMovements);
      } catch (error) {
        console.error('Error fetching inventory movements:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryMovements();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="mr-3 text-gray-600">טוען תנועות מלאי...</p>
      </div>
    );
  }

  if (movements.length === 0) {
    return (
      <Alert>
        <Package className="h-4 w-4" />
        <AlertDescription>
          לא נמצאו תנועות מלאי במערכת.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">
            {movements.filter(m => m.impactType === 'positive').length}
          </div>
          <div className="text-sm text-green-700">הוספות למלאי</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-600">
            {movements.filter(m => m.impactType === 'negative').length}
          </div>
          <div className="text-sm text-red-700">גריעות מהמלאי</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">
            {movements.filter(m => m.impactType === 'adjustment').length}
          </div>
          <div className="text-sm text-blue-700">עדכוני מלאי</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-gray-600">
            {movements.length}
          </div>
          <div className="text-sm text-gray-700">סך תנועות</div>
        </div>
      </div>

      <ScrollArea className="h-[500px]">
        <div className="space-y-3">
          {movements.map((movement) => {
            const IconComponent = movement.icon;
            
            return (
              <div key={movement.id} className="flex items-start space-x-3 space-x-reverse p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex-shrink-0">
                  <div className={`p-2 rounded-full ${
                    movement.impactType === 'positive' ? 'bg-green-100' :
                    movement.impactType === 'negative' ? 'bg-red-100' : 'bg-blue-100'
                  }`}>
                    <IconComponent className={`h-4 w-4 ${
                      movement.impactType === 'positive' ? 'text-green-600' :
                      movement.impactType === 'negative' ? 'text-red-600' : 'text-blue-600'
                    }`} />
                  </div>
                </div>
                
                <div className="flex-grow min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900">{movement.typeLabel}</h4>
                    <div className="flex items-center gap-2">
                      <Badge className={movement.color}>
                        {movement.typeLabel}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {movement.date ? format(parseISO(movement.date), 'dd/MM/yyyy HH:mm') : 'לא ידוע'}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-1">{movement.description}</p>
                  <p className="text-xs text-gray-500 mt-1">{movement.details}</p>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center">
                      <ArrowUpDown className="h-3 w-3 mr-1 text-orange-500" />
                      <span className="text-xs text-orange-600 font-medium">
                        השפעה: {movement.impact}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      משתמש: {movement.user || 'לא ידוע'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}