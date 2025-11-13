# מסמך טכני - ייצוא כל תעודות האנליזה

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/exportAllCoas.js

---

# מסמך טכני - exportAllCoas

## Logic

```javascript
const batches = await ReagentBatch.filter({
  coa_document_url: { $ne: null },
  status: 'active',
  received_date: year ? { 
    $gte: `${year}-01-01`,
    $lte: `${year}-12-31` 
  } : undefined
});

const zip = new JSZip();

for (const batch of batches) {
  const reagent = await Reagent.get(batch.reagent_id);
  const folderPath = `${reagent.supplier}/${reagent.name}`;
  const fileName = `${batch.batch_number}_${batch.expiry_date}.pdf`;
  
  const response = await fetch(batch.coa_document_url);
  const fileData = await response.arrayBuffer();
  
  zip.folder(folderPath).file(fileName, fileData);
}

const zipBlob = await zip.generateAsync({ type: 'blob' });
return { zipBlob, totalCoas: batches.length };
```