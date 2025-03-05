import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { preloadWorkouts, resetWorkouts } from "../utils/SupaBase"; // Ensure this path is correct
import OptigainDumbell from "../assets/react3.svg";
import { useUser } from "@clerk/clerk-react"; // Import Clerk's useUser hook
import { useSupabaseClient } from "../utils/supabaseClient"; // Import the custom Supabase client hook
import ActionBar from "../components/Actionbar";

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser(); // Get the authenticated user
  const supabase = useSupabaseClient(); // Get the Supabase client instance

  useEffect(() => {
    if (user) {
      // Pass both supabase and user to preloadWorkouts
      preloadWorkouts(supabase, user);
    }
  }, [user, supabase]); // Run this effect when the user or supabase client changes

  const handleReset = async () => {
    if (!user) return;
    if (
      window.confirm(
        "Are you sure you want to reset all workouts to their default state? This cannot be undone."
      )
    ) {
      try {
        await resetWorkouts(supabase, user);
        alert("Workouts have been reset successfully!");
        window.location.reload(); // Reload the page to reflect changes
      } catch (error) {
        console.error("Error resetting workouts:", error);
        alert("Failed to reset workouts. Please try again.");
      }
    }
  };

  return (
    <div className="home-container">
      <ActionBar />
      <div className="home-content">
        <div className="logo-section">
          <img
            src={OptigainDumbell}
            alt="Optigain Dumbell Logo"
            className="app-logo"
          />
          <h1 className="app-title"> Optigains </h1>
        </div>

        <div className="button-grid">
          <button
            onClick={() => navigate("/start-lift")}
            className="home-button primary"
          >
            <span className="button-icon">💪</span>
            <span className="button-text">Check In</span>
          </button>

          <button
            onClick={() => navigate("/workout-plan")}
            className="home-button primary"
          >
            <span className="button-icon">📋</span>
            <span className="button-text">Workout Plan</span>
          </button>

          <button
            onClick={() => navigate("/library-page")}
            className="home-button primary"
          >
            <span className="button-icon">📚</span>
            <span className="button-text">Exercise Library</span>
          </button>

          <button
            onClick={() => navigate("/calc-page")}
            className="home-button primary"
          >
            <span className="button-icon">🔢</span>
            <span className="button-text">Weight Calculator</span>
          </button>
        </div>

        {/* Development-only reset button */}
        {process.env.NODE_ENV === "development" && (
          <button
            onClick={handleReset}
            className="reset-button"
            style={{
              marginTop: "2rem",
              padding: "0.5rem 1rem",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Reset to Default Workouts
          </button>
        )}
      </div>
    </div>
  );
};

export default HomePage;

// import React from "react";

// const HomePage: React.FC = () => {
//   return (
//     <div>
//       <h1>Welcome to the Home Page!</h1>
//       <p>If you can see this, your app is working!</p>
//     </div>
//   );
// };

// export default HomePage;
