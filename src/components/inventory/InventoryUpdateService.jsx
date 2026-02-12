import React, { useEffect } from 'react';
import { updateReagentInventory } from '@/api/functions';

/**
 * Service component to handle automatic inventory updates
 * Call this after any inventory-affecting operation
 */
export function useInventoryUpdate() {
  const updateInventory = async (reagentIds = []) => {
    try {
      
      if (reagentIds.length === 0) {
        // Update all reagents
        await updateReagentInventory({});
      } else {
        // Update specific reagents
        for (const reagentId of reagentIds) {
          await updateReagentInventory({ reagentId });
        }
      }
      
      return { success: true };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  return { updateInventory };
}

export default function InventoryUpdateService({ children }) {
  return children;
}