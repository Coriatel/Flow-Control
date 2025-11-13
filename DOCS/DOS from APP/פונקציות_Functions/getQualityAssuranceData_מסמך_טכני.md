# מסמך טכני - בקרת איכות - טעינת נתונים

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/getQualityAssuranceData.js

---

# מסמך טכני - getQualityAssuranceData

## Logic

```javascript
const batches = await ReagentBatch.list();

const enriched = batches.map(b => {
  const daysInQuarantine = b.status === 'quarantine'
    ? differenceInDays(new Date(), parseISO(b.received_date))
    : 0;
  
  const actionRequired = [];
  if (b.requires_coa && !b.coa_document_url) {
    actionRequired.push('upload_coa');
  }
  if (b.qc_status === 'pending') {
    actionRequired.push('perform_qc');
  }
  
  return {
    ...b,
    days_in_quarantine: daysInQuarantine,
    has_coa: !!b.coa_document_url,
    action_required: actionRequired
  };
});

const statistics = {
  in_quarantine: enriched.filter(b => b.status === 'quarantine').length,
  qc_pending: enriched.filter(b => b.qc_status === 'pending').length,
  missing_coas: enriched.filter(b => b.requires_coa && !b.has_coa).length,
  qc_passed: enriched.filter(b => b.qc_status === 'passed').length
};

return { batches: enriched, statistics };
```