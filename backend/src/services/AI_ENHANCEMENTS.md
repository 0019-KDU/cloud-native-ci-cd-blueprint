# AI Analysis Enhancements

## Overview

The AI incident analysis has been significantly enhanced to provide expert-level insights, detailed root cause analysis, and actionable resolution steps. The system now leverages advanced prompting techniques to deliver production-quality incident analysis.

---

## Key Improvements

### 1. **Enhanced System Prompt**
The AI now operates as a **Senior Site Reliability Engineer (SRE)** with 15+ years of expertise in:
- Distributed systems architecture
- Cloud infrastructure (AWS, Azure, GCP)
- Kubernetes and container orchestration
- Database performance tuning
- Network troubleshooting
- Application performance monitoring
- Incident response and post-mortem analysis

### 2. **Detailed Root Cause Analysis**
Each root cause now includes:
- **Likelihood Rating**: High, Medium, or Low probability
- **Affected Components**: Specific services or systems involved
- **Reasoning**: Evidence-based explanation from error logs
- **Distinction**: Separates symptoms from actual root causes

**Example Output:**
```
[HIGH] Database connection pool exhausted (Components: PostgreSQL, API Gateway)
Reasoning: Error logs show "connection timeout after 30s" and "max pool size reached" 
patterns occurring during peak traffic hours.
```

### 3. **Prioritized Action Items**
Resolution steps now include:
- **Priority Levels**: Immediate, High, Medium
- **Owner Assignment**: SRE, DevOps, Engineering, DBA
- **Specific Commands**: Actual commands or procedures to execute
- **Verification Steps**: How to confirm the issue is resolved

**Example Output:**
```
1. [IMMEDIATE] @SRE Check current connection pool metrics: 
   Command: SELECT count(*) FROM pg_stat_activity WHERE state = 'active';
2. [HIGH] @DevOps Increase connection pool size in application config
   Command: kubectl edit configmap api-config -n production
```

### 4. **Severity Assessment with Justification**
The AI evaluates severity based on:
- User impact scope (% of users affected)
- Business criticality
- Data integrity risks
- System availability
- May recommend a different severity than initially declared

**Example:**
```
suggestedSeverity: "critical"
severityJustification: "Affects 100% of users attempting checkout. Revenue-impacting. 
Payment processing completely blocked. Requires immediate response."
```

### 5. **Pattern Recognition**
Identifies similar incident patterns:
- References common DevOps scenarios
- Highlights potential systemic issues
- Connects to known failure modes

**Example:**
```
similarPatterns: [
  "Classic thundering herd problem during cache invalidation",
  "Similar to 2024-Q3 Redis failover incident"
]
```

### 6. **Preventive Recommendations**
Suggests proactive measures:
- Monitoring and alerting improvements
- Architectural changes
- Testing procedures
- Resilience patterns

**Example:**
```
preventiveMeasures: [
  "Implement circuit breaker pattern for database connections",
  "Add connection pool saturation alerts at 80% threshold",
  "Configure connection timeout with exponential backoff"
]
```

---

## Technical Implementation

### Model Configuration
```javascript
{
  model: "gpt-4" or "gpt-4-turbo",
  temperature: 0.3,           // Lower for deterministic, focused analysis
  max_tokens: 2500,           // Increased for detailed responses
  presence_penalty: 0.1,      // Encourage diverse vocabulary
  frequency_penalty: 0.1,     // Reduce repetition
  response_format: { type: 'json_object' }
}
```

### Response Structure
```json
{
  "summary": "Technical summary (2-3 sentences)",
  "rootCauses": [
    {
      "cause": "Root cause description",
      "likelihood": "high|medium|low",
      "reasoning": "Evidence-based explanation",
      "components": ["service1", "service2"]
    }
  ],
  "customerMessage": "User-facing status message",
  "actionItems": [
    {
      "priority": "immediate|high|medium",
      "action": "Specific step to take",
      "owner": "Team responsible",
      "command": "Optional: specific command"
    }
  ],
  "suggestedSeverity": "critical|high|medium|low",
  "severityJustification": "Why this severity",
  "similarPatterns": ["Pattern descriptions"],
  "preventiveMeasures": ["Recommendations"]
}
```

### Database Schema
New `ai_metadata` JSONB column stores:
```json
{
  "severityJustification": "Detailed reasoning",
  "similarPatterns": ["Array of patterns"],
  "preventiveMeasures": ["Array of recommendations"],
  "analysisTimestamp": "ISO 8601 timestamp",
  "tokensUsed": 1234,
  "fallbackMode": false
}
```

---

## Usage Examples

### Before Enhancement
```json
{
  "summary": "API Gateway returning 502 errors",
  "rootCauses": [
    "Backend service down",
    "Network issues"
  ],
  "actionItems": [
    "Check logs",
    "Restart service"
  ]
}
```

### After Enhancement
```json
{
  "summary": "API Gateway experiencing cascading failures due to upstream service timeout. 502 Bad Gateway errors affecting /api/checkout endpoint with 95% error rate starting at 14:23 UTC.",
  "rootCauses": [
    {
      "cause": "Payment service connection timeout causing gateway thread pool exhaustion",
      "likelihood": "high",
      "reasoning": "Error logs show consistent 30-second timeouts to payment-service:8080. Gateway thread dump indicates 95/100 worker threads blocked in WAITING state.",
      "components": ["API Gateway", "Payment Service", "Network"]
    },
    {
      "cause": "Payment service database connection pool saturation",
      "likelihood": "high",
      "reasoning": "Payment service logs show 'HikariPool exhausted' errors. Database shows 100/100 connections active with long-running queries.",
      "components": ["Payment Service", "PostgreSQL Database"]
    }
  ],
  "actionItems": [
    {
      "priority": "immediate",
      "action": "Increase payment service connection timeout and implement circuit breaker",
      "owner": "SRE",
      "command": "kubectl set env deployment/api-gateway PAYMENT_TIMEOUT=60s CIRCUIT_BREAKER_ENABLED=true -n production"
    },
    {
      "priority": "immediate",
      "action": "Scale payment service to handle increased load",
      "owner": "DevOps",
      "command": "kubectl scale deployment payment-service --replicas=6 -n production"
    },
    {
      "priority": "high",
      "action": "Investigate and terminate long-running database queries",
      "owner": "DBA",
      "command": "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'active' AND query_start < NOW() - INTERVAL '5 minutes';"
    }
  ],
  "suggestedSeverity": "critical",
  "severityJustification": "Checkout functionality completely unavailable. Affects 100% of purchase attempts. Direct revenue impact estimated at $10k/minute based on average transaction volume.",
  "similarPatterns": [
    "Classic cascading failure pattern with timeout propagation",
    "Resembles Black Friday 2024 database connection pool incident"
  ],
  "preventiveMeasures": [
    "Implement circuit breaker pattern between gateway and payment service",
    "Add connection pool monitoring with alerts at 80% saturation",
    "Configure query timeout limits (30s max) on payment database",
    "Implement load shedding when thread pool utilization exceeds 90%"
  ]
}
```

---

## Configuration

### Environment Variables
Ensure these are set in your `.env` file:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-4-turbo-preview  # or gpt-4, gpt-4-turbo
OPENAI_TEMPERATURE=0.3
OPENAI_MAX_TOKENS=2500
```

### Model Recommendations

| Model | Best For | Cost | Speed |
|-------|----------|------|-------|
| `gpt-4-turbo-preview` | **Recommended** - Best balance of quality and speed | $$ | Fast |
| `gpt-4` | Maximum accuracy, complex incidents | $$$ | Slower |
| `gpt-3.5-turbo` | Budget option, simple incidents | $ | Fastest |

---

## Fallback Behavior

If the AI service is unavailable, the system provides enhanced fallback responses:

```json
{
  "summary": "HIGH severity incident: Database connection timeout (AI analysis unavailable)",
  "rootCauses": [
    "[HIGH] AI analysis service temporarily unavailable - manual review required",
    "[MEDIUM] Check system logs and monitoring dashboards for patterns",
    "[MEDIUM] Review recent changes from the last 24 hours"
  ],
  "actionItems": [
    "1. [IMMEDIATE] @SRE Review monitoring system metrics and traces",
    "2. [IMMEDIATE] @SRE Check system resources: CPU, memory, disk, network",
    "3. [HIGH] @DevOps Verify recent deployments and consider rollback"
  ],
  "metadata": {
    "fallbackMode": true,
    "severityJustification": "Using declared severity - AI unavailable"
  }
}
```

---

## Migration Guide

### Step 1: Run Database Migration
```bash
# Navigate to backend directory
cd backend

# Run the migration
npm run migrate
# or manually:
psql -U your_db_user -d your_database -f src/db/migrations/003_add_ai_metadata.sql
```

### Step 2: Update Environment Variables
Add to your `.env` file:
```bash
OPENAI_TEMPERATURE=0.3
OPENAI_MAX_TOKENS=2500
```

### Step 3: Restart Backend Service
```bash
npm restart
# or
pm2 restart backend
```

---

## Monitoring & Observability

### Metrics to Track
1. **Token Usage**: Monitor `ai_metadata.tokensUsed` to control costs
2. **Analysis Time**: Track time from incident creation to AI response
3. **Fallback Rate**: Percentage of incidents using fallback responses
4. **Severity Changes**: Track when AI suggests different severity

### Logs
The enhanced AI service logs:
- Request details (title, severity, model)
- Response metadata (tokens used, model version)
- Fallback mode activations
- Errors with context

---

## Best Practices

### For Incident Descriptions
To get the best AI analysis, include:
1. **Error messages**: Full error text with codes
2. **Timestamps**: When the issue started
3. **Affected components**: Services, APIs, databases involved
4. **Error rates**: Percentage or count of failures
5. **Recent changes**: Deployments, config updates
6. **Metrics**: CPU, memory, request rates if available

**Good Example:**
```
API Gateway returning 502 errors starting at 14:23 UTC. 
Error rate: 95% (19,000 failures / 20,000 requests in last 5 minutes).
Errors: "upstream connect error or disconnect/reset before headers. 
reset reason: connection timeout"
Recent deployment: payment-service v2.1.4 deployed at 14:20 UTC
Metrics: Payment service CPU: 95%, Memory: 87%, Response time: 30s+
```

**Poor Example:**
```
Payment not working
```

---

## Cost Optimization

### Token Usage
- Average incident: ~1,500-2,000 tokens
- Cost per incident (GPT-4 Turbo): ~$0.02-0.03
- Monthly cost (100 incidents): ~$2-3

### Optimization Tips
1. Use `gpt-4-turbo-preview` instead of `gpt-4` (10x cheaper)
2. Set appropriate `max_tokens` limit
3. Cache common patterns (future enhancement)
4. Use fallback for non-critical incidents

---

## Troubleshooting

### AI Analysis Returns Generic Responses
**Cause**: Incident description too vague  
**Solution**: Provide detailed error logs and context

### High Token Usage
**Cause**: Very detailed incident descriptions  
**Solution**: Adjust `OPENAI_MAX_TOKENS` or use cheaper model

### Fallback Mode Activated
**Cause**: OpenAI API unavailable or quota exceeded  
**Solution**: Check API key, quota, and network connectivity

---

## Future Enhancements

### Planned Features
1. **Historical Pattern Learning**: Learn from past incidents
2. **Multi-Model Ensemble**: Combine multiple AI models
3. **Custom Knowledge Base**: RAG with company-specific docs
4. **Real-time Analysis Updates**: Continuous analysis as incident evolves
5. **Automated Runbook Generation**: Create step-by-step procedures
6. **Incident Clustering**: Group similar incidents automatically

---

## Contributing

To improve the AI prompts or add features:

1. Edit `/backend/src/services/ai.service.js`
2. Test with various incident types
3. Monitor token usage and quality
4. Update this documentation

---

## Support

For issues or questions:
- Check logs in `/logs/backend.log`
- Review OpenAI API status
- Verify environment configuration
- Test with `testOpenAIConnection()` function

---

**Last Updated**: November 16, 2025  
**Version**: 2.0 (Enhanced AI Analysis)
