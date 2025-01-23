import React, { useEffect, useState } from 'react';
import WorkoutForm from '../components/WorkoutForm';
import CalendarComponent from '../components/Calendar';
import { loadWorkouts } from '../utils/localStorage';
import { Workout } from '../utils/types';
import ActionBar from '../components/Actionbar';

const WorkoutPlanPage: React.FC = () => {
  const [savedWorkouts, setSavedWorkouts] = useState<Workout[]>([]);

  useEffect(() => {
    const workouts = loadWorkouts();
    setSavedWorkouts(workouts);
  }, []);

  return (
    <div>
      <ActionBar />
      <div style={{ marginTop: '60px' /* Adjust to match ActionBar height */ }}>
        <CalendarComponent savedWorkouts={savedWorkouts} />
        <WorkoutForm setSavedWorkouts={setSavedWorkouts} />
      </div>
    </div>
  );
};

export default WorkoutPlanPage;
