// src\pages\exerciseLibrary.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  getConsolidatedExercises,
  saveWorkouts,
  loadWorkouts,
  normalizeExerciseName,
} from "../utils/localStorageDB";
import { Exercise } from "../utils/types";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useUser } from "@clerk/clerk-react";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ExerciseLibrary: React.FC<{ searchTerm: string }> = ({ searchTerm }) => {
  const { user } = useUser();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<{
    exerciseIndex: number;
    logIndex: number;
    log: { weight: number; reps: number; rir: number; date: string };
  } | null>(null);

  // Memoize loadExercises with useCallback
  const loadExercises = useCallback(async () => {
    if (!user) return;
    const consolidatedExercises = await getConsolidatedExercises(
      null,
      user
    ); // Pass null here
    setExercises(consolidatedExercises);
  }, [user]); // Remove supabase as dependency

  useEffect(() => {
    loadExercises();
  }, [loadExercises]);

  const handleSelectExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
  };

  const getProgressData = (exercise: Exercise) => {
    if (!exercise.logs || exercise.logs.length === 0) return null;

    // Filter out logs with 0 reps or 0 weight
    const filteredLogs = exercise.logs.filter(
      (log) => log.reps > 0 && log.weight > 0
    );

    if (filteredLogs.length === 0) return null;

    const labels = filteredLogs.map((log) => log.date);
    const weights = filteredLogs.map((log) => log.weight);

    return {
      labels,
      datasets: [
        {
          label: "Weight",
          data: weights,
          borderColor: "rgba(75, 192, 192, 1)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          tension: 0.2,
        },
      ],
    };
  };

  const handleEditLog = async (exerciseIndex: number, logIndex: number) => {
    const exercise = exercises[exerciseIndex];
    const log = exercise.logs?.[logIndex];
    if (log) {
      setEditingLog({
        exerciseIndex,
        logIndex,
        log: {
          weight: log.weight,
          reps: log.reps,
          rir: log.rir,
          date: log.date,
        },
      });
      setIsEditModalOpen(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingLog || !user) return;

    const updatedExercises = [...exercises];
    const exercise = updatedExercises[editingLog.exerciseIndex];
    if (exercise.logs) {
      exercise.logs[editingLog.logIndex] = {
        ...exercise.logs[editingLog.logIndex],
        ...editingLog.log,
      };

      try {
        // Get all workouts that contain this exercise
        const allWorkouts = await loadWorkouts(null, user);
        const updatedWorkouts = allWorkouts.map((workout) => {
          const matchingExercise = workout.exercises.find(
            (ex) =>
              normalizeExerciseName(ex.name) ===
              normalizeExerciseName(exercise.name)
          );
          if (matchingExercise) {
            return {
              ...workout,
              exercises: workout.exercises.map((ex) =>
                normalizeExerciseName(ex.name) ===
                normalizeExerciseName(exercise.name)
                  ? { ...ex, logs: exercise.logs }
                  : ex
              ),
            };
          }
          return workout;
        });

        await saveWorkouts(null, updatedWorkouts, user);
        setExercises(updatedExercises);
        setIsEditModalOpen(false);
        setEditingLog(null);
      } catch (error) {
        console.error("Error saving edit:", error);
      }
    }
  };

  const handleDeleteLog = async (exerciseIndex: number, logIndex: number) => {
    if (!user) return;

    const updatedExercises = [...exercises];
    const exercise = updatedExercises[exerciseIndex];
    if (exercise.logs) {
      exercise.logs = exercise.logs.filter((_, index) => index !== logIndex);

      try {
        // Get all workouts that contain this exercise
        const allWorkouts = await loadWorkouts(null, user);
        const updatedWorkouts = allWorkouts.map((workout) => {
          const matchingExercise = workout.exercises.find(
            (ex) =>
              normalizeExerciseName(ex.name) ===
              normalizeExerciseName(exercise.name)
          );
          if (matchingExercise) {
            return {
              ...workout,
              exercises: workout.exercises.map((ex) =>
                normalizeExerciseName(ex.name) ===
                normalizeExerciseName(exercise.name)
                  ? { ...ex, logs: exercise.logs }
                  : ex
              ),
            };
          }
          return workout;
        });

        await saveWorkouts(null, updatedWorkouts, user);
        setExercises(updatedExercises);
      } catch (error) {
        console.error("Error deleting log:", error);
      }
    }
  };

  return (
    <div className="exercise-library-page">
      <div className="exercise-grid">
          {exercises
            .filter((exercise) =>
              exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((exercise, exerciseIndex) => (
              <div
                key={exerciseIndex}
                className={`exercise-card ${selectedExercise?.name === exercise.name ? 'expanded' : ''}`}
                onClick={() => handleSelectExercise(exercise)}
              >
                <div className="exercise-card-header">
                  <h3>{exercise.name}</h3>
                  <div className="exercise-stats">
                    <span className="stat-item">
                      {exercise.logs?.length || 0} logs
                    </span>
                    {exercise.logs && exercise.logs.length > 0 && (
                      <span className="stat-item">
                        Max: {Math.max(...exercise.logs.map(l => l.weight))} lbs
                      </span>
                    )}
                  </div>
                </div>
                {selectedExercise?.name === exercise.name && (
                  <div className="exercise-details">
                    {getProgressData(exercise) ? (
                      <div className="chart-container">
                        <Line data={getProgressData(exercise)!} />
                      </div>
                    ) : (
                      <p>No data available</p>
                    )}

                    <h3>Data Points</h3>
                    {exercise.logs && exercise.logs.length > 0 ? (
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Weight</th>
                            <th>Reps</th>
                            <th>RIR</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {exercise.logs.map((log, logIndex) => (
                            <tr key={logIndex}>
                              <td>{log.date}</td>
                              <td>{log.weight} lbs</td>
                              <td>{log.reps}</td>
                              <td>{log.rir}</td>
                              <td>
                                <div className="button-group">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditLog(exerciseIndex, logIndex);
                                    }}
                                    className="button-primary"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (
                                        window.confirm(
                                          "Are you sure you want to delete this log?"
                                        )
                                      ) {
                                        handleDeleteLog(
                                          exerciseIndex,
                                          logIndex
                                        );
                                      }
                                    }}
                                    className="button-primary"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p>No logs available</p>
                    )}
                  </div>
                )}
              </div>
            ))}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && editingLog && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Edit Log</h2>
              <div className="edit-form">
                <div className="input-group">
                  <label>Date:</label>
                  <input
                    type="date"
                    value={editingLog.log.date}
                    onChange={(e) =>
                      setEditingLog({
                        ...editingLog,
                        log: {
                          ...editingLog.log,
                          date: e.target.value,
                        },
                      })
                    }
                    className="input-field"
                  />
                </div>
                <div className="input-group">
                  <label>Weight (lbs):</label>
                  <input
                    type="number"
                    value={editingLog.log.weight}
                    onChange={(e) =>
                      setEditingLog({
                        ...editingLog,
                        log: {
                          ...editingLog.log,
                          weight: Number(e.target.value),
                        },
                      })
                    }
                    className="input-field"
                  />
                </div>
                <div className="input-group">
                  <label>Reps:</label>
                  <input
                    type="number"
                    value={editingLog.log.reps}
                    onChange={(e) =>
                      setEditingLog({
                        ...editingLog,
                        log: {
                          ...editingLog.log,
                          reps: Number(e.target.value),
                        },
                      })
                    }
                    className="input-field"
                  />
                </div>
                <div className="input-group">
                  <label>RIR:</label>
                  <input
                    type="number"
                    value={editingLog.log.rir}
                    onChange={(e) =>
                      setEditingLog({
                        ...editingLog,
                        log: { ...editingLog.log, rir: Number(e.target.value) },
                      })
                    }
                    className="input-field"
                  />
                </div>
                <div className="modal-actions">
                  <button onClick={handleSaveEdit} className="save-button">
                    Save Changes
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditModalOpen(false);
                      setEditingLog(null);
                    }}
                    className="cancel-button"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      
      <style>{`
        .exercise-library-page {
          padding: 1rem;
        }
        
        .exercise-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }
        
        .exercise-card {
          background: var(--card-background);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .exercise-card:hover {
          border-color: var(--primary);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .exercise-card.expanded {
          grid-column: 1 / -1;
          max-width: 800px;
          margin: 0 auto;
        }
        
        .exercise-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .exercise-card-header h3 {
          color: var(--text);
          margin: 0;
          font-size: 1.25rem;
        }
        
        .exercise-stats {
          display: flex;
          gap: 1rem;
        }
        
        .stat-item {
          font-size: 0.875rem;
          color: var(--text-secondary);
          background: var(--background);
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
        }
        
        .exercise-details {
          margin-top: 1.5rem;
        }
        
        .chart-container {
          background: var(--background);
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 2rem;
          height: 300px;
        }
        
        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1rem;
        }
        
        .data-table th {
          background: var(--background);
          padding: 0.75rem;
          text-align: left;
          font-weight: 600;
          color: var(--text-secondary);
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .data-table td {
          padding: 0.75rem;
          border-top: 1px solid var(--border);
          color: var(--text);
        }
        
        .data-table tr:hover {
          background: var(--background);
        }
        
        .button-group {
          display: flex;
          gap: 0.5rem;
        }
        
        .button-primary {
          padding: 0.5rem 1rem;
          background: var(--primary);
          border: none;
          border-radius: 6px;
          color: white;
          cursor: pointer;
          transition: opacity 0.2s ease;
        }
        
        .button-primary:hover {
          opacity: 0.8;
        }
        
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .modal-content {
          background: var(--card-background);
          padding: 2rem;
          border-radius: 12px;
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }
        
        .modal-content h2 {
          margin-bottom: 1.5rem;
          color: var(--text);
        }
        
        .edit-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .input-group label {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }
        
        .input-field {
          padding: 0.75rem;
          background: var(--background);
          border: 1px solid var(--border);
          border-radius: 6px;
          color: var(--text);
          font-size: 1rem;
        }
        
        .input-field:focus {
          outline: none;
          border-color: var(--primary);
        }
        
        .modal-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
        }
        
        .save-button {
          flex: 1;
          padding: 0.75rem;
          background: var(--primary);
          border: none;
          border-radius: 6px;
          color: white;
          font-weight: 500;
          cursor: pointer;
        }
        
        .cancel-button {
          flex: 1;
          padding: 0.75rem;
          background: transparent;
          border: 1px solid var(--border);
          border-radius: 6px;
          color: var(--text);
          font-weight: 500;
          cursor: pointer;
        }
        
        @media (max-width: 768px) {
          .exercise-grid {
            grid-template-columns: 1fr;
          }
          
          .exercise-stats {
            flex-direction: column;
            gap: 0.5rem;
          }
          
          .data-table {
            font-size: 0.875rem;
          }
          
          .data-table th,
          .data-table td {
            padding: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ExerciseLibrary;
