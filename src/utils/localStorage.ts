// src/utils/localStorage.js

import { Workout, Exercise } from './types';

// Save workouts to local storage
export const saveWorkouts = (workouts: Workout[]) => {
  localStorage.setItem('workouts', JSON.stringify(workouts));
};

// Load workouts from local storage
export const loadWorkouts = (): Workout[] => {
  const workouts = localStorage.getItem('workouts');
  return workouts ? JSON.parse(workouts) : [];
};

// Normalize exercise name to uppercase
export const normalizeExerciseName = (name: string) => name.toUpperCase();

// Assign a workout to a specific date
export const assignWorkoutToDate = (workoutId: string, date: string) => {
  const workouts = loadWorkouts();
  const workoutIndex = workouts.findIndex(workout => workout.workoutName === workoutId);

  if (workoutIndex !== -1) {
    if (!workouts[workoutIndex].assignedDays.includes(date)) {
      workouts[workoutIndex].assignedDays.push(date);
      saveWorkouts(workouts);
    }
  }
};

// Get the workouts assigned to a specific day
export const getWorkoutsForDate = (date: string): Workout[] => {
  const workouts = loadWorkouts();
  return workouts.filter(workout => workout.assignedDays.includes(date));
};

// Get the workout assigned for today
export const getWorkoutForToday = (today: string): Workout | null => {
  const workouts = loadWorkouts();
  const workout = workouts.find(workout => workout.assignedDays.includes(today));
  return workout || null;
};

// Remove a workout from a specific date
export const removeWorkoutFromDate = (workoutId: string, date: string) => {
  const workouts = loadWorkouts();
  const workoutIndex = workouts.findIndex(workout => workout.workoutName === workoutId);

  if (workoutIndex !== -1) {
    workouts[workoutIndex].assignedDays = workouts[workoutIndex].assignedDays.filter(d => d !== date);
    saveWorkouts(workouts);
  }
};
export const calculateNextWeight = (exercise: Exercise, reps: number, rir: number): number => {
    // Check if the exercise has logs
    if (!exercise.logs || exercise.logs.length === 0) {
      console.warn(`No logs available for exercise: ${exercise.name}`);
      return exercise.sets[0]?.weight ?? 0; // Return the initial set weight or 0 if not available
    }
  
    const lastLog = exercise.logs[exercise.logs.length - 1];
  
    // Check if the last log is valid
    if (!lastLog || typeof lastLog.weight === "undefined" || typeof lastLog.reps === "undefined" || typeof lastLog.rir === "undefined") {
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
    const result = isNaN(estimatedWeight) || estimatedWeight <= 0 ? lastLog.weight : estimatedWeight;
    return Math.round(result / 5)*5
};
  
  
  
  

export const addWorkoutWithNormalizedExercises = (workout: Workout) => {
  const workouts = loadWorkouts();
  const normalizedExercises = workout.exercises.map(newExercise => {
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
    const allExercises: Exercise[] = workouts.flatMap(workout => workout.exercises);
  
    const exerciseMap: { [key: string]: Exercise } = {};
  
    allExercises.forEach(exercise => {
      const normalizedName = normalizeExerciseName(exercise.name);
      if (!exerciseMap[normalizedName]) {
        exerciseMap[normalizedName] = { 
          ...exercise, 
          sets: [...exercise.sets], 
          logs: [...(exercise.logs || [])] // Ensure logs array exists and is not mutated
        };
      } else {
        // Merge logs and sets 
        exerciseMap[normalizedName].sets.push(...exercise.sets);
        exerciseMap[normalizedName].logs = [
          ...(exerciseMap[normalizedName].logs || []), 
          ...(exercise.logs || []) 
        ];
      }
    });
  
    return Object.values(exerciseMap);
  };
  

export const removeWorkoutFromList = (workoutId: string) => {
  const workouts = loadWorkouts();
  const updatedWorkouts = workouts.filter(workout => workout.workoutName !== workoutId);
  saveWorkouts(updatedWorkouts);
};

// Preload some default workouts for testing purposes
export const preloadWorkouts = () => {
    const existingWorkouts = loadWorkouts();
    if (existingWorkouts.length > 0) return; // Don't overwrite existing workouts
  
    const defaultWorkouts: Workout[] = [
      {
        workoutName: "Full Body",
        assignedDays: ["2025-01-16"],
        exercises: [
          {
            name: "BENCH PRESS",
            sets: [
              { weight: 130, reps: 10, rir: 3 },
              { weight: 125, reps: 10, rir: 3 },
            ],
            rir: 2,
            logs: [
              { date: "2025-01-15", weight: 130, reps: 10, rir: 3 },
              { date: "2025-01-10", weight: 125, reps: 10, rir: 3 },
            ],
          },
          {
            name: "SQUAT",
            sets: [
              { weight: 180, reps: 8, rir: 2 },
              { weight: 175, reps: 8, rir: 2 },
            ],
            rir: 1,
            logs: [
              { date: "2025-01-15", weight: 180, reps: 8, rir: 2 },
              { date: "2025-01-10", weight: 175, reps: 8, rir: 2 },
            ],
          },
        ],
      },
    ];
  
    saveWorkouts(defaultWorkouts); // Save default workouts if none exist
  };
  
    
    