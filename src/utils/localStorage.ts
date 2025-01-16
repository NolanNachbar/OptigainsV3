// src/utils/localStorage.ts

import { Workout } from './types';

// Save workouts to local storage
export const saveWorkouts = (workouts: Workout[]) => {
  localStorage.setItem('workouts', JSON.stringify(workouts));
};

// Load workouts from local storage
export const loadWorkouts = (): Workout[] => {
  const workouts = localStorage.getItem('workouts');
  return workouts ? JSON.parse(workouts) : [];
};

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
