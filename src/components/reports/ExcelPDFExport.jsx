
import React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { User } from '@/api/entities';

export default function ExcelPDFExport({
  data,
  title = "דוח מערכת",
  columns,
  filename = "report",
  additionalInfo = null,
  loading = false,
  groupBy = null // Support for grouping by field (e.g., 'supplier')
}) {
  const { toast } = useToast();

  // Generate Excel-compatible CSV with proper Hebrew support and grouping
  const generateExcelCSV = async () => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      toast({
        title: "אין נתונים לייצוא",
        description: "לא נמצאו נתונים לייצוא לקובץ Excel",
        variant: "default"
      });
      return;
    }

    if (!columns || !Array.isArray(columns) || columns.length === 0) {
      toast({
        title: "שגיאה בהגדרת הדוח",
        description: "לא הוגדרו עמודות לדוח",
        variant: "destructive"
      });
      return;
    }

    try {
      let currentUser = null;
      try {
        currentUser = await User.me();
      } catch (userError) {
        console.warn("Could not fetch user for export:", userError);
      }

      // UTF-8 BOM for proper Hebrew support in Excel
      let csvContent = "\uFEFF";

      // Add title and metadata
      csvContent += `"${title}"\n`;
      csvContent += `"תאריך הפקה: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: he })}"\n`;
      csvContent += `"הופק על ידי: ${currentUser?.full_name || 'משתמש לא ידוע'} (${currentUser?.email || 'לא זמין'})"\n`;
      if (additionalInfo) {
        csvContent += `"${additionalInfo}"\n`;
      }
      csvContent += "\n";

      if (groupBy) {
        // **ENHANCED: Hierarchical grouped export**
        const grouped = {};
        data.forEach(row => {
          const groupKey = row[groupBy] || 'לא מוגדר';
          if (!grouped[groupKey]) {
            grouped[groupKey] = [];
          }
          grouped[groupKey].push(row);
        });

        // Sort groups alphabetically
        const sortedGroupKeys = Object.keys(grouped).sort((a, b) => a.localeCompare(b, 'he'));

        sortedGroupKeys.forEach((groupKey, groupIndex) => {
          // **Group header with visual separation**
          csvContent += `"=== ${groupKey} ==="\n`;
          csvContent += `"סה\\"כ פריטים: ${grouped[groupKey].length}"\n`;
          csvContent += "\n";

          // Column headers (excluding the groupBy column to avoid redundancy)
          const groupColumns = columns.filter(col => col.accessor !== groupBy);
          const headers = groupColumns.map(col => `"${col.header || col.label || 'עמודה'}"`).join(',');
          csvContent += headers + '\n';

          // Data rows for this group
          grouped[groupKey].forEach(row => {
            const rowData = groupColumns.map(col => {
              let cellValue = '';

              if (col.accessor) {
                cellValue = row[col.accessor];
              } else if (col.render && typeof col.render === 'function') {
                try {
                  cellValue = col.render(row);
                } catch (renderError) {
                  console.warn('Error in column render function:', renderError);
                  cellValue = '';
                }
              }

              if (cellValue === null || cellValue === undefined) {
                cellValue = '';
              } else if (typeof cellValue === 'object') {
                cellValue = JSON.stringify(cellValue);
              } else {
                cellValue = String(cellValue);
              }

              // Escape quotes for CSV
              return `"${cellValue.replace(/"/g, '""')}"`;
            });
            csvContent += rowData.join(',') + '\n';
          });

          // Add spacing between groups (except for the last group)
          if (groupIndex < sortedGroupKeys.length - 1) {
            csvContent += '\n';
          }
        });
      } else {
        // Regular non-grouped export
        const headers = columns.map(col => `"${col.header || col.label || 'עמודה'}"`).join(',');
        csvContent += headers + '\n';

        data.forEach(row => {
          const rowData = columns.map(col => {
            let cellValue = '';

            if (col.accessor) {
              cellValue = row[col.accessor];
            } else if (col.render && typeof col.render === 'function') {
              try {
                cellValue = col.render(row);
              } catch (renderError) {
                console.warn('Error in column render function:', renderError);
                cellValue = '';
              }
            }

            if (cellValue === null || cellValue === undefined) {
              cellValue = '';
            } else if (typeof cellValue === 'object') {
              cellValue = JSON.stringify(cellValue);
            } else {
              cellValue = String(cellValue);
            }

            return `"${cellValue.replace(/"/g, '""')}"`;
          });
          csvContent += rowData.join(',') + '\n';
        });
      }

      // **Add summary section**
      csvContent += '\n';
      csvContent += `"=== סיכום ==="\n`;
      csvContent += `"סה\\"כ רשומות: ${data.length}"\n`;
      if (groupBy) {
        const uniqueGroups = [...new Set(data.map(row => row[groupBy]))].length;
        csvContent += `"מספר קבוצות: ${uniqueGroups}"\n`;
      }
      csvContent += `"הופק בתאריך: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: he })}"\n`;

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}_${format(new Date(), 'dd_MM_yyyy')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "קובץ Excel הופק בהצלחה",
        description: `הקובץ "${filename}_${format(new Date(), 'dd_MM_yyyy')}.csv" נשמר בתיקיית ההורדות`,
        variant: "default"
      });

    } catch (error) {
      console.error('Error generating Excel export:', error);
      toast({
        title: "שגיאה בהפקת קובץ Excel",
        description: error.message || "אירעה שגיאה בהפקת הקובץ",
        variant: "destructive"
      });
    }
  };

  // Generate print-friendly PDF (via browser print) with grouping
  const generatePDF = async () => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      toast({
        title: "אין נתונים לייצוא",
        description: "לא נמצאו נתונים לייצוא ל-PDF",
        variant: "default"
      });
      return;
    }

    if (!columns || !Array.isArray(columns) || columns.length === 0) {
      toast({
        title: "שגיאה בהגדרת הדוח",
        description: "לא הוגדרו עמודות לדוח",
        variant: "destructive"
      });
      return;
    }

    try {
      let currentUser = null;
      try {
        currentUser = await User.me();
      } catch (userError) {
        console.warn("Could not fetch user for PDF export:", userError);
      }

      let tableContent = '';

      if (groupBy) {
        // Grouped PDF content
        const grouped = {};
        data.forEach(row => {
          const groupKey = row[groupBy] || 'לא מוגדר'; // Ensure a group key even if null/undefined
          if (!grouped[groupKey]) {
            grouped[groupKey] = [];
          }
          grouped[groupKey].push(row);
        });

        Object.keys(grouped).sort((a, b) => a.localeCompare(b, 'he')).forEach(groupKey => {
          tableContent += `
            <div class="group-header">
              <h3>${groupKey}</h3>
              <p class="group-summary">סה"כ פריטים: ${grouped[groupKey].length}</p>
            </div>
            <table class="group-table">
              <thead>
                <tr>
                  ${columns.filter(col => col.accessor !== groupBy).map(col => `<th>${col.header || col.label || 'עמודה'}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${grouped[groupKey].map(row => `
                  <tr>
                    ${columns.filter(col => col.accessor !== groupBy).map(col => {
                      let cellValue = '';

                      try {
                        if (col.accessor) {
                          cellValue = row[col.accessor];
                        } else if (col.render && typeof col.render === 'function') {
                          cellValue = col.render(row);
                        }
                      } catch (renderError) {
                        console.warn('Error rendering cell value:', renderError);
                        cellValue = '';
                      }

                      if (cellValue === null || cellValue === undefined) cellValue = '';
                      return `<td>${String(cellValue)}</td>`;
                    }).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="group-spacer"></div>
          `;
        });
      } else {
        // Regular table content
        tableContent = `
          <table>
            <thead>
              <tr>
                ${columns.map(col => `<th>${col.header || col.label || 'עמודה'}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${data.map(row => `
                <tr>
                  ${columns.map(col => {
                    let cellValue = '';

                    try {
                      if (col.accessor) {
                        cellValue = row[col.accessor];
                      } else if (col.render && typeof col.render === 'function') {
                        cellValue = col.render(row);
                      }
                    } catch (renderError) {
                      console.warn('Error rendering cell value:', renderError);
                      cellValue = '';
                    }

                    if (cellValue === null || cellValue === undefined) cellValue = '';
                    return `<td>${String(cellValue)}</td>`;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      }

      // Add summary section for PDF
      const pdfSummaryContent = `
        <div class="summary-section">
          <h3>=== סיכום ===</h3>
          <p>סה"כ רשומות: ${data.length}</p>
          ${groupBy ? `<p>מספר קבוצות: ${[...new Set(data.map(row => row[groupBy]))].length}</p>` : ''}
          <p>הופק בתאריך: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: he })}</p>
        </div>
      `;


      // Create print-friendly HTML
      const printContent = `
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
          <title>${title}</title>
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
              border-bottom: 2px solid #1f2937;
              padding-bottom: 15px;
            }
            h1 {
              color: #1f2937;
              margin-bottom: 5px;
              font-size: 20px;
            }
            .metadata {
              color: #6b7280;
              font-size: 11px;
              line-height: 1.4;
            }
            .user-info {
              background-color: #f9fafb;
              padding: 8px;
              border-radius: 4px;
              margin: 10px 0;
              font-size: 10px;
            }
            .group-header {
              margin-top: 25px;
              margin-bottom: 10px;
              padding: 8px 12px;
              background-color: #f3f4f6;
              border-radius: 6px;
              border-right: 4px solid #3b82f6;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .group-header h3 {
              margin: 0;
              color: #1f2937;
              font-size: 14px;
              font-weight: 600;
            }
            .group-summary {
              font-size: 10px;
              color: #6b7280;
              margin: 0;
            }
            .group-table, table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
              font-size: 9px;
            }
            .group-spacer {
              height: 15px;
            }
            th, td {
              border: 1px solid #d1d5db;
              padding: 4px 6px;
              text-align: right;
              word-wrap: break-word;
            }
            th {
              background-color: #f3f4f6;
              font-weight: bold;
              font-size: 10px;
            }
            tr:nth-child(even) {
              background-color: #f9fafb;
            }
            .summary-section {
              margin-top: 30px;
              padding: 15px;
              background-color: #e0f2fe; /* Light blue */
              border-left: 5px solid #3b82f6; /* Accent blue */
              border-radius: 4px;
              font-size: 11px;
            }
            .summary-section h3 {
              margin-top: 0;
              margin-bottom: 10px;
              color: #1f2937;
              font-size: 14px;
            }
            .summary-section p {
              margin: 5px 0;
              color: #374151;
            }
            .footer {
              margin-top: 25px;
              text-align: center;
              font-size: 9px;
              color: #6b7280;
              border-top: 1px solid #d1d5db;
              padding-top: 10px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${title}</h1>
            <div class="metadata">
              תאריך הפקה: ${format(new Date(), 'dd/MM/yyyy בשעה HH:mm', { locale: he })}
              ${additionalInfo ? `<br/>${additionalInfo}` : ''}
            </div>
            <div class="user-info">
              <strong>הופק על ידי:</strong> ${currentUser?.full_name || 'משתמש לא ידוע'} (${currentUser?.email || 'לא זמין'})
            </div>
          </div>

          ${tableContent}

          ${pdfSummaryContent}

          <div class="footer">
            <div>מערכת ניהול מלאי בנק דם</div>
            <div>דוח זה הופק בתאריך ${format(new Date(), 'dd/MM/yyyy בשעה HH:mm', { locale: he })}</div>
            <div>על ידי: ${currentUser?.full_name || 'משתמש לא ידוע'} | ${currentUser?.role === 'admin' ? 'מנהל מערכת' : 'משתמש'}</div>
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
      printWindow.focus(); // focus on the new window

      // Give the browser a moment to render content before printing
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);

      toast({
        title: "PDF מוכן להדפסה",
        description: "חלון ההדפסה נפתח. ניתן לשמור כ-PDF או להדפיס",
        variant: "default"
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "שגיאה בהפקת PDF",
        description: error.message || "אירעה שגיאה בהפקת הקובץ",
        variant: "destructive"
      });
    }
  };


  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={generateExcelCSV}
        disabled={loading || !data || !Array.isArray(data) || data.length === 0}
        className="flex items-center gap-2"
        title="ייצא לקובץ Excel עם תמיכה מלאה בעברית"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-4 w-4" />
        )}
        Excel
      </Button>

      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={loading || !data || !Array.isArray(data) || data.length === 0}
            className="flex items-center gap-2"
            title="ייצא לקובץ PDF מעוצב"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            PDF
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ייצוא ל-PDF</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>הפקת קובץ PDF עם עיצוב מותאם עברית</p>
            <Button onClick={() => toast({ title: "בפיתוח", description: "תכונה זו בפיתוח", variant: "default" })}>
              הפק PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
