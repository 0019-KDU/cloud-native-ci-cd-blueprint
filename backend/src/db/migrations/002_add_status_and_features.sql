-- Migration 002: Add Status, Comments, Activity Log, and Assignments
-- Description: Enhances incident management with status tracking, collaboration, and team features

-- 1. Add status column to incidents table
ALTER TABLE incidents
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'open'
  CHECK (status IN ('open', 'investigating', 'resolved', 'closed'));

-- 2. Add assignment and metadata columns
ALTER TABLE incidents
ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(255),
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ai_action_items JSONB DEFAULT '[]'::jsonb;

-- 3. Create comments table for incident discussions
CREATE TABLE IF NOT EXISTS incident_comments (
  id SERIAL PRIMARY KEY,
  incident_id INTEGER NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  author_name VARCHAR(255) NOT NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create activity log table to track all changes
CREATE TABLE IF NOT EXISTS incident_activity (
  id SERIAL PRIMARY KEY,
  incident_id INTEGER NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  activity_type VARCHAR(100) NOT NULL, -- 'created', 'status_changed', 'assigned', 'commented', etc.
  actor_name VARCHAR(255),
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_assigned_to ON incidents(assigned_to);
CREATE INDEX IF NOT EXISTS idx_incident_comments_incident_id ON incident_comments(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_activity_incident_id ON incident_activity(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_activity_type ON incident_activity(activity_type);

-- 6. Add trigger to auto-update comments updated_at
CREATE OR REPLACE FUNCTION update_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_incident_comments_updated_at
  BEFORE UPDATE ON incident_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_updated_at();

-- 7. Add function to automatically log activities
CREATE OR REPLACE FUNCTION log_incident_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO incident_activity (incident_id, activity_type, description, metadata)
    VALUES (
      NEW.id,
      'status_changed',
      'Status changed from ' || OLD.status || ' to ' || NEW.status,
      jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
    );
  END IF;

  IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    INSERT INTO incident_activity (incident_id, activity_type, description, metadata)
    VALUES (
      NEW.id,
      'assigned',
      CASE
        WHEN NEW.assigned_to IS NULL THEN 'Incident unassigned'
        WHEN OLD.assigned_to IS NULL THEN 'Incident assigned to ' || NEW.assigned_to
        ELSE 'Incident reassigned from ' || OLD.assigned_to || ' to ' || NEW.assigned_to
      END,
      jsonb_build_object('old_assignee', OLD.assigned_to, 'new_assignee', NEW.assigned_to)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_incident_changes
  AFTER UPDATE ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION log_incident_status_change();

-- 8. Insert initial activity for existing incidents
INSERT INTO incident_activity (incident_id, activity_type, description, created_at)
SELECT id, 'created', 'Incident created', created_at
FROM incidents
WHERE NOT EXISTS (
  SELECT 1 FROM incident_activity
  WHERE incident_activity.incident_id = incidents.id
  AND activity_type = 'created'
);

COMMENT ON TABLE incident_comments IS 'Stores comments and discussions on incidents';
COMMENT ON TABLE incident_activity IS 'Audit log of all incident changes and activities';
COMMENT ON COLUMN incidents.status IS 'Current status: open, investigating, resolved, or closed';
COMMENT ON COLUMN incidents.assigned_to IS 'Team member assigned to this incident';
COMMENT ON COLUMN incidents.ai_action_items IS 'AI-generated action items for resolving the incident';
