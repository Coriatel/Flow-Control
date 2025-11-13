
import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Activity, AlertTriangle, ArrowDownToLine, ArrowLeft, BarChart3, Beaker, Bell, Building2, Calculator,
  ClipboardCheck, ClipboardList, Clock, FileCode, FileStack, FileText, FileUp, List, ListChecks,
  Loader2, Package, PackageCheck, RefreshCw, Server, Settings, Shield, ShoppingCart, SlidersHorizontal,
  TrendingDown, Truck, Users, Zap
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { he } from "date-fns/locale";
import { toast } from "sonner";

// New Components
import SummaryCard from "../components/dashboard/SummaryCard";
import CriticalActions from "../components/dashboard/CriticalActions";
import RecentActivity from "../components/dashboard/RecentActivity";
import { NavGroupAccordion } from "../components/dashboard/NavGroupAccordion";

export default function Dashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    expiringReagents: [],
    lowStockReagents: [],
    pendingOrders: [],
    pendingSupplies: [],
    dashboardNotes: [],
    lastInventoryCount: null,
    recentActivity: [],
    criticalActions: [],
    statistics: {}
  });

  /**
   * FRONTEND LOGIC (מופחת מאוד):
   * ================================
   * 
   * מה שקורה ב-FRONTEND:
   * --------------------
   * 1. קריאה אחת בלבד לפונקציית Backend: getDashboardData()
   * 2. קבלת כל הנתונים המעובדים והמוכנים מהשרת
   * 3. עדכון state עם הנתונים שהתקבלו
   * 4. טיפול ב-loading ו-error states
   * 5. הצגת הנתונים בממשק
   * 
   * מה שלא קורה ב-FRONTEND (הועבר לשרת):
   * -------------------------------------
   * ❌ אין קריאות מרובות לישויות שונות
   * ❌ אין חישובים של expiringReagents
   * ❌ אין חישובים של lowStockReagents
   * ❌ אין חישובים של pendingOrders/Supplies
   * ❌ אין עיבוד של recentActivity
   * ❌ אין חישוב של criticalActions
   * 
   * מה שקורה ב-BACKEND (functions/getDashboardData.js):
   * ===================================================
   * 
   * 1. טעינת כל הנתונים הדרושים במקביל:
   *    - Reagent (כל הריאגנטים)
   *    - Order (כל ההזמנות)
   *    - WithdrawalRequest (כל בקשות המשיכה)
   *    - ExpiredProductLog (יומן פגי תוקף)
   *    - DashboardNote (5 הערות אחרונות)
   *    - CompletedInventoryCount (ספירת מלאי אחרונה)
   *    - InventoryTransaction (20 תנועות אחרונות)
   *    - Delivery (10 משלוחים אחרונים)
   * 
   * 2. חישוב expiringReagents:
   *    - סינון ריאגנטים שתפוגתם תוך 14 יום
   *    - בדיקה מול יומן פגי תוקף (למנוע כפילויות)
   *    - מיון לפי תאריך תפוגה
   *    - החזרת מערך מצומצם עם השדות הרלוונטיים בלבד
   * 
   * 3. חישוב lowStockReagents:
   *    - סינון ריאגנטים עם מלאי נמוך (< 4 שבועות או < 5 יח')
   *    - חישוב months_of_stock לכל ריאגנט
   *    - מיון לפי דחיפות (פחות מלאי = יותר דחוף)
   *    - החזרת מערך עם נתונים מעובדים
   * 
   * 4. חישוב pendingOrders:
   *    - סינון הזמנות הממתינות לפרטי SAP
   *    - מיון לפי תאריך יצירה
   *    - החזרת מערך מצומצם
   * 
   * 5. חישוב pendingSupplies:
   *    - איחוד של בקשות משיכה פעילות + הזמנות רגילות מאושרות
   *    - מיון לפי תאריך בקשה
   *    - החזרת מערך מאוחד ומצומצם
   * 
   * 6. עיבוד recentActivity:
   *    - איחוד transactions + orders
   *    - יצירת תיאורים קריאים
   *    - מיון לפי תאריך (חדש ← ישן)
   *    - הגבלה ל-20 פעילויות אחרונות
   * 
   * 7. חישוב criticalActions:
   *    - בדיקת פגי תוקף היום
   *    - בדיקת מועד ספירת מלאי אחרונה
   *    - בדיקת מלאי נמוך
   *    - בדיקת הזמנות ממתינות
   *    - החזרת מערך עם המלצות בסדר עדיפות
   * 
   * 8. החזרת אובייקט JSON מאוחד:
   *    - כל הנתונים מעובדים ומוכנים להצגה
   *    - ללא צורך בעיבוד נוסף בצד הלקוח
   * 
   * יתרונות הגישה החדשה:
   * =====================
   * ✅ פחות טעינה על הדפדפן (במיוחד במובייל)
   * ✅ טעינה מהירה יותר (קריאה אחת במקום 8+)
   * ✅ קוד פשוט יותר ב-Frontend
   * ✅ לוגיקה מרוכזת במקום אחד (Backend)
   * ✅ קל יותר לתחזוקה ולבדיקות
   * ✅ ניצול טוב יותר של משאבי השרת (Deno)
   */
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("[Dashboard Frontend] Fetching dashboard data from backend...");
      
      // Fetch user data
      const userData = await base44.auth.me();
      setUser(userData);

      // 🎯 קריאה אחת בלבד לפונקציית Backend - כל הלוגיקה בשרת!
      const response = await base44.functions.invoke('getDashboardData');
      
      if (response.data.error) {
        throw new Error(response.data.error);
      }

      console.log("[Dashboard Frontend] ✅ Data received:", {
        expiringCount: response.data.expiringReagents?.length || 0,
        lowStockCount: response.data.lowStockReagents?.length || 0,
        pendingOrdersCount: response.data.pendingOrders?.length || 0,
        pendingSuppliesCount: response.data.pendingSupplies?.length || 0,
        notesCount: response.data.dashboardNotes?.length || 0,
        activityCount: response.data.recentActivity?.length || 0,
        criticalActionsCount: response.data.criticalActions?.length || 0
      });

      // פשוט מעדכן state - אין צורך בשום עיבוד!
      setDashboardData({
        expiringReagents: response.data.expiringReagents || [],
        lowStockReagents: response.data.lowStockReagents || [],
        pendingOrders: response.data.pendingOrders || [],
        pendingSupplies: response.data.pendingSupplies || [],
        dashboardNotes: response.data.dashboardNotes || [],
        lastInventoryCount: response.data.lastInventoryCount || null,
        recentActivity: response.data.recentActivity || [],
        criticalActions: response.data.criticalActions || [],
        statistics: response.data.statistics || {}
      });

    } catch (err) {
      console.error('[Dashboard Frontend] ❌ Error loading dashboard:', err);
      setError(`שגיאה בטעינת הדשבורד: ${err.message}`);
      toast.error('שגיאה בטעינת הדשבורד', {
        description: err.message
      });
    } finally {
      setLoading(false);
      setIsManualRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const manualRefresh = () => {
    setIsManualRefreshing(true);
    fetchDashboardData();
  };

  const navItems = [
    { name: "קליטת משלוח", href: "NewDelivery", icon: Truck, group: "inventory" },
    { name: "ספירת מלאי", href: "InventoryCount", icon: ListChecks, group: "inventory" },
    { name: "ניהול נתוני צריכה", href: "UsageDataManagement", icon: SlidersHorizontal, group: "inventory" },
    { name: "חישוב השלמות מלאי", href: "InventoryReplenishment", icon: Calculator, group: "inventory" },
    { name: "ניהול אצוות ופגי תוקף", href: "BatchAndExpiryManagement", icon: ClipboardList, group: "inventory" },
    { name: "הקמת מסמך רכש חדש", href: "NewOrder", icon: FileText, group: "procurement" },
    { name: "ניהול דרישות רכש", href: "Orders", icon: ShoppingCart, group: "procurement" },
    { name: "משיכת ריאגנטים", href: "NewWithdrawalRequest", icon: ArrowDownToLine, group: "procurement" },
    { name: "ניהול בקשות משיכה", href: "WithdrawalRequests", icon: ClipboardList, group: "procurement" },
    { name: "משלוחים שהתקבלו", href: "Deliveries", icon: FileStack, group: "shipments" },
    { name: "ניהול משלוחים יוצאים", href: "OutgoingShipments", icon: PackageCheck, group: "shipments" },
    { name: "שליחת ריאגנטים", href: "NewShipment", icon: Package, group: "shipments" },
    { name: "מעקב אספקות", href: "SupplyTracking", icon: Truck, group: "shipments" },
    { name: "העלאת תעודות אנליזה", href: "UploadCOA", icon: FileUp, group: "operations" },
    { name: "דוחות ומעקב", href: "Reports", icon: BarChart3, group: "operations" },
    { name: "התראות ותזכורות", href: "AlertsManagement", icon: Bell, group: "operations" },
    { name: "הערות ומשימות", href: "DashboardNotes", icon: ClipboardCheck, group: "operations" },
    { name: "ניהול ריאגנטים", href: "ManageReagents", icon: Beaker, group: "operations" },
    { name: "ניהול ספקים", href: "ManageSuppliers", icon: Building2, group: "operations" },
    { name: "יומן פעילות", href: "ActivityLog", icon: Activity, group: "operations" },
    { name: "בקרת איכות", href: "QualityAssurance", icon: Shield, group: "operations" },
    { name: "ניהול אנשי קשר", href: "Contacts", icon: Users, group: "contacts" },
    { name: "קליטת אנשי קשר מקובץ", href: "ImportContacts", icon: FileUp, group: "contacts" },
    { name: "היסטוריית פיתוח", href: "SystemDocumentation", icon: FileCode, group: "documentation" }
  ];

  const adminNavItems = [
    { name: "הגדרות מערכת", href: "SystemSettings", icon: Settings },
    { name: "ניהול מערכת", href: "SystemManagement", icon: Server },
    { name: "פאנל ניהול מתקדם", href: "AdminPanel", icon: Shield }
  ];

  if (loading && !isManualRefreshing) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-teal-500" />
        <span className="mr-3 text-lg text-gray-600">טוען דשבורד...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <p className="text-red-600 text-lg">{error}</p>
        <Button onClick={fetchDashboardData} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          נסה שוב
        </Button>
      </div>
    );
  }

  const { expiringReagents, lowStockReagents, pendingSupplies, pendingOrders, criticalActions } = dashboardData;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 mb-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">מרכז הבקרה</h1>
                    <p className="text-sm text-slate-600 mt-1">מידע מבצעי ופעולות לניהול המלאי</p>
                </div>
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={manualRefresh} 
                    disabled={isManualRefreshing} 
                    className="bg-white border-slate-300 hover:bg-slate-50"
                >
                    {isManualRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    <span className="mr-2">רענון</span>
                </Button>
            </div>
        </div>

        <div className="px-4">
            <div className="grid grid-cols-1 lg:grid-cols-5 lg:gap-6">
                
                {/* Main Content (Right Column) */}
                <div className="lg:col-span-3 space-y-6">
                    <CriticalActions actions={criticalActions} />

                    {/* Summary Cards on Mobile */}
                    <div className="grid grid-cols-2 gap-3 lg:hidden">
                        <SummaryCard 
                            icon={<Clock/>} 
                            title="בתפוגה קרובה" 
                            count={expiringReagents.length} 
                            linkTo="BatchAndExpiryManagement?view=expiring&days=14" 
                            color="red" 
                            popoverItems={expiringReagents} 
                            popoverType="expiring" 
                        />
                        <SummaryCard 
                            icon={<TrendingDown/>} 
                            title="במלאי קצר" 
                            count={lowStockReagents.length} 
                            linkTo="InventoryReplenishment" 
                            color="orange" 
                            popoverItems={lowStockReagents} 
                            popoverType="low_stock" 
                        />
                        <SummaryCard 
                            icon={<Truck/>} 
                            title="אספקות בדרך" 
                            count={pendingSupplies.length} 
                            linkTo="SupplyTracking" 
                            color="blue" 
                            popoverItems={pendingSupplies} 
                            popoverType="pending_supplies" 
                        />
                        <SummaryCard 
                            icon={<FileText/>} 
                            title="דרישות להשלמה" 
                            count={pendingOrders.length} 
                            linkTo="Orders" 
                            color="purple" 
                            popoverItems={pendingOrders} 
                            popoverType="pending_orders" 
                        />
                    </div>

                    <Card className="bg-white shadow-sm border border-gray-200 rounded-lg">
                        <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
                            <CardTitle className="flex items-center text-base font-semibold text-slate-800">
                                <ClipboardCheck className="h-5 w-5 text-amber-600 ml-2" />
                                הערות ומשימות
                            </CardTitle>
                            <Link to={createPageUrl('DashboardNotes')} className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center">
                                הצג הכל <ArrowLeft className="h-4 w-4 mr-1" />
                            </Link>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            <ScrollArea className="h-48">
                                <div className="space-y-2 text-right">
                                    {dashboardData.dashboardNotes.length > 0 ? dashboardData.dashboardNotes.map((note) =>
                                        <div key={note.id} className="border-r-4 border-amber-400 bg-slate-50 p-2 rounded-r-lg">
                                            {note.title && <p className="font-medium text-slate-800 text-sm mb-1">{note.title}</p>}
                                            <p className="text-slate-600 text-xs line-clamp-2">{note.content}</p>
                                        </div>
                                    ) :
                                        <div className="text-center py-6">
                                            <p className="text-sm text-slate-500">אין הערות פעילות.</p>
                                        </div>
                                    }
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                    
                    <RecentActivity activities={dashboardData.recentActivity} />
                </div>

                {/* Sidebar Content (Left Column on Desktop) */}
                <div className="lg:col-span-2 space-y-6">
                     {/* Summary Cards on Desktop */}
                     <div className="hidden lg:grid grid-cols-2 gap-3">
                        <SummaryCard 
                            icon={<Clock/>} 
                            title="בתפוגה קרובה" 
                            count={expiringReagents.length} 
                            linkTo="BatchAndExpiryManagement?view=expiring&days=14" 
                            color="red" 
                            popoverItems={expiringReagents} 
                            popoverType="expiring" 
                        />
                        <SummaryCard 
                            icon={<TrendingDown/>} 
                            title="במלאי קצר" 
                            count={lowStockReagents.length} 
                            linkTo="InventoryReplenishment" 
                            color="orange" 
                            popoverItems={lowStockReagents} 
                            popoverType="low_stock" 
                        />
                        <SummaryCard 
                            icon={<Truck/>} 
                            title="אספקות בדרך" 
                            count={pendingSupplies.length} 
                            linkTo="SupplyTracking" 
                            color="blue" 
                            popoverItems={pendingSupplies} 
                            popoverType="pending_supplies" 
                        />
                        <SummaryCard 
                            icon={<FileText/>} 
                            title="דרישות להשלמה" 
                            count={pendingOrders.length} 
                            linkTo="Orders" 
                            color="purple" 
                            popoverItems={pendingOrders} 
                            popoverType="pending_orders" 
                        />
                    </div>
                    
                    <div className="w-full">
                        <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center justify-end">
                            <div className="bg-sky-100 p-2 rounded-lg ml-3">
                                <Zap className="h-5 w-5 text-sky-700" />
                            </div>
                            <span>ניווט מהיר ופעולות</span>
                        </h2>
                        <NavGroupAccordion navItems={navItems} adminNavItems={adminNavItems} userRole={user?.role} />
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}
