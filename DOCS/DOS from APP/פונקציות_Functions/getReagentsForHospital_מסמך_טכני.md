# מסמך טכני - ריאגנטים לפי בית חולים

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/getReagentsForHospital.js

---

## Implementation

```javascript
const user = await base44.auth.me();
const hospital_id = user.hospital_id;

const reagents = await Reagent.filter({ hospital_id });
const batches = await ReagentBatch.filter({
  reagent_id: { $in: reagents.map(r => r.id) }
});

return { reagents, batches };
```