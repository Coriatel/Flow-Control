import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { toast } from 'sonner';
import {
  Save,
  RefreshCw,
  Loader2,
  Search,
  AlertCircle,
  Info,
  TrendingUp,
  Edit,
  Check,
  X,
  Calculator,
  Filter,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import BackButton from '@/components/ui/BackButton';

export default function UsageDataManagement() {
  const [reagents, setReagents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const [editedUsages, setEditedUsages] = useState({});
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Mobile filter state
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [usageStatusFilter, setUsageStatusFilter] = useState('all');

  useEffect(() => {
    fetchReagents();
  }, []);

  const fetchReagents = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Reagent.list();
      setReagents(data || []);
    } catch (error) {
      console.error('Error fetching reagents:', error);
      toast.error('שגיאה בטעינת ריאגנטים');
    } finally {
      setLoading(false);
    }
  };

  const handleUsageChange = (reagentId, value) => {
    setEditedUsages(prev => ({
      ...prev,
      [reagentId]: value
    }));
  };

  const handleToggleManualUsage = (reagentId, currentValue) => {
    setEditedUsages(prev => ({
      ...prev,
      [`${reagentId}_manual`]: !currentValue
    }));
  };

  const handleSaveAll = async () => {
    if (Object.keys(editedUsages).length === 0) {
      toast.info('אין שינויים לשמירה');
      return;
    }

    setSaving(true);
    try {
      const updates = [];
      
      for (const key in editedUsages) {
        if (key.endsWith('_manual')) {
          const reagentId = key.replace('_manual', '');
          updates.push(
            base44.entities.Reagent.update(reagentId, {
              use_manual_usage: editedUsages[key]
            })
          );
        } else {
          const reagentId = key;
          updates.push(
            base44.entities.Reagent.update(reagentId, {
              manual_monthly_usage: parseFloat(editedUsages[key]) || 0
            })
          );
        }
      }

      await Promise.all(updates);
      
      toast.success('נתוני צריכה עודכנו בהצלחה', {
        description: `${updates.length} ריאגנטים עודכנו`
      });
      
      setEditedUsages({});
      await fetchReagents();
    } catch (error) {
      console.error('Error saving usage data:', error);
      toast.error('שגיאה בשמירת נתוני צריכה');
    } finally {
      setSaving(false);
    }
  };

  const handleCalculateAllUsage = async () => {
    try {
      toast.info('מחשב צריכה לכל הריאגנטים...', {
        description: 'פעולה זו עשויה לקחת מספר דקות'
      });

      const response = await base44.functions.invoke('runSummaryUpdates', {
        operation: 'calculate_all_usage',
        data: { periodMonths: 6 }
      });

      if (response.data.success) {
        toast.success('חישוב צריכה הושלם', {
          description: `${response.data.updatedCount} ריאגנטים עודכנו`
        });
        await fetchReagents();
      } else {
        throw new Error(response.data.error || 'Failed to calculate usage');
      }
    } catch (error) {
      console.error('Error calculating usage:', error);
      toast.error('שגיאה בחישוב צריכה אוטומטית');
    }
  };

  // Filter logic
  const filteredReagents = useMemo(() => {
    return reagents.filter(reagent => {
      const matchesSearch = !searchTerm || 
        reagent.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reagent.catalog_number?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || reagent.category === categoryFilter;
      
      const matchesUsageStatus = (() => {
        if (usageStatusFilter === 'all') return true;
        if (usageStatusFilter === 'manual') return reagent.use_manual_usage === true;
        if (usageStatusFilter === 'automatic') return !reagent.use_manual_usage;
        if (usageStatusFilter === 'no_data') return !reagent.average_monthly_usage && !reagent.manual_monthly_usage;
        return true;
      })();

      const matchesTab = (() => {
        if (activeTab === 'all') return true;
        if (activeTab === 'manual') return reagent.use_manual_usage === true;
        if (activeTab === 'automatic') return !reagent.use_manual_usage;
        return true;
      })();

      return matchesSearch && matchesCategory && matchesUsageStatus && matchesTab;
    });
  }, [reagents, searchTerm, categoryFilter, usageStatusFilter, activeTab]);

  const handleApplyFilters = () => {
    setMobileFilterOpen(false);
    toast.success('פילטרים הוחלו');
  };

  const handleClearFilters = () => {
    setCategoryFilter('all');
    setUsageStatusFilter('all');
    setSearchTerm('');
    toast.info('פילטרים נוקו');
  };

  const stats = useMemo(() => {
    return {
      total: reagents.length,
      manual: reagents.filter(r => r.use_manual_usage).length,
      automatic: reagents.filter(r => !r.use_manual_usage).length,
      noData: reagents.filter(r => !r.average_monthly_usage && !r.manual_monthly_usage).length
    };
  }, [reagents]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (categoryFilter !== 'all') count++;
    if (usageStatusFilter !== 'all') count++;
    if (searchTerm) count++;
    return count;
  }, [categoryFilter, usageStatusFilter, searchTerm]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64" dir="rtl">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <p className="ml-3 text-lg text-gray-600">טוען נתוני צריכה...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6" dir="rtl">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <BackButton />
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              ניהול נתוני צריכה
            </h1>
            <p className="text-sm text-gray-600 hidden sm:block">
              עריכת צריכה חודשית ממוצעת
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowInfoDialog(true)}
            className="mr-auto sm:mr-2"
          >
            <Info className="h-5 w-5 text-blue-600" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={handleCalculateAllUsage}
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none"
          >
            <Calculator className="h-4 w-4 sm:ml-2" />
            <span className="hidden sm:inline">חישוב אוטומטי</span>
          </Button>
          <Button
            onClick={handleSaveAll}
            disabled={saving || Object.keys(editedUsages).length === 0}
            size="sm"
            className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin sm:ml-2" />
            ) : (
              <Save className="h-4 w-4 sm:ml-2" />
            )}
            <span className="hidden sm:inline">שמור הכל</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-600">סה"כ ריאגנטים</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-700">{stats.manual}</p>
              <p className="text-xs text-blue-600">צריכה ידנית</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-700">{stats.automatic}</p>
              <p className="text-xs text-green-600">צריכה אוטומטית</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-700">{stats.noData}</p>
              <p className="text-xs text-amber-600">ללא נתונים</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters - Desktop */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="חיפוש ריאגנט או מקט..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            
            {/* Mobile Filter Button */}
            <Button
              variant="outline"
              onClick={() => setMobileFilterOpen(true)}
              className="md:hidden relative"
            >
              <Filter className="h-4 w-4 ml-2" />
              סינון
              {activeFiltersCount > 0 && (
                <Badge className="absolute -top-2 -left-2 h-5 w-5 flex items-center justify-center p-0 bg-blue-600">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>

            {/* Desktop Filters */}
            <div className="hidden md:flex gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">כל הקטגוריות</option>
                <option value="reagents">ריאגנטים</option>
                <option value="cells">כדוריות</option>
                <option value="controls">בקרות</option>
                <option value="solutions">תמיסות</option>
                <option value="consumables">מתכלים</option>
              </select>

              <select
                value={usageStatusFilter}
                onChange={(e) => setUsageStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">כל הסטטוסים</option>
                <option value="manual">צריכה ידנית</option>
                <option value="automatic">צריכה אוטומטית</option>
                <option value="no_data">ללא נתונים</option>
              </select>

              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  <X className="h-4 w-4 ml-1" />
                  נקה
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="all">
            הכל ({stats.total})
          </TabsTrigger>
          <TabsTrigger value="manual">
            ידני ({stats.manual})
          </TabsTrigger>
          <TabsTrigger value="automatic">
            אוטומטי ({stats.automatic})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {filteredReagents.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">לא נמצאו ריאגנטים תואמים</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Card>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">שם ריאגנט</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">מקט</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">קטגוריה</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">צריכה אוטומטית</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">צריכה ידנית</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">פעיל</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredReagents.map(reagent => (
                          <UsageTableRow
                            key={reagent.id}
                            reagent={reagent}
                            editedUsages={editedUsages}
                            onUsageChange={handleUsageChange}
                            onToggleManual={handleToggleManualUsage}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {filteredReagents.map(reagent => (
                  <UsageCard
                    key={reagent.id}
                    reagent={reagent}
                    editedUsages={editedUsages}
                    onUsageChange={handleUsageChange}
                    onToggleManual={handleToggleManualUsage}
                  />
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Mobile Filter Sheet */}
      <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
        <SheetContent side="right" className="w-[300px] glassmorphism-dark">
          <SheetHeader>
            <SheetTitle className="text-white">סינון נתונים</SheetTitle>
            <SheetDescription className="text-gray-300">
              בחר פילטרים להצגת הנתונים
            </SheetDescription>
          </SheetHeader>
          
          <div className="space-y-4 mt-6">
            <div>
              <Label className="text-white mb-2 block">קטגוריה</Label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white"
              >
                <option value="all" className="bg-slate-800">כל הקטגוריות</option>
                <option value="reagents" className="bg-slate-800">ריאגנטים</option>
                <option value="cells" className="bg-slate-800">כדוריות</option>
                <option value="controls" className="bg-slate-800">בקרות</option>
                <option value="solutions" className="bg-slate-800">תמיסות</option>
                <option value="consumables" className="bg-slate-800">מתכלים</option>
              </select>
            </div>

            <div>
              <Label className="text-white mb-2 block">סטטוס צריכה</Label>
              <select
                value={usageStatusFilter}
                onChange={(e) => setUsageStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white"
              >
                <option value="all" className="bg-slate-800">כל הסטטוסים</option>
                <option value="manual" className="bg-slate-800">צריכה ידנית</option>
                <option value="automatic" className="bg-slate-800">צריכה אוטומטית</option>
                <option value="no_data" className="bg-slate-800">ללא נתונים</option>
              </select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1 bg-white/10 hover:bg-white/20 border-white/20 text-white"
                onClick={handleClearFilters}
              >
                <X className="h-4 w-4 ml-2" />
                נקה
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={handleApplyFilters}
              >
                <Check className="h-4 w-4 ml-2" />
                החל
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Info Dialog */}
      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              מידע על ניהול נתוני צריכה
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 text-sm">
            <Alert>
              <TrendingUp className="h-4 w-4" />
              <AlertDescription>
                <strong>מהי צריכה חודשית ממוצעת?</strong>
                <br />
                הצריכה החודשית הממוצעת היא כמות הריאגנט הנצרכת במהלך חודש ממוצע, 
                ומשמשת לחישוב תחזיות מלאי והשלמות.
              </AlertDescription>
            </Alert>

            <div>
              <h4 className="font-semibold mb-2">שני מצבי צריכה:</h4>
              <ul className="list-disc pr-5 space-y-1 text-gray-700">
                <li>
                  <strong>צריכה אוטומטית:</strong> המערכת מחשבת את הצריכה על בסיס 
                  היסטוריית משיכות ומשלוחים יוצאים (6 חודשים אחרונים).
                </li>
                <li>
                  <strong>צריכה ידנית:</strong> ניתן להזין ידנית ערך מותאם אישית, 
                  שידרוס את החישוב האוטומטי.
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">פעולות זמינות:</h4>
              <ul className="list-disc pr-5 space-y-1 text-gray-700">
                <li>
                  <strong>עריכת צריכה:</strong> הזן ערך חדש בשדה "צריכה ידנית" ולחץ "שמור הכל".
                </li>
                <li>
                  <strong>החלפה לידני/אוטומטי:</strong> השתמש במתג בעמודה "פעיל" כדי לבחור בין חישוב אוטומטי לערך ידני.
                </li>
                <li>
                  <strong>חישוב אוטומטי לכולם:</strong> לחץ על "חישוב אוטומטי" כדי לחשב מחדש 
                  את הצריכה לכל הריאגנטים על בסיס נתוני המערכת.
                </li>
              </ul>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>שימו לב:</strong> שינויים בנתוני צריכה ישפיעו על חישובי מלאי 
                והמלצות השלמה. וודאו שהערכים מדויקים ועדכניים.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowInfoDialog(false)}>
              הבנתי
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Desktop Table Row Component
function UsageTableRow({ reagent, editedUsages, onUsageChange, onToggleManual }) {
  const currentManualUsage = editedUsages[reagent.id] !== undefined 
    ? editedUsages[reagent.id] 
    : reagent.manual_monthly_usage || '';
  
  const isManualMode = editedUsages[`${reagent.id}_manual`] !== undefined
    ? editedUsages[`${reagent.id}_manual`]
    : reagent.use_manual_usage;

  const categoryLabels = {
    reagents: 'ריאגנטים',
    cells: 'כדוריות',
    controls: 'בקרות',
    solutions: 'תמיסות',
    consumables: 'מתכלים'
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 text-sm text-gray-900">{reagent.name}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{reagent.catalog_number}</td>
      <td className="px-4 py-3 text-sm">
        <Badge variant="outline">
          {categoryLabels[reagent.category] || reagent.category}
        </Badge>
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">
        {reagent.average_monthly_usage ? reagent.average_monthly_usage.toFixed(1) : '0.0'}
      </td>
      <td className="px-4 py-3">
        <Input
          type="number"
          step="0.1"
          value={currentManualUsage}
          onChange={(e) => onUsageChange(reagent.id, e.target.value)}
          disabled={!isManualMode}
          className="w-24"
        />
      </td>
      <td className="px-4 py-3 text-center">
        <button
          onClick={() => onToggleManual(reagent.id, isManualMode)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isManualMode ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isManualMode ? 'translate-x-1' : 'translate-x-6'
            }`}
          />
        </button>
      </td>
    </tr>
  );
}

// Mobile Card Component
function UsageCard({ reagent, editedUsages, onUsageChange, onToggleManual }) {
  const currentManualUsage = editedUsages[reagent.id] !== undefined 
    ? editedUsages[reagent.id] 
    : reagent.manual_monthly_usage || '';
  
  const isManualMode = editedUsages[`${reagent.id}_manual`] !== undefined
    ? editedUsages[`${reagent.id}_manual`]
    : reagent.use_manual_usage;

  const categoryLabels = {
    reagents: 'ריאגנטים',
    cells: 'כדוריות',
    controls: 'בקרות',
    solutions: 'תמיסות',
    consumables: 'מתכלים'
  };

  const categoryColors = {
    reagents: 'bg-blue-100 text-blue-800',
    cells: 'bg-purple-100 text-purple-800',
    controls: 'bg-green-100 text-green-800',
    solutions: 'bg-amber-100 text-amber-800',
    consumables: 'bg-gray-100 text-gray-800'
  };

  return (
    <Card className="bg-white shadow-sm">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm">{reagent.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{reagent.catalog_number}</p>
            </div>
            <Badge className={categoryColors[reagent.category] || 'bg-gray-100 text-gray-800'}>
              {categoryLabels[reagent.category] || reagent.category}
            </Badge>
          </div>

          {/* Usage Data */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t">
            <div>
              <Label className="text-xs text-gray-600">צריכה אוטומטית</Label>
              <p className="text-sm font-semibold text-gray-900 mt-1">
                {reagent.average_monthly_usage ? reagent.average_monthly_usage.toFixed(1) : '0.0'}
              </p>
            </div>
            <div>
              <Label className="text-xs text-gray-600">צריכה ידנית</Label>
              <Input
                type="number"
                step="0.1"
                value={currentManualUsage}
                onChange={(e) => onUsageChange(reagent.id, e.target.value)}
                disabled={!isManualMode}
                className="h-8 text-sm mt-1"
              />
            </div>
          </div>

          {/* Toggle */}
          <div className="flex items-center justify-between pt-3 border-t">
            <Label className="text-sm text-gray-700">
              {isManualMode ? 'משתמש בערך ידני' : 'משתמש בחישוב אוטומטי'}
            </Label>
            <button
              onClick={() => onToggleManual(reagent.id, isManualMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isManualMode ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isManualMode ? 'translate-x-1' : 'translate-x-6'
                }`}
              />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}