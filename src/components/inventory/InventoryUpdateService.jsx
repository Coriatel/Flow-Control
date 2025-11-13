import React, { useEffect } from 'react';
import { updateReagentInventory } from '@/api/functions';

/**
 * Service component to handle automatic inventory updates
 * Call this after any inventory-affecting operation
 */
export function useInventoryUpdate() {
  const updateInventory = async (reagentIds = []) => {
    try {
      console.log(`🔄 Updating inventory for ${reagentIds.length || 'all'} reagents...`);
      
      if (reagentIds.length === 0) {
        // Update all reagents
        await updateReagentInventory({});
      } else {
        // Update specific reagents
        for (const reagentId of reagentIds) {
          await updateReagentInventory({ reagentId });
        }
      }
      
      console.log('✅ Inventory update completed');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Inventory update failed:', error);
      return { success: false, error: error.message };
    }
  };

  return { updateInventory };
}

export default function InventoryUpdateService({ children }) {
  return children;
}