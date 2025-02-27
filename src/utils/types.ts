// src/utils/types.ts
export interface Exercise {
  name: string;
  sets: Set[];
  rir: number;
  logs?: ExerciseLog[];
}

export type Set = {
  weight: number;
  reps: number;
  rir: number;
};

export type bodyWeight = {
  date: string;
  weight: number;
};

interface ExerciseLog {
  date: string;
  weight: number;
  reps: number;
  rir: number;
}

export interface Workout {
  Workout_name: string; // Match the column name in Supabase
  Assigned_days: string[]; // Match the column name in Supabase
  exercises: Exercise[];
  user_id?: string; // Optional, as it will be added by the save function
}
