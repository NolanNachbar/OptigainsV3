// src/utils/SupaBase.ts

// import { useAuth } from "@clerk/clerk-react";
import { SupabaseClient } from "@supabase/supabase-js";
import { Workout, Exercise } from "./types";
// import { getSupabaseClient } from "../utils/supabaseClient";
import { UserResource } from "@clerk/types";
import { v5 as uuidv5 } from "uuid";

const NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8"; // Use a constant valid UUID as a namespace

export const generateUserIdAsUuid = (clerkUserId: string): string => {
  return uuidv5(clerkUserId, NAMESPACE); // Convert Clerk ID to a UUID
};

export const saveWorkouts = async (
  supabase: SupabaseClient,
  workouts: Workout[],
  user: UserResource
) => {
  const workoutsToSave = workouts.map((workout) => ({
    id: workout.id || uuidv5(`${user.id}-${workout.workout_name}`, NAMESPACE),
    user_id: generateUserIdAsUuid(user.id),
    workout_name: workout.workout_name,
    assigned_days: workout.assigned_days || [],
    exercises: workout.exercises || [],
    clerk_user_id: user.id,
  }));

  const { data, error } = await supabase
    .from("workouts")
    .upsert(workoutsToSave, {
      onConflict: "id", // Use the UUID primary key for conflict resolution
      ignoreDuplicates: false,
    });

  if (error) {
    console.error("Error saving workouts:", error);
    throw error;
  }

  return data;
};

export const loadWorkouts = async (
  supabase: SupabaseClient,
  user: UserResource
): Promise<Workout[]> => {
  const { data, error } = await supabase
    .from("workouts")
    .select("*")
    .eq("user_id", generateUserIdAsUuid(user.id)); // Convert Clerk ID to UUID

  if (error) {
    console.error("Error loading workouts:", error);
    throw error;
  }

  return data || [];
};

// Normalize exercise name to uppercase
export const normalizeExerciseName = (name: string) => name.toUpperCase();

// Assign a workout to a specific date
export const assignWorkoutToDate = async (
  supabase: SupabaseClient,
  workoutId: string,
  date: string,
  user: UserResource
) => {
  try {
    // Fetch the current workout
    const { data: workout, error: fetchError } = await supabase
      .from("workouts")
      .select("*")
      .eq("workout_name", workoutId)
      .eq("user_id", generateUserIdAsUuid(user.id))
      .single();

    if (fetchError) throw fetchError;

    // Update assigned_days if the date isn't already included
    const updatedAssignedDays = Array.isArray(workout.assigned_days)
      ? [...new Set([...workout.assigned_days, date])] // Ensure no duplicates
      : [date];

    // Update the workout in the database
    const { error: updateError } = await supabase
      .from("workouts")
      .update({ assigned_days: updatedAssignedDays })
      .eq("workout_name", workoutId)
      .eq("user_id", generateUserIdAsUuid(user.id));

    if (updateError) throw updateError;
  } catch (error) {
    console.error("Error assigning workout to date:", error);
    throw error;
  }
};

// Get the workouts assigned to a specific day
export const getWorkoutsForDate = async (
  supabase: SupabaseClient,
  date: string,
  user: UserResource
): Promise<Workout[]> => {
  const workouts = await loadWorkouts(supabase, user);
  return workouts.filter(
    (workout) =>
      workout?.assigned_days &&
      Array.isArray(workout.assigned_days) &&
      workout.assigned_days.includes(date)
  );
};

// Get the workout assigned for today
export const getWorkoutForToday = async (
  supabase: SupabaseClient,
  _today: string, // Prefix with underscore to indicate intentionally unused parameter
  user: UserResource
): Promise<Workout | null> => {
  try {
    // Get today's date in YYYY-MM-DD format
    const todayDate = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("workouts")
      .select("*")
      .eq("user_id", generateUserIdAsUuid(user.id))
      .contains("assigned_days", `["${todayDate}"]`);

    if (error) {
      console.error("Error fetching today's workout:", error);
      return null;
    }

    // Add debug logging
    console.log("Today's date:", todayDate);
    console.log("Found workouts:", data);

    if (!data?.[0]) return null;

    // Return the workout as is, preserving logged sets
    return data[0];
  } catch (error) {
    console.error("Error in getWorkoutForToday:", error);
    return null;
  }
};

// Remove a workout from a specific date
export const removeWorkoutFromDate = async (
  supabase: SupabaseClient,
  workoutId: string,
  date: string,
  user: UserResource
) => {
  const workouts = await loadWorkouts(supabase, user);
  const workoutIndex = workouts.findIndex(
    (workout) => workout.workout_name === workoutId
  );

  if (workoutIndex !== -1) {
    workouts[workoutIndex].assigned_days = workouts[
      workoutIndex
    ].assigned_days.filter((d) => d !== date);
    await saveWorkouts(supabase, workouts, user);
  }
};

// Get the last set of an exercise
export const lastSet = (
  exercise: Exercise
): { weight: number; reps: number; rir: number } | null => {
  if (!exercise.logs || exercise.logs.length === 0) {
    console.warn(`No logs available for exercise: ${exercise.name}`);
    return null; // Return null to indicate no previous logs exist
  }

  const lastLog = exercise.logs[exercise.logs.length - 1];

  if (
    !lastLog ||
    typeof lastLog.weight === "undefined" ||
    typeof lastLog.reps === "undefined" ||
    typeof lastLog.rir === "undefined"
  ) {
    console.warn(`Invalid log data for exercise: ${exercise.name}`);
    return null; // Return null if data is invalid
  }

  return {
    weight: lastLog.weight,
    reps: lastLog.reps,
    rir: lastLog.rir,
  };
};

// Calculate the next weight for an exercise
export const calculateNextWeight = (
  exercise: Exercise,
  reps: number,
  rir: number,
  percentIncrease: number = 1.5 // Default to 1.5% if not provided
): number => {
  // Check if the exercise has logs
  if (!exercise.logs || exercise.logs.length === 0) {
    console.warn(`No logs available for exercise: ${exercise.name}`);
    return exercise.sets[0]?.weight ?? 0; // Return the initial set weight or 0 if not available
  }

  const lastLog = exercise.logs[exercise.logs.length - 1];

  // Check if the last log is valid
  if (
    !lastLog ||
    typeof lastLog.weight === "undefined" ||
    typeof lastLog.reps === "undefined" ||
    typeof lastLog.rir === "undefined"
  ) {
    console.warn(`Invalid log data for exercise: ${exercise.name}`);
    return exercise.sets[0]?.weight ?? 0; // Return the initial set weight if last log is invalid
  }

  // Calculate adjusted reps from last log
  const lastAdjustedReps = lastLog.reps + lastLog.rir;
  const adjustedReps = reps + rir;

  if (lastAdjustedReps <= 0 || adjustedReps <= 0) {
    return lastLog.weight; // Return the last known weight if reps are invalid
  }

  // Calculate 1RM and then estimate the new weight
  const calculatedOneRm = lastLog.weight * (1 + 0.0333 * lastAdjustedReps);
  const estimatedWeight = calculatedOneRm / (1 + 0.0333 * adjustedReps);

  // If the estimated weight is invalid (NaN or <= 0), fallback to last known weight
  const result =
    isNaN(estimatedWeight) || estimatedWeight <= 0
      ? lastLog.weight
      : estimatedWeight;

  // Apply percent increase if provided
  const adjustedWeight = result * (1 + percentIncrease / 100);

  return Math.round(adjustedWeight / 5) * 5; // Round to nearest 5 lbs
};

// Add a workout with normalized exercises
export const addWorkoutWithNormalizedExercises = async (
  supabase: SupabaseClient, // Add this parameter
  workout: Workout,
  user: UserResource
) => {
  const workouts = await loadWorkouts(supabase, user); // Pass supabase here
  const normalizedExercises = workout.exercises.map((newExercise) => {
    const normalizedName = normalizeExerciseName(newExercise.name);
    return {
      ...newExercise,
      name: normalizedName,
    };
  });

  const newWorkout = {
    ...workout,
    exercises: normalizedExercises,
  };

  await saveWorkouts(supabase, [...workouts, newWorkout], user); // Pass supabase here
};

// Get consolidated exercises
export const getConsolidatedExercises = async (
  supabase: SupabaseClient, // Add this parameter
  user: UserResource
): Promise<Exercise[]> => {
  const workouts = await loadWorkouts(supabase, user); // Pass supabase here
  const allExercises: Exercise[] = workouts.flatMap(
    (workout) => workout.exercises
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

// Remove a workout from the list
export const removeWorkoutFromList = async (
  supabase: SupabaseClient,
  workoutId: string,
  user: UserResource
) => {
  const { error } = await supabase
    .from("workouts")
    .delete()
    .eq("workout_name", workoutId)
    .eq("user_id", generateUserIdAsUuid(user.id));

  if (error) {
    console.error("Error deleting workout:", error);
    throw error;
  }
};

// Edit a workout
export const editWorkout = async (
  supabase: SupabaseClient, // Add this parameter
  workoutId: string,
  updatedWorkout: Workout,
  user: UserResource
) => {
  const workouts = await loadWorkouts(supabase, user); // Pass supabase here
  const workoutIndex = workouts.findIndex(
    (workout) => workout.workout_name === workoutId
  );

  if (workoutIndex !== -1) {
    workouts[workoutIndex] = { ...workouts[workoutIndex], ...updatedWorkout };
    await saveWorkouts(supabase, workouts, user); // Pass supabase here
  } else {
    console.warn(`Workout with ID ${workoutId} not found.`);
  }
};

// Remove an exercise from a workout
export const removeExerciseFromWorkout = async (
  supabase: SupabaseClient, // Add this parameter
  workoutId: string,
  exerciseName: string,
  user: UserResource
) => {
  const workouts = await loadWorkouts(supabase, user); // Pass supabase here
  const workout = workouts.find(
    (workout) => workout.workout_name === workoutId
  );

  if (workout) {
    workout.exercises = workout.exercises.filter(
      (exercise) =>
        normalizeExerciseName(exercise.name) !==
        normalizeExerciseName(exerciseName)
    );
    await saveWorkouts(supabase, workouts, user); // Pass supabase here
  } else {
    console.warn(`Workout with ID ${workoutId} not found.`);
  }
};

// Rearrange exercises within a workout
export const rearrangeExercisesInWorkout = async (
  supabase: SupabaseClient, // Add this parameter
  workoutId: string,
  newOrder: Exercise[],
  user: UserResource
) => {
  const workouts = await loadWorkouts(supabase, user); // Pass supabase here
  const workout = workouts.find(
    (workout) => workout.workout_name === workoutId
  );

  if (workout) {
    workout.exercises = newOrder;
    await saveWorkouts(supabase, workouts, user); // Pass supabase here
  } else {
    console.warn(`Workout with ID ${workoutId} not found.`);
  }
};

// Preload some default workouts for testing purposes
export const preloadWorkouts = async (
  supabase: SupabaseClient,
  user: UserResource
) => {
  // Check if the user already has workouts
  const { data: existingWorkouts, error: fetchError } = await supabase
    .from("workouts")
    .select("*")
    .eq("user_id", generateUserIdAsUuid(user.id));

  if (fetchError) {
    console.error("Error fetching existing workouts:", fetchError);
    throw fetchError;
  }

  // Don't overwrite existing workouts
  if (existingWorkouts && existingWorkouts.length > 0) return;

  const defaultWorkouts = [
    {
      workout_name: "FB1",
      assigned_days: ["2025-01-16"],
      exercises: [
        {
          name: "Chest-Supported Row",
          sets: [
            { weight: 415, reps: 9, rir: 0 },
            { weight: 320, reps: 10, rir: 0 },
          ],
          rir: 0,
          logs: [
            { date: "2025-01-16", weight: 415, reps: 10, rir: 0 },
            { date: "2025-01-10", weight: 320, reps: 10, rir: 0 },
          ],
        },
        {
          name: "Incline Medium Grip Bench Press",
          sets: [
            { weight: 290, reps: 10, rir: 0 },
            { weight: 225, reps: 10, rir: 0 },
          ],
          rir: 0,
          logs: [
            { date: "2025-01-16", weight: 290, reps: 10, rir: 0 },
            { date: "2025-01-10", weight: 225, reps: 10, rir: 0 },
          ],
        },
        {
          name: "Hip Adduction",
          sets: [
            { weight: 360, reps: 10, rir: 0 },
            { weight: 275, reps: 10, rir: 0 },
          ],
          rir: 0,
          logs: [
            { date: "2025-01-16", weight: 360, reps: 10, rir: 0 },
            { date: "2025-01-10", weight: 275, reps: 10, rir: 0 },
          ],
        },
        {
          name: "Cable Tricep Pushdown",
          sets: [
            { weight: 45, reps: 10, rir: 0 },
            { weight: 35, reps: 10, rir: 0 },
          ],
          rir: 0,
          logs: [
            { date: "2025-01-16", weight: 45, reps: 10, rir: 0 },
            { date: "2025-01-10", weight: 35, reps: 10, rir: 0 },
          ],
        },
        {
          name: "Leg extensions",
          sets: [
            { weight: 400, reps: 10, rir: 0 },
            { weight: 310, reps: 10, rir: 0 },
          ],
          rir: 0,
          logs: [
            { date: "2025-01-16", weight: 400, reps: 10, rir: 0 },
            { date: "2025-01-10", weight: 310, reps: 10, rir: 0 },
          ],
        },
        {
          name: "Machine lateral raises",
          sets: [
            { weight: 150, reps: 10, rir: 0 },
            { weight: 115, reps: 10, rir: 0 },
          ],
          rir: 0,
          logs: [
            { date: "2025-01-16", weight: 150, reps: 3, rir: 0 },
            { date: "2025-01-10", weight: 115, reps: 10, rir: 0 },
          ],
        },
        {
          name: "Kelso shrugs",
          sets: [
            { weight: 275, reps: 3, rir: 0 },
            { weight: 210, reps: 10, rir: 0 },
          ],
          rir: 0,
          logs: [
            { date: "2025-01-16", weight: 275, reps: 3, rir: 0 },
            { date: "2025-01-10", weight: 210, reps: 10, rir: 0 },
          ],
        },
      ],
    },
    {
      workout_name: "FB2",
      assigned_days: ["2025-01-16"],
      exercises: [
        {
          name: "Machine Hammer Curl",
          sets: [
            { weight: 155, reps: 3, rir: 0 },
            { weight: 120, reps: 10, rir: 0 },
          ],
          rir: 0,
          logs: [
            { date: "2025-01-16", weight: 155, reps: 3, rir: 0 },
            { date: "2025-01-10", weight: 120, reps: 10, rir: 0 },
          ],
        },
        {
          name: "Medium Grip Bench Press",
          sets: [
            { weight: 265, reps: 3, rir: 0 },
            { weight: 205, reps: 10, rir: 0 },
          ],
          rir: 0,
          logs: [
            { date: "2025-01-16", weight: 265, reps: 3, rir: 0 },
            { date: "2025-01-10", weight: 205, reps: 10, rir: 0 },
          ],
        },
        {
          name: "Stiff Legged Deadlift",
          sets: [
            { weight: 305, reps: 3, rir: 0 },
            { weight: 235, reps: 10, rir: 0 },
          ],
          rir: 0,
          logs: [
            { date: "2025-01-16", weight: 305, reps: 3, rir: 0 },
            { date: "2025-01-10", weight: 235, reps: 10, rir: 0 },
          ],
        },
        {
          name: "Normal Grip Pulldown",
          sets: [
            { weight: 210, reps: 3, rir: 0 },
            { weight: 160, reps: 10, rir: 0 },
          ],
          rir: 0,
          logs: [
            { date: "2025-01-16", weight: 210, reps: 3, rir: 0 },
            { date: "2025-01-10", weight: 160, reps: 10, rir: 0 },
          ],
        },
        {
          name: "Cable Tricep Pushdown",
          sets: [
            { weight: 45, reps: 3, rir: 0 },
            { weight: 35, reps: 10, rir: 0 },
          ],
          rir: 0,
          logs: [
            { date: "2025-01-16", weight: 45, reps: 3, rir: 0 },
            { date: "2025-01-10", weight: 35, reps: 10, rir: 0 },
          ],
        },
        {
          name: "Leg Press",
          sets: [
            { weight: 45, reps: 3, rir: 0 },
            { weight: 35, reps: 10, rir: 0 },
          ],
          rir: 0,
          logs: [
            { date: "2025-01-16", weight: 45, reps: 3, rir: 0 },
            { date: "2025-01-10", weight: 35, reps: 10, rir: 0 },
          ],
        },
        {
          name: "Behind the back cuff lat raises",
          sets: [
            { weight: 25, reps: 3, rir: 0 },
            { weight: 20, reps: 10, rir: 0 },
          ],
          rir: 0,
          logs: [
            { date: "2025-01-16", weight: 25, reps: 3, rir: 0 },
            { date: "2025-01-10", weight: 20, reps: 10, rir: 0 },
          ],
        },
      ],
    },
    {
      workout_name: "Upper",
      assigned_days: ["2025-01-16"],
      exercises: [
        {
          name: "Machine shoulder press",
          sets: [{ weight: 185, reps: 3, rir: 0 }],
          rir: 0,
          logs: [
            { date: "2025-01-16", weight: 185, reps: 7, rir: 0 },
            { date: "2025-01-10", weight: 185, reps: 7, rir: 0 },
          ],
        },
        {
          name: "Normal Grip Pulldown",
          sets: [{ weight: 195, reps: 3, rir: 0 }],
          rir: 0,
          logs: [
            { date: "2025-01-16", weight: 195, reps: 7, rir: 0 },
            { date: "2025-01-10", weight: 195, reps: 7, rir: 0 },
          ],
        },
        {
          name: "Machine bench press",
          sets: [{ weight: 245, reps: 3, rir: 0 }],
          rir: 0,
          logs: [
            { date: "2025-01-16", weight: 245, reps: 7, rir: 0 },
            { date: "2025-01-10", weight: 245, reps: 7, rir: 0 },
          ],
        },
        {
          name: "Smith Kelso Shrugs",
          sets: [
            { weight: 255, reps: 9, rir: 0 },
            { weight: 255, reps: 9, rir: 0 },
          ],
          rir: 0,
          logs: [
            { date: "2025-01-16", weight: 255, reps: 9, rir: 0 },
            { date: "2025-01-10", weight: 255, reps: 9, rir: 0 },
          ],
        },
        {
          name: "Cable Curl",
          sets: [{ weight: 35, reps: 3, rir: 0 }],
          rir: 0,
          logs: [
            { date: "2025-01-16", weight: 35, reps: 10, rir: 0 },
            { date: "2025-01-10", weight: 35, reps: 10, rir: 0 },
          ],
        },
        {
          name: "Smith jm press",
          sets: [{ weight: 105, reps: 3, rir: 0 }],
          rir: 0,
          logs: [
            { date: "2025-01-16", weight: 105, reps: 12, rir: 0 },
            { date: "2025-01-10", weight: 105, reps: 12, rir: 0 },
          ],
        },
      ],
    },
    {
      workout_name: "Lower",
      assigned_days: ["2025-01-16"],
      exercises: [
        {
          name: "Squat",
          sets: [
            { weight: 225, reps: 15, rir: 0 },
            { weight: 290, reps: 3, rir: 0 },
          ],
          rir: 0,
          logs: [
            { date: "2025-01-16", weight: 225, reps: 15, rir: 0 },
            { date: "2025-01-16", weight: 290, reps: 3, rir: 0 },
          ],
        },
        {
          name: "Seated Leg Curl",
          sets: [
            { weight: 175, reps: 15, rir: 0 },
            { weight: 230, reps: 3, rir: 0 },
          ],
          rir: 0,
          logs: [
            { date: "2025-01-16", weight: 175, reps: 15, rir: 0 },
            { date: "2025-01-16", weight: 230, reps: 3, rir: 0 },
          ],
        },
        {
          name: "Leg extensions",
          sets: [
            { weight: 260, reps: 10, rir: 0 },
            { weight: 340, reps: 3, rir: 0 },
          ],
          rir: 0,
          logs: [
            { date: "2025-01-16", weight: 260, reps: 10, rir: 0 },
            { date: "2025-01-16", weight: 340, reps: 3, rir: 0 },
          ],
        },
        {
          name: "Hip adduction machine",
          sets: [
            { weight: 225, reps: 3, rir: 0 },
            { weight: 295, reps: 3, rir: 0 },
          ],
          rir: 0,
          logs: [
            { date: "2025-01-16", weight: 225, reps: 3, rir: 0 },
            { date: "2025-01-16", weight: 295, reps: 3, rir: 0 },
          ],
        },
        {
          name: "Calf press",
          sets: [
            { weight: 290, reps: 12, rir: 0 },
            { weight: 375, reps: 3, rir: 0 },
          ],
          rir: 0,
          logs: [
            { date: "2025-01-16", weight: 290, reps: 12, rir: 0 },
            { date: "2025-01-16", weight: 375, reps: 3, rir: 0 },
          ],
        },
        {
          name: "Abs crunch machine",
          sets: [
            { weight: 15, reps: 15, rir: 0 },
            { weight: 20, reps: 3, rir: 0 },
          ],
          rir: 0,
          logs: [
            { date: "2025-01-16", weight: 15, reps: 15, rir: 0 },
            { date: "2025-01-16", weight: 20, reps: 3, rir: 0 },
          ],
        },
      ],
    },
  ];

  const { data, error } = await supabase.from("workouts").upsert(
    defaultWorkouts.map((workout) => ({
      ...workout,
      user_id: generateUserIdAsUuid(user.id),
      clerk_user_id: user.id,
    })),
    {
      onConflict: "user_id,workout_name",
    }
  );

  if (error) {
    console.error("Error saving default workouts:", error);
    throw error;
  }

  console.log("Default workouts preloaded:", data);
  return data;
};

// Reset workouts to preloaded state (for development use only)
export const resetWorkouts = async (
  supabase: SupabaseClient,
  user: UserResource
) => {
  // Delete all existing workouts for the user
  const { error: deleteError } = await supabase
    .from("workouts")
    .delete()
    .eq("user_id", generateUserIdAsUuid(user.id));

  if (deleteError) {
    console.error("Error deleting workouts:", deleteError);
    throw deleteError;
  }

  // Preload the default workouts
  await preloadWorkouts(supabase, user);
};
