import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Printer, X, Save, FileText, FileSpreadsheet, FileDown } from 'lucide-react';
import { Delivery } from '@/api/entities';
import { DeliveryItem } from '@/api/entities';
import { Shipment } from '@/api/entities';
import { ShipmentItem } from '@/api/entities';
import { User } from '@/api/entities';
import { format, parseISO, isValid } from 'date-fns';
import { he } from 'date-fns/locale';
import { toast } from 'sonner';
import { formatQuantity } from '../utils/formatters';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function PrintDialog({ 
  isOpen, 
  onClose, 
  documentId, 
  documentType,
  title 
}) {
  const [loading, setLoading] = useState(false);
  const [documentData, setDocumentData] = useState(null);
  const [items, setItems] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const isDelivery = documentType === 'delivery';
  const isShipment = documentType === 'shipment';
  const isOrder = documentType === 'order';
  const isWithdrawal = documentType === 'withdrawal';

  const fetchDocumentData = useCallback(async () => {
    setLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      let document, documentItems;
      
      if (documentType === 'delivery') {
        [document, documentItems] = await Promise.all([
          Delivery.get(documentId),
          DeliveryItem.filter({ delivery_id: documentId })
        ]);
      } else if (documentType === 'shipment') {
        [document, documentItems] = await Promise.all([
          Shipment.get(documentId),
          ShipmentItem.filter({ shipment_id: documentId })
        ]);
      } else if (documentType === 'order') {
        const { Order } = await import('@/api/entities');
        const { OrderItem } = await import('@/api/entities');
        [document, documentItems] = await Promise.all([
          Order.get(documentId),
          OrderItem.filter({ order_id: documentId })
        ]);
      } else if (documentType === 'withdrawal') {
        const { WithdrawalRequest } = await import('@/api/entities');
        const { WithdrawalItem } = await import('@/api/entities');
        [document, documentItems] = await Promise.all([
          WithdrawalRequest.get(documentId),
          WithdrawalItem.filter({ withdrawal_request_id: documentId })
        ]);
      }
      
      setDocumentData(document);
      setItems(documentItems || []);
    } catch (error) {
      console.error('Error fetching document data:', error);
      toast.error('שגיאה בטעינת המסמך', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  }, [documentId, documentType]);

  useEffect(() => {
    if (isOpen && documentId && documentType) {
      fetchDocumentData();
    }
  }, [isOpen, documentId, documentType, fetchDocumentData]);

  const getDocumentInfo = () => {
    if (!documentData) return {};

    let documentTitle = '';
    let documentNumber = '';
    let documentDate = '';
    let principalPartyLabel = '';
    let principalPartyValue = '';
    
    if (isDelivery) {
      documentTitle = 'תעודת קליטת משלוח';
      documentNumber = documentData.delivery_number;
      documentDate = documentData.delivery_date;
      principalPartyLabel = 'ספק';
      principalPartyValue = documentData.supplier;
    } else if (isShipment) {
      documentTitle = 'תעודת משלוח יוצא';
      documentNumber = documentData.shipment_number;
      documentDate = documentData.shipment_date;
      principalPartyLabel = 'נמען';
      principalPartyValue = documentData.recipient_name;
    } else if (isOrder) {
      documentTitle = 'דרישת רכש';
      documentNumber = documentData.order_number_permanent || documentData.order_number_temp;
      documentDate = documentData.order_date;
      principalPartyLabel = 'ספק';
      principalPartyValue = documentData.supplier_name_snapshot;
    } else if (isWithdrawal) {
      documentTitle = 'בקשת משיכה';
      documentNumber = documentData.withdrawal_number;
      documentDate = documentData.request_date;
      principalPartyLabel = 'בקש ע"י';
      principalPartyValue = documentData.requested_by_user_name_snapshot;
    }
    
    const formattedDate = documentDate && isValid(parseISO(documentDate)) 
      ? format(parseISO(documentDate), 'dd/MM/yyyy', { locale: he })
      : '-';

    return { documentTitle, documentNumber, documentDate: formattedDate, principalPartyLabel, principalPartyValue };
  };

  const handlePrint = () => {
    if (!documentData) return;
    
    const printWindow = window.open('', '_blank');
    const printContent = generatePrintHTML();
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    
    // Close dialog after initiating print
    onClose();
  };

  const handleSaveAsHTML = () => {
    try {
      const htmlContent = generatePrintHTML();
      const { documentNumber } = getDocumentInfo();
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${documentNumber || 'document'}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('הקובץ נשמר בהצלחה', {
        description: `${documentNumber}.html הורד בהצלחה`
      });
      
      setShowSaveDialog(false);
      onClose();
    } catch (error) {
      console.error('Error saving HTML:', error);
      toast.error('שגיאה בשמירת הקובץ', {
        description: error.message
      });
    }
  };

  const handleSaveAsCSV = () => {
    try {
      const { documentTitle, documentNumber, documentDate, principalPartyLabel, principalPartyValue } = getDocumentInfo();
      
      let csvContent = `${documentTitle}\n`;
      csvContent += `מספר מסמך,${documentNumber}\n`;
      csvContent += `תאריך,${documentDate}\n`;
      csvContent += `${principalPartyLabel},${principalPartyValue}\n\n`;
      
      csvContent += `#,שם פריט,מק"ט,אצווה,תפוגה,כמות\n`;
      
      items.forEach((item, index) => {
        const itemName = item.reagent_name_snapshot || item.reagent_name || '-';
        const catalogNumber = item.reagent_catalog_number_snapshot || item.reagent_catalog_number || '-';
        const batchNumber = item.batch_number || '-';
        const expiryDate = item.expiry_date && isValid(parseISO(item.expiry_date))
          ? format(parseISO(item.expiry_date), 'dd/MM/yyyy', { locale: he })
          : '-';
        const quantity = formatQuantity(
          item.quantity_received || 
          item.quantity_sent || 
          item.quantity_ordered || 
          item.quantity_requested || 
          0
        );
        
        csvContent += `${index + 1},"${itemName}","${catalogNumber}","${batchNumber}",${expiryDate},${quantity}\n`;
      });
      
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${documentNumber || 'document'}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('הקובץ נשמר בהצלחה', {
        description: `${documentNumber}.csv הורד בהצלחה`
      });
      
      setShowSaveDialog(false);
      onClose();
    } catch (error) {
      console.error('Error saving CSV:', error);
      toast.error('שגיאה בשמירת הקובץ', {
        description: error.message
      });
    }
  };

  const handleSaveAsPDF = () => {
    toast.info('פותח דיאלוג הדפסה', {
      description: "בחר 'שמור כ-PDF' או 'Microsoft Print to PDF' בדיאלוג שייפתח",
      duration: 5000
    });
    
    setTimeout(() => {
      handlePrint();
    }, 500);
  };

  const generatePrintHTML = () => {
    if (!documentData || items.length === 0) return '';

    const { documentTitle, documentNumber, documentDate, principalPartyLabel, principalPartyValue } = getDocumentInfo();
    
    return `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="utf-8">
        <title>${documentTitle}</title>
        <style>
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            margin: 20px; 
            direction: rtl; 
            font-size: 12px;
            line-height: 1.4;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
          }
          .header h1 { 
            color: #1f2937; 
            margin: 0 0 10px 0; 
            font-size: 20px;
          }
          .header p { 
            color: #6b7280; 
            margin: 5px 0; 
            font-size: 14px;
          }
          .document-info {
            background: #f8fafc;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            border: 1px solid #e0e7eb;
          }
          .info-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .info-label {
            font-weight: bold;
            color: #374151;
          }
          .info-value {
            color: #1f2937;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0;
            font-size: 11px;
          }
          th, td { 
            border: 1px solid #d1d5db; 
            padding: 8px 10px; 
            text-align: right; 
          }
          th { 
            background-color: #f3f4f6; 
            font-weight: bold; 
            color: #374151;
          }
          tr:nth-child(even) { 
            background-color: #f9fafb; 
          }
          .summary {
            background: #e5f3ff;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
            text-align: center;
            font-weight: bold;
            border: 1px solid #a3d4ff;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #d1d5db;
            text-align: center;
            font-size: 10px;
            color: #6b7280;
          }
          @media print {
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${documentTitle}</h1>
          <p>מספר מסמך: <strong>${documentNumber || 'לא זמין'}</strong></p>
        </div>

        <div class="document-info">
          <div class="info-item">
            <span class="info-label">תאריך:</span>
            <span class="info-value">${documentDate}</span>
          </div>
          <div class="info-item">
            <span class="info-label">${principalPartyLabel}:</span>
            <span class="info-value">${principalPartyValue || 'לא צוין'}</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 5%;">#</th>
              <th style="width: 35%;">שם פריט</th>
              <th style="width: 15%;">מק"ט</th>
              <th style="width: 15%;">אצווה</th>
              <th style="width: 15%;">תוקף</th>
              <th style="width: 15%;">כמות</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item, index) => {
              const itemName = item.reagent_name_snapshot || item.reagent_name || '-';
              const catalogNumber = item.reagent_catalog_number_snapshot || item.reagent_catalog_number || '-';
              const batchNumber = item.batch_number || '-';
              const expiryDate = item.expiry_date && isValid(parseISO(item.expiry_date))
                ? format(parseISO(item.expiry_date), 'dd/MM/yyyy', { locale: he })
                : '-';
              const quantity = formatQuantity(
                item.quantity_received || 
                item.quantity_sent || 
                item.quantity_ordered || 
                item.quantity_requested || 
                0
              );
              
              return `
                <tr>
                  <td>${index + 1}</td>
                  <td>${itemName}</td>
                  <td>${catalogNumber}</td>
                  <td>${batchNumber}</td>
                  <td>${expiryDate}</td>
                  <td><strong>${quantity}</strong></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="summary">
          <strong>סה"כ פריטים:</strong> ${items.length}
        </div>

        <div class="footer">
          <p>מסמך זה הופק במערכת Flow Control</p>
          <p>תאריך הדפסה: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: he })}</p>
          ${currentUser ? `<p>הודפס על ידי: ${currentUser.full_name}</p>` : ''}
        </div>
      </body>
      </html>
    `;
  };

  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen && !showSaveDialog} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              {title || getDocumentInfo().documentTitle}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 max-h-[60vh]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="mr-2">טוען מסמך...</span>
              </div>
            ) : documentData ? (
              <div className="space-y-4 p-4" style={{ direction: 'rtl' }}>
                {/* Document Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">מספר מסמך:</span>
                      <span>{getDocumentInfo().documentNumber || 'לא זמין'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">תאריך:</span>
                      <span>{getDocumentInfo().documentDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">{getDocumentInfo().principalPartyLabel}:</span>
                      <span>{getDocumentInfo().principalPartyValue || 'לא צוין'}</span>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2 text-right">#</th>
                        <th className="p-2 text-right">שם פריט</th>
                        <th className="p-2 text-right">מק"ט</th>
                        <th className="p-2 text-right">אצווה</th>
                        <th className="p-2 text-right">תפוגה</th>
                        <th className="p-2 text-right">כמות</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="p-2">{index + 1}</td>
                          <td className="p-2">{item.reagent_name_snapshot || item.reagent_name || '-'}</td>
                          <td className="p-2">{item.reagent_catalog_number_snapshot || item.reagent_catalog_number || '-'}</td>
                          <td className="p-2">{item.batch_number || '-'}</td>
                          <td className="p-2">
                            {(item.expiry_date && isValid(parseISO(item.expiry_date))) ? format(parseISO(item.expiry_date), 'dd/MM/yyyy') : 'לא זמין'}
                          </td>
                          <td className="p-2 text-center">
                            {formatQuantity(
                              item.quantity_received || 
                              item.quantity_sent || 
                              item.quantity_ordered || 
                              item.quantity_requested || 
                              0
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary */}
                <div className="bg-blue-50 p-3 rounded-lg text-center font-medium">
                  סה"כ פריטים: {items.length}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                לא ניתן לטעון את המסמך
              </div>
            )}
          </ScrollArea>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              סגור
            </Button>
            <Button variant="outline" onClick={() => setShowSaveDialog(true)} disabled={loading || !documentData}>
              <Save className="h-4 w-4 mr-2" />
              שמור וסגור
            </Button>
            <Button onClick={handlePrint} disabled={loading || !documentData}>
              <Printer className="h-4 w-4 mr-2" />
              הדפס וסגור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Format Sub-Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileDown className="h-5 w-5" />
              שמור בפורמט
            </DialogTitle>
            <DialogDescription>
              בחר את הפורמט המועדף לשמירת המסמך
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <Button 
              variant="outline" 
              className="w-full justify-start text-right h-auto py-3"
              onClick={handleSaveAsHTML}
            >
              <div className="flex items-center gap-3 w-full">
                <FileText className="h-5 w-5 text-orange-600" />
                <div className="text-right flex-1">
                  <div className="font-semibold">HTML</div>
                  <div className="text-xs text-gray-500">מסמך מעוצב לצפייה בדפדפן</div>
                </div>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="w-full justify-start text-right h-auto py-3"
              onClick={handleSaveAsCSV}
            >
              <div className="flex items-center gap-3 w-full">
                <FileSpreadsheet className="h-5 w-5 text-green-600" />
                <div className="text-right flex-1">
                  <div className="font-semibold">CSV</div>
                  <div className="text-xs text-gray-500">טבלת נתונים לעיבוד באקסל</div>
                </div>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="w-full justify-start text-right h-auto py-3"
              onClick={handleSaveAsPDF}
            >
              <div className="flex items-center gap-3 w-full">
                <Printer className="h-5 w-5 text-red-600" />
                <div className="text-right flex-1">
                  <div className="font-semibold">PDF</div>
                  <div className="text-xs text-gray-500">יפתח דיאלוג הדפסה - בחר "שמור כ-PDF"</div>
                </div>
              </div>
            </Button>

            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-xs text-blue-800 text-right">
                <strong>טיפ:</strong> לשמירה כ-PDF, בחר באפשרות PDF למעלה ואז בדיאלוג ההדפסה שייפתח בחר "שמור כ-PDF" או "Microsoft Print to PDF"
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowSaveDialog(false)}>
              ביטול
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}