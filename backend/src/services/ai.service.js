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
    // Construct the prompt for OpenAI
    // This tells the AI exactly what we want and in what format
    const prompt = `You are a DevOps incident analysis assistant. Analyze the following incident and provide:
1. A concise summary (1-2 sentences)
2. 2-3 possible root causes
3. A customer-friendly status message suitable for a public status page

Incident Details:
- Title: ${title}
- Severity: ${severity}
- Description: ${description}

Respond in JSON format with this structure:
{
  "summary": "Brief technical summary here",
  "rootCauses": ["Cause 1", "Cause 2", "Cause 3"],
  "customerMessage": "Customer-friendly message here"
}

Keep the customer message professional, reassuring, and non-technical. Avoid mentioning internal tools or specifics.`;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: config.openai.model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert DevOps engineer analyzing production incidents. Provide clear, actionable analysis.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: config.openai.temperature,
      max_tokens: config.openai.maxTokens,
      response_format: { type: 'json_object' }, // Ensures response is valid JSON
    });

    // Extract the AI's response
    const aiContent = response.choices[0].message.content;
    const analysis = JSON.parse(aiContent);

    logger.success('AI analysis generated successfully', {
      tokensUsed: response.usage.total_tokens,
      summary: analysis.summary.substring(0, 50) + '...',
    });

    // Validate that we got all required fields
    if (!analysis.summary || !analysis.rootCauses || !analysis.customerMessage) {
      throw new Error('AI response missing required fields');
    }

    // Ensure rootCauses is an array
    if (!Array.isArray(analysis.rootCauses)) {
      analysis.rootCauses = [analysis.rootCauses];
    }

    return {
      summary: analysis.summary,
      rootCauses: analysis.rootCauses,
      customerMessage: analysis.customerMessage,
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
      summary: `${severity.toUpperCase()} severity incident: ${title}`,
      rootCauses: [
        'Unable to generate AI analysis at this time',
        'Please review incident details manually',
      ],
      customerMessage: 'We are currently investigating an issue and will provide updates shortly.',
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
