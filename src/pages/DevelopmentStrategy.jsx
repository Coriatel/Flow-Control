import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export default function DevelopmentStrategy() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">אסטרטגיית פיתוח - מערכת ניהול מלאי מתקדמת</h1>
      
      <Tabs defaultValue="overview" className="mb-8">
        <TabsList className="mb-4 grid grid-cols-5">
          <TabsTrigger value="overview">סקירה כללית</TabsTrigger>
          <TabsTrigger value="delivery">קליטת משלוחים</TabsTrigger>
          <TabsTrigger value="consumption">חישוב צריכה</TabsTrigger>
          <TabsTrigger value="orders">ניהול הזמנות</TabsTrigger>
          <TabsTrigger value="future">פיתוחים עתידיים</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>מפת דרכים כללית - שלבי הפיתוח</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-bold text-green-700">שלב 1 - קליטת משלוחים חדשים</h3>
                  <p className="text-sm text-gray-600">יצירת ממשק לקליטת משלוחים עם התחברות להזמנות קיימות</p>
                  <Badge className="mt-2 bg-green-100 text-green-800">עדיפות גבוהה</Badge>
                </div>
                
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-bold text-blue-700">שלב 2 - חישוב צריכה ממוצעת</h3>
                  <p className="text-sm text-gray-600">מנוע חישוב צריכה חודשית עם התחשבות במשלוחים וספירות</p>
                  <Badge className="mt-2 bg-blue-100 text-blue-800">עדיפות גבוהה</Badge>
                </div>
                
                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="font-bold text-purple-700">שלב 3 - ניהול הזמנות מתקדם</h3>
                  <p className="text-sm text-gray-600">מערכת הזמנות עם מעקב מסגרות ויתרות פתוחות</p>
                  <Badge className="mt-2 bg-purple-100 text-purple-800">עדיפות בינונית</Badge>
                </div>
                
                <div className="border-l-4 border-yellow-500 pl-4">
                  <h3 className="font-bold text-yellow-700">שלב 4 - OCR ו-PDF אוטומטי</h3>
                  <p className="text-sm text-gray-600">זיהוי אוטומטי של תעודות משלוח וטפסי ספירה</p>
                  <Badge className="mt-2 bg-yellow-100 text-yellow-800">פיתוח עתידי</Badge>
                </div>
                
                <div className="border-l-4 border-gray-500 pl-4">
                  <h3 className="font-bold text-gray-700">שלב 5 - התאמה אישית למשתמשים</h3>
                  <p className="text-sm text-gray-600">ממשק להגדרת קטגוריות וריאגנטים בהתאמה אישית</p>
                  <Badge className="mt-2 bg-gray-100 text-gray-800">פיתוח עתידי</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="delivery">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>מודול קליטת משלוחים - מפרט טכני</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4 -mr-4">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">1. יצירת ישויות חדשות</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h4 className="font-semibold mb-2">Delivery (תעודת משלוח)</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>delivery_number (מספר תעודת משלוח)</li>
                        <li>order_number (מספר הזמנה/דרישה)</li>
                        <li>supplier (ספק)</li>
                        <li>delivery_date (תאריך קבלת משלוח)</li>
                        <li>status (פתוח/סגור/מעובד)</li>
                        <li>notes (הערות)</li>
                        <li>document_url (קישור לתמונת תעודה)</li>
                      </ul>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h4 className="font-semibold mb-2">DeliveryItem (פריט במשלוח)</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>delivery_id (קישור לתעודת משלוח)</li>
                        <li>reagent_id (קישור לריאגנט)</li>
                        <li>quantity_received (כמות שהתקבלה)</li>
                        <li>batch_number (מספר אצווה)</li>
                        <li>expiry_date (תאריך תפוגה)</li>
                        <li>unit_price (מחיר ליחידה - אופציונלי)</li>
                      </ul>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h4 className="font-semibold mb-2">Order (הזמנה/דרישה)</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>order_number_temp (מספר דרישה זמני)</li>
                        <li>order_number_permanent (מספר דרישה קבוע)</li>
                        <li>purchase_order_number (מספר הזמנה SAP)</li>
                        <li>supplier (ספק)</li>
                        <li>order_date (תאריך הזמנה)</li>
                        <li>status (זמני/קבוע/מאושר/סגור)</li>
                        <li>order_type (רגיל/מסגרת/חירום)</li>
                      </ul>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h4 className="font-semibold mb-2">OrderItem (פריט בהזמנה)</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>order_id (קישור להזמנה)</li>
                        <li>reagent_id (קישור לריאגנט)</li>
                        <li>quantity_ordered (כמות מוזמנת)</li>
                        <li>quantity_received (כמות שהתקבלה)</li>
                        <li>quantity_remaining (יתרה פתוחה)</li>
                        <li>expected_delivery_date (תאריך משלוח צפוי)</li>
                      </ul>
                    </div>
                    
                    <h3 className="text-xl font-semibold mt-6">2. ממשק משתמש - דף קליטת משלוח</h3>
                    <div className="bg-blue-50 p-4 rounded-md">
                      <h4 className="font-semibold mb-2">עיצוב ויזואלי מובחן</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>צבע רקע ירוק בהיר (להבחנה מספירת מלאי)</li>
                        <li>כותרת "קליטת משלוח חדש" עם אייקון משאית</li>
                        <li>border ירוק בכרטיסי הפריטים</li>
                        <li>הודעות הצלחה בירוק</li>
                      </ul>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-md">
                      <h4 className="font-semibold mb-2">שלבי התהליך</h4>
                      <ol className="list-decimal list-inside text-sm space-y-2">
                        <li><strong>פרטי המשלוח:</strong> מספר תעודה, ספק, תאריך, מספר הזמנה (אופציונלי)</li>
                        <li><strong>צילום תעודה:</strong> אפשרות להעלות תמונה של תעודת המשלוח</li>
                        <li><strong>בחירת פריטים:</strong> חיפוש וסינון כמו בספירת מלאי</li>
                        <li><strong>הזנת נתונים:</strong> כמות, אצווה, תפוגה לכל פריט</li>
                        <li><strong>אישור וקליטה:</strong> עדכון אוטומטי של המלאי והתרנזקציות</li>
                      </ol>
                    </div>
                    
                    <h3 className="text-xl font-semibold mt-6">3. לוגיקה עסקית</h3>
                    <div className="bg-red-50 p-4 rounded-md">
                      <h4 className="font-semibold mb-2">עדכון יתרות הזמנות</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>אם צוין מספר הזמנה - גרוע מהיתרה הפתוחה</li>
                        <li>אם יתרה לא מספיקה - הצג אזהרה ואפשר המשך במינוס</li>
                        <li>אם לא צוין מספר הזמנה - קלוט כמשלוח חירום</li>
                        <li>יצירת תרנזקציה מסוג "delivery" עבור כל פריט</li>
                      </ul>
                    </div>
                    
                    <div className="bg-red-50 p-4 rounded-md">
                      <h4 className="font-semibold mb-2">עדכון מלאי ריאגנטים</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>הוספת הכמות החדשה למלאי הקיים</li>
                        <li>עדכון תאריך תפוגה אם החדש מוקדם יותר</li>
                        <li>שמירת פרטי אצווה האחרונה שהתקבלה</li>
                        <li>עדכון תאריך עדכון אחרון</li>
                      </ul>
                    </div>
                    
                    <h3 className="text-xl font-semibold mt-6">4. פיצ'רים עתידיים</h3>
                    <div className="bg-yellow-50 p-4 rounded-md">
                      <h4 className="font-semibold mb-2">OCR אוטומטי (גרסה עתידית)</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>שימוש באינטגרציית ExtractDataFromUploadedFile</li>
                        <li>זיהוי שמות ריאגנטים בתמונת התעודה</li>
                        <li>התאמה אוטומטית לרשימת הריאגנטים הקיימת</li>
                        <li>חילוץ כמויות מאותה שורה</li>
                        <li>אישור משתמש לפני קליטה אוטומטית</li>
                      </ul>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="consumption">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>מודול חישוב צריכה ממוצעת - מפרט טכני</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4 -mr-4">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">1. אלגוריתם חישוב צריכה</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h4 className="font-semibold mb-2">נוסחת החישוב הבסיסית</h4>
                      <div className="bg-white p-3 rounded border font-mono text-sm">
                        צריכה חודשית = (כמות בספירה מוקדמת + סך משלוחים - כמות בספירה מאוחרת) / מספר חודשים בתקופה
                      </div>
                      <p className="text-sm mt-2 text-gray-600">
                        החישוב לוקח בחשבון את כל המשלוחים שהתקבלו בתקופה הנבדקת
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h4 className="font-semibold mb-2">טיפול בתאריכים לא מדויקים</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>חיפוש ספירת המלאי הקרובה ביותר לתאריך המבוקש</li>
                        <li>חישוב יחסי לפי ימים: (ימי הפרש / 30.44) חודשים</li>
                        <li>דוגמה: אם המשתמש רוצה שנה מ-1/1/24 אבל יש ספירה ב-6/1/24 ו-15/1/25</li>
                        <li>התקופה בפועל: 374 ימים = 12.3 חודשים</li>
                        <li>התוצאה תוצג עם הסבר על התקופה הממשית</li>
                      </ul>
                    </div>
                    
                    <h3 className="text-xl font-semibold mt-6">2. ממשק בחירת תקופות</h3>
                    <div className="bg-blue-50 p-4 rounded-md">
                      <h4 className="font-semibold mb-2">אפשרויות מובנות</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>החודש האחרון</li>
                        <li>3 החודשים האחרונים</li>
                        <li>6 החודשים האחרונים</li>
                        <li>השנה האחרונה</li>
                        <li>תקופה מותאמת אישית (בחירת תאריכי התחלה וסיום)</li>
                      </ul>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-md">
                      <h4 className="font-semibold mb-2">הצגת זמינות נתונים</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>בדיקה אם יש ספירות מלאי בתקופה הנבחרת</li>
                        <li>הצגת רשימת ספירות זמינות</li>
                        <li>אזהרה אם חסרים נתונים</li>
                        <li>הצעת תקופה חלופית עם נתונים מלאים</li>
                      </ul>
                    </div>
                    
                    <h3 className="text-xl font-semibold mt-6">3. מנוע החישוב (צד שרת)</h3>
                    <div className="bg-red-50 p-4 rounded-md">
                      <h4 className="font-semibold mb-2">שלבי העיבוד</h4>
                      <ol className="list-decimal list-inside text-sm space-y-2">
                        <li><strong>איסוף נתונים:</strong> ספירות מלאי + משלוחים בתקופה</li>
                        <li><strong>וידוא תקינות:</strong> בדיקה שיש לפחות 2 ספירות</li>
                        <li><strong>חישוב לכל ריאגנט:</strong> נוסחה + התחשבות במשלוחים</li>
                        <li><strong>יצירת דוח:</strong> טבלה עם תוצאות + סטטיסטיקות</li>
                        <li><strong>שמירה:</strong> שמירת תוצאות להיסטוריה</li>
                      </ol>
                    </div>
                    
                    <h3 className="text-xl font-semibold mt-6">4. דוח צריכה ממוצעת</h3>
                    <div className="bg-green-50 p-4 rounded-md">
                      <h4 className="font-semibold mb-2">מבנה הדוח</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>פירוט לפי ספק וקטגוריה</li>
                        <li>צריכה חודשית ממוצעת לכל פריט</li>
                        <li>כמות נוכחית במלאי</li>
                        <li>חישוב "חודשי כיסוי" (כמה זמן יחזיק המלאי הנוכחי)</li>
                        <li>המלצות להזמנה</li>
                      </ul>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-md">
                      <h4 className="font-semibold mb-2">ייצוא והדפסה</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>ייצוא לקובץ Excel</li>
                        <li>הדפסה בפורמט מותאם</li>
                        <li>שמירת היסטוריית דוחות</li>
                        <li>השוואה עם דוחות קודמים</li>
                      </ul>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="orders">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>מודול ניהול הזמנות מתקדם - מפרט טכני</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4 -mr-4">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">1. מחזור חיי הזמנה</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h4 className="font-semibold mb-2">שלבי ההזמנה</h4>
                      <ol className="list-decimal list-inside text-sm space-y-2">
                        <li><strong>יצירת דרישה זמנית:</strong> במערכת המלאי שלנו</li>
                        <li><strong>העברה ל-SAP:</strong> קבלת מספר דרישה קבוע</li>
                        <li><strong>אישור ברכש:</strong> הפיכה להזמנת רכש</li>
                        <li><strong>שליחה לספק:</strong> קבלת מספר הזמנה סופי</li>
                        <li><strong>קליטת משלוחים:</strong> מעקב יתרות</li>
                        <li><strong>סגירת הזמנה:</strong> כשכל הכמויות התקבלו</li>
                      </ol>
                    </div>
                    
                    <h3 className="text-xl font-semibold mt-6">2. סוגי הזמנות</h3>
                    <div className="bg-blue-50 p-4 rounded-md">
                      <h4 className="font-semibold mb-2">הזמנה רגילה</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>הזמנה חד-פעמית לכמות מוגדרת</li>
                        <li>תאריך אספקה צפוי אחד</li>
                        <li>סגירה אוטומטית עם קבלת כל הכמות</li>
                      </ul>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-md">
                      <h4 className="font-semibold mb-2">הזמנת מסגרת</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>הזמנה לתקופה ארוכה עם משלוחים חלקיים</li>
                        <li>מעקב יתרות פתוחות לכל פריט</li>
                        <li>אפשרות "משיכה" מההזמנה הקיימת</li>
                        <li>בקרת תקציב ומניעת חריגה</li>
                      </ul>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-md">
                      <h4 className="font-semibold mb-2">הזמנת חירום</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>הזמנה דחופה עם תהליך מקוצר</li>
                        <li>דילוג על חלק מהאישורים</li>
                        <li>מעקב מיוחד ועדיפות גבוהה</li>
                      </ul>
                    </div>
                    
                    <h3 className="text-xl font-semibold mt-6">3. חישוב כמויות להזמנה</h3>
                    <div className="bg-yellow-50 p-4 rounded-md">
                      <h4 className="font-semibold mb-2">נוסחת החישוב</h4>
                      <div className="bg-white p-3 rounded border font-mono text-sm">
                        כמות להזמנה = (צריכה חודשית × חודשי כיסוי רצויים) - מלאי נוכחי - יתרות הזמנות פתוחות
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 p-4 rounded-md">
                      <h4 className="font-semibold mb-2">פרמטרים להתאמה</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>מלאי ביטחון מינימלי (בחודשים)</li>
                        <li>תקופת כיסוי מקסימלית (למניעת פג תוקף)</li>
                        <li>כמות הזמנה מינימלית (MOQ)</li>
                        <li>אריזות סטנדרטיות (חבילות של 10, 50 וכו')</li>
                      </ul>
                    </div>
                    
                    <h3 className="text-xl font-semibold mt-6">4. ממשק ניהול הזמנות</h3>
                    <div className="bg-green-50 p-4 rounded-md">
                      <h4 className="font-semibold mb-2">מסך סקירת הזמנות</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>טבלה עם כל ההזמנות הפעילות</li>
                        <li>סינון לפי סטטוס, ספק, תאריך</li>
                        <li>צבעי רקע לפי דחיפות ומצב</li>
                        <li>התראות על עיכובים וחריגות</li>
                      </ul>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-md">
                      <h4 className="font-semibold mb-2">מסך יצירת הזמנה חדשה</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>אשף שלב-אחר-שלב</li>
                        <li>בחירת פריטים מתוך המלאי</li>
                        <li>חישוב אוטומטי של כמויות מומלצות</li>
                        <li>קיבוץ לפי ספק (הזמנות מרוכזות)</li>
                        <li>אפשרות לעריכה ידנית</li>
                      </ul>
                    </div>
                    
                    <h3 className="text-xl font-semibold mt-6">5. אינטגרציה עם SAP</h3>
                    <div className="bg-red-50 p-4 rounded-md">
                      <h4 className="font-semibold mb-2">סנכרון מספרי הזמנות</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>ממשק לעדכון מספר דרישה קבוע</li>
                        <li>ממשק לעדכון מספר הזמנת רכש</li>
                        <li>ולידציה והתראות על אי-התאמות</li>
                        <li>היסטוריית שינויים ומעקב</li>
                      </ul>
                    </div>
                    
                    <h3 className="text-xl font-semibold mt-6">6. דוחות וניתוחים</h3>
                    <div className="bg-purple-50 p-4 rounded-md">
                      <h4 className="font-semibold mb-2">דוחות מובנים</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>דוח יתרות הזמנות פתוחות</li>
                        <li>דוח ביצועי ספקים (זמני אספקה)</li>
                        <li>דוח חריגות וסטיות מהתוכנן</li>
                        <li>דוח השוואת צריכה מול תחזיות</li>
                      </ul>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="future">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>פיתוחים עתידיים - חזון ארוך טווח</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4 -mr-4">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">1. זיהוי אוטומטי של מסמכים (OCR)</h3>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-md">
                      <h4 className="font-semibold mb-2">יכולות מתוכננות</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>צילום תעודת משלוח בטלפון</li>
                        <li>זיהוי שמות ריאגנטים בטקסט</li>
                        <li>התאמה אוטומטית למאגר הנתונים</li>
                        <li>חילוץ כמויות ותאריכי תפוגה</li>
                        <li>אישור משתמש לפני קליטה</li>
                      </ul>
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-md">
                      <h4 className="font-semibold mb-2">אתגרים טכניים</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>איכות תמונה משתנה</li>
                        <li>פורמטים שונים של תעודות ספקים</li>
                        <li>שפות וגופני כתב מגוונים</li>
                        <li>צורך באימון המערכת לכל ספק</li>
                      </ul>
                    </div>
                    
                    <h3 className="text-xl font-semibold mt-6">2. התאמה אישית למשתמשים שונים</h3>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-md">
                      <h4 className="font-semibold mb-2">מסך הגדרת קטגוריות וריאגנטים</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>הגדרת קטגוריות בהתאמה אישית</li>
                        <li>הוספת ריאגנטים בקלות</li>
                        <li>ממשק גרירה ושחרור (Drag & Drop)</li>
                        <li>טבלה אינטראקטיבית במסך מגע</li>
                        <li>ייבוא ויצוא הגדרות למשתמשים אחרים</li>
                      </ul>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-md">
                      <h4 className="font-semibold mb-2">ממשק ניהול ריאגנטים גמיש</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>הוספת פריטים חדשים בזמן אמת</li>
                        <li>עריכת שמות וקטגוריות קיימות</li>
                        <li>מיזוג פריטים כפולים</li>
                        <li>ארכיון פריטים שלא בשימוש</li>
                      </ul>
                    </div>
                    
                    <h3 className="text-xl font-semibold mt-6">3. אנליטיקה מתקדמת</h3>
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-md">
                      <h4 className="font-semibold mb-2">ניתוח טרנדים</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>זיהוי שינויים בדפוסי צריכה</li>
                        <li>חיזוי צרכים עתידיים</li>
                        <li>התראות על חריגות</li>
                        <li>אופטימיזציה של מלאי ביטחון</li>
                      </ul>
                    </div>
                    
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-md">
                      <h4 className="font-semibold mb-2">דשבורד ביצועים</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>KPIs של ניהול המלאי</li>
                        <li>גרפים אינטראקטיביים</li>
                        <li>השוואות תקופתיות</li>
                        <li>דוחות למנהלים</li>
                      </ul>
                    </div>
                    
                    <h3 className="text-xl font-semibold mt-6">4. אינטגרציות נוספות</h3>
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-md">
                      <h4 className="font-semibold mb-2">חיבור למערכות חיצוניות</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>API לחיבור עם מערכות בית חולים</li>
                        <li>סנכרון עם מערכות ספקים</li>
                        <li>אינטגרציה עם מערכות תשלומים</li>
                        <li>חיבור למערכות BI ודוחות</li>
                      </ul>
                    </div>
                    
                    <h3 className="text-xl font-semibold mt-6">5. מובייל ואפליקציה</h3>
                    <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-4 rounded-md">
                      <h4 className="font-semibold mb-2">אפליקציה נטיבית</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>אפליקציה לאנדרואיד ו-iOS</li>
                        <li>עבודה במצב לא מקוון (Offline)</li>
                        <li>סנכרון אוטומטי כשחוזרים לרשת</li>
                        <li>התראות Push על אירועים חשובים</li>
                        <li>סריקת ברקודים מובנית</li>
                      </ul>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}