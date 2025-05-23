// src/utils/types.ts
export interface Exercise {
  name: string;
  sets: WorkoutSet[];
  rir: number;
  logs?: ExerciseLog[];
}

export interface WorkoutSet {
  weight: number;
  reps: number;
  rir: number;
  isLogged?: boolean;
}

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
