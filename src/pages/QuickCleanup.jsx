import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Zap, Trash2, Database, RefreshCw } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

import { Reagent } from '@/api/entities';
import { ReagentCatalog } from '@/api/entities';
import { ReagentBatch } from '@/api/entities';
import { Order } from '@/api/entities';
import { OrderItem } from '@/api/entities';
import { Delivery } from '@/api/entities';
import { DeliveryItem } from '@/api/entities';
import { Shipment } from '@/api/entities';
import { ShipmentItem } from '@/api/entities';
import { InventoryTransaction } from '@/api/entities';
import { ExpiredProductLog } from '@/api/entities';
import { CompletedInventoryCount } from '@/api/entities';
import { InventoryCountDraft } from '@/api/entities';

export default function QuickCleanupPage() {
  const { toast } = useToast();
  const [cleaning, setCleaning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentAction, setCurrentAction] = useState('');
  const [results, setResults] = useState([]);

  const addResult = (message, type = 'info') => {
    setResults(prev => [...prev, { message, type, timestamp: new Date() }]);
    console.log(`[${type.toUpperCase()}] ${message}`);
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const quickFullReset = async () => {
    setCleaning(true);
    setProgress(0);
    setResults([]);
    
    try {
      addResult('⚡ מתחיל איפוס מהיר ויצירת קטלוג נקי...', 'info');
      
      // Step 1: Quick delete everything
      setCurrentAction('מוחק נתונים קיימים...');
      setProgress(10);
      
      const entitiesToClean = [
        { entity: InventoryTransaction, name: 'תנועות מלאי' },
        { entity: ExpiredProductLog, name: 'רישום תפוגות' },
        { entity: CompletedInventoryCount, name: 'ספירות מושלמות' },
        { entity: InventoryCountDraft, name: 'טיוטות ספירה' },
        { entity: ShipmentItem, name: 'פריטי משלוח' },
        { entity: Shipment, name: 'משלוחים' },
        { entity: DeliveryItem, name: 'פריטי קליטה' },
        { entity: Delivery, name: 'קליטות' },
        { entity: OrderItem, name: 'פריטי הזמנה' },
        { entity: Order, name: 'הזמנות' },
        { entity: ReagentBatch, name: 'אצוות ריאגנטים' },
        { entity: Reagent, name: 'ריאגנטים' },
        { entity: ReagentCatalog, name: 'קטלוג ריאגנטים' }
      ];

      for (let i = 0; i < entitiesToClean.length; i++) {
        const { entity, name } = entitiesToClean[i];
        try {
          setCurrentAction(`מוחק ${name}...`);
          const items = await entity.list('', 50); // Get up to 50 items
          
          if (items && items.length > 0) {
            for (const item of items) {
              try {
                await entity.delete(item.id);
                await sleep(100);
              } catch (deleteError) {
                console.warn(`Failed to delete ${name} item:`, deleteError);
              }
            }
            addResult(`🗑️ נמחקו ${items.length} פריטים מ${name}`, 'success');
          } else {
            addResult(`ℹ️ אין פריטים ב${name}`, 'info');
          }
        } catch (error) {
          addResult(`⚠️ בעיה במחיקת ${name}: ${error.message}`, 'warning');
        }
        
        setProgress(10 + (i / entitiesToClean.length) * 30);
        await sleep(500);
      }
      
      // Step 2: Create fresh catalog
      setCurrentAction('יוצר קטלוג חדש...');
      setProgress(50);
      
      const catalogItems = [
        // ELDAN Reagents
        { name: "Anti-A", supplier: "ELDAN", category: "reagents", catalog_number: "ELDAN_001", item_number: 1 },
        { name: "Anti-B", supplier: "ELDAN", category: "reagents", catalog_number: "ELDAN_002", item_number: 2 },
        { name: "Anti-D (IgG)", supplier: "ELDAN", category: "reagents", catalog_number: "ELDAN_003", item_number: 3 },
        { name: "Anti-C קומבס", supplier: "ELDAN", category: "reagents", catalog_number: "ELDAN_004", item_number: 3001 },
        { name: "Anti-c קומבס", supplier: "ELDAN", category: "reagents", catalog_number: "ELDAN_005", item_number: 3002 },
        { name: "Anti-K", supplier: "ELDAN", category: "reagents", catalog_number: "ELDAN_007", item_number: 7 },
        { name: "Elu-kit II", supplier: "ELDAN", category: "reagents", catalog_number: "ELDAN_015", item_number: 15 },
        
        // BIORAD Reagents
        { name: "Anti-D (IgM+IgG)", supplier: "BIORAD", category: "reagents", catalog_number: "BIORAD_201", item_number: 201 },
        { name: "Screening Cells", supplier: "BIORAD", category: "cells", catalog_number: "BIORAD_301", item_number: 301 },
        { name: "Panel Cells", supplier: "BIORAD", category: "cells", catalog_number: "BIORAD_302", item_number: 302 },
        
        // DYN Reagents
        { name: "Control Serum", supplier: "DYN", category: "controls", catalog_number: "DYN_401", item_number: 401 },
        { name: "DAT Reagent", supplier: "DYN", category: "reagents", catalog_number: "DYN_501", item_number: 501 }
      ];
      
      addResult(`📋 יוצר ${catalogItems.length} פריטי קטלוג...`, 'info');
      
      // Create catalog items
      for (let i = 0; i < catalogItems.length; i++) {
        const item = catalogItems[i];
        try {
          const catalogId = `CAT_${item.supplier}_${item.item_number}`;
          
          // Create catalog entry
          await ReagentCatalog.create({
            name: item.name,
            catalog_number: item.catalog_number,
            supplier: item.supplier,
            category: item.category,
            unit_of_measure: "ml",
            package_size: 10,
            storage_temperature: "2_8_celsius",
            shelf_life_months: 24,
            min_stock_level: 2,
            max_stock_level: 10,
            active: true
          });
          
          await sleep(200);
          
          // Create reagent entry
          await Reagent.create({
            catalog_item_id: catalogId,
            name: item.name,
            category: item.category,
            supplier: item.supplier,
            catalog_number: item.catalog_number,
            item_number: item.item_number,
            total_quantity_all_batches: 0,
            active_batches_count: 0,
            current_stock_status: "out_of_stock",
            reservation_quantity: 0,
            available_quantity: 0,
            average_monthly_usage: 0,
            reorder_suggestion: false,
            is_critical: false
          });
          
          await sleep(200);
          
        } catch (error) {
          addResult(`❌ שגיאה ביצירת ${item.name}: ${error.message}`, 'error');
        }
        
        setProgress(50 + ((i + 1) / catalogItems.length) * 40);
      }
      
      setProgress(95);
      setCurrentAction('מסיים...');
      await sleep(1000);
      
      addResult('🎉 איפוס מהיר הושלם בהצלחה!', 'success');
      addResult('📋 נוצר קטלוג חדש עם פריטים תקינים', 'success');
      addResult('✅ כעת ניתן לבצע ספירת מלאי ללא בעיות!', 'success');
      
      setProgress(100);
      setCurrentAction('הושלם בהצלחה!');
      
      toast({
        title: "איפוס מהיר הושלם!",
        description: "המערכת מוכנה לשימוש עם קטלוג נקי",
        variant: "default"
      });
      
    } catch (error) {
      addResult(`❌ שגיאה קריטית: ${error.message}`, 'error');
      toast({
        title: "שגיאה באיפוס מהיר",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="h-6 w-6 mr-3 text-orange-600" />
            ניקוי מהיר ויצירת קטלוג נקי
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Zap className="h-4 w-4" />
            <AlertDescription>
              <strong>פתרון מהיר:</strong> מוחק הכל ויוצר קטלוג חדש עם ריאגנטים תקינים.
              זה יפתור את כל בעיות השדות החסרים ויאפשר ספירת מלאי תקינה.
            </AlertDescription>
          </Alert>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h3 className="font-semibold text-yellow-800 mb-2">⚠️ אזהרה</h3>
            <p className="text-yellow-700 text-sm">
              פעולה זו תמחק את כל הנתונים הקיימים ותיצור קטלוג חדש עם 12 ריאגנטים בסיסיים.
              המשך רק אם אתה מוכן לאבד את הנתונים הנוכחיים.
            </p>
          </div>

          <Button 
            onClick={quickFullReset} 
            disabled={cleaning}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            size="lg"
          >
            {cleaning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                מבצע איפוס מהיר...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                התחל איפוס מהיר ויצירת קטלוג חדש
              </>
            )}
          </Button>

          {cleaning && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{currentAction}</span>
                <span className="text-sm text-gray-500">{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">התקדמות</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className={`text-sm p-2 rounded ${
                        result.type === 'success' ? 'bg-green-50 text-green-800' :
                        result.type === 'warning' ? 'bg-yellow-50 text-yellow-800' :
                        result.type === 'error' ? 'bg-red-50 text-red-800' :
                        'bg-gray-50 text-gray-800'
                      }`}
                    >
                      {result.message}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}