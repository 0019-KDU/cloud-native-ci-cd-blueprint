/**
 * Incidents Management Routes
 *
 * Purpose: API routes for incident management operations
 * Used by: index.js
 *
 * These routes handle status updates, assignments, comments, search, and analytics
 */

const express = require('express');
const router = express.Router();
const managementController = require('../controllers/incidents-management.controller');

/**
 * PATCH /api/incidents/:id/status
 * Update incident status
 *
 * Body: { status: 'investigating', actorName: 'John Doe' }
 */
router.patch('/:id/status', managementController.updateStatus);

/**
 * PATCH /api/incidents/:id/assign
 * Assign incident to team member
 *
 * Body: { assignedTo: 'Jane Smith', actorName: 'John Doe' }
 */
router.patch('/:id/assign', managementController.assignIncident);

/**
 * POST /api/incidents/:id/comments
 * Add comment to incident
 *
 * Body: { authorName: 'John Doe', commentText: 'Working on this...' }
 */
router.post('/:id/comments', managementController.addComment);

/**
 * GET /api/incidents/:id/comments
 * Get all comments for an incident
 */
router.get('/:id/comments', managementController.getComments);

/**
 * GET /api/incidents/:id/activity
 * Get activity log for an incident
 */
router.get('/:id/activity', managementController.getActivity);

module.exports = router;
