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
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: "#000",
          color: "#ffff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
        onClick={() => navigate("/workout-plan")}
      >
        Workout Plan
      </button>

      <button
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: "#000",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
        onClick={() => navigate("/start-lift")}
      >
        Check In
      </button>

      <button
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: "#000",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
        onClick={() => navigate("/calc-page")}
      >
        Weight Calculator
      </button>

      <button
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: "#000",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
        onClick={() => navigate("/library-page")}
      >
        Exercise Library
      </button>
    </div>
  );
};

export default HomePage;
