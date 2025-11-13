# מסמך טכני - בדיקת גישה ל-COA

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/testCOAAccess.js

---

## Implementation

```javascript
async function testCOAAccess({ coa_url }) {
  try {
    const response = await fetch(coa_url, { 
      method: 'HEAD',
      timeout: 5000 
    });
    
    return {
      accessible: response.ok,
      status: response.status,
      content_type: response.headers.get('content-type'),
      content_length: response.headers.get('content-length')
    };
  } catch (error) {
    return {
      accessible: false,
      error: error.message
    };
  }
}
```