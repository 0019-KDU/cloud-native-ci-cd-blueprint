/**
 * Incidents Routes Unit Tests
 */

const request = require('supertest');
const express = require('express');
const incidentsRoutes = require('../../routes/incidents.routes');
const incidentsController = require('../../controllers/incidents.controller');

// Mock the controller
jest.mock('../../controllers/incidents.controller');

describe('Incidents Routes', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/incidents', incidentsRoutes);
  });

  it('should mount POST / route', async () => {
    incidentsController.createIncident.mockImplementation((req, res) => {
      res.status(201).json({ success: true });
    });

    const response = await request(app)
      .post('/api/incidents')
      .send({ title: 'Test' });

    expect(incidentsController.createIncident).toHaveBeenCalled();
  });

  it('should mount GET / route', async () => {
    incidentsController.getAllIncidents.mockImplementation((req, res) => {
      res.status(200).json({ success: true, data: [] });
    });

    const response = await request(app)
      .get('/api/incidents');

    expect(incidentsController.getAllIncidents).toHaveBeenCalled();
  });

  it('should mount GET /:id route', async () => {
    incidentsController.getIncidentById.mockImplementation((req, res) => {
      res.status(200).json({ success: true });
    });

    const response = await request(app)
      .get('/api/incidents/1');

    expect(incidentsController.getIncidentById).toHaveBeenCalled();
  });

  it('should mount PATCH /:id route', async () => {
    incidentsController.updateIncident.mockImplementation((req, res) => {
      res.status(200).json({ success: true });
    });

    const response = await request(app)
      .patch('/api/incidents/1')
      .send({ status: 'resolved' });

    expect(incidentsController.updateIncident).toHaveBeenCalled();
  });

  it('should mount DELETE /:id route', async () => {
    incidentsController.deleteIncident.mockImplementation((req, res) => {
      res.status(200).json({ success: true });
    });

    const response = await request(app)
      .delete('/api/incidents/1');

    expect(incidentsController.deleteIncident).toHaveBeenCalled();
  });
});
