# מסמך טכני - יצירת דוחות

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/generateReports.js

---

## Implementation

```javascript
async function generateReport({ 
  report_type, 
  start_date, 
  end_date, 
  format = 'excel' 
}) {
  let data = [];
  
  switch (report_type) {
    case 'inventory_movement':
      data = await InventoryTransaction.filter({
        created_date: { $gte: start_date, $lte: end_date }
      });
      break;
    
    case 'orders_summary':
      const orders = await Order.filter({
        order_date: { $gte: start_date, $lte: end_date }
      });
      data = await enrichOrdersWithItems(orders);
      break;
  }
  
  if (format === 'excel') {
    return generateExcel(data);
  } else if (format === 'pdf') {
    return generatePDF(data);
  }
}
```