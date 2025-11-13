# מסמך טכני - כפתור חזרה

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** components/ui/BackButton.jsx

---

# מסמך טכני - BackButton

## Implementation

```jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function BackButton({ 
  className = "", 
  variant = "ghost", 
  size = "sm", 
  ...props 
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/Dashboard');
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleBack}
      className={`flex items-center gap-2 ${className}`}
      {...props}
    >
      <ArrowRight className="h-4 w-4" />
      <span className="hidden sm:inline">חזור</span>
    </Button>
  );
}
```

## Technical Details

### Navigation Logic:
1. Check `window.history.length`
2. If > 1: `navigate(-1)` (browser back)
3. Else: `navigate('/Dashboard')` (fallback)

### Responsive:
- `<span className="hidden sm:inline">` - טקסט רק ב-desktop
- Icon תמיד מוצג

### Props:
- Accepts all Button props
- Custom className
- Variant override
- Size override

## Dependencies

- `react-router-dom` (useNavigate)
- `@/components/ui/button`
- `lucide-react` (ArrowRight)

## Usage Examples

```jsx
// Default
<BackButton />

// Custom style
<BackButton className="bg-blue-100" />

// Different variant
<BackButton variant="outline" size="md" />
```