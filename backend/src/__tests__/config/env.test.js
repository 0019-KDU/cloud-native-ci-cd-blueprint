/**
 * Configuration Unit Tests
 */

describe('Environment Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('env.js', () => {
    it('should load configuration with default values', () => {
      process.env.PORT = '3001';
      process.env.DB_HOST = 'localhost';
      process.env.OPENAI_API_KEY = 'test-key';

      const config = require('../../config/env');

      expect(config.port).toBe(3001);
      expect(config.database.host).toBe('localhost');
      expect(config.openai.apiKey).toBe('test-key');
    });

    it('should use environment-specific values', () => {
      process.env.NODE_ENV = 'production';
      process.env.PORT = '8080';
      process.env.DB_HOST = 'prod-db.example.com';

      const config = require('../../config/env');

      expect(config.env).toBe('production');
      expect(config.port).toBe(8080);
      expect(config.database.host).toBe('prod-db.example.com');
    });

    it('should have valid database configuration', () => {
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '5432';
      process.env.DB_NAME = 'test_db';
      process.env.DB_USER = 'testuser';
      process.env.DB_PASSWORD = 'testpass';

      const config = require('../../config/env');

      expect(config.database).toEqual({
        host: 'localhost',
        port: 5432,
        database: 'test_db',
        user: 'testuser',
        password: 'testpass'
      });
    });

    it('should have valid OpenAI configuration', () => {
      process.env.OPENAI_API_KEY = 'sk-test123';
      process.env.OPENAI_MODEL = 'gpt-4';
      process.env.OPENAI_TEMPERATURE = '0.5';
      process.env.OPENAI_MAX_TOKENS = '3000';

      const config = require('../../config/env');

      expect(config.openai.apiKey).toBe('sk-test123');
      expect(config.openai.model).toBe('gpt-4');
      expect(config.openai.temperature).toBe(0.5);
      expect(config.openai.maxTokens).toBe(3000);
    });
  });
});
