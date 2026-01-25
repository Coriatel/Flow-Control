// Local API Entities - replaces @base44/sdk entities
// These entities communicate with our local Express backend

import { apiClient } from './client';

// Helper function to create entity CRUD operations
function createEntity(entityName) {
  const basePath = `/${entityName.toLowerCase()}s`; // e.g., /reagents, /suppliers

  return {
    // List all items
    async list(params = {}) {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = queryString ? `${basePath}?${queryString}` : basePath;
      return apiClient.get(endpoint);
    },

    // Get single item by ID
    async get(id) {
      return apiClient.get(`${basePath}/${id}`);
    },

    // Create new item
    async create(data) {
      return apiClient.post(basePath, data);
    },

    // Update existing item
    async update(id, data) {
      return apiClient.put(`${basePath}/${id}`, data);
    },

    // Delete item
    async delete(id) {
      return apiClient.delete(`${basePath}/${id}`);
    },

    // Find with filters
    async find(filters = {}) {
      return this.list(filters);
    },

    // Count items
    async count(filters = {}) {
      const queryString = new URLSearchParams(filters).toString();
      const endpoint = queryString ? `${basePath}/count?${queryString}` : `${basePath}/count`;
      return apiClient.get(endpoint);
    }
  };
}

// Create entities for each model
export const Reagent = createEntity('reagent');
export const ReagentBatch = createEntity('reagentbatch');
export const ReagentCatalog = createEntity('reagentcatalog');
export const InventoryTransaction = createEntity('inventorytransaction');
export const InventoryCountDraft = createEntity('inventorycountdraft');
export const CompletedInventoryCount = createEntity('completedinventorycount');
export const Delivery = createEntity('delivery');
export const DeliveryItem = createEntity('deliveryitem');
export const Order = createEntity('order');
export const OrderItem = createEntity('orderitem');
export const Shipment = createEntity('shipment');
export const ShipmentItem = createEntity('shipmentitem');
export const WithdrawalRequest = createEntity('withdrawalrequest');
export const WithdrawalItem = createEntity('withdrawalitem');
export const FrameworkOrder = createEntity('frameworkorder');
export const FrameworkOrderItem = createEntity('frameworkorderitem');
export const ExpiredProductLog = createEntity('expiredproductlog');
export const Supplier = createEntity('supplier');
export const SupplierContact = createEntity('suppliercontact');
export const DashboardNote = createEntity('dashboardnote');
export const SystemSettings = createEntity('systemsetting');
export const ArchivedReport = createEntity('archivedreport');
export const ArchivedData = createEntity('archiveddata');
export const AlertRule = createEntity('alertrule');
export const ActiveAlert = createEntity('activealert');
export const ScheduledReminder = createEntity('scheduledreminder');
export const DocumentationNote = createEntity('documentationnote');
export const ReagentReceiptEvent = createEntity('reagentreceiptevent');
export const FeatureDocumentation = createEntity('featuredocumentation');

// User/Auth entity - special case with auth methods
export const User = {
  async me() {
    return apiClient.get('/auth/me');
  },

  async updateMyUserData(data) {
    // Update current user's data (device fingerprint, etc.)
    return apiClient.put('/auth/me', data);
  },

  async login(email, password) {
    const response = await apiClient.post('/auth/login', { email, password });
    // Token is in response.data.token (API returns { success, data: { user, token } })
    const token = response.data?.token || response.token;
    if (token) {
      apiClient.setToken(token);
    }
    return response;
  },

  async register(data) {
    const response = await apiClient.post('/auth/register', data);
    // Token is in response.data.token (API returns { success, data: { user, token } })
    const token = response.data?.token || response.token;
    if (token) {
      apiClient.setToken(token);
    }
    return response;
  },

  async logout() {
    apiClient.setToken(null);
    return apiClient.post('/auth/logout');
  },

  async update(id, data) {
    return apiClient.put(`/users/${id}`, data);
  },

  async list(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/users?${queryString}` : '/users';
    return apiClient.get(endpoint);
  },

  async get(id) {
    return apiClient.get(`/users/${id}`);
  }
};

