/**
 * Incidents Service - Business Logic Layer
 *
 * Purpose: Handles all business logic for incident management
 * Used by: incidents.controller.js (called by HTTP request handlers)
 *
 * This service layer sits between the controller (HTTP layer) and the database.
 * It orchestrates operations across multiple services (AI + DB) and contains
 * the core business logic.
 *
 * Flow for creating an incident:
 * 1. Validate input data
 * 2. Call AI service to generate analysis
 * 3. Save incident + AI analysis to database
 * 4. Return complete incident object
 */

const db = require('../db');
const aiService = require('./ai.service');
const logger = require('../config/logger');

/**
 * Create a new incident with AI analysis
 *
 * @param {Object} incidentData - Incident details from user
 * @param {string} incidentData.title - Incident title
 * @param {string} incidentData.severity - Severity: 'low', 'medium', or 'high'
 * @param {string} incidentData.description - Full description with error logs
 * @returns {Promise<Object>} - Complete incident object with AI fields
 *
 * This is the main function that:
 * 1. Validates the input
 * 2. Calls OpenAI to generate analysis
 * 3. Saves everything to the database
 * 4. Returns the created incident
 */
async function createIncident(incidentData) {
  const { title, severity, description } = incidentData;

  // Validation
  if (!title || !severity || !description) {
    throw new Error('Missing required fields: title, severity, and description are required');
  }

  // Validate severity value
  const validSeverities = ['low', 'medium', 'high'];
  if (!validSeverities.includes(severity.toLowerCase())) {
    throw new Error(`Invalid severity. Must be one of: ${validSeverities.join(', ')}`);
  }

  logger.info('Creating new incident', { title, severity });

  try {
    // Step 1: Generate AI analysis
    // This calls OpenAI and gets back summary, root causes, and customer message
    const aiAnalysis = await aiService.generateIncidentAnalysis({
      title,
      severity,
      description,
    });

    logger.debug('AI analysis received', {
      summary: aiAnalysis.summary,
      rootCausesCount: aiAnalysis.rootCauses.length,
    });

    // Step 2: Save to database with enhanced AI metadata
    // We use parameterized query ($1, $2, etc.) to prevent SQL injection
    const query = `
      INSERT INTO incidents (
        title,
        severity,
        description,
        ai_summary,
        ai_root_causes,
        ai_customer_message,
        ai_action_items,
        ai_metadata,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      title,
      severity.toLowerCase(),
      description,
      aiAnalysis.summary,
      JSON.stringify(aiAnalysis.rootCauses), // Convert array to JSON for JSONB column
      aiAnalysis.customerMessage,
      JSON.stringify(aiAnalysis.actionItems || []),
      JSON.stringify(aiAnalysis.metadata || {}), // Store enhanced metadata
      'open', // Initial status
    ];

    const result = await db.query(query, values);
    const incident = result.rows[0];

    // PostgreSQL JSONB column already returns the data as an object/array
    // No need to parse it - it's already in the correct format

    logger.success('Incident created successfully', {
      id: incident.id,
      title: incident.title,
    });

    return incident;

  } catch (error) {
    logger.error('Failed to create incident', {
      error: error.message,
      title,
    });
    throw error;
  }
}

/**
 * Get all incidents, sorted by most recent first
 *
 * @param {Object} options - Query options
 * @param {number} options.limit - Maximum number of incidents to return (default: 100)
 * @param {number} options.offset - Number of incidents to skip for pagination (default: 0)
 * @returns {Promise<Array>} - Array of incident objects
 *
 * Example usage:
 *   const incidents = await getAllIncidents({ limit: 20, offset: 0 });
 */
async function getAllIncidents(options = {}) {
  const limit = options.limit || 100;
  const offset = options.offset || 0;

  logger.info('Fetching all incidents', { limit, offset });

  try {
    const query = `
      SELECT
        id,
        title,
        severity,
        status,
        assigned_to,
        description,
        ai_summary,
        ai_root_causes,
        ai_customer_message,
        ai_action_items,
        ai_metadata,
        created_at,
        updated_at,
        resolved_at,
        closed_at
      FROM incidents
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await db.query(query, [limit, offset]);

    // Parse JSONB fields for each incident
    const incidents = result.rows.map(incident => ({
      ...incident,
      ai_root_causes: incident.ai_root_causes || [],
    }));

    logger.debug(`Retrieved ${incidents.length} incidents`);

    return incidents;

  } catch (error) {
    logger.error('Failed to fetch incidents', { error: error.message });
    throw error;
  }
}

/**
 * Get a single incident by ID
 *
 * @param {number} id - Incident ID
 * @returns {Promise<Object|null>} - Incident object or null if not found
 *
 * Example usage:
 *   const incident = await getIncidentById(5);
 *   if (!incident) {
 *     // Handle not found
 *   }
 */
async function getIncidentById(id) {
  logger.info('Fetching incident by ID', { id });

  try {
    const query = `
      SELECT
        id,
        title,
        severity,
        status,
        assigned_to,
        description,
        ai_summary,
        ai_root_causes,
        ai_customer_message,
        ai_action_items,
        ai_metadata,
        created_at,
        updated_at,
        resolved_at,
        closed_at
      FROM incidents
      WHERE id = $1
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      logger.warn('Incident not found', { id });
      return null;
    }

    const incident = result.rows[0];

    // PostgreSQL JSONB column already returns the data as an object/array
    // No parsing needed

    logger.debug('Incident retrieved successfully', { id, title: incident.title });

    return incident;

  } catch (error) {
    logger.error('Failed to fetch incident', { error: error.message, id });
    throw error;
  }
}

/**
 * Get incidents by severity
 * Useful for filtering high-priority incidents
 *
 * @param {string} severity - Severity level: 'low', 'medium', or 'high'
 * @returns {Promise<Array>} - Array of incidents matching severity
 */
async function getIncidentsBySeverity(severity) {
  logger.info('Fetching incidents by severity', { severity });

  try {
    const query = `
      SELECT
        id,
        title,
        severity,
        description,
        ai_summary,
        ai_root_causes,
        ai_customer_message,
        created_at,
        updated_at
      FROM incidents
      WHERE severity = $1
      ORDER BY created_at DESC
    `;

    const result = await db.query(query, [severity.toLowerCase()]);

    const incidents = result.rows.map(incident => ({
      ...incident,
      ai_root_causes: incident.ai_root_causes || [],
    }));

    logger.debug(`Retrieved ${incidents.length} ${severity} severity incidents`);

    return incidents;

  } catch (error) {
    logger.error('Failed to fetch incidents by severity', {
      error: error.message,
      severity,
    });
    throw error;
  }
}

/**
 * Delete an incident by ID
 * This will cascade delete all related comments and activity (due to ON DELETE CASCADE)
 *
 * @param {number} id - Incident ID
 * @returns {Promise<boolean>} - True if deleted successfully
 */
async function deleteIncident(id) {
  logger.info('Deleting incident', { id });

  try {
    const query = `
      DELETE FROM incidents
      WHERE id = $1
      RETURNING id
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      throw new Error(`Incident with ID ${id} not found`);
    }

    logger.success('Incident deleted successfully', { id });

    return true;

  } catch (error) {
    logger.error('Failed to delete incident', {
      error: error.message,
      id,
    });
    throw error;
  }
}

// Export all service functions
module.exports = {
  createIncident,
  getAllIncidents,
  getIncidentById,
  getIncidentsBySeverity,
  deleteIncident,
};
