
import React from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function QAPrintLayout({ data, columns, filters, title }) {
  // Derive visible columns from the provided columns prop
  const visibleColumns = columns.filter(c => c.isVisible);

  // Helper function to format quantities with a fixed number of decimal places
  const formatQuantity = (value, decimals = 2) => {
    if (value === null || value === undefined) return 'N/A';
    // Use toFixed to ensure consistent decimal places, then parseFloat to remove trailing zeros if possible,
    // but parseFloat can lose precision if not careful. For print, direct toFixed is usually fine.
    return parseFloat(value).toFixed(decimals); 
  };

  const formatCellForPrint = (item, column) => {
    const value = item[column.accessor];
    
    switch (column.accessor) {
      case 'expiry_date':
      case 'received_date': // Renamed from receipt_date in outline to match current model
      case 'first_use_date':
      case 'manufacture_date':
        if (!value) return 'N/A';
        try {
          return format(new Date(value), 'dd/MM/yyyy');
        } catch {
          return 'N/A';
        }
      case 'coa_documents': // Renamed from coa_status in outline to match current model
        return item.coa_documents?.length > 0 ? 'יש COA' : 'אין COA';
      case 'current_quantity':
      case 'initial_quantity':
      case 'receipt_quantity': // Added receipt_quantity for formatting if it's a displayed column
        return value ? `${formatQuantity(value)}` : '0';
      case 'status':
        const statusLabels = {
          active: 'פעיל',
          expired: 'פג תוקף',
          quarantine: 'הסגר',
          consumed: 'נצרך',
        };
        return statusLabels[value] || value || 'לא ידוע';
      default:
        return value || 'N/A';
    }
  };

  // NEW: Handle empty data
  if (!data || data.length === 0) {
    return (
      <div id="print-content" style={{ display: 'none' }}>
        <div className="print-container">
          <div className="print-header">
            <h1 className="print-title">{title || 'דוח בקרת איכות אצוות'}</h1>
            <div className="print-subtitle">אין נתונים להדפסה</div>
          </div>
        </div>
      </div>
    );
  }

  // NEW: Calculate totals for summary row and summary statistics
  const totals = data.reduce((acc, item) => {
    // Ensure that receipt_quantity and current_quantity are parsed as numbers
    const receiptQuantity = parseFloat(item.receipt_quantity) || 0;
    const currentQuantity = parseFloat(item.current_quantity) || 0;
    
    return {
      totalReceiptQuantity: acc.totalReceiptQuantity + receiptQuantity,
      totalCurrentQuantity: acc.totalCurrentQuantity + currentQuantity,
      totalItems: acc.totalItems + 1
    };
  }, {
    totalReceiptQuantity: 0,
    totalCurrentQuantity: 0,
    totalItems: 0
  });

  return (
    <div id="print-content" style={{ display: 'none' }}>
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 0.5cm;
          }
          
          body { 
            font-family: Arial, sans-serif; 
            font-size: 8pt;
            line-height: 1.2;
            direction: rtl;
          }
          
          .print-container {
            width: 100%;
            max-width: none;
          }
          
          .print-header {
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
          }
          
          .print-title {
            font-size: 14pt;
            font-weight: bold;
            margin: 0;
          }
          
          .print-subtitle {
            font-size: 9pt;
            color: #666;
            margin: 5px 0;
          }
          
          .print-filters {
            font-size: 7pt;
            color: #888;
            margin-bottom: 10px;
            text-align: right;
          }
          
          .print-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 7pt;
          }
          
          .print-table th {
            background-color: #f5f5f5;
            border: 1px solid #ccc;
            padding: 4px 3px;
            text-align: center;
            font-weight: bold;
            white-space: nowrap;
          }
          
          .print-table td {
            border: 1px solid #ccc;
            padding: 3px 2px;
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .print-table tr:nth-child(even) {
            background-color: #fafafa;
          }
          
          .print-table .reagent-name {
            text-align: right;
            font-weight: bold;
          }
          
          .print-footer {
            position: fixed;
            bottom: 0.5cm;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 7pt;
            color: #888;
            border-top: 1px solid #ccc;
            padding-top: 5px;
          }
          
          /* Hide non-print elements */
          .no-print { display: none !important; }

          /* NEW: Summary Row & Section Styles */
          .print-summary-row {
            background-color: #f8f9fa !important;
            border-top: 2px solid #333 !important;
            font-weight: bold;
          }
          
          .print-summary-cell {
            background-color: #f8f9fa !important;
            font-weight: bold !important;
            text-align: center;
            border: 1px solid #333 !important;
            padding: 8px !important;
          }
          
          .print-summary-section {
            margin-top: 20px;
            padding: 15px;
            border: 1px solid #ddd;
            background-color: #f8f9fa;
          }
          
          .print-summary-section h3 {
            margin: 0 0 10px 0;
            font-size: 16px;
            color: #333;
          }
          
          .print-summary-stats {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
            font-size: 14px;
          }
          
          .print-summary-stats div {
            padding: 4px 0;
          }
        }
      `}</style>
      
      <div className="print-container">
        <div className="print-header">
          <h1 className="print-title">{title || 'דוח בקרת איכות אצוות'}</h1>
          <div className="print-subtitle">
            נוצר בתאריך: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: he })}
          </div>
          <div className="print-subtitle">
            סה"כ {data.length} אצוות
          </div>
        </div>
        
        {(filters?.searchTerm || filters?.dateFrom || filters?.dateTo) && (
          <div className="print-filters">
            <strong>פילטרים מופעלים:</strong>
            {filters.searchTerm && ` חיפוש: "${filters.searchTerm}"`}
            {filters.dateFrom && ` מתאריך: ${format(new Date(filters.dateFrom), 'dd/MM/yyyy')}`}
            {filters.dateTo && ` עד תאריך: ${format(new Date(filters.dateTo), 'dd/MM/yyyy')}`}
          </div>
        )}
        
        <table className="print-table">
          <thead>
            <tr>
              {visibleColumns.map(column => (
                <th key={column.accessor}>
                  {column.Header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={item.id || index} className="print-row">
                {visibleColumns.map(column => (
                  <td 
                    key={column.accessor}
                    className={column.accessor === 'reagent_name' ? 'reagent-name' : ''}
                  >
                    {formatCellForPrint(item, column)}
                  </td>
                ))}
              </tr>
            ))}
            
            {/* NEW: Summary Row */}
            <tr className="print-summary-row">
              {visibleColumns.map((column, colIndex) => {
                if (column.accessor === 'reagent_name') {
                  return (
                    <td key={`summary-${colIndex}`} className="print-summary-cell">
                      <strong>סה"כ:</strong>
                    </td>
                  );
                } else if (column.accessor === 'receipt_quantity') {
                  return (
                    <td key={`summary-${colIndex}`} className="print-summary-cell">
                      <strong>{formatQuantity(totals.totalReceiptQuantity)}</strong>
                    </td>
                  );
                } else if (column.accessor === 'current_quantity') {
                  return (
                    <td key={`summary-${colIndex}`} className="print-summary-cell">
                      <strong>{formatQuantity(totals.totalCurrentQuantity)}</strong>
                    </td>
                  );
                } else {
                  return <td key={`summary-${colIndex}`} className="print-cell"></td>;
                }
              })}
            </tr>
          </tbody>
        </table>
        
        {/* NEW: Summary Statistics */}
        <div className="print-summary-section">
          <h3>סיכום נתונים:</h3>
          <div className="print-summary-stats">
            <div>סה"כ פריטים: <strong>{totals.totalItems}</strong></div>
            <div>סה"כ כמות שהתקבלה: <strong>{formatQuantity(totals.totalReceiptQuantity)}</strong></div>
            <div>סה"כ כמות נוכחית: <strong>{formatQuantity(totals.totalCurrentQuantity)}</strong></div>
            <div>
              אחוז ניצול: <strong>
                {totals.totalReceiptQuantity > 0 
                  ? `${formatQuantity((totals.totalCurrentQuantity / totals.totalReceiptQuantity) * 100)}%` 
                  : '0.00%'}
              </strong>
            </div>
          </div>
        </div>

        <div className="print-footer">
          דוח בקרת איכות אצוות - מערכת ניהול מלאי ריאגנטים | עמוד {'{PAGE}'} מתוך {'{PAGES}'}
        </div>
      </div>
    </div>
  );
}
