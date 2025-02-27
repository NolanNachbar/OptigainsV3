import React, { useEffect, useState } from "react";
import WorkoutForm from "../components/WorkoutForm";
import CalendarComponent from "../components/Calendar";
import { loadWorkouts, removeWorkoutFromList } from "../utils/SupaBase"; // Import removeWorkoutFromList
import { Workout } from "../utils/types";
import ActionBar from "../components/Actionbar";
import { useUser } from "@clerk/clerk-react"; // Import Clerk's useUser hook

const WorkoutPlanPage: React.FC = () => {
  const [savedWorkouts, setSavedWorkouts] = useState<Workout[]>([]);
  const { user } = useUser(); // Get the authenticated user

  useEffect(() => {
    const fetchWorkouts = async () => {
      if (user) {
        const workouts = await loadWorkouts(user); // Pass the user object
        setSavedWorkouts(workouts);
      }
    };

    fetchWorkouts();
  }, [user]); // Add user as a dependency

  const handleRemoveWorkout = async (workout: Workout) => {
    if (user) {
      await removeWorkoutFromList(workout.Workout_name, user); // Pass the user object
      setSavedWorkouts((prevWorkouts) =>
        prevWorkouts.filter((w) => w.Workout_name !== workout.Workout_name)
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
        <WorkoutForm setSavedWorkouts={setSavedWorkouts} />{" "}
        {/* Pass user to WorkoutForm */}
      </div>
    </div>
  );
};

export default WorkoutPlanPage;
