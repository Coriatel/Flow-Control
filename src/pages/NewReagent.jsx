
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { 
  ArrowLeft, 
  Plus, 
  Upload, 
  FileText, 
  Save, 
  Loader2, 
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Reagent } from '@/api/entities';
import { ReagentCatalog } from '@/api/entities';
import { UploadFile, ExtractDataFromUploadedFile } from '@/api/integrations';

const categories = {
  reagents: "ריאגנטים",
  cells: "כדוריות",
  controls: "בקרות",
  solutions: "תמיסות",
};

const suppliers = ["ELDAN", "BIORAD", "DYN", "OTHER"];

export default function NewReagentPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Single reagent form
  const [reagentForm, setReagentForm] = useState({
    name: '',
    category: 'reagents',
    supplier: '',
    catalog_number: '',
    item_number: ''
  });
  const [isSaving, setSaving] = useState(false);

  // Bulk import state
  const [uploadingFile, setUploadingFile] = useState(false);
  const [processingFile, setProcessingFile] = useState(false);
  const [extractedData, setExtractedData] = useState([]);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [creatingReagents, setCreatingReagents] = useState(false);
  const [importResults, setImportResults] = useState(null);

  // Get next available item number
  const getNextItemNumber = async () => {
    try {
      const existingReagents = await Reagent.list();
      const existingNumbers = existingReagents
        .map(r => r.item_number)
        .filter(num => num != null && !isNaN(num))
        .map(num => parseInt(num));
      
      if (existingNumbers.length === 0) return 10001;
      return Math.max(...existingNumbers) + 1;
    } catch (error) {
      console.error("Error getting next item number:", error);
      return 10001;
    }
  };

  // Handle single reagent save
  const handleSaveReagent = async () => {
    if (!reagentForm.name.trim() || !reagentForm.supplier || !reagentForm.catalog_number.trim()) {
      toast({ 
        title: "שדות חסרים", 
        description: "שם פריט, ספק ומספר קטלוגי הם שדות חובה.", 
        variant: "default" 
      });
      return;
    }

    setSaving(true);
    try {
      // Check for duplicate catalog number
      const existingReagents = await Reagent.list();
      const isDuplicateCatalog = existingReagents.some(r => 
        r.catalog_number === reagentForm.catalog_number.trim()
      );

      if (isDuplicateCatalog) {
        toast({ 
          title: "שגיאה", 
          description: `מספר קטלוגי ${reagentForm.catalog_number} כבר קיים במערכת.`, 
          variant: "destructive"
        });
        setSaving(false);
        return;
      }

      const itemNumber = reagentForm.item_number ? 
        parseInt(reagentForm.item_number) : 
        await getNextItemNumber();

      // Check for duplicate item number
      const isDuplicateItem = existingReagents.some(r => 
        r.item_number === itemNumber
      );

      if (isDuplicateItem) {
        toast({ 
          title: "שגיאה", 
          description: `מספר פריט ${itemNumber} כבר קיים במערכת.`, 
          variant: "destructive"
        });
        setSaving(false);
        return;
      }

      const dataToSave = {
        catalog_item_id: `CAT_${reagentForm.supplier}_${itemNumber}`,
        name: reagentForm.name.trim(),
        category: reagentForm.category,
        supplier: reagentForm.supplier,
        catalog_number: reagentForm.catalog_number.trim(),
        item_number: itemNumber,
        notes: reagentForm.notes?.trim() || null,
        total_quantity_all_batches: 0,
        active_batches_count: 0,
        current_stock_status: 'out_of_stock'
      };

      await Reagent.create(dataToSave);
      
      toast({ 
        title: "הצלחה", 
        description: "הריאגנט נוצר בהצלחה.", 
        variant: "default" 
      });
      
      navigate(createPageUrl('ManageReagents'));
      
    } catch (error) {
      console.error("Error saving reagent:", error);
      toast({ 
        title: "שגיאה בשמירה", 
        description: error.message || "אירעה שגיאה בשמירת הריאגנט.", 
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };

  // Enhanced file upload with supported formats only
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const uploadResult = await UploadFile({ file });
      console.log("File uploaded:", uploadResult.file_url);

      setProcessingFile(true);
      
      // Try to extract data from supported file types (PDF, images, Word, CSV)
      // Excel files will also go through here but will likely fail extraction and fall back to manual input.
      await handleSupportedFile(uploadResult.file_url, file.name);
      
    } catch (error) {
      console.error("Error processing file:", error);
      toast({
        title: "שגיאה בעיבוד הקובץ",
        description: "לא ניתן לעבד את הקובץ. נסה קובץ PDF או תמונה, או צור ריאגנטים ידנית.",
        variant: "destructive"
      });
      // Fallback: Show manual input dialog if processing fails
      await showManualInputDialog(file.name);
    } finally {
      setUploadingFile(false);
      setProcessingFile(false);
      event.target.value = ''; // Clear the input field
    }
  };

  // Process extracted items and normalize them
  const processExtractedItems = (items) => {
    return items.map((item, index) => {
      // Smart supplier detection based on common patterns
      let supplier = item.supplier; // Start with extracted supplier
      const itemName = (item.name || '').toLowerCase();
      const itemNotes = (item.notes || '').toLowerCase();
      
      // If supplier is not explicitly extracted or is generic, try to infer
      if (!supplier || !suppliers.includes(supplier.toUpperCase())) {
        if (itemName.includes('eldan') || itemNotes.includes('eldan')) {
          supplier = 'ELDAN';
        } else if (itemName.includes('biorad') || itemNotes.includes('biorad')) {
          supplier = 'BIORAD';
        } else if (itemName.includes('dyn') || itemNotes.includes('dyn')) {
          supplier = 'DYN';
        } else {
          supplier = 'OTHER';
        }
      } else {
        supplier = supplier.toUpperCase(); // Ensure it matches our enum
      }

      // Smart category detection
      let category = item.category; // Start with extracted category
      // If category is not explicitly extracted or is generic, try to infer
      if (!category || !Object.keys(categories).includes(category)) {
        if (itemName.includes('cells') || itemName.includes('כדוריות') || itemNotes.includes('cells') || itemNotes.includes('כדוריות')) {
          category = 'cells';
        } else if (itemName.includes('control') || itemName.includes('בקרה') || itemNotes.includes('control') || itemNotes.includes('בקרה')) {
          category = 'controls';
        } else if (itemName.includes('solution') || itemName.includes('תמיסה') || itemNotes.includes('solution') || itemNotes.includes('תמיסה')) {
          category = 'solutions';
        } else {
          category = 'reagents'; // Default category
        }
      }

      return {
        name: item.name || `פריט ${index + 1}`,
        category: category,
        supplier: supplier,
        catalog_number: item.catalog_number || `AUTO_${Date.now()}_${index}`,
        notes: item.notes || '',
        item_number: null, // item_number is assigned later during bulk creation
        ui_id: Date.now() + index // Unique ID for UI keying
      };
    });
  };

  // Handle supported file types (PDF, images, Word, CSV)
  const handleSupportedFile = async (fileUrl, fileName) => {
    try {
      const extractResult = await ExtractDataFromUploadedFile({
        file_url: fileUrl,
        json_schema: {
          type: "object",
          properties: {
            reagents: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string", description: "שם הריאגנט או הפריט" },
                  category: { 
                    type: "string", 
                    enum: ["reagents", "cells", "controls", "solutions"],
                    description: "קטגוריה: reagents=ריאגנטים, cells=כדוריות, controls=בקרות, solutions=תמיסות" 
                  },
                  supplier: { 
                    type: "string", 
                    enum: ["ELDAN", "BIORAD", "DYN", "OTHER"],
                    description: "ספק" 
                  },
                  catalog_number: { type: "string", description: "מספר קטלוגי" },
                  notes: { type: "string", description: "הערות או פרטים נוספים" }
                },
                required: ["name"]
              }
            }
          }
        }
      });

      if (extractResult.status === 'success' && extractResult.output?.reagents && extractResult.output.reagents.length > 0) {
        const reagentsData = extractResult.output.reagents;
        console.log(`Extracted ${reagentsData.length} reagents from file`);
        
        const processedReagents = processExtractedItems(reagentsData);
        
        setExtractedData(processedReagents);
        setShowPreviewDialog(true);
        
        toast({
          title: "קובץ עובד בהצלחה",
          description: `זוהו ${reagentsData.length} ריאגנטים. בדוק את הנתונים לפני היצירה.`,
          variant: "default"
        });
      } else {
        // This includes cases where `extractResult.status` is not 'success' or no reagents found.
        throw new Error(extractResult.details || "לא ניתן לחלץ נתוני ריאגנטים מהקובץ או שלא נמצאו נתונים רלוונטיים.");
      }
    } catch (error) {
      console.error("File processing failed:", error);
      
      // Fallback: Show manual input dialog
      await showManualInputDialog(fileName);
    }
  };

  // Create sample data based on the provided PDF structure
  const createSampleDataFromPDF = () => {
    const sampleReagents = [
      // ELDAN Reagents
      { name: "Anti-IgG Green", category: "reagents", supplier: "ELDAN", catalog_number: "ELDAN_001" },
      { name: "Anti-D", category: "reagents", supplier: "ELDAN", catalog_number: "ELDAN_002" },
      { name: "Anti-A", category: "reagents", supplier: "ELDAN", catalog_number: "ELDAN_003" },
      { name: "Anti-B", category: "reagents", supplier: "ELDAN", catalog_number: "ELDAN_004" },
      { name: "Anti-C", category: "reagents", supplier: "ELDAN", catalog_number: "ELDAN_005" },
      { name: "Anti-c", category: "reagents", supplier: "ELDAN", catalog_number: "ELDAN_006" },
      { name: "Anti-K", category: "reagents", supplier: "ELDAN", catalog_number: "ELDAN_007" },
      { name: "Anti-M", category: "reagents", supplier: "ELDAN", catalog_number: "ELDAN_008" },
      { name: "Anti-e", category: "reagents", supplier: "ELDAN", catalog_number: "ELDAN_009" },
      { name: "Anti-P1", category: "reagents", supplier: "ELDAN", catalog_number: "ELDAN_010" },
      { name: "Anti-N", category: "reagents", supplier: "ELDAN", catalog_number: "ELDAN_011" },
      { name: "Anti-A1", category: "reagents", supplier: "ELDAN", catalog_number: "ELDAN_012" },
      { name: "Anti-Jka", category: "reagents", supplier: "ELDAN", catalog_number: "ELDAN_013" },
      { name: "Anti-Jkb", category: "reagents", supplier: "ELDAN", catalog_number: "ELDAN_014" },
      { name: "Elu-kit II", category: "reagents", supplier: "ELDAN", catalog_number: "ELDAN_015" },
      { name: "ChloroQuin", category: "reagents", supplier: "ELDAN", catalog_number: "ELDAN_016" },
      
      // BIORAD Reagents
      { name: "Anti IgG", category: "reagents", supplier: "BIORAD", catalog_number: "BIORAD_001" },
      { name: "Diluent II 500 ml", category: "solutions", supplier: "BIORAD", catalog_number: "BIORAD_002" },
      { name: "TIPS", category: "reagents", supplier: "BIORAD", catalog_number: "BIORAD_003" },
      { name: "Liss/Coombs", category: "reagents", supplier: "BIORAD", catalog_number: "BIORAD_004" },
      { name: "Newborn", category: "reagents", supplier: "BIORAD", catalog_number: "BIORAD_005" },
      { name: "DC screening II", category: "controls", supplier: "BIORAD", catalog_number: "BIORAD_006" },
      
      // DYN Reagents
      { name: "A,B,D,CTL,REV 100 CAS", category: "reagents", supplier: "DYN", catalog_number: "DYN_001" },
      { name: "Poly AHG 100 CAS", category: "reagents", supplier: "DYN", catalog_number: "DYN_002" },
      { name: "A,B,D 100 CAS", category: "reagents", supplier: "DYN", catalog_number: "DYN_003" },
      { name: "NEWBORN 100 CAS", category: "reagents", supplier: "DYN", catalog_number: "DYN_004" },
      
      // ELDAN Cells
      { name: "REFERENCELLS A1,B", category: "cells", supplier: "ELDAN", catalog_number: "ELDAN_CELLS_001" },
      { name: "PANOSCREEN I,II&III", category: "cells", supplier: "ELDAN", catalog_number: "ELDAN_CELLS_002" },
      { name: "CHECKCELLS", category: "cells", supplier: "ELDAN", catalog_number: "ELDAN_CELLS_003" },
      
      // BIORAD Cells
      { name: "DIAPANEL (11x4ML)", category: "cells", supplier: "BIORAD", catalog_number: "BIORAD_CELLS_001" },
      { name: "DIACELL I-II-III (3x10ML)", category: "cells", supplier: "BIORAD", catalog_number: "BIORAD_CELLS_002" },
      { name: "DIACELL ABO (A1-B)", category: "cells", supplier: "BIORAD", catalog_number: "BIORAD_CELLS_003" },
      
      // DYN Cells
      { name: "0.8% Surgiscreen", category: "cells", supplier: "DYN", catalog_number: "DYN_CELLS_001" },
      { name: "Affirmagen A1 & B Cells", category: "cells", supplier: "DYN", catalog_number: "DYN_CELLS_002" },
      { name: "0.8% RESOLVE PANEL C", category: "cells", supplier: "DYN", catalog_number: "DYN_CELLS_003" },
    ];

    // Ensure all required fields for processExtractedItems are present
    return sampleReagents.map((reagent, index) => ({
      ...reagent,
      notes: reagent.notes || "",
      item_number: null,
      ui_id: Date.now() + index,
      // Ensure category and supplier are valid according to enums, or fallback to sensible defaults/OTHER
      category: Object.keys(categories).includes(reagent.category) ? reagent.category : 'reagents',
      supplier: suppliers.includes(reagent.supplier) ? reagent.supplier : 'OTHER',
    }));
  };

  // Show manual input dialog for files that couldn't be processed
  const showManualInputDialog = async (fileName) => {
    // Create a basic template for manual input
    const basicTemplate = [
      {
        name: "פריט 1",
        category: "reagents",
        supplier: "ELDAN",
        catalog_number: `AUTO_${Date.now()}_0`,
        notes: "",
        item_number: null,
        ui_id: Date.now()
      },
      {
        name: "פריט 2", 
        category: "cells",
        supplier: "BIORAD",
        catalog_number: `AUTO_${Date.now()}_1`,
        notes: "",
        item_number: null,
        ui_id: Date.now() + 1
      }
    ];
    
    setExtractedData(basicTemplate);
    setShowPreviewDialog(true);
    
    toast({
      title: "צור ריאגנטים ידנית",
      description: `לא ניתן היה לחלץ נתונים מקובץ "${fileName}". אנא הזן את הנתונים ידנית בטבלה.`,
      variant: "default"
    });
  };

  // Handle bulk creation
  const handleBulkCreate = async () => {
    if (extractedData.length === 0) return;

    setCreatingReagents(true);
    try {
      const existingReagents = await Reagent.list();
      const existingCatalogNumbers = new Set(existingReagents.map(r => r.catalog_number));
      const existingItemNumbers = existingReagents
        .map(r => r.item_number)
        .filter(num => num != null && !isNaN(num))
        .map(num => parseInt(num));
      
      let nextItemNumber = existingItemNumbers.length > 0 ? Math.max(...existingItemNumbers) + 1 : 10001;
      
      const results = {
        created: [],
        skipped: [],
        errors: []
      };

      for (const reagent of extractedData) {
        // Basic validation before processing
        if (!reagent.name || reagent.name.trim() === '') {
          results.errors.push({
            name: reagent.name || 'שם ריאגנט ריק',
            error: "שם ריאגנט חובה"
          });
          continue;
        }
        if (!reagent.supplier || reagent.supplier.trim() === '') {
          results.errors.push({
            name: reagent.name,
            error: "ספק חובה"
          });
          continue;
        }
        if (!reagent.catalog_number || reagent.catalog_number.trim() === '') {
          results.errors.push({
            name: reagent.name,
            error: "מספר קטלוגי חובה"
          });
          continue;
        }

        try {
          if (existingCatalogNumbers.has(reagent.catalog_number)) {
            results.skipped.push({
              name: reagent.name,
              reason: `מספר קטלוגי ${reagent.catalog_number} כבר קיים`
            });
            continue;
          }

          const currentItemNumber = nextItemNumber; // Use current value, then increment
          const dataToSave = {
            catalog_item_id: `CAT_${reagent.supplier}_${currentItemNumber}`,
            name: reagent.name.trim(),
            category: reagent.category,
            supplier: reagent.supplier,
            catalog_number: reagent.catalog_number.trim(),
            item_number: currentItemNumber,
            notes: reagent.notes?.trim() || null,
            total_quantity_all_batches: 0,
            active_batches_count: 0,
            current_stock_status: 'out_of_stock'
          };

          await Reagent.create(dataToSave);
          results.created.push({
            name: reagent.name,
            item_number: currentItemNumber,
            catalog_number: reagent.catalog_number
          });
          
          nextItemNumber++;
          existingCatalogNumbers.add(reagent.catalog_number);
          
          await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to prevent rate limiting issues
          
        } catch (error) {
          console.error(`Error creating reagent ${reagent.name}:`, error);
          results.errors.push({
            name: reagent.name,
            error: error.message
          });
        }
      }

      setImportResults(results);
      
      toast({
        title: "ייבוא הושלם",
        description: `נוצרו ${results.created.length} ריאגנטים. ${results.skipped.length} דולגו. ${results.errors.length} שגיאות.`,
        variant: results.created.length > 0 ? "default" : "destructive"
      });
      
      setShowPreviewDialog(false);
      
    } catch (error) {
      console.error("Error in bulk creation:", error);
      toast({
        title: "שגיאה בייבוא",
        description: error.message || "אירעה שגיאה בתהליך יצירת הריאגנטים",
        variant: "destructive"
      });
    } finally {
      setCreatingReagents(false);
    }
  };

  // Update extracted data
  const updateExtractedReagent = (index, field, value) => {
    const newData = [...extractedData];
    newData[index][field] = value;
    setExtractedData(newData);
  };

  // Remove reagent from extracted data
  const removeExtractedReagent = (index) => {
    const newData = extractedData.filter((_, i) => i !== index);
    setExtractedData(newData);
  };

  return (
    <div className="p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => navigate(createPageUrl('ManageReagents'))}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">הוספת ריאגנטים</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <Tabs defaultValue="single" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="single">הוספת ריאגנט יחיד</TabsTrigger>
            <TabsTrigger value="bulk">ייבוא מקובץ</TabsTrigger>
          </TabsList>

          <TabsContent value="single">
            <Card>
              <CardHeader>
                <CardTitle>פרטי הריאגנט החדש</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">שם הפריט *</Label>
                    <Input
                      id="name"
                      value={reagentForm.name}
                      onChange={(e) => setReagentForm({...reagentForm, name: e.target.value})}
                      placeholder="לדוגמה: Anti-A"
                    />
                  </div>
                  <div>
                    <Label htmlFor="catalog_number">מספר קטלוגי *</Label>
                    <Input
                      id="catalog_number"
                      value={reagentForm.catalog_number}
                      onChange={(e) => setReagentForm({...reagentForm, catalog_number: e.target.value})}
                      placeholder="לדוגמה: 123456"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">קטגוריה *</Label>
                    <Select value={reagentForm.category} onValueChange={(value) => setReagentForm({...reagentForm, category: value})}>
                      <SelectTrigger id="category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(categories).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="supplier">ספק *</Label>
                    <Select value={reagentForm.supplier} onValueChange={(value) => setReagentForm({...reagentForm, supplier: value})}>
                      <SelectTrigger id="supplier">
                        <SelectValue placeholder="בחר ספק" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map(supplier => (
                          <SelectItem key={supplier} value={supplier}>{supplier}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="item_number">מספר פריט פנימי (אופציונלי)</Label>
                  <Input
                    id="item_number"
                    type="number"
                    value={reagentForm.item_number}
                    onChange={(e) => setReagentForm({...reagentForm, item_number: e.target.value})}
                    placeholder="אם לא יוזן, יוקצה אוטומטית"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">הערות</Label>
                  <Textarea
                    id="notes"
                    value={reagentForm.notes}
                    onChange={(e) => setReagentForm({...reagentForm, notes: e.target.value})}
                    placeholder="הערות נוספות על הריאגנט..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => navigate(createPageUrl('ManageReagents'))}
                  >
                    ביטול
                  </Button>
                  <Button
                    onClick={handleSaveReagent}
                    disabled={isSaving}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        שומר...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        שמור ריאגנט
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulk">
            <Card>
              <CardHeader>
                <CardTitle>ייבוא ריאגנטים מקובץ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>פורמטים נתמכים לחילוץ אוטומטי:</strong> PDF, Word (.doc, .docx), CSV, תמונות (JPG, PNG)
                    <br />
                    <strong>קבצי Excel:</strong> לא נתמכים כרגע בחילוץ אוטומטי. המערכת תציע תבנית לעריכה ידנית.
                    <br />
                    <strong>עצה:</strong> להעלאת קובץ Excel, המר אותו ל-PDF או תמונה לחילוץ אוטומטי.
                  </AlertDescription>
                </Alert>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <div className="space-y-4">
                    <Upload className="h-12 w-12 mx-auto text-gray-400" />
                    <div>
                      <h3 className="text-lg font-medium mb-2">העלה קובץ ריאגנטים</h3>
                      <p className="text-gray-600 mb-4">
                        גרור קובץ לכאן או לחץ לבחירה
                      </p>
                      <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        accept=".pdf,.xlsx,.xls,.csv,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleFileUpload}
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('file-upload').click()}
                        disabled={uploadingFile || processingFile}
                        className="bg-blue-50 hover:bg-blue-100 border-blue-300"
                      >
                        {uploadingFile ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            מעלה קובץ...
                          </>
                        ) : processingFile ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            מעבד קובץ...
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4 mr-2" />
                            בחר קובץ
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Alternative: Manual template creation */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4">או צור תבנית מוכנה</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const template = createSampleDataFromPDF();
                        setExtractedData(template);
                        setShowPreviewDialog(true);
                        toast({
                          title: "תבנית נוצרה",
                          description: "נוצרה תבנית עם ריאגנטים נפוצים. ערוך את הנתונים לפי הצורך.",
                          variant: "default"
                        });
                      }}
                      className="h-20 flex-col"
                    >
                      <FileText className="h-6 w-6 mb-2" />
                      <span>תבנית ריאגנטים נפוצים</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => {
                        const emptyTemplate = [{
                          name: "",
                          category: "reagents",
                          supplier: "ELDAN",
                          catalog_number: "",
                          notes: "",
                          ui_id: Date.now()
                        }];
                        setExtractedData(emptyTemplate);
                        setShowPreviewDialog(true);
                        toast({
                          title: "תבנית ריקה נוצרה",
                          description: "נוצרה תבנית ריקה. הוסף פריטים לפי הצורך.",
                          variant: "default"
                        });
                      }}
                      className="h-20 flex-col"
                    >
                      <Plus className="h-6 w-6 mb-2" />
                      <span>תבנית ריקה</span>
                    </Button>
                  </div>
                </div>

                {importResults && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">תוצאות ייבוא</h3>
                    
                    {importResults.created.length > 0 && (
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>נוצרו בהצלחה ({importResults.created.length}):</strong>
                          <ul className="mt-2 text-sm">
                            {importResults.created.slice(0, 5).map((item, index) => (
                              <li key={index}>• {item.name} (מק״ט: {item.catalog_number})</li>
                            ))}
                            {importResults.created.length > 5 && (
                              <li>... ועוד {importResults.created.length - 5} ריאגנטים</li>
                            )}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    {importResults.skipped.length > 0 && (
                      <Alert className="bg-yellow-50 border-yellow-200">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>דולגו ({importResults.skipped.length}):</strong>
                          <ul className="mt-2 text-sm">
                            {importResults.skipped.slice(0, 3).map((item, index) => (
                              <li key={index}>• {item.name} - {item.reason}</li>
                            ))}
                            {importResults.skipped.length > 3 && (
                              <li>... ועוד {importResults.skipped.length - 3}</li>
                            )}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    {importResults.errors.length > 0 && (
                      <Alert className="bg-red-50 border-red-200">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>שגיאות ({importResults.errors.length}):</strong>
                          <ul className="mt-2 text-sm">
                            {importResults.errors.slice(0, 3).map((item, index) => (
                              <li key={index}>• {item.name} - {item.error}</li>
                            ))}
                            {importResults.errors.length > 3 && (
                              <li>... ועוד {importResults.errors.length - 3}</li>
                            )}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex justify-end">
                      <Button
                        onClick={() => navigate(createPageUrl('ManageReagents'))}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        חזור לניהול ריאגנטים
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>בדיקה לפני יצירת ריאגנטים</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                זוהו {extractedData.length} ריאגנטים. בדוק את הנתונים ועדכן לפי הצורך לפני יצירתם במערכת.
                <br/>
                <strong>חשוב:</strong> שדות עם כוכבית (*) חובה למלא.
              </AlertDescription>
            </Alert>

            <div className="max-h-96 overflow-y-auto border rounded">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="p-2 text-right">שם הפריט *</th>
                    <th className="p-2 text-right">ספק *</th>
                    <th className="p-2 text-right">קטגוריה *</th>
                    <th className="p-2 text-right">מק״ט קטלוגי *</th>
                    <th className="p-2 text-right">הערות</th>
                    <th className="p-2 text-right">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {extractedData.map((reagent, index) => (
                    <tr key={reagent.ui_id} className="border-b">
                      <td className="p-2">
                        <Input
                          value={reagent.name}
                          onChange={(e) => updateExtractedReagent(index, 'name', e.target.value)}
                          className="text-sm"
                          required
                        />
                      </td>
                      <td className="p-2">
                        <Select
                          value={reagent.supplier}
                          onValueChange={(value) => updateExtractedReagent(index, 'supplier', value)}
                          required
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {suppliers.map(supplier => (
                              <SelectItem key={supplier} value={supplier}>{supplier}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2">
                        <Select
                          value={reagent.category}
                          onValueChange={(value) => updateExtractedReagent(index, 'category', value)}
                          required
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(categories).map(([value, label]) => (
                              <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2">
                        <Input
                          value={reagent.catalog_number}
                          onChange={(e) => updateExtractedReagent(index, 'catalog_number', e.target.value)}
                          className="text-sm"
                          required
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          value={reagent.notes || ''}
                          onChange={(e) => updateExtractedReagent(index, 'notes', e.target.value)}
                          className="text-sm"
                          placeholder="הערות..."
                        />
                      </td>
                      <td className="p-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExtractedReagent(index)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPreviewDialog(false)}
              disabled={creatingReagents}
            >
              ביטול
            </Button>
            <Button
              onClick={handleBulkCreate}
              disabled={creatingReagents || extractedData.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {creatingReagents ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  יוצר ריאגנטים...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  צור {extractedData.length} ריאגנטים
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
