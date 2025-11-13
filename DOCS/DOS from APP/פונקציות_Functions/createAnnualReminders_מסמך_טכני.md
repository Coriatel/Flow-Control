# מסמך טכני - יצירת תזכורות שנתיות

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/createAnnualReminders.js

---

## Implementation

```javascript
async function createAnnualReminders() {
  const year = new Date().getFullYear();
  
  const reminders = [
    {
      title: `ביקורת שנתית ${year}`,
      reminder_date: `${year}-01-15T09:00:00Z`,
      priority: 'high',
      tags: ['audit', 'annual']
    },
    {
      title: 'ארכוב תעודות אנליזה',
      reminder_date: `${year}-12-01T09:00:00Z`,
      priority: 'medium',
      tags: ['archive', 'coa']
    }
  ];
  
  for (const reminder of reminders) {
    await DashboardNote.create({
      ...reminder,
      content: `תזכורת אוטומטית: ${reminder.title}`,
      status: 'active'
    });
  }
}
```