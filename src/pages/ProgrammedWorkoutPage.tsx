import React, { useState, useEffect } from "react";
import {
  getWorkoutForToday,
  saveWorkouts,
  calculateNextWeight,
  removeExerciseFromWorkout,
  getConsolidatedExercises,
  generateUserIdAsUuid,
} from "../utils/localStorageDB";
import { Workout, Exercise, Set } from "../utils/types";
import ActionBar from "../components/Actionbar";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { v5 as uuidv5 } from "uuid";
const NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

const normalizeExerciseName = (name: string) => name.toUpperCase();

const StartProgrammedLiftPage: React.FC = () => {
  const { user } = useUser();
  const [workoutToday, setWorkoutToday] = useState<Workout | null>(null);
  const [exerciseName, setExerciseName] = useState<string>("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [sets, setSets] = useState<
    { weight: number; reps: number; rir: number }[]
  >([{ weight: 1, reps: 10, rir: 0 }]);
  const [inputState, setInputState] = useState<
    Record<string, { weight: string; reps: string; rir: string }[]>
  >({});
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [completedSets, setCompletedSets] = useState(0);
  const [totalSets, setTotalSets] = useState(0);
  const navigate = useNavigate();
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [history, setHistory] = useState<Workout[]>([]);
  const [editingSet, setEditingSet] = useState<{
    exerciseName: string;
    setIndex: number;
    set: { weight: string; reps: string; rir: string };
  } | null>(null);

  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [customReps, setCustomReps] = useState(6);
  const [customRir, setCustomRir] = useState(0);
  const [customPercentIncrease, setCustomPercentIncrease] = useState(1.5);

  // Calculate total sets and completed sets whenever workout changes
  useEffect(() => {
    if (workoutToday) {
      let total = 0;
      let completed = 0;
      workoutToday.exercises.forEach((exercise) => {
        total += exercise.sets.length;
        // Count sets that are either logged in the workout or have input values
        const loggedSetsForExercise = exercise.sets.filter(
          (set) => set.isLogged
        ).length;
        const inputSetsForExercise =
          inputState[exercise.name]?.filter(
            (set) => set.weight && set.reps && set.rir
          ).length || 0;
        completed += loggedSetsForExercise + inputSetsForExercise;
      });
      setTotalSets(total);
      setCompletedSets(completed);
    }
  }, [workoutToday, inputState]);

  useEffect(() => {
    const fetchWorkout = async () => {
      if (!user) return;

      try {
        // For testing: Use a different date to simulate a new day
        // You can modify this date to test different scenarios
        const testDate = "2025-01-17"; // Day after sample data to see progressive overload immediately

        // First try to get today's workout
        const workout = await getWorkoutForToday(null, testDate, user);

        if (workout) {
          // Check if any sets are logged
          const hasLoggedSets = workout.exercises.some((exercise) =>
            exercise.sets.some((set) => set.isLogged)
          );

          if (hasLoggedSets) {
            // If there are logged sets, this is an in-progress workout
            setWorkoutToday(workout);
            const initialState: Record<
              string,
              { weight: string; reps: string; rir: string }[]
            > = {};

            workout.exercises.forEach((exercise) => {
              initialState[exercise.name] = exercise.sets.map(() => ({
                weight: "",
                reps: "",
                rir: "",
              }));
            });

            setInputState(initialState);
          } else {
            // If no sets are logged, create a fresh instance
            const freshWorkout: Workout = {
              ...workout,
              exercises: workout.exercises.map((exercise: Exercise) => ({
                ...exercise,
                sets: exercise.sets.map((set: Set) => ({
                  ...set,
                  isLogged: false,
                })),
              })),
            };
            setWorkoutToday(freshWorkout);
            const initialState: Record<
              string,
              { weight: string; reps: string; rir: string }[]
            > = {};

            freshWorkout.exercises.forEach((exercise) => {
              initialState[exercise.name] = exercise.sets.map(() => ({
                weight: "",
                reps: "",
                rir: "",
              }));
            });

            setInputState(initialState);
          }
        }
      } catch (error) {
        console.error("Error fetching workout:", error);
      }
    };

    fetchWorkout();
  }, [user]);

  useEffect(() => {
    if (user) {
      const loadExercises = async () => {
        const exercises = await getConsolidatedExercises(null, user);
        const exerciseNames = exercises.map((ex) => ex.name);
        setSuggestions(exerciseNames);
      };
      loadExercises();
    }
  }, [user]);

  const handleInputChange = (
    exerciseName: string,
    setIndex: number,
    field: keyof Set,
    value: string
  ) => {
    setInputState((prev) => ({
      ...prev,
      [exerciseName]: prev[exerciseName].map((set, idx) =>
        idx === setIndex ? { ...set, [field]: value } : set
      ),
    }));
  };

  const handleLogSet = async (exerciseName: string, setIndex: number) => {
    const input = inputState[exerciseName]?.[setIndex];
    if (!input?.weight || !input?.reps || !input?.rir) {
      alert("Please fill in all fields before logging a set.");
      return;
    }

    if (!workoutToday || !user) return;

    const newLog = {
      date: new Date().toISOString(),
      weight: Number(input.weight),
      reps: Number(input.reps),
      rir: Number(input.rir),
    };

    // Update local state
    const updatedWorkout = {
      ...workoutToday,
      exercises: workoutToday.exercises.map((exercise) => {
        if (exercise.name === exerciseName) {
          return {
            ...exercise,
            sets: exercise.sets.map((set, idx) =>
              idx === setIndex ? { ...set, ...newLog, isLogged: true } : set
            ),
            logs: [...(exercise.logs || []), newLog],
          };
        }
        return exercise;
      }),
    };

    setWorkoutToday(updatedWorkout);

    // Save to Supabase
    try {
      const workoutToSave: Workout = {
        ...updatedWorkout,
        id:
          updatedWorkout.id ||
          uuidv5(`${user.id}-${updatedWorkout.workout_name}`, NAMESPACE),
        user_id: generateUserIdAsUuid(user.id),
        clerk_user_id: user.id,
        assigned_days: updatedWorkout.assigned_days || [
          new Date().toISOString().split("T")[0],
        ],
        exercises: updatedWorkout.exercises.map((exercise) => ({
          ...exercise,
          logs: exercise.logs || [],
        })),
      };

      await saveWorkouts(null, [workoutToSave], user);
    } catch (error) {
      console.error("Error saving workout after logging set:", error);
      // Optionally show an error message to the user
      alert(
        "Failed to save workout state. Your changes may be lost if you leave the page."
      );
    }
  };

  const handleEditSet = (exerciseName: string, setIndex: number) => {
    const set = workoutToday?.exercises.find((e) => e.name === exerciseName)
      ?.sets[setIndex];

    if (set) {
      setEditingSet({
        exerciseName,
        setIndex,
        set: {
          weight: set.weight.toString(),
          reps: set.reps.toString(),
          rir: set.rir.toString(),
        },
      });
    }
  };

  const handleSaveEditSet = () => {
    if (!editingSet || !workoutToday) return;

    setHistory((prev) => [...prev, workoutToday]);
    setWorkoutToday((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        exercises: prev.exercises.map((exercise) =>
          exercise.name === editingSet.exerciseName
            ? {
                ...exercise,
                sets: exercise.sets.map((set, idx) =>
                  idx === editingSet.setIndex
                    ? {
                        weight: Number(editingSet.set.weight),
                        reps: Number(editingSet.set.reps),
                        rir: Number(editingSet.set.rir),
                        isLogged: true,
                      }
                    : set
                ),
              }
            : exercise
        ),
      };
    });
    setEditingSet(null);
  };

  const handleDeleteSet = (exerciseName: string, setIndex: number) => {
    if (!workoutToday) return;

    if (window.confirm("Are you sure you want to delete this logged set?")) {
      setHistory((prev) => [...prev, workoutToday]);
      setWorkoutToday((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          exercises: prev.exercises.map((exercise) =>
            exercise.name === exerciseName
              ? {
                  ...exercise,
                  sets: exercise.sets.map((set, idx) =>
                    idx === setIndex
                      ? { weight: 0, reps: 0, rir: 0, isLogged: false }
                      : set
                  ),
                }
              : exercise
          ),
        };
      });
    }
  };

  const handleUndo = () => {
    if (history.length > 0) {
      const previousState = history[history.length - 1];
      setWorkoutToday(previousState);
      setHistory((prev) => prev.slice(0, -1));
    }
  };

  const handleSaveWorkout = async () => {
    if (!workoutToday || !user) return;

    try {
      const workoutToSave: Workout = {
        ...workoutToday,
        id:
          workoutToday.id ||
          uuidv5(`${user.id}-${workoutToday.workout_name}`, NAMESPACE),
        user_id: generateUserIdAsUuid(user.id),
        clerk_user_id: user.id,
        assigned_days: workoutToday.assigned_days || [
          new Date().toISOString().split("T")[0],
        ],
        exercises: workoutToday.exercises.map((exercise) => ({
          ...exercise,
          logs: exercise.logs || [], // Ensure logs array exists
        })),
      };

      await saveWorkouts(null, [workoutToSave], user);
      alert("Workout saved successfully!");
      navigate("/");
    } catch (error) {
      console.error("Error saving workout:", error);
      alert("Failed to save workout.");
    }
  };

  const handleSaveAsNew = async () => {
    if (!workoutToday || !user || !exerciseName.trim()) return;

    try {
      const newWorkout = {
        ...workoutToday,
        workout_name: exerciseName.trim(),
        assigned_days: [new Date().toISOString().split("T")[0]],
      };

      await saveWorkouts(null, [newWorkout], user);
      alert("New workout saved successfully!");
      setShowSaveModal(false);
      setExerciseName("");
      navigate("/workout-plan");
    } catch (error) {
      console.error("Error saving new workout:", error);
      alert("Failed to save new workout.");
    }
  };

  const handleAddExercise = () => {
    if (exerciseName && sets.every((set) => set.weight > 0 && set.reps > 0)) {
      const newExercise: Exercise = {
        name: exerciseName,
        sets: sets.map((set) => ({
          weight: set.weight,
          reps: set.reps,
          rir: set.rir,
          isLogged: false,
        })),
        rir: sets[0].rir,
        logs: sets.map((set) => ({
          date: new Date().toISOString(),
          weight: set.weight,
          reps: set.reps,
          rir: set.rir,
        })),
      };

      setWorkoutToday((prev) => ({
        ...prev!,
        exercises: [...prev!.exercises, newExercise],
      }));

      // Reset state
      setExerciseName("");
      setSets([{ weight: 1, reps: 10, rir: 0 }]);
      setShowAddExerciseModal(false);
    }
  };

  const handleCalculateWeight = (exerciseName: string, setIndex: number) => {
    const setInput = inputState[exerciseName]?.[setIndex];
    if (!setInput) return;

    const reps = Number(setInput.reps || customReps); // Use customReps as default
    const rir = Number(setInput.rir || customRir); // Use customRir as default

    if (reps === 0) {
      alert("Please enter valid reps");
      return;
    }

    const exercise = workoutToday?.exercises.find(
      (ex) =>
        normalizeExerciseName(ex.name) === normalizeExerciseName(exerciseName)
    );

    if (exercise) {
      const calculatedWeight = calculateNextWeight(
        exercise,
        reps,
        rir,
        customPercentIncrease // Pass customPercentIncrease
      );
      setInputState((prev) => ({
        ...prev,
        [exerciseName]: prev[exerciseName].map((set, idx) =>
          idx === setIndex ? { ...set, weight: String(calculatedWeight) } : set
        ),
      }));
    }
  };

  const handleRemoveExercise = async (exerciseName: string) => {
    if (workoutToday && user) {
      const updatedWorkout = {
        ...workoutToday,
        exercises: workoutToday.exercises.filter(
          (ex) =>
            normalizeExerciseName(ex.name) !==
            normalizeExerciseName(exerciseName)
        ),
      };
      setWorkoutToday(updatedWorkout);
      await removeExerciseFromWorkout(
        null,
        workoutToday.workout_name,
        exerciseName,
        user
      );
    }
  };

  const handleAddSet = (exerciseName: string) => {
    if (workoutToday) {
      const updatedExercises = workoutToday.exercises.map((exercise) => {
        if (
          normalizeExerciseName(exercise.name) ===
          normalizeExerciseName(exerciseName)
        ) {
          return {
            ...exercise,
            sets: [...exercise.sets, { weight: 1, reps: 10, rir: 0 }],
          };
        }
        return exercise;
      });

      setWorkoutToday({
        ...workoutToday,
        exercises: updatedExercises,
      });

      setInputState((prev) => ({
        ...prev,
        [exerciseName]: [
          ...(prev[exerciseName] || []),
          { weight: "", reps: "", rir: "" },
        ],
      }));
    }
  };

  const handleReorderExercises = (result: DropResult) => {
    if (!result.destination || !workoutToday) return;

    const exercises = Array.from(workoutToday.exercises);
    const [removed] = exercises.splice(result.source.index, 1);
    exercises.splice(result.destination.index, 0, removed);

    setWorkoutToday({
      ...workoutToday,
      exercises: exercises,
    });
  };

  const handleRemoveSet = (exerciseName: string, setIndex: number) => {
    if (!workoutToday) return;

    setHistory((prev) => [...prev, workoutToday]);
    setWorkoutToday((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        exercises: prev.exercises.map((exercise) =>
          exercise.name === exerciseName
            ? {
                ...exercise,
                sets: exercise.sets.filter((_, idx) => idx !== setIndex),
              }
            : exercise
        ),
      };
    });

    setInputState((prev) => ({
      ...prev,
      [exerciseName]: prev[exerciseName].filter((_, idx) => idx !== setIndex),
    }));
  };

  return (
    <div className="programmed-workout-page">
      <ActionBar />
      <div className="workout-content">
        <div className="workout-stats-bar">
          <div className="stat-item">
            <div className="stat-item-label">Total Sets</div>
            <div className="stat-item-value">{totalSets}</div>
          </div>
          <div className="stat-item">
            <div className="stat-item-label">Completed</div>
            <div className="stat-item-value">{completedSets}</div>
          </div>
          <div className="stat-item">
            <div className="stat-item-label">Progress</div>
            <div className="stat-item-value">
              {Math.round((completedSets / totalSets) * 100)}%
            </div>
          </div>
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${(completedSets / totalSets) * 100}%` }}
          />
        </div>

        {workoutToday && (
          <DragDropContext onDragEnd={handleReorderExercises}>
            <Droppable droppableId="exercises">
              {(provided) => (
                <div
                  className="exercise-list"
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {workoutToday.exercises.map((exercise, exerciseIndex) => (
                    <Draggable
                      key={exercise.name}
                      draggableId={exercise.name}
                      index={exerciseIndex}
                      isDragDisabled={!isReorderMode}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...(isReorderMode ? provided.dragHandleProps : {})}
                          className="exercise-card"
                        >
                          <div className="exercise-header">
                            <h3>{exercise.name}</h3>
                            <div className="exercise-actions">
                              <button
                                onClick={() => handleAddSet(exercise.name)}
                                className="button action"
                              >
                                Add Set
                              </button>
                              <button
                                onClick={() =>
                                  handleRemoveExercise(exercise.name)
                                }
                                className="button danger"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                          {exercise.logs && exercise.logs.length > 0 && (
                            <div className="last-set-info">
                              <div className="set-history">
                                <div className="performance-header">
                                  <strong>Last Performance:</strong>
                                  <span className={`performance-trend ${
                                    exercise.logs.length > 1 && 
                                    exercise.logs[exercise.logs.length - 1].weight > 
                                    exercise.logs[exercise.logs.length - 2].weight ? "trend-up" : 
                                    exercise.logs.length > 1 && 
                                    exercise.logs[exercise.logs.length - 1].weight < 
                                    exercise.logs[exercise.logs.length - 2].weight ? "trend-down" : "trend-same"
                                  }`}>
                                    {exercise.logs.length > 1 && 
                                      exercise.logs[exercise.logs.length - 1].weight > 
                                      exercise.logs[exercise.logs.length - 2].weight ? "IMPROVING" : 
                                      exercise.logs.length > 1 && 
                                      exercise.logs[exercise.logs.length - 1].weight < 
                                      exercise.logs[exercise.logs.length - 2].weight ? "DECLINING" : "MAINTAINED"
                                    }
                                  </span>
                                </div>
                                <div className="performance-details">
                                  <span className="weight-highlight">{exercise.logs[exercise.logs.length - 1].weight}lbs</span>
                                  <span className="reps-highlight">× {exercise.logs[exercise.logs.length - 1].reps}</span>
                                  <span className="rir-highlight">@RIR{exercise.logs[exercise.logs.length - 1].rir}</span>
                                  <span className="date">
                                    ({new Date(
                                      exercise.logs[exercise.logs.length - 1].date
                                    ).toLocaleDateString()})
                                  </span>
                                </div>
                              </div>
                              <div className="progressive-overload-section">
                                <div className="recommended-weight">
                                  <strong>Recommended Progressive Overload:</strong><br/>
                                  <span className="overload-values">
                                    {calculateNextWeight(
                                      exercise,
                                      customReps,
                                      customRir,
                                      customPercentIncrease
                                    )}
                                    lbs × {customReps} reps, RIR {customRir} (+{customPercentIncrease}%)
                                  </span>
                                </div>
                                <div className="overload-controls">
                                  <button
                                    onClick={() => setShowCustomizeModal(true)}
                                    className="button secondary"
                                    title="Adjust progressive overload parameters"
                                  >
                                    Adjust Parameters
                                  </button>
                                  <button
                                    onClick={() => {
                                      const newWeight = calculateNextWeight(
                                        exercise,
                                        customReps,
                                        customRir,
                                        customPercentIncrease
                                      );
                                      // Auto-fill first set with recommended values
                                      setInputState((prev) => ({
                                        ...prev,
                                        [exercise.name]: prev[exercise.name] ? prev[exercise.name].map((set, idx) =>
                                          idx === 0 ? { 
                                            weight: String(newWeight), 
                                            reps: String(customReps), 
                                            rir: String(customRir) 
                                          } : set
                                        ) : [{ 
                                          weight: String(newWeight), 
                                          reps: String(customReps), 
                                          rir: String(customRir) 
                                        }]
                                      }));
                                    }}
                                    className="button primary"
                                    title="Apply recommended values to first set"
                                  >
                                    Apply Recommendation
                                  </button>
                                </div>
                              </div>

                              {showCustomizeModal && (
                                <div className="modal-overlay">
                                  <div className="modal-content">
                                    <h2>Customize Progressive Overload</h2>
                                    <p className="modal-description">
                                      Adjust these parameters to control how the progressive overload is calculated based on your last performance.
                                    </p>
                                    
                                    <div className="progressive-overload-preview">
                                      <strong>Current Recommendation:</strong>{" "}
                                      {calculateNextWeight(
                                        exercise,
                                        customReps,
                                        customRir,
                                        customPercentIncrease
                                      )}lbs × {customReps} reps, RIR {customRir}
                                    </div>

                                    <div className="modal-input-group">
                                      <label>Target Reps</label>
                                      <input
                                        type="number"
                                        value={customReps}
                                        onChange={(e) =>
                                          setCustomReps(Number(e.target.value))
                                        }
                                        className="input-field"
                                        min="1"
                                        max="30"
                                      />
                                      <small>Reps you plan to perform (1-30)</small>
                                    </div>
                                    
                                    <div className="modal-input-group">
                                      <label>Target RIR (Reps in Reserve)</label>
                                      <input
                                        type="number"
                                        value={customRir}
                                        onChange={(e) =>
                                          setCustomRir(Number(e.target.value))
                                        }
                                        className="input-field"
                                        min="0"
                                        max="5"
                                      />
                                      <small>How many reps left in the tank (0-5)</small>
                                    </div>
                                    
                                    <div className="modal-input-group">
                                      <label>Weight Increase (%)</label>
                                      <input
                                        type="number"
                                        step="0.5"
                                        value={customPercentIncrease}
                                        onChange={(e) =>
                                          setCustomPercentIncrease(
                                            Number(e.target.value)
                                          )
                                        }
                                        className="input-field"
                                        min="0"
                                        max="10"
                                      />
                                      <small>Additional weight increase (0-10%)</small>
                                    </div>
                                    
                                    <div className="quick-presets">
                                      <strong>Quick Presets:</strong>
                                      <div className="preset-buttons">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setCustomReps(8);
                                            setCustomRir(2);
                                            setCustomPercentIncrease(2.5);
                                          }}
                                          className="button secondary small"
                                        >
                                          Strength (8×2 +2.5%)
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setCustomReps(12);
                                            setCustomRir(1);
                                            setCustomPercentIncrease(1.5);
                                          }}
                                          className="button secondary small"
                                        >
                                          Hypertrophy (12×1 +1.5%)
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setCustomReps(15);
                                            setCustomRir(0);
                                            setCustomPercentIncrease(1.0);
                                          }}
                                          className="button secondary small"
                                        >
                                          Endurance (15×0 +1.0%)
                                        </button>
                                      </div>
                                    </div>
                                    <div className="modal-actions">
                                      <button
                                        onClick={() =>
                                          setShowCustomizeModal(false)
                                        }
                                        className="button primary"
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={() =>
                                          setShowCustomizeModal(false)
                                        }
                                        className="button secondary"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          <ul className="set-list">
                            {exercise.sets.map((set, setIndex) => (
                              <li key={setIndex} className="set-item">
                                {set.isLogged ? (
                                  <div className="logged-set">
                                    <div className="set-info">
                                      <span>{set.weight} lbs</span>
                                      <span>{set.reps} reps</span>
                                      <span>RIR {set.rir}</span>
                                    </div>
                                    <div className="button-group">
                                      <button
                                        onClick={() =>
                                          handleEditSet(exercise.name, setIndex)
                                        }
                                        className="button action"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleDeleteSet(
                                            exercise.name,
                                            setIndex
                                          )
                                        }
                                        className="button danger"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <button
                                      onClick={() =>
                                        handleRemoveSet(exercise.name, setIndex)
                                      }
                                      className="remove-set-btn"
                                      aria-label="Remove set"
                                    >
                                      ×
                                    </button>
                                    <div className="set-inputs">
                                      <div className="floating-label-container">
                                        <label className="floating-label">
                                          Weight (lbs)
                                        </label>
                                        <input
                                          type="number"
                                          value={
                                            inputState[exercise.name]?.[
                                              setIndex
                                            ]?.weight || ""
                                          }
                                          onChange={(e) =>
                                            handleInputChange(
                                              exercise.name,
                                              setIndex,
                                              "weight",
                                              e.target.value
                                            )
                                          }
                                          className="input-field"
                                        />
                                      </div>
                                      <div className="floating-label-container">
                                        <label className="floating-label">
                                          Reps
                                        </label>
                                        <input
                                          type="number"
                                          value={
                                            inputState[exercise.name]?.[
                                              setIndex
                                            ]?.reps || ""
                                          }
                                          onChange={(e) =>
                                            handleInputChange(
                                              exercise.name,
                                              setIndex,
                                              "reps",
                                              e.target.value
                                            )
                                          }
                                          className="input-field"
                                        />
                                      </div>
                                      <div className="floating-label-container">
                                        <label className="floating-label">
                                          RIR
                                        </label>
                                        <input
                                          type="number"
                                          value={
                                            inputState[exercise.name]?.[
                                              setIndex
                                            ]?.rir || ""
                                          }
                                          onChange={(e) =>
                                            handleInputChange(
                                              exercise.name,
                                              setIndex,
                                              "rir",
                                              e.target.value
                                            )
                                          }
                                          className="input-field"
                                        />
                                      </div>
                                    </div>
                                    <div className="set-actions">
                                      <button
                                        onClick={() =>
                                          handleLogSet(exercise.name, setIndex)
                                        }
                                        className="button primary"
                                      >
                                        Log Set
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleCalculateWeight(
                                            exercise.name,
                                            setIndex
                                          )
                                        }
                                        className="button secondary"
                                      >
                                        Calculate
                                      </button>
                                    </div>
                                  </>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}

        <div className="action-buttons">
          <button
            onClick={handleUndo}
            className="button secondary"
            disabled={history.length === 0}
          >
            Undo
          </button>
          <button
            onClick={() => setShowAddExerciseModal(true)}
            className="button primary"
          >
            Add Exercise
          </button>
          <button onClick={handleSaveWorkout} className="button primary">
            Save Workout
          </button>
          <button
            onClick={() => setIsReorderMode(!isReorderMode)}
            className={`button ${isReorderMode ? "primary" : "secondary"}`}
          >
            {isReorderMode ? "Reorder Exercises" : "Finish Reordering"}
          </button>
        </div>

        {showAddExerciseModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Add New Exercise</h2>
              <div className="modal-input-group">
                <label>Exercise Name</label>
                <input
                  type="text"
                  value={exerciseName}
                  onChange={(e) => setExerciseName(e.target.value)}
                  className="input-field"
                  list="exercise-suggestions"
                />
                <datalist id="exercise-suggestions">
                  {suggestions.map((suggestion, idx) => (
                    <option key={idx} value={suggestion} />
                  ))}
                </datalist>
              </div>
              <div className="modal-input-group">
                <label>Initial Sets</label>
                <div className="sets-preview">
                  {sets.map((set, index) => (
                    <div key={index} className="set-preview">
                      <div>
                        <label>Weight (lbs)</label>
                        <input
                          type="number"
                          value={set.weight}
                          onChange={(e) => {
                            const newSets = [...sets];
                            newSets[index].weight = Number(e.target.value);
                            setSets(newSets);
                          }}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label>Reps</label>
                        <input
                          type="number"
                          value={set.reps}
                          onChange={(e) => {
                            const newSets = [...sets];
                            newSets[index].reps = Number(e.target.value);
                            setSets(newSets);
                          }}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label>RIR</label>
                        <input
                          type="number"
                          value={set.rir}
                          onChange={(e) => {
                            const newSets = [...sets];
                            newSets[index].rir = Number(e.target.value);
                            setSets(newSets);
                          }}
                          className="input-field"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() =>
                    setSets([...sets, { weight: 1, reps: 10, rir: 0 }])
                  }
                  className="button secondary"
                >
                  Add Another Set
                </button>
              </div>
              <div className="modal-actions">
                <button
                  onClick={() => {
                    handleAddExercise();
                    setShowAddExerciseModal(false);
                  }}
                  className="button save"
                >
                  Add Exercise
                </button>
                <button
                  onClick={() => {
                    setShowAddExerciseModal(false);
                    setExerciseName("");
                    setSets([{ weight: 1, reps: 10, rir: 0 }]);
                  }}
                  className="button secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showSaveModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Save as New Workout</h2>
              <div className="modal-input-group">
                <label htmlFor="new-workout-name">Workout Name</label>
                <input
                  type="text"
                  id="new-workout-name"
                  value={exerciseName}
                  onChange={(e) => setExerciseName(e.target.value)}
                  className="input-field"
                  placeholder=" "
                />
              </div>
              <div className="modal-actions">
                <button onClick={handleSaveAsNew} className="button save">
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowSaveModal(false);
                    setExerciseName("");
                  }}
                  className="button secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {editingSet && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Edit Set</h3>
              <div className="modal-input-group">
                <label>Weight (lbs)</label>
                <input
                  type="number"
                  value={editingSet.set.weight}
                  onChange={(e) =>
                    setEditingSet((prev) => ({
                      ...prev!,
                      set: { ...prev!.set, weight: e.target.value },
                    }))
                  }
                  className="input-field"
                />
              </div>
              <div className="modal-input-group">
                <label>Reps</label>
                <input
                  type="number"
                  value={editingSet.set.reps}
                  onChange={(e) =>
                    setEditingSet((prev) => ({
                      ...prev!,
                      set: { ...prev!.set, reps: e.target.value },
                    }))
                  }
                  className="input-field"
                />
              </div>
              <div className="modal-input-group">
                <label>RIR</label>
                <input
                  type="number"
                  value={editingSet.set.rir}
                  onChange={(e) =>
                    setEditingSet((prev) => ({
                      ...prev!,
                      set: { ...prev!.set, rir: e.target.value },
                    }))
                  }
                  className="input-field"
                />
              </div>
              <div className="modal-actions">
                <button onClick={handleSaveEditSet} className="button primary">
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingSet(null)}
                  className="button secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StartProgrammedLiftPage;
