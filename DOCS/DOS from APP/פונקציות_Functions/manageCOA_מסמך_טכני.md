# מסמך טכני - ניהול תעודות אנליזה

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/manageCOA.js

---

# מסמך טכני - manageCOA

## ארכיטקטורה

**קובץ**: `functions/manageCOA.js`  
**Storage**: Base44 Public Storage (UploadFile integration)

### Actions:
1. `upload` - העלאת COA חדש
2. `update` - עדכון COA קיים
3. `delete` - מחיקת COA
4. `get` - קבלת URL לצפייה

## Implementation

```javascript
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  const formData = await req.formData();
  const action = formData.get('action');
  const batch_id = formData.get('batch_id');
  const file = formData.get('file');
  
  switch (action) {
    case 'upload':
      // 1. Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      // 2. Update batch
      await base44.asServiceRole.entities.ReagentBatch.update(batch_id, {
        coa_document_url: file_url,
        coa_uploaded_by: user.email,
        coa_upload_date: new Date()
      });
      
      return Response.json({ success: true, file_url });
    
    case 'delete':
      await base44.asServiceRole.entities.ReagentBatch.update(batch_id, {
        coa_document_url: null,
        coa_uploaded_by: null,
        coa_upload_date: null
      });
      
      return Response.json({ success: true });
  }
});
```

## ישויות מעורבות

### Write:
1. **ReagentBatch** - עדכון coa_document_url, coa_uploaded_by, coa_upload_date

### Integrations:
1. **Core.UploadFile** - העלאת הקובץ

## Performance

- File upload: ~2-5 seconds for 2MB PDF
- Update batch: ~100ms
- Total: ~2-5 seconds

## Error Handling

```javascript
try {
  // ... upload logic
} catch (error) {
  if (error.message.includes('file too large')) {
    return Response.json({ error: 'קובץ גדול מדי (מקס 10MB)' }, { status: 400 });
  }
  return Response.json({ error: error.message }, { status: 500 });
}
```