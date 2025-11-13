import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from 'sonner';
import { Supplier } from '@/api/entities';
import { Loader2 } from 'lucide-react';

export default function SupplierForm({ supplier, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  const initializeForm = useCallback(() => {
    const initialData = {
      name: supplier?.name || '',
      display_name: supplier?.display_name || '',
      code: supplier?.code || '',
      contact_person: supplier?.contact_person || '',
      phone: supplier?.phone || '',
      email: supplier?.email || '',
      address: supplier?.address || '',
      website: supplier?.website || '',
      notes: supplier?.notes || '',
      is_active: supplier?.is_active ?? true,
    };
    setFormData(initialData);
  }, [supplier]);

  useEffect(() => {
    initializeForm();
  }, [initializeForm]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("שדות חובה", { 
        description: "יש למלא שם ספק." 
      });
      return;
    }

    setSaving(true);
    try {
      if (supplier?.id) {
        // Edit existing supplier
        await Supplier.update(supplier.id, formData);
        toast.success("הצלחה", { 
          description: "הספק עודכן בהצלחה." 
        });
      } else {
        // Create new supplier
        await Supplier.create(formData);
        toast.success("הצלחה", { 
          description: "ספק חדש נוצר." 
        });
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving supplier:", error);
      toast.error("שגיאה", { 
        description: "לא ניתן היה לשמור את הספק.",
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">שם ספק *</Label>
          <Input 
            id="name"
            value={formData.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="שם הספק הרשמי"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="display_name">שם תצוגה</Label>
          <Input 
            id="display_name"
            value={formData.display_name || ''}
            onChange={(e) => handleChange('display_name', e.target.value)}
            placeholder="שם לתצוגה (אופציונלי)"
          />
        </div>

        <div>
          <Label htmlFor="code">קוד ספק</Label>
          <Input 
            id="code"
            value={formData.code || ''}
            onChange={(e) => handleChange('code', e.target.value)}
            placeholder="קוד מזהה"
          />
        </div>

        <div>
          <Label htmlFor="contact_person">איש קשר</Label>
          <Input 
            id="contact_person"
            value={formData.contact_person || ''}
            onChange={(e) => handleChange('contact_person', e.target.value)}
            placeholder="שם איש הקשר"
          />
        </div>

        <div>
          <Label htmlFor="phone">טלפון</Label>
          <Input 
            id="phone"
            type="tel"
            value={formData.phone || ''}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="מספר טלפון"
          />
        </div>

        <div>
          <Label htmlFor="email">אימייל</Label>
          <Input 
            id="email"
            type="email"
            value={formData.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="כתובת אימייל"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="address">כתובת</Label>
        <Input 
          id="address"
          value={formData.address || ''}
          onChange={(e) => handleChange('address', e.target.value)}
          placeholder="כתובת מלאה"
        />
      </div>

      <div>
        <Label htmlFor="website">אתר אינטרנט</Label>
        <Input 
          id="website"
          type="url"
          value={formData.website || ''}
          onChange={(e) => handleChange('website', e.target.value)}
          placeholder="https://..."
        />
      </div>

      <div>
        <Label htmlFor="notes">הערות</Label>
        <Textarea 
          id="notes"
          value={formData.notes || ''}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="הערות נוספות..."
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2 space-x-reverse">
        <Checkbox
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => handleChange('is_active', checked)}
        />
        <label htmlFor="is_active" className="text-sm font-medium cursor-pointer">
          ספק פעיל
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          ביטול
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
          {supplier ? 'עדכן' : 'צור ספק'}
        </Button>
      </div>
    </form>
  );
}