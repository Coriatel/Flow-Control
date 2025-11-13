# מסמך טכני - כרטיס ריאגנט

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** components/inventory/ReagentItem.jsx

---

# מסמך טכני - ReagentItem

## Component Structure

**קובץ**: `components/inventory/ReagentItem.jsx`  
**Type**: Presentational Component  
**Dependencies**: UI components (Card, Badge), icons (Lucide)

## Props Interface

```typescript
interface ReagentItemProps {
  reagent: {
    id: string;
    name: string;
    category: string;
    supplier: string;
    total_quantity_all_batches: number;
    active_batches_count: number;
    nearest_expiry_date: string;
    current_stock_status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstocked';
    months_of_stock: number;
  };
  onClick?: (reagent) => void;
  showActions?: boolean;
  compact?: boolean;
}
```

## Implementation

```jsx
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Beaker, Calendar, Package, AlertTriangle } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';

export default function ReagentItem({ reagent, onClick, showActions = true, compact = false }) {
  const statusColors = {
    in_stock: 'bg-green-50 border-green-200 text-green-800',
    low_stock: 'bg-amber-50 border-amber-200 text-amber-800',
    out_of_stock: 'bg-red-50 border-red-200 text-red-800',
    overstocked: 'bg-blue-50 border-blue-200 text-blue-800'
  };
  
  const daysToExpiry = reagent.nearest_expiry_date
    ? differenceInDays(parseISO(reagent.nearest_expiry_date), new Date())
    : null;
  
  const expiryWarning = daysToExpiry !== null && daysToExpiry <= 30;
  
  return (
    <Card 
      className={`${statusColors[reagent.current_stock_status]} border-r-4 cursor-pointer hover:shadow-md transition-shadow`}
      onClick={() => onClick?.(reagent)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Beaker className="h-5 w-5" />
              <h3 className="font-semibold text-lg">{reagent.name}</h3>
            </div>
            
            {!compact && (
              <div className="mt-2 space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <span>{reagent.total_quantity_all_batches} יח' | {reagent.active_batches_count} אצוות</span>
                </div>
                
                {reagent.nearest_expiry_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>תפוגה: {format(parseISO(reagent.nearest_expiry_date), 'dd/MM/yyyy')}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <span className="font-medium">{reagent.months_of_stock.toFixed(1)} חודשי מלאי</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex flex-col items-end gap-2">
            {expiryWarning && (
              <Badge className={daysToExpiry < 14 ? 'bg-red-600' : 'bg-amber-600'}>
                <AlertTriangle className="h-3 w-3 ml-1" />
                פג בעוד {daysToExpiry} ימים
              </Badge>
            )}
            
            <Badge variant="outline">{reagent.supplier}</Badge>
            <Badge variant="outline">{reagent.category}</Badge>
          </div>
        </div>
        
        {showActions && (
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="outline">ערוך</Button>
            <Button size="sm" variant="outline">אצוות</Button>
            {reagent.current_stock_status === 'low_stock' && (
              <Button size="sm" className="bg-blue-600">הזמן</Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

## קבצים קשורים
- `pages/ManageReagents.js` - משתמש ברכיב
- `pages/InventoryCount.js` - משתמש בגרסה compact