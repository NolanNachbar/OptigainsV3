// src/utils/SupaBase.ts

import { Workout, Exercise, bodyWeight } from "./types";
import { supabase } from "./supabaseClient"; // Import the Supabase client
import { UserResource } from "@clerk/types"; // Import UserResource instead of User
// Save workouts to Supabase
export const saveWorkouts = async (workouts: Workout[], user: UserResource) => {
  const { data, error } = await supabase.from("workouts").upsert(
    workouts.map((workout) => ({
      ...workout,
      user_id: user.id, // Associate the workout with the user
    }))
  );

  if (error) {
    console.error("Error saving workouts:", error);
    throw error;
  }

  return data;
};

// Load workouts from Supabase
export const loadWorkouts = async (user: UserResource): Promise<Workout[]> => {
  const { data, error } = await supabase
    .from("workouts")
    .select("*")
    .eq("user_id", user.id);

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
  workoutId: string,
  date: string,
  user: UserResource
) => {
  const workouts = await loadWorkouts(user);
  const workoutIndex = workouts.findIndex(
    (workout) => workout.workoutName === workoutId
  );

  if (workoutIndex !== -1) {
    const workout = workouts[workoutIndex];
    // If workout is not already assigned to the day, add it
    if (!workout.assignedDays.includes(date)) {
      workout.assignedDays.push(date);
      await saveWorkouts(workouts, user);
    }
  }
};

// Get the workouts assigned to a specific day
export const getWorkoutsForDate = async (
  date: string,
  user: UserResource
): Promise<Workout[]> => {
  const workouts = await loadWorkouts(user);
  return workouts.filter((workout) => workout.assignedDays.includes(date));
};

// Get the workout assigned for today
export const getWorkoutForToday = async (
  today: string,
  user: UserResource
): Promise<Workout | null> => {
  const workouts = await loadWorkouts(user);
  const workout = workouts.find((workout) =>
    workout.assignedDays.includes(today)
  );
  return workout || null;
};

// Remove a workout from a specific date
export const removeWorkoutFromDate = async (
  workoutId: string,
  date: string,
  user: UserResource
) => {
  const workouts = await loadWorkouts(user);
  const workoutIndex = workouts.findIndex(
    (workout) => workout.workoutName === workoutId
  );

  if (workoutIndex !== -1) {
    workouts[workoutIndex].assignedDays = workouts[
      workoutIndex
    ].assignedDays.filter((d) => d !== date);
    await saveWorkouts(workouts, user);
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
  rir: number
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
  return Math.round(result / 5) * 5;
};

// Add a workout with normalized exercises
export const addWorkoutWithNormalizedExercises = async (
  workout: Workout,
  user: UserResource
) => {
  const workouts = await loadWorkouts(user);
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

  await saveWorkouts([...workouts, newWorkout], user);
};

// Get consolidated exercises
export const getConsolidatedExercises = async (
  user: UserResource
): Promise<Exercise[]> => {
  const workouts = await loadWorkouts(user);
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
        logs: [...(exercise.logs || [])], // Ensure logs array exists and is not mutated
      };
    } else {
      // Merge logs and sets
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
  workoutId: string,
  user: UserResource
) => {
  const workouts = await loadWorkouts(user);
  const updatedWorkouts = workouts.filter(
    (workout) => workout.workoutName !== workoutId
  );
  await saveWorkouts(updatedWorkouts, user);
};

// Edit a workout
export const editWorkout = async (
  workoutId: string,
  updatedWorkout: Workout,
  user: UserResource
) => {
  const workouts = await loadWorkouts(user);
  const workoutIndex = workouts.findIndex(
    (workout) => workout.workoutName === workoutId
  );

  if (workoutIndex !== -1) {
    workouts[workoutIndex] = { ...workouts[workoutIndex], ...updatedWorkout };
    await saveWorkouts(workouts, user);
  } else {
    console.warn(`Workout with ID ${workoutId} not found.`);
  }
};

// Remove an exercise from a workout
export const removeExerciseFromWorkout = async (
  workoutId: string,
  exerciseName: string,
  user: UserResource
) => {
  const workouts = await loadWorkouts(user);
  const workout = workouts.find((workout) => workout.workoutName === workoutId);

  if (workout) {
    workout.exercises = workout.exercises.filter(
      (exercise) =>
        normalizeExerciseName(exercise.name) !==
        normalizeExerciseName(exerciseName)
    );
    await saveWorkouts(workouts, user);
  } else {
    console.warn(`Workout with ID ${workoutId} not found.`);
  }
};

// Save weights to Supabase
export const saveWeights = async (
  weights: bodyWeight[],
  user: UserResource
) => {
  if (!user) throw new Error("User not authenticated");

  const { data, error } = await supabase.from("weights").upsert(
    weights.map((weight) => ({
      ...weight,
      user_id: user.id, // Associate the weight with the user
    }))
  );

  if (error) {
    console.error("Error saving weights:", error);
    throw error;
  }

  return data;
};

// Rearrange exercises within a workout
export const rearrangeExercisesInWorkout = async (
  workoutId: string,
  newOrder: Exercise[],
  user: UserResource
) => {
  const workouts = await loadWorkouts(user);
  const workout = workouts.find((workout) => workout.workoutName === workoutId);

  if (workout) {
    workout.exercises = newOrder;
    await saveWorkouts(workouts, user);
  } else {
    console.warn(`Workout with ID ${workoutId} not found.`);
  }
};

// // Preload some default workouts for testing purposes
// export const preloadWorkouts = async (user: UserResource) => {
//   // Check if the user already has workouts
//   const { data: existingWorkouts, error: fetchError } = await supabase
//     .from("workouts")
//     .select("*")
//     .eq("user_id", user.id);

//   if (fetchError) {
//     console.error("Error fetching existing workouts:", fetchError);
//     throw fetchError;
//   }

//   // Don't overwrite existing workouts
//   if (existingWorkouts && existingWorkouts.length > 0) return;

//   // Define default workouts
//   const defaultWorkouts: Workout[] = [
//     {
//       workoutName: "Full Body",
//       assignedDays: ["2025-01-16"],
//       exercises: [
//         {
//           name: "BENCH PRESS",
//           sets: [
//             { weight: 130, reps: 10, rir: 0 },
//             { weight: 125, reps: 10, rir: 0 },
//           ],
//           rir: 0,
//           logs: [
//             { date: "2025-01-15", weight: 130, reps: 10, rir: 0 },
//             { date: "2025-01-10", weight: 125, reps: 10, rir: 0 },
//           ],
//         },
//         {
//           name: "SQUAT",
//           sets: [
//             { weight: 180, reps: 8, rir: 0 },
//             { weight: 175, reps: 8, rir: 0 },
//           ],
//           rir: 1,
//           logs: [
//             { date: "2025-01-15", weight: 180, reps: 8, rir: 0 },
//             { date: "2025-01-10", weight: 175, reps: 8, rir: 0 },
//           ],
//         },
//       ],
//     },
//   ];

//   // Save default workouts to Supabase
//   const { data, error } = await supabase.from("workouts").insert(
//     defaultWorkouts.map((workout) => ({
//       ...workout,
//       user_id: user.id, // Associate the workout with the user
//     }))
//   );

//   if (error) {
//     console.error("Error saving default workouts:", error);
//     throw error;
//   }

//   console.log("Default workouts preloaded:", data);
// };

// Preload some default workouts for testing purposes
export const preloadWorkouts = async (user: UserResource) => {
  // Check if the user already has workouts
  const { data: existingWorkouts, error: fetchError } = await supabase
    .from("workouts")
    .select("*")
    .eq("user_id", user.id);

  if (fetchError) {
    console.error("Error fetching existing workouts:", fetchError);
    throw fetchError;
  }

  // Don't overwrite existing workouts
  if (existingWorkouts && existingWorkouts.length > 0) return;

  const defaultWorkouts: Workout[] = [
    {
      workoutName: "FB1",
      assignedDays: ["2025-01-16"],
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
      workoutName: "FB2",
      assignedDays: ["2025-01-16"],
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
      workoutName: "Upper",
      assignedDays: ["2025-01-16"],
      exercises: [
        {
          name: "Machine shoulder press",
          sets: [
            { weight: 250, reps: 3, rir: 0 },
            { weight: 195, reps: 10, rir: 0 },
          ],
          rir: 0,
          logs: [
            { date: "2025-01-16", weight: 250, reps: 3, rir: 0 },
            { date: "2025-01-10", weight: 195, reps: 10, rir: 0 },
          ],
        },
        {
          name: "Normal Grip Pulldown",
          sets: [
            { weight: 230, reps: 3, rir: 0 },
            { weight: 175, reps: 10, rir: 0 },
          ],
          rir: 0,
          logs: [
            { date: "2025-01-16", weight: 230, reps: 3, rir: 0 },
            { date: "2025-01-10", weight: 175, reps: 10, rir: 0 },
          ],
        },
        {
          name: "Machine Curls",
          sets: [
            { weight: 145, reps: 3, rir: 0 },
            { weight: 110, reps: 10, rir: 0 },
          ],
          rir: 0,
          logs: [
            { date: "2025-01-16", weight: 145, reps: 3, rir: 0 },
            { date: "2025-01-10", weight: 110, reps: 10, rir: 0 },
          ],
        },
        {
          name: "Leg Press",
          sets: [
            { weight: 750, reps: 3, rir: 0 },
            { weight: 585, reps: 10, rir: 0 },
          ],
          rir: 0,
          logs: [
            { date: "2025-01-16", weight: 750, reps: 3, rir: 0 },
            { date: "2025-01-10", weight: 585, reps: 10, rir: 0 },
          ],
        },
      ],
    },
    {
      workoutName: "Lower",
      assignedDays: ["2025-01-16"],
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
          name: "Sus-machine",
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

  // Save default workouts to Supabase
  const { data, error } = await supabase.from("workouts").insert(
    defaultWorkouts.map((workout) => ({
      ...workout,
      user_id: user.id, // Associate the workout with the user
    }))
  );

  if (error) {
    console.error("Error saving default workouts:", error);
    throw error;
  }

  console.log("Default workouts preloaded:", data);
};
