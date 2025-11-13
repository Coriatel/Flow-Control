# מסמך טכני - שחזור קטלוג גלובלי

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/restoreGlobalCatalog.js

---

## Implementation

```javascript
async function restoreGlobalCatalog({ backup_file_url }) {
  const backupData = await fetch(backup_file_url).then(r => r.json());
  
  const restored = [];
  const errors = [];
  
  for (const item of backupData.catalog_items) {
    try {
      await GlobalCatalog.create(item);
      restored.push(item);
    } catch (error) {
      errors.push({ item, error: error.message });
    }
  }
  
  return { restored: restored.length, errors };
}
```