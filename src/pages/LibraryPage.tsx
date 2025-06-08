import React, { useState } from "react";
import ActionBar from "../components/Actionbar";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import WorkoutHistory from "../components/WorkoutHistory";
import { Workout } from "../utils/types";
import EditWorkoutComponent from "../components/EditWorkout";
import ExerciseLibrary from "./exerciseLibrary";

// Removed ToggleButton component - will use inline toggle instead

const LibraryPage: React.FC = () => {
  const [view, setView] = useState<"exercises" | "history" | "selection">(
    "exercises"
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
    if (view === "exercises") {
      return (
        <div className="exercise-library">
          <ExerciseLibrary searchTerm={searchTerm} />
        </div>
      );
    } else {
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
      <div className="library-container">
        <div className="library-header">
          <h1>{view === "exercises" ? "Exercise Library" : "Workout History"}</h1>
          <div className="library-controls">
            <div className="view-toggle">
              <button
                className={`view-toggle-btn ${view === "exercises" ? "active" : ""}`}
                onClick={() => handleViewChange("exercises")}
              >
                Exercises
              </button>
              <button
                className={`view-toggle-btn ${view === "history" ? "active" : ""}`}
                onClick={() => handleViewChange("history")}
              >
                History
              </button>
            </div>
            <div className="search-section">
              <input
                type="text"
                placeholder={`Search ${view === "exercises" ? "exercises" : "workouts"}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="library-search-input"
              />
              {view === "history" && (
                <DatePicker
                  selected={selectedDate}
                  onChange={(date: Date | null) => setSelectedDate(date)}
                  placeholderText="Filter by date"
                  className="library-date-picker"
                  dateFormat="MMM d, yyyy"
                />
              )}
            </div>
          </div>
        </div>
        
        <div className="library-content">
          {renderContent()}
        </div>
        
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
      
      <style>{`
        .library-page {
          background: var(--background);
          min-height: 100vh;
          padding-top: 80px;
        }
        
        .library-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }
        
        .library-header {
          margin-bottom: 2rem;
        }
        
        .library-header h1 {
          color: var(--text);
          margin-bottom: 1.5rem;
        }
        
        .library-controls {
          display: flex;
          gap: 2rem;
          align-items: center;
          flex-wrap: wrap;
        }
        
        .view-toggle {
          display: flex;
          background: var(--card-background);
          border-radius: 8px;
          padding: 4px;
        }
        
        .view-toggle-btn {
          padding: 0.75rem 1.5rem;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s ease;
          font-weight: 500;
        }
        
        .view-toggle-btn.active {
          background: var(--primary);
          color: white;
        }
        
        .search-section {
          display: flex;
          gap: 1rem;
          flex: 1;
          max-width: 600px;
        }
        
        .library-search-input {
          flex: 1;
          padding: 0.75rem 1rem;
          background: var(--card-background);
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--text);
          font-size: 1rem;
        }
        
        .library-search-input:focus {
          outline: none;
          border-color: var(--primary);
        }
        
        .library-date-picker {
          padding: 0.75rem 1rem;
          background: var(--card-background);
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--text);
          font-size: 1rem;
          cursor: pointer;
        }
        
        .library-content {
          animation: fadeIn 0.3s ease;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @media (max-width: 768px) {
          .library-container {
            padding: 1rem;
          }
          
          .library-controls {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }
          
          .search-section {
            flex-direction: column;
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default LibraryPage;
