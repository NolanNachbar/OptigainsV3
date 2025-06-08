// Supabase Database Implementation
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserResource } from '@clerk/types';
import { 
  IDatabase, 
  CalendarAssignment, 
  ExerciseLibraryEntry 
} from './database';
import { 
  WorkoutTemplate, 
  WorkoutInstance, 
  TrainingBlock 
} from './types';

export class SupabaseDB implements IDatabase {
  private supabase: SupabaseClient;
  private supabaseUrl: string;
  private supabaseKey: string;
  private getClerkToken: (() => Promise<string | null>) | null = null;

  constructor(url: string, key: string) {
    this.supabaseUrl = url;
    this.supabaseKey = key;
    this.supabase = createClient(url, key);
  }

  // Set the Clerk token getter function
  setClerkTokenGetter(getter: () => Promise<string | null>) {
    this.getClerkToken = getter;
  }

  // Get authenticated Supabase client
  private async getAuthClient(): Promise<SupabaseClient> {
    if (!this.getClerkToken) {
      return this.supabase;
    }

    try {
      const token = await this.getClerkToken();
      if (token) {
        return createClient(
          this.supabaseUrl,
          this.supabaseKey,
          {
            global: {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
            auth: {
              persistSession: false,
            },
          }
        );
      }
    } catch (error) {
      console.error('Error getting Clerk token:', error);
    }

    return this.supabase;
  }

  // Training Blocks
  async getTrainingBlocks(userId: string): Promise<TrainingBlock[]> {
    const client = await this.getAuthClient();
    const { data, error } = await client
      .from('training_blocks')
      .select('*')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(block => ({
      id: block.id,
      name: block.name,
      startDate: block.start_date,
      duration: block.duration,
      currentWeek: block.current_week,
      trainingDaysPerWeek: block.training_days_per_week,
      split: block.split,
      notes: block.notes,
      isActive: block.is_active
    }));
  }

  async getActiveTrainingBlock(userId: string): Promise<TrainingBlock | null> {
    const client = await this.getAuthClient();
    const { data, error } = await client
      .from('training_blocks')
      .select('*')
      .eq('clerk_user_id', userId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      startDate: data.start_date,
      duration: data.duration,
      currentWeek: data.current_week,
      trainingDaysPerWeek: data.training_days_per_week,
      split: data.split,
      notes: data.notes,
      isActive: data.is_active
    };
  }

  async saveTrainingBlock(block: TrainingBlock, user: UserResource): Promise<TrainingBlock> {
    const client = await this.getAuthClient();
    
    // If this block is active, deactivate others
    if (block.isActive) {
      await client
        .from('training_blocks')
        .update({ is_active: false })
        .eq('clerk_user_id', user.id);
    }

    const { data, error } = await client
      .from('training_blocks')
      .upsert({
        id: block.id || undefined,
        clerk_user_id: user.id,
        name: block.name,
        start_date: block.startDate,
        duration: block.duration,
        current_week: block.currentWeek,
        training_days_per_week: block.trainingDaysPerWeek,
        split: block.split,
        notes: block.notes,
        is_active: block.isActive
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      startDate: data.start_date,
      duration: data.duration,
      currentWeek: data.current_week,
      trainingDaysPerWeek: data.training_days_per_week,
      split: data.split,
      notes: data.notes,
      isActive: data.is_active
    };
  }

  async updateTrainingBlock(blockId: string, updates: Partial<TrainingBlock>, user: UserResource): Promise<TrainingBlock> {
    const updateData: any = {};
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.startDate !== undefined) updateData.start_date = updates.startDate;
    if (updates.duration !== undefined) updateData.duration = updates.duration;
    if (updates.currentWeek !== undefined) updateData.current_week = updates.currentWeek;
    if (updates.trainingDaysPerWeek !== undefined) updateData.training_days_per_week = updates.trainingDaysPerWeek;
    if (updates.split !== undefined) updateData.split = updates.split;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const client = await this.getAuthClient();
    const { data, error } = await client
      .from('training_blocks')
      .update(updateData)
      .eq('id', blockId)
      .eq('clerk_user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      startDate: data.start_date,
      duration: data.duration,
      currentWeek: data.current_week,
      trainingDaysPerWeek: data.training_days_per_week,
      split: data.split,
      notes: data.notes,
      isActive: data.is_active
    };
  }

  async deleteTrainingBlock(blockId: string, user: UserResource): Promise<void> {
    const client = await this.getAuthClient();
    const { error } = await client
      .from('training_blocks')
      .delete()
      .eq('id', blockId)
      .eq('clerk_user_id', user.id);

    if (error) throw error;
  }

  // Workout Templates
  async getWorkoutTemplates(userId: string): Promise<WorkoutTemplate[]> {
    const client = await this.getAuthClient();
    const { data, error } = await client
      .from('workout_templates')
      .select('*')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getWorkoutTemplate(templateId: string, userId: string): Promise<WorkoutTemplate | null> {
    const client = await this.getAuthClient();
    const { data, error } = await client
      .from('workout_templates')
      .select('*')
      .eq('id', templateId)
      .eq('clerk_user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  }

  async saveWorkoutTemplate(template: WorkoutTemplate, user: UserResource): Promise<WorkoutTemplate> {
    const client = await this.getAuthClient();
    
    const { data, error } = await client
      .from('workout_templates')
      .upsert({
        id: template.id || undefined,
        clerk_user_id: user.id,
        workout_name: template.workout_name,
        training_block_id: null, // Can be added later
        exercises: template.exercises,
        tags: [], // Can be expanded later
        estimated_duration: null // Can be calculated later
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateWorkoutTemplate(templateId: string, updates: Partial<WorkoutTemplate>, user: UserResource): Promise<WorkoutTemplate> {
    const client = await this.getAuthClient();
    const { data, error } = await client
      .from('workout_templates')
      .update(updates)
      .eq('id', templateId)
      .eq('clerk_user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteWorkoutTemplate(templateId: string, user: UserResource): Promise<void> {
    const client = await this.getAuthClient();
    const { error } = await client
      .from('workout_templates')
      .delete()
      .eq('id', templateId)
      .eq('clerk_user_id', user.id);

    if (error) throw error;
  }

  // Workout Instances
  async getWorkoutInstances(userId: string, dateRange?: { start: string; end: string }): Promise<WorkoutInstance[]> {
    const client = await this.getAuthClient();
    let query = client
      .from('workout_instances')
      .select('*')
      .eq('clerk_user_id', userId);

    if (dateRange) {
      query = query
        .gte('scheduled_date', dateRange.start)
        .lte('scheduled_date', dateRange.end);
    }

    const { data, error } = await query.order('scheduled_date', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getWorkoutInstance(instanceId: string, userId: string): Promise<WorkoutInstance | null> {
    const client = await this.getAuthClient();
    const { data, error } = await client
      .from('workout_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('clerk_user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  }

  async saveWorkoutInstance(instance: WorkoutInstance, user: UserResource): Promise<WorkoutInstance> {
    const client = await this.getAuthClient();
    const { data, error } = await client
      .from('workout_instances')
      .upsert({
        id: instance.id || undefined,
        clerk_user_id: user.id,
        template_id: instance.template_id,
        workout_name: instance.workout_name,
        scheduled_date: instance.scheduled_date,
        completed_at: instance.completed_at,
        exercises: instance.exercises,
        notes: null,
        duration_minutes: null
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateWorkoutInstance(instanceId: string, updates: Partial<WorkoutInstance>, user: UserResource): Promise<WorkoutInstance> {
    const client = await this.getAuthClient();
    const { data, error } = await client
      .from('workout_instances')
      .update(updates)
      .eq('id', instanceId)
      .eq('clerk_user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteWorkoutInstance(instanceId: string, user: UserResource): Promise<void> {
    const client = await this.getAuthClient();
    const { error } = await client
      .from('workout_instances')
      .delete()
      .eq('id', instanceId)
      .eq('clerk_user_id', user.id);

    if (error) throw error;
  }

  // Calendar
  async getCalendarAssignments(userId: string, dateRange?: { start: string; end: string }): Promise<CalendarAssignment[]> {
    const client = await this.getAuthClient();
    let query = client
      .from('calendar_assignments')
      .select('*')
      .eq('clerk_user_id', userId);

    if (dateRange) {
      query = query
        .gte('assigned_date', dateRange.start)
        .lte('assigned_date', dateRange.end);
    }

    const { data, error } = await query.order('assigned_date', { ascending: true });

    if (error) throw error;
    return data;
  }

  async saveCalendarAssignment(assignment: CalendarAssignment, user: UserResource): Promise<CalendarAssignment> {
    const client = await this.getAuthClient();
    // First delete any existing assignment for the same template and date
    await client
      .from('calendar_assignments')
      .delete()
      .eq('clerk_user_id', user.id)
      .eq('template_id', assignment.template_id)
      .eq('assigned_date', assignment.assigned_date);

    const { data, error } = await client
      .from('calendar_assignments')
      .insert({
        clerk_user_id: user.id,
        template_id: assignment.template_id,
        assigned_date: assignment.assigned_date,
        completed: assignment.completed || false,
        workout_instance_id: assignment.workout_instance_id || null
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteCalendarAssignment(assignmentId: string, user: UserResource): Promise<void> {
    const client = await this.getAuthClient();
    const { error } = await client
      .from('calendar_assignments')
      .delete()
      .eq('id', assignmentId)
      .eq('clerk_user_id', user.id);

    if (error) throw error;
  }

  async bulkSaveCalendarAssignments(assignments: CalendarAssignment[], user: UserResource): Promise<CalendarAssignment[]> {
    const savedAssignments: CalendarAssignment[] = [];
    
    for (const assignment of assignments) {
      const saved = await this.saveCalendarAssignment(assignment, user);
      savedAssignments.push(saved);
    }
    
    return savedAssignments;
  }

  // Exercise Library
  async getExerciseLibrary(userId: string): Promise<ExerciseLibraryEntry[]> {
    const client = await this.getAuthClient();
    const { data, error } = await client
      .from('exercise_library')
      .select('*')
      .eq('clerk_user_id', userId)
      .order('use_count', { ascending: false });

    if (error) throw error;
    return data;
  }

  async updateExerciseUsage(exerciseName: string, user: UserResource): Promise<void> {
    const client = await this.getAuthClient();
    // Check if exercise exists
    const { data: existing } = await client
      .from('exercise_library')
      .select('*')
      .eq('clerk_user_id', user.id)
      .eq('exercise_name', exerciseName)
      .single();

    if (existing) {
      // Update existing
      await client
        .from('exercise_library')
        .update({
          use_count: existing.use_count + 1,
          last_used: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      // Create new
      await client
        .from('exercise_library')
        .insert({
          clerk_user_id: user.id,
          exercise_name: exerciseName,
          use_count: 1,
          last_used: new Date().toISOString()
        });
    }
  }
}