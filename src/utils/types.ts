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
  workoutName: string;
  workoutType?: string;
  exercises: Exercise[];
  assignedDays: string[];
}
