import React, { useState, useEffect, useRef } from "react";
import ActionBar from "../components/Actionbar";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import WorkoutHistory from "../components/WorkoutHistory";
import { Workout } from "../utils/types";
import EditWorkoutComponent from "../components/EditWorkout";
import ExerciseLibrary from "./exerciseLibrary";
import { useUser } from "@clerk/clerk-react";
import { 
  exportExerciseLogsCSV, 
  exportWorkoutsCSV, 
  exportAllDataJSON 
} from "../utils/exportData";

// Removed ToggleButton component - will use inline toggle instead

const LibraryPage: React.FC = () => {
  const { user } = useUser();
  const [view, setView] = useState<"exercises" | "history" | "selection">(
    "exercises"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportMenu]);

  const handleEditWorkout = (workout: Workout) => {
    setSelectedWorkout(workout);
  };

  const handleViewChange = (newView: "exercises" | "history" | "selection") => {
    setView(newView);
    setSearchTerm(""); // Reset search term when changing views
    setSelectedDate(null); // Reset date when changing views
    setSelectedWorkout(null); // Reset selected workout when changing views
  };

  const handleExport = async (exportType: 'exercises-csv' | 'workouts-csv' | 'all-json') => {
    if (!user) return;
    
    try {
      switch (exportType) {
        case 'exercises-csv':
          await exportExerciseLogsCSV(user);
          alert('Exercise logs exported successfully!');
          break;
        case 'workouts-csv':
          await exportWorkoutsCSV(user);
          alert('Workout templates exported successfully!');
          break;
        case 'all-json':
          await exportAllDataJSON(user);
          alert('All data exported successfully!');
          break;
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setShowExportMenu(false);
    }
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
              <div className="export-menu-container" ref={exportMenuRef}>
                <button
                  className="export-button"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  title="Export data"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Export
                </button>
                {showExportMenu && (
                  <div className="export-dropdown">
                    <button
                      className="export-option"
                      onClick={() => handleExport('exercises-csv')}
                    >
                      Exercise Logs (CSV)
                    </button>
                    <button
                      className="export-option"
                      onClick={() => handleExport('workouts-csv')}
                    >
                      Workout Templates (CSV)
                    </button>
                    <button
                      className="export-option"
                      onClick={() => handleExport('all-json')}
                    >
                      Full Backup (JSON)
                    </button>
                  </div>
                )}
              </div>
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
        
        .export-menu-container {
          position: relative;
        }
        
        .export-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all var(--transition-normal);
          box-shadow: var(--shadow-sm);
        }
        
        .export-button:hover {
          background: var(--primary-hover);
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }
        
        .export-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 0.5rem;
          background: var(--card-background);
          border: 1px solid var(--border);
          border-radius: 8px;
          box-shadow: var(--shadow-lg);
          min-width: 200px;
          z-index: 1000;
          overflow: hidden;
        }
        
        .export-option {
          display: block;
          width: 100%;
          padding: 0.75rem 1rem;
          background: none;
          border: none;
          border-bottom: 1px solid var(--border);
          color: var(--text);
          text-align: left;
          cursor: pointer;
          font-size: 0.9rem;
          transition: background 0.2s ease;
        }
        
        .export-option:last-child {
          border-bottom: none;
        }
        
        .export-option:hover {
          background: var(--hover);
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
