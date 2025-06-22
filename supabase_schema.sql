-- Optigains V3 Database Schema
-- This script will drop and recreate tables to ensure clean setup

-- Drop existing tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS public.exercise_logs CASCADE;
DROP TABLE IF EXISTS public.calendar_assignments CASCADE;
DROP TABLE IF EXISTS public.workout_instances CASCADE;
DROP TABLE IF EXISTS public.exercise_library CASCADE;

-- Exercise library table (independent table, no foreign keys)
CREATE TABLE public.exercise_library (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  clerk_user_id text NOT NULL,
  exercise_name character varying(255) NOT NULL,
  equipment character varying(100) NULL,
  category character varying(100) NULL,
  muscle_groups text[] NULL,
  last_used timestamp with time zone NULL,
  use_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT exercise_library_pkey PRIMARY KEY (id),
  CONSTRAINT exercise_library_unique_user_exercise UNIQUE (clerk_user_id, exercise_name)
) TABLESPACE pg_default;

-- Create indexes
CREATE INDEX idx_exercise_library_user 
ON public.exercise_library USING btree (clerk_user_id) TABLESPACE pg_default;

CREATE INDEX idx_exercise_library_name 
ON public.exercise_library USING btree (exercise_name) TABLESPACE pg_default;

-- Enable RLS
ALTER TABLE public.exercise_library ENABLE ROW LEVEL SECURITY;

-- Trigger for updated_at
CREATE TRIGGER update_exercise_library_updated_at 
BEFORE UPDATE ON exercise_library 
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Workout instances table (references workout_templates)
CREATE TABLE public.workout_instances (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  clerk_user_id text NOT NULL,
  template_id uuid NOT NULL,
  workout_name character varying(255) NOT NULL,
  scheduled_date date NOT NULL,
  completed_at timestamp with time zone NULL,
  exercises jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text NULL,
  duration_minutes integer NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT workout_instances_pkey PRIMARY KEY (id),
  CONSTRAINT workout_instances_template_id_fkey FOREIGN KEY (template_id) 
    REFERENCES workout_templates (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create indexes
CREATE INDEX idx_workout_instances_user_date 
ON public.workout_instances USING btree (clerk_user_id, scheduled_date) TABLESPACE pg_default;

CREATE INDEX idx_workout_instances_completed 
ON public.workout_instances USING btree (clerk_user_id, completed_at) TABLESPACE pg_default;

-- Enable RLS
ALTER TABLE public.workout_instances ENABLE ROW LEVEL SECURITY;

-- Trigger for updated_at
CREATE TRIGGER update_workout_instances_updated_at 
BEFORE UPDATE ON workout_instances 
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Calendar assignments table (references both workout_templates and workout_instances)
CREATE TABLE public.calendar_assignments (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  clerk_user_id text NOT NULL,
  template_id uuid NOT NULL,
  assigned_date date NOT NULL,
  completed boolean DEFAULT false,
  workout_instance_id uuid NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT calendar_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT calendar_assignments_template_id_fkey FOREIGN KEY (template_id) 
    REFERENCES workout_templates (id) ON DELETE CASCADE,
  CONSTRAINT calendar_assignments_workout_instance_id_fkey FOREIGN KEY (workout_instance_id) 
    REFERENCES workout_instances (id) ON DELETE SET NULL,
  CONSTRAINT calendar_assignments_unique_user_template_date UNIQUE (clerk_user_id, template_id, assigned_date)
) TABLESPACE pg_default;

-- Create indexes for performance
CREATE INDEX idx_calendar_assignments_user_date 
ON public.calendar_assignments USING btree (clerk_user_id, assigned_date) TABLESPACE pg_default;

CREATE INDEX idx_calendar_assignments_template 
ON public.calendar_assignments USING btree (template_id) TABLESPACE pg_default;

-- Enable RLS
ALTER TABLE public.calendar_assignments ENABLE ROW LEVEL SECURITY;

-- Trigger for updated_at
CREATE TRIGGER update_calendar_assignments_updated_at 
BEFORE UPDATE ON calendar_assignments 
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Exercise logs table (for tracking individual exercise performance)
CREATE TABLE public.exercise_logs (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  clerk_user_id text NOT NULL,
  workout_instance_id uuid NOT NULL,
  exercise_name character varying(255) NOT NULL,
  set_number integer NOT NULL,
  weight numeric(10,2) NOT NULL,
  reps integer NOT NULL,
  rir integer DEFAULT 0,
  rpe integer NULL,
  notes text NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT exercise_logs_pkey PRIMARY KEY (id),
  CONSTRAINT exercise_logs_workout_instance_id_fkey FOREIGN KEY (workout_instance_id) 
    REFERENCES workout_instances (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create indexes
CREATE INDEX idx_exercise_logs_instance 
ON public.exercise_logs USING btree (workout_instance_id) TABLESPACE pg_default;

CREATE INDEX idx_exercise_logs_user_exercise 
ON public.exercise_logs USING btree (clerk_user_id, exercise_name) TABLESPACE pg_default;

-- Enable RLS
ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;

-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add columns to training_blocks for workout rotation
ALTER TABLE public.training_blocks 
ADD COLUMN IF NOT EXISTS workout_rotation text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS rotation_assignments jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS current_rotation_index integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_rotation_date date DEFAULT CURRENT_DATE;

-- Create RLS policies for all tables
-- Note: These policies use auth.jwt() ->> 'sub' to match Clerk's JWT structure

-- Calendar assignments policies
CREATE POLICY "Users can view own calendar assignments" ON public.calendar_assignments
    FOR SELECT USING (auth.jwt() ->> 'sub' = clerk_user_id);

CREATE POLICY "Users can insert own calendar assignments" ON public.calendar_assignments
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = clerk_user_id);

CREATE POLICY "Users can update own calendar assignments" ON public.calendar_assignments
    FOR UPDATE USING (auth.jwt() ->> 'sub' = clerk_user_id);

CREATE POLICY "Users can delete own calendar assignments" ON public.calendar_assignments
    FOR DELETE USING (auth.jwt() ->> 'sub' = clerk_user_id);

-- Workout instances policies
CREATE POLICY "Users can view own workout instances" ON public.workout_instances
    FOR SELECT USING (auth.jwt() ->> 'sub' = clerk_user_id);

CREATE POLICY "Users can insert own workout instances" ON public.workout_instances
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = clerk_user_id);

CREATE POLICY "Users can update own workout instances" ON public.workout_instances
    FOR UPDATE USING (auth.jwt() ->> 'sub' = clerk_user_id);

CREATE POLICY "Users can delete own workout instances" ON public.workout_instances
    FOR DELETE USING (auth.jwt() ->> 'sub' = clerk_user_id);

-- Exercise library policies
CREATE POLICY "Users can view own exercise library" ON public.exercise_library
    FOR SELECT USING (auth.jwt() ->> 'sub' = clerk_user_id);

CREATE POLICY "Users can insert own exercise library" ON public.exercise_library
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = clerk_user_id);

CREATE POLICY "Users can update own exercise library" ON public.exercise_library
    FOR UPDATE USING (auth.jwt() ->> 'sub' = clerk_user_id);

CREATE POLICY "Users can delete own exercise library" ON public.exercise_library
    FOR DELETE USING (auth.jwt() ->> 'sub' = clerk_user_id);

-- Exercise logs policies
CREATE POLICY "Users can view own exercise logs" ON public.exercise_logs
    FOR SELECT USING (auth.jwt() ->> 'sub' = clerk_user_id);

CREATE POLICY "Users can insert own exercise logs" ON public.exercise_logs
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = clerk_user_id);

CREATE POLICY "Users can update own exercise logs" ON public.exercise_logs
    FOR UPDATE USING (auth.jwt() ->> 'sub' = clerk_user_id);

CREATE POLICY "Users can delete own exercise logs" ON public.exercise_logs
    FOR DELETE USING (auth.jwt() ->> 'sub' = clerk_user_id);