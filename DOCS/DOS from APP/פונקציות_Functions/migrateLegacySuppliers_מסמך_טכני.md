# מסמך טכני - העברת ספקים ישנים

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/migrateLegacySuppliers.js

---

## Implementation

```javascript
async function migrateLegacySuppliers() {
  const supplierEnum = ['ELDAN', 'BIORAD', 'DYN', 'OTHER'];
  const supplierMap = {};
  
  // Create Supplier entities
  for (const name of supplierEnum) {
    const supplier = await Supplier.create({ name });
    supplierMap[name] = supplier.id;
  }
  
  // Update all reagents
  const reagents = await Reagent.list();
  for (const r of reagents) {
    if (r.supplier && !r.current_supplier_id) {
      await Reagent.update(r.id, {
        current_supplier_id: supplierMap[r.supplier]
      });
    }
  }
}
```