
import React, { useState, useEffect, useCallback } from "react";
import { getDashboardData } from '@/api/functions';
import { User } from '@/api/entities';
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
import { useIsMobile } from "@/hooks/use-mobile";

import InfoCard from "../components/dashboard/InfoCard";
import MobileAlerts from "../components/dashboard/MobileAlerts";
import CriticalActions from "../components/dashboard/CriticalActions";
import RecentActivity from "../components/dashboard/RecentActivity";
import { NavGroupAccordion } from "../components/dashboard/NavGroupAccordion";

// Status translation map for orders
const statusLabels = {
  DRAFT: 'טיוטה',
  PENDING_SAP: 'ממתין ל-SAP',
  APPROVED: 'מאושר',
  PARTIALLY_RECEIVED: 'התקבל חלקית',
  SUBMITTED: 'הוגש',
  SHIPPING: 'בשילוח',
};

function formatDaysUntilExpiry(days) {
  if (days <= 0) return '!פג תוקף';
  if (days === 1) return 'יום אחד';
  return `${days} ימים`;
}

function formatMonthsOfStock(months) {
  if (months <= 0) return 'אזל';
  const weeks = Math.round(months * 4.33);
  if (weeks <= 4) return `${weeks} שבועות`;
  return `${months.toFixed(1)} חודשים`;
}

function expiryColorClass(days) {
  if (days <= 0) return 'text-red-600 font-bold';
  if (days <= 7) return 'text-red-500 font-semibold';
  return 'text-amber-600';
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
    return format(d, 'dd/MM/yy', { locale: he });
  } catch {
    return '-';
  }
}

export default function Dashboard() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

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
    statistics: {},
    onOrderQuantity: 0
  });

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const userData = await User.me();
      setUser(userData);

      const response = await getDashboardData();
      const payload = response?.data?.data ?? response?.data ?? response ?? {};
      const errorMessage = response?.error || response?.data?.error;
      if (errorMessage) {
        throw new Error(errorMessage);
      }

      setDashboardData({
        expiringReagents: payload.expiringReagents || [],
        lowStockReagents: payload.lowStockReagents || [],
        pendingOrders: payload.pendingOrders || [],
        pendingSupplies: payload.pendingSupplies || [],
        dashboardNotes: payload.dashboardNotes || [],
        lastInventoryCount: payload.lastInventoryCount || null,
        recentActivity: payload.recentActivity || [],
        criticalActions: payload.criticalActions || [],
        statistics: payload.statistics || {},
        onOrderQuantity: payload.onOrderQuantity || 0
      });

    } catch (err) {
      console.error('[Dashboard] Error loading:', err);
      setError(`שגיאה בטעינת הדשבורד: ${err.message}`);
      toast.error('שגיאה בטעינת הדשבורד', { description: err.message });
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

  const { expiringReagents, lowStockReagents, pendingSupplies, pendingOrders, criticalActions, onOrderQuantity } = dashboardData;

  // === Data transformation for InfoCards ===

  const expiringRows = expiringReagents.map((item) => ({
    key: item.id,
    linkTo: createPageUrl(`EditReagentBatch?id=${item.id}`),
    cells: [
      { text: item.name, fullText: item.name },
      { text: formatDaysUntilExpiry(item.daysUntilExpiry), className: expiryColorClass(item.daysUntilExpiry) },
      { text: `${item.currentQuantity} יח'`, className: 'text-slate-500 text-xs' },
      { text: item.batchNumber || '', className: 'text-slate-400 text-xs font-mono' },
    ],
  }));

  const lowStockRows = lowStockReagents.map((item) => ({
    key: item.id,
    linkTo: createPageUrl(`InventoryReplenishment?reagent_id=${item.id}`),
    cells: [
      { text: item.name, fullText: item.name },
      { text: `${item.currentQuantity} יח'`, className: 'text-slate-600' },
      { text: formatMonthsOfStock(item.monthsOfStock), className: item.monthsOfStock < 1 ? 'text-red-600 font-semibold' : 'text-amber-600' },
      { text: item.supplier || '', className: 'text-slate-400 text-xs' },
    ],
  }));

  const pendingSupplyRows = pendingSupplies.map((item) => {
    const isOrder = item.type === 'order';
    return {
      key: item.id,
      linkTo: createPageUrl(`${isOrder ? 'EditOrder' : 'EditWithdrawalRequest'}?id=${item.id}`),
      cells: [
        { text: item.number || '-', className: 'font-mono' },
        { text: item.supplier || '-' },
        { text: formatDate(item.requestDate), className: 'text-slate-500 text-xs' },
      ],
    };
  });

  const pendingOrderRows = pendingOrders.map((item) => ({
    key: item.id,
    linkTo: createPageUrl(`EditOrder?id=${item.id}`),
    cells: [
      { text: item.tempNumber || '-', className: 'font-mono' },
      { text: item.supplier || '-' },
      { text: statusLabels[item.status] || item.status, className: 'text-slate-500 text-xs' },
    ],
  }));

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
        {/* Mobile: MobileAlerts first */}
        <div className="md:hidden mb-4">
          <MobileAlerts actions={criticalActions} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 lg:gap-6">
          {/* Main Content - InfoCards (right side in RTL = first in DOM) */}
          <div className="lg:col-span-3 space-y-4 mb-6 lg:mb-0">
            <InfoCard
              icon={<Clock />}
              title="ריאגנטים קצרי תוקף"
              count={expiringReagents.length}
              titleLinkTo={createPageUrl('BatchAndExpiryManagement?view=expiring&days=14')}
              color="red"
              rows={expiringRows}
              initialVisibleRows={4}
              defaultCollapsed
            />

            <InfoCard
              icon={<TrendingDown />}
              title="מלאי נמוך"
              count={lowStockReagents.length}
              titleLinkTo={createPageUrl('InventoryReplenishment')}
              color="orange"
              rows={lowStockRows}
              initialVisibleRows={4}
              defaultCollapsed
            />

            <InfoCard
              icon={<Truck />}
              title="אספקות בדרך"
              count={pendingSupplies.length}
              titleLinkTo={createPageUrl('SupplyTracking')}
              color="blue"
              rows={pendingSupplyRows}
              initialVisibleRows={4}
              defaultCollapsed
            />

            <InfoCard
              icon={<FileText />}
              title="דרישות רכש להשלמה"
              count={pendingOrders.length}
              titleLinkTo={createPageUrl('Orders')}
              color="purple"
              rows={pendingOrderRows}
              initialVisibleRows={4}
              defaultCollapsed
            />
          </div>

          {/* Sidebar (left side in RTL) */}
          <div className="lg:col-span-2 space-y-6">
            {/* CriticalActions - desktop only */}
            <div className="hidden md:block">
              <CriticalActions actions={criticalActions} />
            </div>

            {/* Dashboard Notes */}
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
                      <div key={note.id} className={`border-r-4 ${note.noteType === 'URGENT' ? 'border-red-500 bg-red-50' : 'border-amber-400 bg-slate-50'} p-2 rounded-r-lg`}>
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
