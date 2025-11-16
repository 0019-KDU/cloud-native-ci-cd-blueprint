/**
 * Incidents Controller - HTTP Request Handlers
 *
 * Purpose: Handles HTTP requests and sends responses
 * Used by: incidents.routes.js (Express router)
 *
 * The controller is the "HTTP layer" - it:
 * 1. Receives HTTP requests (req)
 * 2. Extracts data from req.body, req.params, req.query
 * 3. Calls the service layer to do the actual work
 * 4. Sends HTTP responses (res) with appropriate status codes
 * 5. Handles errors and sends proper error responses
 *
 * Pattern: Each function is an Express middleware with signature (req, res, next)
 */

const incidentsService = require('../services/incidents.service');
const logger = require('../config/logger');

/**
 * Create a new incident
 * Route: POST /api/incidents
 * Body: { title, severity, description }
 * Response: 201 Created with incident object
 *
 * Example request body:
 * {
 *   "title": "Database connection timeout",
 *   "severity": "high",
 *   "description": "PostgreSQL connection pool exhausted. Error: ETIMEDOUT..."
 * }
 */
async function create(req, res, next) {
  try {
    const { title, severity, description } = req.body;

    // Log the incoming request
    logger.info('POST /api/incidents - Creating new incident', {
      title,
      severity,
    });

    // Call service layer to create incident
    // This will validate, call AI, save to DB
    const incident = await incidentsService.createIncident({
      title,
      severity,
      description,
    });

    // Send success response with 201 Created status
    res.status(201).json({
      success: true,
      data: incident,
      message: 'Incident created successfully',
    });

  } catch (error) {
    // Pass error to error handling middleware
    // This will be caught by errorHandler.js
    logger.error('Error in create incident controller', {
      error: error.message,
    });
    next(error);
  }
}

/**
 * Get all incidents
 * Route: GET /api/incidents
 * Query params: ?limit=20&offset=0 (optional, for pagination)
 * Response: 200 OK with array of incidents
 *
 * Example: GET /api/incidents?limit=10&offset=0
 */
async function getAll(req, res, next) {
  try {
    // Extract query parameters for pagination
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    logger.info('GET /api/incidents - Fetching all incidents', {
      limit,
      offset,
    });

    const incidents = await incidentsService.getAllIncidents({ limit, offset });

    // Send success response
    res.status(200).json({
      success: true,
      data: incidents,
      count: incidents.length,
      pagination: {
        limit,
        offset,
      },
    });

  } catch (error) {
    logger.error('Error in getAll incidents controller', {
      error: error.message,
    });
    next(error);
  }
}

/**
 * Get a single incident by ID
 * Route: GET /api/incidents/:id
 * URL param: id (incident ID)
 * Response: 200 OK with incident object, or 404 Not Found
 *
 * Example: GET /api/incidents/5
 */
async function getById(req, res, next) {
  try {
    const { id } = req.params;

    logger.info('GET /api/incidents/:id - Fetching incident', { id });

    const incident = await incidentsService.getIncidentById(id);

    // Handle case where incident doesn't exist
    if (!incident) {
      return res.status(404).json({
        success: false,
        message: `Incident with ID ${id} not found`,
      });
    }

    // Send success response
    res.status(200).json({
      success: true,
      data: incident,
    });

  } catch (error) {
    logger.error('Error in getById incidents controller', {
      error: error.message,
      id: req.params.id,
    });
    next(error);
  }
}

/**
 * Get incidents by severity
 * Route: GET /api/incidents/severity/:severity
 * URL param: severity ('low', 'medium', or 'high')
 * Response: 200 OK with array of incidents
 *
 * Example: GET /api/incidents/severity/high
 */
async function getBySeverity(req, res, next) {
  try {
    const { severity } = req.params;

    // Validate severity parameter
    const validSeverities = ['low', 'medium', 'high'];
    if (!validSeverities.includes(severity.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid severity. Must be one of: ${validSeverities.join(', ')}`,
      });
    }

    logger.info('GET /api/incidents/severity/:severity', { severity });

    const incidents = await incidentsService.getIncidentsBySeverity(severity);

    res.status(200).json({
      success: true,
      data: incidents,
      count: incidents.length,
    });

  } catch (error) {
    logger.error('Error in getBySeverity incidents controller', {
      error: error.message,
      severity: req.params.severity,
    });
    next(error);
  }
}

/**
 * Delete an incident
 * Route: DELETE /api/incidents/:id
 * URL param: id (incident ID)
 * Response: 200 OK on success, 404 if not found
 *
 * Example: DELETE /api/incidents/5
 */
async function deleteIncident(req, res, next) {
  try {
    const { id } = req.params;

    logger.info('DELETE /api/incidents/:id', { id });

    await incidentsService.deleteIncident(id);

    res.status(200).json({
      success: true,
      message: `Incident ${id} deleted successfully`,
    });

  } catch (error) {
    logger.error('Error in delete incidents controller', {
      error: error.message,
      id: req.params.id,
    });
    next(error);
  }
}

// Export all controller functions
module.exports = {
  create,
  getAll,
  getById,
  getBySeverity,
  deleteIncident,
};
