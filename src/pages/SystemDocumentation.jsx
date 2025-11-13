
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Folder, File, FileText, Code, Database, 
  Edit, Loader2, Search, 
  BookOpen, Server, Component, Eye, FileCode,
  Check, Clock, Save, X, Download, FileArchive, Lightbulb
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import BackButton from '@/components/ui/BackButton';

// Feature structure - organized like file system
const featureStructure = {
  pages: {
    name: 'דפים',
    shortName: 'Pages',
    icon: FileText,
    color: 'text-blue-600',
    items: [
      { name: 'Dashboard', displayName: 'מרכז הבקרה', path: 'pages/Dashboard.js' },
      { name: 'InventoryCount', displayName: 'ספירת מלאי', path: 'pages/InventoryCount.js' },
      { name: 'Deliveries', displayName: 'משלוחים שהתקבלו', path: 'pages/Deliveries.js' },
      { name: 'NewDelivery', displayName: 'קליטת משלוח חדש', path: 'pages/NewDelivery.js' },
      { name: 'EditDelivery', displayName: 'עריכת משלוח', path: 'pages/EditDelivery.js' },
      { name: 'Orders', displayName: 'ניהול דרישות רכש', path: 'pages/Orders.js' },
      { name: 'NewOrder', displayName: 'הקמת מסמך רכש חדש', path: 'pages/NewOrder.js' },
      { name: 'EditOrder', displayName: 'עריכת הזמנה', path: 'pages/EditOrder.js' },
      { name: 'WithdrawalRequests', displayName: 'ניהול בקשות משיכה', path: 'pages/WithdrawalRequests.js' },
      { name: 'NewWithdrawalRequest', displayName: 'בקשת משיכה חדשה', path: 'pages/NewWithdrawalRequest.js' },
      { name: 'EditWithdrawalRequest', displayName: 'עריכת בקשת משיכה', path: 'pages/EditWithdrawalRequest.js' },
      { name: 'OutgoingShipments', displayName: 'משלוחים יוצאים', path: 'pages/OutgoingShipments.js' },
      { name: 'NewShipment', displayName: 'שליחת ריאגנטים', path: 'pages/NewShipment.js' },
      { name: 'EditShipment', displayName: 'עריכת משלוח יוצא', path: 'pages/EditShipment.js' },
      { name: 'SupplyTracking', displayName: 'מעקב אספקות', path: 'pages/SupplyTracking.js' },
      { name: 'InventoryReplenishment', displayName: 'חישוב השלמות מלאי', path: 'pages/InventoryReplenishment.js' },
      { name: 'BatchAndExpiryManagement', displayName: 'ניהול אצוות ופגי תוקף', path: 'pages/BatchAndExpiryManagement.js' },
      { name: 'UsageDataManagement', displayName: 'ניהול נתוני צריכה', path: 'pages/UsageDataManagement.js' },
      { name: 'ManageReagents', displayName: 'ניהול ריאגנטים', path: 'pages/ManageReagents.js' },
      { name: 'ManageSuppliers', displayName: 'ניהול ספקים', path: 'pages/ManageSuppliers.js' },
      { name: 'QualityAssurance', displayName: 'בקרת איכות', path: 'pages/QualityAssurance.js' },
      { name: 'UploadCOA', displayName: 'העלאת תעודות אנליזה', path: 'pages/UploadCOA.js' },
      { name: 'Reports', displayName: 'דוחות ומעקב', path: 'pages/Reports.js' },
      { name: 'AlertsManagement', displayName: 'התראות ותזכורות', path: 'pages/AlertsManagement.js' },
      { name: 'DashboardNotes', displayName: 'הערות ומשימות', path: 'pages/DashboardNotes.js' },
      { name: 'ActivityLog', displayName: 'יומן פעילות', path: 'pages/ActivityLog.js' },
      { name: 'Contacts', displayName: 'ניהול אנשי קשר', path: 'pages/Contacts.js' }
    ]
  },
  functions: {
    name: 'פונקציות',
    shortName: 'Functions',
    icon: Server,
    color: 'text-green-600',
    items: [
      { name: 'getDashboardData', displayName: 'טעינת נתוני דשבורד', path: 'functions/getDashboardData.js' },
      { name: 'getInventoryCountDraftData', displayName: 'טעינת נתוני ספירה', path: 'functions/getInventoryCountDraftData.js' },
      { name: 'processCompletedCount', displayName: 'עיבוד ספירה מושלמת', path: 'functions/processCompletedCount.js' },
      { name: 'getInventoryCountsHistoryData', displayName: 'היסטוריית ספירות', path: 'functions/getInventoryCountsHistoryData.js' },
      { name: 'getDeliveriesData', displayName: 'טעינת נתוני משלוחים', path: 'functions/getDeliveriesData.js' },
      { name: 'getOrdersData', displayName: 'טעינת נתוני הזמנות', path: 'functions/getOrdersData.js' },
      { name: 'getWithdrawalRequestsData', displayName: 'טעינת בקשות משיכה', path: 'functions/getWithdrawalRequestsData.js' },
      { name: 'getOutgoingShipmentsData', displayName: 'טעינת משלוחים יוצאים', path: 'functions/getOutgoingShipmentsData.js' },
      { name: 'deleteWithdrawal', displayName: 'מחיקת בקשת משיכה', path: 'functions/deleteWithdrawal.js' },
      { name: 'runSummaryUpdates', displayName: 'עדכון נתונים מסכמים', path: 'functions/runSummaryUpdates.js' }
    ]
  },
  components: {
    name: 'קומפוננטות',
    shortName: 'Components',
    icon: Component,
    color: 'text-purple-600',
    items: [
      { name: 'ReagentItem', displayName: 'פריט ריאגנט', path: 'components/inventory/ReagentItem.jsx' },
      { name: 'BatchEntry', displayName: 'הזנת אצווה', path: 'components/inventory/BatchEntry.jsx' },
      { name: 'BackButton', displayName: 'כפתור חזרה', path: 'components/ui/BackButton.jsx' },
      { name: 'ResizableTable', displayName: 'טבלה מתכווננת', path: 'components/ui/ResizableTable.jsx' },
      { name: 'SummaryCard', displayName: 'כרטיס סיכום', path: 'components/dashboard/SummaryCard.jsx' },
      { name: 'CriticalActions', displayName: 'פעולות קריטיות', path: 'components/dashboard/CriticalActions.jsx' }
    ]
  },
  entities: {
    name: 'ישויות',
    shortName: 'Entities',
    icon: Database,
    color: 'text-amber-600',
    items: [
      { name: 'Reagent', displayName: 'ריאגנט', path: 'entities/Reagent.json' },
      { name: 'ReagentBatch', displayName: 'אצוות ריאגנטים', path: 'entities/ReagentBatch.json' },
      { name: 'Order', displayName: 'הזמנות', path: 'entities/Order.json' },
      { name: 'OrderItem', displayName: 'פריטי הזמנה', path: 'entities/OrderItem.json' },
      { name: 'Delivery', displayName: 'משלוחים', path: 'entities/Delivery.json' },
      { name: 'DeliveryItem', displayName: 'פריטי משלוח', path: 'entities/DeliveryItem.json' },
      { name: 'WithdrawalRequest', displayName: 'בקשות משיכה', path: 'entities/WithdrawalRequest.json' },
      { name: 'Shipment', displayName: 'משלוחים יוצאים', path: 'entities/Shipment.json' },
      { name: 'InventoryCountDraft', displayName: 'טיוטות ספירה', path: 'entities/InventoryCountDraft.json' },
      { name: 'CompletedInventoryCount', displayName: 'ספירות מושלמות', path: 'entities/CompletedInventoryCount.json' }
    ]
  }
};

export default function SystemDocumentation() {
  const navigate = useNavigate();

  const [selectedFolder, setSelectedFolder] = useState('pages');
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('explorer');

  const [docs, setDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [editingDocType, setEditingDocType] = useState(null);
  const [docContent, setDocContent] = useState('');
  const [showDocDialog, setShowDocDialog] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);

  const loadDocs = useCallback(async () => {
    console.log("[SystemDoc] Loading documentation...");
    setLoadingDocs(true);
    try {
      const docsData = await base44.entities.FeatureDocumentation.list();
      console.log("[SystemDoc] ✅ Loaded docs:", docsData.length, "documents");
      console.log("[SystemDoc] First doc sample:", docsData[0]?.feature_name, {
        hasFunctional: !!docsData[0]?.functional_spec,
        hasTechnical: !!docsData[0]?.technical_spec,
        hasTest: !!docsData[0]?.test_plan,
        hasDeveloper: !!docsData[0]?.developer_request
      });
      setDocs(Array.isArray(docsData) ? docsData : []);
    } catch (error) {
      console.error('[SystemDoc] ❌ Error loading docs:', error);
      toast.error('שגיאה בטעינת מסמכים');
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  const getCurrentDoc = useCallback(() => {
    if (!selectedFile) {
      console.log("[SystemDoc] No file selected");
      return null;
    }
    console.log("[SystemDoc] Looking for doc:", {
      feature_type: selectedFolder,
      feature_name: selectedFile.name,
      available: docs.map(d => `${d.feature_type}/${d.feature_name}`)
    });
    
    const found = docs.find(doc => 
      doc.feature_type === selectedFolder && 
      doc.feature_name === selectedFile.name
    );
    
    if (found) {
      console.log("[SystemDoc] ✅ Found doc:", found.feature_name, {
        hasFunctional: !!found.functional_spec,
        hasTechnical: !!found.technical_spec,
        hasTest: !!found.test_plan,
        hasDeveloper: !!found.developer_request,
        functionalLength: found.functional_spec?.length || 0,
        technicalLength: found.technical_spec?.length || 0,
        testLength: found.test_plan?.length || 0,
        developerLength: found.developer_request?.length || 0
      });
    } else {
      console.log("[SystemDoc] ❌ Doc not found");
    }
    
    return found || null;
  }, [docs, selectedFile, selectedFolder]);

  const currentDoc = getCurrentDoc();

  const handleSaveDoc = async () => {
    if (!selectedFile || !editingDocType) return;

    console.log("[SystemDoc] Saving doc:", {
      file: selectedFile.name,
      type: editingDocType,
      contentLength: docContent.length
    });

    try {
      const docData = {
        feature_type: selectedFolder,
        feature_name: selectedFile.name,
        display_name: selectedFile.displayName,
        related_files: [selectedFile.path],
        last_updated_by: 'current_user',
        version: '1.0'
      };

      if (currentDoc) {
        // Update existing doc - preserve other fields
        const updateData = {
          ...docData,
          functional_spec: editingDocType === 'functional' ? docContent : (currentDoc.functional_spec || ''),
          technical_spec: editingDocType === 'technical' ? docContent : (currentDoc.technical_spec || ''),
          test_plan: editingDocType === 'test' ? docContent : (currentDoc.test_plan || ''),
          developer_request: editingDocType === 'developer_request' ? docContent : (currentDoc.developer_request || '')
        };

        console.log("[SystemDoc] Updating doc ID:", currentDoc.id, "with field:", editingDocType);
        await base44.entities.FeatureDocumentation.update(currentDoc.id, updateData);
        toast.success('מסמך עודכן בהצלחה');
      } else {
        // Create new doc
        const createData = {
          ...docData,
          functional_spec: editingDocType === 'functional' ? docContent : '',
          technical_spec: editingDocType === 'technical' ? docContent : '',
          test_plan: editingDocType === 'test' ? docContent : '',
          developer_request: editingDocType === 'developer_request' ? docContent : ''
        };

        console.log("[SystemDoc] Creating new doc");
        await base44.entities.FeatureDocumentation.create(createData);
        toast.success('מסמך חדש נוצר');
      }

      setShowDocDialog(false);
      setEditingDocType(null);
      setDocContent('');
      
      // Reload docs and wait for it
      await loadDocs();
      console.log("[SystemDoc] ✅ Docs reloaded after save");
      
    } catch (error) {
      console.error('[SystemDoc] ❌ Error saving doc:', error);
      toast.error('שגיאה בשמירת מסמך', {
        description: error.message
      });
    }
  };

  const handleEditDoc = (docType) => {
    console.log("[SystemDoc] Edit doc clicked:", docType);
    console.log("[SystemDoc] Current doc:", currentDoc?.feature_name || 'none');
    
    if (!currentDoc) {
      console.log("[SystemDoc] No current doc, setting empty content");
      setDocContent('');
    } else {
      const fieldName = docType === 'developer_request' ? 'developer_request' : `${docType}_spec`;
      const content = currentDoc[fieldName] || '';
      console.log("[SystemDoc] Loading content for:", fieldName, "length:", content.length);
      setDocContent(content);
    }
    setEditingDocType(docType);
    setShowDocDialog(true);
  };

  const handleViewDoc = (docType) => {
    const fieldName = docType === 'developer_request' ? 'developer_request' : `${docType}_spec`;
    setDocContent(currentDoc?.[fieldName] || 'אין תוכן');
    setEditingDocType(null);
    setShowDocDialog(true);
  };

  const handleDownloadSingleDoc = (docType) => {
    const fieldName = docType === 'developer_request' ? 'developer_request' : `${docType}_spec`;
    
    if (!currentDoc || !currentDoc[fieldName]) {
      toast.error('אין תוכן להורדה');
      return;
    }

    const content = currentDoc[fieldName];
    const fileName = `${selectedFile.name}_${docType}_${new Date().toISOString().split('T')[0]}.md`;
    
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('קובץ הורד בהצלחה');
  };

  const handleDownloadAllDocs = async () => {
    setDownloadingAll(true);
    try {
      const response = await base44.functions.invoke('exportAllDocumentation');
      
      if (response.data.success) {
        const zipBlob = new Blob([Uint8Array.from(atob(response.data.zipBase64), c => c.charCodeAt(0))], 
          { type: 'application/zip' });
        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `documentation_${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.success('קובץ ZIP הורד בהצלחה', {
          description: `${response.data.fileCount} מסמכים נכללו`
        });
      } else {
        throw new Error(response.data.error || 'Failed to export');
      }
    } catch (error) {
      console.error('Error downloading all docs:', error);
      toast.error('שגיאה בהורדת המסמכים', {
        description: error.message
      });
    } finally {
      setDownloadingAll(false);
    }
  };

  const getFilteredFiles = useCallback(() => {
    const folder = featureStructure[selectedFolder];
    if (!folder) return [];
    
    if (!searchTerm) return folder.items;
    
    return folder.items.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [selectedFolder, searchTerm]);

  const filteredFiles = getFilteredFiles();

  const getDocStatusBadge = (doc) => {
    if (!doc) {
      return <Badge className="bg-gray-100 text-gray-600">ללא תיעוד</Badge>;
    }

    const hasAll = doc.functional_spec && doc.technical_spec && doc.test_plan && doc.developer_request;
    const hasSome = doc.functional_spec || doc.technical_spec || doc.test_plan || doc.developer_request;

    if (hasAll) {
      return <Badge className="bg-green-100 text-green-700"><Check className="h-3 w-3 ml-1" />מלא</Badge>;
    } else if (hasSome) {
      return <Badge className="bg-amber-100 text-amber-700"><Clock className="h-3 w-3 ml-1" />חלקי</Badge>;
    } else {
      return <Badge className="bg-gray-100 text-gray-600">ריק</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            ניהול תיעוד מערכת
          </h1>
        </div>
        
        <Button
          onClick={handleDownloadAllDocs}
          disabled={downloadingAll || docs.length === 0}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {downloadingAll ? (
            <Loader2 className="h-4 w-4 ml-2 animate-spin" />
          ) : (
            <FileArchive className="h-4 w-4 ml-2" />
          )}
          הורד הכל (ZIP)
        </Button>
      </div>

      <Tabs value={viewMode} onValueChange={setViewMode} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="explorer">סייר מסמכים</TabsTrigger>
          <TabsTrigger value="legacy">תיעוד היסטורי</TabsTrigger>
        </TabsList>

        <TabsContent value="explorer" className="space-y-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="חיפוש מסמכים..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>

          {/* Debug Info - Temporary */}
          {selectedFile && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-xs">
              <strong>🐛 Debug Info:</strong>
              <div>Selected: {selectedFile.name} ({selectedFolder})</div>
              <div>Current doc exists: {currentDoc ? 'Yes' : 'No'}</div>
              {currentDoc && (
                <>
                  <div>Has functional_spec: {currentDoc.functional_spec ? `Yes (${currentDoc.functional_spec.length} chars)` : 'No'}</div>
                  <div>Has technical_spec: {currentDoc.technical_spec ? `Yes (${currentDoc.technical_spec.length} chars)` : 'No'}</div>
                  <div>Has test_plan: {currentDoc.test_plan ? `Yes (${currentDoc.test_plan.length} chars)` : 'No'}</div>
                  <div>Has developer_request: {currentDoc.developer_request ? `Yes (${currentDoc.developer_request.length} chars)` : 'No'}</div>
                </>
              )}
              <div>Total docs loaded: {docs.length}</div>
            </div>
          )}

          {/* Dual Pane Layout - SWAPPED: Files Right, Details Left */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* LEFT Pane: Documentation Details */}
            <Card className="h-[70vh] order-2 lg:order-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode className="h-5 w-5 text-blue-500" />
                    {selectedFile ? selectedFile.displayName : 'בחר מסמך'}
                  </div>
                  {selectedFile && currentDoc && (
                    <Badge className={
                      currentDoc.status === 'approved' ? 'bg-green-100 text-green-700' :
                      currentDoc.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                      currentDoc.status === 'needs_review' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-700'
                    }>
                      {currentDoc.status === 'approved' ? 'מאושר' :
                       currentDoc.status === 'completed' ? 'הושלם' :
                       currentDoc.status === 'needs_review' ? 'לבדיקה' : 'בעבודה'}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedFile ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <Folder className="h-16 w-16 mb-4" />
                    <p className="text-center">בחר מסמך מהרשימה<br />כדי לצפות או לערוך את התיעוד</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[calc(70vh-120px)]">
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-sm text-gray-600">נתיב קובץ:</p>
                        <p className="text-xs font-mono text-gray-800 mt-1">{selectedFile.path}</p>
                      </div>

                      <div className="space-y-3">
                        <h3 className="font-semibold text-sm text-gray-700">מסמכי תיעוד:</h3>
                        
                        {/* Developer Request - NEW! */}
                        <Card className="border-r-4 border-amber-400">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Lightbulb className="h-5 w-5 text-amber-600" />
                                <h4 className="font-medium">בקשת המפתח</h4>
                              </div>
                              <div className="flex gap-1">
                                {currentDoc?.developer_request && (
                                  <>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleDownloadSingleDoc('developer_request')}
                                      title="הורד מסמך"
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleViewDoc('developer_request')}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleEditDoc('developer_request')}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            {currentDoc?.developer_request ? (
                              <p className="text-xs text-gray-600 line-clamp-2">
                                {currentDoc.developer_request.substring(0, 100)}...
                              </p>
                            ) : (
                              <p className="text-xs text-gray-400">לחץ על עריכה ליצירת מסמך</p>
                            )}
                          </CardContent>
                        </Card>

                        {/* Functional Spec */}
                        <Card className="border-r-4 border-blue-400">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-blue-600" />
                                <h4 className="font-medium">אפיון תפקודי</h4>
                              </div>
                              <div className="flex gap-1">
                                {currentDoc?.functional_spec && (
                                  <>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleDownloadSingleDoc('functional')}
                                      title="הורד מסמך"
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleViewDoc('functional')}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleEditDoc('functional')}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            {currentDoc?.functional_spec ? (
                              <p className="text-xs text-gray-600 line-clamp-2">
                                {currentDoc.functional_spec.substring(0, 100)}...
                              </p>
                            ) : (
                              <p className="text-xs text-gray-400">לחץ על עריכה ליצירת מסמך</p>
                            )}
                          </CardContent>
                        </Card>

                        {/* Technical Spec */}
                        <Card className="border-r-4 border-purple-400">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Code className="h-5 w-5 text-purple-600" />
                                <h4 className="font-medium">מסמך טכני</h4>
                              </div>
                              <div className="flex gap-1">
                                {currentDoc?.technical_spec && (
                                  <>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleDownloadSingleDoc('technical')}
                                      title="הורד מסמך"
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleViewDoc('technical')}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleEditDoc('technical')}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            {currentDoc?.technical_spec ? (
                              <p className="text-xs text-gray-600 line-clamp-2">
                                {currentDoc.technical_spec.substring(0, 100)}...
                              </p>
                            ) : (
                              <p className="text-xs text-gray-400">לחץ על עריכה ליצירת מסמך</p>
                            )}
                          </CardContent>
                        </Card>

                        {/* Test Plan */}
                        <Card className="border-r-4 border-green-400">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Check className="h-5 w-5 text-green-600" />
                                <h4 className="font-medium">מסמך בדיקות</h4>
                              </div>
                              <div className="flex gap-1">
                                {currentDoc?.test_plan && (
                                  <>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleDownloadSingleDoc('test')}
                                      title="הורד מסמך"
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleViewDoc('test')}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleEditDoc('test')}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            {currentDoc?.test_plan ? (
                              <p className="text-xs text-gray-600 line-clamp-2">
                                {currentDoc.test_plan.substring(0, 100)}...
                              </p>
                            ) : (
                              <p className="text-xs text-gray-400">לחץ על עריכה ליצירת מסמך</p>
                            )}
                          </CardContent>
                        </Card>

                        {currentDoc && (
                          <div className="bg-blue-50 p-3 rounded-md text-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-gray-600">עודכן:</span>
                                <p className="font-medium">{new Date(currentDoc.updated_date).toLocaleDateString('he-IL')}</p>
                              </div>
                              <div>
                                <span className="text-gray-600">גרסה:</span>
                                <p className="font-medium">{currentDoc.version || '1.0'}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* RIGHT Pane: Folders and Files */}
            <Card className="h-[70vh] order-1 lg:order-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Folder className="h-5 w-5 text-amber-500" />
                  תקיות ומסמכים
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* Folder Tabs - Split to 2 rows on mobile */}
                <div className="flex flex-wrap border-b bg-gray-50 px-2 py-1 gap-1">
                  {Object.entries(featureStructure).map(([key, folder]) => {
                    const Icon = folder.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          setSelectedFolder(key);
                          setSelectedFile(null);
                        }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-t-md transition-colors ${
                          selectedFolder === key
                            ? 'bg-white border-t-2 border-blue-500 font-medium'
                            : 'hover:bg-white/50'
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${folder.color}`} />
                        <span className="text-sm">{folder.shortName}</span>
                        <Badge variant="outline" className="text-xs">{folder.items.length}</Badge>
                      </button>
                    );
                  })}
                </div>

                <ScrollArea className="h-[calc(70vh-120px)]">
                  <div className="p-2 space-y-1">
                    {filteredFiles.map((file) => {
                      const fileDoc = docs.find(d => 
                        d.feature_type === selectedFolder && 
                        d.feature_name === file.name
                      );
                      const isSelected = selectedFile?.name === file.name;
                      
                      return (
                        <button
                          key={file.name}
                          onClick={() => setSelectedFile(file)}
                          className={`w-full text-right px-3 py-2 rounded-md transition-colors ${
                            isSelected 
                              ? 'bg-blue-50 border-r-4 border-blue-500' 
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <File className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm truncate">{file.displayName}</p>
                                <p className="text-xs text-gray-500 truncate">{file.name}</p>
                              </div>
                            </div>
                            {getDocStatusBadge(fileDoc)}
                          </div>
                        </button>
                      );
                    })}
                    
                    {filteredFiles.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p>לא נמצאו מסמכים</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">
                  {docs.filter(d => d.functional_spec && d.technical_spec && d.test_plan && d.developer_request).length}
                </p>
                <p className="text-xs text-gray-600">מתועדים מלא</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-amber-600">
                  {docs.filter(d => (d.functional_spec || d.technical_spec || d.test_plan || d.developer_request) && 
                    !(d.functional_spec && d.technical_spec && d.test_plan && d.developer_request)).length}
                </p>
                <p className="text-xs text-gray-600">תיעוד חלקי</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-gray-600">
                  {Object.values(featureStructure).reduce((sum, folder) => sum + folder.items.length, 0) - docs.length}
                </p>
                <p className="text-xs text-gray-600">ללא תיעוד</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round((docs.filter(d => d.functional_spec && d.technical_spec && d.test_plan && d.developer_request).length / 
                    Object.values(featureStructure).reduce((sum, folder) => sum + folder.items.length, 0)) * 100)}%
                </p>
                <p className="text-xs text-gray-600">אחוז השלמה</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="legacy">
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-600 text-center py-8">
                התיעוד הישן נשמר כאן לעיון היסטורי.
                <br />
                השתמש ב"סייר מסמכים" לניהול תיעוד עדכני.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit/View Document Dialog */}
      <Dialog open={showDocDialog} onOpenChange={setShowDocDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingDocType ? (
                <>
                  <Edit className="h-5 w-5" />
                  עריכת {editingDocType === 'functional' ? 'אפיון תפקודי' : 
                          editingDocType === 'technical' ? 'מסמך טכני' : 
                          editingDocType === 'test' ? 'מסמך בדיקות' : 'בקשת המפתח'}
                </>
              ) : (
                <>
                  <Eye className="h-5 w-5" />
                  צפייה במסמך
                </>
              )}
            </DialogTitle>
            {selectedFile && (
              <DialogDescription>
                {selectedFile.displayName} ({selectedFile.path})
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="py-4">
            {editingDocType ? (
              <div>
                <Label>תוכן המסמך:</Label>
                <Textarea
                  value={docContent}
                  onChange={(e) => setDocContent(e.target.value)}
                  className="min-h-[400px] font-mono text-sm mt-2"
                  placeholder={
                    editingDocType === 'functional' ? 
                      'תאר את מטרת המסמך, מקרי שימוש, כללי עסקים, ותיאור UI/UX...' :
                    editingDocType === 'technical' ?
                      'תאר את הארכיטקטורה, ישויות מעורבות, פונקציות Backend, תלויות...' :
                    editingDocType === 'test' ?
                      'תאר תרחישי בדיקה, מקרי קצה, בדיקות רספונסיביות...' :
                      'נתח את כל הבקשות והדרישות של המפתח, התווה את החזון והמטרות...'
                  }
                />
                <p className="text-xs text-gray-500 mt-2">
                  תומך ב-Markdown. השתמש בפסקות, כותרות ורשימות לעיצוב המסמך.
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[400px] border rounded-md p-4 bg-gray-50">
                <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                  {docContent}
                </div>
              </ScrollArea>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDocDialog(false);
                setEditingDocType(null);
                setDocContent('');
              }}
            >
              <X className="h-4 w-4 ml-2" />
              {editingDocType ? 'ביטול' : 'סגור'}
            </Button>
            {editingDocType && (
              <Button onClick={handleSaveDoc} className="bg-blue-600 hover:bg-blue-700">
                <Save className="h-4 w-4 ml-2" />
                שמור מסמך
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
