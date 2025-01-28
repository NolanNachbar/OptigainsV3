import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getWorkoutForToday } from "../utils/localStorage";
import { Workout } from "../utils/types";
import ActionBar from "../components/Actionbar";

const StartLiftPage: React.FC = () => {
  const [workoutToday, setWorkoutToday] = useState<Workout | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const workout = getWorkoutForToday(today);
    setWorkoutToday(workout);
  }, []);

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
