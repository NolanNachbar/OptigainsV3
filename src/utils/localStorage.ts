// src/utils/localStorage.js

import { Workout, Exercise, bodyWeight } from "./types";

// Save workouts to local storage
export const saveWorkouts = (workouts: Workout[]) => {
  localStorage.setItem("workouts", JSON.stringify(workouts));
};

// Load workouts from local storage
export const loadWorkouts = (): Workout[] => {
  const workouts = localStorage.getItem("workouts");
  return workouts ? JSON.parse(workouts) : [];
};

// Normalize exercise name to uppercase
export const normalizeExerciseName = (name: string) => name.toUpperCase();

// Assign a workout to a specific date
// src/utils/localStorage.js
export const assignWorkoutToDate = (workoutId: string, date: string) => {
  const workouts = loadWorkouts();
  const workoutIndex = workouts.findIndex(
    (workout) => workout.workout_name === workoutId
  );

  if (workoutIndex !== -1) {
    const workout = workouts[workoutIndex];
    // If workout is not already assigned to the day, add it
    if (!workout.assigned_days.includes(date)) {
      workout.assigned_days.push(date);
      saveWorkouts(workouts);
    }
  }
};

// Get the workouts assigned to a specific day
export const getWorkoutsForDate = (date: string): Workout[] => {
  const workouts = loadWorkouts();
  return workouts.filter((workout) => workout.assigned_days.includes(date));
};

// Get the workout assigned for today
export const getWorkoutForToday = (today: string): Workout | null => {
  const workouts = loadWorkouts();
  const workout = workouts.find((workout) =>
    workout.assigned_days.includes(today)
  );
  return workout || null;
};

// Remove a workout from a specific date
export const removeWorkoutFromDate = (workoutId: string, date: string) => {
  const workouts = loadWorkouts();
  const workoutIndex = workouts.findIndex(
    (workout) => workout.workout_name === workoutId
  );

  if (workoutIndex !== -1) {
    workouts[workoutIndex].assigned_days = workouts[
      workoutIndex
    ].assigned_days.filter((d) => d !== date);
    saveWorkouts(workouts);
  }
};

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

export const addWorkoutWithNormalizedExercises = (workout: Workout) => {
  const workouts = loadWorkouts();
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

  saveWorkouts([...workouts, newWorkout]);
};

export const getConsolidatedExercises = (): Exercise[] => {
  const workouts = loadWorkouts();
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

export const removeWorkoutFromList = (workoutId: string) => {
  const workouts = loadWorkouts();
  const updatedWorkouts = workouts.filter(
    (workout) => workout.workout_name !== workoutId
  );
  saveWorkouts(updatedWorkouts);
};

// Update workouts to support editing exercises and sets
export const editWorkout = (workoutId: string, updatedWorkout: Workout) => {
  const workouts = loadWorkouts();
  const workoutIndex = workouts.findIndex(
    (workout) => workout.workout_name === workoutId
  );

  if (workoutIndex !== -1) {
    workouts[workoutIndex] = { ...workouts[workoutIndex], ...updatedWorkout };
    saveWorkouts(workouts);
  } else {
    console.warn(`Workout with ID ${workoutId} not found.`);
  }
};

// Remove an exercise from a workout
export const removeExerciseFromWorkout = (
  workoutId: string,
  exerciseName: string
) => {
  const workouts = loadWorkouts();
  const workout = workouts.find(
    (workout) => workout.workout_name === workoutId
  );

  if (workout) {
    workout.exercises = workout.exercises.filter(
      (exercise) =>
        normalizeExerciseName(exercise.name) !==
        normalizeExerciseName(exerciseName)
    );
    saveWorkouts(workouts);
  } else {
    console.warn(`Workout with ID ${workoutId} not found.`);
  }
};

// Save weights to localStorage
export const saveWeights = (weights: bodyWeight[]) => {
  localStorage.setItem("weights", JSON.stringify(weights));
};

// Rearrange exercises within a workout
export const rearrangeExercisesInWorkout = (
  workoutId: string,
  newOrder: Exercise[]
) => {
  const workouts = loadWorkouts();
  const workout = workouts.find(
    (workout) => workout.workout_name === workoutId
  );

  if (workout) {
    workout.exercises = newOrder;
    saveWorkouts(workouts);
  } else {
    console.warn(`Workout with ID ${workoutId} not found.`);
  }
};

// // Preload some default workouts for testing purposes
// export const preloadWorkouts = () => {
//     const existingWorkouts = loadWorkouts();
//     if (existingWorkouts.length > 0) return; // Don't overwrite existing workouts

//     const defaultWorkouts: Workout[] = [
//       {
//         workout_name: "Full Body",
//         assigned_days: ["2025-01-16"],
//         exercises: [
//           {
//             name: "BENCH PRESS",
//             sets: [
//               { weight: 130, reps: 10, rir: 0 },
//               { weight: 125, reps: 10, rir: 0 },
//             ],
//             rir: 0,
//             logs: [
//               { date: "2025-01-15", weight: 130, reps: 10, rir: 0 },
//               { date: "2025-01-10", weight: 125, reps: 10, rir: 0 },
//             ],
//           },
//           {
//             name: "SQUAT",
//             sets: [
//               { weight: 180, reps: 8, rir: 0 },
//               { weight: 175, reps: 8, rir: 0 },
//             ],
//             rir: 1,
//             logs: [
//               { date: "2025-01-15", weight: 180, reps: 8, rir: 0 },
//               { date: "2025-01-10", weight: 175, reps: 8, rir: 0 },
//             ],
//           },
//         ],
//       },
//     ];

//     saveWorkouts(defaultWorkouts); // Save default workouts if none exist
//   };

// export const preloadWorkouts = () => {
//   const existingWorkouts = loadWorkouts();
//   if (existingWorkouts.length > 0) return; // Don't overwrite existing workouts

//   const defaultWorkouts: Workout[] = [
//     {
//       workout_name: "FB1",
//       assigned_days: ["2025-01-16"],
//       exercises: [
//         {
//           name: "Chest-Supported Row",
//           sets: [
//             { weight: 415, reps: 9, rir: 0 },
//             { weight: 320, reps: 10, rir: 0 },
//           ],
//           rir: 0,
//           logs: [
//             { date: "2025-01-16", weight: 415, reps: 10, rir: 0 },
//             { date: "2025-01-10", weight: 320, reps: 10, rir: 0 },
//           ],
//         },
//         {
//           name: "Incline Medium Grip Bench Press",
//           sets: [
//             { weight: 290, reps: 10, rir: 0 },
//             { weight: 225, reps: 10, rir: 0 },
//           ],
//           rir: 0,
//           logs: [
//             { date: "2025-01-16", weight: 290, reps: 10, rir: 0 },
//             { date: "2025-01-10", weight: 225, reps: 10, rir: 0 },
//           ],
//         },
//         {
//           name: "Hip Adduction",
//           sets: [
//             { weight: 360, reps: 10, rir: 0 },
//             { weight: 275, reps: 10, rir: 0 },
//           ],
//           rir: 0,
//           logs: [
//             { date: "2025-01-16", weight: 360, reps: 10, rir: 0 },
//             { date: "2025-01-10", weight: 275, reps: 10, rir: 0 },
//           ],
//         },
//         {
//           name: "Cable Tricep Pushdown",
//           sets: [
//             { weight: 45, reps: 10, rir: 0 },
//             { weight: 35, reps: 10, rir: 0 },
//           ],
//           rir: 0,
//           logs: [
//             { date: "2025-01-16", weight: 45, reps: 10, rir: 0 },
//             { date: "2025-01-10", weight: 35, reps: 10, rir: 0 },
//           ],
//         },
//         {
//           name: "Leg extensions",
//           sets: [
//             { weight: 400, reps: 10, rir: 0 },
//             { weight: 310, reps: 10, rir: 0 },
//           ],
//           rir: 0,
//           logs: [
//             { date: "2025-01-16", weight: 400, reps: 10, rir: 0 },
//             { date: "2025-01-10", weight: 310, reps: 10, rir: 0 },
//           ],
//         },
//         {
//           name: "Machine lateral raises",
//           sets: [
//             { weight: 150, reps: 10, rir: 0 },
//             { weight: 115, reps: 10, rir: 0 },
//           ],
//           rir: 0,
//           logs: [
//             { date: "2025-01-16", weight: 150, reps: 3, rir: 0 },
//             { date: "2025-01-10", weight: 115, reps: 10, rir: 0 },
//           ],
//         },
//         {
//           name: "Kelso shrugs",
//           sets: [
//             { weight: 275, reps: 3, rir: 0 },
//             { weight: 210, reps: 10, rir: 0 },
//           ],
//           rir: 0,
//           logs: [
//             { date: "2025-01-16", weight: 275, reps: 3, rir: 0 },
//             { date: "2025-01-10", weight: 210, reps: 10, rir: 0 },
//           ],
//         },
//       ],
//     },
//     {
//       workout_name: "FB2",
//       assigned_days: ["2025-01-16"],
//       exercises: [
//         {
//           name: "Machine Hammer Curl",
//           sets: [
//             { weight: 155, reps: 3, rir: 0 },
//             { weight: 120, reps: 10, rir: 0 },
//           ],
//           rir: 0,
//           logs: [
//             { date: "2025-01-16", weight: 155, reps: 3, rir: 0 },
//             { date: "2025-01-10", weight: 120, reps: 10, rir: 0 },
//           ],
//         },
//         {
//           name: "Medium Grip Bench Press",
//           sets: [
//             { weight: 265, reps: 3, rir: 0 },
//             { weight: 205, reps: 10, rir: 0 },
//           ],
//           rir: 0,
//           logs: [
//             { date: "2025-01-16", weight: 265, reps: 3, rir: 0 },
//             { date: "2025-01-10", weight: 205, reps: 10, rir: 0 },
//           ],
//         },
//         {
//           name: "Stiff Legged Deadlift",
//           sets: [
//             { weight: 305, reps: 3, rir: 0 },
//             { weight: 235, reps: 10, rir: 0 },
//           ],
//           rir: 0,
//           logs: [
//             { date: "2025-01-16", weight: 305, reps: 3, rir: 0 },
//             { date: "2025-01-10", weight: 235, reps: 10, rir: 0 },
//           ],
//         },
//         {
//           name: "Normal Grip Pulldown",
//           sets: [
//             { weight: 210, reps: 3, rir: 0 },
//             { weight: 160, reps: 10, rir: 0 },
//           ],
//           rir: 0,
//           logs: [
//             { date: "2025-01-16", weight: 210, reps: 3, rir: 0 },
//             { date: "2025-01-10", weight: 160, reps: 10, rir: 0 },
//           ],
//         },
//         {
//           name: "Cable Tricep Pushdown",
//           sets: [
//             { weight: 45, reps: 3, rir: 0 },
//             { weight: 35, reps: 10, rir: 0 },
//           ],
//           rir: 0,
//           logs: [
//             { date: "2025-01-16", weight: 45, reps: 3, rir: 0 },
//             { date: "2025-01-10", weight: 35, reps: 10, rir: 0 },
//           ],
//         },
//         {
//           name: "Leg Press",
//           sets: [
//             { weight: 45, reps: 3, rir: 0 },
//             { weight: 35, reps: 10, rir: 0 },
//           ],
//           rir: 0,
//           logs: [
//             { date: "2025-01-16", weight: 45, reps: 3, rir: 0 },
//             { date: "2025-01-10", weight: 35, reps: 10, rir: 0 },
//           ],
//         },
//         {
//           name: "Behind the back cuff lat raises",
//           sets: [
//             { weight: 25, reps: 3, rir: 0 },
//             { weight: 20, reps: 10, rir: 0 },
//           ],
//           rir: 0,
//           logs: [
//             { date: "2025-01-16", weight: 25, reps: 3, rir: 0 },
//             { date: "2025-01-10", weight: 20, reps: 10, rir: 0 },
//           ],
//         },
//       ],
//     },
//     {
//       workout_name: "Upper",
//       assigned_days: ["2025-01-16"],
//       exercises: [
//         {
//           name: "Machine shoulder press",
//           sets: [
//             { weight: 250, reps: 3, rir: 0 },
//             { weight: 195, reps: 10, rir: 0 },
//           ],
//           rir: 0,
//           logs: [
//             { date: "2025-01-16", weight: 250, reps: 3, rir: 0 },
//             { date: "2025-01-10", weight: 195, reps: 10, rir: 0 },
//           ],
//         },
//         {
//           name: "Normal Grip Pulldown",
//           sets: [
//             { weight: 230, reps: 3, rir: 0 },
//             { weight: 175, reps: 10, rir: 0 },
//           ],
//           rir: 0,
//           logs: [
//             { date: "2025-01-16", weight: 230, reps: 3, rir: 0 },
//             { date: "2025-01-10", weight: 175, reps: 10, rir: 0 },
//           ],
//         },
//         {
//           name: "Machine Curls",
//           sets: [
//             { weight: 145, reps: 3, rir: 0 },
//             { weight: 110, reps: 10, rir: 0 },
//           ],
//           rir: 0,
//           logs: [
//             { date: "2025-01-16", weight: 145, reps: 3, rir: 0 },
//             { date: "2025-01-10", weight: 110, reps: 10, rir: 0 },
//           ],
//         },
//         {
//           name: "Leg Press",
//           sets: [
//             { weight: 750, reps: 3, rir: 0 },
//             { weight: 585, reps: 10, rir: 0 },
//           ],
//           rir: 0,
//           logs: [
//             { date: "2025-01-16", weight: 750, reps: 3, rir: 0 },
//             { date: "2025-01-10", weight: 585, reps: 10, rir: 0 },
//           ],
//         },
//       ],
//     },
//     {
//       workout_name: "Lower",
//       assigned_days: ["2025-01-16"],
//       exercises: [
//         {
//           name: "Squat",
//           sets: [
//             { weight: 225, reps: 15, rir: 0 },
//             { weight: 290, reps: 3, rir: 0 },
//           ],
//           rir: 0,
//           logs: [
//             { date: "2025-01-16", weight: 225, reps: 15, rir: 0 },
//             { date: "2025-01-16", weight: 290, reps: 3, rir: 0 },
//           ],
//         },
//         {
//           name: "Seated Leg Curl",
//           sets: [
//             { weight: 175, reps: 15, rir: 0 },
//             { weight: 230, reps: 3, rir: 0 },
//           ],
//           rir: 0,
//           logs: [
//             { date: "2025-01-16", weight: 175, reps: 15, rir: 0 },
//             { date: "2025-01-16", weight: 230, reps: 3, rir: 0 },
//           ],
//         },
//         {
//           name: "Leg extensions",
//           sets: [
//             { weight: 260, reps: 10, rir: 0 },
//             { weight: 340, reps: 3, rir: 0 },
//           ],
//           rir: 0,
//           logs: [
//             { date: "2025-01-16", weight: 260, reps: 10, rir: 0 },
//             { date: "2025-01-16", weight: 340, reps: 3, rir: 0 },
//           ],
//         },
//         {
//           name: "Sus-machine",
//           sets: [
//             { weight: 225, reps: 3, rir: 0 },
//             { weight: 295, reps: 3, rir: 0 },
//           ],
//           rir: 0,
//           logs: [
//             { date: "2025-01-16", weight: 225, reps: 3, rir: 0 },
//             { date: "2025-01-16", weight: 295, reps: 3, rir: 0 },
//           ],
//         },
//         {
//           name: "Calf press",
//           sets: [
//             { weight: 290, reps: 12, rir: 0 },
//             { weight: 375, reps: 3, rir: 0 },
//           ],
//           rir: 0,
//           logs: [
//             { date: "2025-01-16", weight: 290, reps: 12, rir: 0 },
//             { date: "2025-01-16", weight: 375, reps: 3, rir: 0 },
//           ],
//         },
//         {
//           name: "Abs crunch machine",
//           sets: [
//             { weight: 15, reps: 15, rir: 0 },
//             { weight: 20, reps: 3, rir: 0 },
//           ],
//           rir: 0,
//           logs: [
//             { date: "2025-01-16", weight: 15, reps: 15, rir: 0 },
//             { date: "2025-01-16", weight: 20, reps: 3, rir: 0 },
//           ],
//         },
//       ],
//     },
//   ];

//   saveWorkouts(defaultWorkouts);
// };
