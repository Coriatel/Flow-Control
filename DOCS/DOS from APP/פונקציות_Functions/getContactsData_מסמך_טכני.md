# מסמך טכני - טעינת נתוני אנשי קשר

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/getContactsData.js

---

# מסמך טכני - getContactsData

## Logic

```javascript
const contacts = await SupplierContact.filter(
  { is_active: true, ...filters },
  'supplier'
);

return { contacts };
```