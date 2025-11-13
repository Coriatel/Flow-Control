# מסמך בדיקות - ניקוי ותחזוקה

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/cleanupOperations.js

---

## תרחישי בדיקה

1. **Dry Run**: verify detection without deletion
2. **Actual Cleanup**: verify deletion works
3. **Orphans**: create orphan → cleanup → verify deleted
4. **Old Drafts**: create old draft → cleanup → verify deleted
5. **Safety**: verify active data not touched