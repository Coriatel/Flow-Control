# מסמך טכני - כרטיס סיכום

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** components/dashboard/SummaryCard.jsx

---

# מסמך טכני - SummaryCard

## Implementation

**קובץ**: `components/dashboard/SummaryCard.jsx`

```jsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import DashboardPopoverContent from './DashboardPopover';

const SummaryCard = ({ icon, title, count, linkTo, color, popoverItems, popoverType }) => {
  const colorClasses = {
    red: {
      bg: 'bg-red-50',
      iconColor: 'text-red-600',
      countColor: 'text-red-700',
      border: 'border-red-200'
    },
    orange: {
      bg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      countColor: 'text-amber-700',
      border: 'border-amber-200'
    },
    blue: {
      bg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      countColor: 'text-blue-700',
      border: 'border-blue-200'
    },
    purple: {
      bg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      countColor: 'text-purple-700',
      border: 'border-purple-200'
    }
  };

  const styles = colorClasses[color] || colorClasses.blue;

  const CardBody = (
    <Card className={`${styles.bg} border ${styles.border} shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 rounded-xl`}>
      <CardContent className="p-4 text-right">
        <div className="mx-auto my-1 pr-5 pl-8 flex items-start justify-between">
          <div className="p-2 rounded-lg">
            {React.cloneElement(icon, { className: `h-5 w-5 ${styles.iconColor}` })}
          </div>
          <div className={`text-3xl font-bold ${styles.countColor}`}>{count}</div>
        </div>
        <h3 className="text-center mt-2 text-sm font-semibold">{title}</h3>
      </CardContent>
    </Card>
  );

  if (popoverItems && popoverItems.length > 0) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button className="w-full text-left">{CardBody}</button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" side="bottom" align="center">
          <DashboardPopoverContent items={popoverItems} type={popoverType} />
        </PopoverContent>
      </Popover>
    );
  }

  return <Link to={createPageUrl(linkTo)}>{CardBody}</Link>;
};

export default SummaryCard;
```

## Dependencies

- `@/components/ui/card`
- `@/components/ui/popover`
- `react-router-dom` (Link)
- `@/utils` (createPageUrl)
- `DashboardPopoverContent` component

## Usage Example

```jsx
<SummaryCard
  icon={<AlertTriangle />}
  title="ריאגנטים קרובים לפג תוקף"
  count={5}
  linkTo="BatchAndExpiryManagement"
  color="red"
  popoverItems={expiringReagents}
  popoverType="expiring"
/>
```