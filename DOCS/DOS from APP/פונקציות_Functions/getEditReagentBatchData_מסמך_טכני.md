# מסמך טכני - עריכת אצווה - טעינת נתונים

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/getEditReagentBatchData.js

---

# מסמך טכני - getEditReagentBatchData

## Logic

```javascript
const batch = await ReagentBatch.get(batch_id);
const reagent = await Reagent.get(batch.reagent_id);

return {
  batch,
  reagent_context: {
    reagent_id: reagent.id,
    reagent_name: reagent.name,
    requires_coa: reagent.requires_coa,
    requires_qc: true
  },
  coa_status: {
    has_coa: !!batch.coa_document_url,
    required: reagent.requires_coa,
    uploaded_by: batch.coa_uploaded_by,
    uploaded_date: batch.coa_upload_date
  },
  qc_status: batch.qc_status,
  edit_permissions: {
    can_change_quantity: batch.status !== 'consumed',
    can_change_expiry: batch.status === 'quarantine',
    can_delete: batch.current_quantity === 0
  }
};
```