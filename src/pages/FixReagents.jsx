
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Wrench, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { Reagent } from '@/api/entities';

export default function FixReagentsPage() {
  const { toast } = useToast();
  const [fixing, setFixing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentAction, setCurrentAction] = useState('');
  const [results, setResults] = useState([]);

  const addResult = (message, type = 'info') => {
    setResults(prev => [...prev, { message, type, timestamp: new Date() }]);
    console.log(`[${type.toUpperCase()}] ${message}`);
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const fixAllReagents = async () => {
    setFixing(true);
    setProgress(0);
    setResults([]);
    
    try {
      addResult('🔧 מתחיל תיקון כל הריאגנטים במערכת...', 'info');
      
      setCurrentAction('טוען ריאגנטים...');
      setProgress(10);
      
      // Get all reagents with server-side validation
      const allReagents = await Reagent.list();
      addResult(`📋 נמצאו ${allReagents.length} ריאגנטים`, 'info');
      
      if (allReagents.length === 0) {
        addResult('ℹ️ אין ריאגנטים במערכת', 'info');
        setProgress(100);
        setCurrentAction('הושלם!');
        return;
      }
      
      setProgress(20);
      
      // Check which reagents need fixing
      const reagentsToFix = allReagents.filter(r => 
        !r.catalog_item_id || !r.catalog_number
      );
      
      addResult(`🔍 זוהו ${reagentsToFix.length} ריאגנטים שנדרש תיקון`, reagentsToFix.length > 0 ? 'warning' : 'success');
      
      if (reagentsToFix.length === 0) {
        addResult('✅ כל הריאגנטים תקינים!', 'success');
        setProgress(100);
        setCurrentAction('הושלם!');
        return;
      }
      
      setProgress(30);
      
      // FIXED: Server-side batch update for better performance
      let fixedCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < reagentsToFix.length; i++) {
        const reagent = reagentsToFix[i];
        
        try {
          setCurrentAction(`מתקן ריאגנט: ${reagent.name}...`);
          
          // Get fresh data to ensure we have all current fields
          const currentReagent = await Reagent.get(reagent.id);
          
          // Generate missing fields
          const catalog_item_id = currentReagent.catalog_item_id || `FIXED_${currentReagent.id}_${Date.now()}`;
          const catalog_number = currentReagent.catalog_number || `CAT_${currentReagent.item_number || i + 1}_${currentReagent.supplier}`;
          
          // Create complete update data with ALL fields preserved
          const updateData = {
            // REQUIRED fields
            name: currentReagent.name,
            category: currentReagent.category,
            supplier: currentReagent.supplier,
            catalog_item_id: catalog_item_id,
            catalog_number: catalog_number,
            
            // Preserve ALL existing fields exactly as they are
            ...(currentReagent.item_number !== undefined && { item_number: currentReagent.item_number }),
            ...(currentReagent.notes && { notes: currentReagent.notes }),
            ...(currentReagent.total_quantity_all_batches !== undefined && { total_quantity_all_batches: currentReagent.total_quantity_all_batches }),
            ...(currentReagent.active_batches_count !== undefined && { active_batches_count: currentReagent.active_batches_count }),
            ...(currentReagent.nearest_expiry_date && { nearest_expiry_date: currentReagent.nearest_expiry_date }),
            ...(currentReagent.oldest_batch_date && { oldest_batch_date: currentReagent.oldest_batch_date }),
            ...(currentReagent.last_count_date && { last_count_date: currentReagent.last_count_date }),
            ...(currentReagent.last_transaction_date && { last_transaction_date: currentReagent.last_transaction_date }),
            ...(currentReagent.current_stock_status && { current_stock_status: currentReagent.current_stock_status }),
            ...(currentReagent.reservation_quantity !== undefined && { reservation_quantity: currentReagent.reservation_quantity }),
            ...(currentReagent.available_quantity !== undefined && { available_quantity: currentReagent.available_quantity }),
            ...(currentReagent.average_monthly_usage !== undefined && { average_monthly_usage: currentReagent.average_monthly_usage }),
            ...(currentReagent.months_of_stock !== undefined && { months_of_stock: currentReagent.months_of_stock }),
            ...(currentReagent.reorder_suggestion !== undefined && { reorder_suggestion: currentReagent.reorder_suggestion }),
            ...(currentReagent.suggested_order_quantity !== undefined && { suggested_order_quantity: currentReagent.suggested_order_quantity }),
            ...(currentReagent.custom_storage_location && { custom_storage_location: currentReagent.custom_storage_location }),
            ...(currentReagent.custom_min_stock !== undefined && { custom_min_stock: currentReagent.custom_min_stock }),
            ...(currentReagent.custom_max_stock !== undefined && { custom_max_stock: currentReagent.custom_max_stock }),
            ...(currentReagent.is_critical !== undefined && { is_critical: currentReagent.is_critical }),
            ...(currentReagent.alternative_reagents && { alternative_reagents: currentReagent.alternative_reagents })
          };
          
          // Update reagent with server-side validation
          await Reagent.update(reagent.id, updateData);
          
          addResult(`✅ תוקן: ${reagent.name} - נוספו שדות נדרשים`, 'success');
          fixedCount++;
          
          // Progress update
          const progressPercent = 30 + ((i + 1) / reagentsToFix.length) * 60;
          setProgress(progressPercent);
          
          // Rate limiting to prevent server overload
          await sleep(200);
          
        } catch (error) {
          console.error(`Error fixing reagent ${reagent.id}:`, error);
          addResult(`❌ שגיאה בתיקון ${reagent.name}: ${error.message}`, 'error');
          errorCount++;
        }
      }
      
      setProgress(95);
      
      // Final validation
      setCurrentAction('מוודא תקינות...');
      await sleep(500); // Give a moment for the user to see "מוודא תקינות..."
      const validatedReagents = await Reagent.list();
      const stillProblematic = validatedReagents.filter(r => !r.catalog_item_id || !r.catalog_number);
      
      if (stillProblematic.length === 0) {
        addResult(`🎉 תיקון הושלם בהצלחה! ${fixedCount} ריאגנטים תוקנו`, 'success');
      } else {
        addResult(`⚠️ תיקון חלקי: ${fixedCount} תוקנו, ${stillProblematic.length} עדיין בעייתיים`, 'warning');
        stillProblematic.forEach(r => {
          addResult(`   • ${r.name} (ID: ${r.id}) - חסר: ${!r.catalog_item_id ? 'catalog_item_id' : ''} ${!r.catalog_number ? 'catalog_number' : ''}`, 'warning');
        });
      }
      
      setProgress(100);
      setCurrentAction('הושלם!');
      
      toast({
        title: "תיקון ריאגנטים הושלם",
        description: `${fixedCount} ריאגנטים תוקנו בהצלחה${errorCount > 0 ? `, ${errorCount} נכשלו` : ''}`,
        variant: fixedCount > 0 && stillProblematic.length === 0 ? "default" : "destructive" // Set variant based on full success
      });
      
    } catch (error) {
      console.error("Error in fixAllReagents:", error);
      addResult(`❌ שגיאה קריטית: ${error.message}`, 'error');
      toast({
        title: "שגיאה בתיקון ריאגנטים",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setFixing(false);
    }
  };

  const checkReagents = async () => {
    setCurrentAction('בודק ריאגנטים...');
    setResults([]);
    
    try {
      const allReagents = await Reagent.list();
      const needFixing = allReagents.filter(r => !r.catalog_item_id || !r.catalog_number);
      
      addResult(`📊 סך הכל: ${allReagents.length} ריאגנטים`, 'info');
      addResult(`🔧 נדרש תיקון: ${needFixing.length} ריאגנטים`, needFixing.length > 0 ? 'warning' : 'success');
      
      if (needFixing.length > 0) {
        addResult(`📝 הריאגנטים שנדרש תיקון:`, 'info');
        needFixing.forEach(r => {
          addResult(`   • ${r.name} (ID: ${r.id}) - חסר: ${!r.catalog_item_id ? 'catalog_item_id' : ''} ${!r.catalog_number ? 'catalog_number' : ''}`, 'warning');
        });
      } else {
        addResult(`✅ כל הריאגנטים תקינים!`, 'success');
      }
      
    } catch (error) {
      addResult(`❌ שגיאה בבדיקה: ${error.message}`, 'error');
    }
    
    setCurrentAction('');
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wrench className="h-6 w-6 mr-3 text-blue-600" />
            תיקון ריאגנטים - שדות נדרשים
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              כלי זה מתקן ריאגנטים שחסרים להם השדות הנדרשים catalog_item_id ו-catalog_number,
              כדי שספירת המלאי תעבוד ללא שגיאות.
            </AlertDescription>
          </Alert>

          <div className="flex gap-4">
            <Button onClick={checkReagents} variant="outline" disabled={fixing}>
              <CheckCircle className="h-4 w-4 mr-2" />
              בדוק ריאגנטים
            </Button>
            
            <Button onClick={fixAllReagents} disabled={fixing}>
              {fixing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  מתקן...
                </>
              ) : (
                <>
                  <Wrench className="h-4 w-4 mr-2" />
                  תקן את כל הריאגנטים
                </>
              )}
            </Button>
          </div>

          {fixing && (
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
                <CardTitle className="text-lg">תוצאות</CardTitle>
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
