// Data Cleanup Service - Centralized data management and cleanup
export class DataCleanupService {
  
  // Cache for frequently accessed data
  static cache = new Map();
  static cacheTimeout = 5 * 60 * 1000; // 5 minutes
  
  // Rate limiting
  static lastApiCall = 0;
  static minCallInterval = 100; // 100ms between calls
  
  // Helper to ensure rate limiting
  static async waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastApiCall;
    if (timeSinceLastCall < this.minCallInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minCallInterval - timeSinceLastCall));
    }
    this.lastApiCall = Date.now();
  }
  
  // Safe API call with caching and retry
  static async safeApiCall(key, apiFunction, ...args) {
    const cached = this.cache.get(key);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }
    
    await this.waitForRateLimit();
    
    try {
      const data = await apiFunction(...args);
      this.cache.set(key, { data, timestamp: now });
      return data;
    } catch (error) {
      if (error.message && error.message.includes('429')) {
        // If rate limited and we have cached data, use it
        if (cached) {
          console.log(`Rate limited, using cached data for ${key}`);
          return cached.data;
        }
        // Wait and retry once
        await new Promise(resolve => setTimeout(resolve, 2000));
        const retryData = await apiFunction(...args);
        this.cache.set(key, { data: retryData, timestamp: now });
        return retryData;
      }
      throw error;
    }
  }
  
  // Clear cache
  static clearCache() {
    this.cache.clear();
  }
  
  // Validate and clean supplier data
  static cleanSupplier(supplier) {
    const validSuppliers = ["ELDAN", "BIORAD", "DYN", "OTHER"];
    
    if (validSuppliers.includes(supplier)) {
      return supplier;
    }
    
    const lower = (supplier || '').toLowerCase();
    if (lower.includes('eldan') || lower.includes('אלדן')) return 'ELDAN';
    if (lower.includes('biorad') || lower.includes('ביו') || lower.includes('bio')) return 'BIORAD';
    if (lower.includes('dyn') || lower.includes('דיין')) return 'DYN';
    return 'OTHER';
  }
  
  // Validate and clean reagent category
  static cleanCategory(category) {
    const validCategories = ["reagents", "cells"];
    return validCategories.includes(category) ? category : "reagents";
  }
  
  // Validate and clean numeric values
  static cleanNumber(value, defaultValue = 0) {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : Math.max(0, parsed);
  }
  
  // Validate and clean date
  static cleanDate(dateString) {
    if (!dateString) return null;
    
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
    } catch {
      return null;
    }
  }
  
  // Clean and validate entity data before saving
  static cleanEntityData(entityType, data) {
    const cleaned = { ...data };
    
    switch (entityType) {
      case 'Reagent':
        cleaned.supplier = this.cleanSupplier(cleaned.supplier);
        cleaned.category = this.cleanCategory(cleaned.category);
        cleaned.total_quantity_all_batches = this.cleanNumber(cleaned.total_quantity_all_batches);
        cleaned.active_batches_count = this.cleanNumber(cleaned.active_batches_count);
        cleaned.nearest_expiry_date = this.cleanDate(cleaned.nearest_expiry_date);
        break;
        
      case 'Order':
        cleaned.supplier = this.cleanSupplier(cleaned.supplier);
        cleaned.order_date = this.cleanDate(cleaned.order_date);
        cleaned.total_value = this.cleanNumber(cleaned.total_value);
        break;
        
      case 'Delivery':
        cleaned.supplier = this.cleanSupplier(cleaned.supplier);
        cleaned.delivery_date = this.cleanDate(cleaned.delivery_date);
        cleaned.total_items_received = this.cleanNumber(cleaned.total_items_received);
        break;
        
      case 'ReagentBatch':
        cleaned.current_quantity = this.cleanNumber(cleaned.current_quantity);
        cleaned.initial_quantity = this.cleanNumber(cleaned.initial_quantity);
        cleaned.expiry_date = this.cleanDate(cleaned.expiry_date);
        cleaned.received_date = this.cleanDate(cleaned.received_date);
        break;
        
      case 'InventoryTransaction':
        cleaned.quantity = this.cleanNumber(cleaned.quantity, 0); // Allow negative
        cleaned.expiry_date = this.cleanDate(cleaned.expiry_date);
        break;
    }
    
    return cleaned;
  }
  
  // Comprehensive data integrity check
  static async checkDataIntegrity() {
    const issues = [];
    
    try {
      console.log("🔍 Running comprehensive data integrity check...");
      
      // Import entities
      const { Reagent } = await import('@/api/entities');
      const { ReagentBatch } = await import('@/api/entities');
      const { Order } = await import('@/api/entities');
      const { OrderItem } = await import('@/api/entities');
      const { Delivery } = await import('@/api/entities');
      const { DeliveryItem } = await import('@/api/entities');
      
      // Get all data
      const reagents = await this.safeApiCall('reagents', Reagent.list.bind(Reagent));
      const batches = await this.safeApiCall('batches', ReagentBatch.list.bind(ReagentBatch));
      const orders = await this.safeApiCall('orders', Order.list.bind(Order));
      const orderItems = await this.safeApiCall('orderItems', OrderItem.list.bind(OrderItem));
      const deliveries = await this.safeApiCall('deliveries', Delivery.list.bind(Delivery));
      const deliveryItems = await this.safeApiCall('deliveryItems', DeliveryItem.list.bind(DeliveryItem));
      
      const reagentIds = new Set(reagents.map(r => r.id));
      const orderIds = new Set(orders.map(o => o.id));
      const deliveryIds = new Set(deliveries.map(d => d.id));
      
      // Check ReagentBatch -> Reagent references
      for (const batch of batches) {
        if (batch.reagent_id && !reagentIds.has(batch.reagent_id)) {
          issues.push({
            type: 'orphaned_batch',
            entity: 'ReagentBatch',
            id: batch.id,
            details: `Batch ${batch.batch_number || batch.id} references non-existent reagent ${batch.reagent_id}`,
            fixAction: () => ReagentBatch.delete(batch.id)
          });
        }
      }
      
      // Check OrderItem -> Reagent references
      for (const item of orderItems) {
        if (item.reagent_id && !reagentIds.has(item.reagent_id)) {
          issues.push({
            type: 'orphaned_order_item',
            entity: 'OrderItem',
            id: item.id,
            details: `OrderItem ${item.id} references non-existent reagent ${item.reagent_id}`,
            fixAction: () => OrderItem.delete(item.id)
          });
        }
        
        if (item.order_id && !orderIds.has(item.order_id)) {
          issues.push({
            type: 'orphaned_order_item',
            entity: 'OrderItem',
            id: item.id,
            details: `OrderItem ${item.id} references non-existent order ${item.order_id}`,
            fixAction: () => OrderItem.delete(item.id)
          });
        }
      }
      
      // Check DeliveryItem -> Reagent references
      for (const item of deliveryItems) {
        if (item.reagent_id && !reagentIds.has(item.reagent_id)) {
          issues.push({
            type: 'orphaned_delivery_item',
            entity: 'DeliveryItem',
            id: item.id,
            details: `DeliveryItem ${item.id} references non-existent reagent ${item.reagent_id}`,
            fixAction: () => DeliveryItem.delete(item.id)
          });
        }
        
        if (item.delivery_id && !deliveryIds.has(item.delivery_id)) {
          issues.push({
            type: 'orphaned_delivery_item',
            entity: 'DeliveryItem',
            id: item.id,
            details: `DeliveryItem ${item.id} references non-existent delivery ${item.delivery_id}`,
            fixAction: () => DeliveryItem.delete(item.id)
          });
        }
      }
      
      // Check invalid suppliers
      const validSuppliers = ["ELDAN", "BIORAD", "DYN", "OTHER"];
      
      for (const order of orders) {
        if (!validSuppliers.includes(order.supplier)) {
          issues.push({
            type: 'invalid_supplier',
            entity: 'Order',
            id: order.id,
            details: `Order ${order.order_number_temp} has invalid supplier: ${order.supplier}`,
            fixAction: () => Order.update(order.id, { supplier: this.cleanSupplier(order.supplier) })
          });
        }
      }
      
      for (const delivery of deliveries) {
        if (!validSuppliers.includes(delivery.supplier)) {
          issues.push({
            type: 'invalid_supplier',
            entity: 'Delivery',
            id: delivery.id,
            details: `Delivery ${delivery.delivery_number} has invalid supplier: ${delivery.supplier}`,
            fixAction: () => Delivery.update(delivery.id, { supplier: this.cleanSupplier(delivery.supplier) })
          });
        }
      }
      
      return issues;
      
    } catch (error) {
      console.error("Error in data integrity check:", error);
      return [{
        type: 'check_error',
        entity: 'System',
        id: 'error',
        details: `Data integrity check failed: ${error.message}`,
        fixAction: null
      }];
    }
  }
  
  // Auto-fix all detected issues
  static async autoFixIssues(issues) {
    const fixes = [];
    const errors = [];
    
    for (const issue of issues) {
      if (issue.fixAction) {
        try {
          await issue.fixAction();
          fixes.push(`Fixed: ${issue.details}`);
          await new Promise(resolve => setTimeout(resolve, 100)); // Rate limiting
        } catch (error) {
          errors.push(`Failed to fix ${issue.id}: ${error.message}`);
        }
      }
    }
    
    return { fixes, errors };
  }
}

export default DataCleanupService;