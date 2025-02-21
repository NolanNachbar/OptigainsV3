import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import WorkoutPlanPage from "./pages/WorkoutPlanPage";
import StartLiftPage from "./pages/StartLiftPage";
import FreestyleLiftPage from "./pages/FreestyleLiftPage";
import StartProgrammedLiftPage from "./pages/ProgrammedWorkoutPage";
import CalcPage from "./pages/CalculatorPage";
import ExerciseLibrary from "./pages/exerciseLibrary";
import BodyWeightLog from "./pages/weightLogging";

const App: React.FC = () => {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/workout-plan" element={<WorkoutPlanPage />} />
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
      </div>
    </Router>
  );
};

export default App;
