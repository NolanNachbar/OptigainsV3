// High-level workout service functions
// This replaces the old localStorageDB imports

import { db, generateUserIdAsUuid } from './database';
import { Workout, WorkoutTemplate, WorkoutInstance, Exercise } from './types';
import { UserResource } from '@clerk/types';
import { ALL_PRELOADED_PROGRAMS } from './preloadedWorkouts';
import { requestDeduplicator, createRequestKey } from './requestDeduplication';

// Re-export utility functions
export { generateUserIdAsUuid };

// Helper function to calculate 1RM using Epley formula with RIR adjustment
const calculate1RM = (weight: number, reps: number, rir: number): number => {
  // Adjust reps for RIR (could have done more reps)
  const totalReps = reps + rir;
  
  // Epley formula: 1RM = weight × (1 + reps/30)
  // Modified to account for RIR
  if (totalReps === 1) return weight;
  return weight * (1 + totalReps / 30);
};

// Helper function to calculate weight for target reps from 1RM
const calculateWeightFromRM = (oneRM: number, targetReps: number, targetRIR: number): number => {
  // Total reps capability needed
  const totalReps = targetReps + targetRIR;
  
  // Inverse Epley formula: weight = 1RM / (1 + reps/30)
  if (totalReps === 1) return oneRM;
  return oneRM / (1 + totalReps / 30);
};

// Calculate next weight based on exercise history
export const calculateNextWeight = (
  exercise: Exercise,
  targetReps: number,
  targetRIR: number,
  percentIncrease: number = 2.5
): number => {
  if (!exercise.logs || exercise.logs.length === 0) {
    return 45; // Default starting weight
  }

  // Get the most recent log
  const lastLog = exercise.logs[exercise.logs.length - 1];
  const lastWeight = lastLog.weight;
  const lastReps = lastLog.reps;
  const lastRIR = lastLog.rir || 0;

  // Calculate 1RM from last performance
  const estimated1RM = calculate1RM(lastWeight, lastReps, lastRIR);
  
  // Calculate what weight would be needed for target reps/RIR at current strength
  const currentTargetWeight = calculateWeightFromRM(estimated1RM, targetReps, targetRIR);
  
  // Apply progressive overload percentage
  const newWeight = currentTargetWeight * (1 + (percentIncrease / 100));

  // Round to nearest 2.5 lbs
  return Math.round(newWeight / 2.5) * 2.5;
};

// Export normalizeExerciseName from localStorage
export { normalizeExerciseName } from './localStorage';

// Template management
export const saveWorkoutTemplate = async (_supabase: any, template: WorkoutTemplate, user: UserResource): Promise<WorkoutTemplate> => {
  return await db.saveWorkoutTemplate(template, user);
};

export const loadWorkouts = async (_supabase: any, user: UserResource): Promise<Workout[]> => {
  const key = createRequestKey('loadWorkouts', user.id);
  
  return requestDeduplicator.deduplicate(key, async () => {
    const templates = await db.getWorkoutTemplates(user.id);
    
    // Convert templates to Workout format for backward compatibility
    return templates.map(template => ({
      id: template.id,
      workout_name: template.workout_name,
      assigned_days: [], // This will be populated from calendar assignments
      exercises: template.exercises,
      clerk_user_id: template.clerk_user_id,
      user_id: template.user_id
    }));
  });
};

export const saveWorkout = async (_supabase: any, workout: Workout, user: UserResource): Promise<Workout> => {
  const template: WorkoutTemplate = {
    id: workout.id,
    workout_name: workout.workout_name,
    exercises: workout.exercises,
    clerk_user_id: user.id,
    user_id: workout.user_id
  };
  
  const saved = await db.saveWorkoutTemplate(template, user);
  
  return {
    ...workout,
    id: saved.id
  };
};

export const saveWorkouts = async (_supabase: any, workouts: Workout | Workout[], user: UserResource): Promise<void> => {
  const workoutArray = Array.isArray(workouts) ? workouts : [workouts];
  
  for (const workout of workoutArray) {
    await saveWorkout(_supabase, workout, user);
  }
};

export const updateWorkout = async (_supabase: any, updatedWorkout: Workout, user: UserResource): Promise<Workout> => {
  const template: WorkoutTemplate = {
    id: updatedWorkout.id,
    workout_name: updatedWorkout.workout_name,
    exercises: updatedWorkout.exercises,
    clerk_user_id: user.id,
    user_id: updatedWorkout.user_id
  };
  
  const updated = await db.updateWorkoutTemplate(template.id!, { exercises: template.exercises }, user);
  
  return {
    ...updatedWorkout,
    exercises: updated.exercises
  };
};

export const removeWorkoutFromList = async (_supabase: any, workoutName: string, user: UserResource): Promise<void> => {
  const templates = await db.getWorkoutTemplates(user.id);
  const template = templates.find(t => t.workout_name === workoutName);
  
  if (template && template.id) {
    await db.deleteWorkoutTemplate(template.id, user);
  }
};

export const removeExerciseFromWorkout = async (_supabase: any, workoutName: string, exerciseName: string, user: UserResource): Promise<void> => {
  const templates = await db.getWorkoutTemplates(user.id);
  const template = templates.find(t => t.workout_name === workoutName);
  
  if (template && template.id) {
    const updatedExercises = template.exercises.filter(
      ex => ex.name.toUpperCase() !== exerciseName.toUpperCase()
    );
    
    await db.updateWorkoutTemplate(template.id, { exercises: updatedExercises }, user);
  }
};

// Calendar functions
export const getWorkoutsForDate = async (_supabase: any, date: string, user: UserResource): Promise<Workout[]> => {
  const key = createRequestKey('getWorkoutsForDate', user.id, date);
  
  return requestDeduplicator.deduplicate(key, async () => {
    const assignments = await db.getCalendarAssignments(user.id, {
      start: date,
      end: date
    });
    
    const workouts: Workout[] = [];
    
    for (const assignment of assignments) {
      const template = await db.getWorkoutTemplate(assignment.template_id, user.id);
      if (template) {
        workouts.push({
          id: template.id,
          workout_name: template.workout_name,
          assigned_days: [date],
          exercises: template.exercises,
          clerk_user_id: template.clerk_user_id,
          user_id: template.user_id
        });
      }
    }
    
    return workouts;
  });
};

export const getWorkoutForToday = async (_supabase: any, date: string, user: UserResource): Promise<Workout | null> => {
  // First check if there's a manual assignment for this date
  const workouts = await getWorkoutsForDate(_supabase, date, user);
  if (workouts.length > 0) {
    return workouts[0];
  }
  
  // If no manual assignment, check if there's an active training block with rotation
  try {
    const activeBlock = await db.getActiveTrainingBlock(user.id);
    
    if (activeBlock && activeBlock.workoutRotation && activeBlock.workoutRotation.length > 0 && activeBlock.rotationAssignments) {
      // Calculate days since the rotation started
      const targetDate = new Date(date || new Date().toISOString().split('T')[0]);
      const rotationStartDate = activeBlock.lastRotationDate ? new Date(activeBlock.lastRotationDate) : new Date(activeBlock.startDate);
      
      // Calculate the day index within the current week
      const daysDiff = Math.floor((targetDate.getTime() - rotationStartDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // For a full body rotation, we need to track which workout in the sequence this is
      // We'll use a simple counter that increments for each day
      // The key fix: just use daysDiff directly, don't add currentRotationIndex
      const currentIndex = daysDiff % activeBlock.workoutRotation.length;
      const rotationSlot = activeBlock.workoutRotation[currentIndex];
      
      console.log('[getWorkoutForToday] Rotation debug:', {
        date,
        rotationStartDate: rotationStartDate.toISOString(),
        daysDiff,
        currentRotationIndex: activeBlock.currentRotationIndex,
        calculatedIndex: currentIndex,
        rotationLength: activeBlock.workoutRotation.length,
        rotationSlot,
        workoutRotation: activeBlock.workoutRotation
      });
      
      // Get the template ID for this rotation slot
      const templateId = activeBlock.rotationAssignments[rotationSlot];
      
      if (templateId) {
        // Get the workout template
        const template = await db.getWorkoutTemplate(templateId, user.id);
        
        if (template) {
          // Convert to Workout format
          return {
            id: template.id,
            workout_name: template.workout_name,
            assigned_days: [date],
            exercises: template.exercises,
            clerk_user_id: template.clerk_user_id,
            user_id: template.user_id
          };
        }
      }
    }
  } catch (error) {
    console.error('Error checking training block rotation:', error);
  }
  
  return null;
};

export const assignWorkoutToDate = async (_supabase: any, workoutNameOrTemplateId: string, date: string, user: UserResource): Promise<void> => {
  
  try {
    // First try to find by workout name (backward compatibility)
    const templates = await db.getWorkoutTemplates(user.id);
    
    const template = templates.find(t => t.workout_name === workoutNameOrTemplateId || t.id === workoutNameOrTemplateId);
    
    if (template && template.id) {
      const assignment = {
        id: '',
        clerk_user_id: user.id,
        template_id: template.id,
        assigned_date: date,
        completed: false,
        created_at: new Date().toISOString()
      };
      
      await db.saveCalendarAssignment(assignment, user);
    } else {
      // Template not found - this might be an old ID from a previous session
      console.error(`[assignWorkoutToDate] Template ID not found: ${workoutNameOrTemplateId}`);
    }
  } catch (error) {
    console.error('[assignWorkoutToDate] Error:', error);
    throw error;
  }
};

export const removeWorkoutFromDate = async (_supabase: any, workoutNameOrTemplateId: string, date: string, user: UserResource): Promise<void> => {
  // First try to find by workout name (backward compatibility)
  const templates = await db.getWorkoutTemplates(user.id);
  const template = templates.find(t => t.workout_name === workoutNameOrTemplateId || t.id === workoutNameOrTemplateId);
  
  if (template && template.id) {
    const assignments = await db.getCalendarAssignments(user.id, {
      start: date,
      end: date
    });
    
    const assignment = assignments.find(a => a.template_id === template.id && a.assigned_date === date);
    
    if (assignment) {
      await db.deleteCalendarAssignment(assignment.id, user);
    }
  }
};

export const updateWorkoutForDate = async (_supabase: any, workoutNameOrTemplateId: string, date: string, updatedWorkout: Workout, user: UserResource): Promise<void> => {
  // First try to find by workout name (backward compatibility)
  const templates = await db.getWorkoutTemplates(user.id);
  const template = templates.find(t => t.workout_name === workoutNameOrTemplateId || t.id === workoutNameOrTemplateId);
  
  if (template && template.id) {
    // Check if there's already a workout instance for this date
    const instances = await db.getWorkoutInstances(user.id, { start: date, end: date });
    const existingInstance = instances.find(i => i.template_id === template.id && i.scheduled_date === date);
    
    if (existingInstance) {
      // Update the existing instance
      const updatedInstance: WorkoutInstance = {
        ...existingInstance,
        workout_name: updatedWorkout.workout_name,
        exercises: updatedWorkout.exercises
      };
      
      await db.saveWorkoutInstance(updatedInstance, user);
    } else {
      // Create a new instance for this specific date
      const newInstance: WorkoutInstance = {
        id: '',
        template_id: template.id,
        workout_name: updatedWorkout.workout_name,
        exercises: updatedWorkout.exercises,
        scheduled_date: date,
        clerk_user_id: user.id,
        created_at: new Date().toISOString()
      };
      
      await db.saveWorkoutInstance(newInstance, user);
    }
  }
};

export const getWorkoutTemplate = async (_supabase: any, templateId: string, user: UserResource): Promise<WorkoutTemplate | null> => {
  return await db.getWorkoutTemplate(templateId, user.id);
};

export const copyWorkoutTemplate = async (_supabase: any, originalTemplate: WorkoutTemplate, newName: string, user: UserResource): Promise<WorkoutTemplate> => {
  const newTemplate: WorkoutTemplate = {
    ...originalTemplate,
    id: undefined, // Let the database generate a new ID
    workout_name: newName,
    created_at: new Date().toISOString()
  };
  
  return await db.saveWorkoutTemplate(newTemplate, user);
};

// Exercise library
export const getConsolidatedExercises = async (_supabase: any, user: UserResource): Promise<Exercise[]> => {
  const key = createRequestKey('getConsolidatedExercises', user.id);
  
  return requestDeduplicator.deduplicate(key, async () => {
    const library = await db.getExerciseLibrary(user.id);
    
    // Convert to Exercise format
    const exercises: Exercise[] = library.map(entry => ({
      name: entry.exercise_name,
      sets: [],
      rir: 0
    }));
    
    // If no exercises in library, get from templates
    if (exercises.length === 0) {
      const templates = await db.getWorkoutTemplates(user.id);
      const exerciseMap = new Map<string, Exercise>();
      
      templates.forEach(template => {
        template.exercises.forEach(exercise => {
          if (!exerciseMap.has(exercise.name)) {
            exerciseMap.set(exercise.name, exercise);
          }
        });
      });
      
      return Array.from(exerciseMap.values());
    }
    
    return exercises;
  });
};

export const getExerciseHistory = async (user: UserResource): Promise<string[]> => {
  const library = await db.getExerciseLibrary(user.id);
  
  // Sort by use count and last used date
  return library
    .sort((a, b) => {
      if (b.use_count !== a.use_count) return b.use_count - a.use_count;
      return (b.last_used || '').localeCompare(a.last_used || '');
    })
    .map(e => e.exercise_name);
};

export const updateExerciseUsage = async (exerciseName: string, user: UserResource): Promise<void> => {
  await db.updateExerciseUsage(exerciseName, user);
};

export const getLastExercisePerformance = async (exerciseName: string, user: UserResource): Promise<{
  weight: number;
  reps: number;
  rir: number;
  date: string;
  workoutName: string;
} | null> => {
  const key = createRequestKey('getLastExercisePerformance', user.id, exerciseName);
  
  return requestDeduplicator.deduplicate(key, async () => {
    const lastPerformance = await db.getLastExercisePerformance(exerciseName, user.id);
    
    if (!lastPerformance) return null;
    
    return {
      weight: Number(lastPerformance.weight),
      reps: lastPerformance.reps,
      rir: lastPerformance.rir || 0,
      date: lastPerformance.created_at,
      workoutName: 'Previous Workout' // We'll need to get this from workout_instance_id later
    };
  });
};

export const getLastExercisePerformances = async (exerciseNames: string[], user: UserResource): Promise<Record<string, {
  weight: number;
  reps: number;
  rir: number;
  date: string;
  workoutName: string;
}>> => {
  const performances = await db.getLastExercisePerformances(exerciseNames, user.id);
  const result: Record<string, any> = {};
  
  Object.entries(performances).forEach(([exerciseName, performance]) => {
    result[exerciseName] = {
      weight: Number(performance.weight),
      reps: performance.reps,
      rir: performance.rir || 0,
      date: performance.created_at,
      workoutName: 'Previous Workout'
    };
  });
  
  return result;
};

// Utility functions
export const preloadWorkouts = async (_supabase: any, user: UserResource): Promise<void> => {
  console.log('preloadWorkouts called for user:', user.id);
  const existingTemplates = await db.getWorkoutTemplates(user.id);
  console.log('Existing templates:', existingTemplates.length, existingTemplates.map(t => t.workout_name));
  
  // Check which preloaded workouts are missing
  const existingNames = existingTemplates.map(t => t.workout_name.toLowerCase());
  const missingWorkouts = ALL_PRELOADED_PROGRAMS.filter(
    workout => !existingNames.includes(workout.workout_name.toLowerCase())
  );
  
  console.log('ALL_PRELOADED_PROGRAMS count:', ALL_PRELOADED_PROGRAMS.length);
  console.log('Missing workouts:', missingWorkouts.length, missingWorkouts.map(w => w.workout_name));
  
  if (missingWorkouts.length > 0) {
    console.log(`Preloading ${missingWorkouts.length} missing workout templates...`);
    for (const workout of missingWorkouts) {
      const template: WorkoutTemplate = {
        workout_name: workout.workout_name,
        exercises: workout.exercises,
        clerk_user_id: user.id
      };
      console.log('Saving workout template with clerk_user_id:', user.id);
      try {
        await db.saveWorkoutTemplate(template, user);
        console.log('Successfully saved:', workout.workout_name);
      } catch (error) {
        console.error('Failed to save workout:', workout.workout_name, error);
      }
    }
    console.log(`Successfully preloaded ${missingWorkouts.length} workout templates`);
  } else {
    console.log('All preloaded workouts already exist');
  }
};

export const resetWorkouts = async (_supabase: any, user: UserResource): Promise<void> => {
  const templates = await db.getWorkoutTemplates(user.id);
  
  // Delete all templates
  for (const template of templates) {
    if (template.id) {
      await db.deleteWorkoutTemplate(template.id, user);
    }
  }
  
  // Clear all calendar assignments
  const assignments = await db.getCalendarAssignments(user.id);
  for (const assignment of assignments) {
    await db.deleteCalendarAssignment(assignment.id, user);
  }
  
  // Clear all training blocks
  const blocks = await db.getTrainingBlocks(user.id);
  for (const block of blocks) {
    await db.deleteTrainingBlock(block.id, user);
  }
};

// Instance management
export const getWorkoutInstanceForDate = async (workoutTemplateName: string, date: string, user: UserResource): Promise<WorkoutInstance | null> => {
  const instances = await db.getWorkoutInstances(user.id, {
    start: date,
    end: date
  });
  
  return instances.find(i => i.workout_name === workoutTemplateName) || null;
};

export const saveWorkoutInstance = async (instance: WorkoutInstance, user: UserResource): Promise<WorkoutInstance> => {
  return await db.saveWorkoutInstance(instance, user);
};

export const updateWorkoutInstance = async (instanceId: string, updates: Partial<WorkoutInstance>, user: UserResource): Promise<WorkoutInstance> => {
  return await db.updateWorkoutInstance(instanceId, updates, user);
};

// Debug function to check calendar assignments
export const debugCalendarAssignments = async (user: UserResource): Promise<void> => {
  console.log('=== DEBUG: Calendar Assignments ===');
  console.log('User ID:', user.id);
  console.log('User email:', user.primaryEmailAddress?.emailAddress);
  
  try {
    // Get all assignments for this user
    const assignments = await db.getCalendarAssignments(user.id);
    console.log('Total assignments found:', assignments.length);
    
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    console.log('Today\'s date:', today);
    
    // Get assignments for today
    const todayAssignments = await db.getCalendarAssignments(user.id, {
      start: today,
      end: today
    });
    console.log('Today\'s assignments:', todayAssignments.length);
    console.log('Today\'s assignment details:', todayAssignments);
    
    // Get all workout templates
    const templates = await db.getWorkoutTemplates(user.id);
    console.log('Total workout templates:', templates.length);
    console.log('Template names:', templates.map(t => ({ id: t.id, name: t.workout_name })));
    
    console.log('=== END DEBUG ===');
  } catch (error) {
    console.error('Debug error:', error);
  }
};

// Exercise log management
export const saveExerciseLog = async (log: {
  clerk_user_id: string;
  workout_instance_id: string;
  exercise_name: string;
  set_number: number;
  weight: number;
  reps: number;
  rir: number;
  notes?: string;
}): Promise<void> => {
  await db.saveExerciseLog(log);
};