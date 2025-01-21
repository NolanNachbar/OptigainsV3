import React, { useEffect, useState } from 'react';
import WorkoutForm from '../components/WorkoutForm';
import CalendarComponent from '../components/Calendar';
import { loadWorkouts } from '../utils/localStorage';
import { Workout } from '../utils/types';
import HomeButton from '../components/HomeButton';

const WorkoutPlanPage: React.FC = () => {
  const [savedWorkouts, setSavedWorkouts] = useState<Workout[]>([]);

  useEffect(() => {
    const workouts = loadWorkouts();
    setSavedWorkouts(workouts);
  }, []);

  return (
    <div>
      <h2>Create and Assign Workouts</h2>
      <WorkoutForm setSavedWorkouts={setSavedWorkouts} />
      <CalendarComponent savedWorkouts={savedWorkouts} />
      <HomeButton />
    </div>
  );
};

export default WorkoutPlanPage;
