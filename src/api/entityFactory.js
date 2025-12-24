/**
 * Flow Control - Entity Factory
 * יוצר entities עם interface זהה ל-Base44
 */

import api from './client.js';

/**
 * Creates an entity with CRUD operations
 * @param {string} entityName - Name of the entity (e.g., 'reagents', 'suppliers')
 * @returns {Object} Entity with CRUD methods
 */
export function createEntity(entityName) {
  const endpoint = `/${entityName}`;

  return {
    /**
     * List all records with optional filters
     * @param {Object} options - Query options
     * @param {Object} options.filter - Filter criteria
     * @param {string} options.sort - Sort field
     * @param {string} options.order - 'asc' or 'desc'
     * @param {number} options.limit - Max records to return
     * @param {number} options.offset - Skip records
     */
    async list(options = {}) {
      const params = new URLSearchParams();

      if (options.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(`filter[${key}]`, value);
          }
        });
      }

      if (options.sort) params.append('sort', options.sort);
      if (options.order) params.append('order', options.order);
      if (options.limit) params.append('limit', options.limit);
      if (options.offset) params.append('offset', options.offset);

      const queryString = params.toString();
      const url = queryString ? `${endpoint}?${queryString}` : endpoint;

      const response = await api.get(url);
      return response.data || response;
    },

    /**
     * Get a single record by ID
     * @param {string} id - Record ID
     */
    async get(id) {
      const response = await api.get(`${endpoint}/${id}`);
      return response.data || response;
    },

    /**
     * Create a new record
     * @param {Object} data - Record data
     */
    async create(data) {
      const response = await api.post(endpoint, data);
      return response.data || response;
    },

    /**
     * Update an existing record
     * @param {string} id - Record ID
     * @param {Object} data - Updated data
     */
    async update(id, data) {
      const response = await api.put(`${endpoint}/${id}`, data);
      return response.data || response;
    },

    /**
     * Delete a record
     * @param {string} id - Record ID
     */
    async delete(id) {
      const response = await api.delete(`${endpoint}/${id}`);
      return response.data || response;
    },

    /**
     * Filter records (alias for list with filter)
     * @param {Object} filter - Filter criteria
     */
    async filter(filter) {
      return this.list({ filter });
    },

    /**
     * Count records matching criteria
     * @param {Object} filter - Filter criteria
     */
    async count(filter = {}) {
      const params = new URLSearchParams();
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(`filter[${key}]`, value);
        }
      });
      params.append('count', 'true');

      const queryString = params.toString();
      const url = `${endpoint}?${queryString}`;

      const response = await api.get(url);
      return response.count || 0;
    },

    /**
     * Bulk create records
     * @param {Array} records - Array of records to create
     */
    async bulkCreate(records) {
      const response = await api.post(`${endpoint}/bulk`, { records });
      return response.data || response;
    },

    /**
     * Bulk update records
     * @param {Array} updates - Array of { id, data } objects
     */
    async bulkUpdate(updates) {
      const response = await api.put(`${endpoint}/bulk`, { updates });
      return response.data || response;
    },
  };
}

export default createEntity;
