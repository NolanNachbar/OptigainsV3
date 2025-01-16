// src/utils/types.ts

export interface Exercise {
    name: string;
    sets: number;
    reps: string;
    rir: number;
  }
  
  export interface Workout {
    workoutName: string;
    workoutType?: string; // Optional (e.g., Push/Pull)
    exercises: Exercise[];
    //id: string; // Unique ID for each workout
    assignedDays: string[]; // Array to store dates the workout is assigned to
  }
  