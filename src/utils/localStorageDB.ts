// src/utils/localStorageDB.ts

import { Workout, Exercise, WorkoutSet, WorkoutTemplate, WorkoutInstance } from "./types";
import { UserResource } from "@clerk/types";
import { v5 as uuidv5 } from "uuid";

const NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

// Local storage keys
const WORKOUT_TEMPLATES_KEY = "optigains_workout_templates";
const WORKOUT_INSTANCES_KEY = "optigains_workout_instances";
const USER_KEY = "optigains_user";

export const generateUserIdAsUuid = (clerkUserId: string): string => {
  return uuidv5(clerkUserId, NAMESPACE);
};

// Initialize user in localStorage if not exists
const initializeUser = (user: UserResource) => {
  const storedUser = localStorage.getItem(USER_KEY);
  if (!storedUser || JSON.parse(storedUser).clerk_user_id !== user.id) {
    localStorage.setItem(USER_KEY, JSON.stringify({
      id: generateUserIdAsUuid(user.id),
      clerk_user_id: user.id,
      created_at: new Date().toISOString()
    }));
  }
};

// Template storage functions
const getStoredTemplates = (userId: string): WorkoutTemplate[] => {
  const templatesJson = localStorage.getItem(`${WORKOUT_TEMPLATES_KEY}_${userId}`);
  if (!templatesJson) return [];
  try {
    return JSON.parse(templatesJson);
  } catch (e) {
    console.error("Error parsing workout templates from localStorage:", e);
    return [];
  }
};

const setStoredTemplates = (userId: string, templates: WorkoutTemplate[]) => {
  localStorage.setItem(`${WORKOUT_TEMPLATES_KEY}_${userId}`, JSON.stringify(templates));
};

// Instance storage functions
const getStoredInstances = (userId: string): WorkoutInstance[] => {
  const instancesJson = localStorage.getItem(`${WORKOUT_INSTANCES_KEY}_${userId}`);
  if (!instancesJson) return [];
  try {
    return JSON.parse(instancesJson);
  } catch (e) {
    console.error("Error parsing workout instances from localStorage:", e);
    return [];
  }
};

const setStoredInstances = (userId: string, instances: WorkoutInstance[]) => {
  localStorage.setItem(`${WORKOUT_INSTANCES_KEY}_${userId}`, JSON.stringify(instances));
};

// Template management functions
export const saveWorkoutTemplate = async (
  _supabase: any,
  template: WorkoutTemplate,
  user: UserResource
): Promise<WorkoutTemplate> => {
  initializeUser(user);
  const userId = user.id;
  const templates = getStoredTemplates(userId);
  
  const templateToSave: WorkoutTemplate = {
    ...template,
    id: template.id || uuidv5(`${user.id}-${template.workout_name}`, NAMESPACE),
    user_id: generateUserIdAsUuid(user.id),
    clerk_user_id: user.id,
    created_at: template.created_at || new Date().toISOString()
  };

  const existingIndex = templates.findIndex(t => t.id === templateToSave.id);
  if (existingIndex !== -1) {
    templates[existingIndex] = templateToSave;
  } else {
    templates.push(templateToSave);
  }

  setStoredTemplates(userId, templates);
  return templateToSave;
};

export const copyWorkoutTemplate = async (
  _supabase: any,
  originalTemplate: WorkoutTemplate,
  newName: string,
  user: UserResource
): Promise<WorkoutTemplate> => {
  initializeUser(user);
  
  // Create a deep copy of the original template
  const copiedTemplate: WorkoutTemplate = {
    ...originalTemplate,
    id: uuidv5(`${user.id}-${newName}-${Date.now()}`, NAMESPACE), // Generate new unique ID
    workout_name: newName,
    created_at: new Date().toISOString(),
    user_id: generateUserIdAsUuid(user.id),
    clerk_user_id: user.id,
    // Deep copy exercises and sets
    exercises: originalTemplate.exercises.map(exercise => ({
      ...exercise,
      sets: exercise.sets.map(set => ({ ...set })),
      logs: exercise.logs ? exercise.logs.map(log => ({ ...log })) : []
    }))
  };

  return await saveWorkoutTemplate(_supabase, copiedTemplate, user);
};

export const loadWorkoutTemplates = async (
  _supabase: any,
  clerkUser: UserResource
): Promise<WorkoutTemplate[]> => {
  if (!clerkUser || !clerkUser.id) {
    console.warn("No Clerk user provided to loadWorkoutTemplates.");
    return [];
  }

  initializeUser(clerkUser);
  return getStoredTemplates(clerkUser.id);
};

export const getWorkoutTemplate = async (
  _supabase: any,
  templateName: string,
  user: UserResource
): Promise<WorkoutTemplate | null> => {
  const templates = getStoredTemplates(user.id);
  return templates.find(t => t.workout_name === templateName) || null;
};

export const removeWorkoutTemplate = async (
  _supabase: any,
  templateName: string,
  user: UserResource
) => {
  const templates = getStoredTemplates(user.id);
  const filteredTemplates = templates.filter(t => t.workout_name !== templateName);
  setStoredTemplates(user.id, filteredTemplates);
  
  // Also remove any instances of this template
  const instances = getStoredInstances(user.id);
  const filteredInstances = instances.filter(i => i.workout_name !== templateName);
  setStoredInstances(user.id, filteredInstances);
};

// Instance management functions
export const createWorkoutInstance = async (
  _supabase: any,
  templateName: string,
  date: string,
  user: UserResource
): Promise<WorkoutInstance | null> => {
  const template = await getWorkoutTemplate(_supabase, templateName, user);
  if (!template) {
    console.error(`Template ${templateName} not found`);
    return null;
  }

  const instances = getStoredInstances(user.id);
  
  // Check if instance already exists for this date
  const existingInstance = instances.find(
    i => i.template_id === template.id && i.scheduled_date === date
  );
  
  if (existingInstance) {
    return existingInstance;
  }

  // Create fresh instance with reset exercise data
  const freshExercises = template.exercises.map((exercise: Exercise) => ({
    ...exercise,
    sets: exercise.sets.map((set: WorkoutSet) => ({
      ...set,
      isLogged: false,
    })),
    logs: [], // Fresh logs for this instance
  }));

  const newInstance: WorkoutInstance = {
    id: uuidv5(`${template.id}-${date}-${new Date().toISOString()}`, NAMESPACE),
    template_id: template.id!,
    workout_name: template.workout_name,
    scheduled_date: date,
    exercises: freshExercises,
    clerk_user_id: user.id,
    user_id: generateUserIdAsUuid(user.id),
    created_at: new Date().toISOString()
  };

  instances.push(newInstance);
  setStoredInstances(user.id, instances);
  
  return newInstance;
};

export const saveWorkoutInstance = async (
  _supabase: any,
  instance: WorkoutInstance,
  user: UserResource
): Promise<WorkoutInstance> => {
  const instances = getStoredInstances(user.id);
  const existingIndex = instances.findIndex(i => i.id === instance.id);
  
  if (existingIndex !== -1) {
    instances[existingIndex] = instance;
  } else {
    instances.push(instance);
  }
  
  setStoredInstances(user.id, instances);
  return instance;
};

export const getWorkoutInstance = async (
  _supabase: any,
  templateName: string,
  date: string,
  user: UserResource
): Promise<WorkoutInstance | null> => {
  const instances = getStoredInstances(user.id);
  return instances.find(
    i => i.workout_name === templateName && i.scheduled_date === date
  ) || null;
};

export const getWorkoutInstancesForDate = async (
  _supabase: any,
  date: string,
  user: UserResource
): Promise<WorkoutInstance[]> => {
  const instances = getStoredInstances(user.id);
  return instances.filter(i => i.scheduled_date === date);
};

export const completeWorkoutInstance = async (
  _supabase: any,
  instanceId: string,
  user: UserResource
): Promise<void> => {
  const instances = getStoredInstances(user.id);
  const instance = instances.find(i => i.id === instanceId);
  
  if (instance) {
    instance.completed_at = new Date().toISOString();
    setStoredInstances(user.id, instances);
  }
};

// Legacy compatibility functions (convert old Workout interface to new system)
export const saveWorkouts = async (
  _supabase: any,
  workouts: Workout[],
  user: UserResource
): Promise<any> => {
  // Convert old Workout format to WorkoutTemplate format
  for (const workout of workouts) {
    const template: WorkoutTemplate = {
      id: workout.id,
      workout_name: workout.workout_name,
      exercises: workout.exercises,
      clerk_user_id: user.id,
      user_id: generateUserIdAsUuid(user.id),
      created_at: new Date().toISOString()
    };
    
    await saveWorkoutTemplate(_supabase, template, user);
    
    // Create instances for assigned days
    if (workout.assigned_days) {
      for (const date of workout.assigned_days) {
        await createWorkoutInstance(_supabase, workout.workout_name, date, user);
      }
    }
  }
  
  return workouts;
};

export const loadWorkouts = async (
  _supabase: any,
  clerkUser: UserResource
): Promise<Workout[]> => {
  // Convert templates back to old Workout format for compatibility
  const templates = await loadWorkoutTemplates(_supabase, clerkUser);
  const instances = getStoredInstances(clerkUser.id);
  
  return templates.map(template => {
    const assignedDays = instances
      .filter(i => i.template_id === template.id)
      .map(i => i.scheduled_date);
    
    return {
      id: template.id,
      workout_name: template.workout_name,
      assigned_days: assignedDays,
      exercises: template.exercises,
      clerk_user_id: template.clerk_user_id,
      user_id: template.user_id
    };
  });
};

export const normalizeExerciseName = (name: string) => name.toUpperCase();

export const assignWorkoutToDate = async (
  _supabase: any,
  workoutId: string,
  date: string,
  user: UserResource
) => {
  await createWorkoutInstance(_supabase, workoutId, date, user);
};

export const getWorkoutsForDate = async (
  _supabase: any,
  date: string,
  user: UserResource
): Promise<Workout[]> => {
  const instances = await getWorkoutInstancesForDate(_supabase, date, user);
  
  // Convert instances back to Workout format for compatibility
  return instances.map(instance => ({
    id: instance.id,
    workout_name: instance.workout_name,
    assigned_days: [instance.scheduled_date],
    exercises: instance.exercises,
    clerk_user_id: instance.clerk_user_id,
    user_id: instance.user_id
  }));
};

export const getWorkoutForToday = async (
  _supabase: any,
  _today: string,
  user: UserResource
): Promise<Workout | null> => {
  const todayDate = new Date().toISOString().split("T")[0];
  const instances = await getWorkoutInstancesForDate(_supabase, todayDate, user);
  
  if (instances.length === 0) return null;
  
  // Return the first instance as a Workout for compatibility
  const instance = instances[0];
  return {
    id: instance.id,
    workout_name: instance.workout_name,
    assigned_days: [instance.scheduled_date],
    exercises: instance.exercises,
    clerk_user_id: instance.clerk_user_id,
    user_id: instance.user_id
  };
};

export const removeWorkoutFromDate = async (
  _supabase: any,
  workoutId: string,
  date: string,
  user: UserResource
) => {
  const instances = getStoredInstances(user.id);
  const filteredInstances = instances.filter(
    i => !(i.workout_name === workoutId && i.scheduled_date === date)
  );
  setStoredInstances(user.id, filteredInstances);
};

export const lastSet = (
  exercise: Exercise
): { weight: number; reps: number; rir: number } | null => {
  if (!exercise.logs || exercise.logs.length === 0) {
    console.warn(`No logs available for exercise: ${exercise.name}`);
    return null;
  }

  const lastLog = exercise.logs[exercise.logs.length - 1];

  if (
    !lastLog ||
    typeof lastLog.weight === "undefined" ||
    typeof lastLog.reps === "undefined" ||
    typeof lastLog.rir === "undefined"
  ) {
    console.warn(`Invalid log data for exercise: ${exercise.name}`);
    return null;
  }

  return {
    weight: lastLog.weight,
    reps: lastLog.reps,
    rir: lastLog.rir,
  };
};

export const calculateNextWeight = (
  exercise: Exercise,
  reps: number,
  rir: number,
  percentIncrease: number = 1.5
): number => {
  if (!exercise.logs || exercise.logs.length === 0) {
    console.warn(`No logs available for exercise: ${exercise.name}`);
    return exercise.sets[0]?.weight ?? 0;
  }

  const lastLog = exercise.logs[exercise.logs.length - 1];

  if (
    !lastLog ||
    typeof lastLog.weight === "undefined" ||
    typeof lastLog.reps === "undefined" ||
    typeof lastLog.rir === "undefined"
  ) {
    console.warn(`Invalid log data for exercise: ${exercise.name}`);
    return exercise.sets[0]?.weight ?? 0;
  }

  const lastAdjustedReps = lastLog.reps + lastLog.rir;
  const adjustedReps = reps + rir;

  if (lastAdjustedReps <= 0 || adjustedReps <= 0) {
    return lastLog.weight;
  }

  const calculatedOneRm = lastLog.weight * (1 + 0.0333 * lastAdjustedReps);
  const estimatedWeight = calculatedOneRm / (1 + 0.0333 * adjustedReps);

  const result =
    isNaN(estimatedWeight) || estimatedWeight <= 0
      ? lastLog.weight
      : estimatedWeight;

  const adjustedWeight = result * (1 + percentIncrease / 100);

  return Math.round(adjustedWeight / 5) * 5;
};

export const addWorkoutWithNormalizedExercises = async (
  _supabase: any,
  workout: Workout,
  user: UserResource
) => {
  const normalizedExercises = workout.exercises.map((newExercise) => {
    const normalizedName = normalizeExerciseName(newExercise.name);
    return {
      ...newExercise,
      name: normalizedName,
    };
  });

  const template: WorkoutTemplate = {
    workout_name: workout.workout_name,
    exercises: normalizedExercises,
    clerk_user_id: user.id,
    user_id: generateUserIdAsUuid(user.id),
  };

  await saveWorkoutTemplate(_supabase, template, user);
};

export const getConsolidatedExercises = async (
  _supabase: any,
  user: UserResource
): Promise<Exercise[]> => {
  const templates = await loadWorkoutTemplates(_supabase, user);
  const allExercises: Exercise[] = templates.flatMap(
    (template) => template.exercises
  );

  const exerciseMap: { [key: string]: Exercise } = {};

  allExercises.forEach((exercise) => {
    const normalizedName = normalizeExerciseName(exercise.name);
    if (!exerciseMap[normalizedName]) {
      exerciseMap[normalizedName] = {
        ...exercise,
        sets: [...exercise.sets],
        logs: [...(exercise.logs || [])],
      };
    } else {
      exerciseMap[normalizedName].sets.push(...exercise.sets);
      exerciseMap[normalizedName].logs = [
        ...(exerciseMap[normalizedName].logs || []),
        ...(exercise.logs || []),
      ];
    }
  });

  return Object.values(exerciseMap);
};

export const removeWorkoutFromList = async (
  _supabase: any,
  workoutId: string,
  user: UserResource
) => {
  await removeWorkoutTemplate(_supabase, workoutId, user);
};

export const editWorkout = async (
  _supabase: any,
  workoutId: string,
  updatedWorkout: Workout,
  user: UserResource
) => {
  const template = await getWorkoutTemplate(_supabase, workoutId, user);
  if (template) {
    const updatedTemplate: WorkoutTemplate = {
      ...template,
      ...updatedWorkout,
      id: template.id,
      clerk_user_id: user.id,
      user_id: generateUserIdAsUuid(user.id),
    };
    await saveWorkoutTemplate(_supabase, updatedTemplate, user);
  } else {
    console.warn(`Workout template with name ${workoutId} not found.`);
  }
};

export const removeExerciseFromWorkout = async (
  _supabase: any,
  workoutId: string,
  exerciseName: string,
  user: UserResource
) => {
  const template = await getWorkoutTemplate(_supabase, workoutId, user);
  if (template) {
    template.exercises = template.exercises.filter(
      (exercise) =>
        normalizeExerciseName(exercise.name) !==
        normalizeExerciseName(exerciseName)
    );
    await saveWorkoutTemplate(_supabase, template, user);
  } else {
    console.warn(`Workout template with name ${workoutId} not found.`);
  }
};

export const rearrangeExercisesInWorkout = async (
  _supabase: any,
  workoutId: string,
  newOrder: Exercise[],
  user: UserResource
) => {
  const template = await getWorkoutTemplate(_supabase, workoutId, user);
  if (template) {
    template.exercises = newOrder;
    await saveWorkoutTemplate(_supabase, template, user);
  } else {
    console.warn(`Workout template with name ${workoutId} not found.`);
  }
};

export const preloadWorkouts = async (
  _supabase: any,
  user: UserResource
) => {
  initializeUser(user);
  const existingTemplates = getStoredTemplates(user.id);
  
  // Don't overwrite existing templates
  if (existingTemplates && existingTemplates.length > 0) return;

  const defaultTemplates: WorkoutTemplate[] = [
    {
      workout_name: "FB 1 Chest Focus",
      exercises: [
        {
          name: "Converging Machine Press",
          sets: [{ weight: 185, reps: 8, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 185, reps: 8, rir: 0 }],
        },
        {
          name: "Behind-the-Back Cuff Lateral Raises",
          sets: [{ weight: 25, reps: 12, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 25, reps: 12, rir: 0 }],
        },
        {
          name: "Chest-Supported Row",
          sets: [{ weight: 225, reps: 8, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 225, reps: 8, rir: 0 }],
        },
        {
          name: "Seated Leg Curl",
          sets: [{ weight: 120, reps: 15, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 120, reps: 15, rir: 0 }],
        },
        {
          name: "Machine Shoulder Press",
          sets: [{ weight: 135, reps: 8, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 135, reps: 8, rir: 0 }],
        },
        {
          name: "Leg Press",
          sets: [{ weight: 315, reps: 15, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 315, reps: 15, rir: 0 }],
        },
        {
          name: "Cable Tricep Pushdown",
          sets: [{ weight: 50, reps: 10, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 50, reps: 10, rir: 0 }],
        },
        {
          name: "Wide-Grip Lat Pulldown",
          sets: [{ weight: 150, reps: 8, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 150, reps: 8, rir: 0 }],
        },
        {
          name: "Leg Extension",
          sets: [{ weight: 200, reps: 15, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 200, reps: 15, rir: 0 }],
        },
        {
          name: "Incline Curl",
          sets: [{ weight: 30, reps: 10, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 30, reps: 10, rir: 0 }],
        },
        {
          name: "Calf Press",
          sets: [{ weight: 200, reps: 15, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 200, reps: 15, rir: 0 }],
        },
        {
          name: "Ab Leg Raise",
          sets: [{ weight: 0, reps: 15, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 0, reps: 15, rir: 0 }],
        },
        {
          name: "Skullcrusher",
          sets: [{ weight: 60, reps: 10, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 60, reps: 10, rir: 0 }],
        },
      ],
      clerk_user_id: user.id,
      user_id: generateUserIdAsUuid(user.id),
    },
    {
      workout_name: "FB 2 Back Focus",
      exercises: [
        {
          name: "Wide-Grip Lat Pulldown",
          sets: [{ weight: 150, reps: 10, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 150, reps: 10, rir: 0 }],
        },
        {
          name: "Leg Extension",
          sets: [{ weight: 200, reps: 8, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 200, reps: 8, rir: 0 }],
        },
        {
          name: "Wide-Grip Bench Press",
          sets: [{ weight: 225, reps: 10, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 225, reps: 10, rir: 0 }],
        },
        {
          name: "Squat",
          sets: [{ weight: 225, reps: 8, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 225, reps: 8, rir: 0 }],
        },
        {
          name: "Machine Preacher Curl",
          sets: [{ weight: 80, reps: 10, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 80, reps: 10, rir: 0 }],
        },
        {
          name: "Chest-Supported Row",
          sets: [{ weight: 225, reps: 10, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 225, reps: 10, rir: 0 }],
        },
        {
          name: "RDL",
          sets: [{ weight: 185, reps: 8, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 185, reps: 8, rir: 0 }],
        },
        {
          name: "Behind-the-Back Cuff Lateral Raises",
          sets: [{ weight: 25, reps: 12, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 25, reps: 12, rir: 0 }],
        },
        {
          name: "JM Press",
          sets: [{ weight: 135, reps: 10, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 135, reps: 10, rir: 0 }],
        },
        {
          name: "Calf Press",
          sets: [{ weight: 200, reps: 15, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 200, reps: 15, rir: 0 }],
        },
        {
          name: "Shoulder Press Machine",
          sets: [{ weight: 135, reps: 10, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 135, reps: 10, rir: 0 }],
        },
        {
          name: "Abs Crunch Machine",
          sets: [{ weight: 100, reps: 15, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 100, reps: 15, rir: 0 }],
        },
        {
          name: "Close-Grip Bench",
          sets: [{ weight: 185, reps: 10, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 185, reps: 10, rir: 0 }],
        },
      ],
      clerk_user_id: user.id,
      user_id: generateUserIdAsUuid(user.id),
    },
    {
      workout_name: "FB 3 Sharms Focus",
      exercises: [
        {
          name: "Machine Shoulder Press",
          sets: [{ weight: 135, reps: 8, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 135, reps: 8, rir: 0 }],
        },
        {
          name: "Seated Leg Curl",
          sets: [{ weight: 120, reps: 15, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 120, reps: 15, rir: 0 }],
        },
        {
          name: "Pec Deck",
          sets: [{ weight: 150, reps: 10, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 150, reps: 10, rir: 0 }],
        },
        {
          name: "Cable Curl",
          sets: [{ weight: 50, reps: 10, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 50, reps: 10, rir: 0 }],
        },
        {
          name: "Hack Squat",
          sets: [{ weight: 225, reps: 15, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 225, reps: 15, rir: 0 }],
        },
        {
          name: "Cable Tricep Pushdown",
          sets: [{ weight: 50, reps: 10, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 50, reps: 10, rir: 0 }],
        },
        {
          name: "Chest-Supported Row",
          sets: [{ weight: 225, reps: 8, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 225, reps: 8, rir: 0 }],
        },
        {
          name: "Behind-the-Back Cuff Lateral Raises",
          sets: [{ weight: 25, reps: 12, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 25, reps: 12, rir: 0 }],
        },
        {
          name: "Squat",
          sets: [{ weight: 225, reps: 15, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 225, reps: 15, rir: 0 }],
        },
        {
          name: "Close-Grip Bench",
          sets: [{ weight: 185, reps: 8, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 185, reps: 8, rir: 0 }],
        },
        {
          name: "Normal-Grip Lat Pulldown",
          sets: [{ weight: 150, reps: 8, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 150, reps: 8, rir: 0 }],
        },
        {
          name: "Calf Press",
          sets: [{ weight: 200, reps: 15, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 200, reps: 15, rir: 0 }],
        },
        {
          name: "Ab Leg Raise",
          sets: [{ weight: 0, reps: 15, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 0, reps: 15, rir: 0 }],
        },
      ],
      clerk_user_id: user.id,
      user_id: generateUserIdAsUuid(user.id),
    },
    {
      workout_name: "FB 4 Legs Focus",
      exercises: [
        {
          name: "Squat",
          sets: [{ weight: 225, reps: 8, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 225, reps: 8, rir: 0 }],
        },
        {
          name: "Converging Machine Press",
          sets: [{ weight: 185, reps: 12, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 185, reps: 12, rir: 0 }],
        },
        {
          name: "45° Hyperextensions",
          sets: [{ weight: 0, reps: 15, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 0, reps: 15, rir: 0 }],
        },
        {
          name: "Incline Curl",
          sets: [{ weight: 30, reps: 12, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 30, reps: 12, rir: 0 }],
        },
        {
          name: "Leg Press",
          sets: [{ weight: 315, reps: 8, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 315, reps: 8, rir: 0 }],
        },
        {
          name: "Close-Grip Bench",
          sets: [{ weight: 185, reps: 12, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 185, reps: 12, rir: 0 }],
        },
        {
          name: "Machine Lateral Raises",
          sets: [{ weight: 50, reps: 12, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 50, reps: 12, rir: 0 }],
        },
        {
          name: "Leg Extension",
          sets: [{ weight: 200, reps: 8, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 200, reps: 8, rir: 0 }],
        },
        {
          name: "Chest-Supported Row",
          sets: [{ weight: 225, reps: 12, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 225, reps: 12, rir: 0 }],
        },
        {
          name: "Cable Tricep Pushdown",
          sets: [{ weight: 50, reps: 12, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 50, reps: 12, rir: 0 }],
        },
        {
          name: "Calf Press",
          sets: [{ weight: 200, reps: 15, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 200, reps: 15, rir: 0 }],
        },
        {
          name: "Machine Shoulder Press",
          sets: [{ weight: 135, reps: 12, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 135, reps: 12, rir: 0 }],
        },
        {
          name: "Ab Machine Crunch",
          sets: [{ weight: 100, reps: 15, rir: 0 }],
          rir: 0,
          logs: [{ date: "2025-01-16", weight: 100, reps: 15, rir: 0 }],
        },
      ],
      clerk_user_id: user.id,
      user_id: generateUserIdAsUuid(user.id),
    },
  ];

  // Save all templates
  for (const template of defaultTemplates) {
    await saveWorkoutTemplate(_supabase, template, user);
  }

  return defaultTemplates;
};

export const resetWorkouts = async (
  _supabase: any,
  user: UserResource
) => {
  // Clear existing templates and instances
  setStoredTemplates(user.id, []);
  setStoredInstances(user.id, []);
  
  // Preload the default templates
  await preloadWorkouts(_supabase, user);
};