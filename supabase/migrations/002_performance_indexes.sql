-- Migration: Add performance indexes
-- Description: Creates indexes to improve query performance for common access patterns

-- Indexes for exercise_logs table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exercise_logs_user_exercise 
ON exercise_logs(clerk_user_id, exercise_name);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exercise_logs_created_at 
ON exercise_logs(created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exercise_logs_user_exercise_date 
ON exercise_logs(clerk_user_id, exercise_name, created_at DESC);

-- Indexes for workout_templates table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workout_templates_user 
ON workout_templates(clerk_user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workout_templates_user_created 
ON workout_templates(clerk_user_id, created_at DESC);

-- Indexes for calendar_assignments table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calendar_assignments_user_date 
ON calendar_assignments(clerk_user_id, assigned_date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calendar_assignments_date_range 
ON calendar_assignments(assigned_date, clerk_user_id);

-- Indexes for workout_instances table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workout_instances_user_date 
ON workout_instances(clerk_user_id, scheduled_date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workout_instances_date_range 
ON workout_instances(scheduled_date DESC, clerk_user_id);

-- Indexes for training_blocks table (partial index for active blocks)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_training_blocks_user_active 
ON training_blocks(clerk_user_id, is_active) 
WHERE is_active = true;

-- Indexes for exercise_library table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exercise_library_user_count 
ON exercise_library(clerk_user_id, use_count DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exercise_library_user_name 
ON exercise_library(clerk_user_id, exercise_name);

-- Indexes for body_weight_logs table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_body_weight_logs_user_date 
ON body_weight_logs(clerk_user_id, logged_date DESC);

-- Update table statistics
ANALYZE exercise_logs;
ANALYZE workout_templates;
ANALYZE calendar_assignments;
ANALYZE workout_instances;
ANALYZE training_blocks;
ANALYZE exercise_library;
ANALYZE body_weight_logs;