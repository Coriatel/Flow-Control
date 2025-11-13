# מסמך טכני - ייבוא אנשי קשר מקובץ

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/uploadContactsFile.js

---

## Implementation

```javascript
const { output } = await base44.integrations.Core.ExtractDataFromUploadedFile({
  file_url,
  json_schema: {
    type: 'object',
    properties: {
      contacts: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            supplier: { type: 'string' },
            full_name: { type: 'string' },
            contact_type: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string' }
          }
        }
      }
    }
  }
});

for (const contact of output.contacts) {
  await SupplierContact.create({
    supplier: contact.supplier,
    full_name: contact.full_name,
    contact_type: contact.contact_type || 'general',
    phone: contact.phone,
    email: contact.email
  });
}
```