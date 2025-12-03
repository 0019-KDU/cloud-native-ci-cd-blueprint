/**
 * AI Service Unit Tests
 * Tests OpenAI integration and incident analysis generation
 */

const aiService = require('../../services/ai.service');
const OpenAI = require('openai');

// Mock OpenAI
jest.mock('openai');

describe('AI Service', () => {
  let mockOpenAI;
  let mockCreate;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    mockCreate = jest.fn();
    mockOpenAI = {
      chat: {
        completions: {
          create: mockCreate
        }
      }
    };
    
    OpenAI.mockImplementation(() => mockOpenAI);
  });

  describe('generateIncidentAnalysis', () => {
    const mockIncidentData = {
      title: 'API Gateway returning 502 errors',
      severity: 'high',
      description: 'Error logs show upstream timeout after 30s. Affecting 95% of requests.'
    };

    it('should generate comprehensive AI analysis successfully', async () => {
      const mockAIResponse = {
        summary: 'API Gateway experiencing cascading failures due to upstream timeout',
        rootCauses: [
          {
            cause: 'Payment service connection timeout',
            likelihood: 'high',
            reasoning: 'Logs show 30s timeouts',
            components: ['API Gateway', 'Payment Service']
          }
        ],
        customerMessage: 'We are investigating an issue affecting our services.',
        actionItems: [
          {
            priority: 'immediate',
            action: 'Increase timeout settings',
            owner: 'SRE',
            command: 'kubectl set env deployment/api-gateway TIMEOUT=60s'
          }
        ],
        suggestedSeverity: 'critical',
        severityJustification: 'Affects 95% of users',
        similarPatterns: ['Cascading failure pattern'],
        preventiveMeasures: ['Implement circuit breaker']
      };

      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify(mockAIResponse)
          }
        }],
        usage: { total_tokens: 1500 },
        model: 'gpt-4o-mini'
      });

      const result = await aiService.generateIncidentAnalysis(mockIncidentData);

      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('rootCauses');
      expect(result).toHaveProperty('customerMessage');
      expect(result).toHaveProperty('actionItems');
      expect(result).toHaveProperty('metadata');
      expect(result.metadata.tokensUsed).toBeGreaterThanOrEqual(0);
      expect(mockCreate).toHaveBeenCalled();
    });

    it('should format root causes with likelihood and components', async () => {
      const mockAIResponse = {
        summary: 'Test summary',
        rootCauses: [
          {
            cause: 'Database connection pool exhausted',
            likelihood: 'high',
            reasoning: 'Pool at max capacity',
            components: ['PostgreSQL', 'API']
          }
        ],
        customerMessage: 'Test message',
        actionItems: [],
        suggestedSeverity: 'high'
      };

      mockCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(mockAIResponse) } }],
        usage: { total_tokens: 1000 },
        model: 'gpt-4o-mini'
      });

      const result = await aiService.generateIncidentAnalysis(mockIncidentData);

      expect(result.rootCauses).toBeDefined();
      expect(Array.isArray(result.rootCauses)).toBe(true);
      expect(result.rootCauses.length).toBeGreaterThan(0);
      expect(result.rootCauses[0]).toContain('[');
    });

    it('should format action items with priority and owner', async () => {
      const mockAIResponse = {
        summary: 'Test summary',
        rootCauses: ['Test cause'],
        customerMessage: 'Test message',
        actionItems: [
          {
            priority: 'immediate',
            action: 'Restart service',
            owner: 'SRE',
            command: 'kubectl rollout restart deployment/api'
          }
        ],
        suggestedSeverity: 'high'
      };

      mockCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(mockAIResponse) } }],
        usage: { total_tokens: 1000 },
        model: 'gpt-4o-mini'
      });

      const result = await aiService.generateIncidentAnalysis(mockIncidentData);

      expect(result.actionItems).toBeDefined();
      expect(Array.isArray(result.actionItems)).toBe(true);
      expect(result.actionItems.length).toBeGreaterThan(0);
      expect(result.actionItems[0]).toContain('[');
      expect(result.actionItems[0]).toContain('@');
    });

    it('should return fallback response when OpenAI fails', async () => {
      mockCreate.mockRejectedValue(new Error('OpenAI API unavailable'));

      const result = await aiService.generateIncidentAnalysis(mockIncidentData);

      expect(result.summary).toContain('AI analysis unavailable');
      expect(result.rootCauses[0]).toContain('[HIGH]');
      expect(result.actionItems.length).toBeGreaterThan(0);
      expect(result.metadata.fallbackMode).toBe(true);
    });

    it('should handle malformed AI responses', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'invalid json' } }],
        usage: { total_tokens: 100 },
        model: 'gpt-4o-mini'
      });

      const result = await aiService.generateIncidentAnalysis(mockIncidentData);

      expect(result.metadata.fallbackMode).toBe(true);
    });

    it('should handle missing AI response fields', async () => {
      const incompleteResponse = {
        summary: 'Test summary'
        // Missing required fields
      };

      mockCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(incompleteResponse) } }],
        usage: { total_tokens: 100 },
        model: 'gpt-4o-mini'
      });

      const result = await aiService.generateIncidentAnalysis(mockIncidentData);

      expect(result.metadata.fallbackMode).toBe(true);
    });
  });

  describe('testOpenAIConnection', () => {
    it('should return true when connection succeeds', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Test' } }]
      });

      const result = await aiService.testOpenAIConnection();

      expect(typeof result).toBe('boolean');
      expect(mockCreate).toHaveBeenCalled();
    });

    it('should return false when connection fails', async () => {
      mockCreate.mockRejectedValue(new Error('Connection failed'));

      const result = await aiService.testOpenAIConnection();

      expect(result).toBe(false);
    });
  });
});
