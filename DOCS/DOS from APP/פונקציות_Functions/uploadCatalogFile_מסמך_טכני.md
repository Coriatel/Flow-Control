# מסמך טכני - ייבוא קטלוג מקובץ

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/uploadCatalogFile.js

---

## Implementation

```javascript
const { output } = await ExtractDataFromUploadedFile({
  file_url,
  json_schema: catalogSchema
});

for (const item of output.items) {
  // Check duplicates
  const existing = await ReagentCatalog.filter({
    catalog_number: item.catalog_number
  }).first();
  
  if (existing) {
    duplicates.push(item);
    continue;
  }
  
  await ReagentCatalog.create({
    name: item.name,
    catalog_number: item.catalog_number,
    supplier: item.supplier,
    category: item.category,
    unit_of_measure: item.unit
  });
  
  created.push(item);
}

return { created, duplicates, errors };
```