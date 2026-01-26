// Local API Entities - replaces @base44/sdk entities
// These entities communicate with our local Express backend

import { apiClient } from './client';

// Helper to unwrap API response - returns data array or the raw response
function unwrapResponse(response) {
  // If response has success: true and data property, return the data
  if (response && typeof response === 'object' && response.success && 'data' in response) {
    return response.data;
  }
  // Otherwise return the response as-is
  return response;
}

// Helper to check if a value contains MongoDB-style operators
function hasComplexOperators(value) {
  if (value === null || value === undefined) return false;
  if (typeof value !== 'object') return false;
  if (Array.isArray(value)) return false;
  const keys = Object.keys(value);
  return keys.some(key => key.startsWith('$'));
}

// Helper to check if any filter has complex operators
function hasAnyComplexFilters(params) {
  return Object.values(params).some(hasComplexOperators);
}

// Helper to apply MongoDB-style filter to a single item
function matchesFilter(item, key, filterValue) {
  let itemValue = item ? item[key] : undefined;
  if (itemValue === undefined && key.includes('_')) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    itemValue = item ? item[camelKey] : undefined;
  }

  if (filterValue === null || filterValue === undefined) {
    return itemValue === filterValue;
  }

  if (typeof filterValue !== 'object' || Array.isArray(filterValue)) {
    return itemValue === filterValue;
  }

  // Handle MongoDB-style operators
  const operators = Object.keys(filterValue);
  for (const op of operators) {
    const opValue = filterValue[op];
    switch (op) {
      case '$in':
        if (!Array.isArray(opValue) || !opValue.includes(itemValue)) return false;
        break;
      case '$nin':
        if (Array.isArray(opValue) && opValue.includes(itemValue)) return false;
        break;
      case '$ne':
        if (itemValue === opValue) return false;
        break;
      case '$gt':
        if (!(itemValue > opValue)) return false;
        break;
      case '$gte':
        if (!(itemValue >= opValue)) return false;
        break;
      case '$lt':
        if (!(itemValue < opValue)) return false;
        break;
      case '$lte':
        if (!(itemValue <= opValue)) return false;
        break;
      case '$exists':
        if (opValue && itemValue === undefined) return false;
        if (!opValue && itemValue !== undefined) return false;
        break;
      default:
        // Unknown operator, treat as equality match
        if (itemValue !== filterValue) return false;
    }
  }
  return true;
}

// Helper to filter data client-side with MongoDB-style filters
function applyClientSideFilters(data, filters) {
  if (!Array.isArray(data)) return data;
  if (!filters || Object.keys(filters).length === 0) return data;

  return data.filter(item => {
    for (const [key, filterValue] of Object.entries(filters)) {
      if (!matchesFilter(item, key, filterValue)) {
        return false;
      }
    }
    return true;
  });
}

// Helper to build simple query params (non-complex values only)
function buildSimpleQueryParams(params) {
  const simpleParams = {};
  for (const [key, value] of Object.entries(params)) {
    if (!hasComplexOperators(value)) {
      simpleParams[key] = value;
    }
  }
  return simpleParams;
}

const BASE_PATH_OVERRIDES = {
  reagentbatch: '/batches',
  withdrawalrequest: '/withdrawals',
  delivery: '/deliveries',
};

// Helper function to create entity CRUD operations
function createEntity(entityName) {
  const entityKey = entityName.toLowerCase();
  const basePath = BASE_PATH_OVERRIDES[entityKey] || `/${entityKey}s`; // e.g., /reagents, /suppliers

  return {
    // List all items
    // Supports multiple calling patterns:
    // - list() - get all
    // - list({ filter }) - with filter object
    // - list('-created_date') - with sort order string
    // - list('-created_date', 10) - with sort order and limit (legacy SDK pattern)
    async list(params = {}, limit = null) {
      // Handle case where params is a string (sort order like '-created_date')
      // Convert to object format
      let normalizedParams = params;
      if (typeof params === 'string') {
        normalizedParams = params ? { sort: params } : {};
      } else if (params === null || params === undefined) {
        normalizedParams = {};
      }

      // Add limit if provided as second argument
      if (limit !== null && typeof limit === 'number') {
        normalizedParams.limit = limit;
      }

      // Check if we have complex MongoDB-style filters
      const needsClientSideFilter = hasAnyComplexFilters(normalizedParams);

      // Build query string with only simple params
      const simpleParams = buildSimpleQueryParams(normalizedParams);
      const queryString = new URLSearchParams(simpleParams).toString();
      const endpoint = queryString ? `${basePath}?${queryString}` : basePath;

      const response = await apiClient.get(endpoint);
      let data = unwrapResponse(response);

      // Apply client-side filtering if we had complex filters
      if (needsClientSideFilter && Array.isArray(data)) {
        data = applyClientSideFilters(data, normalizedParams);
      }

      // Apply client-side sorting if sort param is provided
      if (normalizedParams.sort && Array.isArray(data)) {
        const sortKey = normalizedParams.sort;
        const isDescending = sortKey.startsWith('-');
        const fieldName = isDescending ? sortKey.slice(1) : sortKey;

        data = [...data].sort((a, b) => {
          const aVal = a[fieldName];
          const bVal = b[fieldName];
          if (aVal === bVal) return 0;
          if (aVal === null || aVal === undefined) return 1;
          if (bVal === null || bVal === undefined) return -1;
          const comparison = aVal < bVal ? -1 : 1;
          return isDescending ? -comparison : comparison;
        });
      }

      // Apply limit if specified (client-side, after sorting)
      if (normalizedParams.limit && Array.isArray(data)) {
        const limitNum = parseInt(normalizedParams.limit, 10);
        if (!isNaN(limitNum) && limitNum > 0) {
          data = data.slice(0, limitNum);
        }
      }

      return data;
    },

    // Get single item by ID
    async get(id) {
      const response = await apiClient.get(`${basePath}/${id}`);
      return unwrapResponse(response);
    },

    // Create new item
    async create(data) {
      const response = await apiClient.post(basePath, data);
      return unwrapResponse(response);
    },

    // Bulk create items
    async bulkCreate(items = []) {
      const payload = Array.isArray(items) ? { items } : items;
      const response = await apiClient.post(`${basePath}/bulk`, payload);
      return unwrapResponse(response);
    },

    // Update existing item
    async update(id, data) {
      const response = await apiClient.put(`${basePath}/${id}`, data);
      return unwrapResponse(response);
    },

    // Delete item
    async delete(id) {
      const response = await apiClient.delete(`${basePath}/${id}`);
      return unwrapResponse(response);
    },

    // Find with filters
    async find(filters = {}) {
      return this.list(filters);
    },

    // Alias for find (compatibility with existing code)
    async filter(filters = {}) {
      return this.list(filters);
    },

    // Count items
    async count(filters = {}) {
      const queryString = new URLSearchParams(filters).toString();
      const endpoint = queryString ? `${basePath}/count?${queryString}` : `${basePath}/count`;
      const response = await apiClient.get(endpoint);
      return unwrapResponse(response);
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
    const response = await apiClient.get('/auth/me');
    return response?.data ?? response;
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
