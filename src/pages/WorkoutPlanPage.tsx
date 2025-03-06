import React, { useEffect, useState } from "react";
import WorkoutForm from "../components/WorkoutForm";
import CalendarComponent from "../components/Calendar";
import {
  loadWorkouts,
  removeWorkoutFromList,
  preloadWorkouts,
} from "../utils/SupaBase";
import { Workout } from "../utils/types";
import ActionBar from "../components/Actionbar";
import { useUser } from "@clerk/clerk-react";
import { useSupabaseClient } from "../utils/supabaseClient";

const WorkoutPlanPage: React.FC = () => {
  const [savedWorkouts, setSavedWorkouts] = useState<Workout[]>([]);
  const { user } = useUser();
  const supabase = useSupabaseClient();

  useEffect(() => {
    const fetchWorkouts = async () => {
      if (user && supabase) {
        try {
          await preloadWorkouts(supabase, user);
          const workouts = await loadWorkouts(supabase, user);
          setSavedWorkouts(workouts);
        } catch (error) {
          console.error("Error loading workouts:", error);
        }
      }
    };

    fetchWorkouts();
  }, [user, supabase]);

  const handleRemoveWorkout = async (workout: Workout) => {
    if (user && supabase) {
      await removeWorkoutFromList(supabase, workout.workout_name, user);
      setSavedWorkouts((prevWorkouts) =>
        prevWorkouts.filter((w) => w.workout_name !== workout.workout_name)
      );
    }
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
