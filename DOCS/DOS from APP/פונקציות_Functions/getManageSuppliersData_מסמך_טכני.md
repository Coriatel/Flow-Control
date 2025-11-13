# מסמך טכני - ניהול ספקים - טעינת נתונים

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/getManageSuppliersData.js

---

# מסמך טכני - getManageSuppliersData

## Logic

```javascript
const suppliers = await Supplier.filter({ is_active: true });

const enriched = await Promise.all(
  suppliers.map(async s => {
    const [reagents, orders] = await Promise.all([
      Reagent.filter({ current_supplier_id: s.id }),
      Order.filter({ 
        supplier_name_snapshot: s.name,
        status: { $nin: ['closed', 'cancelled'] }
      })
    ]);
    
    return {
      ...s,
      reagents_count: reagents.length,
      active_orders_count: orders.length
    };
  })
);
```