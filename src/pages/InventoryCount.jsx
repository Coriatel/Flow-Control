
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Plus,
  Save,
  FileDown,
  Trash2,
  Loader2,
  Search,
  RefreshCw,
  History,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  X,
  Printer,
  ChevronUp,
  ChevronDown,
  Sparkles,
  SlidersHorizontal // 🆕 Added SlidersHorizontal
} from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
import { // 🆕 Added Select components
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format, parseISO, isValid } from 'date-fns';
import { he } from 'date-fns/locale';
import ReagentItem from '@/components/inventory/ReagentItem';
import ExcelExport from '@/components/inventory/ExcelExport';
import BackButton from '@/components/ui/BackButton';

export default function InventoryCountPage() {
  const [reagents, setReagents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentDraft, setCurrentDraft] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [smartDataSummary, setSmartDataSummary] = useState(null);

  // 🆕 Filter states for Current Count
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentCountFilterOpen, setCurrentCountFilterOpen] = useState(false);

  const [activeTab, setActiveTab] = useState('current');
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyCounts, setHistoryCounts] = useState([]);
  const [historyPagination, setHistoryPagination] = useState({
    current_page: 1,
    page_size: 20,
    total_count: 0,
    total_pages: 0,
    has_next: false,
    has_prev: false
  });
  
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historyDateFrom, setHistoryDateFrom] = useState('');
  const [historyDateTo, setHistoryDateTo] = useState('');
  const [historyUserFilter, setHistoryUserFilter] = useState('');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [historySortField, setHistorySortField] = useState('count_date');
  const [historySortDirection, setHistorySortDirection] = useState('desc');

  const [showCountDetailsDialog, setShowCountDetailsDialog] = useState(false);
  const [selectedCountDetails, setSelectedCountDetails] = useState(null);
  const [loadingCountDetails, setLoadingCountDetails] = useState(false);

  useEffect(() => {
    fetchSmartInventoryData();
  }, []);

  const fetchSmartInventoryData = async () => {
    setLoading(true);
    try {
      console.log('[InventoryCount] Fetching smart inventory data...');
      
      const response = await base44.functions.invoke('getInventoryCountDraftData');
      
      if (response.data.success) {
        const { reagents: smartReagents, lastCompletedCount, summary } = response.data.data;
        
        console.log('[InventoryCount] ✅ Smart data loaded:', summary);
        
        setReagents(smartReagents || []);
        setSmartDataSummary(summary);
        
        if (lastCompletedCount) {
          toast.info('נתונים נטענו מספירה אחרונה', {
            description: `${lastCompletedCount.count_number} - ${format(parseISO(lastCompletedCount.count_date), 'dd/MM/yyyy', { locale: he })}`
          });
        }
        
        const draftsData = await base44.entities.InventoryCountDraft.list('-last_update', 1);
        if (draftsData && draftsData.length > 0 && !draftsData[0].completed) {
          setCurrentDraft(draftsData[0]);
          setLastUpdate(draftsData[0].last_update);
          loadDraftData(draftsData[0], smartReagents);
        }
      } else {
        throw new Error(response.data.error || 'Failed to load smart data');
      }
    } catch (error) {
      console.error('[InventoryCount] Error loading smart data:', error);
      toast.error('שגיאה בטעינת נתונים חכמים');
      await fetchReagentsAndDraftFallback();
    } finally {
      setLoading(false);
    }
  };

  const fetchReagentsAndDraftFallback = async () => {
    try {
      const [reagentsData, draftsData] = await Promise.all([
        base44.entities.Reagent.list(),
        base44.entities.InventoryCountDraft.list('-last_update', 1)
      ]);

      setReagents(reagentsData || []);

      if (draftsData && draftsData.length > 0 && !draftsData[0].completed) {
        setCurrentDraft(draftsData[0]);
        setLastUpdate(draftsData[0].last_update);
        loadDraftData(draftsData[0], reagentsData);
      }
    } catch (error) {
      console.error('Error in fallback fetch:', error);
      toast.error('שגיאה בטעינת נתונים');
    }
  };

  const loadDraftData = (draft, reagentsData) => {
    const updatedReagents = reagentsData.map(reagent => {
      const savedData = draft.batch_entries?.[reagent.id];
      if (savedData && Array.isArray(savedData)) {
        return {
          ...reagent,
          batches: savedData.map(batch => ({
            ...batch,
            isExistingBatch: batch.id !== null
          }))
        };
      }
      return reagent;
    });
    setReagents(updatedReagents);
  };

  const handleBatchesChange = (reagentId, updatedBatches) => {
    setReagents(prevReagents =>
      prevReagents.map(reagent =>
        reagent.id === reagentId ? { ...reagent, batches: updatedBatches } : reagent
      )
    );
  };

  const saveDraft = async () => {
    setSavingDraft(true);
    try {
      const batchEntries = {};
      reagents.forEach(reagent => {
        if (reagent.batches && reagent.batches.length > 0) {
          batchEntries[reagent.id] = reagent.batches;
        }
      });

      const now = new Date().toISOString();
      const draftData = {
        batch_entries: batchEntries,
        last_update: now,
        update_dates: currentDraft?.update_dates
          ? [...currentDraft.update_dates, now]
          : [now]
      };

      if (currentDraft) {
        await base44.entities.InventoryCountDraft.update(currentDraft.id, draftData);
      } else {
        draftData.start_date = now;
        draftData.completed = false;
        const newDraft = await base44.entities.InventoryCountDraft.create(draftData);
        setCurrentDraft(newDraft);
      }

      setLastUpdate(now);
      toast.success('הטיוטה נשמרה בהצלחה');
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('שגיאה בשמירת הטיוטה');
    } finally {
      setSavingDraft(false);
    }
  };

  const clearDraft = async () => {
    if (!confirm('האם אתה בטוח שברצונך לנקות את הטיוטה?')) {
      return;
    }

    try {
      if (currentDraft) {
        await base44.entities.InventoryCountDraft.delete(currentDraft.id);
      }
      setCurrentDraft(null);
      setLastUpdate(null);
      await fetchSmartInventoryData();
      toast.success('הטיוטה נוקתה');
    } catch (error) {
      console.error('Error clearing draft:', error);
      toast.error('שגיאה בניקוי הטיוטה');
    }
  };

  const handleSubmit = async () => {
    setShowSubmitDialog(false);
    setSubmitting(true);

    try {
      let draftToProcess = currentDraft;
      
      if (!draftToProcess) {
        await saveDraft();
        const drafts = await base44.entities.InventoryCountDraft.list('-last_update', 1);
        if (!drafts || drafts.length === 0) {
          throw new Error('Failed to create draft');
        }
        draftToProcess = drafts[0];
        setCurrentDraft(draftToProcess);
      }

      const response = await base44.functions.invoke('processCompletedCount', {
        draftId: draftToProcess.id
      });

      if (response.data.success) {
        toast.success('ספירת המלאי נשלחה לעיבוד!', {
          description: `מספר ספירה: ${response.data.data.count_number}`
        });
        
        setCurrentDraft(null);
        setLastUpdate(null);
        await fetchSmartInventoryData();
        setActiveTab('history');
      } else {
        throw new Error(response.data.error || 'Processing failed');
      }
    } catch (error) {
      console.error('Error submitting count:', error);
      toast.error('שגיאה בשליחת הספירה', {
        description: error.message
      });
    } finally {
      setSubmitting(false);
    }
  };

  const fetchHistory = useCallback(async (page = 1) => {
    setHistoryLoading(true);
    try {
      const response = await base44.functions.invoke('getInventoryCountsHistoryData', {
        page,
        page_size: historyPagination.page_size,
        search_term: historySearchTerm, // Corrected parameter name
        date_from: historyDateFrom || null,
        date_to: historyDateTo || null,
        user_email: historyUserFilter || null, // Corrected parameter name
        sort_field: historySortField,
        sort_direction: historySortDirection
      });

      if (response.data.success) {
        setHistoryCounts(response.data.data.counts || []);
        setHistoryPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('שגיאה בטעינת היסטוריה');
    } finally {
      setHistoryLoading(false);
    }
  }, [historyPagination.page_size, historySearchTerm, historyDateFrom, historyDateTo, historyUserFilter, historySortField, historySortDirection]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory(1);
    }
  }, [activeTab, fetchHistory]); // Simplified dependencies for useEffect, relies on useCallback

  const handleViewCountDetails = async (countId) => {
    setLoadingCountDetails(true);
    setShowCountDetailsDialog(true);
    try {
      const response = await base44.functions.invoke('getSingleInventoryCountDetails', { 
        count_id: countId 
      });
      if (response.data.success) {
        setSelectedCountDetails(response.data.data);
      }
    } catch (error) {
      console.error('Error loading count details:', error);
      toast.error('שגיאה בטעינת פרטי ספירה');
    } finally {
      setLoadingCountDetails(false);
    }
  };

  const handlePrintCount = (count) => {
    window.print();
  };

  const handleSort = (field) => {
    if (historySortField === field) {
      setHistorySortDirection(historySortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setHistorySortField(field);
      setHistorySortDirection('desc');
    }
  };

  const applyHistoryFilters = () => { // Renamed from applyFilters for clarity
    setMobileFilterOpen(false);
    fetchHistory(1);
  };

  const clearHistoryFilters = () => { // Renamed from clearFilters for clarity
    setHistorySearchTerm('');
    setHistoryDateFrom('');
    setHistoryDateTo('');
    setHistoryUserFilter('');
    setMobileFilterOpen(false);
  };

  // 🆕 Clear current count filters
  const clearCurrentCountFilters = () => {
    setSupplierFilter('all');
    setCategoryFilter('all');
    setSearchTerm(''); // Also clear search term when clearing filters
    setCurrentCountFilterOpen(false); // Close the sheet if open
  };

  // 🆕 Apply current count filters (close sheet)
  const applyCurrentCountFilters = () => {
    setCurrentCountFilterOpen(false);
    toast.success('הפילטרים הוחלו');
  };

  // 🆕 Get unique suppliers and categories
  const uniqueSuppliers = useMemo(() => {
    const suppliers = [...new Set(reagents.map(r => r.supplier).filter(Boolean))];
    return suppliers.sort();
  }, [reagents]);

  const uniqueCategories = useMemo(() => {
    const categories = [...new Set(reagents.map(r => r.category).filter(Boolean))];
    return categories.sort();
  }, [reagents]);

  // 🆕 Category names mapping
  const categoryNames = {
    'reagents': 'ריאגנטים',
    'cells': 'תאים',
    'controls': 'בקרות',
    'solutions': 'תמיסות',
    'consumables': 'מתכלים'
  };

  // 🆕 Enhanced filtering logic
  const filteredReagents = useMemo(() => {
    let filtered = reagents;

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(r =>
        r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.catalog_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Supplier filter
    if (supplierFilter !== 'all') {
      filtered = filtered.filter(r => r.supplier === supplierFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(r => r.category === categoryFilter);
    }

    return filtered;
  }, [reagents, searchTerm, supplierFilter, categoryFilter]);

  const totalBatchesEntered = useMemo(() => {
    return reagents.reduce((sum, r) => sum + (r.batches?.length || 0), 0);
  }, [reagents]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (supplierFilter !== 'all') count++;
    if (categoryFilter !== 'all') count++;
    if (searchTerm.trim()) count++; // Consider search term as an active filter
    return count;
  }, [supplierFilter, categoryFilter, searchTerm]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50" dir="rtl">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-lg font-medium text-gray-700">טוען נתוני ספירה...</p>
          <p className="text-sm text-gray-500 mt-1">אנא המתן</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6" dir="rtl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BackButton />
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900">
              <span className="sm:hidden">ספירה</span>
              <span className="hidden sm:inline">ספירת מלאי</span>
            </h1>
            
            {smartDataSummary && smartDataSummary.totalReagents > 0 && (
              <div className="flex items-center gap-1 mt-0.5">
                <Sparkles className="h-3 w-3 text-amber-500 flex-shrink-0" />
                <p className="text-xs text-gray-600">
                  {smartDataSummary.reagentsWithNewBatches > 0 ? (
                    <span className="text-amber-600 font-medium">
                      {smartDataSummary.reagentsWithNewBatches} אצוות חדשות
                    </span>
                  ) : (
                    <span className="text-blue-600 font-medium">
                      מבוסס על ספירה אחרונה
                    </span>
                  )}
                </p>
              </div>
            )}
            
            {lastUpdate && (
              <p className="text-xs text-gray-500 mt-0.5">
                עדכון: {format(parseISO(lastUpdate), 'HH:mm dd/MM', { locale: he })}
              </p>
            )}
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchSmartInventoryData}
          disabled={loading}
          className="text-gray-600 hover:text-gray-900"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4 h-9">
          <TabsTrigger value="current" className="text-xs sm:text-sm">
            ספירה נוכחית
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs sm:text-sm">
            <History className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
            היסטוריה
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-3 sm:space-y-4">
          {/* 🆕 Mobile Filter Sheet for Current Count */}
          <Sheet open={currentCountFilterOpen} onOpenChange={setCurrentCountFilterOpen}>
            <SheetContent
              side="right"
              className="w-full sm:max-w-md"
              style={{
                background: 'rgba(30, 41, 59, 0.95)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <SheetHeader>
                <SheetTitle className="text-white text-right">סינון ריאגנטים</SheetTitle>
                <SheetDescription className="text-gray-300 text-right">
                  סנן לפי ספק או קטגוריה
                </SheetDescription>
              </SheetHeader>
              
              <div className="space-y-4 mt-6">
                <div>
                  <Label className="text-white text-sm mb-2 block">ספק</Label>
                  <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="כל הספקים" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">כל הספקים</SelectItem>
                      {uniqueSuppliers.map(supplier => (
                        <SelectItem key={supplier} value={supplier}>
                          {supplier}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-white text-sm mb-2 block">קטגוריה</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="כל הקטגוריות" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">כל הקטגוריות</SelectItem>
                      {uniqueCategories.map(category => (
                        <SelectItem key={category} value={category}>
                          {categoryNames[category] || category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={clearCurrentCountFilters} 
                    variant="outline" 
                    className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <X className="h-4 w-4 ml-1" />
                    נקה
                  </Button>
                  <Button 
                    onClick={applyCurrentCountFilters} 
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    <SlidersHorizontal className="h-4 w-4 ml-1" />
                    החל
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {smartDataSummary && smartDataSummary.totalReagents > 0 && (
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-blue-900 mb-1">
                      נתונים חכמים נטענו ✨
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-blue-700">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>{smartDataSummary.totalReagents} ריאגנטים</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>{smartDataSummary.totalActiveBatches} אצוות פעילות</span>
                      </div>
                      <div className="flex items-center gap-1 col-span-2 sm:col-span-1">
                        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                        <span>{smartDataSummary.reagentsWithNewBatches} אצוות חדשות</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 🆕 Search + Filter Button (Mobile) */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="חיפוש ריאגנט..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 h-10"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentCountFilterOpen(true)}
              className="sm:hidden relative h-10"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </div>

          {/* 🆕 Desktop Filters */}
          <Card className="hidden sm:block">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs mb-2 block">ספק</Label>
                  <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="כל הספקים" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">כל הספקים</SelectItem>
                      {uniqueSuppliers.map(supplier => (
                        <SelectItem key={supplier} value={supplier}>
                          {supplier}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs mb-2 block">קטגוריה</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="כל הקטגוריות" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">כל הקטגוריות</SelectItem>
                      {uniqueCategories.map(category => (
                        <SelectItem key={category} value={category}>
                          {categoryNames[category] || category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button 
                    onClick={clearCurrentCountFilters} 
                    variant="outline" 
                    size="sm" 
                    className="w-full h-9"
                    disabled={activeFiltersCount === 0}
                  >
                    <X className="h-4 w-4 ml-2" />
                    נקה פילטרים ({activeFiltersCount})
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-2 sm:p-3 text-center">
                <p className="text-xl sm:text-2xl font-bold text-blue-700">{filteredReagents.length}</p>
                <p className="text-[10px] sm:text-xs text-blue-600 font-medium">ריאגנטים</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-2 sm:p-3 text-center">
                <p className="text-xl sm:text-2xl font-bold text-green-700">{totalBatchesEntered}</p>
                <p className="text-[10px] sm:text-xs text-green-600 font-medium">אצוות</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-2 sm:p-3 text-center">
                <p className="text-xl sm:text-2xl font-bold text-purple-700">
                  {smartDataSummary?.reagentsWithNewBatches || 0}
                </p>
                <p className="text-[10px] sm:text-xs text-purple-600 font-medium">חדשות</p>
              </CardContent>
            </Card>
          </div>

          {/* 🆕 Active Filters Display (Mobile) */}
          {activeFiltersCount > 0 && (
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <SlidersHorizontal className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-900">
                      {activeFiltersCount} פילטרים פעילים:
                    </span>
                    {supplierFilter !== 'all' && (
                      <Badge variant="outline" className="bg-white text-amber-700 border-amber-300">
                        {supplierFilter}
                      </Badge>
                    )}
                    {categoryFilter !== 'all' && (
                      <Badge variant="outline" className="bg-white text-amber-700 border-amber-300">
                        {categoryNames[categoryFilter] || categoryFilter}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearCurrentCountFilters}
                    className="text-amber-700 hover:text-amber-900 h-7"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            {filteredReagents.length === 0 ? (
              <Card className="p-8 text-center">
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">לא נמצאו ריאגנטים</p>
                <p className="text-sm text-gray-400 mt-1">נסה לשנות את הפילטרים</p>
                {activeFiltersCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearCurrentCountFilters}
                    className="mt-4"
                  >
                    <X className="h-4 w-4 ml-2" />
                    נקה פילטרים
                  </Button>
                )}
              </Card>
            ) : (
              filteredReagents.map(reagent => (
                <ReagentItem
                  key={reagent.id}
                  reagent={reagent}
                  batches={reagent.batches || []}
                  onBatchesChange={(batches) => handleBatchesChange(reagent.id, batches)}
                  showNewBadge={reagent.hasNewBatches}
                />
              ))
            )}
          </div>

          <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 sm:p-4 shadow-lg rounded-t-xl">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="grid grid-cols-2 gap-2 sm:hidden">
                <Button
                  onClick={saveDraft}
                  disabled={savingDraft}
                  variant="outline"
                  size="sm"
                  className="h-10"
                >
                  {savingDraft ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="h-4 w-4 ml-1" />
                      <span className="text-xs">שמור</span>
                    </>
                  )}
                </Button>
                
                <ExcelExport reagents={reagents} size="sm" className="h-10">
                  <FileDown className="h-4 w-4 ml-1" />
                  <span className="text-xs">ייצא</span>
                </ExcelExport>
                
                <Button
                  onClick={clearDraft}
                  variant="outline"
                  size="sm"
                  className="h-10"
                >
                  <Trash2 className="h-4 w-4 ml-1" />
                  <span className="text-xs">נקה</span>
                </Button>
                
                <Button
                  onClick={() => setShowSubmitDialog(true)}
                  disabled={submitting || totalBatchesEntered === 0}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 h-10"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <FileDown className="h-4 w-4 ml-1" />
                      <span className="text-xs font-semibold">שלח</span>
                    </>
                  )}
                </Button>
              </div>

              <div className="hidden sm:flex gap-3 w-full">
                <Button
                  onClick={saveDraft}
                  disabled={savingDraft}
                  variant="outline"
                  className="flex-1"
                >
                  {savingDraft ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Save className="h-4 w-4 ml-2" />}
                  שמור טיוטה
                </Button>
                
                <ExcelExport reagents={reagents} className="flex-1">
                  <FileDown className="h-4 w-4 ml-2" />
                  ייצא ל-Excel
                </ExcelExport>
                
                <Button
                  onClick={clearDraft}
                  variant="outline"
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 ml-2" />
                  נקה טיוטה
                </Button>
                
                <Button
                  onClick={() => setShowSubmitDialog(true)}
                  disabled={submitting || totalBatchesEntered === 0}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <FileDown className="h-4 w-4 ml-2" />}
                  שלח ספירה
                </Button>
              </div>
            </div>
            
            {totalBatchesEntered === 0 && (
              <p className="text-xs text-center text-gray-500 mt-2">
                הוסף לפחות אצווה אחת כדי לשלוח את הספירה
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
            <SheetContent
              side="right"
              className="w-full sm:max-w-md"
              style={{
                background: 'rgba(30, 41, 59, 0.95)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <SheetHeader>
                <SheetTitle className="text-white text-right">סינון ספירות</SheetTitle>
                <SheetDescription className="text-gray-300 text-right">
                  סנן את היסטוריית הספירות
                </SheetDescription>
              </SheetHeader>
              
              <div className="space-y-4 mt-6">
                <div>
                  <Label className="text-white">חיפוש</Label>
                  <Input
                    placeholder="מספר ספירה"
                    value={historySearchTerm}
                    onChange={(e) => setHistorySearchTerm(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <Label className="text-white">מתאריך</Label>
                  <Input
                    type="date"
                    value={historyDateFrom}
                    onChange={(e) => setHistoryDateFrom(e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                <div>
                  <Label className="text-white">עד תאריך</Label>
                  <Input
                    type="date"
                    value={historyDateTo}
                    onChange={(e) => setHistoryDateTo(e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                <div>
                  <Label className="text-white">משתמש</Label>
                  <Input
                    placeholder="שם משתמש"
                    value={historyUserFilter}
                    onChange={(e) => setHistoryUserFilter(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={clearHistoryFilters} 
                    variant="outline" 
                    className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <X className="h-4 w-4 ml-1" />
                    נקה
                  </Button>
                  <Button 
                    onClick={applyHistoryFilters} 
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    <Filter className="h-4 w-4 ml-1" />
                    החל
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Card className="hidden sm:block">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs">חיפוש</Label>
                  <Input
                    placeholder="מספר ספירה"
                    value={historySearchTerm}
                    onChange={(e) => setHistorySearchTerm(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">מתאריך</Label>
                  <Input
                    type="date"
                    value={historyDateFrom}
                    onChange={(e) => setHistoryDateFrom(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">עד תאריך</Label>
                  <Input
                    type="date"
                    value={historyDateTo}
                    onChange={(e) => setHistoryDateTo(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">משתמש</Label>
                  <Input
                    placeholder="שם משתמש"
                    value={historyUserFilter}
                    onChange={(e) => setHistoryUserFilter(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button onClick={clearHistoryFilters} variant="outline" size="sm" className="h-9">
                  <X className="h-4 w-4 ml-2" />
                  נקה
                </Button>
                <Button onClick={applyHistoryFilters} size="sm" className="h-9">
                  <Filter className="h-4 w-4 ml-2" />
                  סנן
                </Button>
                <Button onClick={() => fetchHistory(1)} variant="outline" size="sm" className="h-9">
                  <RefreshCw className="h-4 w-4 ml-2" />
                  רענן
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex sm:hidden gap-2">
            <Button
              onClick={() => setMobileFilterOpen(true)}
              className="flex-1"
              variant="outline"
              size="sm"
            >
              <Filter className="h-4 w-4 ml-2" />
              סינון
            </Button>
            <Button
              onClick={() => fetchHistory(1)}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {historyLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <>
              <div className="sm:hidden space-y-3">
                {historyCounts.map(count => (
                  <Card key={count.id} className="overflow-hidden border-r-4 border-purple-400">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-purple-600 mb-1">
                            <button
                              onClick={() => handleViewCountDetails(count.id)}
                              className="hover:underline"
                            >
                              {count.count_number}
                            </button>
                          </h3>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center text-gray-600">
                              <Calendar className="h-3 w-3 ml-1 flex-shrink-0" />
                              {isValid(parseISO(count.count_date)) 
                                ? format(parseISO(count.count_date), 'dd/MM/yyyy', { locale: he })
                                : 'תאריך לא זמין'}
                            </div>
                            <div className="flex items-center text-gray-600">
                              <User className="h-3 w-3 ml-1 flex-shrink-0" />
                              {count.created_by_name || count.created_by || 'לא ידוע'}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {count.reagents_updated_count || 0} / {count.reagents_total_count || 0} ריאגנטים
                            </div>
                          </div>
                        </div>
                        <Badge className={count.reagent_updates_completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {count.reagent_updates_completed ? 'הושלם' : 'בעיבוד'}
                        </Badge>
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewCountDetails(count.id)}
                          className="flex-1"
                        >
                          <Eye className="h-4 w-4 ml-1" />
                          צפה
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handlePrintCount(count)}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {historyCounts.length === 0 && (
                  <Card className="p-8 text-center">
                    <History className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">אין ספירות להצגה</p>
                    <p className="text-sm text-gray-400 mt-1">שנה את הפילטרים או בצע ספירה חדשה</p>
                  </Card>
                )}
              </div>

              <div className="hidden sm:block">
                {historyCounts.length === 0 ? (
                  <Card className="p-8 text-center">
                    <History className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">אין ספירות להצגה</p>
                    <p className="text-sm text-gray-400 mt-1">שנה את הפילטרים או בצע ספירה חדשה</p>
                  </Card>
                ) : (
                  <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100 sticky top-0 z-10">
                          <tr>
                            <th 
                              className="px-4 py-3 text-right cursor-pointer hover:bg-gray-200"
                              onClick={() => handleSort('count_number')}
                            >
                              <div className="flex items-center justify-end">
                                מספר ספירה
                                {historySortField === 'count_number' && (
                                  historySortDirection === 'asc' ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />
                                )}
                              </div>
                            </th>
                            <th 
                              className="px-4 py-3 text-right cursor-pointer hover:bg-gray-200"
                              onClick={() => handleSort('count_date')}
                            >
                              <div className="flex items-center justify-end">
                                תאריך
                                {historySortField === 'count_date' && (
                                  historySortDirection === 'asc' ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />
                                )}
                              </div>
                            </th>
                            <th className="px-4 py-3 text-right">מבצע</th>
                            <th className="px-4 py-3 text-center">ריאגנטים</th>
                            <th className="px-4 py-3 text-center">סטטוס</th>
                            <th className="px-4 py-3 text-center">פעולות</th>
                          </tr>
                        </thead>
                        <tbody>
                          {historyCounts.map(count => (
                            <tr key={count.id} className="border-b hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium text-purple-600">
                                <button
                                  onClick={() => handleViewCountDetails(count.id)}
                                  className="hover:underline"
                                >
                                  {count.count_number}
                                </button>
                              </td>
                              <td className="px-4 py-3">
                                {isValid(parseISO(count.count_date)) 
                                  ? format(parseISO(count.count_date), 'dd/MM/yyyy', { locale: he })
                                  : '-'}
                              </td>
                              <td className="px-4 py-3">
                                {count.created_by_name || count.created_by || '-'}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {count.reagents_updated_count || 0} / {count.reagents_total_count || 0}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <Badge className={count.reagent_updates_completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                  {count.reagent_updates_completed ? 'הושלם' : 'בעיבוד'}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-2 justify-center">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleViewCountDetails(count.id)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handlePrintCount(count)}
                                  >
                                    <Printer className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}
              </div>

              {historyPagination.total_pages > 1 && (
                <div className="flex items-center justify-between p-3 sm:p-4 border-t">
                  <div className="text-xs sm:text-sm text-gray-600">
                    עמוד {historyPagination.current_page} מתוך {historyPagination.total_pages}
                    <span className="hidden sm:inline"> ({historyPagination.total_count} ספירות)</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fetchHistory(historyPagination.current_page - 1)}
                      disabled={!historyPagination.has_prev}
                      className="h-8"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fetchHistory(historyPagination.current_page + 1)}
                      disabled={!historyPagination.has_next}
                      className="h-8"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>אישור שליחת ספירת מלאי</DialogTitle>
            <DialogDescription>
              האם אתה בטוח שברצונך לשלוח את ספירת המלאי לעיבוד?
              פעולה זו תעדכן את כל כמויות האצוות במערכת.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              ביטול
            </Button>
            <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
              <FileDown className="h-4 w-4 ml-2" />
              אישור ושליחה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCountDetailsDialog} onOpenChange={setShowCountDetailsDialog}>
        <DialogContent dir="rtl" className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>פרטי ספירת מלאי: {selectedCountDetails?.count?.count_number || 'טוען...'}</DialogTitle>
          </DialogHeader>

          {loadingCountDetails ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : selectedCountDetails ? (
            <div className="space-y-4">
              <Card>
                <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>מידע כללי</span>
                    <Button
                      onClick={() => handlePrintCount(selectedCountDetails.count)}
                      variant="outline"
                      size="sm"
                    >
                      <Printer className="h-4 w-4 ml-2" />
                      הדפס
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-600">מספר ספירה</Label>
                    <p className="font-bold text-lg text-purple-600">
                      {selectedCountDetails.count.count_number || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">תאריך ספירה</Label>
                    <p className="font-medium">
                      {(() => {
                        try {
                          if (!selectedCountDetails.count.count_date) return 'לא זמין';
                          const date = parseISO(selectedCountDetails.count.count_date);
                          return isValid(date) ? format(date, 'dd/MM/yyyy HH:mm', { locale: he }) : 'לא זמין';
                        } catch {
                          return 'לא זמין';
                        }
                      })()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">בוצע על ידי</Label>
                    <p className="font-medium">
                      {selectedCountDetails.count.created_by_name || selectedCountDetails.count.created_by || 'לא ידוע'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">סטטוס עיבוד</Label>
                    <Badge className={selectedCountDetails.count.reagent_updates_completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {selectedCountDetails.count.reagent_updates_completed ? 'הושלם' : 'בעיבוד'}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">ריאגנטים שעודכנו</Label>
                    <p className="font-medium">
                      {selectedCountDetails.count.reagents_updated_count || 0} מתוך {selectedCountDetails.count.reagents_total_count || 0}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">פרטי ספירה</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {selectedCountDetails.details && selectedCountDetails.details.map((detail, idx) => (
                      <div key={idx} className="border rounded-lg p-4 bg-purple-50">
                        <h4 className="font-bold text-purple-900 mb-3">{detail.reagent_name}</h4>
                        <div className="space-y-2">
                          {detail.batches && detail.batches.map((batch, bIdx) => (
                            <div key={bIdx} className="flex justify-between items-center bg-white p-2 rounded text-sm">
                              <div className="flex-1">
                                <span className="font-medium">אצווה: {batch.batch_number}</span>
                              </div>
                              <div className="flex-1 text-center">
                                <span className="text-gray-600">
                                  תפוגה: {(() => {
                                    try {
                                      if (!batch.expiry_date) return 'לא זמין';
                                      const date = parseISO(batch.expiry_date);
                                      return isValid(date) ? format(date, 'dd/MM/yyyy', { locale: he }) : 'לא זמין';
                                    } catch {
                                      return 'לא זמין';
                                    }
                                  })()}
                                </span>
                              </div>
                              <div className="flex-1 text-left">
                                <span className="font-bold text-purple-600">כמות: {batch.quantity}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              לא נמצאו פרטים לספירה זו
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCountDetailsDialog(false)}>
              סגור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
