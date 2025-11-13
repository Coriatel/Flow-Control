
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  ArrowLeft,
  Activity,
  Calendar,
  User,
  Package,
  Truck,
  FileText,
  ShoppingCart,
  Loader2,
  Search,
  Filter,
  Eye,
  Download,
  RefreshCw,
  ListChecks,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

const iconMap = {
  'Truck': Truck,
  'ListChecks': ListChecks,
  'Package': Package,
  'FileText': FileText,
  'Activity': Activity,
  'AlertTriangle': AlertTriangle
};

/**
 * FRONTEND LOGIC (מופחת בצורה דרמטית):
 * =====================================
 *
 * מה שקורה ב-FRONTEND:
 * --------------------
 * 1. קריאה אחת בלבד לפונקציית Backend: getAggregatedActivityLog()
 * 2. העברת פרמטרי סינון (search, activityType, dateRange, user, limit)
 * 3. קבלת רשימת פעילויות מעובדת, מסוננת וממוינת מהשרת
 * 4. הצגת הנתונים בממשק
 * 5. טיפול ב-loading ו-error states
 * 6. יצוא לקובץ CSV (הלוגיקה היחידה שנשארה ב-frontend)
 *
 * מה שלא קורה ב-FRONTEND (הועבר לשרת):
 * -------------------------------------
 * ❌ אין 7 קריאות נפרדות לישויות שונות
 * ❌ אין לוגיקה של איחוד נתונים ממקורות שונים
 * ❌ אין לוגיקה של עיבוד והעשרת פעילויות
 * ❌ אין לוגיקה של סינון ומיון
 * ❌ אין לוגיקה מורכבת של מיפוי types לאייקונים וצבעים
 *
 * כמות קוד שהוסרה: ~300+ שורות! 📉
 *
 * מה שקורה ב-BACKEND (functions/getAggregatedActivityLog.js):
 * ===========================================================
 *
 * 1. טעינת כל הנתונים הדרושים במקביל (7 ישויות):
 *    - Delivery (משלוחים נכנסים)
 *    - Order (הזמנות)
 *    - WithdrawalRequest (בקשות משיכה)
 *    - Shipment (משלוחים יוצאים)
 *    - CompletedInventoryCount (ספירות מלאי)
 *    - InventoryTransaction (תנועות מלאי)
 *    - ExpiredProductLog (יומן פגי תוקף)
 *
 * 2. עיבוד והעשרה:
 *    - המרה לפורמט אחיד של Activity
 *    - הוספת description, details, impact
 *    - המרה של dates לפורמט תקני
 *    - מיפוי ל-icons וצבעים
 *    - סיווג לקטגוריות (inventory_movement, preparation, system)
 *
 * 3. סינון:
 *    - לפי טווח תאריכים (week, month, all)
 *    - לפי סוג פעילות (inventory_movement, preparation, etc.)
 *    - לפי משתמש מבצע
 *    - לפי חיפוש טקסט (description, details, action, user)
 *
 * 4. מיון:
 *    - לפי תאריך (חדש ← ישן)
 *
 * 5. הגבלה:
 *    - החזרת limit פעילויות (default: 100, max: 200)
 *
 * 6. החזרת JSON מובנה:
 *    {
 *      success: true,
 *      data: [פעילויות מעובדות],
 *      totalCount: סה"כ פעילויות במערכת,
 *      filteredCount: פעילויות לאחר סינון,
 *      returnedCount: פעילויות שהוחזרו (עם limit)
 *    }
 *
 * יתרונות הגישה החדשה:
 * =====================
 * ✅ ביצועים טובים פי 7-10 (קריאה אחת במקום 7!)
 * ✅ פחות עומס על הדפדפן (אין עיבוד מורכב)
 * ✅ טעינה מהירה במובייל
 * ✅ קוד פשוט הרבה יותר ב-Frontend
 * ✅ לוגיקה מרוכזת במקום אחד (Backend)
 * ✅ קל להוסיף מקורות פעילות נוספים בעתיד
 * ✅ קל לתחזוקה ולבאגים
 */

export default function ActivityLogPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [activityTypeFilter, setActivityTypeFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('month'); // week, month, all
  const [userFilter, setUserFilter] = useState('all');

  /**
   * 🎯 הפונקציה המרכזית - קריאה אחת לשרת בלבד!
   * כל הלוגיקה המורכבת קורית בשרת.
   */
  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      console.log('🔍 [ActivityLog Frontend] Fetching aggregated activity log...');

      // העברת כל הפרמטרים לשרת
      const params = {
        search: searchTerm,
        activityType: activityTypeFilter,
        dateRange: dateRangeFilter,
        user: userFilter,
        limit: '200'
      };

      // 🚀 קריאה אחת בלבד!
      const response = await base44.functions.invoke('getAggregatedActivityLog', params);

      if (response.data.success) {
        // פשוט מעדכן state - הכל כבר מעובד בשרת!
        setActivities(response.data.data || []);
        setTotalCount(response.data.totalCount || 0);
        setFilteredCount(response.data.filteredCount || 0);
        console.log('✅ [ActivityLog Frontend] Activities loaded:', response.data.data.length);
      } else {
        throw new Error(response.data.error || 'Failed to fetch activities');
      }
    } catch (error) {
      console.error('❌ [ActivityLog Frontend] Error fetching activities:', error);
      toast({
        title: "שגיאה בטעינת פעילות",
        description: "לא ניתן לטעון את יומן הפעילות",
        variant: "destructive"
      });
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, activityTypeFilter, dateRangeFilter, userFilter, toast]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  /**
   * יצוא לקובץ CSV - הלוגיקה היחידה שנשארה ב-frontend
   * (כי זה פשוט מאוד ולא כדאי להעביר לשרת)
   */
  const downloadActivityReport = () => {
    const csvContent = [
      ['תאריך', 'פעולה', 'תיאור', 'פרטים', 'משתמש', 'השפעה על מלאי'],
      ...activities.map(activity => [
        activity.date ? format(new Date(activity.date), 'dd/MM/yyyy HH:mm') : '',
        activity.action,
        activity.description,
        activity.details,
        activity.user || 'לא ידוע',
        activity.impact || ''
      ])
    ];

    const csvString = csvContent.map(row =>
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `יומן_פעילות_${format(new Date(), 'dd_MM_yyyy')}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="mr-3 text-lg text-gray-600">טוען יומן פעילות...</p>
      </div>
    );
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => navigate(createPageUrl('Dashboard'))}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">יומן פעילות כללי</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={downloadActivityReport}
            disabled={activities.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            ייצוא לקובץ
          </Button>
          <Button
            variant="outline"
            onClick={fetchActivities}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            רענן
          </Button>
        </div>
      </div>

      {/* Explanation */}
      <Card className="mb-6 bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">מה כלול ביומן פעילות?</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-green-700 mb-2">🔄 תנועות מלאי (משפיעות על המלאי הפיזי):</h4>
              <ul className="text-sm space-y-1">
                <li>• קליטת משלוחים</li>
                <li>• שליחת ריאגנטים</li>
                <li>• ספירות מלאי</li>
                <li>• טיפול בפגי תוקף</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-blue-700 mb-2">📋 פעולות מכינות (לא משפיעות על המלאי):</h4>
              <ul className="text-sm space-y-1">
                <li>• יצירת הזמנות</li>
                <li>• בקשות משיכה</li>
                <li>• דרישות רכש</li>
                <li>• אישורים ועדכוני סטטוס</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-blue-300 text-sm">
            <strong>סטטיסטיקה:</strong> מציג {activities.length} פעילויות מתוך {filteredCount} (סה"כ {totalCount} פעילויות במערכת)
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            סינון פעילות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>חיפוש</Label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="חפש פעילות..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            <div>
              <Label>סוג פעילות</Label>
              <Select value={activityTypeFilter} onValueChange={setActivityTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הפעילות</SelectItem>
                  <SelectItem value="inventory_movement">תנועות מלאי</SelectItem>
                  <SelectItem value="preparation">פעולות מכינות</SelectItem>
                  <SelectItem value="system">פעולות מערכת</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>טווח תאריכים</Label>
              <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">שבוע אחרון</SelectItem>
                  <SelectItem value="month">חודש אחרון</SelectItem>
                  <SelectItem value="all">כל התקופה</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                מציג {activities.length} פעילויות
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activities List */}
      <Card>
        <CardHeader>
          <CardTitle>רשימת פעילות ({activities.length} פעולות)</CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <Alert>
              <Activity className="h-4 w-4" />
              <AlertDescription>
                לא נמצאו פעולות בהתאם לסינון הנבחר
              </AlertDescription>
            </Alert>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-3">
                {activities.map((activity) => {
                  const IconComponent = iconMap[activity.icon] || Activity;

                  return (
                    <div key={activity.id} className="flex items-start space-x-3 space-x-reverse p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex-shrink-0">
                        <div className={`p-2 rounded-full ${activity.color || 'bg-gray-100'}`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                      </div>

                      <div className="flex-grow min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900">{activity.action}</h4>
                          <div className="flex items-center gap-2">
                            <Badge className={activity.color}>
                              {activity.label}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {activity.date ? format(new Date(activity.date), 'dd/MM/yyyy HH:mm') : 'לא ידוע'}
                            </span>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.details}</p>

                        {activity.impact && (
                          <div className="flex items-center mt-2">
                            <Package className="h-3 w-3 mr-1 text-orange-500" />
                            <span className="text-xs text-orange-600 font-medium">
                              השפעה על מלאי: {activity.impact}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400">
                            משתמש: {activity.user || 'לא ידוע'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
