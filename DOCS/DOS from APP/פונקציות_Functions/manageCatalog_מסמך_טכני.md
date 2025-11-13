# מסמך טכני - ניהול קטלוג

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/manageCatalog.js

---

## Implementation

```javascript
async function manageCatalog({ action, data }) {
  switch (action) {
    case 'create':
      // Validate unique catalog_number
      const exists = await ReagentCatalog.filter({
        catalog_number: data.catalog_number
      }).first();
      
      if (exists) {
        throw new Error('מק"ט כבר קיים');
      }
      
      return await ReagentCatalog.create(data);
    
    case 'update':
      return await ReagentCatalog.update(data.id, data);
    
    case 'deactivate':
      return await ReagentCatalog.update(data.id, {
        active: false
      });
  }
}
```