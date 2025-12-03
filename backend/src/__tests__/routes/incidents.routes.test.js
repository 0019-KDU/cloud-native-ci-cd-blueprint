/**
 * Incidents Routes Unit Tests
 */

const incidentsRoutes = require('../../routes/incidents.routes');

describe('Incidents Routes', () => {
  it('should export a router', () => {
    expect(incidentsRoutes).toBeDefined();
    expect(typeof incidentsRoutes).toBe('function');
  });

  it('should have stack property (routes registered)', () => {
    expect(incidentsRoutes.stack).toBeDefined();
    expect(Array.isArray(incidentsRoutes.stack)).toBe(true);
  });

  it('should have multiple routes registered', () => {
    expect(incidentsRoutes.stack.length).toBeGreaterThan(0);
  });

});
