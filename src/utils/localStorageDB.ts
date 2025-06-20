// High-level workout service functions
// This replaces the old localStorageDB imports

import { db, generateUserIdAsUuid } from './database';
import { Workout, WorkoutTemplate, WorkoutInstance, Exercise } from './types';
import { UserResource } from '@clerk/types';
import { ALL_PRELOADED_PROGRAMS } from './preloadedWorkouts';

// Re-export utility functions
export { generateUserIdAsUuid };

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
  const lastRIR = lastLog.rir;

  // Base calculation on the difference between last performance and target
  let newWeight = lastWeight;

  // If we did more reps than target or had more RIR, increase weight
  if (lastReps > targetReps || lastRIR > targetRIR) {
    const repDifference = lastReps - targetReps;
    const rirDifference = lastRIR - targetRIR;
    
    // Each extra rep or RIR point suggests we can increase weight
    const totalIncreaseFactor = (repDifference * 0.025) + (rirDifference * 0.025);
    newWeight = lastWeight * (1 + totalIncreaseFactor + (percentIncrease / 100));
  } 
  // If we did fewer reps or less RIR, maintain or slightly increase
  else if (lastReps < targetReps || lastRIR < targetRIR) {
    // Only apply the small percentage increase
    newWeight = lastWeight * (1 + (percentIncrease / 100));
  } 
  // If performance matched target, apply standard increase
  else {
    newWeight = lastWeight * (1 + (percentIncrease / 100));
  }

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
      // Calculate days since last rotation was applied
      const targetDate = new Date(date || new Date().toISOString().split('T')[0]);
      const lastRotationDate = activeBlock.lastRotationDate ? new Date(activeBlock.lastRotationDate) : new Date(activeBlock.startDate);
      
      // Calculate which day we're on
      const daysDiff = Math.floor((targetDate.getTime() - lastRotationDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Get current rotation index
      const currentIndex = ((activeBlock.currentRotationIndex || 0) + daysDiff) % activeBlock.workoutRotation.length;
      const rotationSlot = activeBlock.workoutRotation[currentIndex];
      
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
  // First try to find by workout name (backward compatibility)
  const templates = await db.getWorkoutTemplates(user.id);
  const template = templates.find(t => t.workout_name === workoutNameOrTemplateId || t.id === workoutNameOrTemplateId);
  
  if (template && template.id) {
    await db.saveCalendarAssignment({
      id: '',
      clerk_user_id: user.id,
      template_id: template.id,
      assigned_date: date,
      completed: false,
      created_at: new Date().toISOString()
    }, user);
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