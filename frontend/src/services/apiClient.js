/**
 * API Client - Base HTTP Client
 *
 * Purpose: Provides a configured fetch wrapper for making HTTP requests to the backend
 * Used by: All other service files (incidentsApi.js, etc.)
 *
 * This centralizes:
 * - Base URL configuration (from environment variable)
 * - Common headers (Content-Type, etc.)
 * - Error handling
 * - Response parsing
 *
 * Benefits:
 * - Don't have to repeat base URL in every API call
 * - Consistent error handling across the app
 * - Easy to add authentication headers later
 */

// Get API URL from environment variable
// Vite exposes env vars that start with VITE_ to the client
// Use empty string if VITE_API_URL is explicitly set to empty, otherwise fallback to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : 'http://localhost:3001';

/**
 * Makes an HTTP request to the backend API
 *
 * @param {string} endpoint - API endpoint (e.g., '/api/incidents')
 * @param {Object} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise<Object>} - Parsed JSON response
 *
 * Example usage:
 *   const data = await apiClient('/api/incidents', { method: 'GET' });
 *   const created = await apiClient('/api/incidents', {
 *     method: 'POST',
 *     body: { title: 'Test', severity: 'low', description: 'Test incident' }
 *   });
 */
async function apiClient(endpoint, options = {}) {
  // Build full URL
  const url = `${API_BASE_URL}${endpoint}`;

  // Default headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // If body is an object, stringify it
  const body = options.body ? JSON.stringify(options.body) : undefined;

  // Make the request
  try {
    const response = await fetch(url, {
      ...options,
      headers,
      body,
    });

    // Parse JSON response
    const data = await response.json();

    // If response is not ok (status >= 400), throw an error
    if (!response.ok) {
      throw new Error(data.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return data;

  } catch (error) {
    // Log error for debugging
    console.error('API request failed:', {
      endpoint,
      error: error.message,
    });

    // Re-throw error so calling code can handle it
    throw error;
  }
}

/**
 * Helper methods for common HTTP methods
 * These make the code more readable
 */
const api = {
  /**
   * GET request
   * Example: api.get('/api/incidents')
   */
  get: (endpoint) => apiClient(endpoint, { method: 'GET' }),

  /**
   * POST request
   * Example: api.post('/api/incidents', { title: 'Test', ... })
   */
  post: (endpoint, body) => apiClient(endpoint, { method: 'POST', body }),

  /**
   * PUT request
   * Example: api.put('/api/incidents/1', { title: 'Updated', ... })
   */
  put: (endpoint, body) => apiClient(endpoint, { method: 'PUT', body }),

  /**
   * DELETE request
   * Example: api.delete('/api/incidents/1')
   */
  delete: (endpoint) => apiClient(endpoint, { method: 'DELETE' }),
};

export default api;
