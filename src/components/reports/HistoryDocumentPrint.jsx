
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Printer, Download, Loader2, AlertTriangle, FileText } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { he } from "date-fns/locale";
import { User } from '@/api/entities';
import { OrderItem } from '@/api/entities';
import { DeliveryItem } from '@/api/entities';
import { WithdrawalItem } from '@/api/entities';
import { ShipmentItem } from '@/api/entities';

const drawTable = (doc, headers, data, startY, colPositions) => {
    let y = startY;
    const rowHeight = 8;
    const textMargin = 1; // Small margin for text within its column width

    // Draw headers
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold'); // Set font to bold for headers
    headers.forEach((header, i) => {
        doc.text(header, colPositions[i], y);
    });
    y += 2; // Space before the line
    doc.setLineWidth(0.3); // Line thickness
    // Draw line under headers. The line should extend across the entire table width.
    // Adjusted to extend 25 units right of the last column's start position.
    const tableRightEdge = colPositions[colPositions.length - 1] + 25;
    doc.line(colPositions[0], y, tableRightEdge, y);
    y += rowHeight - 2; // Advance y for first data row, subtracting space taken by line

    // Draw data rows
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal'); // Reset font to normal for data
    data.forEach(row => {
        // Check for page break
        if (y + rowHeight > 280) { // 280 is an arbitrary lower margin, adjust as needed
            doc.addPage();
            y = 20; // Reset y for new page, giving some top margin
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            headers.forEach((header, i) => {
                doc.text(header, colPositions[i], y);
            });
            y += 2;
            doc.setLineWidth(0.3);
            doc.line(colPositions[0], y, tableRightEdge, y);
            y += rowHeight - 2;
            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');
        }
        row.forEach((cell, i) => {
            // Add a small text margin for better readability
            doc.text(String(cell), colPositions[i] + textMargin, y);
        });
        y += rowHeight;
    });
    return y; // Return the final y position after drawing the table
};


export default function HistoryDocumentPrint({
  document,
  documentType, // 'delivery', 'shipment', 'order', 'inventory_count', 'withdrawal'
  items = [],
  children
}) {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);

  // This component will now only be used for non-order documents from history
  if (documentType === 'order') {
    return null; // Or some fallback if needed, but for now we remove it
  }

  const getDocumentTitle = () => {
    switch (documentType) {
      case 'delivery': return 'תעודת קליטת משלוח';
      case 'shipment': return 'תעודת שליחת ריאגנטים';
      case 'order': return 'מסמך רכש/הזמנה';
      case 'inventory_count': return 'דוח ספירת מלאי';
      case 'withdrawal': return 'מסמך משיכת ריאגנטים'; // Added withdrawal document type
      default: return 'מסמך';
    }
  };

  const getDocumentNumber = () => {
    switch (documentType) {
      case 'delivery': return document.delivery_number || document.id;
      case 'shipment': return document.shipment_number || document.id;
      case 'order': return document.order_number_temp || document.order_number_permanent || document.id;
      case 'inventory_count': return format(parseISO(document.count_date), 'dd/MM/yyyy');
      case 'withdrawal': return document.withdrawal_request_id || document.id; // Added withdrawal document type
      default: return document.id;
    }
  };

  const getDocumentDate = () => {
    switch (documentType) {
      case 'delivery': return document.delivery_date;
      case 'shipment': return document.shipment_date;
      case 'order': return document.order_date;
      case 'inventory_count': return document.count_date;
      case 'withdrawal': return document.request_date || document.created_date; // Added withdrawal document type
      default: return document.created_date;
    }
  };

  // CRITICAL FIX: Check if we're in a proper browser environment
  const isFullBrowserEnvironment = () => {
    try {
      return !!(
        typeof window !== 'undefined' &&
        typeof document !== 'undefined' &&
        typeof document.createElement === 'function' &&
        typeof Blob !== 'undefined' &&
        window.URL &&
        typeof window.URL.createObjectURL === 'function'
      );
    } catch (e) {
      return false;
    }
  };

  const generateCSVContent = async () => {
    // Get current user for print tracking
    let currentUser = null;
    try {
      currentUser = await User.me();
    } catch (userError) {
      console.warn("Could not fetch user for document printing:", userError);
      currentUser = { full_name: 'משתמש לא ידוע' };
    }

    // פונקציית עזר לעיצוב שדה CSV
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

    let csvContent = "\uFEFF"; // UTF-8 BOM
    let rows = [];

    // Header section
    const titleRow = Array(6).fill("");
    titleRow[2] = escapeCsvField(`${getDocumentTitle()} - מההיסטוריה`);
    rows.push(titleRow.join(","));
    rows.push(""); // Empty line

    // Document identification
    rows.push([
      escapeCsvField("מספר מסמך:"),
      escapeCsvField(getDocumentNumber()),
      "",
      escapeCsvField("תאריך מקורי:"),
      escapeCsvField(getDocumentDate() ? format(parseISO(getDocumentDate()), "dd/MM/yyyy") : "לא ידוע"),
      ""
    ].join(","));

    // Original creation info
    if (document.created_by || document.created_date) {
      rows.push([
        escapeCsvField("נוצר על ידי:"),
        escapeCsvField(document.created_by_name || "לא ידוע"),
        "",
        escapeCsvField("תאריך יצירה:"),
        escapeCsvField(document.created_date ? format(parseISO(document.created_date), "dd/MM/yyyy HH:mm") : "לא ידוע"),
        ""
      ].join(","));
    }

    // Print from history info
    rows.push([
      escapeCsvField("הודפס מההיסטוריה על ידי:"),
      escapeCsvField(currentUser?.full_name || 'משתמש לא ידוע'),
      "",
      escapeCsvField("תאריך הדפסה:"),
      escapeCsvField(format(new Date(), "dd/MM/yyyy בשעה HH:mm", { locale: he })),
      ""
    ].join(","));

    rows.push(""); // Empty line

    // Document-specific details
    if (documentType === 'delivery') {
      await generateDeliveryContent(rows, document, items, escapeCsvField);
    } else if (documentType === 'shipment') {
      await generateShipmentContent(rows, document, items, escapeCsvField);
    } else if (documentType === 'order') {
      // This branch will likely not be hit due to the early return, but kept for completeness based on original code structure
      await generateOrderContent(rows, document, items, escapeCsvField);
    } else if (documentType === 'inventory_count') {
      await generateInventoryCountContent(rows, document, escapeCsvField);
    } else if (documentType === 'withdrawal') {
      await generateWithdrawalContent(rows, document, items, escapeCsvField); // Added withdrawal CSV generation
    }
    // Note: 'withdrawal' currently does not have a dedicated CSV generation function within this component

    // Footer with authenticity note
    rows.push(""); // Empty line
    rows.push([
      escapeCsvField("הערה חשובה:"),
      "",
      "",
      "",
      "",
      ""
    ].join(","));
    rows.push([
      "",
      escapeCsvField("זהו עותק מההיסטוריה. המסמך המקורי נוצר בתאריך שצוין לעיל."),
      "",
      "",
      "",
      ""
    ].join(","));
    rows.push([
      "",
      escapeCsvField("הדפסה זו בוצעה לצרכי תיעוד ומעקב."),
      "",
      "",
      "",
      ""
    ].join(","));

    return csvContent + rows.join("\n");
  };

  const generateHistoryDocument = async () => {
    if (!document) {
      toast({
        title: "אין מסמך להדפסה",
        description: "לא נמצא מסמך להדפסה",
        variant: "destructive"
      });
      return;
    }

    setGenerating(true);
    try {
      // CRITICAL FIX: Handle different environments properly
      if (!isFullBrowserEnvironment()) {
        // Preview/development mode fallback
        const csvContent = await generateCSVContent();

        // Try to copy to clipboard as fallback
        if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
          try {
            await navigator.clipboard.writeText(csvContent);
            toast({
              title: "תוכן המסמך הועתק ללוח",
              description: "בסביבת הפיתוח, התוכן הועתק ללוח. בסביבת הייצור יורד כקובץ.",
              variant: "default"
            });
            return;
          } catch (clipboardError) {
            console.warn("Clipboard failed:", clipboardError);
          }
        }

        // Show content in alert as last resort
        console.log("CSV Content:", csvContent);
        toast({
          title: "מצב פיתוח",
          description: "בסביבת הפיתוח, תוכן הקובץ מוצג ב-console. בסביבת הייצור יורד כקובץ.",
          variant: "default"
        });
        return;
      }

      const fileName = `${getDocumentTitle()}_${getDocumentNumber()}_הדפסה_${format(new Date(), "dd_MM_yyyy_HH_mm")}.csv`;

      const csvContent = await generateCSVContent();

      // Full browser download
      try {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up
        setTimeout(() => {
          try {
            window.URL.revokeObjectURL(url);
          } catch (e) {
            console.warn("Could not revoke object URL:", e);
          }
        }, 100);

        toast({
          title: "מסמך היסטורי הופק בהצלחה",
          description: `הקובץ "${fileName}" נשמר בתיקיית ההורדות`,
          variant: "default"
        });

      } catch (downloadError) {
        console.error("Download failed:", downloadError);

        // Fallback: data URI download
        try {
          const encodedUri = "data:text/csv;charset=utf-8,\uFEFF" + encodeURIComponent(csvContent);
          const link = document.createElement("a");
          link.href = encodedUri;
          link.download = fileName;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          toast({
            title: "מסמך היסטורי הופק בהצלחה",
            description: `הקובץ "${fileName}" נשמר בתיקיית ההורדות`,
            variant: "default"
          });
        } catch (fallbackError) {
          throw new Error("לא ניתן היה להוריד את הקובץ. נסה שוב או השתמש בדפדפן אחר.");
        }
      }

    } catch (error) {
      console.error("Error generating history document:", error);
      toast({
        title: "שגיאה בהפקת מסמך",
        description: error.message || "אירעה שגיאה בהפקת המסמך",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleGeneratePdf = async () => {
    if (!document || !document.id) {
      toast({
        title: "אין מסמך להדפסה",
        description: "לא נמצא מסמך להדפסה",
        variant: "destructive"
      });
      return;
    }

    if (!isFullBrowserEnvironment()) {
      toast({
        title: "הפקת PDF לא זמינה",
        description: "הפקת PDF זמינה רק בסביבת דפדפן מלאה.",
        variant: "destructive"
      });
      return;
    }

    setGenerating(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      // Removed autoTable import as it's no longer used

      // Get current user for print tracking
      let currentUser = await User.me().catch(() => ({ full_name: 'משתמש לא ידוע' }));

      // Fetch items if not provided
      let documentItems = items; // Start with the items from props
      if (!documentItems || documentItems.length === 0) {
        switch (documentType) {
          case 'order':
            // This case should ideally not be hit due to early return
            documentItems = await OrderItem.filter({ order_id: document.id });
            break;
          case 'delivery':
            documentItems = await DeliveryItem.filter({ delivery_id: document.id });
            break;
          case 'withdrawal':
            documentItems = await WithdrawalItem.filter({ withdrawal_request_id: document.id });
            break;
          case 'shipment':
            documentItems = await ShipmentItem.filter({ shipment_id: document.id });
            break;
          // inventory_count items are handled directly from document.entries, not fetched as a separate list
          default:
            documentItems = []; // No items for unknown type
            break;
        }
      }

      // Create PDF
      const doc = new jsPDF();

      // Set up basic info
      const title = getDocumentTitle();
      const docNumber = getDocumentNumber();
      const docDate = getDocumentDate();

      // Header
      doc.setFontSize(16);
      doc.text(title, 105, 20, { align: 'center' });

      doc.setFontSize(10);
      doc.text(`Document Number: ${docNumber}`, 105, 30, { align: 'center' });
      doc.text(`Original Date: ${docDate ? format(parseISO(docDate), 'dd/MM/yyyy') : 'Unknown'}`, 105, 35, { align: 'center' });

      let generatedY = 40;
      if (document.created_by || document.created_date) {
        doc.text(`Created By: ${document.created_by_name || 'Unknown'}`, 105, generatedY, { align: 'center' });
        generatedY += 5;
        doc.text(`Creation Date: ${document.created_date ? format(parseISO(document.created_date), "dd/MM/yyyy HH:mm") : 'Unknown'}`, 105, generatedY, { align: 'center' });
        generatedY += 5;
      }

      doc.text(`Printed from History By: ${currentUser?.full_name || 'Unknown User'}`, 105, generatedY, { align: 'center' });
      generatedY += 5;
      doc.text(`Print Date: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: he })}`, 105, generatedY, { align: 'center' });


      let y = generatedY + 15; // Starting Y position for document details

      // Document details
      doc.setFontSize(12);
      doc.text('Document Details:', 20, y);
      y += 10;

      doc.setFontSize(10);
      let detailsAdded = false;

      if (documentType === 'order') {
        // This branch should ideally not be hit due to early return
        doc.text(`Supplier: ${document.supplier || 'Unknown'}`, 20, y); y += 5;
        doc.text(`Order Type: ${document.order_type || 'Unknown'}`, 20, y); y += 5;
        doc.text(`Status: ${document.status || 'Unknown'}`, 20, y); y += 5;
        if (document.order_number_permanent) {
          doc.text(`Permanent Order #: ${document.order_number_permanent}`, 20, y); y += 5;
        }
        if (document.purchase_order_number_sap) {
          doc.text(`SAP PO #: ${document.purchase_order_number_sap}`, 20, y); y += 5;
        }
        if (document.total_value) {
          doc.text(`Total Value: ₪${document.total_value}`, 20, y); y += 5;
        }
        detailsAdded = true;
      } else if (documentType === 'delivery') {
        doc.text(`Supplier: ${document.supplier || 'Unknown'}`, 20, y); y += 5;
        doc.text(`Order Number: ${document.order_number || 'Unknown'}`, 20, y); y += 5;
        doc.text(`Status: ${document.status || 'Unknown'}`, 20, y); y += 5;
        doc.text(`Delivery Type: ${document.delivery_type || 'Unknown'}`, 20, y); y += 5;
        detailsAdded = true;
      } else if (documentType === 'shipment') {
        doc.text(`Recipient: ${document.recipient_name || 'Unknown'}`, 20, y); y += 5;
        doc.text(`Recipient Type: ${document.recipient_type || 'Unknown'}`, 20, y); y += 5;
        if (document.contact_person) {
          doc.text(`Contact Person: ${document.contact_person}`, 20, y); y += 5;
        }
        doc.text(`Transport Method: ${document.transport_method || 'Unknown'}`, 20, y); y += 5;
        if (document.tracking_number) {
          doc.text(`Tracking Number: ${document.tracking_number}`, 20, y); y += 5;
        }
        doc.text(`Status: ${document.status || 'Unknown'}`, 20, y); y += 5;
        detailsAdded = true;
      } else if (documentType === 'withdrawal') {
        doc.text(`Requestor: ${document.requestor_name || 'Unknown'}`, 20, y); y += 5;
        doc.text(`Status: ${document.status || 'Unknown'}`, 20, y); y += 5;
        detailsAdded = true;
      } else if (documentType === 'inventory_count') {
        doc.text(`Count Date: ${document.count_date ? format(parseISO(document.count_date), "dd/MM/yyyy") : 'Unknown'}`, 20, y); y += 5;
        doc.text(`Total Reagents: ${document.reagents_total_count?.toString() || 'Unknown'}`, 20, y); y += 5;
        doc.text(`Updated Reagents: ${document.reagents_updated_count?.toString() || '0'}`, 20, y); y += 5;
        doc.text(`Update Completed: ${document.reagent_updates_completed ? 'Yes' : 'No'}`, 20, y); y += 5;
        detailsAdded = true;
      }

      if (document.notes) { // Common notes field
        if (detailsAdded) y += 5; // Add a bit more space if other details were added
        doc.text(`Notes: ${document.notes}`, 20, y); y += 5;
        detailsAdded = true;
      }

      if (detailsAdded) {
        y += 10; // Add space before items if details were printed
      }

      // Items section
      doc.setFontSize(12);
      doc.text('Items:', 20, y);
      y += 10; // y is now the starting position for the item table headers

      if (documentType === 'inventory_count') {
        // Special handling for inventory_count entries
        if (document.entries && Object.keys(document.entries).length > 0) {
            doc.setFontSize(9);
            doc.text('#', 20, y);
            doc.text('Reagent Name', 30, y);
            doc.text('Counted Qty', 100, y);
            doc.text('Batch', 130, y);
            doc.text('Expiry', 160, y);
            y += 5;
            doc.line(20, y, 190, y);
            y += 5;

            let itemIndex = 1;
            Object.entries(document.entries).forEach(([reagentId, entry]) => {
                if (entry.batches && Object.keys(entry.batches).length > 0) {
                    Object.entries(entry.batches).forEach(([batchKey, batchData]) => {
                        if (y > 270) { // New page if needed (adjust based on actual content and margins)
                            doc.addPage();
                            y = 20;
                            doc.setFontSize(9);
                            doc.text('#', 20, y);
                            doc.text('Reagent Name', 30, y);
                            doc.text('Counted Qty', 100, y);
                            doc.text('Batch', 130, y);
                            doc.text('Expiry', 160, y);
                            y += 5;
                            doc.line(20, y, 190, y);
                            y += 5;
                        }
                        doc.text(`${itemIndex}`, 20, y);
                        doc.text((entry.reagent_name || 'Unknown').substring(0, 40), 30, y); // Longer space for name
                        doc.text(batchData.counted_quantity?.toString() || '0', 100, y);
                        doc.text(batchData.batch_number || '-', 130, y);
                        doc.text(batchData.expiry_date ? format(parseISO(batchData.expiry_date), 'dd/MM/yy') : '-', 160, y);
                        y += 5;
                        itemIndex++;
                    });
                }
            });
        } else {
            doc.setFontSize(10);
            doc.text('No items/entries in this document.', 20, y);
            y += 10; // Ensure y advances even if no items
        }
      } else {
        // General item handling for order, delivery, shipment, withdrawal using the new drawTable function
        if (documentItems && documentItems.length > 0) {
          const tableHeaders = ['#', 'Item Name', 'Quantity', 'Batch', 'Expiry'];
          const colPositions = [15, 30, 90, 120, 150]; // Positions for columns as per outline

          const tableBody = documentItems.map((item, index) => {
             let quantity = '';
            if (documentType === 'delivery') {
              quantity = `${item.quantity_received || 0}`;
            } else if (documentType === 'withdrawal') {
              quantity = `${item.quantity_requested || 0}`;
            } else if (documentType === 'shipment') {
              quantity = `${item.quantity_sent || 0}`;
            } else if (documentType === 'order') { // Though order is excluded, keeping for structure
              quantity = `${item.quantity_ordered || 0}`;
            }

            return [
                index + 1,
                item.reagent_name_snapshot || 'Unknown',
                quantity,
                item.batch_number || '-',
                item.expiry_date ? format(parseISO(item.expiry_date), 'dd/MM/yy') : '-'
            ];
          });

          // Call the new drawTable function
          y = drawTable(doc, tableHeaders, tableBody, y, colPositions);

        } else {
          doc.setFontSize(10);
          doc.text('No items in this document.', 20, y);
          y += 10; // Ensure y advances even if no items
        }
      }

      // Footer - authenticity note (similar to CSV)
      y += 20; // Some space before footer
      if (y > 270) { doc.addPage(); y = 20; } // Check for new page before drawing footer
      doc.setFontSize(8);
      doc.text("Important Note:", 20, y); y += 5;
      doc.text("This is a copy from history. The original document was created on the date specified above.", 20, y); y += 5;
      doc.text("This printout is for documentation and tracking purposes only.", 20, y); y += 5;


      // Generate and download PDF
      const fileName = `${getDocumentTitle().replace(/[\s\/]/g, '_')}_${docNumber}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
      doc.save(fileName);

      toast({
        title: "קובץ PDF נוצר בהצלחה",
        description: `הקובץ "${fileName}" נשמר בתיקיית ההורדות`,
        variant: "default"
      });

    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "שגיאה ביצירת PDF",
        description: error.message || "אירעה שגיאה ביצירת המסמך",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  // Show different UI based on environment
  const canPrint = isFullBrowserEnvironment();

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" disabled={!canPrint}>
            <Printer className="h-4 w-4 mr-2" />
            {canPrint ? "הדפס מההיסטוריה" : "הדפסה זמינה בייצור"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>הדפסת מסמך מההיסטוריה</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <p><strong>סוג מסמך:</strong> {getDocumentTitle()}</p>
            <p><strong>מספר/מזהה:</strong> {getDocumentNumber()}</p>
            <p><strong>תאריך מקורי:</strong> {getDocumentDate() ? format(parseISO(getDocumentDate()), "dd/MM/yyyy") : "לא ידוע"}</p>
          </div>

          {!canPrint && (
            <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2 text-blue-600" />
                <p className="text-sm text-blue-800">
                  <strong>מצב פיתוח:</strong> בסביבת הפיתוח, תוכן הקובץ יועתק ללוח או יוצג ב-console.
                </p>
              </div>
            </div>
          )}

          <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
            <p className="text-sm text-yellow-800">
              <strong>שים לב:</strong> זהו עותק מההיסטוריה. במסמך יצוין מי הדפיס ומתי, בנפרד מפרטי היוצר המקורי.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <DialogTrigger asChild>
              <Button variant="outline">ביטול</Button>
            </DialogTrigger>
            <Button
              onClick={generateHistoryDocument}
              disabled={generating} // Disable if any generation is active
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  מפיק CSV...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  {canPrint ? "הפק והורד CSV" : "הפק תוכן CSV"}
                </>
              )}
            </Button>
            <Button
              onClick={handleGeneratePdf}
              disabled={!canPrint || generating} // Disable if not full browser or if generating
              className="bg-red-600 hover:bg-red-700" // Distinct color for PDF
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  מפיק PDF...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  הפק והורד PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const generateDeliveryContent = async (rows, delivery, deliveryItems, escapeCsvField) => {
  rows.push([
    escapeCsvField("ספק:"),
    escapeCsvField(delivery.supplier || "לא ידוע"),
    "",
    escapeCsvField("מספר הזמנה:"),
    escapeCsvField(delivery.order_number || "לא ידוע"),
    ""
  ].join(","));

  rows.push([
    escapeCsvField("סטטוס:"),
    escapeCsvField(delivery.status || "לא ידוע"),
    "",
    escapeCsvField("סוג משלוח:"),
    escapeCsvField(delivery.delivery_type || "לא ידוע"),
    ""
  ].join(","));

  if (delivery.notes) {
    rows.push([
      escapeCsvField("הערות:"),
      escapeCsvField(delivery.notes),
      "",
      "",
      "",
      ""
    ].join(","));
  }

  rows.push("");

  if (deliveryItems && deliveryItems.length > 0) {
    rows.push([
      escapeCsvField("מס'"),
      escapeCsvField("שם הפריט"),
      escapeCsvField("מס' אצווה"),
      escapeCsvField("תאריך תפוגה"),
      escapeCsvField("כמות התקבלה"),
      escapeCsvField("הערות")
    ].join(","));

    deliveryItems.forEach((item, index) => {
      const expiryDate = item.expiry_date ? format(parseISO(item.expiry_date), "dd/MM/yyyy") : "לא ידוע";
      rows.push([
        escapeCsvField(index + 1),
        escapeCsvField(item.reagent_name_snapshot || ""),
        escapeCsvField(item.batch_number || ""),
        escapeCsvField(expiryDate),
        escapeCsvField(item.quantity_received?.toString() || "0"),
        escapeCsvField(item.notes || "")
      ].join(","));
    });
  }
};

const generateShipmentContent = async (rows, shipment, shipmentItems, escapeCsvField) => {
  rows.push([
    escapeCsvField("נמען:"),
    escapeCsvField(shipment.recipient_name || "לא ידוע"),
    "",
    escapeCsvField("סוג נמען:"),
    escapeCsvField(shipment.recipient_type || "לא ידוע"),
    ""
  ].join(","));

  if (shipment.contact_person) {
    rows.push([
      escapeCsvField("איש קשר:"),
      escapeCsvField(shipment.contact_person),
      "",
      escapeCsvField("אופן הובלה:"),
      escapeCsvField(shipment.transport_method || "לא ידוע"),
      ""
    ].join(","));
  }

  if (shipment.tracking_number) {
    rows.push([
      escapeCsvField("מספר מעקב:"),
      escapeCsvField(shipment.tracking_number),
      "",
      escapeCsvField("סטטוס:"),
      escapeCsvField(shipment.status || "לא ידוע"),
      ""
    ].join(","));
  }

  if (shipment.notes) {
    rows.push([
      escapeCsvField("הערות:"),
      escapeCsvField(shipment.notes),
      "",
      "",
      "",
      ""
    ].join(","));
  }

  rows.push("");

  if (shipmentItems && shipmentItems.length > 0) {
    rows.push([
      escapeCsvField("מס'"),
      escapeCsvField("שם הפריט"),
      escapeCsvField("מס' אצווה"),
      escapeCsvField("תאריך תפוגה"),
      escapeCsvField("כמות נשלחה"),
      escapeCsvField("הערות")
    ].join(","));

    shipmentItems.forEach((item, index) => {
      const expiryDate = item.expiry_date ? format(parseISO(item.expiry_date), "dd/MM/yyyy") : "לא ידוע";
      rows.push([
        escapeCsvField(index + 1),
        escapeCsvField(item.reagent_name_snapshot || ""),
        escapeCsvField(item.batch_number || ""),
        escapeCsvField(expiryDate),
        escapeCsvField(item.quantity_sent?.toString() || "0"),
        escapeCsvField(item.notes || "")
      ].join(","));
    });
  }
};

const generateOrderContent = async (rows, order, orderItems, escapeCsvField) => {
  // This function is kept for completeness as per original file, though the component now returns null for 'order' documents.
  rows.push([
    escapeCsvField("ספק:"),
    escapeCsvField(order.supplier || "לא ידוע"),
    "",
    escapeCsvField("סוג הזמנה:"),
    escapeCsvField(order.order_type || "לא ידוע"),
    ""
  ].join(","));

  if (order.order_number_permanent) {
    rows.push([
      escapeCsvField("מס' דרישה קבוע:"),
      escapeCsvField(order.order_number_permanent),
      "",
      escapeCsvField("מס' הזמנה SAP:"),
      escapeCsvField(order.purchase_order_number_sap || "לא ידוע"),
      ""
    ].join(","));
  }

  rows.push([
    escapeCsvField("סטטוס:"),
    escapeCsvField(order.status || "לא ידוע"),
    "",
    escapeCsvField("ערך כולל:"),
    escapeCsvField(order.total_value ? `₪${order.total_value}` : "לא ידוע"),
    ""
  ].join(","));

  if (order.notes) {
    rows.push([
      escapeCsvField("הערות:"),
      escapeCsvField(order.notes),
      "",
      "",
      "",
      ""
    ].join(","));
  }

  rows.push("");

  if (orderItems && orderItems.length > 0) {
    rows.push([
      escapeCsvField("מס'"),
      escapeCsvField("שם הפריט"),
      escapeCsvField("כמות הוזמנה"),
      escapeCsvField("כמות התקבלה"),
      escapeCsvField("יתרה"),
      escapeCsvField("הערות")
    ].join(","));

    orderItems.forEach((item, index) => {
      rows.push([
        escapeCsvField(index + 1),
        escapeCsvField(item.reagent_name_snapshot || ""),
        escapeCsvField(item.quantity_ordered?.toString() || "0"),
        escapeCsvField(item.quantity_received?.toString() || "0"),
        escapeCsvField(item.quantity_remaining?.toString() || "0"),
        escapeCsvField(item.notes || "")
      ].join(","));
    });
  }
};

const generateInventoryCountContent = async (rows, count, escapeCsvField) => {
  rows.push([
    escapeCsvField("תאריך ספירה:"),
    escapeCsvField(count.count_date ? format(parseISO(count.count_date), "dd/MM/yyyy") : "לא ידוע"),
    "",
    escapeCsvField("סה״כ פריטים:"),
    escapeCsvField(count.reagents_total_count?.toString() || "לא ידוע"),
    ""
  ].join(","));

  rows.push([
    escapeCsvField("פריטים שעודכנו:"),
    escapeCsvField(count.reagents_updated_count?.toString() || "0"),
    "",
    escapeCsvField("עדכון הושלם:"),
    escapeCsvField(count.reagent_updates_completed ? "כן" : "לא"),
    ""
  ].join(","));

  rows.push("");

  if (count.entries && Object.keys(count.entries).length > 0) {
    rows.push([
      escapeCsvField("מס'"),
      escapeCsvField("שם הפריט"),
      escapeCsvField("כמות נספרה"),
      escapeCsvField("הערות"),
      "",
      ""
    ].join(","));

    let itemIndex = 1;
    Object.entries(count.entries).forEach(([reagentId, entry]) => {
      if (entry.batches && Object.keys(entry.batches).length > 0) {
        Object.entries(entry.batches).forEach(([batchKey, batchData]) => {
          rows.push([
            escapeCsvField(itemIndex),
            escapeCsvField(entry.reagent_name || "לא ידוע"),
            escapeCsvField(batchData.counted_quantity?.toString() || "0"),
            escapeCsvField(`אצווה: ${batchData.batch_number || "לא ידוע"}, תפוגה: ${batchData.expiry_date ? format(parseISO(batchData.expiry_date), "dd/MM/yyyy") : "לא ידוע"}`),
            "",
            ""
          ].join(","));
          itemIndex++;
        });
      }
    });
  }
};

const generateWithdrawalContent = async (rows, withdrawal, withdrawalItems, escapeCsvField) => {
  rows.push([
    escapeCsvField("מבקש:"),
    escapeCsvField(withdrawal.requestor_name || "לא ידוע"),
    "",
    escapeCsvField("סטטוס:"),
    escapeCsvField(withdrawal.status || "לא ידוע"),
    ""
  ].join(","));

  if (withdrawal.notes) {
    rows.push([
      escapeCsvField("הערות:"),
      escapeCsvField(withdrawal.notes),
      "",
      "",
      "",
      ""
    ].join(","));
  }

  rows.push("");

  if (withdrawalItems && withdrawalItems.length > 0) {
    rows.push([
      escapeCsvField("מס'"),
      escapeCsvField("שם הפריט"),
      escapeCsvField("מס' אצווה"),
      escapeCsvField("תאריך תפוגה"),
      escapeCsvField("כמות נדרשה"),
      escapeCsvField("הערות")
    ].join(","));

    withdrawalItems.forEach((item, index) => {
      const expiryDate = item.expiry_date ? format(parseISO(item.expiry_date), "dd/MM/yyyy") : "לא ידוע";
      rows.push([
        escapeCsvField(index + 1),
        escapeCsvField(item.reagent_name_snapshot || ""),
        escapeCsvField(item.batch_number || ""),
        escapeCsvField(expiryDate),
        escapeCsvField(item.quantity_requested?.toString() || "0"),
        escapeCsvField(item.notes || "")
      ].join(","));
    });
  }
};
