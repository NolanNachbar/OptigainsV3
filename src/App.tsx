import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import WorkoutPlanPage from "./pages/WorkoutPlanPage";
import StartLiftPage from "./pages/StartLiftPage";
import FreestyleLiftPage from "./pages/FreestyleLiftPage";
import StartProgrammedLiftPage from "./pages/ProgrammedWorkoutPage";
import CalcPage from "./pages/CalculatorPage";
import ExerciseLibrary from "./pages/exerciseLibrary";
import BodyWeightLog from "./pages/weightLogging";
import { ClerkProvider } from "@clerk/clerk-react";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import SignInPage from "./pages/SignInPage";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const App: React.FC = () => {
  if (!clerkPubKey) {
    console.error("Clerk publishable key is missing!");
    return <div>Error: Clerk publishable key is missing!</div>;
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <Suspense fallback={<div>Loading...</div>}>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/sign-in" element={<SignInPage />} />
            <Route
              path="/workout-plan"
              element={
                <>
                  <SignedIn>
                    <WorkoutPlanPage />
                  </SignedIn>
                  <SignedOut>
                    <RedirectToSignIn />
                  </SignedOut>
                </>
              }
            />
            {/* Protect other routes similarly */}
            <Route path="/start-lift" element={<StartLiftPage />} />
            <Route path="/freestyle-lift" element={<FreestyleLiftPage />} />
            <Route
              path="/start-programmed-lift"
              element={<StartProgrammedLiftPage />}
            />
            <Route path="/calc-page" element={<CalcPage />} />
            <Route path="/library-page" element={<ExerciseLibrary />} />
            <Route path="/weight-log" element={<BodyWeightLog />} />
          </Routes>
        </Router>
      </Suspense>
    </ClerkProvider>
  );
};

export default App;
