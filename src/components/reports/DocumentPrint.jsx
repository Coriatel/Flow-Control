
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Printer, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { he } from "date-fns/locale";
import { User } from '@/api/entities';
import { OrderItem } from '@/api/entities';

const getStatusDisplay = (status) => {
    const statusMap = {
        'draft': 'טיוטה',
        'pending_sap_permanent_id': 'ממתין למספר דרישה קבוע',
        'pending_sap_po_number': 'ממתין למספר הזמנה',
        'approved': 'מאושר',
        'partially_received': 'התקבל חלקי',
        'fully_received': 'התקבל במלואו',
        'closed': 'סגור',
        'cancelled': 'מבוטל'
    };
    return statusMap[status] || status;
};

const getOrderTypeDisplay = (type) => {
    const typeMap = {
        'regular': 'רגילה',
        'framework': 'מסגרת',
        'emergency': 'חירום',
        'standing': 'קבועה'
    };
    return typeMap[type] || type;
};

export default function DocumentPrint({ order, children, iconOnly = false }) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePrint = async () => {
    if (!order) {
      toast({ title: "שגיאה", description: "לא ניתן להדפיס, לא נמצאה הזמנה.", variant: "destructive" });
      return;
    }

    setIsGenerating(true);

    try {
      const user = await User.me();
      const orderItems = await OrderItem.filter({ order_id: order.id });
      
      // Calculate totals
      const totalOrdered = orderItems.reduce((sum, item) => sum + (item.quantity_ordered || 0), 0);
      const totalReceived = orderItems.reduce((sum, item) => sum + (item.quantity_received || 0), 0);

      // Create print-friendly HTML
      const printContent = `
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
          <title>דרישת רכש - ${order.order_number_temp}</title>
          <meta charset="UTF-8">
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 15px; 
              direction: rtl;
              font-size: 12px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border: 2px solid #1f2937;
              padding: 15px;
              background-color: #f9fafb;
            }
            h1 { 
              color: #1f2937; 
              margin-bottom: 5px;
              font-size: 24px;
            }
            .order-number { 
              color: #4b5563; 
              font-size: 16px;
              font-weight: bold;
            }
            .details-section {
              margin: 20px 0;
              padding: 15px;
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
            }
            .details-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin-top: 10px;
            }
            .detail-item {
              padding: 8px;
              background-color: white;
              border-radius: 4px;
              border: 1px solid #e5e7eb;
            }
            .detail-label {
              font-weight: bold;
              color: #374151;
              margin-bottom: 2px;
            }
            .detail-value {
              color: #6b7280;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 20px 0;
              font-size: 11px;
            }
            th, td { 
              border: 1px solid #d1d5db; 
              padding: 8px; 
              text-align: right;
            }
            th { 
              background-color: #f3f4f6; 
              font-weight: bold;
              font-size: 12px;
            }
            tr:nth-child(even) { 
              background-color: #f9fafb; 
            }
            .summary-section {
              margin-top: 25px;
              padding: 15px;
              background-color: #eff6ff;
              border: 1px solid #bfdbfe;
              border-radius: 8px;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 10px;
              color: #6b7280;
              border-top: 1px solid #d1d5db;
              padding-top: 15px;
            }
            @media print { 
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>דרישת רכש</h1>
            <div class="order-number">מספר דרישה: ${order.order_number_temp}</div>
          </div>
          
          <div class="details-section">
            <h2 style="margin-top: 0; color: #1f2937;">פרטי הדרישה</h2>
            <div class="details-grid">
              <div class="detail-item">
                <div class="detail-label">סטטוס:</div>
                <div class="detail-value">${getStatusDisplay(order.status)}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">תאריך יצירה:</div>
                <div class="detail-value">${format(parseISO(order.order_date), 'dd/MM/yyyy', {locale: he})}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">ספק:</div>
                <div class="detail-value">${order.supplier || 'לא צוין'}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">סוג הזמנה:</div>
                <div class="detail-value">${getOrderTypeDisplay(order.order_type)}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">מספר דרישה קבוע:</div>
                <div class="detail-value">${order.order_number_permanent || 'טרם הוקצה'}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">מספר הזמנה SAP:</div>
                <div class="detail-value">${order.purchase_order_number_sap || 'טרם הוקצה'}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">נוצר על ידי:</div>
                <div class="detail-value">${order.created_by_name || order.created_by || 'לא ידוע'}</div>
              </div>
              ${order.notes ? `
              <div class="detail-item">
                <div class="detail-label">הערות:</div>
                <div class="detail-value">${order.notes}</div>
              </div>
              ` : ''}
            </div>
          </div>
          
          <h2 style="color: #1f2937;">פריטים בדרישה (${orderItems.length} סה"כ):</h2>
          ${orderItems.length > 0 ? `
          <table>
            <thead>
              <tr>
                <th style="width: 35%;">שם הפריט</th>
                <th style="width: 20%;">מק"ט</th>
                <th style="width: 15%;">כמות מוזמנת</th>
                <th style="width: 15%;">כמות שהתקבלה</th>
                <th style="width: 15%;">יתרה לקבלה</th>
              </tr>
            </thead>
            <tbody>
              ${orderItems.map(item => `
                <tr>
                  <td>${item.reagent_name_snapshot || 'פריט לא ידוע'}</td>
                  <td>${item.reagent_catalog_number_snapshot || '-'}</td>
                  <td>${item.quantity_ordered || 0}</td>
                  <td>${item.quantity_received || 0}</td>
                  <td>${(item.quantity_ordered || 0) - (item.quantity_received || 0)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ` : '<p>אין פריטים בדרישה זו.</p>'}

          <div class="summary-section">
            <h3 style="margin-top: 0; color: #1e40af;">סיכום</h3>
            <div class="summary-grid">
              <div><strong>סה"כ פריטים הוזמנו:</strong> ${totalOrdered}</div>
              <div><strong>סה"כ פריטים התקבלו:</strong> ${totalReceived}</div>
            </div>
          </div>
          
          <div class="footer">
            <div><strong>הודפס על ידי:</strong> ${user.full_name}</div>
            <div><strong>תאריך הדפסה:</strong> ${format(new Date(), 'dd/MM/yyyy בשעה HH:mm', { locale: he })}</div>
            <div>מערכת ניהול מלאי בנק דם</div>
          </div>
        </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('לא ניתן לפתוח חלון הדפסה. אנא בדוק שההגדרות מאפשרות פתיחת חלונות קופצים.');
      }
      
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
      
      toast({
        title: "מוכן להדפסה",
        description: "חלון ההדפסה נפתח. ניתן לשמור כ-PDF או להדפיס",
        variant: "default"
      });

    } catch (error) {
      console.error("Failed to generate print:", error);
      toast({ 
        title: "שגיאה בהכנת ההדפסה", 
        description: error.message || "אירעה שגיאה בהכנת המסמך להדפסה", 
        variant: "destructive" 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (children) {
    return React.cloneElement(children, { onClick: handlePrint, disabled: isGenerating });
  }

  if (iconOnly) {
    return (
      <Button variant="ghost" size="icon" onClick={handlePrint} disabled={isGenerating}>
        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
      </Button>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={handlePrint} disabled={isGenerating}>
      {isGenerating ? (
        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
      ) : (
        <Printer className="h-4 w-4 mr-1" />
      )}
      הדפס
    </Button>
  );
}
