/**
 * Flow Control - Entities
 * מחליף את base44.entities
 */

import { createEntity } from './entityFactory.js';

// Core Entities
export const Reagent = createEntity('reagents');
export const ReagentBatch = createEntity('batches');
export const Supplier = createEntity('suppliers');
export const SupplierContact = createEntity('supplier-contacts');

// Orders & Procurement
export const Order = createEntity('orders');
export const OrderItem = createEntity('order-items');
export const FrameworkOrder = createEntity('framework-orders');
export const FrameworkOrderItem = createEntity('framework-order-items');

// Withdrawals
export const WithdrawalRequest = createEntity('withdrawals');
export const WithdrawalItem = createEntity('withdrawal-items');

// Deliveries & Shipments
export const Delivery = createEntity('deliveries');
export const DeliveryItem = createEntity('delivery-items');
export const Shipment = createEntity('shipments');
export const ShipmentItem = createEntity('shipment-items');

// Inventory Management
export const InventoryTransaction = createEntity('inventory-transactions');
export const InventoryCountDraft = createEntity('inventory/drafts');
export const CompletedInventoryCount = createEntity('inventory/completed');
export const ExpiredProductLog = createEntity('expired-products');

// Alerts & Notifications
export const AlertRule = createEntity('alert-rules');
export const ActiveAlert = createEntity('alerts');
export const ScheduledReminder = createEntity('reminders');
export const DashboardNote = createEntity('notes');

// System & Configuration
export const SystemSettings = createEntity('settings');
export const ArchivedData = createEntity('archived-data');
export const ArchivedReport = createEntity('archived-reports');
export const DocumentationNote = createEntity('documentation');

// Catalog
export const ReagentCatalog = createEntity('catalog');
export const FeatureDocumentation = createEntity('feature-docs');
export const ReagentReceiptEvent = createEntity('receipt-events');

// User (handled separately for auth)
export const User = {
  async me() {
    const { api } = await import('./client.js');
    return api.get('/auth/me');
  },
  async login(email, password) {
    const { api } = await import('./client.js');
    return api.post('/auth/login', { email, password });
  },
  async logout() {
    const { api } = await import('./client.js');
    localStorage.removeItem('auth_token');
    return api.post('/auth/logout');
  },
  async register(data) {
    const { api } = await import('./client.js');
    return api.post('/auth/register', data);
  },
  isLoggedIn() {
    return !!localStorage.getItem('auth_token');
  },
};
