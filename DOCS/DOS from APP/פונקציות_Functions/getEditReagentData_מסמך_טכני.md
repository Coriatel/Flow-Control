# מסמך טכני - עריכת ריאגנט - טעינת נתונים

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/getEditReagentData.js

---

# מסמך טכני - getEditReagentData

## Logic

```javascript
const reagent = await Reagent.get(reagent_id);
const catalogItem = reagent.catalog_item_id
  ? await ReagentCatalog.get(reagent.catalog_item_id)
  : null;

const batches = await ReagentBatch.filter({ reagent_id });
const suppliers = await Supplier.filter({ is_active: true });

return {
  reagent,
  catalog_item: catalogItem,
  batches_summary: {
    total: batches.length,
    active: batches.filter(b => b.status === 'active').length,
    expired: batches.filter(b => b.status === 'expired').length
  },
  available_suppliers: suppliers,
  edit_permissions: {
    can_change_supplier: true,
    can_delete: batches.length === 0
  }
};
```