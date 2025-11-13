import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Code, 
  Palette, 
  Shield, 
  Zap, 
  Workflow,
  Database,
  Settings,
  Lightbulb,
  ArrowLeft,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function BatchAndExpiryTechnicalSpec() {
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const CodeBlock = ({ children, title, language = "javascript" }) => (
    <div className="bg-gray-900 text-gray-100 rounded-lg overflow-hidden my-4">
      {title && (
        <div className="bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 border-b border-gray-700">
          <Code className="inline w-4 h-4 mr-2" />
          {title}
        </div>
      )}
      <ScrollArea className="h-96">
        <pre className="p-4 text-sm overflow-x-auto">
          <code className={`language-${language}`}>
            {children}
          </code>
        </pre>
      </ScrollArea>
    </div>
  );

  const Section = ({ id, title, icon: Icon, children, defaultExpanded = false }) => {
    const isExpanded = expandedSections[id] ?? defaultExpanded;
    
    return (
      <Card className="mb-6">
        <CardHeader 
          className="cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => toggleSection(id)}
        >
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center">
              <Icon className="w-5 h-5 mr-3 text-blue-600" />
              {title}
            </div>
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </CardTitle>
        </CardHeader>
        {isExpanded && (
          <CardContent className="pt-0">
            {children}
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(createPageUrl('Dashboard'))}
                className="mr-3"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">מפרט טכני: ניהול אצוות ופגי תוקף</h1>
                <p className="text-sm text-gray-600 mt-1">מסמך טכני מקיף לפיתוח ושיפור המסך</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              גרסה 2.0
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 gap-1">
            <TabsTrigger value="overview" className="text-xs">סקירה</TabsTrigger>
            <TabsTrigger value="architecture" className="text-xs">ארכיטקטורה</TabsTrigger>
            <TabsTrigger value="data" className="text-xs">נתונים</TabsTrigger>
            <TabsTrigger value="functionality" className="text-xs">פונקציות</TabsTrigger>
            <TabsTrigger value="design" className="text-xs">עיצוב</TabsTrigger>
            <TabsTrigger value="business" className="text-xs">לוגיקה</TabsTrigger>
            <TabsTrigger value="security" className="text-xs">אבטחה</TabsTrigger>
            <TabsTrigger value="future" className="text-xs">עתיד</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Section id="overview-purpose" title="מטרת המסך" icon={FileText} defaultExpanded={true}>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">יעדי המסך</h4>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li>• <strong>זיהוי מהיר</strong> של אצוות עם תפוגה קרובה (עד 14 יום)</li>
                    <li>• <strong>מעקב והיסטוריה</strong> של אצוות שכבר טופלו</li>
                    <li>• <strong>ניהול יעיל</strong> של פעולות טיפול (השמדה, שימוש אחר, צריכה)</li>
                    <li>• <strong>העלאה וניהול</strong> תעודות אנליזה (COA) לכל אצווה</li>
                    <li>• <strong>דוחות ויצוא</strong> נתונים למעקב ובקרה</li>
                    <li>• <strong>סינון וחיפוש</strong> מתקדם לאיתור מהיר של מידע</li>
                  </ul>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-2">משתמשי היעד</h4>
                    <ul className="space-y-1 text-sm text-green-800">
                      <li>• טכנאי מעבדה: מעקב יומיומי על תפוגות</li>
                      <li>• מנהל מלאי: תכנון והחלטות רכש</li>
                      <li>• מנהל איכות: ביקורת ואישור פעולות</li>
                      <li>• מנהל מערכת: תחזוקה ודוחות</li>
                    </ul>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-purple-900 mb-2">תכונות מרכזיות</h4>
                    <ul className="space-y-1 text-sm text-purple-800">
                      <li>• ממשק משתמש אינטואיטיבי</li>
                      <li>• עיבוד נתונים בזמן אמת</li>
                      <li>• תמיכה מלאה במובייל</li>
                      <li>• מנגנוני אבטחה מתקדמים</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Section>

            <Section id="overview-challenges" title="אתגרים טכניים" icon={Zap}>
              <div className="space-y-4">
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h4 className="font-semibold text-red-900 mb-2">אתגרים עיקריים</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-red-800">
                    <div>
                      <h5 className="font-medium mb-2">ביצועים</h5>
                      <ul className="space-y-1">
                        <li>• טעינת כמויות גדולות של נתונים</li>
                        <li>• חישובים מורכבים של תפוגות</li>
                        <li>• עדכונים בזמן אמת</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium mb-2">UX/UI</h5>
                      <ul className="space-y-1">
                        <li>• ממשק ברור ואינטואיטיבי</li>
                        <li>• רספונסיביות על מגוון מכשירים</li>
                        <li>• נגישות למשתמשים עם מוגבלויות</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <h4 className="font-semibold text-orange-900 mb-2">פתרונות מוצעים</h4>
                  <ul className="space-y-2 text-sm text-orange-800">
                    <li>• <strong>מנגנוני קאש מתקדמים</strong> - הפחתת זמני טעינה</li>
                    <li>• <strong>עיבוד בשרת</strong> - חישובים כבדים מועברים לשרת</li>
                    <li>• <strong>וירטואליזציה</strong> - רינדור יעיל של רשימות גדולות</li>
                    <li>• <strong>Progressive Web App</strong> - חוויית משתמש דומה לאפליקציה</li>
                  </ul>
                </div>
              </div>
            </Section>
          </TabsContent>

          <TabsContent value="architecture" className="space-y-6">
            <Section id="arch-stack" title="Stack Technology" icon={Settings} defaultExpanded={true}>
              <CodeBlock title="Technology Stack">
{`Frontend:
- React 18.x (Hooks, Context API)
- TypeScript 4.9+
- Tailwind CSS 3.x
- Shadcn/UI Components
- React Router DOM 6.x
- Date-fns (Date manipulation)
- Framer Motion (Animations)

Backend:
- Deno Runtime
- Base44 SDK
- PostgreSQL Database
- RESTful APIs
- File Storage (Supabase)

State Management:
- React Hooks (useState, useEffect, useCallback, useMemo)
- Custom Context Providers
- Real-time Updates`}
              </CodeBlock>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">ארכיטקטורת רכיבים</h4>
                <div className="text-sm font-mono bg-white p-4 rounded border">
                  <div className="space-y-1">
                    <div>BatchAndExpiryManagement/</div>
                    <div className="mr-2">├── pages/</div>
                    <div className="mr-4">│   └── BatchAndExpiryManagement.jsx</div>
                    <div className="mr-2">├── components/</div>
                    <div className="mr-4">│   ├── batch/</div>
                    <div className="mr-6">│   │   ├── BatchRow.jsx</div>
                    <div className="mr-6">│   │   ├── BatchFilters.jsx</div>
                    <div className="mr-6">│   │   ├── BatchActions.jsx</div>
                    <div className="mr-6">│   │   └── COAManager.jsx</div>
                    <div className="mr-4">│   ├── expiry/</div>
                    <div className="mr-6">│   │   ├── ExpiringBatchesView.jsx</div>
                    <div className="mr-6">│   │   ├── HandledBatchesView.jsx</div>
                    <div className="mr-6">│   │   └── AllBatchesView.jsx</div>
                    <div className="mr-4">│   └── ui/</div>
                    <div className="mr-6">│       ├── StatusBadge.jsx</div>
                    <div className="mr-6">│       ├── PriorityIndicator.jsx</div>
                    <div className="mr-6">│       └── ActionDialog.jsx</div>
                    <div className="mr-2">├── functions/</div>
                    <div className="mr-4">│   ├── getBatchAndExpiryData.js</div>
                    <div className="mr-4">│   ├── updateReagentInventory.js</div>
                    <div className="mr-4">│   └── exportBatchData.js</div>
                    <div className="mr-2">└── utils/</div>
                    <div className="mr-4">    ├── dateUtils.js</div>
                    <div className="mr-4">    ├── batchHelpers.js</div>
                    <div className="mr-4">    └── exportHelpers.js</div>
                  </div>
                </div>
              </div>
            </Section>

            <Section id="arch-patterns" title="Design Patterns" icon={Workflow}>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">פטרנים מרכזיים</h4>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li>• <strong>Container/Presentational Components</strong> - הפרדה בין לוגיקה לתצוגה</li>
                    <li>• <strong>Custom Hooks</strong> - לוגיקה משותפת וניתנת לשימוש חוזר</li>
                    <li>• <strong>Compound Components</strong> - רכיבים מורכבים עם API גמיש</li>
                    <li>• <strong>Observer Pattern</strong> - עדכונים בזמן אמת</li>
                    <li>• <strong>Strategy Pattern</strong> - אלגוריתמים גמישים לחישובים</li>
                  </ul>
                </div>

                <CodeBlock title="דוגמה: Custom Hook לניהול נתונים">
{`const useBatchData = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBatches = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getBatchAndExpiryData();
      setBatches(data.allBatches);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  return { batches, loading, error, refetch: fetchBatches };
};`}
                </CodeBlock>
              </div>
            </Section>
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <Section id="data-entities" title="מבני נתונים וישויות" icon={Database} defaultExpanded={true}>
              <div className="space-y-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-3">ישות ReagentBatch</h4>
                  <CodeBlock title="ReagentBatch Entity Structure">
{`interface ReagentBatch {
  id: string;
  catalog_item_id: string;           // Link to catalog
  reagent_id: string;                // Link to reagent
  reagent_name: string;              // Denormalized for performance
  supplier: string;                  // Denormalized from reagent
  category: string;                  // reagents|cells|controls|solutions|consumables
  
  // Batch identifiers
  batch_number: string;              // Unique batch identifier
  lot_number?: string;               // Alternative lot number
  serial_number?: string;            // Serial number if applicable
  
  // Dates
  manufacture_date?: Date;           // Manufacturing date
  expiry_date: Date;                 // Critical: expiry date
  received_date: Date;               // When received in lab
  
  // Quantities
  current_quantity: number;          // Current available quantity
  initial_quantity: number;          // Original received quantity
  reserved_quantity: number;         // Reserved for specific uses
  
  // Status and location
  status: 'incoming' | 'active' | 'expired' | 'consumed' | 'disposed';
  storage_location?: string;         // Physical location
  storage_conditions?: string;       // Storage requirements
  
  // COA Management
  coa_document_url?: string;         // Certificate of Analysis URL
  coa_upload_date?: Date;           // When COA was uploaded
  coa_uploaded_by?: string;         // Who uploaded COA
  
  // Audit fields
  created_date: Date;
  updated_date: Date;
  created_by: string;
}`}
                  </CodeBlock>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-3">ישות ExpiredProductLog</h4>
                  <CodeBlock title="ExpiredProductLog Entity Structure">
{`interface ExpiredProductLog {
  id: string;
  reagent_id: string;
  reagent_name_snapshot: string;     // Name at time of handling
  batch_number_snapshot: string;     // Batch number at time of handling
  original_expiry_date: Date;        // Original expiry date
  
  // Action taken
  action_taken: 'disposed' | 'other_use' | 'consumed_by_expiry';
  quantity_affected: number;         // How much was handled
  action_notes?: string;             // Additional notes
  
  // Documentation
  documented_date: Date;             // When action was documented
  documented_by_user_id: string;     // Who documented the action
  
  // COA reference (if batch had COA)
  coa_document_url?: string;
}`}
                  </CodeBlock>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-orange-900 mb-3">ממשקי UI State</h4>
                  <CodeBlock title="UI State Interfaces">
{`interface FilterState {
  supplier: string;                  // 'all' | supplier name
  category: string;                  // 'all' | category value
  searchTerm: string;                // Free text search
  showActiveOnly: boolean;           // Filter active batches only
  showConsumables: boolean;          // Include consumables
  showExpiredBatches: boolean;       // Show expired batches
  daysOffset: number;                // Days for expiry filter (7|14|30|60)
}

interface SortConfig {
  key: string;                       // Field to sort by
  direction: 'asc' | 'desc';        // Sort direction
}

interface TabState {
  activeTab: 'expiring' | 'handled' | 'all';
  expandedSections: {
    [key: string]: boolean;          // Which sections are expanded
  };
}`}
                  </CodeBlock>
                </div>
              </div>
            </Section>

            <Section id="data-flow" title="זרימת נתונים" icon={Workflow}>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">דיאגרמת זרימת נתונים</h4>
                <div className="space-y-4 text-sm">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Badge variant="outline">1</Badge>
                    <span>טעינה ראשונית: קריאה לפונקציית השרת <code>getBatchAndExpiryData</code></span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Badge variant="outline">2</Badge>
                    <span>עיבוד נתונים: חישוב סטטוס תפוגה וקטגוריזציה</span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Badge variant="outline">3</Badge>
                    <span>סינון וחיפוש: החלת מסנני המשתמש על הנתונים</span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Badge variant="outline">4</Badge>
                    <span>מיון: סידור הנתונים לפי העדפות המשתמש</span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Badge variant="outline">5</Badge>
                    <span>רינדור: הצגת הנתונים בממשק המשתמש</span>
                  </div>
                </div>
              </div>

              <CodeBlock title="Server Function: getBatchAndExpiryData">
{`async function getBatchAndExpiryData() {
  // Parallel data fetching for optimal performance
  const [batchesData, expiredLogsData, reagentData, supplierData] = await Promise.all([
    base44.entities.ReagentBatch.list(),
    base44.entities.ExpiredProductLog.list(),
    base44.entities.Reagent.list(),
    base44.entities.Supplier.filter({ is_active: true })
  ]);

  // Data enrichment and optimization
  const reagentMap = new Map(reagentData.map(r => [r.id, r]));
  
  // Enrich batches with reagent and supplier info
  const enrichedBatches = batchesData.map(batch => ({
    ...batch,
    reagent_name: reagentMap.get(batch.reagent_id)?.name || 'לא ידוע',
    supplier: reagentMap.get(batch.reagent_id)?.supplier || 'לא ידוע',
    category: reagentMap.get(batch.reagent_id)?.category || 'לא ידוע'
  }));

  return {
    allBatches: enrichedBatches,
    handledBatches: enrichedHandledLogs,
    allSuppliers: sortedSuppliers,
    reagentInfoCache: Object.fromEntries(reagentMap)
  };
}`}
              </CodeBlock>
            </Section>
          </TabsContent>

          <TabsContent value="functionality" className="space-y-6">
            <Section id="func-filtering" title="מנגנון סינון וחיפוש" icon={Settings} defaultExpanded={true}>
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <h4 className="font-semibold text-blue-900 mb-2">תכונות סינון מתקדמות</h4>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>• חיפוש טקסט חופשי (שם ריאגנט + מספר אצווה)</li>
                  <li>• סינון לפי ספק וקטגוריה</li>
                  <li>• סינון לפי סטטוס (פעיל/פג תוקף/מטופל)</li>
                  <li>• סינון לפי טווח ימים עד תפוגה</li>
                  <li>• אפשרות להסתרת מתכלים</li>
                </ul>
              </div>

              <CodeBlock title="Advanced Filtering Logic">
{`const getFilteredAndSortedData = useCallback((data, tab) => {
  let filteredData = data;

  // Text search (reagent name + batch number)
  if (filterSearchTerm) {
    const searchLower = filterSearchTerm.toLowerCase();
    filteredData = filteredData.filter(item => 
      item.reagent_name.toLowerCase().includes(searchLower) ||
      (item.batch_number || '').toLowerCase().includes(searchLower)
    );
  }

  // Supplier filter
  if (filterSupplier !== 'all') {
    filteredData = filteredData.filter(item => item.supplier === filterSupplier);
  }

  // Category filter
  if (filterCategory !== 'all') {
    filteredData = filteredData.filter(item => item.category === filterCategory);
  }

  // Tab-specific logic
  switch (tab) {
    case 'expiring':
      const today = new Date();
      const futureLimit = addDays(today, filterDays);
      filteredData = filteredData.filter(batch => {
        if (!batch.expiry_date || (batch.current_quantity || 0) <= 0) return false;
        const expiryDate = parseISO(batch.expiry_date);
        return isValid(expiryDate) && isBefore(expiryDate, futureLimit);
      });
      break;
      
    case 'all':
      if (filterActiveOnly) {
        filteredData = filteredData.filter(batch => batch.status === 'active');
      }
      if (!filterConsumables) {
        filteredData = filteredData.filter(batch => batch.category !== 'consumables');
      }
      if (!filterExpiredBatches) {
        const today = new Date();
        filteredData = filteredData.filter(batch => {
          if (!batch.expiry_date) return true;
          const expiryDate = parseISO(batch.expiry_date);
          return !isValid(expiryDate) || isAfter(expiryDate, today);
        });
      }
      break;
  }

  return getSortedBatches(filteredData);
}, [filterSupplier, filterCategory, filterSearchTerm, filterDays]);`}
              </CodeBlock>
            </Section>

            <Section id="func-actions" title="פעולות על אצוות" icon={Zap}>
              <div className="space-y-4">
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-red-900 mb-2">סוגי פעולות זמינות</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <h5 className="font-medium text-red-800 mb-1">השמדה (disposed)</h5>
                      <p className="text-red-700">פג תוקף ונדרש להשמיד לפי נהלים</p>
                    </div>
                    <div>
                      <h5 className="font-medium text-red-800 mb-1">שימוש אחר (other_use)</h5>
                      <p className="text-red-700">שימוש לצרכים אחרים (הדרכה, בדיקות)</p>
                    </div>
                    <div>
                      <h5 className="font-medium text-red-800 mb-1">צריכה (consumed_by_expiry)</h5>
                      <p className="text-red-700">נצרך לפני התפוגה בשימוש רגיל</p>
                    </div>
                  </div>
                </div>

                <CodeBlock title="Comprehensive Action Handler">
{`const handleExpiredItem = async (batch, actionTaken, quantityAffected, notes = '') => {
  setIsHandlingAction(true);
  
  try {
    const user = await User.me();
    const affectedQty = parseFloat(quantityAffected) || 0;
    const currentQty = parseFloat(batch.current_quantity) || 0;
    
    // Validation
    if (affectedQty <= 0 || affectedQty > currentQty) {
      throw new Error(\`כמות לא תקינה: \${affectedQty}. טווח מותר: 1-\${currentQty}\`);
    }

    // Create expiry log entry
    await ExpiredProductLog.create({
      reagent_id: batch.reagent_id,
      reagent_name_snapshot: batch.reagent_name,
      batch_number_snapshot: batch.batch_number,
      original_expiry_date: batch.expiry_date,
      action_taken: actionTaken,
      quantity_affected: affectedQty,
      action_notes: notes,
      documented_date: new Date().toISOString(),
      documented_by_user_id: user.id
    });

    // Update batch quantity and status
    const newQuantity = currentQty - affectedQty;
    const newStatus = newQuantity <= 0 
      ? (actionTaken === 'disposed' ? 'disposed' : 'consumed')
      : batch.status;

    await ReagentBatch.update(batch.id, {
      current_quantity: newQuantity,
      status: newStatus
    });

    // Create inventory transaction
    const transactionType = {
      'consumed_by_expiry': 'withdrawal',
      'disposed': 'disposal',
      'other_use': 'other_use_expired'
    }[actionTaken] || 'other_use_expired';

    await InventoryTransaction.create({
      reagent_id: batch.reagent_id,
      transaction_type: transactionType,
      quantity: -affectedQty,
      batch_number: batch.batch_number,
      expiry_date: batch.expiry_date,
      notes: \`טיפול בפג תוקף: \${getActionTakenLabel(actionTaken)} - \${notes}\`
    });

    // Update reagent summary data
    await updateReagentInventory({ reagentId: batch.reagent_id });

    // Success feedback
    toast({
      title: "הפעולה הושלמה בהצלחה",
      description: \`\${getActionTakenLabel(actionTaken)} - כמות: \${affectedQty}\`,
      variant: "success"
    });

    // Refresh data
    await fetchReportsData();
    
  } catch (error) {
    console.error('Error handling expired item:', error);
    toast({
      title: "שגיאה בביצוע הפעולה",
      description: error.message,
      variant: "destructive"
    });
  } finally {
    setIsHandlingAction(false);
  }
};`}
                </CodeBlock>
              </div>
            </Section>

            <Section id="func-coa" title="ניהול תעודות אנליזה (COA)" icon={FileText}>
              <div className="bg-purple-50 p-4 rounded-lg mb-4">
                <h4 className="font-semibold text-purple-900 mb-2">תכונות ניהול COA</h4>
                <ul className="space-y-1 text-sm text-purple-800">
                  <li>• העלאה של קבצי PDF, תמונות (PNG, JPG)</li>
                  <li>• צפייה מהירה בתעודות קיימות</li>
                  <li>• מעקב אחר מי והיכן העלה כל תעודה</li>
                  <li>• אינדיקטורים חזותיים לאצוות עם/בלי COA</li>
                  <li>• טיפול בכשלים והתגברות על בעיות העלאה</li>
                </ul>
              </div>

              <CodeBlock title="COA Upload and Management">
{`const handleCOAUpload = async (batch) => {
  setSelectedBatch(batch);
  setShowCOADialog(true);
};

const saveCOA = async () => {
  if (!coaFile || !selectedBatch) {
    toast({
      title: "שגיאה",
      description: "אנא בחר קובץ להעלאה.",
      variant: "default"
    });
    return;
  }

  setUploadingCOA(true);
  
  try {
    // Upload file to storage
    const uploadResult = await UploadFile({ file: coaFile });
    
    if (!uploadResult?.file_url) {
      throw new Error('שגיאה בהעלאת הקובץ');
    }

    // Get current user
    const currentUser = await User.me();

    // Update batch with COA information
    await ReagentBatch.update(selectedBatch.id, {
      coa_document_url: uploadResult.file_url,
      coa_upload_date: new Date().toISOString(),
      coa_uploaded_by: currentUser?.email || 'system'
    });

    toast({
      title: "הצלחה!",
      description: \`תעודת האנליזה עבור אצווה \${selectedBatch.batch_number} הועלתה בהצלחה.\`,
      variant: "success"
    });

    // Reset and refresh
    setShowCOADialog(false);
    setSelectedBatch(null);
    setCoaFile(null);
    await fetchReportsData();
    
  } catch (error) {
    toast({
      title: "שגיאה בהעלאת תעודת האנליזה",
      description: error.message || "אירעה שגיאה בהעלאת הקובץ.",
      variant: "destructive"
    });
  } finally {
    setUploadingCOA(false);
  }
};`}
              </CodeBlock>
            </Section>
          </TabsContent>

          <TabsContent value="design" className="space-y-6">
            <Section id="design-colors" title="מערכת צבעים ועיצוב" icon={Palette} defaultExpanded={true}>
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-red-50 to-yellow-50 p-4 rounded-lg border border-orange-200">
                  <h4 className="font-semibold text-orange-900 mb-3">פלטת צבעים לפי סטטוס</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="bg-red-100 p-3 rounded border border-red-200">
                      <div className="font-medium text-red-800">דחיפות קריטית</div>
                      <div className="text-red-600">#dc2626</div>
                      <div className="text-xs text-red-700 mt-1">פג תוקף / פגיעה היום</div>
                    </div>
                    <div className="bg-orange-100 p-3 rounded border border-orange-200">
                      <div className="font-medium text-orange-800">אזהרה</div>
                      <div className="text-orange-600">#d97706</div>
                      <div className="text-xs text-orange-700 mt-1">7 ימים עד תפוגה</div>
                    </div>
                    <div className="bg-yellow-100 p-3 rounded border border-yellow-200">
                      <div className="font-medium text-yellow-800">תשומת לב</div>
                      <div className="text-yellow-600">#eab308</div>
                      <div className="text-xs text-yellow-700 mt-1">14 ימים עד תפוגה</div>
                    </div>
                    <div className="bg-green-100 p-3 rounded border border-green-200">
                      <div className="font-medium text-green-800">מטופל</div>
                      <div className="text-green-600">#16a34a</div>
                      <div className="text-xs text-green-700 mt-1">פעולה הושלמה</div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-3">צבעי קטגוריות</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                    <div className="bg-indigo-100 p-2 rounded text-center border border-indigo-200">
                      <div className="font-medium text-indigo-800">ריאגנטים</div>
                      <div className="text-indigo-600">#6366f1</div>
                    </div>
                    <div className="bg-purple-100 p-2 rounded text-center border border-purple-200">
                      <div className="font-medium text-purple-800">כדוריות</div>
                      <div className="text-purple-600">#a855f7</div>
                    </div>
                    <div className="bg-pink-100 p-2 rounded text-center border border-pink-200">
                      <div className="font-medium text-pink-800">בקרות</div>
                      <div className="text-pink-600">#ec4899</div>
                    </div>
                    <div className="bg-emerald-100 p-2 rounded text-center border border-emerald-200">
                      <div className="font-medium text-emerald-800">תמיסות</div>
                      <div className="text-emerald-600">#10b981</div>
                    </div>
                    <div className="bg-amber-100 p-2 rounded text-center border border-amber-200">
                      <div className="font-medium text-amber-800">מתכלים</div>
                      <div className="text-amber-600">#f59e0b</div>
                    </div>
                  </div>
                </div>

                <CodeBlock title="CSS Variables וCSSComplex Styling">
{`:root {
  /* Status Colors */
  --urgent-bg: #fef2f2;        /* Light red background */
  --urgent-border: #fecaca;     /* Red border */
  --urgent-text: #dc2626;       /* Dark red text */
  
  --warning-bg: #fffbeb;        /* Light yellow background */
  --warning-border: #fde68a;    /* Yellow border */
  --warning-text: #d97706;      /* Orange text */
  
  --success-bg: #f0fdf4;        /* Light green background */
  --success-border: #bbf7d0;    /* Green border */
  --success-text: #16a34a;      /* Dark green text */
  
  /* Priority Colors */
  --priority-low: #3b82f6;      /* Blue */
  --priority-medium: #eab308;   /* Yellow */
  --priority-high: #f97316;     /* Orange */
  --priority-critical: #dc2626; /* Red */
  
  /* Category Colors */
  --cat-reagents: #6366f1;      /* Indigo */
  --cat-cells: #a855f7;         /* Purple */
  --cat-controls: #ec4899;      /* Pink */
  --cat-solutions: #10b981;     /* Emerald */
  --cat-consumables: #f59e0b;   /* Amber */
}

/* Component Styling Guidelines */
.batch-card {
  @apply bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300;
  border: 2px solid transparent;
}

.batch-card--urgent {
  @apply bg-gradient-to-br from-red-50 to-red-100 border-red-200;
}

.batch-card--warning {
  @apply bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200;
}

.status-badge {
  @apply px-3 py-1 rounded-full text-sm font-medium;
}

.action-button {
  @apply px-4 py-2 rounded-lg font-medium transition-all duration-200;
  @apply hover:shadow-md focus:ring-2 focus:ring-offset-2;
}`}
                </CodeBlock>
              </div>
            </Section>

            <Section id="design-responsive" title="עיצוב רספונסיבי ונגישות" icon={Settings}>
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">אסטרטגיית Mobile-First</h4>
                  <ul className="space-y-1 text-sm text-green-800">
                    <li>• עיצוב מותאם תחילה למסכים קטנים</li>
                    <li>• הרחבה הדרגתית לטבלטים ומסכי מחשב</li>
                    <li>• ממשק מגע ידידותי עם כפתורים גדולים</li>
                    <li>• תפריטים נפתחים במקום טבלאות על מובייל</li>
                  </ul>
                </div>

                <CodeBlock title="Responsive BatchRow Component">
{`function BatchRow({ batch, daysLeft, isUrgent, isWarning, onHandleExpired, onCOAUpload, onCOAView }) {
  return (
    <div className={\`p-3 border-b hover:bg-gray-50 \${bgColor} \${borderColor}\`}>
      {/* Mobile View - Stack Layout */}
      <div className="md:hidden space-y-3">
        <div className="flex justify-between items-start">
          <div className="font-medium text-gray-900 flex-1 min-w-0">
            <div className="truncate">{batch.reagent_name}</div>
            <div className="text-sm text-gray-500 truncate">{batch.supplier}</div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <COAButton batch={batch} onUpload={onCOAUpload} onView={onCOAView} />
            <Badge variant="outline" className="font-mono text-xs">
              {batch.current_quantity}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><strong>אצווה:</strong> {batch.batch_number}</div>
          <div><strong>תפוגה:</strong> {formatDate(batch.expiry_date)}</div>
        </div>
        
        <div className="flex justify-between items-center pt-2">
          <ExpiryBadge daysLeft={daysLeft} isUrgent={isUrgent} isWarning={isWarning} />
          <ActionButton batch={batch} onHandle={onHandleExpired} />
        </div>
      </div>

      {/* Desktop View - Grid Layout */}
      <div className="hidden md:grid md:grid-cols-9 gap-2 items-center">
        <div className="font-medium text-gray-900 truncate">{batch.reagent_name}</div>
        <div className="text-gray-600 truncate">{batch.supplier}</div>
        <div className="font-mono text-sm">{batch.batch_number}</div>
        <div className="font-mono text-sm">{formatDate(batch.expiry_date)}</div>
        <div className="flex justify-center">
          <ExpiryBadge daysLeft={daysLeft} isUrgent={isUrgent} isWarning={isWarning} />
        </div>
        <div className="text-center font-mono">{batch.current_quantity}</div>
        <div className="flex justify-center">
          <COAButton batch={batch} onUpload={onCOAUpload} onView={onCOAView} />
        </div>
        <div className="flex justify-center">
          <ActionButton batch={batch} onHandle={onHandleExpired} />
        </div>
      </div>
    </div>
  );
}`}
                </CodeBlock>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">תכונות נגישות</h4>
                  <ul className="space-y-1 text-sm text-blue-800">
                    <li>• תמיכה מלאה בקורא מסך (Screen Reader)</li>
                    <li>• ניווט מקלדת מלא עם Tab ו-Enter</li>
                    <li>• תוויות ARIA מפורטות לכל רכיב</li>
                    <li>• ניגודיות צבעים בהתאם לתקן WCAG 2.1</li>
                    <li>• גדלי גופן ברי התאמה</li>
                    <li>• קיצורי דרך במקלדת לפעולות נפוצות</li>
                  </ul>
                </div>
              </div>
            </Section>

            <Section id="design-animations" title="אנימציות והשפעות חזותיות" icon={Zap}>
              <div className="space-y-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-2">עקרונות אנימציה</h4>
                  <ul className="space-y-1 text-sm text-purple-800">
                    <li>• אנימציות דקות ומשמעותיות בלבד</li>
                    <li>• זמני מעבר קצרים (200-300ms)</li>
                    <li>• עקומות easing טבעיות</li>
                    <li>• מניעת אנימציות מפרגנות</li>
                    <li>• תמיכה ב-prefers-reduced-motion</li>
                  </ul>
                </div>

                <CodeBlock title="Framer Motion Animations">
{`import { motion, AnimatePresence } from 'framer-motion';

// List Item Animations
const BatchListItem = ({ batch, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ 
        duration: 0.3, 
        delay: index * 0.05,
        ease: "easeOut"
      }}
      whileHover={{ 
        scale: 1.02,
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)"
      }}
      className="batch-row"
    >
      {/* Batch content */}
    </motion.div>
  );
};

// Tab Transition Animations
const TabContent = ({ children, activeTab }) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Loading Skeleton Animation
const SkeletonLoader = () => {
  return (
    <motion.div
      animate={{
        opacity: [0.5, 1, 0.5]
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className="animate-pulse"
    >
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
    </motion.div>
  );
};`}
                </CodeBlock>
              </div>
            </Section>
          </TabsContent>

          <TabsContent value="business" className="space-y-6">
            <Section id="business-expiry" title="חישוב תפוגות וקטגוריזציה" icon={Settings} defaultExpanded={true}>
              <div className="space-y-4">
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-red-900 mb-2">רמות דחיפות</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h5 className="font-medium text-red-800 mb-2">קריטי</h5>
                      <ul className="space-y-1 text-red-700">
                        <li>• פג תוקף (ימים שליליים)</li>
                        <li>• פג היום (0 ימים)</li>
                        <li>• עד 3 ימים</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium text-red-800 mb-2">דחוף</h5>
                      <ul className="space-y-1 text-red-700">
                        <li>• 4-7 ימים עד תפוגה</li>
                        <li>• דורש תשומת לב מיידית</li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-3">
                    <h5 className="font-medium text-red-800 mb-2">אזהרה ותשומת לב</h5>
                    <ul className="space-y-1 text-red-700">
                      <li>• אזהרה: 8-14 ימים עד תפוגה</li>
                      <li>• תשומת לב: 15-30 ימים עד תפוגה</li>
                    </ul>
                  </div>
                </div>

                <CodeBlock title="Expiry Calculation Logic">
{`const calculateExpiryStatus = (expiryDate, currentQuantity) => {
  if (!expiryDate || !isValid(parseISO(expiryDate))) {
    return { status: 'unknown', daysLeft: null, priority: 'low' };
  }

  if ((currentQuantity || 0) <= 0) {
    return { status: 'handled', daysLeft: null, priority: 'none' };
  }

  const today = new Date();
  const expiry = parseISO(expiryDate);
  const daysLeft = differenceInDays(expiry, today);

  // Categorization logic
  let status, priority, urgencyLevel;
  
  if (daysLeft < 0) {
    status = 'expired';
    priority = 'critical';
    urgencyLevel = 'expired';
  } else if (daysLeft === 0) {
    status = 'expires_today';
    priority = 'critical';
    urgencyLevel = 'critical';
  } else if (daysLeft <= 3) {
    status = 'critical';
    priority = 'high';
    urgencyLevel = 'critical';
  } else if (daysLeft <= 7) {
    status = 'urgent';
    priority = 'high';
    urgencyLevel = 'urgent';
  } else if (daysLeft <= 14) {
    status = 'warning';
    priority = 'medium';
    urgencyLevel = 'warning';
  } else if (daysLeft <= 30) {
    status = 'attention';
    priority = 'low';
    urgencyLevel = 'attention';
  } else {
    status = 'normal';
    priority = 'none';
    urgencyLevel = 'normal';
  }

  return {
    status,
    daysLeft,
    priority,
    urgencyLevel,
    isUrgent: daysLeft <= 7,
    isWarning: daysLeft > 7 && daysLeft <= 14,
    needsAction: daysLeft <= 14
  };
};`}
                </CodeBlock>
              </div>
            </Section>

            <Section id="business-approval" title="מנגנון אישור ושליטה" icon={Shield}>
              <div className="bg-orange-50 p-4 rounded-lg mb-4">
                <h4 className="font-semibold text-orange-900 mb-2">רמות הרשאה</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium text-orange-800 mb-1">טכנאי</h5>
                    <ul className="space-y-1 text-orange-700">
                      <li>• השמדה: עד 10 יחידות</li>
                      <li>• שימוש אחר: עד 5 יחידות</li>
                      <li>• צריכה: ללא הגבלה</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-orange-800 mb-1">מפקח</h5>
                    <ul className="space-y-1 text-orange-700">
                      <li>• השמדה: עד 50 יחידות</li>
                      <li>• שימוש אחר: עד 20 יחידות</li>
                      <li>• אישור לטכנאים</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-orange-800 mb-1">מנהל</h5>
                    <ul className="space-y-1 text-orange-700">
                      <li>• כל הפעולות ללא הגבלה</li>
                      <li>• גישה לדוחות מתקדמים</li>
                      <li>• הגדרות מערכת</li>
                    </ul>
                  </div>
                </div>
              </div>

              <CodeBlock title="Multi-Level Approval System">
{`const getRequiredApprovalLevel = (action, quantity, batch) => {
  const rules = {
    'disposed': {
      low: { maxQuantity: 10, roles: ['technician'] },
      medium: { maxQuantity: 50, roles: ['supervisor'] },
      high: { maxQuantity: Infinity, roles: ['manager', 'admin'] }
    },
    'other_use': {
      low: { maxQuantity: 5, roles: ['technician'] },
      medium: { maxQuantity: 20, roles: ['supervisor'] },
      high: { maxQuantity: Infinity, roles: ['manager', 'admin'] }
    },
    'consumed_by_expiry': {
      low: { maxQuantity: Infinity, roles: ['technician'] }
    }
  };

  const actionRules = rules[action] || rules['disposed'];
  
  for (const [level, rule] of Object.entries(actionRules)) {
    if (quantity <= rule.maxQuantity) {
      return {
        level,
        requiredRoles: rule.roles,
        needsApproval: rule.roles.length > 0
      };
    }
  }

  return {
    level: 'high',
    requiredRoles: ['admin'],
    needsApproval: true
  };
};

const validateUserPermissions = async (user, requiredLevel) => {
  const userRoles = user.roles || [user.role];
  const approval = getRequiredApprovalLevel(action, quantity, batch);
  
  const hasPermission = approval.requiredRoles.some(role => 
    userRoles.includes(role)
  );

  if (!hasPermission) {
    throw new Error(\`פעולה זו דורשת הרשאת \${approval.requiredRoles.join(' או ')}\`);
  }

  return true;
};`}
              </CodeBlock>
            </Section>

            <Section id="business-audit" title="מנגנון ביקורת והיסטוריה" icon={FileText}>
              <div className="bg-green-50 p-4 rounded-lg mb-4">
                <h4 className="font-semibold text-green-900 mb-2">מעקב וביקורת</h4>
                <ul className="space-y-1 text-sm text-green-800">
                  <li>• רישום כל פעולה עם חותמת זמן ומשתמש</li>
                  <li>• שמירת מצב לפני ואחרי כל שינוי</li>
                  <li>• מעקב אחר העלאות COA וקבצים</li>
                  <li>• יכולת שחזור במקרה של בעיות</li>
                  <li>• דוחות ביקורת מפורטים</li>
                </ul>
              </div>

              <CodeBlock title="Audit Trail System">
{`const createAuditEntry = async (action, batch, user, details) => {
  const auditEntry = {
    entity_type: 'ReagentBatch',
    entity_id: batch.id,
    action_type: action,
    user_id: user.id,
    user_name: user.full_name,
    timestamp: new Date().toISOString(),
    
    // Before state
    state_before: {
      quantity: batch.current_quantity,
      status: batch.status,
      expiry_date: batch.expiry_date
    },
    
    // After state (will be updated after action)
    state_after: details.newState,
    
    // Action details
    action_details: {
      action_taken: details.action,
      quantity_affected: details.quantity,
      notes: details.notes,
      approval_level: details.approvalLevel
    },
    
    // Context information
    context: {
      reagent_name: batch.reagent_name,
      batch_number: batch.batch_number,
      supplier: batch.supplier,
      days_past_expiry: differenceInDays(new Date(), parseISO(batch.expiry_date))
    }
  };

  await AuditLog.create(auditEntry);
  return auditEntry;
};`}
              </CodeBlock>
            </Section>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Section id="security-validation" title="אימות וולידציה של נתונים" icon={Shield} defaultExpanded={true}>
              <div className="bg-red-50 p-4 rounded-lg mb-4">
                <h4 className="font-semibold text-red-900 mb-2">עקרונות אבטחה</h4>
                <ul className="space-y-1 text-sm text-red-800">
                  <li>• ולידציה כפולה: לקוח ושרת</li>
                  <li>• הצפנת נתונים רגישים</li>
                  <li>• הגנה מפני XSS ו-SQL Injection</li>
                  <li>• Rate limiting למניעת DoS</li>
                  <li>• מעקב ומניעת פעילות חשודה</li>
                </ul>
              </div>

              <CodeBlock title="Input Validation">
{`const validateBatchAction = (batch, action, quantity, user) => {
  const validations = [
    {
      test: () => batch && batch.id,
      error: 'אצווה לא תקינה'
    },
    {
      test: () => ['disposed', 'other_use', 'consumed_by_expiry'].includes(action),
      error: 'פעולה לא תקינה'
    },
    {
      test: () => !isNaN(quantity) && quantity > 0,
      error: 'כמות חייבת להיות מספר חיובי'
    },
    {
      test: () => quantity <= (batch.current_quantity || 0),
      error: \`כמות לא יכולה לעלות על הכמות הזמינה (\${batch.current_quantity})\`
    },
    {
      test: () => user && user.id,
      error: 'משתמש לא מאומת'
    },
    {
      test: () => {
        const approval = getRequiredApprovalLevel(action, quantity, batch);
        return validateUserPermissions(user, approval);
      },
      error: 'אין הרשאה לביצוע פעולה זו'
    }
  ];

  for (const validation of validations) {
    if (!validation.test()) {
      throw new Error(validation.error);
    }
  }

  return true;
};`}
              </CodeBlock>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">הגנה מפני התקפות</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium text-blue-800 mb-1">XSS Protection</h5>
                    <ul className="space-y-1 text-blue-700">
                      <li>• ניקוי כל קלטי המשתמש</li>
                      <li>• הסרת HTML tags מסוכנים</li>
                      <li>• בלוק קישורי javascript:</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-blue-800 mb-1">Rate Limiting</h5>
                    <ul className="space-y-1 text-blue-700">
                      <li>• הגבלת בקשות לפי משתמש</li>
                      <li>• חסימה זמנית במקרה יתר</li>
                      <li>• ניטור פעילות חשודה</li>
                    </ul>
                  </div>
                </div>
              </div>

              <CodeBlock title="XSS and Injection Protection">
{`const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: urls
    .replace(/on\\w+=/gi, '') // Remove event handlers
    .trim();
};

const sanitizeBatchData = (batch) => {
  return {
    ...batch,
    reagent_name: sanitizeInput(batch.reagent_name),
    batch_number: sanitizeInput(batch.batch_number),
    supplier: sanitizeInput(batch.supplier),
    notes: sanitizeInput(batch.notes)
  };
};

// Rate Limiting Hook
const useRateLimit = (maxRequests = 10, windowMs = 60000) => {
  const [requests, setRequests] = useState([]);
  
  const isAllowed = useCallback(() => {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Remove old requests
    const recentRequests = requests.filter(time => time > windowStart);
    
    if (recentRequests.length >= maxRequests) {
      return false;
    }
    
    // Add current request
    setRequests([...recentRequests, now]);
    return true;
  }, [requests, maxRequests, windowMs]);
  
  return { isAllowed };
};`}
              </CodeBlock>
            </Section>

            <Section id="security-encryption" title="הצפנה ואבטחת נתונים" icon={Settings}>
              <div className="bg-purple-50 p-4 rounded-lg mb-4">
                <h4 className="font-semibold text-purple-900 mb-2">נתונים רגישים</h4>
                <ul className="space-y-1 text-sm text-purple-800">
                  <li>• מספרי אצווה - חיוניים לזיהוי</li>
                  <li>• תוכן הערות - עלול להכיל מידע רפואי</li>
                  <li>• תעודות אנליזה - מסמכים רגישים</li>
                  <li>• פרטי משתמשים - מידע אישי</li>
                </ul>
              </div>

              <CodeBlock title="Sensitive Data Handling">
{`const handleSensitiveData = {
  // Hash sensitive identifiers
  hashBatchNumber: (batchNumber) => {
    return btoa(batchNumber).slice(0, 8);
  },
  
  // Encrypt notes if they contain sensitive info
  encryptNotes: async (notes) => {
    if (!notes || notes.length < 50) return notes;
    
    try {
      // Simple encryption for demo - use proper encryption in production
      return btoa(unescape(encodeURIComponent(notes)));
    } catch {
      return notes;
    }
  },
  
  // Audit log sanitization
  sanitizeAuditLog: (entry) => {
    return {
      ...entry,
      user_name: entry.user_name.replace(/(.{2}).*(.{2})/, '$1***$2'),
      notes: entry.notes ? '***' : null
    };
  }
};`}
              </CodeBlock>
            </Section>
          </TabsContent>

          <TabsContent value="future" className="space-y-6">
            <Section id="future-integrations" title="שילובים עם מערכות חיצוניות" icon={Settings} defaultExpanded={true}>
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <h4 className="font-semibold text-blue-900 mb-2">שילובים מתוכננים</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium text-blue-800 mb-1">מערכות מעבדה (LIS)</h5>
                    <ul className="space-y-1 text-blue-700">
                      <li>• סנכרון אוטומטי של נתוני אצוות</li>
                      <li>• משיכת נתוני שימוש בזמן אמת</li>
                      <li>• עדכון סטטוס בדיקות</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-blue-800 mb-1">מערכות ברקוד</h5>
                    <ul className="space-y-1 text-blue-700">
                      <li>• זיהוי אוטומטי של אצוות</li>
                      <li>• מעקב מיקום במעבדה</li>
                      <li>• הדפסת תוויות חכמות</li>
                    </ul>
                  </div>
                </div>
              </div>

              <CodeBlock title="LIS Integration">
{`const LISIntegration = {
  // Sync batch data with LIS
  syncBatchWithLIS: async (batch) => {
    try {
      const lisData = await fetch('/api/lis/batch', {
        method: 'POST',
        body: JSON.stringify({
          batch_number: batch.batch_number,
          reagent_code: batch.reagent_id,
          expiry_date: batch.expiry_date,
          quantity: batch.current_quantity
        })
      });
      
      return await lisData.json();
    } catch (error) {
      console.warn('LIS sync failed:', error);
      return null;
    }
  },
  
  // Get usage data from LIS
  getUsageFromLIS: async (batchId, dateRange) => {
    try {
      const response = await fetch(\`/api/lis/usage/\${batchId}?from=\${dateRange.from}&to=\${dateRange.to}\`);
      return await response.json();
    } catch (error) {
      console.warn('LIS usage fetch failed:', error);
      return [];
    }
  }
};`}
              </CodeBlock>
            </Section>

            <Section id="future-ai" title="אינטליגנציה מלאכותית ולמידת מכונה" icon={Lightbulb}>
              <div className="bg-green-50 p-4 rounded-lg mb-4">
                <h4 className="font-semibold text-green-900 mb-2">יכולות AI מתוכננות</h4>
                <ul className="space-y-1 text-sm text-green-800">
                  <li>• חיזוי טעויות שימוש על בסיס היסטוריה</li>
                  <li>• המלצות אוטומטיות לפעולות טיפול</li>
                  <li>• זיהוי דפוסים חריגים בצריכה</li>
                  <li>• אופטימיזציה אוטומטית של הזמנות</li>
                  <li>• ניבוי כמויות פחת עתידיות</li>
                </ul>
              </div>

              <CodeBlock title="Predictive Analytics">
{`const PredictiveAnalytics = {
  // Predict expiry handling needs
  predictExpiryLoad: async (timeframe = 30) => {
    const batches = await ReagentBatch.filter({
      status: 'active',
      expiry_date: { $lte: addDays(new Date(), timeframe) }
    });
    
    const predictions = batches.map(batch => {
      const historicalData = getHistoricalUsage(batch.reagent_id);
      const predictedUsage = calculatePredictedUsage(historicalData, timeframe);
      
      return {
        batch,
        predicted_consumption: predictedUsage,
        risk_of_expiry: predictedUsage < batch.current_quantity ? 'high' : 'low',
        recommended_action: predictedUsage < batch.current_quantity * 0.5 ? 'dispose_early' : 'monitor'
      };
    });
    
    return predictions;
  },
  
  // Smart categorization of handling actions
  suggestOptimalAction: (batch, historicalActions) => {
    const similar = historicalActions.filter(action => 
      action.reagent_category === batch.category &&
      Math.abs(action.days_past_expiry - getDaysPastExpiry(batch)) <= 7
    );
    
    if (similar.length === 0) return 'disposed'; // Default
    
    // Find most common action for similar cases
    const actionCounts = similar.reduce((counts, action) => {
      counts[action.action_taken] = (counts[action.action_taken] || 0) + 1;
      return counts;
    }, {});
    
    return Object.entries(actionCounts)
      .sort(([,a], [,b]) => b - a)[0][0];
  }
};`}
              </CodeBlock>
            </Section>

            <Section id="future-advanced" title="תכונות מתקדמות" icon={Zap}>
              <div className="space-y-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-2">ממשק משתמש מתקדם</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h5 className="font-medium text-purple-800 mb-1">פקדי קול</h5>
                      <ul className="space-y-1 text-purple-700">
                        <li>• "סנן פגי תוקף"</li>
                        <li>• "הצג הכל"</li>
                        <li>• "חפש אצווה"</li>
                        <li>• "רענן נתונים"</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium text-purple-800 mb-1">מחוות מגע</h5>
                      <ul className="space-y-1 text-purple-700">
                        <li>• סיבוב בין טאבים</li>
                        <li>• משיכה לרענון</li>
                        <li>• החלקה לפעולות מהירות</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <CodeBlock title="Voice Commands Implementation">
{`const VoiceInterface = {
  initialize: () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported');
      return null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'he-IL';
    
    return recognition;
  },
  
  startListening: (onResult) => {
    const recognition = VoiceInterface.initialize();
    if (!recognition) return;
    
    recognition.onresult = (event) => {
      const command = event.results[0][0].transcript.toLowerCase();
      const action = parseVoiceCommand(command);
      onResult(action);
    };
    
    recognition.start();
  }
};

const parseVoiceCommand = (command) => {
  const commands = {
    'סנן פגי תוקף': () => setActiveTab('expiring'),
    'הצג הכל': () => setActiveTab('all'),
    'חפש אצווה': () => document.getElementById('search-input')?.focus(),
    'רענן נתונים': () => handleRefresh()
  };
  
  for (const [phrase, action] of Object.entries(commands)) {
    if (command.includes(phrase)) {
      return action;
    }
  }
  
  return null;
};`}
                </CodeBlock>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-orange-900 mb-2">Progressive Web App (PWA)</h4>
                  <ul className="space-y-1 text-sm text-orange-800">
                    <li>• התקנה כאפליקציה על המכשיר</li>
                    <li>• עבודה במצב אופליין חלקי</li>
                    <li>• התראות Push עבור תפוגות קריטיות</li>
                    <li>• סנכרון אוטומטי כשהחיבור חוזר</li>
                    <li>• מטמון חכם של נתונים קריטיים</li>
                  </ul>
                </div>
              </div>
            </Section>
          </TabsContent>
        </Tabs>

        <div className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
          <div className="flex items-center mb-4">
            <Lightbulb className="w-6 h-6 text-blue-600 mr-3" />
            <h3 className="text-xl font-bold text-blue-900">סיכום טכני</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">נקודות חוזק עיקריות</h4>
              <ul className="space-y-1 text-blue-800">
                <li>• ארכיטקטורה מודולרית: מבנה קוד ברור וניתן לתחזוקה</li>
                <li>• ביצועים מותאמים: מנגנוני קאש וטעינה אופטימליים</li>
                <li>• עיצוב רספונסיבי: תמיכה מלאה במגוון מכשירים</li>
                <li>• אבטחה מתקדמת: הגנה מפני התקפות ושמירה על פרטיות</li>
                <li>• נגישות מקיפה: תמיכה במשתמשים עם מוגבלויות</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">אזורי שיפור מומלצים</h4>
              <ul className="space-y-1 text-blue-800">
                <li>• מעבר לארכיטקטורת מיקרו-שירותים עבור פונקציונליות מורכבת</li>
                <li>• הוספת בדיקות אוטומטיות מקיפות (Unit, Integration, E2E)</li>
                <li>• שילוב מנגנוני Machine Learning לחיזוי ואופטימיזציה</li>
                <li>• הטמעת Progressive Web App (PWA) לחוויית משתמש משופרת</li>
                <li>• פיתוח API מתקדם עבור שילובים עם מערכות חיצוניות</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-100 rounded-lg">
            <p className="text-blue-900 text-sm">
              <strong>מטרת המסמך:</strong> המסך מיועד להיות הבסיס לניהול יעיל ומקצועי של אצוות ריאגנטים, 
              תוך מתן מענה לכל הצרכים הנוכחיים והעתידיים של מערכת ניהול המלאי של בנק הדם.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}