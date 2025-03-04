import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { preloadWorkouts } from "../utils/SupaBase"; // Ensure this path is correct
import OptigainDumbell from "../assets/react3.svg";
import { useUser } from "@clerk/clerk-react"; // Import Clerk's useUser hook
import { useSupabaseClient } from "../utils/supabaseClient"; // Import the custom Supabase client hook

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

  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <img src={OptigainDumbell} alt="Optigain Dumbell Logo" />
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
