# מסמך טכני - שינוי ספק ריאגנט

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/changeReagentSupplier.js

---

# מסמך טכני - changeReagentSupplier

## Logic

```javascript
const reagent = await Reagent.get(reagent_id);
const newSupplier = await Supplier.get(new_supplier_id);

const historicalEntry = {
  supplier_id: reagent.current_supplier_id,
  supplier_name: reagent.supplier,
  from_date: reagent.supplier_change_date || reagent.created_date,
  to_date: new Date().toISOString().split('T')[0],
  change_reason: reason
};

const updatedHistory = [
  ...(reagent.historical_suppliers || []),
  historicalEntry
];

await Reagent.update(reagent_id, {
  current_supplier_id: new_supplier_id,
  supplier: newSupplier.name,
  historical_suppliers: updatedHistory,
  supplier_change_date: new Date().toISOString().split('T')[0]
});
```