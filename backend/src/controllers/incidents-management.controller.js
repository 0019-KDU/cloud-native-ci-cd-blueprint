/**
 * Incidents Management Controller
 *
 * Purpose: HTTP handlers for incident management operations
 * Used by: incidents-management.routes.js
 *
 * Handles status updates, assignments, comments, search, and analytics
 */

const managementService = require('../services/incidents-management.service');
const logger = require('../config/logger');

/**
 * Update incident status
 * Route: PATCH /api/incidents/:id/status
 * Body: { status: 'investigating', actorName: 'John Doe' }
 */
async function updateStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, actorName } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
      });
    }

    logger.info(`PATCH /api/incidents/${id}/status`, { status, actorName });

    const incident = await managementService.updateStatus(id, status, actorName);

    res.status(200).json({
      success: true,
      data: incident,
      message: `Status updated to ${status}`,
    });

  } catch (error) {
    logger.error('Error updating incident status', { error: error.message });
    next(error);
  }
}

/**
 * Assign incident to team member
 * Route: PATCH /api/incidents/:id/assign
 * Body: { assignedTo: 'Jane Smith', actorName: 'John Doe' }
 */
async function assignIncident(req, res, next) {
  try {
    const { id } = req.params;
    const { assignedTo, actorName } = req.body;

    logger.info(`PATCH /api/incidents/${id}/assign`, { assignedTo, actorName });

    const incident = await managementService.assignIncident(id, assignedTo, actorName);

    res.status(200).json({
      success: true,
      data: incident,
      message: `Incident assigned to ${assignedTo}`,
    });

  } catch (error) {
    logger.error('Error assigning incident', { error: error.message });
    next(error);
  }
}

/**
 * Add comment to incident
 * Route: POST /api/incidents/:id/comments
 * Body: { authorName: 'John Doe', commentText: 'Investigating...' }
 */
async function addComment(req, res, next) {
  try {
    const { id } = req.params;
    const { authorName, commentText } = req.body;

    if (!authorName || !commentText) {
      return res.status(400).json({
        success: false,
        message: 'Author name and comment text are required',
      });
    }

    logger.info(`POST /api/incidents/${id}/comments`, { authorName });

    const comment = await managementService.addComment(id, authorName, commentText);

    res.status(201).json({
      success: true,
      data: comment,
      message: 'Comment added successfully',
    });

  } catch (error) {
    logger.error('Error adding comment', { error: error.message });
    next(error);
  }
}

/**
 * Get comments for incident
 * Route: GET /api/incidents/:id/comments
 */
async function getComments(req, res, next) {
  try {
    const { id } = req.params;

    logger.info(`GET /api/incidents/${id}/comments`);

    const comments = await managementService.getComments(id);

    res.status(200).json({
      success: true,
      data: comments,
      count: comments.length,
    });

  } catch (error) {
    logger.error('Error fetching comments', { error: error.message });
    next(error);
  }
}

/**
 * Get activity log for incident
 * Route: GET /api/incidents/:id/activity
 */
async function getActivity(req, res, next) {
  try {
    const { id } = req.params;

    logger.info(`GET /api/incidents/${id}/activity`);

    const activity = await managementService.getActivity(id);

    res.status(200).json({
      success: true,
      data: activity,
      count: activity.length,
    });

  } catch (error) {
    logger.error('Error fetching activity', { error: error.message });
    next(error);
  }
}

/**
 * Search incidents
 * Route: GET /api/incidents/search?q=database&status=open&severity=high
 */
async function searchIncidents(req, res, next) {
  try {
    const filters = {
      q: req.query.q,
      status: req.query.status,
      severity: req.query.severity,
      assignedTo: req.query.assignedTo,
    };

    logger.info('GET /api/incidents/search', { filters });

    const incidents = await managementService.searchIncidents(filters);

    res.status(200).json({
      success: true,
      data: incidents,
      count: incidents.length,
      filters,
    });

  } catch (error) {
    logger.error('Error searching incidents', { error: error.message });
    next(error);
  }
}

/**
 * Get analytics overview
 * Route: GET /api/analytics/overview
 */
async function getAnalytics(req, res, next) {
  try {
    logger.info('GET /api/analytics/overview');

    const analytics = await managementService.getAnalytics();

    res.status(200).json({
      success: true,
      data: analytics,
    });

  } catch (error) {
    logger.error('Error fetching analytics', { error: error.message });
    next(error);
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
