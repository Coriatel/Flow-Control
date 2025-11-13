
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { createPageUrl } from "@/utils";
import {
  ArrowLeft,
  Download,
  FileText,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Package,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
  Loader2,
  RefreshCw,
  Target,
  Zap
} from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

// Import Charts
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

import { generateReports } from '@/api/functions';
import { getAdvancedAnalytics } from '@/api/functions';

export default function ReportsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(6);
  const [activeTab, setActiveTab] = useState('analytics');

  const [reportFilters, setReportFilters] = useState({
    reportType: 'inventory_summary',
    includeDetails: true,
    alertDays: 30
  });

  // Color scheme matching the system design
  const colors = {
    primary: '#3b82f6',
    success: '#16a34a',
    warning: '#f59e0b',
    danger: '#dc2626',
    info: '#06b6d4',
    purple: '#8b5cf6',
    gray: '#6b7280'
  };

  const pieColors = [colors.primary, colors.success, colors.warning, colors.danger, colors.info, colors.purple];

  const loadAnalyticsData = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const response = await getAdvancedAnalytics({ period: selectedPeriod });
      if (response.data && response.data.success) {
        setAnalyticsData(response.data.data);
      } else {
        toast({
          title: "שגיאה בטעינת נתונים",
          description: "לא ניתן לטעון את הנתונים הסטטיסטיים",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: "שגיאה בטעינת סטטיסטיקות",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setAnalyticsLoading(false);
    }
  }, [selectedPeriod, toast]);

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod, loadAnalyticsData]);


  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const response = await generateReports(reportFilters);
      
      if (response.data && response.data.success) {
        // Download the generated report
        const blob = new Blob([response.data.reportData], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = response.data.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast({
          title: "דוח הופק בהצלחה",
          description: `הדוח ${response.data.fileName} נוצר והורד למחשב`,
          variant: "default"
        });
      } else {
        throw new Error(response.data?.message || 'שגיאה לא ידועה');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "שגיאה ביצירת דוח",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStockStatusColor = (status) => {
    const statusColors = {
      'in_stock': colors.success,
      'low_stock': colors.warning, 
      'out_of_stock': colors.danger,
      'overstocked': colors.info
    };
    return statusColors[status] || colors.gray;
  };

  const StatsCard = ({ title, value, subtitle, icon: Icon, trend, color = colors.primary }) => (
    <Card className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <div className="flex items-center">
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              {trend && (
                <div className={`flex items-center mr-2 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {trend > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <span className="text-xs font-medium">{Math.abs(trend)}%</span>
                </div>
              )}
            </div>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
          <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{backgroundColor: `${color}20`}}>
            <Icon className="h-6 w-6" style={{color}} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (analyticsLoading && !analyticsData) {
    return (
      <div className="flex justify-center items-center h-64" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="mr-3 text-lg text-gray-600">טוען נתונים סטטיסטיים...</p>
      </div>
    );
  }

  return (
    <div className="p-6" dir="rtl">
      {/* Header */}
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
          <h1 className="text-2xl font-bold text-slate-800">דוחות וניתוחים מתקדמים</h1>
        </div>
        <Button
          variant="outline"
          onClick={loadAnalyticsData}
          disabled={analyticsLoading}
          className="bg-white/40 backdrop-blur-lg border border-white/30"
        >
          {analyticsLoading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <RefreshCw className="h-4 w-4 ml-2" />}
          רענן נתונים
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="analytics">ניתוחים וטרנדים</TabsTrigger>
          <TabsTrigger value="reports">דוחות מסורתיים</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          {analyticsData && (
            <>
              {/* Period Selection */}
              <Card className="mb-6 bg-white/40 backdrop-blur-lg border border-white/30 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 ml-2" />
                    בחירת תקופת ניתוח
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 items-center">
                    <Label>תקופה:</Label>
                    <Select value={selectedPeriod.toString()} onValueChange={(value) => setSelectedPeriod(parseInt(value))}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 חודשים אחרונים</SelectItem>
                        <SelectItem value="6">6 חודשים אחרונים</SelectItem>
                        <SelectItem value="12">שנה אחרונה</SelectItem>
                        <SelectItem value="24">שנתיים אחרונות</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Key Metrics Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <StatsCard
                  title="סה״כ ריאגנטים"
                  value={analyticsData.summary_stats.total_reagents}
                  subtitle={`${analyticsData.summary_stats.active_reagents} פעילים`}
                  icon={Package}
                  color={colors.primary}
                />
                <StatsCard
                  title="השלמת הזמנות"
                  value={`${analyticsData.efficiency_metrics.order_completion_rate}%`}
                  subtitle={`${analyticsData.efficiency_metrics.total_orders} הזמנות כולל`}
                  icon={CheckCircle2}
                  color={colors.success}
                />
                <StatsCard
                  title="זמן עיבוד ממוצע"
                  value={`${analyticsData.efficiency_metrics.avg_order_processing_days} ימים`}
                  subtitle="הזמנות שהושלמו"
                  icon={Clock}
                  color={colors.warning}
                />
                <StatsCard
                  title="תחזית צריכה"
                  value={analyticsData.predictions.next_month_consumption}
                  subtitle="יחידות לחודש הבא"
                  icon={Target}
                  color={colors.info}
                />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Consumption Trend Chart */}
                <Card className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="h-5 w-5 ml-2" />
                      טרנד צריכה חודשי
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={analyticsData.consumption_trend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke={colors.primary}
                          fill={`${colors.primary}30`}
                          name="יחידות שנוצלו"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Stock Status Distribution */}
                <Card className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Package className="h-5 w-5 ml-2" />
                      התפלגות סטטוס מלאי
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={Object.entries(analyticsData.stock_distribution).map(([key, value], index) => ({
                            name: key === 'in_stock' ? 'במלאי' : 
                                  key === 'low_stock' ? 'מלאי נמוך' :
                                  key === 'out_of_stock' ? 'אזל המלאי' :
                                  key === 'overstocked' ? 'מלאי עודף' : key,
                            value,
                            color: getStockStatusColor(key)
                          }))}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {Object.entries(analyticsData.stock_distribution).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Delivery vs Orders Comparison */}
              <Card className="mb-6 bg-white/40 backdrop-blur-lg border border-white/30 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 ml-2" />
                    השוואת הזמנות מול משלוחים
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={analyticsData.orders_trend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="orders" fill={colors.primary} name="הזמנות" />
                      <Bar dataKey="items" fill={colors.success} name="פריטים" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Reagents Table */}
              <Card className="mb-6 bg-white/40 backdrop-blur-lg border border-white/30 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 ml-2" />
                    ריאגנטים מובילים בצריכה
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-right">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="p-3 font-semibold">דירוג</th>
                          <th className="p-3 font-semibold">שם הריאגנט</th>
                          <th className="p-3 font-semibold">צריכה כוללת</th>
                          <th className="p-3 font-semibold">מספר עסקאות</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analyticsData.top_reagents.slice(0, 10).map((reagent, index) => (
                          <tr key={reagent.reagent_id} className="border-b hover:bg-slate-50">
                            <td className="p-3">
                              <Badge variant={index < 3 ? "default" : "secondary"}>
                                {index + 1}
                              </Badge>
                            </td>
                            <td className="p-3 font-medium">{reagent.reagent_name}</td>
                            <td className="p-3">{reagent.total_consumed} יח'</td>
                            <td className="p-3">{reagent.transactions_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Predictions & Insights */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200">
                  <CardHeader>
                    <CardTitle className="flex items-center text-blue-800">
                      <Zap className="h-5 w-5 ml-2" />
                      תחזיות חכמות
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-blue-700">צריכה צפויה לחודש הבא:</span>
                        <span className="font-bold text-lg text-blue-900">
                          {analyticsData.predictions.next_month_consumption} יח'
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-700">משלוחים צפויים:</span>
                        <span className="font-bold text-lg text-blue-900">
                          {analyticsData.predictions.next_month_deliveries} יח'
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-700">רמת ביטחון:</span>
                        <Badge variant={analyticsData.predictions.confidence === 'high' ? 'default' : 'secondary'}>
                          {analyticsData.predictions.confidence === 'high' ? 'גבוהה' : 
                           analyticsData.predictions.confidence === 'medium' ? 'בינונית' : 'נמוכה'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-50 to-orange-100 border border-amber-200">
                  <CardHeader>
                    <CardTitle className="flex items-center text-amber-800">
                      <AlertTriangle className="h-5 w-5 ml-2" />
                      ניתוח פגי תוקף
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-amber-700">סה״כ פגי תוקף:</span>
                        <span className="font-bold text-lg text-amber-900">
                          {analyticsData.expiry_analysis.total_expired}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-amber-700">הושמדו:</span>
                        <span className="font-bold text-amber-900">
                          {analyticsData.expiry_analysis.disposed}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-amber-700">שימוש אחר:</span>
                        <span className="font-bold text-amber-900">
                          {analyticsData.expiry_analysis.other_use}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-amber-700">כמות מושפעת:</span>
                        <span className="font-bold text-lg text-amber-900">
                          {analyticsData.expiry_analysis.total_quantity_affected} יח'
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="reports">
          {/* Traditional Reports Section */}
          <Card className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 ml-2" />
                יצירת דוחות מסורתיים
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <Label>סוג הדוח:</Label>
                  <Select
                    value={reportFilters.reportType}
                    onValueChange={(value) => setReportFilters(prev => ({ ...prev, reportType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inventory_summary">סיכום מלאי</SelectItem>
                      <SelectItem value="expiry_alerts">התרעות תפוגה</SelectItem>
                      <SelectItem value="stock_movements">תנועות מלאי</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {reportFilters.reportType === 'expiry_alerts' && (
                  <div>
                    <Label>ימי התרעה:</Label>
                    <Input
                      type="number"
                      value={reportFilters.alertDays}
                      onChange={(e) => setReportFilters(prev => ({ ...prev, alertDays: parseInt(e.target.value) || 30 }))}
                      min="1"
                      max="365"
                    />
                  </div>
                )}

                <div className="flex items-end">
                  <Button
                    onClick={handleGenerateReport}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Download className="h-4 w-4 ml-2" />}
                    יצר דוח
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-2 space-x-reverse">
                <input
                  type="checkbox"
                  id="includeDetails"
                  checked={reportFilters.includeDetails}
                  onChange={(e) => setReportFilters(prev => ({ ...prev, includeDetails: e.target.checked }))}
                />
                <Label htmlFor="includeDetails">כלול פרטים מורחבים בדוח</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
