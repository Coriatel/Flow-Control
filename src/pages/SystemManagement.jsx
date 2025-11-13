
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Loader2, Database, AlertTriangle, CheckCircle, ShieldAlert, PlayCircle, Download, Bell, FileText, Trash2, Eye } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Reagent } from "@/api/entities";
import { runSummaryUpdates } from "@/api/functions";
import { exportAllCoas } from '@/api/functions';
import { createAnnualReminders } from ".@/api/functions/createAnnualReminders";
import { archiveOldData } from ".@/api/functions/archiveOldData"; // New import
import { Link } from 'react-router-dom'; // Assuming react-router-dom for Link

export default function SystemManagement() {
  const { toast } = useToast();
  const [loadingReset, setLoadingReset] = useState(false);
  const [loadingUpdates, setLoadingUpdates] = useState(false);
  const [result, setResult] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [coaExportLoading, setCoaExportLoading] = useState(false);
  const [coaExportResults, setCoaExportResults] = useState(null);
  const [reminderLoading, setReminderLoading] = useState(false);
  const [loadingArchive, setLoadingArchive] = useState(false);
  const [archiveResults, setArchiveResults] = useState(null);

  const handleRunSummaryUpdates = async () => {
    setLoadingUpdates(true);
    toast({
      title: "מתחיל עדכון סיכומים ברקע",
      description: "התהליך עשוי לקחת מספר דקות. אין צורך להישאר בדף זה.",
    });

    try {
      const response = await runSummaryUpdates();
      if (response.data && response.data.success) {
        toast({
          title: "תהליך העדכון הסתיים בהצלחה",
          description: `עודכנו ${response.data.updatedCounts} ספירות מלאי וטופלו ${response.data.updatedReagentsCount} ריאגנטים.`,
          variant: "default",
          duration: 7000,
        });
      } else {
        throw new Error(response.data?.error || "שגיאה לא ידועה בתהליך העדכון");
      }
    } catch (error) {
      console.error("Error running summary updates:", error);
      toast({
        title: "שגיאה בעדכון סיכומים",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingUpdates(false);
    }
  };

  const resetReagents = async () => {
    setLoadingReset(true);
    setResult(null);
    setShowConfirmDialog(false);
    toast({
        title: "מתחיל איפוס קטלוג...",
        description: "זה עלול לקחת מספר רגעים."
    });
    try {
        const existingReagents = await Reagent.list();
        for(const reagent of existingReagents) {
            await Reagent.delete(reagent.id);
        }
        
        toast({
            title: "איפוס קטלוג הושלם",
            description: "הקטלוג אופס. יש לייבא קטלוג עדכני.",
            variant: "default"
        });

    } catch (error) {
        toast({
            title: "שגיאה באיפוס הקטלוג",
            description: error.message,
            variant: "destructive"
        });
    } finally {
        setLoadingReset(false);
    }
  };

  const handleCoaExport = async () => {
    const yearInput = prompt("באיזו שנה תרצה לייצא COA? (לדוגמה: 2024)");
    if (yearInput === null) return;
    const year = parseInt(yearInput);
    if (isNaN(year) || year < 2020 || year > new Date().getFullYear()) {
      toast({ title: "שנה לא תקינה", description: "אנא הזן שנה תקינה (לדוגמה: 2024)", variant: "destructive" });
      return;
    }

    setCoaExportLoading(true);
    setCoaExportResults(null);
    try {
      const response = await exportAllCoas({ year });
      if (response.data && response.data.success) {
        setCoaExportResults(response.data.results);
        toast({ title: "ייצוא COA הושלם!", description: `נוצרו ${response.data.results?.length || 0} קבצים חודשיים.`, variant: "default", duration: 8000 });
      } else {
        throw new Error(response.data?.error || "תגובה לא תקינה מהשרת");
      }
    } catch (error) {
      toast({ title: "ייצוא COA נכשל", description: error.message || "אירעה שגיאה בלתי צפויה.", variant: "destructive", duration: 10000 });
    } finally {
      setCoaExportLoading(false);
    }
  };

  const handleCreateAnnualReminder = async () => {
    const currentYear = new Date().getFullYear();
    if (!window.confirm(`האם ליצור תזכורת לייצוא שנתי של COA לשנת ${currentYear - 1}?`)) return;
    
    setReminderLoading(true);
    try {
      const response = await createAnnualReminders({ year: currentYear, type: 'COA_EXPORT' });
      if (response.data && response.data.success) {
        toast({ title: "פעולה הושלמה", description: response.data.message, variant: "default", duration: 6000 });
      } else {
        throw new Error(response.data?.error || "תגובה לא תקינה מהשרת");
      }
    } catch (error) {
      toast({ title: "יצירת תזכורת נכשלה", description: error.message, variant: "destructive" });
    } finally {
      setReminderLoading(false);
    }
  };

  // Updated handleArchiveOldData function
  const handleArchiveOldData = async () => {
    const cutoffInput = prompt("מאיזה תאריך לאחור לבצע ארכוב? (פורמט: YYYY-MM-DD)\nלדוגמה: 2022-01-01");
    if (!cutoffInput) return;
    
    const confirmArchive = window.confirm(
      `האם אתה בטוח שברצונך לבצע ארכוב של נתונים מלפני ${cutoffInput}?\n` +
      "פעולה זו תעביר נתונים ישנים לארכיון ותמחק אותם מהטבלאות הפעילות.\n" +
      "לחץ OK לביצוע ארכוב אמיתי, או Cancel לביצוע בדיקה בלבד."
    );
    
    const dryRun = !confirmArchive;
    
    setLoadingArchive(true);
    setArchiveResults(null);
    
    try {
      const response = await archiveOldData({ 
        cutoffDate: cutoffInput,
        dryRun,
        archiveType: 'full'
      });
      
      if (response.data && response.data.success) {
        setArchiveResults(response.data); // Set the full response data
        toast({
          title: dryRun ? "בדיקת ארכוב הושלמה" : "ארכוב הושלם בהצלחה",
          description: `עובדו ${response.data.totalItemsProcessed} רשומות. ${dryRun ? '(בדיקה בלבד - לא בוצעו שינויים)' : ''}`,
          variant: "default",
          duration: 8000
        });
      } else {
        throw new Error(response.data?.error || "שגיאה בתהליך הארכוב");
      }
    } catch (error) {
      console.error("Archive process failed:", error);
      toast({
        title: "שגיאה בתהליך הארכוב",
        description: error.message,
        variant: "destructive",
        duration: 10000
      });
    } finally {
      setLoadingArchive(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      <h1 className="text-2xl font-bold mb-6">ניהול מערכת ונתונים</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-blue-500 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-4">
              <PlayCircle className="h-10 w-10 text-blue-500" />
              <div>
                <CardTitle className="text-blue-700">פעולות מערכת</CardTitle>
                <CardDescription>
                  הפעלת תהליכים יזומים לעיבוד וניהול נתונים.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                יש להריץ עדכון סיכומים לאחר ספירת מלאי כדי לרענן את הדשבורד.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button onClick={handleRunSummaryUpdates} disabled={loadingUpdates} className="bg-blue-600 hover:bg-blue-700">
              {loadingUpdates ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <PlayCircle className="h-4 w-4 ml-2" />}
              הפעל עדכון סיכומים
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-green-500 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-4">
              <FileText className="h-10 w-10 text-green-500" />
              <div>
                <CardTitle className="text-green-700">ייצוא וארכיון</CardTitle>
                <CardDescription>
                  פעולות מתקדמות לייצוא וגיבוי של נתונים מהמערכת.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button onClick={handleCoaExport} disabled={coaExportLoading} className="bg-green-600 hover:bg-green-700">
                {coaExportLoading ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Download className="h-4 w-4 ml-2" />}
                ייצוא COA שנתי
              </Button>
              <Button onClick={handleCreateAnnualReminder} disabled={reminderLoading} variant="outline">
                {reminderLoading ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Bell className="h-4 w-4 ml-2" />}
                צור תזכורת שנתית
              </Button>
            </div>
            {coaExportResults && coaExportResults.length > 0 && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg max-h-48 overflow-y-auto">
                <h4 className="font-medium text-green-800 mb-2">קבצים להורדה:</h4>
                <div className="space-y-2">
                  {coaExportResults.map((file, index) => (
                    <a href={file.url} key={index} download target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-white p-2 rounded border hover:bg-gray-50">
                      <span className="font-medium text-sm">{file.month}</span>
                      <Download className="h-4 w-4 text-green-600" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* New Archive Management Card */}
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-purple-800">
              <Database className="h-6 w-6 ml-3" />
              ניהול ארכיון ואחסון קר
            </CardTitle>
            <CardDescription>
              ארכוב אוטומטי של נתונים ישנים לשיפור ביצועי המערכת
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                תהליך הארכוב מעביר נתונים ישנים לאחסון קר ומוחק אותם מהטבלאות הפעילות.
                נתונים ארכיוניים ניתנים לשחזור דרך מציג הארכיון.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                <strong>מדיניות ארכוב:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1 pr-4"> {/* Added pr-4 for RTL list */}
                  <li>ספירות מלאי: אחרי שנתיים</li>
                  <li>תנועות מלאי: אחרי 3 שנים</li>
                  <li>יומני פגי תוקף: אחרי 5 שנים (רגולטורי)</li>
                  <li>משלוחים מושלמים: אחרי שנתיים</li>
                  <li>טיוטות לא פעילות: אחרי 6 חודשים (מחיקה)</li>
                </ul>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-3">
            <Button
              onClick={handleArchiveOldData}
              disabled={loadingArchive}
              variant="outline"
              className="flex-1 border-purple-400 text-purple-700 hover:bg-purple-50"
            >
              {loadingArchive ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  מבצע ארכוב...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 ml-2" />
                  בצע ארכוב נתונים
                </>
              )}
            </Button>
            <Button asChild variant="outline" className="border-purple-400 text-purple-700 hover:bg-purple-50">
              <Link to="/archived-data"> {/* Using a placeholder path */}
                <Eye className="h-4 w-4 ml-2" />
                צפה בארכיון
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Archive Results Display */}
      {archiveResults && (
        <Card className="mt-6 border-green-200 bg-green-50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-green-800">תוצאות תהליך הארכוב</CardTitle>
            <CardDescription className="text-green-700">
              {archiveResults.dryRun ? "זוהי תוצאת בדיקה בלבד. לא בוצעו שינויים בפועל." : "הארכוב הושלם בהצלחה."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {archiveResults.archiveResults.archivedCounts}
                </div>
                <div className="text-sm text-gray-600">ספירות מלאי</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {archiveResults.archiveResults.archivedTransactions}
                </div>
                <div className="text-sm text-gray-600">תנועות מלאי</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {archiveResults.archiveResults.archivedExpiredLogs}
                </div>
                <div className="text-sm text-gray-600">יומני פגי תוקף</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {archiveResults.archiveResults.archivedShipments}
                </div>
                <div className="text-sm text-gray-600">משלוחים</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {archiveResults.archiveResults.archivedDeliveries}
                </div>
                <div className="text-sm text-gray-600">קליטות</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {archiveResults.archiveResults.deletedDrafts}
                </div>
                <div className="text-sm text-gray-600">טיוטות נמחקו</div>
              </div>
            </div>
            
            {archiveResults.dryRun && (
              <Alert className="mt-4 border-blue-200 bg-blue-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-blue-800">
                  <strong>זוהי בדיקה בלבד!</strong> לא בוצעו שינויים במערכת. 
                  להפעלה אמיתית, אשר את הפעולה בחלון הבא.
                </AlertDescription>
              </Alert>
            )}
            
            {archiveResults.archiveResults.errors && archiveResults.archiveResults.errors.length > 0 && (
              <Alert className="mt-4" variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>שגיאות בתהליך:</strong>
                  <ul className="list-disc list-inside mt-1 pr-4"> {/* Added pr-4 for RTL list */}
                    {archiveResults.archiveResults.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="max-w-4xl mt-6 border-red-500 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Trash2 className="h-10 w-10 text-red-500" />
            <div>
              <CardTitle className="text-red-700">איפוס קטלוג הריאגנטים</CardTitle>
              <CardDescription>
                פעולה זו מוחקת את כל הריאגנטים הקיימים. יש להשתמש רק לצורך ייבוא מחדש.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>אזהרה:</strong> זוהי פעולה הרסנית ולא ניתן לבטל אותה. השתמש באפשרות זו רק במקרה של בעיות חמורות בנתונים.
            </AlertDescription>
          </Alert>
          {result && (
              <Alert variant={result.type === 'success' ? 'default' : 'destructive'} className="my-4">
                <AlertDescription>{result.message}</AlertDescription>
              </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button variant="destructive" onClick={() => setShowConfirmDialog(true)} disabled={loadingReset}>
            {loadingReset ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : "התחל איפוס"}
          </Button>
        </CardFooter>
      </Card>
      
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-right">אישור סופי לפעולה הרסנית</DialogTitle>
            <DialogDescription className="text-right pt-2">
              אתה עומד למחוק את <strong>כל</strong> קטלוג הריאגנטים.
              <br/><br/>
              <strong>האם אתה בטוח שברצונך להמשיך?</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="justify-start gap-2 pt-4">
            <Button onClick={resetReagents} variant="destructive">
              כן, אני מאשר את האיפוס
            </Button>
            <DialogClose asChild><Button variant="outline">בטל</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
