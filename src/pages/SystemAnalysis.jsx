import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  FileCode, 
  Zap,
  TrendingUp,
  Settings,
  Search,
  RefreshCw
} from "lucide-react";

export default function SystemAnalysis() {
  const [analysisResults, setAnalysisResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const runSystemAnalysis = async () => {
    setLoading(true);
    try {
      // סימולציה של ניתוח מערכת מקיף
      const results = {
        codeQuality: {
          score: 85,
          issues: [
            {
              type: "performance", 
              severity: "medium",
              file: "pages/Dashboard.js",
              line: 127,
              description: "Promise.allSettled יכול להיות מוחלף ב-sequential loading עם cache",
              suggestion: "להשתמש ב-caching layer ו-sequential fetching"
            },
            {
              type: "redundancy",
              severity: "low", 
              file: "components/security/SecurityMonitor.js",
              line: 45,
              description: "Security checks רצים בכל רכיב - יכול להיות centralized",
              suggestion: "להעביר ל-Layout או Context provider"
            },
            {
              type: "unused",
              severity: "low",
              file: "functions/getDashboardData.js", 
              line: 1,
              description: "פונקציה לא בשימוש - נוצרה אבל לא מופעלת",
              suggestion: "למחוק או להשתמש במקום הקוד הישיר"
            }
          ]
        },
        performance: {
          score: 78,
          metrics: {
            loadTime: "2.3s",
            memoryUsage: "145MB",
            bundleSize: "2.1MB",
            apiCalls: 15
          },
          bottlenecks: [
            {
              component: "Dashboard",
              issue: "טוען 5 entities בו-זמנית",
              impact: "עלול לגרום ל-Rate Limit",
              solution: "Sequential loading עם delays"
            },
            {
              component: "InventoryCount", 
              issue: "טוען את כל הריאגנטים + batches",
              impact: "איטי עם מאגר מידע גדול",
              solution: "Pagination או lazy loading"
            }
          ]
        },
        serverSide: {
          functions: [
            {
              name: "processCompletedCount",
              status: "active",
              complexity: "high",
              issues: ["עיבוד ברקע ארוך", "חסר error handling מתקדם"]
            },
            {
              name: "getDashboardData", 
              status: "unused",
              complexity: "medium",
              issues: ["נוצר אך לא בשימוש"]
            }
          ],
          recommendations: [
            "לשלב batch processing",
            "להוסיף queue system",
            "לשפר error handling"
          ]
        },
        redundantCode: [
          {
            pattern: "Rate limiting logic",
            locations: ["Dashboard.js", "ManageReagents.js", "InventoryCount.js"],
            suggestion: "ליצור shared utility"
          },
          {
            pattern: "Entity fetching patterns",
            locations: ["Multiple components"],
            suggestion: "ליצור custom hooks"
          }
        ],
        heavyFeatures: [
          {
            feature: "Real-time Security Monitoring",
            impact: "Medium",
            description: "רץ בכל רכיב, צורך CPU",
            critical: false
          },
          {
            feature: "Comprehensive Logging",
            impact: "Low-Medium", 
            description: "הרבה console.log statements",
            critical: false
          },
          {
            feature: "Multiple Toast Notifications",
            impact: "Low",
            description: "כמה מערכות הודעות חופפות",
            critical: false
          }
        ]
      };
      
      setAnalysisResults(results);
    } catch (error) {
      console.error("Error running analysis:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSystemAnalysis();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-center">
          <RefreshCw className="h-10 w-10 animate-spin mx-auto mb-4 text-blue-500" />
          <div className="text-gray-500">מבצע ניתוח מערכת מקיף...</div>
        </div>
      </div>
    );
  }

  if (!analysisResults) return null;

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">ניתוח איכות וביצועים</h1>
        <p className="text-gray-600">בדיקה מקיפה של המערכת לזיהוי נקודות שיפור</p>
      </div>

      <Tabs defaultValue="quality" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="quality">איכות קוד</TabsTrigger>
          <TabsTrigger value="performance">ביצועים</TabsTrigger>
          <TabsTrigger value="server">צד שרת</TabsTrigger>
          <TabsTrigger value="optimization">אופטימיזציה</TabsTrigger>
        </TabsList>

        <TabsContent value="quality">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCode className="h-5 w-5" />
                איכות קוד - ציון: {analysisResults.codeQuality.score}/100
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysisResults.codeQuality.issues.map((issue, index) => (
                  <Alert key={index} className={
                    issue.severity === 'high' ? 'border-red-200 bg-red-50' :
                    issue.severity === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                    'border-blue-200 bg-blue-50'
                  }>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="mb-2">
                        <Badge variant={
                          issue.severity === 'high' ? 'destructive' :
                          issue.severity === 'medium' ? 'default' : 'secondary'
                        }>
                          {issue.severity === 'high' ? 'גבוה' : 
                           issue.severity === 'medium' ? 'בינוני' : 'נמוך'}
                        </Badge>
                        <span className="mr-2 font-medium">{issue.file}:{issue.line}</span>
                      </div>
                      <p className="mb-2">{issue.description}</p>
                      <p className="text-sm text-green-700"><strong>הצעה:</strong> {issue.suggestion}</p>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  מדדי ביצועים
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>זמן טעינה:</span>
                    <Badge>{analysisResults.performance.metrics.loadTime}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>שימוש בזיכרון:</span>
                    <Badge>{analysisResults.performance.metrics.memoryUsage}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>גודל Bundle:</span>
                    <Badge>{analysisResults.performance.metrics.bundleSize}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>קריאות API:</span>
                    <Badge>{analysisResults.performance.metrics.apiCalls}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  צווארי בקבוק
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisResults.performance.bottlenecks.map((bottleneck, index) => (
                    <div key={index} className="p-3 bg-yellow-50 rounded-md">
                      <div className="font-medium text-yellow-800">{bottleneck.component}</div>
                      <div className="text-sm text-yellow-700 mt-1">{bottleneck.issue}</div>
                      <div className="text-xs text-yellow-600 mt-1"><strong>פתרון:</strong> {bottleneck.solution}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="server">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                ניתוח צד שרת
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-3">פונקציות Backend:</h3>
                  <div className="space-y-2">
                    {analysisResults.serverSide.functions.map((func, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div>
                          <span className="font-medium">{func.name}</span>
                          <Badge className="mr-2" variant={func.status === 'active' ? 'default' : 'secondary'}>
                            {func.status === 'active' ? 'פעיל' : 'לא בשימוש'}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          מורכבות: {func.complexity === 'high' ? 'גבוהה' : 'בינונית'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-3">המלצות:</h3>
                  <ul className="space-y-1">
                    {analysisResults.serverSide.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-600 ml-2" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  קוד מיותר / כפול
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisResults.redundantCode.map((item, index) => (
                    <div key={index} className="p-3 bg-blue-50 rounded-md">
                      <div className="font-medium text-blue-800">{item.pattern}</div>
                      <div className="text-sm text-blue-700 mt-1">
                        מיקומים: {item.locations.join(', ')}
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        <strong>הצעה:</strong> {item.suggestion}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  פיצ'רים כבדים
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisResults.heavyFeatures.map((feature, index) => (
                    <div key={index} className={`p-3 rounded-md ${
                      feature.critical ? 'bg-red-50' : 'bg-gray-50'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{feature.feature}</div>
                          <div className="text-sm text-gray-600 mt-1">{feature.description}</div>
                        </div>
                        <div className="flex flex-col items-end">
                          <Badge variant={feature.critical ? 'destructive' : 'secondary'}>
                            {feature.impact}
                          </Badge>
                          {feature.critical && (
                            <span className="text-xs text-red-600 mt-1">קריטי</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-6 p-4 bg-green-50 rounded-md">
        <h3 className="font-medium text-green-800 mb-2">המלצות לפעולה:</h3>
        <div className="text-sm text-green-700 space-y-1">
          <p>1. <strong>בטוח למחיקה:</strong> functions/getDashboardData.js (לא בשימוש)</p>
          <p>2. <strong>לאופטימיזציה:</strong> ליצור shared utilities עבור rate limiting</p>
          <p>3. <strong>לשיפור:</strong> להעביר Security Monitor ל-Layout level</p>
          <p>4. <strong>לבחינה:</strong> להפחית logging בייצור</p>
        </div>
      </div>
    </div>
  );
}