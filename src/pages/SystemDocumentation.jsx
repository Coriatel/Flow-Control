
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
  Check, Clock, Save, X, Download, FileArchive, Lightbulb,
  Plus, Trash2, MessageSquare, Copy, FileDown, History,
  ClipboardList, Map, Users, TestTube, Workflow
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import BackButton from '@/components/ui/BackButton';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

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

// System Specification Content
const systemSpecification = `
# אפיון מערכת Flow Control - מערכת ניהול מלאי ריאגנטים

## סקירה כללית
מערכת Flow Control היא מערכת לניהול מלאי ריאגנטים עבור בנק הדם. המערכת מאפשרת מעקב אחר מלאי, תפוגות, הזמנות ומשיכות.

---

## דפים ראשיים ומסעות משתמש

### 1. מרכז הבקרה (Dashboard)
**מטרה:** מסך בית המציג סיכום מצב המערכת
**מה יש בדף:**
- כרטיסי סיכום: פריטים בפג תוקף קרוב, מלאי נמוך, הזמנות ממתינות, אספקות צפויות
- פעולות קריטיות: התראות שדורשות טיפול מיידי
- פעילות אחרונה: לוג של פעולות אחרונות במערכת
- ניווט מהיר לכל אזורי המערכת

**מסע משתמש:**
1. משתמש נכנס למערכת → מגיע לדשבורד
2. רואה התראות על פריטים שפג תוקפם
3. לוחץ על התראה → מועבר לדף ניהול אצוות

### 2. קליטת משלוח (NewDelivery)
**מטרה:** קליטת משלוחים שהתקבלו מספקים
**מה יש בדף:**
- בחירת ספק
- הוספת פריטים: ריאגנט, כמות, מספר אצווה, תאריך תפוגה
- סריקת תעודת משלוח
- אישור וביצוע קליטה

**מסע משתמש:**
1. הגעת משלוח פיזי → משתמש נכנס לקליטת משלוח
2. בוחר ספק → מזין פריטים
3. מאשר קליטה → המערכת מעדכנת מלאי

### 3. ספירת מלאי (InventoryCount)
**מטרה:** ביצוע ספירות מלאי תקופתיות
**מה יש בדף:**
- סינון לפי קטגוריה וספק
- רשימת ריאגנטים עם כמות נוכחית
- הזנת כמות נספרת
- שמירת טיוטה והשלמת ספירה

**מסע משתמש:**
1. משתמש מתחיל ספירה → בוחר קטגוריה
2. מזין כמויות לכל ריאגנט
3. שומר טיוטה → ממשיך מאוחר יותר
4. משלים ספירה → המערכת מעדכנת מלאי

### 4. ניהול אצוות ופגי תוקף (BatchAndExpiryManagement)
**מטרה:** מעקב אחר אצוות ותפוגות
**מה יש בדף:**
- טבלת אצוות עם סינון לפי סטטוס
- צביעה לפי קרבה לתפוגה (אדום=פג, כתום=קרוב)
- טיפול בפריטים שפג תוקפם
- העלאת תעודות COA

**מסע משתמש:**
1. משתמש רואה התראה על פג תוקף → נכנס לדף
2. מסנן לפי סטטוס "פג תוקף"
3. מסמן פריט → בוחר פעולה (השמדה/שימוש אחר)
4. מתעד את הפעולה

### 5. הקמת מסמך רכש (NewOrder)
**מטרה:** יצירת הזמנות חדשות לספקים
**מה יש בדף:**
- בחירת ספק
- הוספת פריטים להזמנה
- הגדרת סוג הזמנה (מסגרת/חד פעמית)
- שמירה ושליחה

**מסע משתמש:**
1. מזהים צורך במלאי → יוצרים הזמנה
2. בוחרים ספק ופריטים
3. שומרים → הזמנה בסטטוס "טיוטה"
4. שולחים → הזמנה נשלחת לספק

### 6. ניהול דרישות רכש (Orders)
**מטרה:** מעקב וניהול הזמנות
**מה יש בדף:**
- טבלת הזמנות עם סינון לפי סטטוס
- פרטי הזמנה וסטטוס
- עריכה וביטול הזמנות
- מעקב אספקות

### 7. משיכת ריאגנטים (NewWithdrawalRequest)
**מטרה:** יצירת בקשות משיכה מהזמנות מסגרת
**מה יש בדף:**
- בחירת הזמנת מסגרת
- בחירת פריטים וכמויות
- אישור משיכה

**מסע משתמש:**
1. צורך בריאגנט → בודקים יתרות בהזמנות מסגרת
2. יוצרים בקשת משיכה
3. מאשרים → נשלחת בקשה לספק

### 8. חישוב השלמות מלאי (InventoryReplenishment)
**מטרה:** חישוב אוטומטי של כמויות להזמנה
**מה יש בדף:**
- טבלת ריאגנטים עם מלאי נוכחי
- חישוב צריכה ממוצעת
- המלצות להזמנה
- יצירת הזמנה מהמלצות

---

## זרימות עבודה עיקריות

### זרימת קבלת משלוח
\`\`\`
משלוח מגיע → קליטת משלוח → עדכון מלאי → עדכון אצוות → יומן פעילות
\`\`\`

### זרימת הזמנה
\`\`\`
זיהוי חוסר → בדיקת יתרות מסגרת → משיכה/הזמנה חדשה → מעקב → קבלת משלוח
\`\`\`

### זרימת פג תוקף
\`\`\`
התראה על תפוגה קרובה → בדיקה פיזית → תיעוד פעולה (השמדה/שימוש) → עדכון מלאי
\`\`\`

---

## בדיקות נדרשות

### בדיקות פונקציונליות
1. **קליטת משלוח:** וידוא עדכון מלאי נכון
2. **ספירת מלאי:** וידוא שמירת טיוטה ועדכון
3. **חישוב צריכה:** וידוא חישוב ממוצעים נכון
4. **התראות תפוגה:** וידוא הצגה נכונה לפי ימים

### בדיקות UI/UX
1. רספונסיביות על מובייל
2. נגישות (קורא מסך)
3. שפה עברית RTL
4. זמני טעינה

### בדיקות אינטגרציה
1. חיבור בין דפים (ניווט)
2. עדכון נתונים בזמן אמת
3. סנכרון בין משתמשים

---

## הנחיות כלליות לפרויקט

1. **גמישות:** בנייה מודולרית לאפשרות הרחבה
2. **עצמאות רכיבים:** כל רכיב פועל באופן עצמאי
3. **חישובים בשרת:** הפחתת עומס על הדפדפן
4. **קבצים קטנים:** ניהול קל יותר של הקוד
5. **אבחון תקלות:** בקשת לוגים ומידע לפני תיקון
6. **הסבר פעולות:** תיעוד לוגיקה ותועלת
`;

// Development History Content
const developmentHistory = `
# היסטוריית פיתוח - Flow Control

## סיכום תהליך הפיתוח

### שלב 1: הקמת המערכת
- יצירת מבנה בסיסי של הישויות (Reagent, Order, Delivery, etc.)
- בניית דפים ראשוניים: Dashboard, InventoryCount, NewDelivery
- הגדרת ניווט וממשק משתמש בסיסי

### שלב 2: שיפורי יציבות
- **תיקון שגיאות Rate Limit:** הוספת safeFetch לפונקציות שרת
- **תיקון קריסות React #31:** תיקון הצגת אובייקטים במקום טקסט בדפים:
  - WithdrawalRequests
  - Orders
  - InventoryReplenishment
- **תיקון שגיאת selectedItems.size:** אתחול נכון של Set

### שלב 3: שיפורי ביצועים
- העברת לוגיקה כבדה לפונקציות שרת
- הוספת caching בצד הלקוח
- אופטימיזציה של טעינת נתונים

### שלב 4: שיפורי UX
- הוספת מערכת הודעות משופרת
- שיפור ניווט עם היסטוריה
- הוספת מסנני טבלאות מתקדמים

### בעיות שטופלו
1. ✅ React error #31 - הצגת אובייקטים
2. ✅ Rate Limit - הגנה על קריאות API
3. ✅ TypeError: selectedItems.size - אתחול Set
4. ✅ ניווט BatchAndExpiryManagement - הסרת שגיאה מיותרת
5. ✅ Toast שלא נסגר - הוספת auto-dismiss

### עקרונות מנחים
- **תכנות הגנתי:** בדיקת קיום לפני שימוש
- **הפרדת אחריויות:** נתונים, לוגיקה, תצוגה
- **חווית משתמש:** מצבי טעינה ושגיאה ברורים
`;

export default function SystemDocumentation() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('explorer');
  const [selectedFolder, setSelectedFolder] = useState('pages');
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Documentation states
  const [docs, setDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [editingDocType, setEditingDocType] = useState(null);
  const [docContent, setDocContent] = useState('');
  const [showDocDialog, setShowDocDialog] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);

  // Personal notes states
  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNote, setEditingNote] = useState(null);
  const [showNoteDialog, setShowNoteDialog] = useState(false);

  // Load documentation
  const loadDocs = useCallback(async () => {
    console.log("[SystemDoc] Loading documentation...");
    setLoadingDocs(true);
    try {
      const docsData = await base44.entities.FeatureDocumentation.list();
      console.log("[SystemDoc] ✅ Loaded docs:", docsData.length, "documents");
      setDocs(Array.isArray(docsData) ? docsData : []);
    } catch (error) {
      console.error('[SystemDoc] ❌ Error loading docs:', error);
      toast.error('שגיאה בטעינת מסמכים');
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  // Load personal notes
  const loadNotes = useCallback(async () => {
    setLoadingNotes(true);
    try {
      // Try to load from localStorage first
      const savedNotes = localStorage.getItem('developmentNotes');
      if (savedNotes) {
        setNotes(JSON.parse(savedNotes));
      }
    } catch (error) {
      console.error('[SystemDoc] Error loading notes:', error);
    } finally {
      setLoadingNotes(false);
    }
  }, []);

  useEffect(() => {
    loadDocs();
    loadNotes();
  }, [loadDocs, loadNotes]);

  // Save notes to localStorage
  const saveNotes = (updatedNotes) => {
    localStorage.setItem('developmentNotes', JSON.stringify(updatedNotes));
    setNotes(updatedNotes);
  };

  const handleAddNote = () => {
    if (!newNoteTitle.trim()) {
      toast.error('יש להזין כותרת להערה');
      return;
    }
    const newNote = {
      id: Date.now().toString(),
      title: newNoteTitle,
      content: newNoteContent,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    saveNotes([newNote, ...notes]);
    setNewNoteTitle('');
    setNewNoteContent('');
    setShowNoteDialog(false);
    toast.success('הערה נוספה בהצלחה');
  };

  const handleUpdateNote = () => {
    if (!editingNote) return;
    const updatedNotes = notes.map(note =>
      note.id === editingNote.id
        ? { ...note, title: newNoteTitle, content: newNoteContent, updatedAt: new Date().toISOString() }
        : note
    );
    saveNotes(updatedNotes);
    setEditingNote(null);
    setNewNoteTitle('');
    setNewNoteContent('');
    setShowNoteDialog(false);
    toast.success('הערה עודכנה בהצלחה');
  };

  const handleDeleteNote = (noteId) => {
    const updatedNotes = notes.filter(note => note.id !== noteId);
    saveNotes(updatedNotes);
    toast.success('הערה נמחקה');
  };

  const openEditNote = (note) => {
    setEditingNote(note);
    setNewNoteTitle(note.title);
    setNewNoteContent(note.content);
    setShowNoteDialog(true);
  };

  // Download functions
  const downloadAsMarkdown = (content, filename) => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('קובץ MD הורד בהצלחה');
  };

  const downloadAsHTML = (content, filename) => {
    const htmlContent = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${filename}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
    h1, h2, h3 { color: #1e3a5f; }
    pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
    code { background: #e7e7e7; padding: 2px 5px; border-radius: 3px; }
  </style>
</head>
<body>
<pre>${content}</pre>
</body>
</html>`;
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('קובץ HTML הורד בהצלחה');
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('הועתק ללוח');
    } catch (error) {
      toast.error('שגיאה בהעתקה');
    }
  };

  const getCurrentDoc = useCallback(() => {
    if (!selectedFile) return null;
    return docs.find(doc =>
      doc.feature_type === selectedFolder &&
      doc.feature_name === selectedFile.name
    ) || null;
  }, [docs, selectedFile, selectedFolder]);

  const currentDoc = getCurrentDoc();

  const handleSaveDoc = async () => {
    if (!selectedFile || !editingDocType) return;

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
        const updateData = {
          ...docData,
          functional_spec: editingDocType === 'functional' ? docContent : (currentDoc.functional_spec || ''),
          technical_spec: editingDocType === 'technical' ? docContent : (currentDoc.technical_spec || ''),
          test_plan: editingDocType === 'test' ? docContent : (currentDoc.test_plan || ''),
          developer_request: editingDocType === 'developer_request' ? docContent : (currentDoc.developer_request || '')
        };
        await base44.entities.FeatureDocumentation.update(currentDoc.id, updateData);
        toast.success('מסמך עודכן בהצלחה');
      } else {
        const createData = {
          ...docData,
          functional_spec: editingDocType === 'functional' ? docContent : '',
          technical_spec: editingDocType === 'technical' ? docContent : '',
          test_plan: editingDocType === 'test' ? docContent : '',
          developer_request: editingDocType === 'developer_request' ? docContent : ''
        };
        await base44.entities.FeatureDocumentation.create(createData);
        toast.success('מסמך חדש נוצר');
      }

      setShowDocDialog(false);
      setEditingDocType(null);
      setDocContent('');
      await loadDocs();
    } catch (error) {
      console.error('[SystemDoc] Error saving doc:', error);
      toast.error('שגיאה בשמירת מסמך');
    }
  };

  const handleEditDoc = (docType) => {
    if (!currentDoc) {
      setDocContent('');
    } else {
      const fieldName = docType === 'developer_request' ? 'developer_request' : `${docType}_spec`;
      setDocContent(currentDoc[fieldName] || '');
    }
    setEditingDocType(docType);
    setShowDocDialog(true);
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
    if (!doc) return <Badge className="bg-gray-100 text-gray-600">ללא תיעוד</Badge>;
    const hasAll = doc.functional_spec && doc.technical_spec && doc.test_plan && doc.developer_request;
    const hasSome = doc.functional_spec || doc.technical_spec || doc.test_plan || doc.developer_request;
    if (hasAll) return <Badge className="bg-green-100 text-green-700"><Check className="h-3 w-3 ml-1" />מלא</Badge>;
    if (hasSome) return <Badge className="bg-amber-100 text-amber-700"><Clock className="h-3 w-3 ml-1" />חלקי</Badge>;
    return <Badge className="bg-gray-100 text-gray-600">ריק</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            מסמכי פיתוח ותיעוד
          </h1>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="explorer" className="flex items-center gap-1">
            <Folder className="h-4 w-4" />
            סייר מסמכים
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            הערות אישיות
          </TabsTrigger>
          <TabsTrigger value="specification" className="flex items-center gap-1">
            <Map className="h-4 w-4" />
            אפיון מערכת
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1">
            <History className="h-4 w-4" />
            היסטוריית פיתוח
          </TabsTrigger>
        </TabsList>

        {/* Explorer Tab */}
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Files List */}
            <Card className="h-[70vh]">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Folder className="h-5 w-5 text-amber-500" />
                  תקיות ומסמכים
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex flex-wrap border-b bg-gray-50 px-2 py-1 gap-1">
                  {Object.entries(featureStructure).map(([key, folder]) => {
                    const Icon = folder.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => { setSelectedFolder(key); setSelectedFile(null); }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-t-md transition-colors ${
                          selectedFolder === key ? 'bg-white border-t-2 border-blue-500 font-medium' : 'hover:bg-white/50'
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${folder.color}`} />
                        <span className="text-sm">{folder.shortName}</span>
                      </button>
                    );
                  })}
                </div>
                <ScrollArea className="h-[calc(70vh-120px)]">
                  <div className="p-2 space-y-1">
                    {filteredFiles.map((file) => {
                      const fileDoc = docs.find(d => d.feature_type === selectedFolder && d.feature_name === file.name);
                      const isSelected = selectedFile?.name === file.name;
                      return (
                        <button
                          key={file.name}
                          onClick={() => setSelectedFile(file)}
                          className={`w-full text-right px-3 py-2 rounded-md transition-colors ${
                            isSelected ? 'bg-blue-50 border-r-4 border-blue-500' : 'hover:bg-gray-50'
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
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Document Details */}
            <Card className="h-[70vh]">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileCode className="h-5 w-5 text-blue-500" />
                  {selectedFile ? selectedFile.displayName : 'בחר מסמך'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedFile ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <Folder className="h-16 w-16 mb-4" />
                    <p className="text-center">בחר מסמך מהרשימה</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[calc(70vh-120px)]">
                    <div className="space-y-3">
                      {['developer_request', 'functional', 'technical', 'test'].map((type) => {
                        const fieldName = type === 'developer_request' ? 'developer_request' : `${type}_spec`;
                        const hasContent = currentDoc?.[fieldName];
                        const titles = {
                          developer_request: 'בקשת המפתח',
                          functional: 'אפיון תפקודי',
                          technical: 'מסמך טכני',
                          test: 'מסמך בדיקות'
                        };
                        return (
                          <Card key={type} className="border-r-4 border-blue-400">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium">{titles[type]}</h4>
                                <div className="flex gap-1">
                                  {hasContent && (
                                    <Button variant="ghost" size="sm" onClick={() => { setDocContent(currentDoc[fieldName]); setEditingDocType(null); setShowDocDialog(true); }}>
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button variant="ghost" size="sm" onClick={() => handleEditDoc(type)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              {hasContent ? (
                                <p className="text-xs text-gray-600 line-clamp-2">{currentDoc[fieldName].substring(0, 100)}...</p>
                              ) : (
                                <p className="text-xs text-gray-400">לחץ על עריכה ליצירת מסמך</p>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Personal Notes Tab */}
        <TabsContent value="notes" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">הערות אישיות</h2>
            <Button onClick={() => { setEditingNote(null); setNewNoteTitle(''); setNewNoteContent(''); setShowNoteDialog(true); }}>
              <Plus className="h-4 w-4 ml-2" />
              הערה חדשה
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="p-8 text-center text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>אין הערות עדיין. לחץ על "הערה חדשה" להוספת הערה ראשונה.</p>
                </CardContent>
              </Card>
            ) : (
              notes.map(note => (
                <Card key={note.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span className="truncate">{note.title}</span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditNote(note)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteNote(note.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 line-clamp-4 whitespace-pre-wrap">{note.content}</p>
                    <p className="text-xs text-gray-400 mt-3">
                      {format(new Date(note.updatedAt), 'dd/MM/yyyy HH:mm', { locale: he })}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* System Specification Tab */}
        <TabsContent value="specification" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Map className="h-5 w-5" />
                  אפיון מערכת מפורט
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(systemSpecification)}>
                    <Copy className="h-4 w-4 ml-2" />
                    העתק
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => downloadAsMarkdown(systemSpecification, 'system-specification')}>
                    <FileDown className="h-4 w-4 ml-2" />
                    MD
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => downloadAsHTML(systemSpecification, 'system-specification')}>
                    <FileDown className="h-4 w-4 ml-2" />
                    HTML
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[60vh]">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">{systemSpecification}</pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Development History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  היסטוריית פיתוח
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(developmentHistory)}>
                    <Copy className="h-4 w-4 ml-2" />
                    העתק
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => downloadAsMarkdown(developmentHistory, 'development-history')}>
                    <FileDown className="h-4 w-4 ml-2" />
                    MD
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => downloadAsHTML(developmentHistory, 'development-history')}>
                    <FileDown className="h-4 w-4 ml-2" />
                    HTML
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[60vh]">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">{developmentHistory}</pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Document Edit/View Dialog */}
      <Dialog open={showDocDialog} onOpenChange={setShowDocDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh]" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingDocType ? 'עריכת מסמך' : 'צפייה במסמך'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {editingDocType ? (
              <Textarea
                value={docContent}
                onChange={(e) => setDocContent(e.target.value)}
                className="min-h-[400px] font-mono text-sm"
                placeholder="הזן תוכן מסמך..."
              />
            ) : (
              <ScrollArea className="h-[400px] border rounded-md p-4 bg-gray-50">
                <pre className="whitespace-pre-wrap text-sm">{docContent}</pre>
              </ScrollArea>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDocDialog(false); setEditingDocType(null); }}>
              {editingDocType ? 'ביטול' : 'סגור'}
            </Button>
            {editingDocType && (
              <Button onClick={handleSaveDoc}>
                <Save className="h-4 w-4 ml-2" />
                שמור
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Note Edit Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingNote ? 'עריכת הערה' : 'הערה חדשה'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>כותרת</Label>
              <Input
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                placeholder="כותרת ההערה..."
              />
            </div>
            <div>
              <Label>תוכן</Label>
              <Textarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                className="min-h-[200px]"
                placeholder="תוכן ההערה..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoteDialog(false)}>ביטול</Button>
            <Button onClick={editingNote ? handleUpdateNote : handleAddNote}>
              <Save className="h-4 w-4 ml-2" />
              {editingNote ? 'עדכן' : 'שמור'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
