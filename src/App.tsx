import React, { Suspense, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// Lazy load page components for code splitting
const HomePage = React.lazy(() => import("./pages/HomePage"));
const WorkoutPlanPage = React.lazy(() => import("./pages/WorkoutPlanPage"));
const StartLiftPage = React.lazy(() => import("./pages/StartLiftPage"));
const FreestyleLiftPage = React.lazy(() => import("./pages/FreestyleLiftPage"));
const StartProgrammedLiftPage = React.lazy(() => import("./pages/ProgrammedWorkoutPage"));
const CalcPage = React.lazy(() => import("./pages/CalculatorPage"));
// const ExerciseLibrary = React.lazy(() => import("./pages/exerciseLibrary"));
const LibraryPage = React.lazy(() => import("./pages/LibraryPage"));
const BodyWeightLog = React.lazy(() => import("./pages/weightLogging"));
const CustomWorkoutPage = React.lazy(() => import("./pages/CustomWorkoutPage"));
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
const SignInPage = React.lazy(() => import("./pages/SignInPage"));
const SettingsPage = React.lazy(() => import("./pages/SettingsPage"));
import { initializeDatabase } from "./utils/database";
import Footer from "./components/Footer";
import { DateProvider } from "./contexts/DateContext";


const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Component to initialize database with Clerk auth
const DatabaseInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getToken } = useAuth();
  
  useEffect(() => {
    // Initialize database with Clerk token getter
    initializeDatabase(() => getToken({ template: 'supabase' }));
  }, [getToken]);
  
  return <>{children}</>;
};

const App: React.FC = () => {
  if (!clerkPubKey) {
    console.error("Clerk publishable key is missing!");
    return <div>Error: Clerk publishable key is missing!</div>;
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <DateProvider>
        <DatabaseInitializer>
          <Suspense fallback={<div>Loading...</div>}>
            <Router>
            <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/sign-in" element={<SignInPage />} />
            <Route path="/calc-page" element={<CalcPage />} />
            <Route path="/settings" element={<SettingsPage />} />
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
              path="/custom-workout"
              element={
                <>
                  <SignedIn>
                    <CustomWorkoutPage />
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
          <Footer />
        </Router>
      </Suspense>
      </DatabaseInitializer>
      </DateProvider>
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
