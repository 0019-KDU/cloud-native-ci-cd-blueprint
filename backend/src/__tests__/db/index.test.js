/**
 * Database Connection Unit Tests
 */

const db = require('../../db');
const { Pool } = require('pg');

jest.mock('pg', () => {
  const mClient = {
    connect: jest.fn(),
    query: jest.fn(),
    release: jest.fn()
  };
  const mPool = {
    connect: jest.fn(() => Promise.resolve(mClient)),
    query: jest.fn(),
    end: jest.fn(),
    on: jest.fn()
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('Database Module', () => {
  let mockPool;
  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPool = new Pool();
    mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };
  });

  describe('testConnection', () => {
    it('should return true when connection succeeds', async () => {
      mockPool.connect.mockResolvedValue({
        query: jest.fn().mockResolvedValue({ rows: [{ now: new Date() }] }),
        release: jest.fn()
      });

      const result = await db.testConnection();

      expect(result).toBe(true);
      expect(mockPool.connect).toHaveBeenCalled();
    });

    it('should throw error when connection fails', async () => {
      mockPool.connect.mockRejectedValue(new Error('Connection refused'));

      await expect(db.testConnection()).rejects.toThrow('Connection refused');
    });
  });

  describe('query', () => {
    it('should execute query successfully', async () => {
      const mockResult = { rows: [{ id: 1 }], rowCount: 1 };
      mockPool.query.mockResolvedValue(mockResult);

      const result = await db.query('SELECT * FROM incidents WHERE id = $1', [1]);

      expect(result).toEqual(mockResult);
      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM incidents WHERE id = $1',
        [1]
      );
    });

    it('should throw error when query fails', async () => {
      mockPool.query.mockRejectedValue(new Error('Query error'));

      await expect(db.query('INVALID SQL')).rejects.toThrow('Query error');
    });
  });

  describe('closePool', () => {
    it('should close pool successfully', async () => {
      mockPool.end.mockResolvedValue();

      await db.closePool();

      expect(mockPool.end).toHaveBeenCalled();
    });

    it('should handle errors when closing pool', async () => {
      mockPool.end.mockRejectedValue(new Error('Close error'));

      await expect(db.closePool()).resolves.not.toThrow();
    });
  });
});
