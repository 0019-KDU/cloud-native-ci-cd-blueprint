/**
 * Incidents Management Service
 *
 * Purpose: Handles incident updates, status changes, assignments, and comments
 * Used by: incidents.controller.js for management operations
 *
 * This service provides advanced incident management features beyond basic CRUD
 */

const db = require('../db');
const logger = require('../config/logger');

/**
 * Update incident status
 * Automatically logs the status change in activity table
 *
 * @param {number} id - Incident ID
 * @param {string} newStatus - New status: 'open', 'investigating', 'resolved', 'closed'
 * @param {string} actorName - Name of person making the change (optional)
 * @returns {Promise<Object>} - Updated incident
 */
async function updateStatus(id, newStatus, actorName = 'System') {
  logger.info('Updating incident status', { id, newStatus, actorName });

  // Validate status
  const validStatuses = ['open', 'investigating', 'resolved', 'closed'];
  if (!validStatuses.includes(newStatus.toLowerCase())) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  try {
    // Build update query based on status
    let additionalUpdates = '';
    if (newStatus === 'resolved') {
      additionalUpdates = ', resolved_at = CURRENT_TIMESTAMP';
    } else if (newStatus === 'closed') {
      additionalUpdates = ', closed_at = CURRENT_TIMESTAMP';
    }

    const query = `
      UPDATE incidents
      SET status = $1 ${additionalUpdates}
      WHERE id = $2
      RETURNING *
    `;

    const result = await db.query(query, [newStatus.toLowerCase(), id]);

    if (result.rows.length === 0) {
      throw new Error(`Incident with ID ${id} not found`);
    }

    // The trigger will automatically log this to incident_activity table
    logger.success('Incident status updated', { id, newStatus });

    return result.rows[0];

  } catch (error) {
    logger.error('Failed to update incident status', {
      error: error.message,
      id,
      newStatus,
    });
    throw error;
  }
}

/**
 * Assign incident to a team member
 *
 * @param {number} id - Incident ID
 * @param {string} assigneeName - Name of person to assign to
 * @param {string} actorName - Name of person making the assignment
 * @returns {Promise<Object>} - Updated incident
 */
async function assignIncident(id, assigneeName, actorName = 'System') {
  logger.info('Assigning incident', { id, assigneeName, actorName });

  try {
    const query = `
      UPDATE incidents
      SET assigned_to = $1
      WHERE id = $2
      RETURNING *
    `;

    const result = await db.query(query, [assigneeName, id]);

    if (result.rows.length === 0) {
      throw new Error(`Incident with ID ${id} not found`);
    }

    // Trigger will automatically log the assignment
    logger.success('Incident assigned', { id, assigneeName });

    return result.rows[0];

  } catch (error) {
    logger.error('Failed to assign incident', {
      error: error.message,
      id,
      assigneeName,
    });
    throw error;
  }
}

/**
 * Add a comment to an incident
 *
 * @param {number} incidentId - Incident ID
 * @param {string} authorName - Comment author name
 * @param {string} commentText - Comment content
 * @returns {Promise<Object>} - Created comment
 */
async function addComment(incidentId, authorName, commentText) {
  logger.info('Adding comment to incident', { incidentId, authorName });

  if (!commentText || !commentText.trim()) {
    throw new Error('Comment text cannot be empty');
  }

  try {
    const commentQuery = `
      INSERT INTO incident_comments (incident_id, author_name, comment_text)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const commentResult = await db.query(commentQuery, [
      incidentId,
      authorName,
      commentText.trim(),
    ]);

    // Also log this as an activity
    const activityQuery = `
      INSERT INTO incident_activity (incident_id, activity_type, actor_name, description)
      VALUES ($1, $2, $3, $4)
    `;

    await db.query(activityQuery, [
      incidentId,
      'commented',
      authorName,
      `${authorName} added a comment`,
    ]);

    logger.success('Comment added', { incidentId, commentId: commentResult.rows[0].id });

    return commentResult.rows[0];

  } catch (error) {
    logger.error('Failed to add comment', {
      error: error.message,
      incidentId,
    });
    throw error;
  }
}

/**
 * Get all comments for an incident
 *
 * @param {number} incidentId - Incident ID
 * @returns {Promise<Array>} - Array of comments
 */
async function getComments(incidentId) {
  logger.info('Fetching comments for incident', { incidentId });

  try {
    const query = `
      SELECT *
      FROM incident_comments
      WHERE incident_id = $1
      ORDER BY created_at ASC
    `;

    const result = await db.query(query, [incidentId]);

    logger.debug(`Retrieved ${result.rows.length} comments`, { incidentId });

    return result.rows;

  } catch (error) {
    logger.error('Failed to fetch comments', {
      error: error.message,
      incidentId,
    });
    throw error;
  }
}

/**
 * Get activity log for an incident
 *
 * @param {number} incidentId - Incident ID
 * @returns {Promise<Array>} - Array of activity records
 */
async function getActivity(incidentId) {
  logger.info('Fetching activity for incident', { incidentId });

  try {
    const query = `
      SELECT *
      FROM incident_activity
      WHERE incident_id = $1
      ORDER BY created_at DESC
    `;

    const result = await db.query(query, [incidentId]);

    logger.debug(`Retrieved ${result.rows.length} activity records`, { incidentId });

    return result.rows;

  } catch (error) {
    logger.error('Failed to fetch activity', {
      error: error.message,
      incidentId,
    });
    throw error;
  }
}

/**
 * Search incidents with filters
 *
 * @param {Object} filters - Search filters
 * @param {string} filters.q - Search query (searches title and description)
 * @param {string} filters.status - Filter by status
 * @param {string} filters.severity - Filter by severity
 * @param {string} filters.assignedTo - Filter by assignee
 * @returns {Promise<Array>} - Filtered incidents
 */
async function searchIncidents(filters = {}) {
  logger.info('Searching incidents', { filters });

  try {
    const conditions = [];
    const values = [];
    let paramCount = 0;

    // Search query - searches in title and description
    if (filters.q && filters.q.trim()) {
      paramCount++;
      conditions.push(`(title ILIKE $${paramCount} OR description ILIKE $${paramCount})`);
      values.push(`%${filters.q.trim()}%`);
    }

    // Filter by status
    if (filters.status) {
      paramCount++;
      conditions.push(`status = $${paramCount}`);
      values.push(filters.status.toLowerCase());
    }

    // Filter by severity
    if (filters.severity) {
      paramCount++;
      conditions.push(`severity = $${paramCount}`);
      values.push(filters.severity.toLowerCase());
    }

    // Filter by assignee
    if (filters.assignedTo) {
      paramCount++;
      conditions.push(`assigned_to = $${paramCount}`);
      values.push(filters.assignedTo);
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const query = `
      SELECT
        id,
        title,
        severity,
        status,
        assigned_to,
        ai_summary,
        created_at,
        updated_at
      FROM incidents
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT 100
    `;

    const result = await db.query(query, values);

    logger.info(`Search returned ${result.rows.length} incidents`, { filters });

    return result.rows;

  } catch (error) {
    logger.error('Failed to search incidents', {
      error: error.message,
      filters,
    });
    throw error;
  }
}

/**
 * Get analytics overview
 *
 * @returns {Promise<Object>} - Analytics data
 */
async function getAnalytics() {
  logger.info('Fetching analytics');

  try {
    // Get counts by status
    const statusQuery = `
      SELECT status, COUNT(*) as count
      FROM incidents
      GROUP BY status
    `;

    // Get counts by severity
    const severityQuery = `
      SELECT severity, COUNT(*) as count
      FROM incidents
      GROUP BY severity
    `;

    // Get total counts
    const totalQuery = `
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open_count,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_count,
        COUNT(CASE WHEN resolved_at IS NOT NULL THEN 1 END) as total_resolved
      FROM incidents
    `;

    const [statusResult, severityResult, totalResult] = await Promise.all([
      db.query(statusQuery),
      db.query(severityQuery),
      db.query(totalQuery),
    ]);

    const analytics = {
      byStatus: statusResult.rows,
      bySeverity: severityResult.rows,
      totals: totalResult.rows[0],
      timestamp: new Date().toISOString(),
    };

    logger.success('Analytics retrieved');

    return analytics;

  } catch (error) {
    logger.error('Failed to fetch analytics', { error: error.message });
    throw error;
  }
}

module.exports = {
  updateStatus,
  assignIncident,
  addComment,
  getComments,
  getActivity,
  searchIncidents,
  getAnalytics,
};
