# מסמך טכני - ייבוא ספירת מלאי מקובץ

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/importInventoryCount.js

---

## Implementation

```javascript
const { file_url } = await base44.integrations.Core.UploadFile({ file });

const { output } = await base44.integrations.Core.ExtractDataFromUploadedFile({
  file_url,
  json_schema: {
    type: 'object',
    properties: {
      rows: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            reagent_name: { type: 'string' },
            batch_number: { type: 'string' },
            quantity: { type: 'number' },
            expiry_date: { type: 'string' }
          }
        }
      }
    }
  }
});

// Match to existing reagents
const matched = [];
const unmatched = [];

for (const row of output.rows) {
  const reagent = await Reagent.filter({ 
    name: { $regex: row.reagent_name, $options: 'i' } 
  }).first();
  
  if (reagent) {
    matched.push({ row, reagent });
  } else {
    unmatched.push(row);
  }
}

return { matched, unmatched };
```