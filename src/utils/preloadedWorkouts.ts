import { Workout, Exercise } from './types';

// Preloaded Full Body workout template
export const FULL_BODY_WORKOUT_TEMPLATE: Workout = {
  workout_name: 'Full Body Split Program',
  assigned_days: [],
  exercises: [
    // Day 1: Full Body
    {
      name: 'CHEST-SUPPORTED ROW',
      sets: [
        { weight: 135, reps: 8, rir: 2, isLogged: false },
        { weight: 135, reps: 8, rir: 2, isLogged: false },
        { weight: 135, reps: 8, rir: 2, isLogged: false }
      ],
      rir: 2,
      logs: []
    },
    {
      name: 'CONVERGING MACHINE PRESS',
      sets: [
        { weight: 180, reps: 10, rir: 2, isLogged: false },
        { weight: 180, reps: 10, rir: 2, isLogged: false },
        { weight: 180, reps: 10, rir: 2, isLogged: false }
      ],
      rir: 2,
      logs: []
    },
    {
      name: 'LEG PRESS',
      sets: [
        { weight: 270, reps: 12, rir: 2, isLogged: false },
        { weight: 270, reps: 12, rir: 2, isLogged: false },
        { weight: 270, reps: 12, rir: 2, isLogged: false }
      ],
      rir: 2,
      logs: []
    },
    {
      name: 'CABLE TRICEP PUSHDOWN',
      sets: [
        { weight: 70, reps: 12, rir: 2, isLogged: false },
        { weight: 70, reps: 12, rir: 2, isLogged: false }
      ],
      rir: 2,
      logs: []
    },
    {
      name: 'LEG EXTENSION',
      sets: [
        { weight: 120, reps: 15, rir: 1, isLogged: false },
        { weight: 120, reps: 15, rir: 1, isLogged: false }
      ],
      rir: 1,
      logs: []
    },
    {
      name: 'MACHINE LATERAL RAISES',
      sets: [
        { weight: 40, reps: 15, rir: 1, isLogged: false },
        { weight: 40, reps: 15, rir: 1, isLogged: false }
      ],
      rir: 1,
      logs: []
    }
  ],
  clerk_user_id: ''
};

// Day 2: Full Body
export const FULL_BODY_DAY_2_WORKOUT: Workout = {
  workout_name: 'Full Body Day 2',
  assigned_days: [],
  exercises: [
    {
      name: 'MACHINE PREACHER CURL',
      sets: [
        { weight: 60, reps: 10, rir: 2, isLogged: false },
        { weight: 60, reps: 10, rir: 2, isLogged: false },
        { weight: 60, reps: 10, rir: 2, isLogged: false }
      ],
      rir: 2,
      logs: []
    },
    {
      name: 'WIDE GRIP BENCH PRESS',
      sets: [
        { weight: 155, reps: 8, rir: 2, isLogged: false },
        { weight: 155, reps: 8, rir: 2, isLogged: false },
        { weight: 155, reps: 8, rir: 2, isLogged: false }
      ],
      rir: 2,
      logs: []
    },
    {
      name: 'RDL',
      sets: [
        { weight: 185, reps: 10, rir: 2, isLogged: false },
        { weight: 185, reps: 10, rir: 2, isLogged: false },
        { weight: 185, reps: 10, rir: 2, isLogged: false }
      ],
      rir: 2,
      logs: []
    },
    {
      name: 'WIDE GRIP LAT PULLDOWN',
      sets: [
        { weight: 140, reps: 10, rir: 2, isLogged: false },
        { weight: 140, reps: 10, rir: 2, isLogged: false },
        { weight: 140, reps: 10, rir: 2, isLogged: false }
      ],
      rir: 2,
      logs: []
    },
    {
      name: 'JM PRESS',
      sets: [
        { weight: 95, reps: 12, rir: 2, isLogged: false },
        { weight: 95, reps: 12, rir: 2, isLogged: false }
      ],
      rir: 2,
      logs: []
    },
    {
      name: 'SQUAT',
      sets: [
        { weight: 185, reps: 10, rir: 2, isLogged: false },
        { weight: 185, reps: 10, rir: 2, isLogged: false },
        { weight: 185, reps: 10, rir: 2, isLogged: false }
      ],
      rir: 2,
      logs: []
    },
    {
      name: 'BEHIND THE BACK CUFF LAT RAISES',
      sets: [
        { weight: 25, reps: 15, rir: 1, isLogged: false },
        { weight: 25, reps: 15, rir: 1, isLogged: false }
      ],
      rir: 1,
      logs: []
    }
  ],
  clerk_user_id: ''
};

// Day 3: Upper Body
export const UPPER_BODY_WORKOUT: Workout = {
  workout_name: 'Upper Body Focus',
  assigned_days: [],
  exercises: [
    {
      name: 'MACHINE SHOULDER PRESS',
      sets: [
        { weight: 120, reps: 10, rir: 2, isLogged: false },
        { weight: 120, reps: 10, rir: 2, isLogged: false },
        { weight: 120, reps: 10, rir: 2, isLogged: false }
      ],
      rir: 2,
      logs: []
    },
    {
      name: 'NORMAL GRIP LAT PULLDOWN',
      sets: [
        { weight: 140, reps: 10, rir: 2, isLogged: false },
        { weight: 140, reps: 10, rir: 2, isLogged: false },
        { weight: 140, reps: 10, rir: 2, isLogged: false }
      ],
      rir: 2,
      logs: []
    },
    {
      name: 'PEC DECK',
      sets: [
        { weight: 130, reps: 12, rir: 2, isLogged: false },
        { weight: 130, reps: 12, rir: 2, isLogged: false },
        { weight: 130, reps: 12, rir: 2, isLogged: false }
      ],
      rir: 2,
      logs: []
    },
    {
      name: 'CHEST-SUPPORTED ROW',
      sets: [
        { weight: 135, reps: 10, rir: 2, isLogged: false },
        { weight: 135, reps: 10, rir: 2, isLogged: false },
        { weight: 135, reps: 10, rir: 2, isLogged: false }
      ],
      rir: 2,
      logs: []
    },
    {
      name: 'HAMMER CURL',
      sets: [
        { weight: 35, reps: 12, rir: 2, isLogged: false },
        { weight: 35, reps: 12, rir: 2, isLogged: false }
      ],
      rir: 2,
      logs: []
    },
    {
      name: 'CABLE TRICEP PUSHDOWN',
      sets: [
        { weight: 70, reps: 12, rir: 2, isLogged: false },
        { weight: 70, reps: 12, rir: 2, isLogged: false }
      ],
      rir: 2,
      logs: []
    }
  ],
  clerk_user_id: ''
};

// Day 4: Lower Body
export const LOWER_BODY_WORKOUT: Workout = {
  workout_name: 'Lower Body Focus',
  assigned_days: [],
  exercises: [
    {
      name: 'HACK SQUAT',
      sets: [
        { weight: 225, reps: 10, rir: 2, isLogged: false },
        { weight: 225, reps: 10, rir: 2, isLogged: false },
        { weight: 225, reps: 10, rir: 2, isLogged: false }
      ],
      rir: 2,
      logs: []
    },
    {
      name: '45° HYPEREXTENSIONS',
      sets: [
        { weight: 45, reps: 12, rir: 2, isLogged: false },
        { weight: 45, reps: 12, rir: 2, isLogged: false },
        { weight: 45, reps: 12, rir: 2, isLogged: false }
      ],
      rir: 2,
      logs: []
    },
    {
      name: 'LEG EXTENSION',
      sets: [
        { weight: 120, reps: 15, rir: 1, isLogged: false },
        { weight: 120, reps: 15, rir: 1, isLogged: false }
      ],
      rir: 1,
      logs: []
    },
    {
      name: 'CALF PRESS',
      sets: [
        { weight: 180, reps: 15, rir: 1, isLogged: false },
        { weight: 180, reps: 15, rir: 1, isLogged: false }
      ],
      rir: 1,
      logs: []
    },
    {
      name: 'AB MACHINE CRUNCH',
      sets: [
        { weight: 80, reps: 15, rir: 1, isLogged: false },
        { weight: 80, reps: 15, rir: 1, isLogged: false }
      ],
      rir: 1,
      logs: []
    },
    {
      name: 'CALF PRESS',
      sets: [
        { weight: 180, reps: 12, rir: 2, isLogged: false }
      ],
      rir: 2,
      logs: []
    },
    {
      name: 'ABS CRUNCH MACHINE',
      sets: [
        { weight: 80, reps: 12, rir: 2, isLogged: false }
      ],
      rir: 2,
      logs: []
    }
  ],
  clerk_user_id: ''
};

// Complete program with all 4 days
export const FULL_BODY_SPLIT_PROGRAM = [
  FULL_BODY_WORKOUT_TEMPLATE,
  FULL_BODY_DAY_2_WORKOUT,
  UPPER_BODY_WORKOUT,
  LOWER_BODY_WORKOUT
];

// Function to preload workouts into local storage
export const preloadWorkouts = async (userId: string): Promise<void> => {
  try {
    const existingWorkouts = JSON.parse(localStorage.getItem('workouts') || '[]');
    
    // Check if workouts are already preloaded for this user
    const hasPreloadedWorkouts = existingWorkouts.some((workout: Workout) => 
      FULL_BODY_SPLIT_PROGRAM.some(template => 
        template.workout_name === workout.workout_name && workout.clerk_user_id === userId
      )
    );

    if (!hasPreloadedWorkouts) {
      // Add user ID to each workout template
      const userWorkouts = FULL_BODY_SPLIT_PROGRAM.map(workout => ({
        ...workout,
        clerk_user_id: userId,
        id: `preloaded_${workout.workout_name.toLowerCase().replace(/\s+/g, '_')}_${userId}`
      }));

      // Add to existing workouts
      const updatedWorkouts = [...existingWorkouts, ...userWorkouts];
      localStorage.setItem('workouts', JSON.stringify(updatedWorkouts));
      
      console.log('Preloaded Full Body Split Program workouts');
    }
  } catch (error) {
    console.error('Error preloading workouts:', error);
  }
};