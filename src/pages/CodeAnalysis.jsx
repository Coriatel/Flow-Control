import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CodeAnalysis() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">ניתוח קוד - מערכת ניהול מלאי בנק דם</h1>
      
      <Tabs defaultValue="structure" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="structure">מבנה הקוד</TabsTrigger>
          <TabsTrigger value="issues">בעיות ספציפיות</TabsTrigger>
          <TabsTrigger value="recommendations">המלצות</TabsTrigger>
        </TabsList>
        
        <TabsContent value="structure">
          <Card>
            <CardHeader>
              <CardTitle>מבנה הקוד וקבצים מרכזיים</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4 -mr-4">
                <h3 className="text-xl font-semibold mb-4">ישויות (Entities)</h3>
                <ol className="list-decimal list-inside mb-6 space-y-4">
                  <li className="font-bold">entities/Reagent.json
                    <ul className="list-disc list-inside mr-6 mt-1">
                      <li>תפקיד: הגדרת מבנה נתונים של פריטי המלאי</li>
                      <li>שדות מרכזיים: name, category, supplier, batch_number, expiry_date, quantity</li>
                      <li>תקין</li>
                    </ul>
                  </li>
                  <li className="font-bold">entities/InventoryTransaction.json
                    <ul className="list-disc list-inside mr-6 mt-1">
                      <li>תפקיד: תיעוד פעולות במלאי</li>
                      <li>שדות מרכזיים: reagent_id, transaction_type, quantity, batch_number, expiry_date</li>
                      <li>תקין</li>
                    </ul>
                  </li>
                  <li className="font-bold">entities/InventoryCountDraft.json
                    <ul className="list-disc list-inside mr-6 mt-1">
                      <li>תפקיד: שמירת טיוטות ספירות מלאי</li>
                      <li>שדות מרכזיים: start_date, last_update, update_dates, batch_entries, completed</li>
                      <li>תקין</li>
                    </ul>
                  </li>
                </ol>

                <h3 className="text-xl font-semibold mb-4">דפים (Pages)</h3>
                <ol className="list-decimal list-inside mb-6 space-y-4">
                  <li className="font-bold">pages/Dashboard.js
                    <ul className="list-disc list-inside mr-6 mt-1">
                      <li>תפקיד: דף הבית של המערכת</li>
                      <li>פונקציונליות: הצגת התראות תפוגה, פעולות מהירות, פעילות אחרונה</li>
                      <li>בעיות: אין שגיאות סינטקס, אך פעילות אחרונה לא מציגה מידע אמיתי (placeholder)</li>
                    </ul>
                  </li>
                  <li className="font-bold">pages/InventoryCount.js
                    <ul className="list-disc list-inside mr-6 mt-1">
                      <li>תפקיד: ממשק לספירת מלאי</li>
                      <li>פונקציונליות: חיפוש פריטים, סינון, עדכון כמויות ותאריכים, שמירה והפקת PDF</li>
                      <li>בעיות: הפונקציה generatePDF לא מיישמת במדויק את הפורמט הנדרש, וחסר מימוש מלא לשמירת טיוטות</li>
                    </ul>
                  </li>
                  <li className="font-bold">pages/SecuritySettings.js
                    <ul className="list-disc list-inside mr-6 mt-1">
                      <li>תפקיד: ניהול הגדרות אבטחה</li>
                      <li>פונקציונליות: שינוי רמת אבטחה, איפוס זיהוי מכשיר</li>
                      <li>בעיות: לא מוצגות שגיאות סינטקס, פונקציונליות תקינה</li>
                    </ul>
                  </li>
                </ol>

                <h3 className="text-xl font-semibold mb-4">רכיבים (Components)</h3>
                <ol className="list-decimal list-inside mb-6 space-y-4">
                  <li className="font-bold">components/inventory/ReagentItem.jsx
                    <ul className="list-disc list-inside mr-6 mt-1">
                      <li>תפקיד: הצגת פריט בודד</li>
                      <li>פונקציונליות: תצוגת פרטי הפריט וממשק לעדכון כמות ותאריך תפוגה</li>
                      <li>בעיות: אין שגיאות סינטקס</li>
                    </ul>
                  </li>
                  <li className="font-bold">components/inventory/BatchEntry.jsx
                    <ul className="list-disc list-inside mr-6 mt-1">
                      <li>תפקיד: טופס להזנת נתוני אצווה</li>
                      <li>פונקציונליות: עדכון מספר אצווה, תאריך תפוגה וכמות, אפשרות להסרה</li>
                      <li>בעיות: אין שגיאות סינטקס</li>
                    </ul>
                  </li>
                  <li className="font-bold">components/security/SecurityMonitor.jsx
                    <ul className="list-disc list-inside mr-6 mt-1">
                      <li>תפקיד: ניטור אבטחה</li>
                      <li>פונקציונליות: זיהוי מכשיר, התראות אבטחה</li>
                      <li>בעיות: גורם להתראות שווא בסביבת פיתוח/preview</li>
                    </ul>
                  </li>
                  <li className="font-bold">components/ui/use-toast.js
                    <ul className="list-disc list-inside mr-6 mt-1">
                      <li>תפקיד: הצגת הודעות למשתמש</li>
                      <li>פונקציונליות: הצגת הודעות קופצות (toast)</li>
                      <li>בעיות: לא מוצגות שגיאות סינטקס</li>
                    </ul>
                  </li>
                </ol>

                <h3 className="text-xl font-semibold mb-4">Layout</h3>
                <ol className="list-decimal list-inside">
                  <li className="font-bold">layout.js
                    <ul className="list-disc list-inside mr-6 mt-1">
                      <li>תפקיד: מבנה כללי של האפליקציה</li>
                      <li>פונקציונליות: סרגל צד, ניווט, התראות, ניטור אבטחה</li>
                      <li>בעיות: כוללת לוגיקת אבטחה שעלולה להפריע בסביבת פיתוח</li>
                    </ul>
                  </li>
                </ol>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="issues">
          <Card>
            <CardHeader>
              <CardTitle>ניתוח בעיות ספציפיות</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4 -mr-4">
                <h3 className="text-xl font-semibold mb-4">1. SecurityMonitor גורם להתראות שווא</h3>
                <div className="mb-6">
                  <div className="bg-gray-100 p-4 rounded-md mb-4 font-mono text-sm">
                    <pre>
{`// בעיה בקובץ components/security/SecurityMonitor.jsx
// זיהוי מסגרות (iframe) גורם להתראות בסביבת preview

const detectFraming = () => {
  if (window !== window.top) {
    showSecurityAlert(
      "התראת אבטחה",
      "האפליקציה מוצגת במסגרת לא מאושרת"
    );
  }
};`}
                    </pre>
                  </div>
                  
                  <p className="mb-2">תיקון: הוספת בדיקה אם אנחנו בסביבת preview של base44:</p>
                  
                  <div className="bg-gray-100 p-4 rounded-md font-mono text-sm">
                    <pre>
{`const detectFraming = () => {
  // בסביבת פיתוח (preview) נאפשר הרצה ב-iframe
  if (window.location.hostname.includes('base44.io')) {
    return;
  }
  
  if (window !== window.top) {
    showSecurityAlert(
      "התראת אבטחה",
      "האפליקציה מוצגת במסגרת לא מאושרת"
    );
  }
};`}
                    </pre>
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold mb-4">2. הפקת PDF לא תואמת את הפורמט הנדרש</h3>
                <div className="mb-6">
                  <p>הפונקציה <code>generatePDF</code> בדף InventoryCount לא תואמת את המבנה המדויק של הטופס הנדרש.</p>
                  <p className="mt-2">תיקון: עדכון הפונקציה <code>generatePDF</code> לתמוך בפורמט המדויק, כולל:</p>
                  <ul className="list-disc list-inside mr-6 mt-2">
                    <li>הכותרות המדויקות</li>
                    <li>סידור לפי ספקים וקטגוריות</li>
                    <li>מספור עמודים נכון</li>
                    <li>תאריכים בפורמט המתאים</li>
                    <li>שדות למילוי הנדרשים</li>
                  </ul>
                </div>
                
                <h3 className="text-xl font-semibold mb-4">3. חסר מימוש לשמירת טיוטות ספירת מלאי</h3>
                <div className="mb-6">
                  <p>הלוגיקה לשמירת ואחזור טיוטות ספירת מלאי לא מושלמת.</p>
                  <p className="mt-2">תיקון: השלמת הפונקציות הבאות בדף InventoryCount:</p>
                  <ul className="list-disc list-inside mr-6 mt-2">
                    <li><code>loadDraft</code> - טעינת טיוטה קיימת</li>
                    <li><code>updateDraft</code> - עדכון טיוטה</li>
                    <li>הוספת דיאלוג לבחירה בין המשך עבודה על טיוטה קיימת או התחלה מחדש</li>
                  </ul>
                </div>
                
                <h3 className="text-xl font-semibold mb-4">4. חסר מימוש לקליטת משלוחים וניהול הזמנות</h3>
                <div>
                  <p>הדפים NewDelivery ו-Orders נזכרים במערכת אך לא קיימים או לא הושלמו.</p>
                  <p className="mt-2">תיקון: פיתוח דפים אלה, כולל:</p>
                  <ul className="list-disc list-inside mr-6 mt-2">
                    <li>ממשק לקליטת משלוחים</li>
                    <li>עדכון המלאי בהתאם למשלוחים שהתקבלו</li>
                    <li>ממשק ליצירת הזמנות ומעקב אחריהן</li>
                    <li>עדכון המלאי בהתאם למשיכות</li>
                  </ul>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="recommendations">
          <Card>
            <CardHeader>
              <CardTitle>המלצות כלליות</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-4">
                <li className="font-bold">תיקון SecurityMonitor: 
                  <p className="mt-1">התאמה לסביבת פיתוח/preview כדי למנוע התראות שווא</p>
                </li>
                <li className="font-bold">השלמת מימוש PDF: 
                  <p className="mt-1">התאמה לפורמט המדויק הנדרש לפי דרישות המשתמש</p>
                </li>
                <li className="font-bold">השלמת ניהול טיוטות: 
                  <p className="mt-1">מימוש מלא של שמירת ואחזור טיוטות של ספירות מלאי</p>
                </li>
                <li className="font-bold">פיתוח NewDelivery ו-Orders: 
                  <p className="mt-1">השלמת הפונקציונליות החסרה לניהול מלא של תהליכי העבודה</p>
                </li>
                <li className="font-bold">שיפור אינטגרציה: 
                  <p className="mt-1">הידוק החיבור בין הישויות והפונקציונליות השונות במערכת</p>
                </li>
              </ol>
              
              <div className="mt-8 p-4 bg-gray-50 rounded-md">
                <p className="font-bold">סיכום:</p>
                <p className="mt-2">
                  הקוד בכללותו מאורגן היטב, אך נדרשות השלמות ותיקונים קלים להשגת הפונקציונלי [...]
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}