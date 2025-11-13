# מסמך טכני - פעילות אחרונה

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** components/dashboard/RecentActivity.jsx

---

# מסמך טכני - RecentActivity

## Implementation

```jsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { History, ArrowLeft, Truck, ListChecks, Package, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const iconMap = {
  Truck, ListChecks, Package, FileText
};

const RecentActivity = ({ activities }) => {
  return (
    <Card className="bg-white shadow-sm border border-gray-200 rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between py-4 px-6">
        <CardTitle className="flex items-center text-lg font-semibold text-slate-800">
          <div className="bg-slate-50 p-2 rounded-lg mr-2">
            <History className="h-5 w-5 text-slate-600" />
          </div>
          פעולות אחרונות
        </CardTitle>
        <Link 
          to={createPageUrl('ActivityLog')} 
          className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center transition-colors"
        >
          הצג הכל <ArrowLeft className="h-4 w-4 mr-1" />
        </Link>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <ScrollArea className="h-64">
          <div className="space-y-3">
            {activities.length > 0 ? activities.map(activity => {
              const Icon = iconMap[activity.icon] || FileText;
              
              return (
                <div key={activity.id} className="flex items-start text-right space-x-3 space-x-reverse bg-slate-50 p-3 rounded-lg">
                  <div className="text-left flex-shrink-0">
                    <p className="text-xs text-slate-500">
                      {format(new Date(activity.date), 'HH:mm', { locale: he })}
                    </p>
                    <p className="text-xs text-slate-400">
                      {format(new Date(activity.date), 'dd/MM', { locale: he })}
                    </p>
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm text-slate-800 font-medium">{activity.description}</p>
                  </div>
                  <div className={`flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center ${activity.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-8">
                <p className="text-sm text-slate-500">אין פעילות אחרונה</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
```

## Data Source

הנתונים מגיעים מ-`getDashboardData`:

```javascript
const combinedActivity = [
  ...transactions.map(t => ({
    type: t.transaction_type,
    date: parseISO(t.created_date),
    description: `עדכון מלאי: ${t.quantity > 0 ? '+' : ''}${t.quantity} יח'`
  })),
  ...orders.map(o => ({
    type: 'order_created',
    date: parseISO(o.created_date),
    description: `יצירת דרישת רכש ${o.order_number_temp}`
  }))
]
  .sort((a, b) => b.date - a.date)
  .slice(0, 20);
```

## Dependencies

- `@/components/ui/card`
- `@/components/ui/scroll-area`
- `react-router-dom`
- `date-fns`
- `lucide-react`