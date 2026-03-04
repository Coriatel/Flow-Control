
import React, { useState, useEffect, useCallback } from "react";
import { getDashboardData } from '@/api/functions';
import { User } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  AlertTriangle, ArrowLeft, ArrowDownToLine,
  ClipboardCheck, Clock, FileText,
  Loader2, PackageMinus, RefreshCw,
  TrendingDown, Truck, Trash2, Beaker, Package, ScanLine, Clipboard
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { he } from "date-fns/locale";
import { toast } from "sonner";

import InfoCard from "../components/dashboard/InfoCard";
import MobileAlerts from "../components/dashboard/MobileAlerts";
import CriticalActions from "../components/dashboard/CriticalActions";
import RecentActivity from "../components/dashboard/RecentActivity";

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

  if (loading && !isManualRefreshing) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-teal-500" />
        <span className="ms-3 text-lg text-gray-600">טוען דשבורד...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <p className="text-red-600 text-lg">{error}</p>
        <Button onClick={fetchDashboardData} className="mt-4">
          <RefreshCw className="h-4 w-4 me-2" />
          נסה שוב
        </Button>
      </div>
    );
  }

  const { expiringReagents, lowStockReagents, pendingSupplies, pendingOrders, criticalActions } = dashboardData;

  // Count expired items for badge
  const expiredCount = expiringReagents.filter(item => item.daysUntilExpiry <= 0).length;

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
      <div className="bg-gradient-to-br from-white to-slate-50 border-b border-gray-200 px-4 py-3 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">מרכז הבקרה</h1>
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
            <span className="ms-2">רענון</span>
          </Button>
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* Mobile: MobileAlerts first */}
        <div className="md:hidden">
          <MobileAlerts actions={criticalActions} />
        </div>

        {/* ═══ SECTOR 1: Status Overview (InfoCards) ═══ */}
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
            <div className="bg-blue-50 p-1.5 rounded-lg me-2">
              <Package className="h-4 w-4 text-blue-600" />
            </div>
            תמונת מצב
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
            <InfoCard
              icon={<Clock />}
              title="ריאגנטים קצרי תוקף"
              count={expiringReagents.length}
              titleLinkTo={createPageUrl('BatchAndExpiryManagement?view=expiring&days=14')}
              color="red"
              rows={expiringRows}
              initialVisibleRows={3}
            />

            <InfoCard
              icon={<TrendingDown />}
              title="מלאי נמוך"
              count={lowStockReagents.length}
              titleLinkTo={createPageUrl('InventoryReplenishment')}
              color="orange"
              rows={lowStockRows}
              initialVisibleRows={3}
            />

            <InfoCard
              icon={<Truck />}
              title="אספקות בדרך"
              count={pendingSupplies.length}
              titleLinkTo={createPageUrl('SupplyTracking')}
              color="blue"
              rows={pendingSupplyRows}
              initialVisibleRows={3}
            />

            <InfoCard
              icon={<FileText />}
              title="דרישות רכש להשלמה"
              count={pendingOrders.length}
              titleLinkTo={createPageUrl('Orders')}
              color="purple"
              rows={pendingOrderRows}
              initialVisibleRows={3}
            />
          </div>
        </div>

        {/* ═══ SECTOR 2: Alerts & Notes ═══ */}
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
            <div className="bg-amber-50 p-1.5 rounded-lg me-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            התראות והודעות
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 hidden md:block">
              <CriticalActions actions={criticalActions} />
            </div>

            <div className="lg:col-span-2">
              <Card className="bg-white shadow-sm border border-gray-200 rounded-xl h-full">
                <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
                  <CardTitle className="flex items-center text-base font-semibold text-slate-800">
                    <ClipboardCheck className="h-5 w-5 text-amber-600 me-2" />
                    הערות ומשימות
                  </CardTitle>
                  <Link to={createPageUrl('DashboardNotes')} className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center">
                    הצג הכל <ArrowLeft className="h-4 w-4 ms-1" />
                  </Link>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <ScrollArea className="h-48">
                    <div className="space-y-2 text-right">
                      {dashboardData.dashboardNotes.length > 0 ? dashboardData.dashboardNotes.map((note) =>
                        <div key={note.id} className={`border-e-4 ${note.noteType === 'URGENT' ? 'border-red-500 bg-red-50' : 'border-amber-400 bg-slate-50'} p-2 rounded-e-lg`}>
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
            </div>
          </div>
        </div>

        {/* ═══ SECTOR 3: Inventory Actions ═══ */}
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
            <div className="bg-teal-50 p-1.5 rounded-lg me-2">
              <ScanLine className="h-4 w-4 text-teal-600" />
            </div>
            פעולות מלאי
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Incoming - הכנסה למלאי */}
            <Card className="bg-white shadow-sm border border-gray-200 rounded-xl hover:shadow-lg transition-shadow border-e-4 border-e-green-400">
              <CardHeader className="py-3 px-4">
                <CardTitle className="flex items-center text-base font-semibold text-slate-800">
                  <div className="bg-green-50 p-2 rounded-lg me-2">
                    <ArrowDownToLine className="h-5 w-5 text-green-600" />
                  </div>
                  הכנסה למלאי
                  {pendingSupplies.length > 0 && (
                    <span className="ms-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                      {pendingSupplies.length} ממתינים
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-2">
                  <Link
                    to={createPageUrl('NewDelivery')}
                    className="flex items-center gap-3 p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors group"
                  >
                    <Truck className="h-5 w-5 text-green-600 group-hover:text-green-700" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">קליטת משלוח חדש</p>
                      <p className="text-xs text-slate-500">רישום משלוח שהתקבל מספק</p>
                    </div>
                  </Link>
                  <Link
                    to={createPageUrl('InventoryCount')}
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors group"
                  >
                    <Clipboard className="h-5 w-5 text-slate-600 group-hover:text-slate-700" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">ספירת מלאי</p>
                      <p className="text-xs text-slate-500">עדכון כמויות לפי ספירה פיזית</p>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Outgoing - הוצאה מהמלאי */}
            <Card className="bg-white shadow-sm border border-gray-200 rounded-xl hover:shadow-lg transition-shadow border-e-4 border-e-red-400">
              <CardHeader className="py-3 px-4">
                <CardTitle className="flex items-center text-base font-semibold text-slate-800">
                  <div className="bg-red-50 p-2 rounded-lg me-2">
                    <PackageMinus className="h-5 w-5 text-red-600" />
                  </div>
                  הוצאה מהמלאי
                  {expiredCount > 0 && (
                    <span className="ms-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                      {expiredCount} פגי תוקף
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to={createPageUrl('InventoryRemoval?preset=destroy')}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-red-50 hover:bg-red-100 transition-colors group text-center"
                  >
                    <Trash2 className="h-5 w-5 text-red-600 group-hover:text-red-700" />
                    <p className="text-xs font-medium text-slate-800">השמדה</p>
                    <p className="text-[10px] text-slate-500">פגי תוקף / פגומים</p>
                  </Link>
                  <Link
                    to={createPageUrl('InventoryRemoval?preset=usage')}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors group text-center"
                  >
                    <Beaker className="h-5 w-5 text-emerald-600 group-hover:text-emerald-700" />
                    <p className="text-xs font-medium text-slate-800">שימוש</p>
                    <p className="text-[10px] text-slate-500">מעבדה / בדיקות</p>
                  </Link>
                  <Link
                    to={createPageUrl('InventoryRemoval?preset=shipment')}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors group text-center"
                  >
                    <Truck className="h-5 w-5 text-blue-600 group-hover:text-blue-700" />
                    <p className="text-xs font-medium text-slate-800">משלוח</p>
                    <p className="text-[10px] text-slate-500">העברה לגוף אחר</p>
                  </Link>
                  <Link
                    to={createPageUrl('InventoryRemoval?preset=other')}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors group text-center"
                  >
                    <FileText className="h-5 w-5 text-slate-600 group-hover:text-slate-700" />
                    <p className="text-xs font-medium text-slate-800">סיבה אחרת</p>
                    <p className="text-[10px] text-slate-500">מחקר / פנימי</p>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ═══ SECTOR 4: Activity Log ═══ */}
        <RecentActivity activities={dashboardData.recentActivity} />
      </div>
    </div>
  );
}
