import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from 'sonner';
import { SupplierContact } from '@/api/entities';
import { Supplier } from '@/api/entities';
import { Loader2 } from 'lucide-react';

const contactTypeLabels = {
  "service": "שירות", 
  "manager": "מנהל", 
  "general": "כללי",
  "technical": "תמיכה טכנית", 
  "sales": "מכירות", 
  "orders": "הזמנות",
  "logistics": "לוגיסטיקה", 
  "other": "אחר"
};

export default function ContactForm({ contact, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);

  // Load suppliers
  useEffect(() => {
    const fetchSuppliers = async () => {
      setLoadingSuppliers(true);
      try {
        const data = await Supplier.list();
        // Filter only active suppliers
        const activeSuppliers = data.filter(s => s.is_active);
        setSuppliers(activeSuppliers);
      } catch (error) {
        console.error('Error fetching suppliers:', error);
        toast.error('שגיאה בטעינת ספקים', {
          description: 'לא ניתן לטעון את רשימת הספקים'
        });
        setSuppliers([]);
      } finally {
        setLoadingSuppliers(false);
      }
    };

    fetchSuppliers();
  }, []);

  const initializeForm = useCallback(() => {
    const initialData = {
      supplier: contact?.supplier || '',
      full_name: contact?.full_name || '',
      contact_type: contact?.contact_type || 'general',
      job_title: contact?.job_title || '',
      phone: contact?.phone || '',
      mobile: contact?.mobile || '',
      email: contact?.email || '',
      department: contact?.department || '',
      notes: contact?.notes || '',
      agreements_notes: contact?.agreements_notes || '',
      preferred_contact_method: contact?.preferred_contact_method || 'any',
      is_active: contact?.is_active ?? true,
    };
    setFormData(initialData);
  }, [contact]);

  useEffect(() => {
    initializeForm();
  }, [initializeForm]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.full_name.trim() || !formData.supplier) {
      toast.error("שדות חובה", { 
        description: "יש למלא שם מלא ולבחור ספק." 
      });
      return;
    }

    setSaving(true);
    try {
      if (contact?.id) {
        // Edit existing contact
        await SupplierContact.update(contact.id, formData);
        toast.success("הצלחה", { 
          description: "איש הקשר עודכן בהצלחה." 
        });
      } else {
        // Create new contact
        await SupplierContact.create(formData);
        toast.success("הצלחה", { 
          description: "איש קשר חדש נוצר." 
        });
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving contact:", error);
      toast.error("שגיאה", { 
        description: "לא ניתן היה לשמור את איש הקשר.", 
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };

  if (loadingSuppliers) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="mr-3 text-gray-600">טוען נתונים...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="supplier">ספק *</Label>
          <Select value={formData.supplier} onValueChange={(value) => handleChange('supplier', value)}>
            <SelectTrigger>
              <SelectValue placeholder="בחר ספק..." />
            </SelectTrigger>
            <SelectContent>
              {suppliers.length === 0 ? (
                <div className="p-2 text-center text-gray-500">
                  אין ספקים פעילים
                </div>
              ) : (
                suppliers.map(s => (
                  <SelectItem key={s.id} value={s.name}>
                    {s.display_name || s.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="full_name">שם מלא *</Label>
          <Input 
            id="full_name" 
            value={formData.full_name} 
            onChange={(e) => handleChange('full_name', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="contact_type">סוג איש קשר</Label>
          <Select value={formData.contact_type} onValueChange={(value) => handleChange('contact_type', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(contactTypeLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="job_title">תפקיד</Label>
          <Input 
            id="job_title" 
            value={formData.job_title} 
            onChange={(e) => handleChange('job_title', e.target.value)} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">טלפון</Label>
          <Input 
            id="phone" 
            value={formData.phone} 
            onChange={(e) => handleChange('phone', e.target.value)} 
          />
        </div>
        
        <div>
          <Label htmlFor="mobile">נייד</Label>
          <Input 
            id="mobile" 
            value={formData.mobile} 
            onChange={(e) => handleChange('mobile', e.target.value)} 
          />
        </div>
      </div>

      <div>
        <Label htmlFor="email">אימייל</Label>
        <Input 
          id="email" 
          type="email" 
          value={formData.email} 
          onChange={(e) => handleChange('email', e.target.value)} 
        />
      </div>

      <div>
        <Label htmlFor="department">מחלקה</Label>
        <Input 
          id="department" 
          value={formData.department} 
          onChange={(e) => handleChange('department', e.target.value)} 
        />
      </div>

      <div>
        <Label htmlFor="preferred_contact_method">דרך קשר מועדפת</Label>
        <Select value={formData.preferred_contact_method} onValueChange={(value) => handleChange('preferred_contact_method', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="phone">טלפון</SelectItem>
            <SelectItem value="mobile">נייד</SelectItem>
            <SelectItem value="email">אימייל</SelectItem>
            <SelectItem value="any">כל דרך</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="notes">הערות</Label>
        <Textarea 
          id="notes" 
          value={formData.notes} 
          onChange={(e) => handleChange('notes', e.target.value)}
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="agreements_notes">הערות הסכמים</Label>
        <Textarea 
          id="agreements_notes" 
          value={formData.agreements_notes} 
          onChange={(e) => handleChange('agreements_notes', e.target.value)}
          rows={2}
        />
      </div>

      <div className="flex items-center space-x-2 space-x-reverse">
        <Checkbox 
          id="is_active" 
          checked={formData.is_active} 
          onCheckedChange={(checked) => handleChange('is_active', checked)} 
        />
        <Label htmlFor="is_active" className="cursor-pointer">איש קשר פעיל</Label>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          ביטול
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              שומר...
            </>
          ) : (
            'שמור'
          )}
        </Button>
      </div>
    </form>
  );
}