# מסמך טכני - שחזור קטלוג גלובלי מקטלוג מקומי

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/restoreGlobalCatalogFromLocal.js

---

## Implementation

```javascript
async function restoreGlobalFromLocal() {
  const allLocalCatalogs = await ReagentCatalog.list();
  
  // Deduplicate by catalog_number
  const uniqueMap = {};
  for (const item of allLocalCatalogs) {
    if (!uniqueMap[item.catalog_number]) {
      uniqueMap[item.catalog_number] = item;
    }
  }
  
  // Create global entries
  for (const item of Object.values(uniqueMap)) {
    await GlobalCatalog.create({
      name: item.name,
      catalog_number: item.catalog_number,
      supplier: item.supplier,
      category: item.category
    });
  }
}
```