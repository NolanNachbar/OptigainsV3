import { TrainingBlock, MuscleGroup, ExerciseMuscleMapping, MuscleGroupVolume, VolumeTarget, Workout } from './types';
import { v4 as uuidv4 } from 'uuid';

// Exercise-to-muscle mapping database
export const EXERCISE_MUSCLE_MAPPING: ExerciseMuscleMapping[] = [
  // Horizontal Push
  { exerciseName: 'MEDIUM GRIP BENCH PRESS', primaryMuscles: ['Chest'], secondaryMuscles: ['Triceps', 'Shoulders'], setsContribution: 1.0 },
  { exerciseName: 'CLOSE GRIP BENCH PRESS', primaryMuscles: ['Triceps'], secondaryMuscles: ['Chest'], setsContribution: 1.0 },
  { exerciseName: 'WIDE GRIP BENCH PRESS', primaryMuscles: ['Chest'], secondaryMuscles: ['Triceps', 'Shoulders'], setsContribution: 1.0 },
  { exerciseName: 'MACHINE BENCH PRESS', primaryMuscles: ['Chest'], secondaryMuscles: ['Triceps', 'Shoulders'], setsContribution: 1.0 },
  { exerciseName: 'CLOSE GRIP PUSHUP', primaryMuscles: ['Triceps'], secondaryMuscles: ['Chest'], setsContribution: 1.0 },
  { exerciseName: 'FLAT DUMBBELL PRESS', primaryMuscles: ['Chest'], secondaryMuscles: ['Triceps', 'Shoulders'], setsContribution: 1.0 },
  { exerciseName: 'LOW INCLINE DUMBBELL PRESS', primaryMuscles: ['Chest'], secondaryMuscles: ['Triceps', 'Shoulders'], setsContribution: 1.0 },
  { exerciseName: 'PUSHUP FROM KNEE', primaryMuscles: ['Chest'], secondaryMuscles: ['Triceps', 'Shoulders'], setsContribution: 1.0 },
  { exerciseName: 'PUSHUP', primaryMuscles: ['Chest'], secondaryMuscles: ['Triceps', 'Shoulders'], setsContribution: 1.0 },
  { exerciseName: 'PEC DECK', primaryMuscles: ['Chest'], secondaryMuscles: [], setsContribution: 1.0 },
  { exerciseName: 'CONVERGING MACHINE PRESS', primaryMuscles: ['Chest'], secondaryMuscles: ['Triceps', 'Shoulders'], setsContribution: 1.0 },

  // Vertical Push
  { exerciseName: 'INCLINE MEDIUM GRIP BENCH PRESS', primaryMuscles: ['Chest'], secondaryMuscles: ['Triceps', 'Shoulders'], setsContribution: 1.0 },
  { exerciseName: 'INCLINE CLOSE GRIP BENCH PRESS', primaryMuscles: ['Triceps'], secondaryMuscles: ['Chest', 'Shoulders'], setsContribution: 1.0 },
  { exerciseName: 'INCLINE WIDE GRIP BENCH PRESS', primaryMuscles: ['Chest'], secondaryMuscles: ['Triceps', 'Shoulders'], setsContribution: 1.0 },
  { exerciseName: 'STANDING BARBELL SHOULDER PRESS', primaryMuscles: ['Shoulders'], secondaryMuscles: ['Triceps', 'Core'], setsContribution: 1.0 },
  { exerciseName: 'STANDING DUMBBELL SHOULDER PRESS', primaryMuscles: ['Shoulders'], secondaryMuscles: ['Triceps', 'Core'], setsContribution: 1.0 },
  { exerciseName: 'SEATED BARBELL SHOULDER PRESS', primaryMuscles: ['Shoulders'], secondaryMuscles: ['Triceps'], setsContribution: 1.0 },
  { exerciseName: 'SEATED DUMBBELL SHOULDER PRESS', primaryMuscles: ['Shoulders'], secondaryMuscles: ['Triceps'], setsContribution: 1.0 },
  { exerciseName: 'INCLINE DUMBBELL PRESS', primaryMuscles: ['Chest'], secondaryMuscles: ['Triceps', 'Shoulders'], setsContribution: 1.0 },
  { exerciseName: 'HIGH INCLINE DUMBBELL BENCH PRESS', primaryMuscles: ['Shoulders'], secondaryMuscles: ['Triceps', 'Chest'], setsContribution: 1.0 },
  { exerciseName: 'MACHINE SHOULDER PRESS', primaryMuscles: ['Shoulders'], secondaryMuscles: ['Triceps'], setsContribution: 1.0 },

  // Horizontal Pull
  { exerciseName: 'BARBELL BENT-ROW', primaryMuscles: ['Back'], secondaryMuscles: ['Biceps'], setsContribution: 1.0 },
  { exerciseName: 'UNDERHAND EZ ROW', primaryMuscles: ['Back'], secondaryMuscles: ['Biceps'], setsContribution: 1.0 },
  { exerciseName: '2-ARM DUMBBELL ROW', primaryMuscles: ['Back'], secondaryMuscles: ['Biceps'], setsContribution: 1.0 },
  { exerciseName: 'ROW TO CHEST', primaryMuscles: ['Back'], secondaryMuscles: ['Biceps'], setsContribution: 1.0 },
  { exerciseName: 'CHEST-SUPPORTED ROW', primaryMuscles: ['Back'], secondaryMuscles: ['Biceps'], setsContribution: 1.0 },
  { exerciseName: '1-ARM DUMBBELL ROW', primaryMuscles: ['Back'], secondaryMuscles: ['Biceps'], setsContribution: 1.0 },

  // Vertical Pull
  { exerciseName: 'OVERHAND PULLUP', primaryMuscles: ['Back'], secondaryMuscles: ['Biceps'], setsContribution: 1.0 },
  { exerciseName: 'PARALLEL PULLUPS', primaryMuscles: ['Back'], secondaryMuscles: ['Biceps'], setsContribution: 1.0 },
  { exerciseName: 'UNDERHAND PULLUPS', primaryMuscles: ['Back'], secondaryMuscles: ['Biceps'], setsContribution: 1.0 },
  { exerciseName: 'WIDE GRIP PULLUP', primaryMuscles: ['Back'], secondaryMuscles: ['Biceps'], setsContribution: 1.0 },
  { exerciseName: 'ASSISTED OVERHAND PULLUPS', primaryMuscles: ['Back'], secondaryMuscles: ['Biceps'], setsContribution: 1.0 },
  { exerciseName: 'ASSISTED PARALLEL PULLUPS', primaryMuscles: ['Back'], secondaryMuscles: ['Biceps'], setsContribution: 1.0 },
  { exerciseName: 'ASSISTED UNDERHAND PULLUPS', primaryMuscles: ['Back'], secondaryMuscles: ['Biceps'], setsContribution: 1.0 },
  { exerciseName: 'NORMAL GRIP PULLDOWN', primaryMuscles: ['Back'], secondaryMuscles: ['Biceps'], setsContribution: 1.0 },
  { exerciseName: 'WIDE-GRIP PULLDOWN', primaryMuscles: ['Back'], secondaryMuscles: ['Biceps'], setsContribution: 1.0 },
  { exerciseName: 'UNDERHAND PULLDOWNS', primaryMuscles: ['Back'], secondaryMuscles: ['Biceps'], setsContribution: 1.0 },
  { exerciseName: 'PARALLEL PULLDOWNS', primaryMuscles: ['Back'], secondaryMuscles: ['Biceps'], setsContribution: 1.0 },
  { exerciseName: 'NARROW GRIP PULLDOWN', primaryMuscles: ['Back'], secondaryMuscles: ['Biceps'], setsContribution: 1.0 },
  { exerciseName: 'NORMAL GRIP LAT PULLDOWN', primaryMuscles: ['Back'], secondaryMuscles: ['Biceps'], setsContribution: 1.0 },
  { exerciseName: 'WIDE GRIP LAT PULLDOWN', primaryMuscles: ['Back'], secondaryMuscles: ['Biceps'], setsContribution: 1.0 },

  // Rear/Medial Delts
  { exerciseName: 'BARBELL UPRIGHT ROW', primaryMuscles: ['Shoulders'], secondaryMuscles: ['Back'], setsContribution: 1.0 },
  { exerciseName: 'BEHIND THE BACK CUFF LAT RAISES', primaryMuscles: ['Shoulders'], secondaryMuscles: [], setsContribution: 1.0 },
  { exerciseName: 'MACHINE LATERAL RAISES', primaryMuscles: ['Shoulders'], secondaryMuscles: [], setsContribution: 1.0 },
  { exerciseName: 'DUMBBELL UPRIGHT ROW', primaryMuscles: ['Shoulders'], secondaryMuscles: ['Back'], setsContribution: 1.0 },
  { exerciseName: 'DUMBBELL SIDE LATERAL RAISE', primaryMuscles: ['Shoulders'], secondaryMuscles: [], setsContribution: 1.0 },
  { exerciseName: 'CABLE UPRIGHT ROW', primaryMuscles: ['Shoulders'], secondaryMuscles: ['Back'], setsContribution: 1.0 },
  { exerciseName: 'CABLE FACE PULL', primaryMuscles: ['Shoulders'], secondaryMuscles: ['Back'], setsContribution: 1.0 },
  { exerciseName: 'DUMBBELL REAR LATERAL RAISE', primaryMuscles: ['Shoulders'], secondaryMuscles: ['Back'], setsContribution: 1.0 },
  { exerciseName: 'BARBELL FACEPULL', primaryMuscles: ['Shoulders'], secondaryMuscles: ['Back'], setsContribution: 1.0 },

  // Horizontal Triceps
  { exerciseName: 'CABLE TRICEP PUSHDOWN', primaryMuscles: ['Triceps'], secondaryMuscles: [], setsContribution: 1.0 },
  { exerciseName: 'SMITH JM PRESS', primaryMuscles: ['Triceps'], secondaryMuscles: ['Chest'], setsContribution: 1.0 },
  { exerciseName: 'BAR SKULL', primaryMuscles: ['Triceps'], secondaryMuscles: [], setsContribution: 1.0 },
  { exerciseName: 'SKULL CRUSHER', primaryMuscles: ['Triceps'], secondaryMuscles: [], setsContribution: 1.0 },
  { exerciseName: 'ASSISTED DIPS', primaryMuscles: ['Triceps'], secondaryMuscles: ['Chest'], setsContribution: 1.0 },
  { exerciseName: 'DIPS', primaryMuscles: ['Triceps'], secondaryMuscles: ['Chest'], setsContribution: 1.0 },
  { exerciseName: 'JM PRESS', primaryMuscles: ['Triceps'], secondaryMuscles: ['Chest'], setsContribution: 1.0 },

  // Vertical Triceps
  { exerciseName: 'BARBELL OVERHEAD TRICEP EXTENSION', primaryMuscles: ['Triceps'], secondaryMuscles: [], setsContribution: 1.0 },
  { exerciseName: 'EZ BAR OVERHEAD TRICEP EXTENSION', primaryMuscles: ['Triceps'], secondaryMuscles: [], setsContribution: 1.0 },
  { exerciseName: 'CABLE OVERHEAD TRICEP EXTENSION', primaryMuscles: ['Triceps'], secondaryMuscles: [], setsContribution: 1.0 },
  { exerciseName: 'EZ BAR SEATED TRICEP EXTENSION', primaryMuscles: ['Triceps'], secondaryMuscles: [], setsContribution: 1.0 },
  { exerciseName: 'BARBELL SEATED TRICEP EXTENSION', primaryMuscles: ['Triceps'], secondaryMuscles: [], setsContribution: 1.0 },

  // Biceps
  { exerciseName: 'BARBELL CURL', primaryMuscles: ['Biceps'], secondaryMuscles: ['Forearms'], setsContribution: 1.0 },
  { exerciseName: 'EZ CURL', primaryMuscles: ['Biceps'], secondaryMuscles: ['Forearms'], setsContribution: 1.0 },
  { exerciseName: 'CLOSE GRIP BARBELL CURL', primaryMuscles: ['Biceps'], secondaryMuscles: ['Forearms'], setsContribution: 1.0 },
  { exerciseName: '2-ARM DUMBBELL CURL', primaryMuscles: ['Biceps'], secondaryMuscles: ['Forearms'], setsContribution: 1.0 },
  { exerciseName: 'CABLE CURL', primaryMuscles: ['Biceps'], secondaryMuscles: ['Forearms'], setsContribution: 1.0 },
  { exerciseName: 'INCLINE DUMBBELL CURL', primaryMuscles: ['Biceps'], secondaryMuscles: ['Forearms'], setsContribution: 1.0 },
  { exerciseName: 'DUMBBELL TWIST CURL', primaryMuscles: ['Biceps'], secondaryMuscles: ['Forearms'], setsContribution: 1.0 },
  { exerciseName: 'MACHINE HAMMER CURL', primaryMuscles: ['Biceps'], secondaryMuscles: ['Forearms'], setsContribution: 1.0 },
  { exerciseName: 'BENT OVER CURL', primaryMuscles: ['Biceps'], secondaryMuscles: ['Forearms'], setsContribution: 1.0 },
  { exerciseName: 'CABLE ROPE TWIST CURL', primaryMuscles: ['Biceps'], secondaryMuscles: ['Forearms'], setsContribution: 1.0 },
  { exerciseName: 'HAMMER CURL', primaryMuscles: ['Biceps'], secondaryMuscles: ['Forearms'], setsContribution: 1.0 },
  { exerciseName: 'MACHINE PREACHER CURL', primaryMuscles: ['Biceps'], secondaryMuscles: ['Forearms'], setsContribution: 1.0 },

  // Quads
  { exerciseName: 'HIGH BAR SQUAT', primaryMuscles: ['Quadriceps'], secondaryMuscles: ['Glutes', 'Core'], setsContribution: 1.0 },
  { exerciseName: 'LEG EXTENSIONS', primaryMuscles: ['Quadriceps'], secondaryMuscles: [], setsContribution: 1.0 },
  { exerciseName: 'SUMO SQUAT', primaryMuscles: ['Quadriceps'], secondaryMuscles: ['Glutes'], setsContribution: 1.0 },
  { exerciseName: 'SUS-MACHINE', primaryMuscles: ['Quadriceps'], secondaryMuscles: ['Glutes'], setsContribution: 1.0 },
  { exerciseName: 'LEG PRESS', primaryMuscles: ['Quadriceps'], secondaryMuscles: ['Glutes'], setsContribution: 1.0 },
  { exerciseName: 'BARBELL WALKING LUNGE', primaryMuscles: ['Quadriceps'], secondaryMuscles: ['Glutes', 'Hamstrings'], setsContribution: 1.0 },
  { exerciseName: 'DUMBBELL WALKING LUNGE', primaryMuscles: ['Quadriceps'], secondaryMuscles: ['Glutes', 'Hamstrings'], setsContribution: 1.0 },
  { exerciseName: 'FRONT SQUAT', primaryMuscles: ['Quadriceps'], secondaryMuscles: ['Glutes', 'Core'], setsContribution: 1.0 },
  { exerciseName: 'LOW BAR SQUAT', primaryMuscles: ['Quadriceps'], secondaryMuscles: ['Glutes'], setsContribution: 1.0 },
  { exerciseName: 'CLOSE STANCE FEET FORWARD SQUAT', primaryMuscles: ['Quadriceps'], secondaryMuscles: ['Glutes'], setsContribution: 1.0 },
  { exerciseName: 'SQUAT', primaryMuscles: ['Quadriceps'], secondaryMuscles: ['Glutes', 'Core'], setsContribution: 1.0 },
  { exerciseName: 'LEG EXTENSION', primaryMuscles: ['Quadriceps'], secondaryMuscles: [], setsContribution: 1.0 },
  { exerciseName: 'HACK SQUAT', primaryMuscles: ['Quadriceps'], secondaryMuscles: ['Glutes'], setsContribution: 1.0 },

  // Deadlifts and Glute Bridges
  { exerciseName: 'DEADLIFT', primaryMuscles: ['Back', 'Hamstrings', 'Glutes'], secondaryMuscles: ['Quadriceps', 'Core'], setsContribution: 1.0 },
  { exerciseName: 'CHEST ELEVATED GLUTE BRIDGE', primaryMuscles: ['Glutes'], secondaryMuscles: ['Hamstrings'], setsContribution: 1.0 },
  { exerciseName: 'SUMO DEADLIFT', primaryMuscles: ['Back', 'Hamstrings', 'Glutes'], secondaryMuscles: ['Quadriceps'], setsContribution: 1.0 },
  { exerciseName: 'DEFICIT DEADLIFTS', primaryMuscles: ['Back', 'Hamstrings', 'Glutes'], secondaryMuscles: ['Quadriceps'], setsContribution: 1.0 },
  { exerciseName: "25'S DEADLIFT", primaryMuscles: ['Back', 'Hamstrings', 'Glutes'], secondaryMuscles: ['Quadriceps'], setsContribution: 1.0 },
  { exerciseName: 'HEX BAR DEADLIFT', primaryMuscles: ['Back', 'Hamstrings', 'Glutes'], secondaryMuscles: ['Quadriceps'], setsContribution: 1.0 },

  // Hamstrings
  { exerciseName: 'STIFF LEGGED DEADLIFT', primaryMuscles: ['Hamstrings'], secondaryMuscles: ['Glutes', 'Back'], setsContribution: 1.0 },
  { exerciseName: 'LOW BAR GOOD MORNING', primaryMuscles: ['Hamstrings'], secondaryMuscles: ['Glutes', 'Back'], setsContribution: 1.0 },
  { exerciseName: 'HIGH BAR GOOD MORNING', primaryMuscles: ['Hamstrings'], secondaryMuscles: ['Glutes', 'Back'], setsContribution: 1.0 },
  { exerciseName: '45 DEG BACK RAISE', primaryMuscles: ['Hamstrings'], secondaryMuscles: ['Glutes', 'Back'], setsContribution: 1.0 },
  { exerciseName: 'GLUTE HAM RAISE', primaryMuscles: ['Hamstrings'], secondaryMuscles: ['Glutes'], setsContribution: 1.0 },
  { exerciseName: 'SEATED LEG CURL', primaryMuscles: ['Hamstrings'], secondaryMuscles: [], setsContribution: 1.0 },
  { exerciseName: 'LYING LEG CURL', primaryMuscles: ['Hamstrings'], secondaryMuscles: [], setsContribution: 1.0 },
  { exerciseName: 'RDL', primaryMuscles: ['Hamstrings'], secondaryMuscles: ['Glutes', 'Back'], setsContribution: 1.0 },
  { exerciseName: '45° HYPEREXTENSIONS', primaryMuscles: ['Hamstrings'], secondaryMuscles: ['Glutes', 'Back'], setsContribution: 1.0 },

  // Calves
  { exerciseName: 'CALVES ON LEG PRESS', primaryMuscles: ['Calves'], secondaryMuscles: [], setsContribution: 1.0 },
  { exerciseName: 'CALVES ON CALF MACHINE', primaryMuscles: ['Calves'], secondaryMuscles: [], setsContribution: 1.0 },
  { exerciseName: 'STAIR CALVES', primaryMuscles: ['Calves'], secondaryMuscles: [], setsContribution: 1.0 },
  { exerciseName: 'SMITH MACHINE CALVES', primaryMuscles: ['Calves'], secondaryMuscles: [], setsContribution: 1.0 },
  { exerciseName: 'CALF PRESS', primaryMuscles: ['Calves'], secondaryMuscles: [], setsContribution: 1.0 },

  // Abs
  { exerciseName: 'V-UP', primaryMuscles: ['Abs'], secondaryMuscles: ['Core'], setsContribution: 1.0 },
  { exerciseName: 'SLANT BOARD SIT-UP', primaryMuscles: ['Abs'], secondaryMuscles: ['Core'], setsContribution: 1.0 },
  { exerciseName: 'REACHING SIT-UP', primaryMuscles: ['Abs'], secondaryMuscles: ['Core'], setsContribution: 1.0 },
  { exerciseName: 'MODIFIED CANDLESTICK', primaryMuscles: ['Abs'], secondaryMuscles: ['Core'], setsContribution: 1.0 },
  { exerciseName: 'HANGING KNEE RAISE', primaryMuscles: ['Abs'], secondaryMuscles: ['Core'], setsContribution: 1.0 },
  { exerciseName: 'HANGING LEG RAISE', primaryMuscles: ['Abs'], secondaryMuscles: ['Core'], setsContribution: 1.0 },
  { exerciseName: 'AB MACHINE CRUNCH', primaryMuscles: ['Abs'], secondaryMuscles: ['Core'], setsContribution: 1.0 },
  { exerciseName: 'ABS CRUNCH MACHINE', primaryMuscles: ['Abs'], secondaryMuscles: ['Core'], setsContribution: 1.0 },

  // Legacy exercises for backward compatibility
  { exerciseName: 'BENCH PRESS', primaryMuscles: ['Chest'], secondaryMuscles: ['Triceps', 'Shoulders'], setsContribution: 1.0 },
  { exerciseName: 'INCLINE BENCH PRESS', primaryMuscles: ['Chest'], secondaryMuscles: ['Triceps', 'Shoulders'], setsContribution: 1.0 },
  { exerciseName: 'PULL UPS', primaryMuscles: ['Back'], secondaryMuscles: ['Biceps'], setsContribution: 1.0 },
  { exerciseName: 'LAT PULLDOWN', primaryMuscles: ['Back'], secondaryMuscles: ['Biceps'], setsContribution: 1.0 },
  { exerciseName: 'SQUATS', primaryMuscles: ['Quadriceps'], secondaryMuscles: ['Glutes', 'Core'], setsContribution: 1.0 },
  { exerciseName: 'ROMANIAN DEADLIFT', primaryMuscles: ['Hamstrings'], secondaryMuscles: ['Glutes', 'Back'], setsContribution: 1.0 },
];

// Pre-built training block templates
export const TRAINING_BLOCK_TEMPLATES: Omit<TrainingBlock, 'id' | 'startDate' | 'currentWeek'>[] = [
  {
    name: 'Full Body - Every Other Day',
    phase: 'Hypertrophy',
    duration: 8,
    volumeLevel: 'Moderate',
    intensityRange: [70, 85],
    trainingDaysPerWeek: 3.5,
    split: 'Full Body',
    notes: 'Full body training every other day alternating FB1/FB2. Some weeks will have 3 days, some will have 4 days.'
  },
  {
    name: 'Upper/Lower - 4 Days',
    phase: 'Hypertrophy',
    duration: 8,
    volumeLevel: 'Moderate',
    intensityRange: [70, 85],
    trainingDaysPerWeek: 4,
    split: 'Upper/Lower',
    notes: 'Upper Monday/Thursday, Lower Tuesday/Friday. Balanced approach for intermediate lifters.'
  },
  {
    name: 'Push/Pull/Legs - 6 Days',
    phase: 'Hypertrophy',
    duration: 8,
    volumeLevel: 'High',
    intensityRange: [65, 80],
    trainingDaysPerWeek: 6,
    split: 'PPL',
    notes: 'Push/Pull/Legs/Rest/Push/Pull/Legs. High frequency training for advanced lifters.'
  },
  {
    name: 'Strength Block - Upper/Lower',
    phase: 'Strength',
    duration: 6,
    volumeLevel: 'Low',
    intensityRange: [80, 90],
    trainingDaysPerWeek: 4,
    split: 'Upper/Lower',
    notes: 'Focus on heavy compound movements with lower rep ranges. Build maximal strength.'
  },
  {
    name: 'Power Phase - Full Body',
    phase: 'Power',
    duration: 4,
    volumeLevel: 'Low',
    intensityRange: [75, 90],
    trainingDaysPerWeek: 3,
    split: 'Full Body',
    notes: 'Explosive movements and heavy lifts. Short duration for peaking performance.'
  }
];

// Volume recommendations for HIT training (low volume, high intensity)
export const MUSCLE_GROUP_VOLUME_RECOMMENDATIONS: Record<MuscleGroup, { min: number; optimal: number; max: number }> = {
  'Chest': { min: 4, optimal: 6, max: 10 },
  'Back': { min: 6, optimal: 8, max: 12 },
  'Shoulders': { min: 4, optimal: 6, max: 10 },
  'Biceps': { min: 3, optimal: 4, max: 8 },
  'Triceps': { min: 3, optimal: 4, max: 8 },
  'Forearms': { min: 2, optimal: 3, max: 6 },
  'Quadriceps': { min: 4, optimal: 6, max: 10 },
  'Hamstrings': { min: 3, optimal: 5, max: 8 },
  'Calves': { min: 4, optimal: 6, max: 10 },
  'Glutes': { min: 3, optimal: 5, max: 8 },
  'Abs': { min: 3, optimal: 5, max: 8 },
  'Core': { min: 2, optimal: 4, max: 6 },
};

// Training block management functions
export const createTrainingBlock = (template: Omit<TrainingBlock, 'id' | 'startDate' | 'currentWeek'>, startDate: string): TrainingBlock => {
  return {
    ...template,
    id: uuidv4(),
    startDate,
    currentWeek: 1,
    isActive: true
  };
};

export const calculateMuscleGroupVolume = (workouts: Workout[]): MuscleGroupVolume[] => {
  const volumeMap = new Map<MuscleGroup, MuscleGroupVolume>();
  
  // Initialize all muscle groups
  Object.keys(MUSCLE_GROUP_VOLUME_RECOMMENDATIONS).forEach(muscle => {
    const muscleGroup = muscle as MuscleGroup;
    volumeMap.set(muscleGroup, {
      muscleGroup,
      sets: 0,
      frequency: 0,
      weeklyTarget: MUSCLE_GROUP_VOLUME_RECOMMENDATIONS[muscleGroup].optimal
    });
  });

  workouts.forEach(workout => {
    const muscleGroupsInWorkout = new Set<MuscleGroup>();
    
    workout.exercises.forEach(exercise => {
      const mapping = findExerciseMapping(exercise.name);
      if (mapping) {
        // Count primary muscles
        mapping.primaryMuscles.forEach(muscle => {
          const current = volumeMap.get(muscle)!;
          volumeMap.set(muscle, {
            ...current,
            sets: current.sets + exercise.sets.length
          });
          muscleGroupsInWorkout.add(muscle);
        });
        
        // Count secondary muscles (half contribution)
        mapping.secondaryMuscles.forEach(muscle => {
          const current = volumeMap.get(muscle)!;
          volumeMap.set(muscle, {
            ...current,
            sets: current.sets + (exercise.sets.length * 0.5)
          });
        });
      }
    });
    
    // Increment frequency for muscle groups trained in this workout
    muscleGroupsInWorkout.forEach(muscle => {
      const current = volumeMap.get(muscle)!;
      volumeMap.set(muscle, {
        ...current,
        frequency: current.frequency + 1
      });
    });
  });

  return Array.from(volumeMap.values());
};

export const findExerciseMapping = (exerciseName: string): ExerciseMuscleMapping | undefined => {
  return EXERCISE_MUSCLE_MAPPING.find(mapping => 
    mapping.exerciseName === exerciseName.toUpperCase()
  );
};

export const getVolumeRecommendations = (trainingDaysPerWeek: number): VolumeTarget[] => {
  return Object.entries(MUSCLE_GROUP_VOLUME_RECOMMENDATIONS).map(([muscle, rec]) => ({
    muscleGroup: muscle as MuscleGroup,
    weeklySetTarget: trainingDaysPerWeek >= 5 ? rec.optimal : rec.min,
    frequency: trainingDaysPerWeek >= 5 ? 2 : 1,
    priority: ['Chest', 'Back', 'Quadriceps'].includes(muscle) ? 'High' : 'Moderate'
  }));
};

export const isDeloadWeek = (block: TrainingBlock): boolean => {
  return block.deloadWeek !== undefined && block.currentWeek === block.deloadWeek;
};

export const getBlockProgress = (block: TrainingBlock): number => {
  return Math.round((block.currentWeek / block.duration) * 100);
};

export const advanceTrainingBlock = (block: TrainingBlock): TrainingBlock => {
  const nextWeek = block.currentWeek + 1;
  return {
    ...block,
    currentWeek: nextWeek <= block.duration ? nextWeek : block.duration
  };
};

export const isBlockCompleted = (block: TrainingBlock): boolean => {
  return block.currentWeek >= block.duration;
};

// Note: These functions are deprecated - components should use the database directly
// They're kept here for backward compatibility but will use localStorage as fallback

const TRAINING_BLOCKS_KEY = 'trainingBlocks';

const saveTrainingBlocks = (blocks: TrainingBlock[]): void => {
  localStorage.setItem(TRAINING_BLOCKS_KEY, JSON.stringify(blocks));
};

const loadTrainingBlocks = (): TrainingBlock[] => {
  const stored = localStorage.getItem(TRAINING_BLOCKS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const getCurrentTrainingBlock = (): TrainingBlock | null => {
  // This is a synchronous fallback - components should use db.getActiveTrainingBlock() instead
  const blocks = loadTrainingBlocks();
  return blocks.find(block => block.isActive && !isBlockCompleted(block)) || null;
};

export const addTrainingBlock = (block: TrainingBlock): void => {
  // This is a synchronous fallback - components should use db.saveTrainingBlock() instead
  const blocks = loadTrainingBlocks();
  
  // Deactivate all existing blocks if this one is active
  if (block.isActive) {
    blocks.forEach(b => b.isActive = false);
  }
  
  blocks.push(block);
  saveTrainingBlocks(blocks);
};

export const updateTrainingBlock = (updatedBlock: TrainingBlock): void => {
  // This is a synchronous fallback - components should use db.updateTrainingBlock() instead
  const blocks = loadTrainingBlocks();
  const index = blocks.findIndex(block => block.id === updatedBlock.id);
  if (index !== -1) {
    blocks[index] = updatedBlock;
    saveTrainingBlocks(blocks);
  }
};