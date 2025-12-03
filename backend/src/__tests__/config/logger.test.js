/**
 * Logger Configuration Unit Tests
 */

const logger = require('../../config/logger');

describe('Logger Configuration', () => {
  it('should have info method', () => {
    expect(typeof logger.info).toBe('function');
  });

  it('should have error method', () => {
    expect(typeof logger.error).toBe('function');
  });

  it('should have warn method', () => {
    expect(typeof logger.warn).toBe('function');
  });

  it('should have debug method', () => {
    expect(typeof logger.debug).toBe('function');
  });

  it('should log info messages without error', () => {
    expect(() => {
      logger.info('Test info message');
    }).not.toThrow();
  });

  it('should log error messages without error', () => {
    expect(() => {
      logger.error('Test error message');
    }).not.toThrow();
  });

  it('should log with metadata', () => {
    expect(() => {
      logger.info('Test with metadata', { key: 'value' });
    }).not.toThrow();
  });
});
