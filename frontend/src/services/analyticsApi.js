/**
 * Analytics API Service
 *
 * Purpose: Fetches analytics and metrics from the backend
 * Used by: AnalyticsDashboard component
 */

import api from './apiClient';

/**
 * Get analytics overview
 * Returns metrics about incidents by status, severity, and totals
 *
 * @returns {Promise<Object>} - Analytics data
 *
 * Example response:
 * {
 *   byStatus: [{ status: 'open', count: 5 }, ...],
 *   bySeverity: [{ severity: 'high', count: 3 }, ...],
 *   totals: { total: 10, open_count: 5, resolved_count: 3 }
 * }
 */
export async function getAnalytics() {
  const response = await api.get('/api/analytics/overview');
  return response.data;
}
