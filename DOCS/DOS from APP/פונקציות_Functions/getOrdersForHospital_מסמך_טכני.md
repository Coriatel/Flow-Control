# מסמך טכני - הזמנות לפי בית חולים

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/getOrdersForHospital.js

---

## Implementation

```javascript
async function getOrdersForHospital() {
  const user = await base44.auth.me();
  const hospital_id = user.hospital_id;
  
  if (!hospital_id) {
    throw new Error('משתמש לא משויך לבית חולים');
  }
  
  const orders = await Order.filter({
    hospital_id: hospital_id
  });
  
  return { orders, hospital_id };
}
```