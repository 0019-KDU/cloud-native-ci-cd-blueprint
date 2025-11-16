/**
 * Incidents Routes
 *
 * Purpose: Defines all URL endpoints for incidents API
 * Used by: index.js (main Express app)
 *
 * This file maps HTTP methods + URLs to controller functions:
 * - POST   /api/incidents              → create new incident
 * - GET    /api/incidents              → get all incidents
 * - GET    /api/incidents/:id          → get specific incident
 * - GET    /api/incidents/severity/:severity → get incidents by severity
 *
 * The router is like a "mini-app" that handles all /api/incidents/* routes
 */

const express = require('express');
const router = express.Router();
const incidentsController = require('../controllers/incidents.controller');

/**
 * POST /api/incidents
 * Create a new incident with AI analysis
 *
 * Request body example:
 * {
 *   "title": "API Gateway returning 502 errors",
 *   "severity": "high",
 *   "description": "Nginx logs show: upstream prematurely closed connection..."
 * }
 *
 * Response: 201 Created with full incident object including AI fields
 */
router.post('/', incidentsController.create);

/**
 * GET /api/incidents
 * Get all incidents (with optional pagination)
 *
 * Query parameters:
 * - limit: number of incidents to return (default: 100)
 * - offset: number of incidents to skip (default: 0)
 *
 * Example: GET /api/incidents?limit=20&offset=0
 *
 * Response: 200 OK with array of incidents
 */
router.get('/', incidentsController.getAll);

/**
 * GET /api/incidents/severity/:severity
 * Get incidents filtered by severity level
 *
 * URL parameter:
 * - severity: 'low', 'medium', or 'high'
 *
 * Example: GET /api/incidents/severity/high
 *
 * IMPORTANT: This route MUST come BEFORE /:id route
 * Otherwise Express will treat "severity" as an ID
 *
 * Response: 200 OK with array of matching incidents
 */
router.get('/severity/:severity', incidentsController.getBySeverity);

/**
 * GET /api/incidents/:id
 * Get a single incident by ID
 *
 * URL parameter:
 * - id: incident ID (number)
 *
 * Example: GET /api/incidents/42
 *
 * Response: 200 OK with incident object, or 404 Not Found
 */
router.get('/:id', incidentsController.getById);

/**
 * DELETE /api/incidents/:id
 * Delete an incident by ID
 *
 * URL parameter:
 * - id: incident ID (number)
 *
 * Example: DELETE /api/incidents/42
 *
 * Response: 200 OK on success, 404 if not found
 * Note: This will cascade delete all related comments and activity
 */
router.delete('/:id', incidentsController.deleteIncident);

module.exports = router;
