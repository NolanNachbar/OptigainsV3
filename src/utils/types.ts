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
  id?: string;
  workout_name: string;
  assigned_days: string[];
  exercises: Exercise[];
  clerk_user_id: string;
  user_id?: string;
}
