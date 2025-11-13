# מסמך טכני - רכיב הזנת אצווה

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** components/inventory/BatchEntry.jsx

---

# מסמך טכני - BatchEntry

## Component Structure

**קובץ**: `components/inventory/BatchEntry.jsx`  
**Type**: Form Component (Controlled)

## Implementation

```jsx
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import DateField from '@/components/ui/DateField';

export default function BatchEntry({ 
  initialData = null,
  onSave,
  onCancel,
  autoSave = false,
  readOnly = false
}) {
  const [formData, setFormData] = useState(initialData || {
    batch_number: '',
    expiry_date: '',
    quantity: '',
    notes: ''
  });
  
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  
  // Auto-save logic
  useEffect(() => {
    if (!autoSave) return;
    
    const timer = setTimeout(() => {
      if (validate()) {
        onSave(formData);
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [formData, autoSave]);
  
  const validate = () => {
    const newErrors = {};
    
    if (!formData.batch_number?.trim()) {
      newErrors.batch_number = 'מספר אצווה חובה';
    }
    
    if (!formData.expiry_date) {
      newErrors.expiry_date = 'תאריך תפוגה חובה';
    } else if (parseISO(formData.expiry_date) < new Date()) {
      newErrors.expiry_date = 'תאריך חייב להיות עתידי';
    }
    
    if (formData.quantity === '' || formData.quantity < 0) {
      newErrors.quantity = 'כמות חובה וחיובית';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validate()) return;
    
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>מספר אצווה *</Label>
        <Input
          value={formData.batch_number}
          onChange={(e) => setFormData({...formData, batch_number: e.target.value.toUpperCase()})}
          disabled={readOnly || (initialData && initialData.batch_number)}
          className={errors.batch_number ? 'border-red-500' : ''}
        />
        {errors.batch_number && <p className="text-red-500 text-sm">{errors.batch_number}</p>}
      </div>
      
      <div>
        <Label>תאריך תפוגה *</Label>
        <DateField
          value={formData.expiry_date}
          onChange={(date) => setFormData({...formData, expiry_date: date})}
          disabled={readOnly}
          error={errors.expiry_date}
        />
      </div>
      
      <div>
        <Label>כמות *</Label>
        <Input
          type="number"
          value={formData.quantity}
          onChange={(e) => setFormData({...formData, quantity: parseFloat(e.target.value)})}
          disabled={readOnly}
          min="0"
          step="1"
          className={errors.quantity ? 'border-red-500' : ''}
        />
        {errors.quantity && <p className="text-red-500 text-sm">{errors.quantity}</p>}
      </div>
      
      <div>
        <Label>הערות</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({...formData, notes: e.target.value})}
          disabled={readOnly}
          rows={2}
        />
      </div>
      
      {!autoSave && (
        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? 'שומר...' : 'שמור'}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              ביטול
            </Button>
          )}
        </div>
      )}
      
      {autoSave && saving && (
        <p className="text-sm text-gray-500">שומר...</p>
      )}
    </form>
  );
}
```

## State Management

- **Controlled Component**: formData in local state
- **Auto-save**: debounced (2s) useEffect
- **Validation**: on submit + on blur
- **Error Display**: inline, per field

## Dependencies

- `@/components/ui/input`
- `@/components/ui/label`
- `@/components/ui/textarea`
- `@/components/ui/button`
- `@/components/ui/DateField`
- `date-fns`