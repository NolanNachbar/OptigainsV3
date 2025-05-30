// src/utils/types.ts
export interface Exercise {
  name: string;
  sets: WorkoutSet[];
  rir: number;
  logs?: ExerciseLog[];
}
export interface Set {
  weight: number;
  reps: number;
  rir: number;
  isLogged?: boolean;
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

export interface WorkoutTemplate {
  id?: string;
  workout_name: string;
  exercises: Exercise[];
  clerk_user_id: string;
  user_id?: string;
  created_at?: string;
}

export interface WorkoutInstance {
  id?: string;
  template_id: string;
  workout_name: string;
  scheduled_date: string;
  completed_at?: string;
  exercises: Exercise[];
  clerk_user_id: string;
  user_id?: string;
  created_at?: string;
}

// Keep the old Workout interface for backwards compatibility
export interface Workout {
  id?: string;
  workout_name: string;
  assigned_days: string[];
  exercises: Exercise[];
  clerk_user_id: string;
  user_id?: string;
}
