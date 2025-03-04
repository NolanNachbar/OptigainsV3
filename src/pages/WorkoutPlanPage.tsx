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
import { useSupabaseClient } from "../utils/supabaseClient"; // Import the custom hook

const WorkoutPlanPage: React.FC = () => {
  const [savedWorkouts, setSavedWorkouts] = useState<Workout[]>([]);
  const { user } = useUser(); // Get the authenticated user
  const supabase = useSupabaseClient(); // Get the Supabase client

  useEffect(() => {
    const fetchWorkouts = async () => {
      if (user && supabase) {
        try {
          // First try to preload default workouts
          await preloadWorkouts(supabase, user);
          // Then load all workouts (including any preloaded ones)
          const workouts = await loadWorkouts(supabase, user);
          setSavedWorkouts(workouts);
        } catch (error) {
          console.error("Error loading workouts:", error);
        }
      }
    };

    fetchWorkouts();
  }, [user, supabase]); // Add supabase as a dependency

  const handleRemoveWorkout = async (workout: Workout) => {
    if (user && supabase) {
      await removeWorkoutFromList(supabase, workout.workout_name, user); // Pass supabase and user
      setSavedWorkouts((prevWorkouts) =>
        prevWorkouts.filter((w) => w.workout_name !== workout.workout_name)
      );
    }
  };

  return (
    <div>
      <ActionBar />
      <div style={{ marginTop: "60px" /* Adjust to match ActionBar height */ }}>
        <CalendarComponent
          savedWorkouts={savedWorkouts}
          onRemoveWorkout={handleRemoveWorkout}
        />
        <WorkoutForm setSavedWorkouts={setSavedWorkouts} />
      </div>
    </div>
  );
};

export default WorkoutPlanPage;
