/**
 * AI Service - OpenAI Integration
 *
 * Purpose: Handles all interactions with OpenAI API
 * Used by: incidents.service.js when creating new incidents
 *
 * Flow:
 * 1. Receives incident data (title, severity, description)
 * 2. Constructs a prompt asking OpenAI to generate:
 *    - A concise summary
 *    - 2-3 root cause suggestions
 *    - A customer-friendly status message
 * 3. Calls OpenAI API with structured output format (JSON)
 * 4. Parses and returns the AI-generated analysis
 */

const OpenAI = require('openai');
const config = require('../config/env');
const logger = require('../config/logger');

// Initialize OpenAI client with API key from environment
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

/**
 * Generates AI analysis for an incident
 *
 * @param {Object} incidentData - The incident information
 * @param {string} incidentData.title - Incident title
 * @param {string} incidentData.severity - Severity level (low/medium/high)
 * @param {string} incidentData.description - Full incident description with error logs
 * @returns {Promise<Object>} - AI analysis with summary, rootCauses, customerMessage
 *
 * Example return value:
 * {
 *   summary: "Database connection pool exhausted due to memory leak",
 *   rootCauses: ["Connection pool not releasing connections", "Memory leak in query handler"],
 *   customerMessage: "We're experiencing temporary database issues. Our team is investigating."
 * }
 */
async function generateIncidentAnalysis(incidentData) {
  const { title, severity, description } = incidentData;

  logger.info('Requesting AI analysis from OpenAI', {
    title,
    severity,
    model: config.openai.model,
  });

  try {
    // Construct an advanced prompt with detailed context and expert-level analysis
    const systemPrompt = `You are a Senior Site Reliability Engineer (SRE) and DevOps expert with 15+ years of experience in:
- Distributed systems architecture
- Cloud infrastructure (AWS, Azure, GCP)
- Kubernetes and container orchestration
- Database performance tuning
- Network troubleshooting
- Application performance monitoring
- Incident response and post-mortem analysis

Your analysis should demonstrate deep technical expertise while being clear and actionable.`;

    const userPrompt = `Analyze this production incident with expert-level precision:

INCIDENT DETAILS:
Title: ${title}
Declared Severity: ${severity}
Full Description & Error Logs:
${description}

REQUIRED ANALYSIS:

1. TECHNICAL SUMMARY (2-3 sentences)
   - Identify the core technical issue
   - Explain the immediate impact on system functionality
   - Use precise technical terminology

2. ROOT CAUSE ANALYSIS (3-5 detailed causes, ranked by likelihood)
   - For each cause, explain WHY it could happen
   - Include specific system components or services involved
   - Reference error patterns, codes, or stack traces from the description
   - Distinguish between symptoms and actual root causes

3. CUSTOMER STATUS MESSAGE (professional, empathetic, clear)
   - Acknowledge the issue without technical jargon
   - Provide realistic expectations
   - Show we're actively working on it
   - Avoid phrases like "we apologize for the inconvenience"

4. ACTIONABLE RESOLUTION STEPS (5-7 technical steps)
   - Prioritize immediate mitigation over long-term fixes
   - Include specific commands, API calls, or procedures
   - Mention which team or role should handle each step
   - Include verification steps to confirm resolution
   - Consider rollback or failover options

5. SEVERITY ASSESSMENT (low, medium, high, critical)
   - Evaluate actual severity based on:
     * User impact scope (% affected)
     * Business criticality
     * Data integrity risk
     * System availability
   - May differ from declared severity

6. SIMILAR INCIDENT PATTERNS (1-2 related scenarios)
   - Reference common DevOps issues this resembles
   - Mention if this could indicate a larger systemic issue

7. PREVENTIVE MEASURES (2-3 recommendations)
   - Suggest monitoring, alerting, or architectural improvements
   - Recommend testing or validation procedures

RESPONSE FORMAT (JSON):
{
  "summary": "Technical summary here",
  "rootCauses": [
    {
      "cause": "Primary root cause description",
      "likelihood": "high|medium|low",
      "reasoning": "Why this is likely based on evidence",
      "components": ["service-name", "database", "network"]
    }
  ],
  "customerMessage": "Customer-facing message",
  "actionItems": [
    {
      "priority": "immediate|high|medium",
      "action": "Specific step to take",
      "owner": "SRE|DevOps|Engineering|DBA",
      "command": "Optional: specific command or procedure"
    }
  ],
  "suggestedSeverity": "critical|high|medium|low",
  "severityJustification": "Why this severity level",
  "similarPatterns": ["Pattern 1", "Pattern 2"],
  "preventiveMeasures": ["Measure 1", "Measure 2", "Measure 3"]
}

ANALYSIS GUIDELINES:
- Parse error codes, timestamps, and stack traces carefully
- Look for patterns: timeouts, resource exhaustion, cascading failures
- Consider both infrastructure and application layers
- Think about recent changes: deployments, config updates, traffic spikes
- Be specific about monitoring metrics to check (CPU, memory, disk I/O, network)`;

    // Call OpenAI API with enhanced parameters for better reasoning
    const response = await openai.chat.completions.create({
      model: config.openai.model,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more focused, deterministic analysis
      max_tokens: 2500, // Increased for detailed analysis
      response_format: { type: 'json_object' }, // Ensures response is valid JSON
      presence_penalty: 0.1, // Encourage diverse vocabulary
      frequency_penalty: 0.1, // Reduce repetition
    });

    // Extract and parse the AI's response
    const aiContent = response.choices[0].message.content;
    const analysis = JSON.parse(aiContent);

    logger.success('AI analysis generated successfully', {
      tokensUsed: response.usage.total_tokens,
      model: response.model,
      summary: analysis.summary.substring(0, 50) + '...',
      rootCausesCount: analysis.rootCauses?.length || 0,
    });

    // Validate required fields
    if (!analysis.summary || !analysis.rootCauses || !analysis.customerMessage) {
      throw new Error('AI response missing required fields');
    }

    // Transform the enhanced analysis into the format our database expects
    // Convert detailed root causes to formatted strings
    const formattedRootCauses = Array.isArray(analysis.rootCauses)
      ? analysis.rootCauses.map(rc => {
          if (typeof rc === 'object' && rc.cause) {
            // Enhanced format with likelihood and reasoning
            const likelihood = rc.likelihood ? `[${rc.likelihood.toUpperCase()}]` : '';
            const components = rc.components && rc.components.length > 0 
              ? ` (Components: ${rc.components.join(', ')})` 
              : '';
            return `${likelihood} ${rc.cause}${components}\nReasoning: ${rc.reasoning || 'Analysis based on error patterns'}`;
          }
          return rc; // Fallback to simple string format
        })
      : [analysis.rootCauses];

    // Format action items with priority and ownership
    const formattedActionItems = Array.isArray(analysis.actionItems)
      ? analysis.actionItems.map((item, index) => {
          if (typeof item === 'object' && item.action) {
            const priority = item.priority ? `[${item.priority.toUpperCase()}]` : '[MEDIUM]';
            const owner = item.owner ? ` @${item.owner}` : '';
            const command = item.command ? `\n   Command: ${item.command}` : '';
            return `${index + 1}. ${priority}${owner} ${item.action}${command}`;
          }
          return typeof item === 'string' ? `${index + 1}. ${item}` : item;
        })
      : analysis.actionItems || [];

    // Build comprehensive metadata
    const metadata = {
      severityJustification: analysis.severityJustification || 'Based on incident description',
      similarPatterns: analysis.similarPatterns || [],
      preventiveMeasures: analysis.preventiveMeasures || [],
      analysisTimestamp: new Date().toISOString(),
      tokensUsed: response.usage.total_tokens,
    };

    return {
      summary: analysis.summary,
      rootCauses: formattedRootCauses,
      customerMessage: analysis.customerMessage,
      actionItems: formattedActionItems,
      suggestedSeverity: analysis.suggestedSeverity || severity,
      metadata: metadata, // Additional context for advanced features
    };

  } catch (error) {
    logger.error('Failed to generate AI analysis', {
      error: error.message,
      incidentTitle: title,
    });

    // If OpenAI fails, return fallback responses so the app doesn't crash
    // This ensures incidents can still be created even if AI is down
    logger.warn('Using fallback AI responses due to error');

    return {
      summary: `${severity.toUpperCase()} severity incident: ${title} (AI analysis unavailable)`,
      rootCauses: [
        '[HIGH] AI analysis service temporarily unavailable - manual review required',
        '[MEDIUM] Check system logs and monitoring dashboards for immediate patterns',
        '[MEDIUM] Review recent changes (deployments, configs, infrastructure) from the last 24 hours',
      ],
      customerMessage: 'We are currently investigating an issue affecting our services. Our engineering team has been notified and is actively working on a resolution. We will provide updates as more information becomes available.',
      actionItems: [
        '1. [IMMEDIATE] @SRE Review error logs, metrics, and traces in monitoring system',
        '2. [IMMEDIATE] @SRE Check system resources: CPU, memory, disk I/O, network connectivity',
        '3. [HIGH] @DevOps Verify recent deployments and consider rollback if applicable',
        '4. [HIGH] @Engineering Review application logs for exceptions and error patterns',
        '5. [MEDIUM] @Engineering Check database performance and connection pools',
        '6. [MEDIUM] @SRE Verify external dependencies and third-party service status',
      ],
      suggestedSeverity: severity,
      metadata: {
        severityJustification: 'Using declared severity - AI analysis unavailable',
        similarPatterns: [],
        preventiveMeasures: ['Implement AI service redundancy', 'Set up fallback analysis pipeline'],
        analysisTimestamp: new Date().toISOString(),
        tokensUsed: 0,
        fallbackMode: true,
      },
    };
  }
}

/**
 * Test the OpenAI connection
 * Useful for health checks and startup validation
 */
async function testOpenAIConnection() {
  try {
    const response = await openai.chat.completions.create({
      model: config.openai.model,
      messages: [{ role: 'user', content: 'Test' }],
      max_tokens: 10,
    });
    logger.success('OpenAI API connection successful');
    return true;
  } catch (error) {
    logger.error('OpenAI API connection failed', {
      error: error.message,
    });
    return false;
  }
}

module.exports = {
  generateIncidentAnalysis,
  testOpenAIConnection,
};
