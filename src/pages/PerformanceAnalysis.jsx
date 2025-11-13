import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Activity, 
  Clock, 
  Database, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  Loader2,
  TrendingUp,
  Server,
  RefreshCw
} from "lucide-react";

export default function PerformanceAnalysisPage() {
  const [performanceData, setPerformanceData] = useState({});
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    analyzePerformance();
  }, []);

  const analyzePerformance = async () => {
    setLoading(true);
    const startTime = Date.now();
    const analysis = {
      loadTimes: {},
      dataVolumes: {},
      bottlenecks: [],
      recommendations: []
    };

    try {
      // Test Dashboard load time
      const dashboardStart = Date.now();
      const { Reagent } = await import('@/api/entities');
      const reagents = await Reagent.list();
      analysis.loadTimes.dashboard = Date.now() - dashboardStart;
      analysis.dataVolumes.reagents = reagents.length;

      // Test other entities
      const { Order } = await import('@/api/entities');
      const { WithdrawalRequest } = await import('@/api/entities');
      const { ReagentBatch } = await import('@/api/entities');

      const entityTests = [
        { name: 'Orders', entity: Order },
        { name: 'WithdrawalRequests', entity: WithdrawalRequest },
        { name: 'ReagentBatches', entity: ReagentBatch }
      ];

      for (const test of entityTests) {
        const testStart = Date.now();
        const data = await test.entity.list();
        analysis.loadTimes[test.name] = Date.now() - testStart;
        analysis.dataVolumes[test.name] = data.length;
      }

      // Identify bottlenecks
      Object.entries(analysis.loadTimes).forEach(([key, time]) => {
        if (time > 2000) {
          analysis.bottlenecks.push({
            area: key,
            time: time,
            severity: 'high',
            issue: `טעינה איטית - ${time}ms`
          });
        } else if (time > 1000) {
          analysis.bottlenecks.push({
            area: key,
            time: time,
            severity: 'medium',
            issue: `טעינה בינונית - ${time}ms`
          });
        }
      });

      // Generate recommendations
      if (analysis.dataVolumes.reagents > 500) {
        analysis.recommendations.push({
          type: 'optimization',
          priority: 'high',
          title: 'יש יותר מ-500 ריאגנטים',
          description: 'מומלץ להוסיף פגינציה ו-lazy loading',
          action: 'הוסף עמוד וטעינה חכמה'
        });
      }

      if (analysis.loadTimes.dashboard > 3000) {
        analysis.recommendations.push({
          type: 'critical',
          priority: 'critical',
          title: 'דשבורד טוען לאט',
          description: `זמן טעינה: ${analysis.loadTimes.dashboard}ms`,
          action: 'אופטימיזציה נדרשת מיידית'
        });
      }

      // Check for memory usage patterns
      if (window.performance && window.performance.memory) {
        const memory = window.performance.memory;
        analysis.memory = {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit
        };

        if (memory.usedJSHeapSize / memory.jsHeapSizeLimit > 0.8) {
          analysis.recommendations.push({
            type: 'memory',
            priority: 'high',
            title: 'שימוש גבוה בזיכרון',
            description: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB מתוך ${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)}MB`,
            action: 'נקה נתונים שלא בשימוש'
          });
        }
      }

      // Network analysis
      if (navigator.connection) {
        analysis.network = {
          effectiveType: navigator.connection.effectiveType,
          downlink: navigator.connection.downlink
        };

        if (navigator.connection.effectiveType === '2g' || navigator.connection.downlink < 1) {
          analysis.recommendations.push({
            type: 'network',
            priority: 'medium',
            title: 'חיבור אינטרנט איטי',
            description: `סוג חיבור: ${navigator.connection.effectiveType}`,
            action: 'הוסף מצב offline וcaching'
          });
        }
      }

      setPerformanceData(analysis);
      setRecommendations(analysis.recommendations);

    } catch (error) {
      console.error('Performance analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (time) => {
    if (time < 500) return 'text-green-600';
    if (time < 1000) return 'text-yellow-600';
    if (time < 2000) return 'text-orange-600';
    return 'text-red-600';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      default: return 'bg-blue-500 text-white';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-blue-500" />
          <div className="text-gray-500">מנתח ביצועים...</div>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ניתוח ביצועים</h1>
          <p className="text-gray-600 mt-1">בדיקת מהירות וביצועי האפליקציה</p>
        </div>
        <Button onClick={analyzePerformance} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          בדוק שוב
        </Button>
      </div>

      {/* Overall Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2 text-blue-600" />
            סטטוס כללי
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Object.keys(performanceData.loadTimes || {}).length}
              </div>
              <div className="text-sm text-gray-500">דפים נבדקו</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {performanceData.bottlenecks?.length || 0}
              </div>
              <div className="text-sm text-gray-500">צווארי בקבוק</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {recommendations.length}
              </div>
              <div className="text-sm text-gray-500">המלצות</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Load Times */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2 text-green-600" />
            זמני טעינה
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(performanceData.loadTimes || {}).map(([key, time]) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="font-medium">{key}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`font-bold ${getPerformanceColor(time)}`}>
                    {time}ms
                  </div>
                  <div className="w-32">
                    <Progress 
                      value={Math.min((time / 3000) * 100, 100)} 
                      className="h-2"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Volumes */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2 text-purple-600" />
            נפח נתונים
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(performanceData.dataVolumes || {}).map(([key, count]) => (
              <div key={key} className="text-center p-4 border rounded-lg">
                <div className="text-xl font-bold text-purple-600">{count}</div>
                <div className="text-sm text-gray-500">{key}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Memory Usage */}
      {performanceData.memory && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Server className="h-5 w-5 mr-2 text-blue-600" />
              שימוש בזיכרון
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>זיכרון בשימוש</span>
                <span className="font-bold">
                  {Math.round(performanceData.memory.used / 1024 / 1024)}MB
                </span>
              </div>
              <Progress 
                value={(performanceData.memory.used / performanceData.memory.limit) * 100} 
                className="h-3"
              />
              <div className="text-sm text-gray-500">
                {Math.round(performanceData.memory.total / 1024 / 1024)}MB מתוך {Math.round(performanceData.memory.limit / 1024 / 1024)}MB
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
            המלצות לשיפור
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recommendations.length === 0 ? (
            <div className="text-center py-8 text-green-600">
              <CheckCircle className="h-12 w-12 mx-auto mb-4" />
              <div className="text-lg font-semibold">ביצועים מעולים!</div>
              <div className="text-sm">לא נמצאו בעיות ביצועים</div>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.map((rec, index) => (
                <Alert key={index} className="border-l-4 border-l-orange-500">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold flex items-center gap-2">
                          {rec.title}
                          <Badge className={getPriorityColor(rec.priority)}>
                            {rec.priority}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">{rec.description}</div>
                        <div className="text-sm font-medium text-blue-600 mt-2">{rec.action}</div>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}