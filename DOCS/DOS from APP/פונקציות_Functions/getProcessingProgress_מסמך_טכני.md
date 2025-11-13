# מסמך טכני - מעקב התקדמות עיבוד

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/getProcessingProgress.js

---

## ארכיטקטורה

```javascript
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { process_id } = await req.json();
  
  // Get from in-memory store or database
  const progress = await base44.asServiceRole.functions.invoke('getProgress', {
    key: process_id
  });
  
  return Response.json({
    process_id,
    total: progress.total,
    current: progress.current,
    percentage: Math.round((progress.current / progress.total) * 100),
    status: progress.status,
    errors: progress.errors || [],
    estimated_time_remaining: calculateETA(progress)
  });
});
```

## מנגנון

- **Storage**: Redis/in-memory for real-time updates
- **Update Pattern**: increment on each batch
- **Polling**: frontend polls every 500ms
- **Cleanup**: auto-delete after 1 hour