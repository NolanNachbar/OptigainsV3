import React, { useState } from "react";
import ActionBar from "../components/Actionbar";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import WorkoutHistory from "../components/WorkoutHistory";
import { Workout } from "../utils/types";
import EditWorkoutComponent from "../components/EditWorkout";
import ExerciseLibrary from "./exerciseLibrary";

const ToggleButton: React.FC<{
  options: string[];
  value: string;
  onChange: (value: "exercises" | "history" | "selection") => void;
}> = ({ options, value, onChange }) => {
  return (
    <div className="toggle-container">
      {options.map((option) => (
        <button
          key={option}
          className={`toggle-button ${
            value === option.toLowerCase().split(" ")[0] ? "active" : ""
          }`}
          onClick={() =>
            onChange(
              option.toLowerCase().split(" ")[0] === "exercise"
                ? "exercises"
                : (option.toLowerCase().split(" ")[0] as
                    | "exercises"
                    | "history"
                    | "selection")
            )
          }
        >
          {option}
        </button>
      ))}
    </div>
  );
};

const LibraryPage: React.FC = () => {
  const [view, setView] = useState<"exercises" | "history" | "selection">(
    "selection"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);

  const handleEditWorkout = (workout: Workout) => {
    setSelectedWorkout(workout);
  };

  const handleViewChange = (newView: "exercises" | "history" | "selection") => {
    setView(newView);
    setSearchTerm(""); // Reset search term when changing views
    setSelectedDate(null); // Reset date when changing views
    setSelectedWorkout(null); // Reset selected workout when changing views
  };

  const renderContent = () => {
    switch (view) {
      case "selection":
        return (
          <div className="view-selection">
            <h2>Select View</h2>
            <div className="selection-buttons">
              <button
                className="selection-button"
                onClick={() => setView("exercises")}
              >
                Exercise Library
              </button>
              <button
                className="selection-button"
                onClick={() => setView("history")}
              >
                Workout History
              </button>
            </div>
          </div>
        );
      case "exercises":
        return (
          <div className="exercise-library">
            <ExerciseLibrary searchTerm={searchTerm} />
          </div>
        );
      case "history":
        return (
          <div className="workout-history-container">
            <WorkoutHistory
              searchTerm={searchTerm}
              selectedDate={selectedDate}
              onEditWorkout={handleEditWorkout}
            />
          </div>
        );
    }
  };

  return (
    <div className="library-page">
      <ActionBar />
      <div className="library-content">
        {view !== "selection" && (
          <div className="library-controls">
            <ToggleButton
              options={["Exercise Library", "Workout History"]}
              value={view}
              onChange={handleViewChange}
            />
            <input
              type="text"
              placeholder={`Search ${
                view === "exercises" ? "exercises" : "workouts"
              }...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {view === "history" && (
              <DatePicker
                selected={selectedDate}
                onChange={(date: Date | null) => setSelectedDate(date)}
                placeholderText="Filter by date"
                className="date-picker"
              />
            )}
          </div>
        )}
        {renderContent()}
        {/* Edit Workout Modal */}
        {selectedWorkout && (
          <div className="modal-overlay">
            <div className="modal-content">
              <EditWorkoutComponent
                savedWorkout={selectedWorkout}
                onUpdateWorkout={() => {
                  setSelectedWorkout(null);
                  // Refresh workout history here if needed
                }}
              />
              <button
                className="close-modal-button"
                onClick={() => setSelectedWorkout(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LibraryPage;
