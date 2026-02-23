
import React, { useState, useEffect, useCallback } from "react";
import { getDashboardData } from '@/api/functions';
import { User } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  AlertTriangle, ArrowLeft,
  ClipboardCheck, Clock, FileText,
  Loader2, RefreshCw,
  TrendingDown, Truck
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { he } from "date-fns/locale";
import { toast } from "sonner";

import InfoCard from "../components/dashboard/InfoCard";
import MobileAlerts from "../components/dashboard/MobileAlerts";
import CriticalActions from "../components/dashboard/CriticalActions";
import RecentActivity from "../components/dashboard/RecentActivity";

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

        {/* Top section: CriticalActions + Notes side by side */}
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

        {/* Middle section: 4 InfoCards in responsive grid */}
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

        {/* Bottom section: RecentActivity */}
        <RecentActivity activities={dashboardData.recentActivity} />
      </div>
    </div>
  );
}
