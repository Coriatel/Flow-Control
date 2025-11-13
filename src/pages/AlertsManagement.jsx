import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Settings,
  Plus,
  Eye,
  Pause,
  Check,
  X,
  Loader2,
  Filter,
  Calendar,
  Mail,
  Shield
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { alertsManager } from "@/api/functions";
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function AlertsManagement() {
  const { toast } = useToast();
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [alertRules, setAlertRules] = useState([]);
  const [scheduledReminders, setScheduledReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingAlert, setProcessingAlert] = useState(null);
  const [showCreateRuleDialog, setShowCreateRuleDialog] = useState(false);
  const [showCreateReminderDialog, setShowCreateReminderDialog] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    priority: 'all',
    status: 'all',
    type: 'all'
  });

  // New rule form state
  const [newRule, setNewRule] = useState({
    rule_name: '',
    rule_type: '',
    priority: 'medium',
    conditions: {},
    target_filters: {},
    notification_methods: ['dashboard'],
    recipients: [],
    check_frequency: 'daily',
    auto_resolve: true,
    notes: ''
  });

  useEffect(() => {
    loadAlertsData();
  }, []);

  const loadAlertsData = async () => {
    setLoading(true);
    try {
      const alertsResponse = await alertsManager({ 
        action: 'get_active_alerts', 
        data: { filters: filterOptions } 
      });

      if (alertsResponse?.data?.success) {
        setActiveAlerts(alertsResponse.data.data || []);
      } else {
        console.warn('No active alerts or empty response');
        setActiveAlerts([]);
      }

      // For now, simulate empty rules and reminders until we implement their management
      setAlertRules([]);
      setScheduledReminders([]);

    } catch (error) {
      console.error('Error loading alerts data:', error);
      setActiveAlerts([]);
      toast({
        title: "שגיאה בטעינת נתונים", 
        description: "לא ניתן לטעון נתוני התראות. יוצג מצב ריק.",
        variant: "default"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId) => {
    if (!alertId) return;
    
    setProcessingAlert(alertId);
    try {
      const response = await alertsManager({
        action: 'acknowledge_alert',
        data: { alertId }
      });

      if (response.data && response.data.success) {
        toast({
          title: "התראה אושרה",
          description: "ההתראה סומנה כנקראה",
          variant: "default"
        });
        loadAlertsData();
      }
    } catch (error) {
      toast({
        title: "שגיאה באישור התראה",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setProcessingAlert(null);
    }
  };

  const handleResolveAlert = async (alertId, resolution) => {
    if (!alertId) return;
    
    setProcessingAlert(alertId);
    try {
      const response = await alertsManager({
        action: 'resolve_alert',
        data: { alertId, resolution }
      });

      if (response.data && response.data.success) {
        toast({
          title: "התראה נפתרה",
          description: "ההתראה סומנה כפתורה",
          variant: "default"
        });
        loadAlertsData();
      }
    } catch (error) {
      toast({
        title: "שגיאה בפתרון התראה",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setProcessingAlert(null);
    }
  };

  const handleCreateRule = async () => {
    if (!newRule.rule_name || !newRule.rule_type) {
      toast({
        title: "שגיאה",
        description: "נא למלא שם כלל וסוג התראה",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await alertsManager({
        action: 'create_rule',
        data: newRule
      });

      if (response.data && response.data.success) {
        toast({
          title: "כלל התראה נוצר",
          description: `כלל "${newRule.rule_name}" נוצר בהצלחה`,
          variant: "default"
        });
        setShowCreateRuleDialog(false);
        setNewRule({
          rule_name: '',
          rule_type: '',
          priority: 'medium',
          conditions: {},
          target_filters: {},
          notification_methods: ['dashboard'],
          recipients: [],
          check_frequency: 'daily',
          auto_resolve: true,
          notes: ''
        });
        loadAlertsData();
      }
    } catch (error) {
      toast({
        title: "שגיאה ביצירת כלל",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getPriorityBadge = (priority) => {
    const variants = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    
    const labels = {
      low: 'נמוכה',
      medium: 'בינונית',
      high: 'גבוהה',
      critical: 'קריטית'
    };

    return (
      <Badge className={variants[priority]}>
        {labels[priority]}
      </Badge>
    );
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: 'bg-red-100 text-red-800',
      acknowledged: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      snoozed: 'bg-purple-100 text-purple-800'
    };
    
    const labels = {
      active: 'פעילה',
      acknowledged: 'נקראה',
      resolved: 'נפתרה',
      snoozed: 'מושתקת'
    };

    return (
      <Badge className={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const getAlertIcon = (alertType) => {
    const icons = {
      expiry_warning: Clock,
      low_stock: AlertTriangle,
      no_stock: X,
      order_delay: Calendar,
      inventory_count_overdue: CheckCircle,
      batch_missing: Shield,
      supplier_issue: AlertTriangle,
      cost_threshold: AlertTriangle,
      usage_anomaly: AlertTriangle,
      compliance_violation: Shield
    };
    
    const IconComponent = icons[alertType] || Bell;
    return <IconComponent className="h-5 w-5" />;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-blue-500" />
          <div className="text-gray-500">טוען נתוני התראות...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">מרכז התראות ותזכורות</h1>
        <p className="text-gray-600">ניהול התראות אוטומטיות ותזכורות מתוזמנות</p>
      </div>

      <Tabs defaultValue="active-alerts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active-alerts">התראות פעילות</TabsTrigger>
          <TabsTrigger value="alert-rules">כללי התראה</TabsTrigger>
          <TabsTrigger value="settings">הגדרות</TabsTrigger>
        </TabsList>

        <TabsContent value="active-alerts" className="space-y-6">
          <div className="space-y-4">
            {activeAlerts.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">אין התראות פעילות</h3>
                  <p className="text-gray-500">כל ההתראות טופלו או שלא נמצאו בעיות במערכת</p>
                </CardContent>
              </Card>
            ) : (
              activeAlerts.map((alert) => (
                <Card key={alert.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-reverse space-x-4">
                        <div className="mt-1">
                          {getAlertIcon(alert.alert_type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{alert.title}</h3>
                            {getPriorityBadge(alert.priority)}
                            {getStatusBadge(alert.status)}
                          </div>
                          <p className="text-gray-600 mb-4">{alert.message}</p>
                          
                          <div className="text-sm text-gray-500">
                            נוצרה: {format(new Date(alert.created_date), 'dd/MM/yyyy HH:mm', { locale: he })}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        {alert.status === 'active' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAcknowledgeAlert(alert.id)}
                              disabled={processingAlert === alert.id}
                            >
                              {processingAlert === alert.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                              אשר קריאה
                            </Button>
                          </>
                        )}
                        
                        {['active', 'acknowledged'].includes(alert.status) && (
                          <Button
                            size="sm"
                            onClick={() => handleResolveAlert(alert.id, { action_taken: 'טופל ידנית', notes: '' })}
                            disabled={processingAlert === alert.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4" />
                            סמן כפתור
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="alert-rules" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">כללי התראה</h2>
            <Dialog open={showCreateRuleDialog} onOpenChange={setShowCreateRuleDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 ml-2" />
                  צור כלל חדש
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>יצירת כלל התראה חדש</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="rule-name">שם הכלל</Label>
                      <Input
                        id="rule-name"
                        value={newRule.rule_name}
                        onChange={(e) => setNewRule(prev => ({ ...prev, rule_name: e.target.value }))}
                        placeholder="שם תיאורי לכלל"
                      />
                    </div>
                    <div>
                      <Label>סוג התראה</Label>
                      <Select value={newRule.rule_type} onValueChange={(value) => setNewRule(prev => ({ ...prev, rule_type: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="בחר סוג התראה" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="expiry_warning">אזהרת תפוגה</SelectItem>
                          <SelectItem value="low_stock">מלאי נמוך</SelectItem>
                          <SelectItem value="no_stock">אזל מלאי</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="rule-notes">הערות</Label>
                    <Textarea
                      id="rule-notes"
                      value={newRule.notes}
                      onChange={(e) => setNewRule(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="הערות נוספות על הכלל..."
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateRuleDialog(false)}>
                    ביטול
                  </Button>
                  <Button onClick={handleCreateRule} disabled={!newRule.rule_name || !newRule.rule_type}>
                    צור כלל
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="text-center py-12">
              <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">אין כללי התראה מוגדרים</h3>
              <p className="text-gray-500 mb-4">צור כללי התראה אוטומטיים למעקב פרואקטיבי אחר המלאי</p>
              <Button onClick={() => setShowCreateRuleDialog(true)}>
                <Plus className="h-4 w-4 ml-2" />
                צור כלל ראשון
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>הגדרות התראות כלליות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Bell className="h-4 w-4" />
                <AlertDescription>
                  מערכת ההתראות בבנייה. כרגע ניתן לצפות במצב הקיים ולהכין כללי התראות בסיסיים.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">סטטיסטיקות</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>התראות פעילות</span>
                      <span className="font-medium">{activeAlerts.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>כללי התראה</span>
                      <span className="font-medium">{alertRules.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}