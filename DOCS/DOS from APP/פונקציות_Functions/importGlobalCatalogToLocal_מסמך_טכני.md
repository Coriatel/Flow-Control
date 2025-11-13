# מסמך טכני - ייבוא קטלוג גלובלי למקומי

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/importGlobalCatalogToLocal.js

---

## Implementation

```javascript
async function importFromGlobal({ global_item_ids }) {
  for (const global_id of global_item_ids) {
    const globalItem = await GlobalCatalog.get(global_id);
    
    // Create local catalog entry
    const catalogItem = await ReagentCatalog.create({
      name: globalItem.name,
      catalog_number: globalItem.catalog_number,
      supplier: globalItem.supplier,
      category: globalItem.category,
      unit_of_measure: globalItem.unit
    });
    
    // Create local reagent
    await Reagent.create({
      catalog_item_id: catalogItem.id,
      name: globalItem.name,
      category: globalItem.category,
      supplier: globalItem.supplier
    });
  }
}
```