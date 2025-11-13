import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export default function TechnicalSpecs() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">מפרטים טכניים מפורטים - מערכת ניהול מלאי</h1>
      
      <Tabs defaultValue="entities" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="entities">ישויות חדשות</TabsTrigger>
          <TabsTrigger value="apis">APIs וצד שרת</TabsTrigger>
          <TabsTrigger value="algorithms">אלגוריתמים</TabsTrigger>
          <TabsTrigger value="testing">תכנית בדיקות</TabsTrigger>
        </TabsList>
        
        <TabsContent value="entities">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>ישויות נדרשות למודולים החדשים</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-md">
                    <h3 className="font-bold text-blue-800 mb-2">📦 Delivery - תעודת משלוח</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>שדות עיקריים:</strong>
                        <ul className="list-disc list-inside mt-1">
                          <li>delivery_number (string) - מספר תעודת משלוח</li>
                          <li>supplier (enum) - ספק</li>
                          <li>delivery_date (date) - תאריך קבלה</li>
                          <li>order_number (string, optional) - מספר הזמנה</li>
                        </ul>
                      </div>
                      <div>
                        <strong>שדות מעקב:</strong>
                        <ul className="list-disc list-inside mt-1">
                          <li>status (enum) - פתוח/מעובד/סגור</li>
                          <li>total_items (integer) - סך פריטים</li>
                          <li>document_url (string) - קישור לתמונה</li>
                          <li>notes (string) - הערות</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-md">
                    <h3 className="font-bold text-green-800 mb-2">📋 DeliveryItem - פריט במשלוח</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>קישורים:</strong>
                        <ul className="list-disc list-inside mt-1">
                          <li>delivery_id (string) - קישור לתעודת משלוח</li>
                          <li>reagent_id (string) - קישור לריאגנט</li>
                        </ul>
                      </div>
                      <div>
                        <strong>נתוני פריט:</strong>
                        <ul className="list-disc list-inside mt-1">
                          <li>quantity_received (number) - כמות שהתקבלה</li>
                          <li>batch_number (string) - מספר אצווה</li>
                          <li>expiry_date (date) - תאריך תפוגה</li>
                          <li>unit_cost (number, optional) - עלות ליחידה</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-md">
                    <h3 className="font-bold text-purple-800 mb-2">🛍️ Order - הזמנה/דרישה</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>מספרי הזמנה:</strong>
                        <ul className="list-disc list-inside mt-1">
                          <li>order_number_temp (string) - מספר זמני</li>
                          <li>order_number_permanent (string) - מספר קבוע</li>
                          <li>purchase_order_number (string) - מספר SAP</li>
                        </ul>
                      </div>
                      <div>
                        <strong>פרטי הזמנה:</strong>
                        <ul className="list-disc list-inside mt-1">
                          <li>supplier (enum) - ספק</li>
                          <li>order_date (date) - תאריך הזמנה</li>
                          <li>status (enum) - זמני/קבוע/מאושר/סגור</li>
                          <li>order_type (enum) - רגיל/מסגרת/חירום</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-md">
                    <h3 className="font-bold text-yellow-800 mb-2">📝 OrderItem - פריט בהזמנה</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>כמויות:</strong>
                        <ul className="list-disc list-inside mt-1">
                          <li>quantity_ordered (number) - כמות מוזמנת</li>
                          <li>quantity_received (number) - כמות שהתקבלה</li>
                          <li>quantity_remaining (number) - יתרה פתוחה</li>
                        </ul>
                      </div>
                      <div>
                        <strong>תאריכים:</strong>
                        <ul className="list-disc list-inside mt-1">
                          <li>expected_delivery_date (date) - משלוח צפוי</li>
                          <li>last_delivery_date (date) - משלוח אחרון</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-md">
                    <h3 className="font-bold text-red-800 mb-2">📊 ConsumptionReport - דוח צריכה</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>פרטי דוח:</strong>
                        <ul className="list-disc list-inside mt-1">
                          <li>report_date (date) - תאריך יצירת דוח</li>
                          <li>period_start (date) - תחילת תקופה</li>
                          <li>period_end (date) - סוף תקופה</li>
                          <li>period_months (number) - אורך תקופה בחודשים</li>
                        </ul>
                      </div>
                      <div>
                        <strong>נתונים:</strong>
                        <ul className="list-disc list-inside mt-1">
                          <li>consumption_data (object) - צריכה לכל ריאגנט</li>
                          <li>recommendations (object) - המלצות הזמנה</li>
                          <li>total_reagents (integer) - סך ריאגנטים</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="apis">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>APIs ופונקציות צד שרת נדרשות</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4 -mr-4">
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-md">
                      <h3 className="font-bold text-blue-800 mb-2">🚚 API קליטת משלוחים</h3>
                      <div className="space-y-2 text-sm">
                        <div><strong>POST /api/deliveries/process</strong></div>
                        <div>קלט: נתוני המשלוח + פריטים</div>
                        <div>פלט: סטטוס הצלחה + מספר תעודה</div>
                        <div className="bg-white p-2 rounded font-mono text-xs">
                          <pre>{`{
  "deliveryData": {
    "delivery_number": "D2025001",
    "supplier": "ELDAN",
    "order_number": "PO123456"
  },
  "items": [
    {
      "reagent_id": "uuid",
      "quantity": 10,
      "batch_number": "B123",
      "expiry_date": "2025-12-31"
    }
  ]
}`}</pre>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-md">
                      <h3 className="font-bold text-green-800 mb-2">📈 API חישוב צריכה</h3>
                      <div className="space-y-2 text-sm">
                        <div><strong>POST /api/consumption/calculate</strong></div>
                        <div>קלט: תקופת זמן + פרמטרי חישוב</div>
                        <div>פלט: דוח צריכה מפורט</div>
                        <div className="bg-white p-2 rounded font-mono text-xs">
                          <pre>{`{
  "period": {
    "start_date": "2024-01-01",
    "end_date": "2024-12-31"
  },
  "options": {
    "include_deliveries": true,
    "exclude_emergency_orders": false
  }
}`}</pre>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-md">
                      <h3 className="font-bold text-purple-800 mb-2">🛒 API יצירת הזמנות</h3>
                      <div className="space-y-2 text-sm">
                        <div><strong>POST /api/orders/create</strong></div>
                        <div>קלט: פרמטרי הזמנה + רשימת פריטים</div>
                        <div>פלט: מספר הזמנה זמני + פריטים</div>
                        <div className="bg-white p-2 rounded font-mono text-xs">
                          <pre>{`{
  "order_type": "regular",
  "supplier": "BIORAD",
  "coverage_months": 6,
  "items": [
    {
      "reagent_id": "uuid",
      "quantity_requested": 20,
      "priority": "normal"
    }
  ]
}`}</pre>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 p-4 rounded-md">
                      <h3 className="font-bold text-yellow-800 mb-2">🔄 API עדכון יתרות</h3>
                      <div className="space-y-2 text-sm">
                        <div><strong>PUT /api/orders/{'{id}'}/update-numbers</strong></div>
                        <div>קלט: מספרי הזמנה חדשים (קבוע/SAP)</div>
                        <div>פלט: סטטוס עדכון</div>
                      </div>
                    </div>
                    
                    <div className="bg-red-50 p-4 rounded-md">
                      <h3 className="font-bold text-red-800 mb-2">🎯 API בדיקת יתרות הזמנות</h3>
                      <div className="space-y-2 text-sm">
                        <div><strong>GET /api/orders/remaining-quantities</strong></div>
                        <div>קלט: רשימת ריאגנטים (אופציונלי)</div>
                        <div>פלט: יתרות פתוחות לכל ריאגנט</div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="algorithms">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>אלגוריתמים מרכזיים</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4 -mr-4">
                  <div className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-md">
                      <h3 className="font-bold text-blue-800 mb-3">🧮 אלגוריתם חישוב צריכה חודשית ממוצעת</h3>
                      <div className="space-y-3">
                        <div className="bg-white p-3 rounded">
                          <h4 className="font-semibold mb-2">שלב 1: איסוף נתונים</h4>
                          <ol className="list-decimal list-inside text-sm space-y-1">
                            <li>מציאת ספירת מלאי ראשונה וסופית בתקופה</li>
                            <li>איסוף כל המשלוחים בתקופה לפי ריאגנט</li>
                            <li>חישוב ימי הפרש מדויקים בין ספירות</li>
                          </ol>
                        </div>
                        
                        <div className="bg-white p-3 rounded">
                          <h4 className="font-semibold mb-2">שלב 2: נוסחת החישוב</h4>
                          <div className="font-mono bg-gray-100 p-2 rounded text-sm">
                            consumption = (initial_count + total_deliveries - final_count) / (days_diff / 30.44)
                          </div>
                          <p className="text-xs mt-1 text-gray-600">30.44 = ממוצע ימים בחודש</p>
                        </div>
                        
                        <div className="bg-white p-3 rounded">
                          <h4 className="font-semibold mb-2">שלב 3: טיפול במקרי קצה</h4>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            <li>צריכה שלילית → קבע כ-0 + הערה</li>
                            <li>תקופה קצרה מדי (פחות מ-30 ימים) → אזהרה</li>
                            <li>חסרות ספירות → חישוב חלקי עם הערה</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-md">
                      <h3 className="font-bold text-green-800 mb-3">📦 אלגוריתם חישוב כמויות להזמנה</h3>
                      <div className="space-y-3">
                        <div className="bg-white p-3 rounded">
                          <h4 className="font-semibold mb-2">שלב 1: חישוב צורך עתידי</h4>
                          <div className="font-mono bg-gray-100 p-2 rounded text-sm">
                            future_need = monthly_consumption × coverage_months
                          </div>
                        </div>
                        
                        <div className="bg-white p-3 rounded">
                          <h4 className="font-semibold mb-2">שלב 2: חישוב כמות להזמנה</h4>
                          <div className="font-mono bg-gray-100 p-2 rounded text-sm">
                            order_qty = future_need - current_stock - pending_orders
                          </div>
                        </div>
                        
                        <div className="bg-white p-3 rounded">
                          <h4 className="font-semibold mb-2">שלב 3: התאמות נוספות</h4>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            <li>עיגול למינימום הזמנה (MOQ)</li>
                            <li>התחשבות באריזות סטנדרטיות</li>
                            <li>בדיקת תקציב זמין</li>
                            <li>אזהרה על פג תוקף</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-md">
                      <h3 className="font-bold text-purple-800 mb-3">🔄 אלגוריתם עדכון יתרות הזמנות</h3>
                      <div className="space-y-3">
                        <div className="bg-white p-3 rounded">
                          <h4 className="font-semibold mb-2">בעת קליטת משלוח</h4>
                          <ol className="list-decimal list-inside text-sm space-y-1">
                            <li>חיפוש הזמנה פתוחה עם יתרה</li>
                            <li>גריעת כמות שהתקבלה</li>
                            <li>עדכון תאריך קבלה אחרון</li>
                            <li>סגירת הזמנה אם יתרה = 0</li>
                          </ol>
                        </div>
                        
                        <div className="bg-white p-3 rounded">
                          <h4 className="font-semibold mb-2">טיפול בחריגות</h4>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            <li>כמות עולה על יתרה → אזהרה + אפשרות להמשיך</li>
                            <li>אין הזמנה פתוחה → משלוח חירום</li>
                            <li>ריאגנט לא קיים בהזמנה → הודעת שגיאה</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="testing">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>תכנית בדיקות מקיפה</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4 -mr-4">
                  <div className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-md">
                      <h3 className="font-bold text-green-800 mb-2">✅ בדיקות יחידה (Unit Tests)</h3>
                      <div className="space-y-2 text-sm">
                        <div><strong>פונקציות חישוב:</strong></div>
                        <ul className="list-disc list-inside mr-4">
                          <li>calculateMonthlyConsumption() - עם נתונים מדומים</li>
                          <li>calculateOrderQuantities() - תרחישים שונים</li>
                          <li>updateRemainingQuantities() - מקרי קצה</li>
                        </ul>
                        
                        <div><strong>פונקציות עזר:</strong></div>
                        <ul className="list-disc list-inside mr-4">
                          <li>findClosestInventoryCount() - תאריכים</li>
                          <li>validateDeliveryData() - ולידציה</li>
                          <li>formatConsumptionReport() - פורמט יצוא</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-md">
                      <h3 className="font-bold text-blue-800 mb-2">🔗 בדיקות אינטגרציה</h3>
                      <div className="space-y-2 text-sm">
                        <div><strong>זרימות עבודה מלאות:</strong></div>
                        <ol className="list-decimal list-inside mr-4 space-y-1">
                          <li>יצירת הזמנה → קליטת משלוח → עדכון יתרות</li>
                          <li>ספירת מלאי → חישוב צריכה → יצירת הזמנה</li>
                          <li>משלוח חירום (ללא הזמנה) → עדכון מלאי</li>
                        </ol>
                        
                        <div><strong>אינטגרציה בין מודולים:</strong></div>
                        <ul className="list-disc list-inside mr-4">
                          <li>InventoryCount ↔ ConsumptionCalculation</li>
                          <li>Orders ↔ Deliveries ↔ Reagent updates</li>
                          <li>Reports ↔ All data sources</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 p-4 rounded-md">
                      <h3 className="font-bold text-yellow-800 mb-2">👤 בדיקות ממשק משתמש</h3>
                      <div className="space-y-2 text-sm">
                        <div><strong>תרחישי משתמש:</strong></div>
                        <ol className="list-decimal list-inside mr-4 space-y-1">
                          <li>קליטת משלוח מלא - חיפוש, הזנה, שמירה</li>
                          <li>יצירת הזמנה מותאמת - בחירת פריטים, עריכת כמויות</li>
                          <li>חישוב צריכה לתקופות שונות - טפסים, דוחות</li>
                          <li>טיפול בשגיאות - הודעות, התאוששות</li>
                        </ol>
                        
                        <div><strong>בדיקות נגישות:</strong></div>
                        <ul className="list-disc list-inside mr-4">
                          <li>עבודה במכשירים ניידים</li>
                          <li>מהירות טעינה וביצועים</li>
                          <li>עבודה במצב לא מקוון חלקי</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="bg-red-50 p-4 rounded-md">
                      <h3 className="font-bold text-red-800 mb-2">🚨 בדיקות מקרי קצה</h3>
                      <div className="space-y-2 text-sm">
                        <div><strong>מצבים חריגים:</strong></div>
                        <ul className="list-disc list-inside mr-4 space-y-1">
                          <li>כמויות שליליות במלאי</li>
                          <li>תאריכי תפוגה שעברו</li>
                          <li>משלוחים ללא הזמנה תואמת</li>
                          <li>ספירות מלאי חסרות בתקופה</li>
                          <li>נתוני צריכה בלתי סבירים</li>
                        </ul>
                        
                        <div><strong>בדיקות עומס:</strong></div>
                        <ul className="list-disc list-inside mr-4">
                          <li>1000+ ריאגנטים בספירה</li>
                          <li>100+ משלוחים בחודש</li>
                          <li>חישוב צריכה על נתוני 5 שנים</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-md">
                      <h3 className="font-bold text-purple-800 mb-2">📊 בדיקות ביצועים</h3>
                      <div className="space-y-2 text-sm">
                        <div><strong>מדדי ביצועים:</strong></div>
                        <ul className="list-disc list-inside mr-4 space-y-1">
                          <li>זמן חישוב צריכה פחות מ-5 שניות</li>
                          <li>טעינת דף קליטת משלוח פחות מ-2 שניות</li>
                          <li>שמירת הזמנה חדשה פחות מ-3 שניות</li>
                          <li>יצוא דוח לExcel פחות מ-10 שניות</li>
                        </ul>
                        
                        <div><strong>בדיקות זיכרון:</strong></div>
                        <ul className="list-disc list-inside mr-4">
                          <li>ניהול זיכרון בחישובים כבדים</li>
                          <li>מניעת דליפות זיכרון</li>
                          <li>אופטימיזציה של שאילתות DB</li>
                        </ul>
                      </div>
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