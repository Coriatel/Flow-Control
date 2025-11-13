# מסמך טכני - מעבר למודל קטלוג היברידי

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/migrateToHybridCatalog.js

---

## Implementation

```javascript
async function migrateToHybridCatalog() {
  const reagents = await Reagent.list();
  
  for (const r of reagents) {
    // Create catalog entry
    const catalogItem = await ReagentCatalog.create({
      name: r.name,
      catalog_number: r.catalog_number,
      supplier: r.supplier,
      category: r.category,
      unit_of_measure: r.unit_of_measure || 'ml'
    });
    
    // Link to reagent
    await Reagent.update(r.id, {
      catalog_item_id: catalogItem.id
    });
  }
}
```