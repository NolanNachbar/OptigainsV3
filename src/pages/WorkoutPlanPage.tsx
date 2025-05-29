import React, { useEffect, useState } from "react";
import WorkoutForm from "../components/WorkoutForm";
import CalendarComponent from "../components/Calendar";
import {
  loadWorkouts,
  removeWorkoutFromList,
  preloadWorkouts,
} from "../utils/localStorageDB";
import { Workout } from "../utils/types";
import ActionBar from "../components/Actionbar";
import { useUser } from "@clerk/clerk-react";

const WorkoutPlanPage: React.FC = () => {
  const [savedWorkouts, setSavedWorkouts] = useState<Workout[]>([]);
  const { user } = useUser();

  useEffect(() => {
    const fetchWorkouts = async () => {
      if (user) {
        try {
          await preloadWorkouts(null, user);
          const workouts = await loadWorkouts(null, user);
          setSavedWorkouts(workouts);
        } catch (error) {
          console.error("Error loading workouts:", error);
        }
      }
    };

    fetchWorkouts();
  }, [user]);

  const handleRemoveWorkout = async (workout: Workout) => {
    if (user) {
      await removeWorkoutFromList(null, workout.workout_name, user);
      setSavedWorkouts((prevWorkouts) =>
        prevWorkouts.filter((w) => w.workout_name !== workout.workout_name)
      );
    }
  };

  const handleWorkoutAdded = (workout: Workout) => {
    setSavedWorkouts((prevWorkouts) => [...prevWorkouts, workout]);
  };

  return (
    <div className="workout-plan-page">
      <ActionBar />
      <div className="workout-plan-content">
        <div className="workout-plan-grid">
          <div className="calendar-section">
            <CalendarComponent
              savedWorkouts={savedWorkouts}
              onRemoveWorkout={handleRemoveWorkout}
              onWorkoutAdded={handleWorkoutAdded}
            />
          </div>
          <div className="workout-form-section">
            <WorkoutForm setSavedWorkouts={setSavedWorkouts} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutPlanPage;
