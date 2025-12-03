/**
 * Incidents Service Unit Tests
 * Tests business logic for incident management
 */

const incidentsService = require('../../services/incidents.service');
const db = require('../../db');
const aiService = require('../../services/ai.service');

// Mock dependencies
jest.mock('../../db');
jest.mock('../../services/ai.service');

describe('Incidents Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createIncident', () => {
    const validIncidentData = {
      title: 'Database connection timeout',
      severity: 'high',
      description: 'Connection pool exhausted. Error: timeout after 30s.'
    };

    const mockAIAnalysis = {
      summary: 'Database connection pool saturated',
      rootCauses: ['Connection pool at max capacity'],
      customerMessage: 'We are investigating database issues',
      actionItems: ['1. [IMMEDIATE] Check connection pool'],
      suggestedSeverity: 'high',
      metadata: {
        severityJustification: 'High user impact',
        similarPatterns: [],
        preventiveMeasures: [],
        analysisTimestamp: new Date().toISOString(),
        tokensUsed: 1500
      }
    };

    it('should create incident with AI analysis successfully', async () => {
      aiService.generateIncidentAnalysis.mockResolvedValue(mockAIAnalysis);
      
      db.query.mockResolvedValue({
        rows: [{
          id: 1,
          ...validIncidentData,
          ai_summary: mockAIAnalysis.summary,
          ai_root_causes: mockAIAnalysis.rootCauses,
          ai_customer_message: mockAIAnalysis.customerMessage,
          ai_action_items: mockAIAnalysis.actionItems,
          ai_metadata: mockAIAnalysis.metadata,
          status: 'open',
          created_at: new Date(),
          updated_at: new Date()
        }]
      });

      const result = await incidentsService.createIncident(validIncidentData);

      expect(result).toHaveProperty('id');
      expect(result.title).toBe(validIncidentData.title);
      expect(aiService.generateIncidentAnalysis).toHaveBeenCalledWith(validIncidentData);
      expect(db.query).toHaveBeenCalledTimes(1);
    });

    it('should throw error when title is missing', async () => {
      const invalidData = { severity: 'high', description: 'Test' };

      await expect(incidentsService.createIncident(invalidData))
        .rejects
        .toThrow('Missing required fields');
    });

    it('should throw error when severity is missing', async () => {
      const invalidData = { title: 'Test', description: 'Test' };

      await expect(incidentsService.createIncident(invalidData))
        .rejects
        .toThrow('Missing required fields');
    });

    it('should throw error when description is missing', async () => {
      const invalidData = { title: 'Test', severity: 'high' };

      await expect(incidentsService.createIncident(invalidData))
        .rejects
        .toThrow('Missing required fields');
    });

    it('should throw error for invalid severity', async () => {
      const invalidData = {
        title: 'Test',
        severity: 'invalid',
        description: 'Test'
      };

      await expect(incidentsService.createIncident(invalidData))
        .rejects
        .toThrow('Invalid severity');
    });

    it('should accept valid severity values', async () => {
      const severities = ['low', 'medium', 'high'];
      
      for (const severity of severities) {
        aiService.generateIncidentAnalysis.mockResolvedValue(mockAIAnalysis);
        db.query.mockResolvedValue({
          rows: [{ id: 1, ...validIncidentData, severity, status: 'open' }]
        });

        const data = { ...validIncidentData, severity };
        const result = await incidentsService.createIncident(data);
        
        expect(result.severity).toBe(severity);
      }
    });

    it('should handle AI service failure gracefully', async () => {
      aiService.generateIncidentAnalysis.mockRejectedValue(
        new Error('OpenAI API unavailable')
      );

      await expect(incidentsService.createIncident(validIncidentData))
        .rejects
        .toThrow();
    });

    it('should handle database insertion failure', async () => {
      aiService.generateIncidentAnalysis.mockResolvedValue(mockAIAnalysis);
      db.query.mockRejectedValue(new Error('Database connection failed'));

      await expect(incidentsService.createIncident(validIncidentData))
        .rejects
        .toThrow('Database connection failed');
    });
  });

  describe('getAllIncidents', () => {
    it('should return all incidents with default pagination', async () => {
      const mockIncidents = [
        { id: 1, title: 'Incident 1', severity: 'high' },
        { id: 2, title: 'Incident 2', severity: 'medium' }
      ];

      db.query.mockResolvedValue({ rows: mockIncidents });

      const result = await incidentsService.getAllIncidents();

      expect(result).toHaveLength(2);
      expect(db.query).toHaveBeenCalledWith(
        expect.any(String),
        [100, 0]
      );
    });

    it('should support custom limit and offset', async () => {
      db.query.mockResolvedValue({ rows: [] });

      await incidentsService.getAllIncidents({ limit: 20, offset: 10 });

      expect(db.query).toHaveBeenCalledWith(
        expect.any(String),
        [20, 10]
      );
    });

    it('should handle database errors', async () => {
      db.query.mockRejectedValue(new Error('Database error'));

      await expect(incidentsService.getAllIncidents())
        .rejects
        .toThrow('Database error');
    });
  });

  describe('getIncidentById', () => {
    it('should return incident when found', async () => {
      const mockIncident = {
        id: 1,
        title: 'Test Incident',
        severity: 'high',
        ai_root_causes: ['Cause 1', 'Cause 2']
      };

      db.query.mockResolvedValue({ rows: [mockIncident] });

      const result = await incidentsService.getIncidentById(1);

      expect(result).toEqual(mockIncident);
      expect(db.query).toHaveBeenCalledWith(
        expect.any(String),
        [1]
      );
    });

    it('should return null when incident not found', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await incidentsService.getIncidentById(999);

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      db.query.mockRejectedValue(new Error('Database error'));

      await expect(incidentsService.getIncidentById(1))
        .rejects
        .toThrow('Database error');
    });
  });

  describe('getIncidentsBySeverity', () => {
    it('should return incidents filtered by severity', async () => {
      const mockIncidents = [
        { id: 1, title: 'Incident 1', severity: 'high' },
        { id: 2, title: 'Incident 2', severity: 'high' }
      ];

      db.query.mockResolvedValue({ rows: mockIncidents });

      const result = await incidentsService.getIncidentsBySeverity('high');

      expect(result).toHaveLength(2);
      expect(db.query).toHaveBeenCalledWith(
        expect.any(String),
        ['high']
      );
    });

    it('should normalize severity to lowercase', async () => {
      db.query.mockResolvedValue({ rows: [] });

      await incidentsService.getIncidentsBySeverity('HIGH');

      expect(db.query).toHaveBeenCalledWith(
        expect.any(String),
        ['high']
      );
    });
  });

  describe('deleteIncident', () => {
    it('should delete incident successfully', async () => {
      db.query.mockResolvedValue({ rows: [{ id: 1 }] });

      const result = await incidentsService.deleteIncident(1);

      expect(result).toBe(true);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM incidents'),
        [1]
      );
    });

    it('should throw error when incident not found', async () => {
      db.query.mockResolvedValue({ rows: [] });

      await expect(incidentsService.deleteIncident(999))
        .rejects
        .toThrow('Incident with ID 999 not found');
    });

    it('should handle database errors', async () => {
      db.query.mockRejectedValue(new Error('Database error'));

      await expect(incidentsService.deleteIncident(1))
        .rejects
        .toThrow('Database error');
    });
  });
});
