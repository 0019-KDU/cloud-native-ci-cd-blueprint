-- Migration 003: Add AI Analysis Metadata
-- Description: Enhances AI analysis with detailed metadata including severity justification,
--              similar patterns, preventive measures, and analysis metrics

-- 1. Add AI metadata column to store enhanced analysis information
ALTER TABLE incidents
ADD COLUMN IF NOT EXISTS ai_metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Add comment to describe the new column
COMMENT ON COLUMN incidents.ai_metadata IS 'Enhanced AI analysis metadata including severity justification, similar patterns, preventive measures, and token usage';

-- 3. Create index for querying metadata
CREATE INDEX IF NOT EXISTS idx_incidents_ai_metadata ON incidents USING gin(ai_metadata);

-- 4. Populate existing records with default metadata structure
UPDATE incidents
SET ai_metadata = jsonb_build_object(
  'severityJustification', 'Legacy incident - no AI justification available',
  'similarPatterns', '[]'::jsonb,
  'preventiveMeasures', '[]'::jsonb,
  'analysisTimestamp', created_at,
  'tokensUsed', 0,
  'fallbackMode', false
)
WHERE ai_metadata = '{}'::jsonb OR ai_metadata IS NULL;
