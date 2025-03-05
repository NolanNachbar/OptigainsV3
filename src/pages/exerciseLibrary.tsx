// src\pages\exerciseLibrary.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  getConsolidatedExercises,
  saveWorkouts,
  loadWorkouts,
  normalizeExerciseName,
} from "../utils/SupaBase";
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
import ActionBar from "../components/Actionbar";
import { useUser } from "@clerk/clerk-react";
import { useSupabaseClient } from "../utils/supabaseClient"; // Import the custom Supabase client hook

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
  const supabase = useSupabaseClient();
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
      supabase,
      user
    ); // Pass supabase here
    setExercises(consolidatedExercises);
  }, [user, supabase]); // Add user and supabase as dependencies

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
        const allWorkouts = await loadWorkouts(supabase, user);
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

        await saveWorkouts(supabase, updatedWorkouts, user);
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
        const allWorkouts = await loadWorkouts(supabase, user);
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

        await saveWorkouts(supabase, updatedWorkouts, user);
        setExercises(updatedExercises);
      } catch (error) {
        console.error("Error deleting log:", error);
      }
    }
  };

  return (
    <div>
      <ActionBar />
      <div style={{ marginTop: "60px" }}>
        <h1>Exercise Library</h1>
        <ul>
          {exercises
            .filter((exercise) =>
              exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((exercise, exerciseIndex) => (
              <li
                key={exerciseIndex}
                onClick={() => handleSelectExercise(exercise)}
              >
                <div className="exercise-header">
                  <h3>{exercise.name}</h3>
                </div>
                {selectedExercise?.name === exercise.name && (
                  <div className="exercise-details">
                    {getProgressData(exercise) ? (
                      <div className="chart-container">
                        <Line data={getProgressData(exercise)!} />
                        <button
                          className="edit-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsEditModalOpen(true);
                          }}
                        >
                          ✏️ Edit History
                        </button>
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
              </li>
            ))}
        </ul>

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
      </div>
    </div>
  );
};

export default ExerciseLibrary;
