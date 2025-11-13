
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Trash2, Database, CheckCircle, AlertTriangle, RefreshCw, Clock, Shuffle } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

// Import all entities that need cleanup
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

import { cleanupOperations } from ".@/api/functions/cleanupOperations";

export default function CleanupData() {
  const { toast } = useToast();
  const [cleaning, setCleaning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentAction, setCurrentAction] = useState('');
  const [results, setResults] = useState([]);
  const [serverProcessing, setServerProcessing] = useState(false);
  const [confirmAction, setConfirmAction] = useState(false); // State for the confirmation checkbox

  const addResult = (message, type = 'info') => {
    setResults(prev => [...prev, { message, type, timestamp: new Date() }]);
    console.log(`[${type.toUpperCase()}] ${message}`);
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const performCompleteReset = async () => {
    if (!confirmAction) {
      toast({
        title: "נדרש אישור",
        description: "יש לאשר את פעולת הניקוי לפני ביצועה",
        variant: "destructive"
      });
      return;
    }

    setCleaning(true);
    setProgress(0);
    setResults([]);
    
    try {
      addResult('🧹 מתחיל איפוס מבוקר של המערכת...', 'info');
      
      // Step 1: Check what exists first
      setCurrentAction('בודק מה קיים במערכת...');
      setProgress(5);
      
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

      // First pass - count items
      const entityCounts = {};
      for (const { entity, name } of entitiesToClean) {
        if (!cleaning) return; // Allow early exit if stop button is pressed
        try {
          setCurrentAction(`בודק ${name}...`);
          const items = await entity.list('', 1); // Get just 1 item to check if exists
          entityCounts[name] = items ? items.length : 0; // Will be 0 or 1 based on list('', 1)
          if (items && items.length > 0) {
            addResult(`📊 ${name}: נמצאו פריטים לבדיקה`, 'info');
          } else {
            addResult(`📊 ${name}: לא נמצאו פריטים`, 'info');
          }
          await sleep(300);
        } catch (error) {
          addResult(`⚠️ לא ניתן לבדוק ${name}: ${error.message}`, 'warning');
          entityCounts[name] = 0;
        }
      }
      
      setProgress(20);
      
      // Second pass - delete in smaller, safer batches
      let progressStep = 0;
      const totalSteps = entitiesToClean.length;
      
      for (const { entity, name } of entitiesToClean) {
        if (!cleaning) return; // Allow early exit if stop button is pressed
        try {
          setCurrentAction(`מוחק ${name}...`);
          
          let deletedCount = 0;
          let hasMore = true;
          
          while (hasMore && cleaning) { // Ensure cleaning is still true
            try {
              // Get small batch
              const items = await entity.list('', 10); // Max 10 items at a time
              
              if (!items || items.length === 0) {
                hasMore = false;
                break;
              }
              
              // Delete items one by one with delays
              for (const item of items) {
                if (!cleaning) { hasMore = false; break; } // Allow early exit
                try {
                  await entity.delete(item.id);
                  deletedCount++;
                  await sleep(500); // Wait 500ms between each deletion
                } catch (deleteError) {
                  console.warn(`Failed to delete ${name} item ${item.id}:`, deleteError);
                  addResult(`⚠️ נכשל מחיקת פריט ב${name} (ID: ${item.id}): ${deleteError.message}`, 'warning');
                  // Continue with next item even if one fails
                }
              }
              
              addResult(`🗑️ ${name}: נמחקו ${deletedCount} פריטים עד כה`, 'info');
              
              // If we got less than 10, we're probably done
              if (items.length < 10) {
                hasMore = false;
              }
              
              await sleep(1000); // Wait 1 second between batches
              
            } catch (listError) {
              addResult(`⚠️ בעיה בטעינת פריטים מ${name}: ${listError.message}`, 'warning');
              hasMore = false;
            }
          }
          
          if (cleaning) { // Only show success if not stopped
            addResult(`✅ ${name}: הושלם (נמחקו ${deletedCount} פריטים)`, 'success');
          }
          
        } catch (error) {
          addResult(`❌ בעיה קריטית במחיקת ${name}: ${error.message}`, 'error');
        }
        
        if (!cleaning) break; // Break from outer loop if stopped

        progressStep++;
        setProgress(20 + (progressStep / totalSteps) * 70);
        await sleep(2000); // Wait 2 seconds between entities
      }
      
      if (!cleaning) {
        addResult('🛑 התהליך הופסק על ידי המשתמש לפני סיום', 'warning');
        toast({
          title: "תהליך הופסק",
          description: "האיפוס הופסק על ידי המשתמש",
          variant: "default"
        });
        return;
      }

      setProgress(95);
      setCurrentAction('מסיים...');
      await sleep(1000);
      
      addResult('🎯 איפוס הושלם!', 'success');
      addResult('📋 המערכת מוכנה עכשיו לבניית קטלוג חדש', 'info');
      
      setProgress(100);
      setCurrentAction('הושלם בהצלחה!');
      
      toast({
        title: "איפוס הושלם!",
        description: "המערכת נקייה ומוכנה לקטלוג חדש",
        variant: "default"
      });
      
    } catch (error) {
      addResult(`❌ שגיאה קריטית: ${error.message}`, 'error');
      toast({
        title: "שגיאה באיפוס",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setCleaning(false);
    }
  };

  const stopCleanup = () => {
    setCleaning(false);
    setCurrentAction('הופסק על ידי המשתמש');
    addResult('🛑 התהליך הופסק על ידי המשתמש', 'warning');
    toast({
      title: "תהליך הופסק",
      description: "האיפוס הופסק על ידי המשתמש",
      variant: "default"
    });
  };

  // NEW: Server-side cleanup operations
  const runServerCleanup = async (operation, options = {}) => {
    if (!confirmAction) {
      toast({
        title: "נדרש אישור",
        description: "יש לאשר את פעולת הניקוי לפני ביצועה",
        variant: "destructive"
      });
      return;
    }

    setServerProcessing(true);
    try {
      console.log(`🧹 Running server cleanup: ${operation}`);
      
      const response = await cleanupOperations({
        operation,
        options
      });
      
      if (response.data && response.data.success) {
        const { result } = response.data;
        
        toast({
          title: "פעולת ניקוי הושלמה",
          description: `${response.data.message}. ${JSON.stringify(result)}`,
          variant: "default",
          duration: 8000
        });
        
        // Refresh data after cleanup
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(response.data?.message || "שגיאה בפעולת הניקוי");
      }
    } catch (error) {
      console.error("Error in server cleanup:", error);
      toast({
        title: "שגיאה בפעולת ניקוי",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setServerProcessing(false);
    }
  };

  return (
    <div className="p-6" dir="rtl">
      <h1 className="text-3xl font-bold mb-6">ניקוי ואיפוס נתונים - גרסה משופרת</h1>
      
      <Alert className="mb-6 bg-red-50 border-red-300">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong>זהירות:</strong> פעולה זו תמחק את כל הנתונים במערכת ללא אפשרות שחזור!
        </AlertDescription>
      </Alert>

      {/* Confirmation Checkbox */}
      <div className="mb-4 flex items-center space-x-2 space-x-reverse">
        <input
          type="checkbox"
          id="confirm_cleanup"
          checked={confirmAction}
          onChange={(e) => setConfirmAction(e.target.checked)}
          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
        />
        <label htmlFor="confirm_cleanup" className="text-sm font-medium text-gray-900">
          אני מבין שזו פעולה בלתי הפיכה ואני מאשר את ביצועה
        </label>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* NEW: Server-side cleanup operations Card */}
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-700">
              <Clock className="ml-2 h-5 w-5" />
              פעולות ניקוי אוטומטיות (שרת)
            </CardTitle>
            <CardDescription>
              פעולות ניקוי מתקדמות שרצות בצד השרת למהירות מקסימלית
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button
                onClick={() => runServerCleanup('remove_old_drafts', { daysOld: 30 })}
                disabled={!confirmAction || serverProcessing}
                variant="outline"
                className="w-full justify-start"
              >
                {serverProcessing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                מחיקת טיוטות ישנות (30+ ימים)
              </Button>

              <Button
                onClick={() => runServerCleanup('cleanup_expired_batches', { daysExpired: 90, action: 'mark_consumed' })}
                disabled={!confirmAction || serverProcessing}
                variant="outline"
                className="w-full justify-start"
              >
                {serverProcessing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <AlertTriangle className="h-4 w-4 mr-2" />
                )}
                ניקוי אצוות פגות תוקף (90+ ימים)
              </Button>

              <Button
                onClick={() => runServerCleanup('cleanup_empty_records')}
                disabled={!confirmAction || serverProcessing}
                variant="outline"
                className="w-full justify-start"
              >
                {serverProcessing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Database className="h-4 w-4 mr-2" />
                )}
                ניקוי רשומות ריקות
              </Button>

              <Button
                onClick={() => runServerCleanup('merge_duplicate_reagents', { dryRun: false })}
                disabled={!confirmAction || serverProcessing}
                variant="outline"
                className="w-full justify-start"
              >
                {serverProcessing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Shuffle className="h-4 w-4 mr-2" />
                )}
                איחוד ריאגנטים כפולים
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Existing: Manual Full System Reset Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <Trash2 className="h-6 w-6 mr-2" />
              איפוס מלא ושיטתי (פעולה מקומית)
            </CardTitle>
            <CardDescription>
              פעולה זו מוחקת את כל הנתונים הקיימים במערכת באופן יסודי.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">מה הפעולה כוללת:</h4>
                <ul className="text-sm space-y-1">
                  <li>• מחיקת כל התנועות, ההזמנות והמשלוחים</li>
                  <li>• מחיקת כל האצוות והריאגנטים</li>
                  <li>• מחיקת הקטלוג הקיים</li>
                  <li>• ניקוי כל הטיוטות והספירות</li>
                  <li>• הכנת בסיס נתונים נקי</li>
                </ul>
              </div>
              
              {cleaning && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                    <span className="text-lg font-medium">{currentAction}</span>
                  </div>
                  <Progress value={progress} className="w-full h-3" />
                  <p className="text-sm text-gray-600">{progress}% הושלם</p>
                </div>
              )}
              
              <div className="pt-4 flex gap-4">
                <Button 
                  onClick={performCompleteReset}
                  disabled={cleaning || !confirmAction}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {cleaning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      מבצע איפוס...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      התחל איפוס מבוקר
                    </>
                  )}
                </Button>
                
                {cleaning && (
                  <Button 
                    onClick={stopCleanup}
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    עצור איפוס
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {results.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>התקדמות האיפוס</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-md text-sm ${
                    result.type === 'success' ? 'bg-green-50 text-green-800 border-l-4 border-green-400' :
                    result.type === 'error' ? 'bg-red-50 text-red-800 border-l-4 border-red-400' :
                    result.type === 'warning' ? 'bg-yellow-50 text-yellow-800 border-l-4 border-yellow-400' :
                    'bg-blue-50 text-blue-800 border-l-4 border-blue-400'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span>{result.message}</span>
                    <span className="text-xs opacity-70">
                      {result.timestamp.toLocaleTimeString('he-IL')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Alert className="mt-6 bg-blue-50 border-blue-200">
        <Database className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>לאחר האיפוס:</strong> עבור לדף "Backend Functions" ליצירת קטלוג חדש ונקי מהמסמך המקורי.
        </AlertDescription>
      </Alert>
    </div>
  );
}
