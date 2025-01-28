import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { preloadWorkouts } from "../utils/localStorage";
import OptigainDumbell from "../assets/react3.svg";

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    preloadWorkouts(); // Preload workouts when the app loads
  }, []);

  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <img src={OptigainDumbell} alt="Optigain Dumbell Logo" />
      {/* Render the SVG as an <img> tag */}
      <h1>Optigains</h1>

      <button
        onClick={() => navigate("/workout-plan")}
        className="button primary"
      >
        Workout Plan
      </button>

      <button
        onClick={() => navigate("/start-lift")}
        className="button primary"
      >
        Check In
      </button>

      <button onClick={() => navigate("/calc-page")} className="button primary">
        Weight Calculator
      </button>

      <button
        onClick={() => navigate("/library-page")}
        className="button primary"
      >
        Exercise Library
      </button>
    </div>
  );
};

export default HomePage;
