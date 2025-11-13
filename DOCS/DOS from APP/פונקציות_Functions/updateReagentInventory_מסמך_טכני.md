# מסמך טכני - עדכון מלאי ריאגנט

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/updateReagentInventory.js

---

## Implementation

```javascript
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { reagent_id } = await req.json();
  
  const [reagent, batches] = await Promise.all([
    base44.asServiceRole.entities.Reagent.get(reagent_id),
    base44.asServiceRole.entities.ReagentBatch.filter({ 
      reagent_id, 
      status: 'active' 
    })
  ]);
  
  // Calculate
  const summary = calculateReagentSummary(reagent, batches);
  
  // Update
  await base44.asServiceRole.entities.Reagent.update(reagent_id, summary);
  
  return Response.json({ success: true, summary });
});
```