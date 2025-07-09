-- Performance indexes for OptiGains V3
-- Run these in your Supabase SQL editor to improve query performance

-- Indexes for exercise_logs table
-- Used for getting last exercise performance by user and exercise name
CREATE INDEX IF NOT EXISTS idx_exercise_logs_user_exercise 
ON exercise_logs(clerk_user_id, exercise_name);

CREATE INDEX IF NOT EXISTS idx_exercise_logs_created_at 
ON exercise_logs(created_at DESC);

-- Composite index for the common query pattern: user + exercise + date ordering
CREATE INDEX IF NOT EXISTS idx_exercise_logs_user_exercise_date 
ON exercise_logs(clerk_user_id, exercise_name, created_at DESC);

-- Indexes for workout_templates table
-- Used for loading user's workout templates
CREATE INDEX IF NOT EXISTS idx_workout_templates_user 
ON workout_templates(clerk_user_id);

CREATE INDEX IF NOT EXISTS idx_workout_templates_user_created 
ON workout_templates(clerk_user_id, created_at DESC);

-- Indexes for calendar_assignments table
-- Used for getting workouts assigned to specific dates
CREATE INDEX IF NOT EXISTS idx_calendar_assignments_user_date 
ON calendar_assignments(clerk_user_id, assigned_date);

-- Used for date range queries
CREATE INDEX IF NOT EXISTS idx_calendar_assignments_date_range 
ON calendar_assignments(assigned_date, clerk_user_id);

-- Indexes for workout_instances table
-- Used for getting workout instances by date
CREATE INDEX IF NOT EXISTS idx_workout_instances_user_date 
ON workout_instances(clerk_user_id, scheduled_date);

-- Used for date range queries
CREATE INDEX IF NOT EXISTS idx_workout_instances_date_range 
ON workout_instances(scheduled_date DESC, clerk_user_id);

-- Indexes for training_blocks table
-- Used for getting active training block
CREATE INDEX IF NOT EXISTS idx_training_blocks_user_active 
ON training_blocks(clerk_user_id, is_active) 
WHERE is_active = true;

-- Indexes for exercise_library table
-- Used for exercise autocomplete and history
CREATE INDEX IF NOT EXISTS idx_exercise_library_user_count 
ON exercise_library(clerk_user_id, use_count DESC);

CREATE INDEX IF NOT EXISTS idx_exercise_library_user_name 
ON exercise_library(clerk_user_id, exercise_name);

-- Indexes for body_weight_logs table
CREATE INDEX IF NOT EXISTS idx_body_weight_logs_user_date 
ON body_weight_logs(clerk_user_id, logged_date DESC);

-- Performance tips:
-- 1. Run ANALYZE after creating indexes to update statistics
-- 2. Monitor query performance using Supabase's Query Performance dashboard
-- 3. Consider adding partial indexes for frequently filtered queries
-- 4. Review and adjust indexes based on actual query patterns

-- Run ANALYZE to update table statistics
ANALYZE exercise_logs;
ANALYZE workout_templates;
ANALYZE calendar_assignments;
ANALYZE workout_instances;
ANALYZE training_blocks;
ANALYZE exercise_library;
ANALYZE body_weight_logs;