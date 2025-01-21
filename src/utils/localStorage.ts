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

// Add logging to each exercise in the workout
export const calculateNextWeight = (exercise: Exercise, reps: number, rir: number): number => {
  const lastLog = exercise.logs && exercise.logs.length > 0 ? exercise.logs[exercise.logs.length - 1] : null;
  const performance = reps + rir;

  // Assuming we calculate based on the last set
  if (lastLog) {
    const performanceDifference = performance - (lastLog.reps + lastLog.rir);
    if (performanceDifference > 1) {
      return lastLog.weight + 2.5; // Increment weight if performance improved
    } else if (performanceDifference < -1) {
      return Math.max(0, lastLog.weight - 2.5); // Decrement weight if performance decreased
    }
  }

  return exercise.sets[0]?.weight ?? 0; // Default to first set weight if no previous logs
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
  
    
    