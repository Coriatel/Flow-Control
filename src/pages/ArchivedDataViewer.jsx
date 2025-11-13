import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArchivedData } from "@/api/entities";
import { User } from "@/api/entities";
import { Loader2, Archive, Search, Eye, Download, Calendar, Database, FileText, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';

export default function ArchivedDataViewer() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [archivedData, setArchivedData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterTag, setFilterTag] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkUserAndLoadData();
  }, []);

  const checkUserAndLoadData = async () => {
    try {
      const userData = await User.me();
      if (!userData || userData.role !== 'admin') {
        throw new Error('Access denied. Admin privileges required.');
      }
      setUser(userData);
      await fetchArchivedData();
    } catch (error) {
      toast({
        title: "שגיאה בגישה",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const fetchArchivedData = async () => {
    setLoading(true);
    try {
      const data = await ArchivedData.list('-archived_date', 100);
      setArchivedData(data);
      setFilteredData(data);
      toast({
        title: "נתונים נטענו",
        description: `נמצאו ${data.length} רשומות בארכיון`,
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "שגיאה בטעינת נתונים",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter data based on search and filters
  useEffect(() => {
    let filtered = [...archivedData];

    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.original_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.original_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.archive_reason.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.original_type === filterType);
    }

    if (filterTag !== 'all') {
      filtered = filtered.filter(item => 
        item.tags && item.tags.includes(filterTag)
      );
    }

    setFilteredData(filtered);
  }, [searchTerm, filterType, filterTag, archivedData]);

  const handleViewData = (item) => {
    try {
      const parsedData = JSON.parse(item.data);
      setSelectedItem({ ...item, parsedData });
    } catch (error) {
      toast({
        title: "שגיאה בפענוח נתונים",
        description: "לא ניתן לפענח את הנתונים הארכיונים",
        variant: "destructive"
      });
    }
  };

  const handleDownloadData = (item) => {
    try {
      const parsedData = JSON.parse(item.data);
      const dataStr = JSON.stringify(parsedData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `archived_${item.original_type}_${item.original_id}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "הורדה הושלמה",
        description: "קובץ הנתונים הארכיוניים הורד בהצלחה",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "שגיאה בהורדה",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getTypeBadgeColor = (type) => {
    const colors = {
      'CompletedInventoryCount': 'bg-blue-100 text-blue-800',
      'InventoryTransaction': 'bg-green-100 text-green-800',
      'ExpiredProductLog': 'bg-red-100 text-red-800',
      'Shipment': 'bg-purple-100 text-purple-800',
      'Delivery': 'bg-orange-100 text-orange-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getTypeDisplayName = (type) => {
    const names = {
      'CompletedInventoryCount': 'ספירת מלאי',
      'InventoryTransaction': 'תנועת מלאי',
      'ExpiredProductLog': 'יומן פגי תוקף',
      'Shipment': 'משלוח יוצא',
      'Delivery': 'משלוח נכנס'
    };
    return names[type] || type;
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">גישה מוגבלת</h2>
              <p className="text-gray-600">דף זה מיועד למנהלי מערכת בלבד</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">מציג הארכיון</h1>
        <p className="text-gray-600">צפייה ונהול נתונים ארכיוניים</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 ml-2" />
            חיפוש וסינון
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">חיפוש חופשי</label>
              <Input
                placeholder="חפש לפי מזהה, סוג או סיבה..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">סוג רשומה</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר סוג" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הסוגים</SelectItem>
                  <SelectItem value="CompletedInventoryCount">ספירות מלאי</SelectItem>
                  <SelectItem value="InventoryTransaction">תנועות מלאי</SelectItem>
                  <SelectItem value="ExpiredProductLog">יומני פגי תוקף</SelectItem>
                  <SelectItem value="Shipment">משלוחים יוצאים</SelectItem>
                  <SelectItem value="Delivery">משלוחים נכנסים</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">תגית</label>
              <Select value={filterTag} onValueChange={setFilterTag}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר תגית" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל התגיות</SelectItem>
                  <SelectItem value="auto_archived">ארכוב אוטומטי</SelectItem>
                  <SelectItem value="regulatory">רגולטורי</SelectItem>
                  <SelectItem value="completed">הושלם</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Archive className="h-5 w-5 ml-2" />
              רשומות ארכיוניות ({filteredData.length})
            </div>
            <Button onClick={fetchArchivedData} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'רענן'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>טוען נתונים ארכיוניים...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-8">
              <Archive className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">לא נמצאו רשומות ארכיוניות</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredData.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={getTypeBadgeColor(item.original_type)}>
                          {getTypeDisplayName(item.original_type)}
                        </Badge>
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {item.original_id}
                        </span>
                        {item.tags && item.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{item.archive_reason}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 ml-1" />
                          ארכב: {format(parseISO(item.archived_date), 'dd/MM/yyyy HH:mm', { locale: he })}
                        </span>
                        {item.retention_period && (
                          <span>תקופת שמירה: {item.retention_period}</span>
                        )}
                        {item.access_count > 0 && (
                          <span>נצפה: {item.access_count} פעמים</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewData(item)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>
                              צפייה בנתונים ארכיוניים - {getTypeDisplayName(item.original_type)}
                            </DialogTitle>
                          </DialogHeader>
                          {selectedItem && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><strong>מזהה מקורי:</strong> {selectedItem.original_id}</div>
                                <div><strong>סוג:</strong> {getTypeDisplayName(selectedItem.original_type)}</div>
                                <div><strong>תאריך ארכוב:</strong> {format(parseISO(selectedItem.archived_date), 'dd/MM/yyyy HH:mm', { locale: he })}</div>
                                <div><strong>סיבת ארכוב:</strong> {selectedItem.archive_reason}</div>
                              </div>
                              <div>
                                <strong className="block mb-2">נתונים מקוריים:</strong>
                                <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
                                  {JSON.stringify(selectedItem.parsedData, null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadData(item)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      {archivedData.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 ml-2" />
              סטטיסטיקות ארכיון
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(
                archivedData.reduce((acc, item) => {
                  acc[item.original_type] = (acc[item.original_type] || 0) + 1;
                  return acc;
                }, {})
              ).map(([type, count]) => (
                <div key={type} className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{count}</div>
                  <div className="text-sm text-gray-600">{getTypeDisplayName(type)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}