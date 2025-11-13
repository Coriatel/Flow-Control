# מסמך טכני - מחיקת ריאגנט

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/deleteReagent.js

---

# מסמך טכני - deleteReagent

## Logic

```javascript
const activeBatches = await ReagentBatch.filter({
  reagent_id,
  status: { $in: ['active', 'quarantine', 'qc_pending'] }
});

if (activeBatches.length > 0) {
  throw new Error(`לא ניתן למחוק - יש ${activeBatches.length} אצוות פעילות`);
}

const activeOrders = await OrderItem.filter({
  reagent_id,
  line_status: { $in: ['open', 'partially_received'] }
});

if (activeOrders.length > 0) {
  throw new Error('לא ניתן למחוק - יש הזמנות פעילות');
}

// Safe deactivation
await Reagent.update(reagent_id, {
  is_active: false,
  deactivation_date: new Date(),
  deactivation_reason: reason || 'deleted_by_user'
});
```