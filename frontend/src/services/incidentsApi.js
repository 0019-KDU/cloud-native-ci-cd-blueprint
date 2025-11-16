/**
 * Incidents API Service
 *
 * Purpose: Provides functions to interact with the incidents API endpoints
 * Used by: React components and pages
 *
 * This module wraps all incident-related API calls in simple functions.
 * Components call these functions instead of using fetch() directly.
 *
 * Benefits:
 * - Components don't need to know API URLs or request formats
 * - Easy to mock for testing
 * - Single place to update if API changes
 */

import api from './apiClient';

/**
 * Get all incidents
 *
 * @param {Object} params - Query parameters
 * @param {number} params.limit - Maximum number of incidents to return
 * @param {number} params.offset - Number of incidents to skip (for pagination)
 * @returns {Promise<Array>} - Array of incident objects
 *
 * Example usage in a component:
 *   const incidents = await getIncidents({ limit: 20, offset: 0 });
 */
export async function getIncidents({ limit = 100, offset = 0 } = {}) {
  const response = await api.get(`/api/incidents?limit=${limit}&offset=${offset}`);
  return response.data; // Extract data array from { success: true, data: [...] }
}

/**
 * Get a single incident by ID
 *
 * @param {number} id - Incident ID
 * @returns {Promise<Object>} - Incident object
 *
 * Example usage:
 *   const incident = await getIncident(5);
 *   console.log(incident.title, incident.ai_summary);
 */
export async function getIncident(id) {
  const response = await api.get(`/api/incidents/${id}`);
  return response.data;
}

/**
 * Create a new incident
 *
 * @param {Object} incidentData - Incident data
 * @param {string} incidentData.title - Incident title
 * @param {string} incidentData.severity - Severity: 'low', 'medium', or 'high'
 * @param {string} incidentData.description - Full description with error logs
 * @returns {Promise<Object>} - Created incident with AI-generated fields
 *
 * Example usage:
 *   const newIncident = await createIncident({
 *     title: 'API Gateway timeout',
 *     severity: 'high',
 *     description: 'Users reporting 504 errors...'
 *   });
 *   // newIncident will have: id, ai_summary, ai_root_causes, ai_customer_message, etc.
 */
export async function createIncident(incidentData) {
  const response = await api.post('/api/incidents', incidentData);
  return response.data;
}

/**
 * Get incidents by severity
 *
 * @param {string} severity - Severity level: 'low', 'medium', or 'high'
 * @returns {Promise<Array>} - Array of incidents with matching severity
 *
 * Example usage:
 *   const highSeverityIncidents = await getIncidentsBySeverity('high');
 */
export async function getIncidentsBySeverity(severity) {
  const response = await api.get(`/api/incidents/severity/${severity}`);
  return response.data;
}

/**
 * Delete an incident
 *
 * @param {number} id - Incident ID
 * @returns {Promise<Object>} - Success response
 *
 * Example usage:
 *   await deleteIncident(5);
 */
export async function deleteIncident(id) {
  const response = await api.delete(`/api/incidents/${id}`);
  return response;
}
