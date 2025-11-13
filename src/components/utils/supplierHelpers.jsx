/**
 * כלים עזר לניהול ספקים - מקור אמת יחיד
 */
import { Supplier } from '@/api/entities';
import { Reagent } from '@/api/entities';
import { Order } from '@/api/entities';
import { ReagentBatch } from '@/api/entities';

/**
 * טוען את כל הספקים הפעילים
 */
export const useActiveSuppliers = async () => {
  try {
    const suppliers = await Supplier.filter({ is_active: true });
    return Array.isArray(suppliers) ? suppliers.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'he')) : [];
  } catch (error) {
    console.error('Error fetching active suppliers:', error);
    return [];
  }
};

/**
 * טוען את כל הספקים (כולל לא פעילים)
 */
export const useAllSuppliers = async () => {
  try {
    const suppliers = await Supplier.list();
    return Array.isArray(suppliers) ? suppliers.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'he')) : [];
  } catch (error) {
    console.error('Error fetching all suppliers:', error);
    return [];
  }
};

/**
 * מחזיר ספקים רלוונטיים לפי הקשר המסך
 */
export const getRelevantSuppliers = async (context, items = []) => {
  try {
    switch (context) {
      case 'manage_reagents':
        // ניהול ריאגנטים - כל הספקים כולל לא פעילים
        return await useAllSuppliers();
        
      case 'inventory_count':
      case 'orders_management':
        // ספירת מלאי וניהול הזמנות - רק ספקים פעילים ומשויכים
        const activeSuppliers = await useActiveSuppliers();
        return activeSuppliers.filter(s => s.has_associated_data);
        
      case 'replenishment':
      case 'new_order':
      case 'withdrawal_requests':
        // חישוב השלמות, הזמנה חדשה, בקשות משיכה - רק ספקים פעילים
        return await useActiveSuppliers();
        
      case 'batch_management':
      case 'deliveries':
        // ניהול אצוות ומשלוחים - ספקים של פריטים המוצגים בדף
        if (!Array.isArray(items) || items.length === 0) return [];
        const uniqueSuppliers = [...new Set(items.map(item => item.supplier).filter(Boolean))];
        const allSuppliers = await useAllSuppliers();
        return allSuppliers.filter(s => uniqueSuppliers.includes(s.name));
        
      case 'contacts_active':
        // אנשי קשר - ספקים פעילים
        return await useActiveSuppliers();
        
      case 'contacts_inactive':
        // אנשי קשר - ספקים לא פעילים
        const allSuppliersForContacts = await useAllSuppliers();
        return allSuppliersForContacts.filter(s => !s.is_active);
        
      default:
        return await useActiveSuppliers();
    }
  } catch (error) {
    console.error(`Error getting relevant suppliers for context ${context}:`, error);
    return [];
  }
};

/**
 * בודק האם ספק ניתן למחיקה או להפסקת פעילות
 */
export const canDeactivateSupplier = async (supplierId) => {
  try {
    const [reagents, orders, batches] = await Promise.all([
      Reagent.filter({ current_supplier_id: supplierId }),
      Order.filter({ supplier: supplierId, status: { $ne: 'closed' } }),
      ReagentBatch.filter({ supplier: supplierId, status: 'active' })
    ]);
    
    const hasAssociatedData = reagents.length > 0 || orders.length > 0 || batches.length > 0;
    
    return {
      canDeactivate: !hasAssociatedData,
      associatedData: {
        reagents: reagents.length,
        orders: orders.length,
        batches: batches.length
      }
    };
  } catch (error) {
    console.error('Error checking supplier deactivation:', error);
    return { canDeactivate: false, error: error.message };
  }
};

/**
 * מסמן ספק כ"לא פעיל" לאחר בדיקת תלות
 */
export const deactivateSupplier = async (supplierId, reason = '') => {
  const canDeactivate = await canDeactivateSupplier(supplierId);
  
  if (!canDeactivate.canDeactivate) {
    throw new Error(`לא ניתן להפסיק את פעילות הספק. יש ${canDeactivate.associatedData.reagents} ריאגנטים, ${canDeactivate.associatedData.orders} הזמנות פעילות ו-${canDeactivate.associatedData.batches} אצוות פעילות המקושרות אליו.`);
  }
  
  await Supplier.update(supplierId, {
    is_active: false,
    deactivation_reason: reason,
    deactivated_date: new Date().toISOString()
  });
  
  return { success: true };
};

/**
 * מפעיל ספק חזרה
 */
export const reactivateSupplier = async (supplierId) => {
  await Supplier.update(supplierId, {
    is_active: true,
    deactivation_reason: null,
    deactivated_date: null
  });
  
  return { success: true };
};

/**
 * מחזיר מיפוי של ספקים לפי שם עם בדיקות בטיחות
 */
export const createSupplierMap = (suppliers) => {
  if (!Array.isArray(suppliers)) {
    console.warn('createSupplierMap received invalid suppliers array:', suppliers);
    return new Map();
  }
  
  return new Map(suppliers.map(s => [s?.name || '', s]).filter(([name]) => name));
};