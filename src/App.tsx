import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import WorkoutPlanPage from "./pages/WorkoutPlanPage";
import StartLiftPage from "./pages/StartLiftPage";
import FreestyleLiftPage from "./pages/FreestyleLiftPage";
import StartProgrammedLiftPage from "./pages/ProgrammedWorkoutPage";
import CalcPage from "./pages/CalculatorPage";
// import ExerciseLibrary from "./pages/exerciseLibrary";
import LibraryPage from "./pages/LibraryPage";
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
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/sign-in" element={<SignInPage />} />
            <Route path="/calc-page" element={<CalcPage />} />

            {/* Protected routes */}
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
            <Route
              path="/start-lift"
              element={
                <>
                  <SignedIn>
                    <StartLiftPage />
                  </SignedIn>
                  <SignedOut>
                    <RedirectToSignIn />
                  </SignedOut>
                </>
              }
            />
            <Route
              path="/freestyle-lift"
              element={
                <>
                  <SignedIn>
                    <FreestyleLiftPage />
                  </SignedIn>
                  <SignedOut>
                    <RedirectToSignIn />
                  </SignedOut>
                </>
              }
            />
            <Route
              path="/start-programmed-lift"
              element={
                <>
                  <SignedIn>
                    <StartProgrammedLiftPage />
                  </SignedIn>
                  <SignedOut>
                    <RedirectToSignIn />
                  </SignedOut>
                </>
              }
            />
            <Route
              path="/library-page"
              element={
                <>
                  <SignedIn>
                    <LibraryPage />
                  </SignedIn>
                  <SignedOut>
                    <RedirectToSignIn />
                  </SignedOut>
                </>
              }
            />
            <Route
              path="/weight-log"
              element={
                <>
                  <SignedIn>
                    <BodyWeightLog />
                  </SignedIn>
                  <SignedOut>
                    <RedirectToSignIn />
                  </SignedOut>
                </>
              }
            />
          </Routes>
        </Router>
      </Suspense>
    </ClerkProvider>
  );
};

export default App;

// import React from "react";
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import { ClerkProvider } from "@clerk/clerk-react";
// import HomePage from "./pages/HomePage";

// const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// const App: React.FC = () => {
//   console.log("Clerk Key:", clerkPubKey); // Log the key to verify it's loaded

//   if (!clerkPubKey) {
//     console.error("Clerk publishable key is missing!");
//     return <div>Error: Clerk publishable key is missing!</div>;
//   }

//   return (
//     <ClerkProvider publishableKey={clerkPubKey}>
//       <div>
//         <h1>Clerk Provider Loaded</h1>
//         <Router>
//           <Routes>
//             <Route path="/" element={<HomePage />} />
//           </Routes>
//         </Router>
//       </div>
//     </ClerkProvider>
//   );
// };

// export default App;
