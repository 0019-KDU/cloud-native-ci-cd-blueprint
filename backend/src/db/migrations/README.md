# Database Migrations

## Overview
This folder contains SQL migration files for the Incident Assistant database.

## Schema Design

### `incidents` Table
Stores all incident reports along with AI-generated analysis.

**Columns:**
- `id` - Auto-incrementing primary key
- `title` - Incident title (max 255 chars)
- `severity` - One of: 'low', 'medium', 'high' (enforced by CHECK constraint)
- `description` - Full incident description, error logs, context (TEXT)
- `ai_summary` - Short AI-generated summary of the incident
- `ai_root_causes` - JSONB array of 2-3 possible root cause suggestions
- `ai_customer_message` - Customer-friendly status message for public communication
- `created_at` - Timestamp when incident was created (auto-set)
- `updated_at` - Timestamp when incident was last modified (auto-updated via trigger)

**Indexes:**
- `idx_incidents_severity` - Speeds up filtering by severity
- `idx_incidents_created_at` - Speeds up sorting by creation date (descending)

**Triggers:**
- Auto-updates `updated_at` column whenever a row is modified

## How to Run Migrations

### Option 1: Using pgAdmin
1. Open pgAdmin
2. Connect to your PostgreSQL server
3. Create database: `incident_assistant` (or your preferred name)
4. Right-click on the database → Query Tool
5. Open and run `001_create_incidents_table.sql`

### Option 2: Using psql command line
```bash
# Create database
psql -U postgres -c "CREATE DATABASE incident_assistant;"

# Run migration
psql -U postgres -d incident_assistant -f backend/src/db/migrations/001_create_incidents_table.sql
```

## Verifying the Setup
After running the migration, verify it worked:
```sql
-- Check table structure
\d incidents

-- Should show: id, title, severity, description, ai_summary, ai_root_causes, ai_customer_message, created_at, updated_at
```
