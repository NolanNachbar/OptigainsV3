// src/utils/types.ts
export * from './types';

export interface Exercise {
  name: string;
  sets: WorkoutSet[];
  rir: number;
  logs?: ExerciseLog[];
}

export type Set = {
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

// Bodybuilding-specific types
export type MuscleGroup = 
  | 'Chest' 
  | 'Back' 
  | 'Shoulders' 
  | 'Biceps' 
  | 'Triceps' 
  | 'Forearms'
  | 'Quadriceps' 
  | 'Hamstrings' 
  | 'Calves' 
  | 'Glutes'
  | 'Abs' 
  | 'Core';

export type TrainingPhase = 'Hypertrophy' | 'Strength' | 'Power';
export type TrainingSplit = 'PPL' | 'Upper/Lower' | 'Full Body' | 'Full Body/Upper/Lower';
export type VolumeLevel = 'Low' | 'Moderate' | 'High';
export type Priority = 'High' | 'Moderate' | 'Maintenance';

export interface TrainingBlock {
  id: string;
  name: string;
  startDate: string;
  duration: number; // weeks
  currentWeek: number;
  trainingDaysPerWeek: number;
  split: string; // More flexible - can be 'PPL', 'Upper/Lower', 'Custom', etc.
  notes?: string;
  isActive?: boolean;
  phase?: TrainingPhase;
  volumeLevel?: VolumeLevel;
  intensityRange?: [number, number];
  deloadWeek?: number;
  workoutRotation?: string[];
}

export interface VolumeTarget {
  muscleGroup: MuscleGroup;
  weeklySetTarget: number;
  frequency: number; // times per week
  priority: Priority;
  currentVolume?: number;
}

export interface MuscleGroupVolume {
  muscleGroup: MuscleGroup;
  sets: number;
  lastTrained?: string;
  frequency: number;
  weeklyTarget: number;
}

export interface ExerciseMuscleMapping {
  exerciseName: string;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  setsContribution: number; // 0.5 for secondary, 1.0 for primary
}
