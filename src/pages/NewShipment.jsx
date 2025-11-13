
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Search,
  ArrowLeft,
  Trash2,
  Save,
  Send,
  Package,
  AlertTriangle,
  Loader2,
  Calendar,
  User as UserIcon,
  Building
} from 'lucide-react';
import { format, parseISO, isValid, isBefore, addDays } from 'date-fns';
import { he } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";
import { createPageUrl } from '@/utils';
import { formatQuantity } from "@/components/utils/formatters";
import PrintDialog from '@/components/ui/PrintDialog'; // Corrected import path, was relative '../'

import { Shipment } from '@/api/entities';
import { ShipmentItem } from '@/api/entities';
import { Reagent } from '@/api/entities';
import { ReagentBatch } from '@/api/entities';
import { InventoryTransaction } from '@/api/entities';
import { User } from '@/api/entities';
import { Supplier } from '@/api/entities';
import { updateReagentInventory } from '@/api/functions';

export default function NewShipmentPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Component State
  const [user, setUser] = useState(null);
  const [shipmentDetails, setShipmentDetails] = useState({
    shipment_number: '', // Will be generated on save
    recipient_name: "",
    recipient_type: "external",
    contact_person: "",
    shipment_type: "standard_outbound",
    shipment_date: format(new Date(), 'yyyy-MM-dd'),
    notes: "",
    requires_cold_storage: false,
    requires_special_handling: false,
    special_instructions: "",
    linked_delivery_id: "", // For return_to_supplier
    linked_order_id: "",    // For return_to_supplier
  });

  const [items, setItems] = useState([]);
  const [reagents, setReagents] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [saving, setSaving] = useState(false);

  // Centralized batch management
  const [allActiveBatches, setAllActiveBatches] = useState([]);
  const [batchesByReagent, setBatchesByReagent] = useState({}); // This will store filtered batches per reagent for quick lookup
  const [loadingInitialData, setLoadingInitialData] = useState(true);

  // Dialog related states
  const [showReagentDialog, setShowReagentDialog] = useState(false);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [reagentSearchTerm, setReagentSearchTerm] = useState('');
  const [editingItemIndex, setEditingItemIndex] = useState(null); // Index of the item currently being edited via dialog

  // Add print dialog state
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [newShipmentId, setNewShipmentId] = useState(null);

  // New recipient types - added 'supplier'
  const recipientTypes = {
    "internal": "גוף פנימי",
    "external": "גוף חיצוני",
    "supplier": "ספק",
    "other": "אחר"
  };

  const conditionOptions = {
    "excellent": "מצוין",
    "good": "טוב",
    "fair": "בינוני",
    "poor": "לא טוב"
  };

  // Effect to fetch all necessary data on component mount
  const fetchInitialData = useCallback(async () => {
    setLoadingInitialData(true);
    try {
      const [userData, reagentsData, activeBatchesData, suppliersData] = await Promise.all([
        User.me(),
        Reagent.filter({ total_quantity_all_batches: { $gt: 0 } }), // Filtered reagents
        ReagentBatch.filter({ status: 'active', current_quantity: { $gt: 0 } }),
        Supplier.list() // Fetch all suppliers
      ]);
        
      setUser(userData);
        
      const sortedReagents = (reagentsData || []).sort((a, b) => {
        if (a.name && b.name) return a.name.localeCompare(b.name);
        return 0;
      });
      setReagents(sortedReagents);
        
      setAllActiveBatches(activeBatchesData || []);

      const sortedSuppliers = (suppliersData || []).sort((a, b) => 
        (a.display_name || a.name).localeCompare(b.display_name || b.name, 'he')
      );
      setSuppliers(sortedSuppliers);

    } catch (error) {
      toast({ title: "שגיאה קריטית בטעינת נתונים", description: error.message || "אירעה שגיאה בטעינת נתונים ראשוניים.", variant: "destructive" });
    } finally {
      setLoadingInitialData(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleShipmentDetailChange = (e) => {
    const { name, value } = e.target;
    setShipmentDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setShipmentDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name, checked) => {
    setShipmentDetails(prev => ({ ...prev, [name]: checked }));
  };

  // Restore original, correct handleItemChange logic
  const handleItemChange = useCallback((index, field, value) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      const currentItem = { ...newItems[index] };

      if (field === 'reagent_id') {
        const reagentId = value;
        const batchesForReagent = allActiveBatches.filter(b => b.reagent_id === reagentId);
        
        const sortedBatches = batchesForReagent.sort((a, b) => {
          if (!a.expiry_date) return 1;
          if (!b.expiry_date) return -1;
          return parseISO(a.expiry_date).getTime() - parseISO(b.expiry_date).getTime();
        });

        setBatchesByReagent(prev => ({ ...prev, [reagentId]: sortedBatches }));
        
        currentItem.reagent_id = value;
        currentItem.reagent_batch_id = "";
        currentItem.batch_number = "";
        currentItem.expiry_date = "";
        currentItem.quantity_sent = "";
        currentItem.quantity_available_before = 0; // This will be dynamic based on selectedBatch
        currentItem.storage_requirements = "";
        currentItem.reagent_name_snapshot = reagents.find(r => r.id === value)?.name || '';

      } else if (field === 'reagent_batch_id' && value) {
        currentItem.reagent_batch_id = value;
        const selectedBatch = batchesByReagent[currentItem.reagent_id]?.find(b => b.id === value);
        if (selectedBatch) {
          currentItem.batch_number = selectedBatch.batch_number;
          currentItem.expiry_date = selectedBatch.expiry_date;
          currentItem.quantity_available_before = selectedBatch.current_quantity; // Update to selected batch's quantity
          currentItem.storage_requirements = selectedBatch.storage_location || '';

          const currentQuantitySent = parseFloat(currentItem.quantity_sent);
          if (currentQuantitySent && currentQuantitySent > selectedBatch.current_quantity) {
            currentItem.quantity_sent = selectedBatch.current_quantity.toString();
            toast({
              title: "הכמות עודכנה",
              description: `הכמות המבוקשת גבוהה מהמלאי באצווה. עודכן לכמות המקסימלית: ${formatQuantity(selectedBatch.current_quantity)}.`,
              variant: "default"
            });
          }
        } else {
            currentItem.reagent_batch_id = "";
            currentItem.batch_number = "";
            currentItem.expiry_date = "";
            currentItem.quantity_sent = "";
            currentItem.quantity_available_before = 0;
            currentItem.storage_requirements = "";
        }
      } else if (field === 'quantity_sent') {
        const quantity = parseFloat(value);
        // Recalculate available quantity from the actual selected batch (if any) for current validation
        const selectedBatch = allActiveBatches.find(b => b.id === currentItem.reagent_batch_id);
        const availableQuantity = selectedBatch?.current_quantity || 0;

        if (value === "") {
            currentItem[field] = "";
        } else if (isNaN(quantity)) {
            currentItem[field] = value;
            toast({ title: "קלט לא חוקי", description: "יש להזין מספר בכמות הנשלחת.", variant: "destructive" });
        } else if (quantity < 0) {
            currentItem[field] = "0"; 
            toast({ title: "כמות שלילית", description: "הכמות לשליחה חייבת להיות חיובית.", variant: "destructive" });
        } else if (quantity > availableQuantity) {
            toast({
                title: "כמות חורגת מהמלאי",
                description: `לא ניתן לשלוח יותר מ-${formatQuantity(availableQuantity)} יחידות מאצווה זו.`,
                variant: "destructive"
            });
            currentItem[field] = availableQuantity.toString();
        } else {
            currentItem[field] = value;
        }
      } else {
        currentItem[field] = value;
      }

      newItems[index] = currentItem;
      return newItems;
    });
  }, [allActiveBatches, batchesByReagent, reagents, toast]);

  const addItem = () => {
    setItems(prevItems => [
      ...prevItems,
      {
        ui_id: Date.now() + Math.random(), // Unique ID for UI keying
        reagent_id: "",
        reagent_batch_id: "",
        reagent_name_snapshot: "",
        batch_number: "",
        expiry_date: "",
        quantity_sent: "",
        quantity_available_before: 0, // This will be populated from selected batch
        storage_requirements: "", // Will be populated on batch selection
        notes: "",
        condition_on_shipment: "excellent",
        return_expected: false,
        return_expected_date: "",
        emergency_use: false
      }
    ]);
  };

  const removeItem = (ui_id) => {
    setItems(prevItems => prevItems.filter(item => item.ui_id !== ui_id));
  };

  const generateShipmentDocument = async (shipmentData, itemsData) => {
    try {
      const fileName = `תעודת_משלוח_${shipmentData.shipment_number}_${format(new Date(), "dd_MM_yyyy")}.csv`;

      // Helper function to escape CSV field
      const escapeCsvField = (field) => {
        if (field === null || field === undefined) {
          return '""';
        }
        const stringField = String(field);
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n') || stringField.includes('\r')) {
          return `"${stringField.replace(/"/g, '""')}"`;
        }
        return `"${stringField}"`;
      };

      console.log("Generating shipment document with", itemsData.length, "items");

      let csvContent = "\uFEFF"; // UTF-8 BOM
      let rows = [];

      // Header section
      const titleRow = Array(6).fill("");
      titleRow[2] = escapeCsvField("תעודת משלוח - בנק דם");
      rows.push(titleRow.join(","));
      rows.push(""); // Empty line

      // Document details
      rows.push([
        escapeCsvField("מספר משלוח:"),
        escapeCsvField(shipmentData.shipment_number || 'ל.צ.'),
        "",
        escapeCsvField("תאריך שליחה:"),
        escapeCsvField(shipmentData.shipment_date ? format(parseISO(shipmentData.shipment_date), "dd/MM/yyyy") : "ל.צ."),
        ""
      ].join(","));

      rows.push([
        escapeCsvField("נמען:"),
        escapeCsvField(shipmentData.recipient_name || 'ל.צ.'),
        "",
        escapeCsvField("סוג נמען:"),
        escapeCsvField(recipientTypes[shipmentData.recipient_type] || shipmentData.recipient_type || 'ל.צ.'),
        ""
      ].join(","));

      if (shipmentData.contact_person) {
        rows.push([
          escapeCsvField("איש קשר:"),
          escapeCsvField(shipmentData.contact_person),
          "",
          "",
          "",
          ""
        ].join(","));
      }

      // Add shipment type specific details to the document
      rows.push(""); // Empty line
      rows.push([
        escapeCsvField("סוג משלוח:"),
        escapeCsvField(
          shipmentData.shipment_type === 'standard_outbound' ? 'שליחה רגילה' :
            shipmentData.shipment_type === 'return_to_supplier' ? 'החזרה לספק' :
              shipmentData.shipment_type === 'transfer_out' ? 'העברה חיצונית' :
                shipmentData.shipment_type || 'לא צוין'
        ),
        "", "", "", ""
      ].join(","));

      if (shipmentData.shipment_type === "return_to_supplier") {
        if (shipmentData.linked_delivery_id) {
          rows.push([
            escapeCsvField("מספר תעודת משלוח נכנס מקורי:"),
            escapeCsvField(shipmentData.linked_delivery_id),
            "", "", "", ""
          ].join(","));
        }
        if (shipmentData.linked_order_id) {
          rows.push([
            escapeCsvField("מספר הזמנה מקורית:"),
            escapeCsvField(shipmentData.linked_order_id),
            "", "", "", ""
          ].join(","));
        }
      }
      rows.push(""); // Empty line

      // Special requirements
      if (shipmentData.requires_cold_storage || shipmentData.requires_special_handling) {
        rows.push([
          escapeCsvField("דרישות מיוחדות:"),
          "",
          "",
          "",
          "",
          ""
        ].join(","));

        if (shipmentData.requires_cold_storage) {
          rows.push([
            "",
            escapeCsvField("✓ נדרש שמירה בקור"),
            "",
            "",
            "",
            ""
          ].join(","));
        }

        if (shipmentData.requires_special_handling) {
          rows.push([
            "",
            escapeCsvField("✓ נדרש טיפול מיוחד"),
            "",
            "",
            "",
            ""
          ].join(","));
          if (shipmentData.special_instructions) {
            const instructionsLines = shipmentData.special_instructions.split('\n');
            instructionsLines.forEach(line => {
              rows.push([
                "",
                escapeCsvField(`  - ${line}`), // Indent special instructions
                "",
                "",
                "",
                ""
              ].join(","));
            });
          }
        }
        rows.push(""); // Empty line
      }

      // Items table header
      rows.push([
        escapeCsvField("מס'"),
        escapeCsvField("שם הפריט"),
        escapeCsvField("מס' אצווה"),
        escapeCsvField("תאריך תפוגה"),
        escapeCsvField("כמות נשלחת"),
        escapeCsvField("הערות")
      ].join(","));

      // Items data
      itemsData.forEach((item, index) => {
        let expiryDateString = "";
        if (item.expiry_date) {
          try {
            const parsedDate = parseISO(item.expiry_date);
            if (isValid(parsedDate)) {
              expiryDateString = format(parsedDate, "dd/MM/yyyy");
            }
          } catch (dateError) {
            console.error("Error parsing date", item.expiry_date, dateError);
          }
        }

        rows.push([
          escapeCsvField(index + 1),
          escapeCsvField(item.reagent_name_snapshot || ""),
          escapeCsvField(item.batch_number || ""),
          escapeCsvField(expiryDateString),
          escapeCsvField(formatQuantity(item.quantity_sent) || "0"), // Use formatQuantity here
          escapeCsvField(item.notes || "")
        ].join(","));
      });

      rows.push(""); // Empty line

      // Summary
      const totalItems = itemsData.length;
      const totalQuantity = itemsData.reduce((sum, item) => sum + (parseFloat(item.quantity_sent) || 0), 0);

      rows.push([
        escapeCsvField("סיכום:"),
        escapeCsvField(`${totalItems} פריטים`),
        "",
        escapeCsvField("כמות כוללת:"),
        escapeCsvField(formatQuantity(totalQuantity)), // Use formatQuantity here
        ""
      ].join(","));

      rows.push(""); // Empty line

      // Notes
      if (shipmentData.notes) {
        rows.push([
          escapeCsvField("הערות כלליות:"),
          "",
          "",
          "",
          "",
          ""
        ].join(","));

        const notesLines = shipmentData.notes.split('\n');
        notesLines.forEach(line => {
          rows.push([
            "",
            escapeCsvField(line),
            "",
            "",
            "",
            ""
          ].join(","));
        });
        rows.push(""); // Empty line
      }

      // Signature section
      rows.push([
        escapeCsvField("חתימות ואישורים:"),
        "",
        "",
        "",
        "",
        ""
      ].join(","));
      rows.push(""); // Empty line

      const signatureFields = [
        "נשלח על ידי - שם:",
        "נשלח על ידי - חתימה:",
        "תאריך ושעת שליחה:",
        "",
        "התקבל על ידי - שם:",
        "התקבל על ידי - חתימה:",
        "תאריך ושעת קבלה:"
      ];

      signatureFields.forEach(field => {
        const sigRow = Array(6).fill("");
        sigRow[0] = escapeCsvField(field);
        rows.push(sigRow.join(","));
      });

      rows.push(""); // Empty line

      // Document generation info
      rows.push([
        escapeCsvField(`תעודה זו הופקה על ידי: ${user?.full_name || 'משתמש לא ידוע'}`),
        "",
        "",
        "",
        "",
        ""
      ].join(","));

      rows.push([
        escapeCsvField(`בתאריך: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: he })}`),
        "",
        "",
        "",
        "",
        ""
      ].join(","));

      const csvString = rows.join("\n");
      console.log(`Shipment document generated with ${totalItems} items`);

      const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent + csvString);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return { success: true, fileName: fileName };
    } catch (error) {
      console.error("Error generating shipment document:", error);
      toast({
        title: "שגיאה בהפקת תעודת משלוח",
        description: error.message || "אירעה שגיאה לא ידועה.",
        variant: "destructive",
        duration: 7000
      });
      return { success: false, error: error.message };
    }
  };

  const handleSaveShipment = async (generateCsv = false) => {
    // Defensive check to ensure entities are loaded
    if (!Shipment || !ShipmentItem || !ReagentBatch || !InventoryTransaction || !user) {
      toast({
        title: "שגיאת מערכת",
        description: "אחת מישויות המפתח או פרטי המשתמש לא נטענו כראוי. נסה לרענן את הדף.",
        variant: "destructive"
      });
      return;
    }

    // Validation checks
    if (!shipmentDetails.recipient_name || shipmentDetails.recipient_name.trim() === "") {
      toast({ title: "שדות חסרים", description: "יש למלא את שם הנמען.", variant: "destructive" });
      return;
    }
    if (!shipmentDetails.shipment_date || shipmentDetails.shipment_date.trim() === "") {
      toast({ title: "שדות חסרים", description: "יש למלא את תאריך השליחה.", variant: "destructive" });
      return;
    }
    const shipmentDate = parseISO(shipmentDetails.shipment_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isBefore(shipmentDate, today)) {
      toast({
        title: "תאריך שליחה לא תקין",
        description: "תאריך השליחה לא יכול להיות בעבר.",
        variant: "destructive"
      });
      return false;
    }

    if (items.length === 0) {
      toast({ title: "אין פריטים", description: "יש להוסיף לפחות פריט אחד למשלוח.", variant: "destructive" });
      return;
    }

    for (const item of items) {
      if (!item.reagent_id || !item.reagent_batch_id || !item.quantity_sent || parseFloat(item.quantity_sent) <= 0) {
        toast({ title: "פרטי פריט חסרים", description: `יש למלא ריאגנט, אצווה וכמות (גדולה מ-0) עבור פריט: ${item.reagent_name_snapshot || 'לא נבחר'}`, variant: "destructive" });
        return;
      }
      // Re-fetch the selected batch from the current state for accurate quantity check at save time
      const selectedBatch = batchesByReagent[item.reagent_id]?.find(b => b.id === item.reagent_batch_id);
      if (!selectedBatch || parseFloat(item.quantity_sent) > selectedBatch.current_quantity) {
        toast({ title: "כמות חורגת מהמלאי", description: `הכמות עבור ${item.reagent_name_snapshot || 'פריט'} (אצווה ${item.batch_number}) חורגת מהזמין באצווה (${formatQuantity(selectedBatch?.current_quantity || 0)}).`, variant: "destructive" });
        return;
      }
    }

    setSaving(true);
    try {
      // 1. Create Shipment
      const shipmentNumber = `SHIP-${format(new Date(), 'yyyyMMdd-HHmmss')}`;
      const newShipment = await Shipment.create({
        ...shipmentDetails,
        shipment_number: shipmentNumber,
        status: 'sent',
        total_items_sent: items.length,
        created_by: user.email,
        updated_by: user.email,
      });

      const affectedReagentIds = new Set();
      const savedItems = []; // To pass to document generation

      // 2. Create ShipmentItems and update inventory
      for (const item of items) {
        const selectedReagent = reagents.find(r => r.id === item.reagent_id);
        // Ensure we're using the latest batch data for consistency
        const selectedBatch = allActiveBatches.find(b => b.id === item.reagent_batch_id);
        const quantitySent = parseFloat(item.quantity_sent);

        const savedItem = await ShipmentItem.create({
          shipment_id: newShipment.id,
          reagent_id: item.reagent_id,
          reagent_batch_id: item.reagent_batch_id,
          reagent_name_snapshot: selectedReagent.name,
          batch_number: selectedBatch.batch_number,
          expiry_date: selectedBatch.expiry_date,
          quantity_sent: quantitySent,
          quantity_available_before: selectedBatch.current_quantity, // Snapshot the quantity before withdrawal
          storage_requirements: selectedBatch.storage_location || '', // Use batch's storage location
          notes: item.notes,
          condition_on_shipment: item.condition_on_shipment,
          return_expected: item.return_expected,
          return_expected_date: item.return_expected_date || null,
          emergency_use: item.emergency_use
        });
        savedItems.push(savedItem);

        // Update batch quantity
        const newBatchQuantity = selectedBatch.current_quantity - quantitySent;
        await ReagentBatch.update(item.reagent_batch_id, {
          current_quantity: Math.max(0, newBatchQuantity),
          status: newBatchQuantity <= 0 ? 'consumed' : 'active' // Set status to consumed if quantity is 0 or less
        });

        // Create inventory transaction log
        await InventoryTransaction.create({
          reagent_id: item.reagent_id,
          transaction_type: 'shipment_out',
          quantity: -quantitySent, // Negative for withdrawal
          batch_number: selectedBatch.batch_number,
          expiry_date: selectedBatch.expiry_date,
          document_number: newShipment.shipment_number,
          notes: `שליחה ל-${newShipment.recipient_name} (סוג נמען: ${recipientTypes[newShipment.recipient_type] || ''}).`
        });

        affectedReagentIds.add(item.reagent_id);
      }

      // 3. Update summary fields for all affected reagents
      for (const reagentId of affectedReagentIds) {
        try {
          await updateReagentInventory({ reagentId });
        } catch (summaryError) {
          console.error(`Failed to update summary for reagent ${reagentId}:`, summaryError);
          toast({
            title: `אזהרה בעדכון מלאי כללי`,
            description: `לא ניתן היה לעדכן את סיכום המלאי עבור ריאגנט ${reagentId}.`,
            variant: "destructive"
          });
        }
      }

      toast({
        title: "המשלוח נשמר בהצלחה!",
        description: `מספר משלוח: ${newShipment.shipment_number}`,
        variant: "default"
      });

      // Set state to open the print dialog
      setNewShipmentId(newShipment.id);
      setShowPrintDialog(true);

      // If requested, also generate the CSV document
      if (generateCsv) {
        const docResult = await generateShipmentDocument(newShipment, savedItems);
        if (docResult.success) {
          toast({
            title: "תעודת משלוח הופקה גם כקובץ",
            description: `התעודה "${docResult.fileName}" נשמרה בתיקיית ההורדות.`,
            variant: "default",
            duration: 4000
          });
        }
      }

      // Navigation will now happen via the PrintDialog's onClose handler
    } catch (error) {
      console.error("Error saving shipment:", error);
      toast({ title: "שגיאה בשמירת המשלוח", description: error.message || "אירעה שגיאה לא ידועה.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Handler for when the PrintDialog is closed
  const handlePrintDialogClose = () => {
    setShowPrintDialog(false);
    setNewShipmentId(null);
    navigate(createPageUrl('OutgoingShipments')); // Navigate to outgoing shipments page
  };

  const openReagentDialog = (index) => {
    setEditingItemIndex(index);
    setShowReagentDialog(true);
    setReagentSearchTerm(''); // Clear search on open
  };

  const openBatchDialog = (index) => {
    const currentItem = items[index];
    if (!currentItem || !currentItem.reagent_id) {
      toast({
        title: "בחר ריאגנט קודם",
        description: "יש לבחור ריאגנט לפני בחירת האצווה",
        variant: "default"
      });
      return;
    }
    setEditingItemIndex(index);
    // Ensure batches for the selected reagent are in batchesByReagent, if not already
    // (Though handleItemChange for reagent_id should have already done this)
    if (!batchesByReagent[currentItem.reagent_id]) {
      const batchesForReagent = allActiveBatches.filter(b => b.reagent_id === currentItem.reagent_id);
      const sortedBatches = batchesForReagent.sort((a, b) => {
        if (!a.expiry_date) return 1;
        if (!b.expiry_date) return -1;
        return parseISO(a.expiry_date).getTime() - parseISO(b.expiry_date).getTime();
      });
      setBatchesByReagent(prev => ({ ...prev, [currentItem.reagent_id]: sortedBatches }));
    }
    setShowBatchDialog(true);
  };

  const handleReagentSelectForDialog = (reagent) => {
    if (editingItemIndex === null) return;
    handleItemChange(editingItemIndex, 'reagent_id', reagent.id);
    setShowReagentDialog(false);
    // Automatically open batch dialog after reagent selection
    // Use a small timeout to allow state update to propagate
    setTimeout(() => openBatchDialog(editingItemIndex), 100);
  };

  const handleBatchSelectForDialog = (batch) => {
    if (editingItemIndex === null) return;
    handleItemChange(editingItemIndex, 'reagent_batch_id', batch.id);
    setShowBatchDialog(false);
  };

  const filteredReagents = useMemo(() => {
    const searchTermLower = reagentSearchTerm.toLowerCase();
    return reagents.filter(reagent => {
      // Check if the reagent has any active batches with quantity > 0
      const hasAvailableBatches = allActiveBatches.some(batch => 
        batch.reagent_id === reagent.id && batch.status === 'active' && batch.current_quantity > 0
      );
      if (!hasAvailableBatches) return false; // Only show reagents with available inventory

      return !reagentSearchTerm ||
        (reagent.name && reagent.name.toLowerCase().includes(searchTermLower)) ||
        (reagent.item_number && reagent.item_number.toString().includes(searchTermLower));
    });
  }, [reagentSearchTerm, reagents, allActiveBatches]);

  if (loadingInitialData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        <span className="sr-only">טוען...</span>
      </div>
    );
  }

  // Component for an individual shipment item row
  const ShipmentItemRow = ({ item, index, onUpdate, onRemove, openReagentDialog, openBatchDialog, reagents, batchesByReagent, conditionOptions, loadingInitialData }) => {
    const selectedReagent = reagents.find(r => r.id === item.reagent_id);
    const batchesForThisReagent = batchesByReagent[item.reagent_id] || [];
    const selectedBatch = batchesForThisReagent.find(b => b.id === item.reagent_batch_id);

    return (
        <div key={item.ui_id} className="grid grid-cols-1 md:grid-cols-12 gap-4 border-b pb-4">
            <div className="md:col-span-12 flex justify-between items-center mb-2">
                <h4 className="font-semibold text-lg">פריט #{index + 1}</h4>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(item.ui_id)}
                    className="text-red-500 hover:bg-red-100"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
            
            <div className="md:col-span-3">
                <Label>ריאגנט *</Label>
                <Button
                    variant="outline"
                    className="w-full justify-start text-right"
                    onClick={() => openReagentDialog(index)}
                    disabled={loadingInitialData}
                >
                    {loadingInitialData ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : item.reagent_name_snapshot || "בחר ריאגנט..."}
                </Button>
            </div>
            <div className="md:col-span-3">
                <Label>אצווה *</Label>
                <Button
                    variant="outline"
                    className="w-full justify-start text-right"
                    onClick={() => openBatchDialog(index)}
                    disabled={!item.reagent_id || loadingInitialData}
                >
                    {loadingInitialData && item.reagent_id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : item.batch_number || "בחר אצווה..."}
                </Button>
            </div>
            <div className="md:col-span-3">
                <Label>כמות זמינה באצווה</Label>
                <div className="text-sm font-mono text-center p-2 bg-gray-50 rounded">
                    {selectedBatch ? formatQuantity(selectedBatch.current_quantity) : '0'}
                </div>
            </div>

            <div className="md:col-span-3">
                <Label htmlFor={`quantity-${index}`}>כמות לשליחה *</Label>
                <Input
                    id={`quantity-${index}`}
                    type="number"
                    step="any"
                    min="0"
                    max={selectedBatch?.current_quantity || 0}
                    value={item.quantity_sent || ''}
                    onChange={(e) => onUpdate(index, 'quantity_sent', e.target.value)}
                    className="text-center"
                    placeholder="0"
                    disabled={!item.reagent_batch_id}
                />
            </div>
            
            {/* Other item fields, ensuring they also fit the grid, or are outside this specific grid section */}
            <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <Label>מצב הפריט</Label>
                <Select
                  value={item.condition_on_shipment}
                  onValueChange={(value) => onUpdate(index, 'condition_on_shipment', value)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(conditionOptions).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id={`return_expected_${item.ui_id}`}
                  checked={item.return_expected}
                  onCheckedChange={(checked) => onUpdate(index, 'return_expected', checked)}
                />
                <Label htmlFor={`return_expected_${item.ui_id}`}>צפויה החזרה</Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id={`emergency_use_${item.ui_id}`}
                  checked={item.emergency_use}
                  onCheckedChange={(checked) => onUpdate(index, 'emergency_use', checked)}
                />
                <Label htmlFor={`emergency_use_${item.ui_id}`}>שימוש חירום</Label>
              </div>
            </div>

            {item.return_expected && (
              <div className="md:col-span-12 mt-4">
                <Label>תאריך החזרה צפוי</Label>
                <Input
                  type="date"
                  value={item.return_expected_date}
                  onChange={(e) => onUpdate(index, 'return_expected_date', e.target.value)}
                />
              </div>
            )}

            <div className="md:col-span-12 mt-4">
              <Label>הערות לפריט</Label>
              <Textarea
                value={item.notes}
                onChange={(e) => onUpdate(index, 'notes', e.target.value)}
                placeholder="הערות מיוחדות לפריט זה..."
                className="h-16"
              />
            </div>
        </div>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => navigate(createPageUrl('OutgoingShipments'))}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">שליחת ריאגנטים</h1>
        </div>
      </div>

      <div className="max-w-full mx-auto">
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="details">פרטי המשלוח</TabsTrigger>
            <TabsTrigger value="items">פריטים למשלוח ({items.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  פרטי משלוח יוצא
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">

                {/* Shipment Type Selection */}
                <div>
                  <Label className="text-base font-medium">סוג המשלוח</Label>
                  <Select
                    value={shipmentDetails.shipment_type}
                    onValueChange={(value) => handleSelectChange('shipment_type', value)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="בחר סוג משלוח" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard_outbound">שליחה רגילה</SelectItem>
                      <SelectItem value="return_to_supplier">החזרה לספק</SelectItem>
                      <SelectItem value="transfer_out">העברה חיצונית</SelectItem>
                    </SelectContent>
                  </Select>
                  {shipmentDetails.shipment_type === "return_to_supplier" && (
                    <p className="text-sm text-gray-600 mt-1">
                      החזרת פריטים פגומים או לא מתאימים לספק
                    </p>
                  )}
                </div>

                <Separator />

                {/* Basic Shipment Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>מספר משלוח</Label>
                    <Input value={shipmentDetails.shipment_number || 'ייווצר אוטומטית'} disabled />
                  </div>
                  <div>
                    <Label htmlFor="shipment_date" className="text-right">תאריך שליחה *</Label>
                    <Input
                      id="shipment_date"
                      type="date"
                      name="shipment_date"
                      value={shipmentDetails.shipment_date}
                      onChange={handleShipmentDetailChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Recipient Name/Supplier Selection */}
                  {shipmentDetails.shipment_type === 'return_to_supplier' ? (
                    <div>
                      <Label htmlFor="recipient_name" className="text-right">בחר ספק *</Label>
                      <Select
                        value={shipmentDetails.recipient_name}
                        onValueChange={(value) => {
                          handleSelectChange('recipient_name', value);
                          // Automatically set recipient_type to 'supplier' when selecting a supplier
                          handleSelectChange('recipient_type', 'supplier');
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="בחר ספק להחזרה..." />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.map(s => (
                            <SelectItem key={s.id} value={s.name}>{s.display_name || s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="recipient_name" className="text-right">שם הנמען *</Label>
                      <Input
                        id="recipient_name"
                        name="recipient_name"
                        value={shipmentDetails.recipient_name}
                        onChange={handleShipmentDetailChange}
                        placeholder="הזן שם הנמען..."
                        required
                      />
                    </div>
                  )}
                  {/* Recipient Type - only for non-supplier returns */}
                  {shipmentDetails.shipment_type !== 'return_to_supplier' && (
                    <div>
                      <Label htmlFor="recipient_type" className="text-right">סוג נמען</Label>
                      <Select
                        value={shipmentDetails.recipient_type}
                        onValueChange={(value) => handleSelectChange('recipient_type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="בחר סוג נמען" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(recipientTypes).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="contact_person" className="text-right">פרטי איש קשר</Label>
                  <Input
                    id="contact_person"
                    name="contact_person"
                    value={shipmentDetails.contact_person}
                    onChange={handleShipmentDetailChange}
                    placeholder="שם, טלפון, אימייל או פרטי קשר אחרים..."
                  />
                </div>

                {/* Conditional Fields Based on Shipment Type */}
                {shipmentDetails.shipment_type === "return_to_supplier" && (
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">פרטי החזרה לספק</h3>
                    <div className="space-y-3">
                      <div>
                        <Label>משלוח נכנס מקושר (אופציונלי)</Label>
                        <Input
                          placeholder="מספר תעודת משלוח נכנס מקורי"
                          name="linked_delivery_id"
                          value={shipmentDetails.linked_delivery_id}
                          onChange={handleShipmentDetailChange}
                        />
                      </div>
                      <div>
                        <Label>הזמנה מקושרת (אופציונלי)</Label>
                        <Input
                          placeholder="מספר הזמנה או דרישה מקורית"
                          name="linked_order_id"
                          value={shipmentDetails.linked_order_id}
                          onChange={handleShipmentDetailChange}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Special Requirements Section */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                      id="requires_cold_storage"
                      checked={shipmentDetails.requires_cold_storage}
                      onCheckedChange={(checked) => handleCheckboxChange('requires_cold_storage', checked)}
                    />
                    <Label htmlFor="requires_cold_storage" className="text-right">נדרש שמירה בקור</Label>
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                      id="requires_special_handling"
                      checked={shipmentDetails.requires_special_handling}
                      onCheckedChange={(checked) => handleCheckboxChange('requires_special_handling', checked)}
                    />
                    <Label htmlFor="requires_special_handling" className="text-right">נדרש טיפול מיוחד</Label>
                  </div>

                  {shipmentDetails.requires_special_handling && (
                    <div>
                      <Label htmlFor="special_instructions" className="text-right">הוראות מיוחדות לטיפול או הובלה</Label>
                      <Textarea
                        id="special_instructions"
                        name="special_instructions"
                        value={shipmentDetails.special_instructions}
                        onChange={handleShipmentDetailChange}
                        placeholder="תאר את ההוראות המיוחדות..."
                        rows={3}
                      />
                    </div>
                  )}
                </div>

                {/* Notes Section */}
                <div>
                  <Label htmlFor="notes" className="text-right">הערות</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={shipmentDetails.notes}
                    onChange={handleShipmentDetailChange}
                    placeholder="הערות כלליות למשלוח, הוראות מיוחדות וכו'..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="items" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>פריטים למשלוח ({items.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    לא נוספו פריטים למשלוח
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item, index) => (
                      <ShipmentItemRow
                        key={item.ui_id}
                        item={item}
                        index={index}
                        onUpdate={handleItemChange}
                        onRemove={removeItem}
                        openReagentDialog={openReagentDialog}
                        openBatchDialog={openBatchDialog}
                        reagents={reagents}
                        batchesByReagent={batchesByReagent}
                        conditionOptions={conditionOptions}
                        loadingInitialData={loadingInitialData}
                      />
                    ))}
                  </div>
                )}
                <div className="flex justify-end mt-4">
                  <Button onClick={addItem} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" /> הוסף פריט חדש
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => navigate(createPageUrl('OutgoingShipments'))}>
            ביטול
          </Button>
          <Button
            onClick={() => handleSaveShipment(false)}
            disabled={saving || items.length === 0 || !shipmentDetails.recipient_name.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            שליחה
          </Button>
          <Button
            onClick={() => handleSaveShipment(true)}
            disabled={saving || items.length === 0 || !shipmentDetails.recipient_name.trim()}
            className="bg-green-600 hover:bg-green-700"
          >
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            שליחה והפק תעודה
          </Button>
        </div>
      </div>

      {/* Reagent Selection Dialog */}
      <Dialog open={showReagentDialog} onOpenChange={setShowReagentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>בחירת ריאגנט לשליחה</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>חיפוש ריאגנט</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="הקלד שם ריאגנט או מק״ט..."
                  value={reagentSearchTerm}
                  onChange={(e) => setReagentSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <ScrollArea className="h-[400px] border rounded-md p-4">
              {loadingInitialData ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : filteredReagents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  לא נמצאו ריאגנטים התואמים לחיפוש או עם מלאי זמין.
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredReagents.map(reagent => (
                    <div
                      key={reagent.id}
                      className="p-3 hover:bg-blue-50 cursor-pointer rounded-md border"
                      onClick={() => handleReagentSelectForDialog(reagent)}
                    >
                      <div className="font-medium">{reagent.name}</div>
                      <div className="text-sm text-gray-600">
                        מק״ט: {reagent.item_number || 'לא ידוע'} | ספק: {reagent.supplier}
                      </div>
                      {/* These totals are expected to be available on the reagent object */}
                      <div className="text-sm text-green-600">
                        זמין: {formatQuantity(reagent.total_quantity_all_batches) || 0} יחידות ב-{reagent.active_batches_count || 0} אצוות
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReagentDialog(false)}>
              סגור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Selection Dialog */}
      <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              בחירת אצווה - {items[editingItemIndex]?.reagent_name_snapshot || 'טוען...'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {loadingInitialData ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : (batchesByReagent[items[editingItemIndex]?.reagent_id]?.length || 0) === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  לא נמצאו אצוות זמינות לריאגנט זה. ייתכן שהמלאי אזל.
                </AlertDescription>
              </Alert>
            ) : (
              <ScrollArea className="h-[400px] border rounded-md p-4">
                <div className="space-y-2">
                  {batchesByReagent[items[editingItemIndex]?.reagent_id]?.map(batch => {
                    const isExpiringSoon = batch.expiry_date &&
                      isBefore(parseISO(batch.expiry_date), addDays(new Date(), 90)); // Soon = 90 days

                    return (
                      <div
                        key={batch.id}
                        className={`p-3 hover:bg-blue-50 cursor-pointer rounded-md border ${
                          isExpiringSoon ? 'border-orange-300 bg-orange-50' : ''
                        }`}
                        onClick={() => handleBatchSelectForDialog(batch)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium">אצווה: {batch.batch_number}</div>
                            <div className="text-sm text-gray-600">
                              תפוגה: {batch.expiry_date ? format(parseISO(batch.expiry_date), 'dd/MM/yyyy') : 'לא ידוע'}
                            </div>
                            <div className="text-sm text-green-600">
                              זמין: {formatQuantity(batch.current_quantity)} יחידות
                            </div>
                            {batch.storage_location && (
                              <div className="text-xs text-gray-500">
                                מיקום: {batch.storage_location}
                              </div>
                            )}
                          </div>
                          {isExpiringSoon && (
                            <Badge className="bg-orange-100 text-orange-800">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              פג תוקף בקרוב
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}

            <div className="text-xs text-gray-500 p-3 bg-blue-50 rounded">
              💡 <strong>טיפ:</strong> האצוות מסודרות לפי תאריך תפוגה (FEFO) - מומלץ לבחור את האצווה הראשונה שפג תוקפה הכי מוקדם.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBatchDialog(false)}>
              סגור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Print Dialog */}
      <PrintDialog
        isOpen={showPrintDialog}
        onClose={handlePrintDialogClose}
        documentId={newShipmentId}
        documentType="shipment"
        title="תעודת משלוח יוצא חדשה"
      />
    </div>
  );
}
