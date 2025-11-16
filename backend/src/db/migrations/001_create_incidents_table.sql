-- Migration: Create incidents table
-- Description: Stores incident reports and AI-generated analysis
-- Run this in pgAdmin or via psql to create the table

CREATE TABLE IF NOT EXISTS incidents (
  -- Primary key: Auto-incrementing ID
  id SERIAL PRIMARY KEY,

  -- User-provided fields
  title VARCHAR(255) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  description TEXT NOT NULL,

  -- AI-generated fields (populated by OpenAI)
  ai_summary TEXT,
  ai_root_causes JSONB DEFAULT '[]'::jsonb,  -- Array of root cause strings
  ai_customer_message TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries by severity
CREATE INDEX idx_incidents_severity ON incidents(severity);

-- Index for faster queries by creation date (most recent first)
CREATE INDEX idx_incidents_created_at ON incidents(created_at DESC);

-- Optional: Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on row updates
CREATE TRIGGER update_incidents_updated_at
  BEFORE UPDATE ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
