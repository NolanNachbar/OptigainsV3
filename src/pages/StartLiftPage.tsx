import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getWorkoutForToday } from "../utils/SupaBase"; // Ensure this is updated to use Supabase
import { Workout } from "../utils/types";
import ActionBar from "../components/Actionbar";
import { useUser } from "@clerk/clerk-react";
import { useSupabaseClient } from "../utils/supabaseClient"; // Import the custom Supabase client hook

const StartLiftPage: React.FC = () => {
  const { user } = useUser();
  const supabase = useSupabaseClient(); // Get the Supabase client
  const [workoutToday, setWorkoutToday] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWorkout = async () => {
      if (!user) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      try {
        const workout = await getWorkoutForToday(
          supabase,
          new Date().toISOString().split("T")[0],
          user
        );

        if (workout) {
          setWorkoutToday(workout);
        } else {
          setError("No workout assigned for today.");
        }
      } catch (err) {
        setError("Failed to fetch workout for today");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkout();
  }, [user, supabase]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    console.error(error);
    return (
      <div style={{ textAlign: "center", padding: "4rem" }}>
        <ActionBar />
        <h2>Start Your Lift</h2>
        <button
          onClick={() => navigate("/weight-log")}
          className="button action"
        >
          Weigh In
        </button>
        <button
          onClick={() => navigate("/freestyle-lift")}
          className="button action"
        >
          Start Freestyle Lift
        </button>
        <p>No lift programmed for today.</p>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", padding: "4rem" }}>
      <ActionBar />
      <h2>Start Your Lift</h2>
      <button onClick={() => navigate("/weight-log")} className="button action">
        Weigh In
      </button>
      <button
        onClick={() => navigate("/freestyle-lift")}
        className="button action"
      >
        Start Freestyle Lift
      </button>

      {workoutToday ? (
        <button
          onClick={() => navigate("/start-programmed-lift")}
          className="button action"
        >
          Start Programmed Lift
        </button>
      ) : (
        <p>No lift programmed for today.</p>
      )}
    </div>
  );
};

export default StartLiftPage;
