/**
 * Incidents Controller Unit Tests
 * Tests HTTP request/response handling
 */

const request = require('supertest');
const express = require('express');
const incidentsController = require('../../controllers/incidents.controller');
const incidentsService = require('../../services/incidents.service');

// Mock service
jest.mock('../../services/incidents.service');

// Setup Express app for testing
const app = express();
app.use(express.json());
app.post('/api/incidents', incidentsController.create);
app.get('/api/incidents', incidentsController.getAll);
app.get('/api/incidents/:id', incidentsController.getById);
app.delete('/api/incidents/:id', incidentsController.deleteIncident);

describe('Incidents Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/incidents', () => {
    const validIncident = {
      title: 'API Gateway timeout',
      severity: 'high',
      description: 'Timeout errors affecting 90% of requests'
    };

    it('should create incident and return 201', async () => {
      const mockCreatedIncident = {
        id: 1,
        ...validIncident,
        ai_summary: 'Test summary',
        status: 'open',
        created_at: new Date()
      };

      incidentsService.createIncident.mockResolvedValue(mockCreatedIncident);

      const response = await request(app)
        .post('/api/incidents')
        .send(validIncident);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.title).toBe(validIncident.title);
    });

    it('should return 400 for missing fields', async () => {
      const error = new Error('Missing required fields');
      error.statusCode = 400;
      incidentsService.createIncident.mockRejectedValue(error);

      const response = await request(app)
        .post('/api/incidents')
        .send({ title: 'Test' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid severity', async () => {
      const error = new Error('Invalid severity');
      error.statusCode = 400;
      incidentsService.createIncident.mockRejectedValue(error);

      const response = await request(app)
        .post('/api/incidents')
        .send({ ...validIncident, severity: 'invalid' });

      expect(response.status).toBe(400);
    });

    it('should return 500 for server errors', async () => {
      incidentsService.createIncident.mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .post('/api/incidents')
        .send(validIncident);

      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/incidents', () => {
    it('should return all incidents with 200', async () => {
      const mockIncidents = [
        { id: 1, title: 'Incident 1', severity: 'high' },
        { id: 2, title: 'Incident 2', severity: 'medium' }
      ];

      incidentsService.getAllIncidents.mockResolvedValue(mockIncidents);

      const response = await request(app)
        .get('/api/incidents');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].id).toBe(1);
    });

    it('should support pagination query parameters', async () => {
      incidentsService.getAllIncidents.mockResolvedValue([]);

      await request(app)
        .get('/api/incidents?limit=20&offset=10');

      expect(incidentsService.getAllIncidents).toHaveBeenCalledWith({
        limit: 20,
        offset: 10
      });
    });

    it('should return empty array when no incidents', async () => {
      incidentsService.getAllIncidents.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/incidents');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should return 500 for server errors', async () => {
      incidentsService.getAllIncidents.mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .get('/api/incidents');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/incidents/:id', () => {
    it('should return incident by id with 200', async () => {
      const mockIncident = {
        id: 1,
        title: 'Test Incident',
        severity: 'high'
      };

      incidentsService.getIncidentById.mockResolvedValue(mockIncident);

      const response = await request(app)
        .get('/api/incidents/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(1);
      expect(response.body.data.title).toBe('Test Incident');
    });

    it('should return 404 when incident not found', async () => {
      incidentsService.getIncidentById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/incidents/999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      if (response.body.error) {
        expect(response.body.error.message || response.body.error).toContain('not found');
      }
    });

    it('should return 500 for server errors', async () => {
      incidentsService.getIncidentById.mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .get('/api/incidents/1');

      expect(response.status).toBe(500);
    });
  });

  describe('DELETE /api/incidents/:id', () => {
    it('should delete incident and return 200', async () => {
      incidentsService.deleteIncident.mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/incidents/1');

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('deleted successfully');
    });

    it('should return 404 when incident not found', async () => {
      const error = new Error('Incident not found');
      error.statusCode = 404;
      incidentsService.deleteIncident.mockRejectedValue(error);

      const response = await request(app)
        .delete('/api/incidents/999');

      expect(response.status).toBe(404);
    });

    it('should return 500 for server errors', async () => {
      incidentsService.deleteIncident.mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .delete('/api/incidents/1');

      expect(response.status).toBe(500);
    });
  });
});
