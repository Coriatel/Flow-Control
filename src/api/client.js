// Local API Client - replaces @base44/sdk
// This client communicates with our local Express backend

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class APIClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null; // access token is kept in-memory only
  }

  setToken(token) {
    this.token = token || null;
  }

  getToken() {
    return this.token;
  }

  async _refreshAccessToken() {
    // Refresh uses httpOnly cookie. Returns true if a new token was obtained.
    const url = `${this.baseURL}/auth/refresh`;

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      return false;
    }

    const contentType = response.headers.get('content-type');
    const data = contentType && contentType.includes('application/json')
      ? await response.json()
      : null;

    const token = data?.data?.token || data?.token;
    if (token) {
      this.setToken(token);
      return true;
    }

    return false;
  }

  async request(endpoint, options = {}) {
    const { __attemptRefresh, __isRetry, ...fetchOptions } = options;

    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      credentials: 'include',
      ...fetchOptions,
      headers,
    };

    // If body is provided and not FormData, stringify it
    if (config.body && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }

    // If it's FormData, remove Content-Type to let browser set it with boundary
    if (config.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    const attemptRefresh = __attemptRefresh !== false;
    const isRetry = __isRetry === true;

    try {
      const response = await fetch(url, config);

      // Attempt a single refresh+retry on 401s (token expired / first load)
      if (
        response.status === 401 &&
        attemptRefresh &&
        !isRetry &&
        endpoint !== '/auth/refresh' &&
        endpoint !== '/auth/login' &&
        endpoint !== '/auth/register'
      ) {
        try {
          const refreshed = await this._refreshAccessToken();
          if (refreshed) {
            return this.request(endpoint, { ...options, __isRetry: true });
          }
        } catch {
          // Ignore refresh errors and fall through to normal error handling.
        }
      }

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        const error = new Error(data.message || 'Request failed');
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // HTTP Methods
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  async put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  async patch(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', body });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = new APIClient();

// Export class for testing
export { APIClient };
