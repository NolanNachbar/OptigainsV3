// src/utils/types.ts
export interface Exercise {
    name: string;
    sets: Set[];  // Change from number to Set[] to hold actual sets
    rir: number;
    logs?: ExerciseLog[];
  }
  
  export type Set = {
    weight: number;
    reps: number;
    rir: number;
  };
  
  interface ExerciseLog {
    date: string;
    weight: number;
    reps: number;
    rir: number;
  }
  
  export interface Workout {
    workoutName: string;
    workoutType?: string;
    exercises: Exercise[];
    assignedDays: string[];
  }
  