import React, { useState, useEffect } from "react";
import {
  getWorkoutForToday,
  saveWorkouts,
  calculateNextWeight,
  loadWorkouts,
  removeExerciseFromWorkout,
  getConsolidatedExercises,
} from "../utils/localStorage";
import { Workout, Exercise, Set } from "../utils/types";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import ActionBar from "../components/Actionbar";

const normalizeExerciseName = (name: string) => name.toUpperCase();

const StartProgrammedLiftPage: React.FC = () => {
  const [workoutToday, setWorkoutToday] = useState<Workout | null>(null);
  const [userLog, setUserLog] = useState<Record<string, Set[]>>({});
  const [editing, setEditing] = useState(true);
  const [exerciseName, setExerciseName] = useState<string>("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [sets, setSets] = useState<
    { weight: number; reps: number; rir: number }[]
  >([{ weight: 1, reps: 10, rir: 0 }]); // Changed to hold an array of sets
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [history, setHistory] = useState<Workout[]>([]);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const workout = getWorkoutForToday(today);
    setWorkoutToday(workout);
    const consolidatedExercises = getConsolidatedExercises();
    const exerciseNames = consolidatedExercises.map((ex) => ex.name);
    setSuggestions(exerciseNames);
  }, []);

  const updateWorkoutWithHistory = (updatedWorkout: Workout) => {
    setHistory((prevHistory) => [...prevHistory, workoutToday!]); // Save current state to history
    setWorkoutToday(updatedWorkout); // Update workout state
  };

  // Undo the latest change
  const handleUndo = () => {
    if (history.length > 0) {
      const previousWorkout = history[history.length - 1]; // Get the latest state from history
      setHistory((prevHistory) => prevHistory.slice(0, -1)); // Remove the latest state from history
      setWorkoutToday(previousWorkout); // Restore the previous state
    }
  };

  const handleReorderExercises = (result: DropResult) => {
    const { source, destination } = result;

    // If there is no destination, just return
    if (!destination) return;

    // Reorder the exercises array

    const reorderedExercises = Array.from(workoutToday?.exercises || []);
    const [removed] = reorderedExercises.splice(source.index, 1);
    reorderedExercises.splice(destination.index, 0, removed);

    const updatedWorkout = {
      ...workoutToday!,
      exercises: reorderedExercises,
    };
    updateWorkoutWithHistory(updatedWorkout);
    setWorkoutToday(updatedWorkout);
  };

  // const handleExerciseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setCurrentExercise(e.target.value);
  // };

  const handleAddExercise = () => {
    if (
      exerciseName &&
      sets.every((set) => set.weight > 0 && set.reps > 0 && set.rir >= 0)
    ) {
      const newExercise: Exercise = {
        name: exerciseName,
        sets: sets,
        rir: sets[0].rir,
        logs: [
          {
            date: new Date().toISOString(),
            weight: sets[0].weight,
            reps: sets[0].reps,
            rir: sets[0].rir,
          },
        ],
      };

      if (workoutToday) {
        const updatedWorkout = {
          ...workoutToday,
          exercises: [...workoutToday.exercises, newExercise], // Add the new exercise
        };

        setWorkoutToday(updatedWorkout);
        updateWorkoutWithHistory(updatedWorkout); // Update the state with the new workout
        setExerciseName("");
        setSets([{ weight: 1, reps: 10, rir: 0 }]);
        setIsModalOpen(false); // Close the modal after adding the exercise
      }
    } else {
      alert("Please fill all fields with valid values.");
    }
  };

  const handleInputChange = (
    exerciseName: string,
    setIndex: number,
    field: keyof Set,
    value: string
  ) => {
    setUserLog((prev) => ({
      ...prev,
      [exerciseName]: prev[exerciseName]
        ? prev[exerciseName].map((set, idx) =>
            idx === setIndex ? { ...set, [field]: value } : set
          )
        : Array.from(
            {
              length:
                workoutToday?.exercises.find((ex) => ex.name === exerciseName)
                  ?.sets.length || 1,
            },
            () => ({
              weight: 0,
              reps: 0,
              rir: 0,
            })
          ),
    }));
  };

  const handleCalculateWeight = (exerciseName: string, setIndex: number) => {
    const reps = Number(userLog[exerciseName]?.[setIndex]?.reps || 0);
    const rir = Number(userLog[exerciseName]?.[setIndex]?.rir || 0);

    if (workoutToday) {
      const exercise = workoutToday.exercises.find(
        (ex) =>
          normalizeExerciseName(ex.name) === normalizeExerciseName(exerciseName)
      );
      if (exercise) {
        const recommendedWeight = calculateNextWeight(
          exercise,
          Number(reps),
          Number(rir)
        );
        handleInputChange(
          exerciseName,
          setIndex,
          "weight",
          String(recommendedWeight)
        );
      } else {
        alert("Exercise not found in today’s workout.");
      }
    }
  };

  const handleRemoveExercise = (exerciseName: string) => {
    if (workoutToday) {
      removeExerciseFromWorkout(workoutToday.workoutName, exerciseName);
      const updatedWorkout =
        loadWorkouts().find(
          (w) => w.workoutName === workoutToday.workoutName
        ) || null;
      setWorkoutToday(updatedWorkout);
      if (updatedWorkout) updateWorkoutWithHistory(updatedWorkout);
    }
  };

  const handleRemoveSet = (exerciseName: string, setIndex: number) => {
    if (workoutToday) {
      const updatedExercises = workoutToday.exercises.map((exercise) => {
        if (
          normalizeExerciseName(exercise.name) ===
          normalizeExerciseName(exerciseName)
        ) {
          return {
            ...exercise,
            sets: exercise.sets.filter((_, idx) => idx !== setIndex),
          };
        }
        return exercise;
      });

      setWorkoutToday({
        ...workoutToday,
        exercises: updatedExercises,
      });

      // Update the log state as well
      setUserLog((prevLog) => ({
        ...prevLog,
        [exerciseName]: prevLog[exerciseName]?.filter(
          (_, idx) => idx !== setIndex
        ),
      }));
    }
  };

  const handleSaveWorkout = () => {
    if (workoutToday) {
      const today = new Date().toISOString().split("T")[0];
      const updatedWorkout: Workout = {
        ...workoutToday,
        exercises: workoutToday.exercises.map((exercise) => ({
          ...exercise,
          sets: userLog[exercise.name] || exercise.sets,
          logs: (userLog[exercise.name] || []).map((set) => ({
            ...set,
            date: today,
          })),
        })),
      };

      const workouts = loadWorkouts();
      const workoutIndex = workouts.findIndex(
        (workout) => workout.workoutName === workoutToday.workoutName
      );

      if (workoutIndex !== -1) {
        workouts[workoutIndex] = updatedWorkout;
      } else {
        workouts.push(updatedWorkout);
      }

      saveWorkouts(workouts);
    } else {
      alert("No workout to save.");
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
    }
  };

  return (
    <div className="container">
      <ActionBar />
      <div style={{ marginTop: "60px" }}>
        <h1>Today's Workout</h1>
        {workoutToday ? (
          <>
            <h2>{workoutToday.workoutName}</h2>

            <DragDropContext onDragEnd={handleReorderExercises}>
              {!editing ? (
                <Droppable droppableId="exercises">
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="exercise-list"
                    >
                      {workoutToday.exercises.map((exercise, index) => (
                        <Draggable
                          key={exercise.name}
                          draggableId={exercise.name}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="exercise-card"
                            >
                              <div className="exercise-header">
                                <h3>{exercise.name}</h3>
                                <button
                                  onClick={() =>
                                    handleRemoveExercise(exercise.name)
                                  }
                                  className="remove-exercise-btn"
                                >
                                  🗑️
                                </button>
                              </div>
                              <ul className="set-list">
                                {exercise.sets.map((set, setIndex) => (
                                  <li key={setIndex} className="set-item">
                                    <div className="set-inputs">
                                      <input
                                        type="number"
                                        value={
                                          userLog[exercise.name]?.[setIndex]
                                            ?.weight ||
                                          set.weight ||
                                          ""
                                        }
                                        onChange={(e) =>
                                          handleInputChange(
                                            exercise.name,
                                            setIndex,
                                            "weight",
                                            e.target.value
                                          )
                                        }
                                        placeholder="Weight"
                                        className="input-field"
                                      />
                                      <input
                                        type="number"
                                        value={
                                          userLog[exercise.name]?.[setIndex]
                                            ?.reps ||
                                          set.reps ||
                                          ""
                                        }
                                        onChange={(e) =>
                                          handleInputChange(
                                            exercise.name,
                                            setIndex,
                                            "reps",
                                            e.target.value
                                          )
                                        }
                                        placeholder="Reps"
                                        className="input-field"
                                      />
                                      <input
                                        type="number"
                                        value={
                                          userLog[exercise.name]?.[setIndex]
                                            ?.rir ||
                                          set.rir ||
                                          0
                                        }
                                        onChange={(e) =>
                                          handleInputChange(
                                            exercise.name,
                                            setIndex,
                                            "rir",
                                            e.target.value
                                          )
                                        }
                                        placeholder="RIR"
                                        className="input-field"
                                      />
                                    </div>
                                    <div className="button-group">
                                      {exercise.logs &&
                                        exercise.logs.length > 0 && (
                                          <button
                                            onClick={() =>
                                              handleCalculateWeight(
                                                exercise.name,
                                                setIndex
                                              )
                                            }
                                            className="calculate-btn"
                                          >
                                            Calculate Weight
                                          </button>
                                        )}

                                      <button
                                        onClick={() =>
                                          handleRemoveSet(
                                            exercise.name,
                                            setIndex
                                          )
                                        }
                                        className="button"
                                      >
                                        Remove Set
                                      </button>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                              <button
                                onClick={() => handleAddSet(exercise.name)}
                                className="button"
                              >
                                ➕ Add Set
                              </button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              ) : (
                // When not editing, just display exercises without drag-and-drop
                workoutToday.exercises.map((exercise) => (
                  <div key={exercise.name} className="exercise-card">
                    <div className="exercise-header">
                      <h3>{exercise.name}</h3>
                      <button
                        onClick={() => handleRemoveExercise(exercise.name)}
                        className="remove-exercise-btn"
                      >
                        🗑️
                      </button>
                    </div>
                    <ul className="set-list">
                      {exercise.sets.map((set, setIndex) => (
                        <li key={setIndex} className="set-item">
                          <div className="set-inputs">
                            <input
                              type="number"
                              value={
                                userLog[exercise.name]?.[setIndex]?.weight ||
                                set.weight ||
                                ""
                              }
                              onChange={(e) =>
                                handleInputChange(
                                  exercise.name,
                                  setIndex,
                                  "weight",
                                  e.target.value
                                )
                              }
                              placeholder="Weight"
                              className="input-field"
                            />
                            <input
                              type="number"
                              value={
                                userLog[exercise.name]?.[setIndex]?.reps ||
                                set.reps ||
                                ""
                              }
                              onChange={(e) =>
                                handleInputChange(
                                  exercise.name,
                                  setIndex,
                                  "reps",
                                  e.target.value
                                )
                              }
                              placeholder="Reps"
                              className="input-field"
                            />
                            <input
                              type="number"
                              value={
                                userLog[exercise.name]?.[setIndex]?.rir ||
                                set.rir ||
                                0
                              }
                              onChange={(e) =>
                                handleInputChange(
                                  exercise.name,
                                  setIndex,
                                  "rir",
                                  e.target.value
                                )
                              }
                              placeholder="RIR"
                              className="input-field"
                            />
                          </div>
                          <div className="button-group">
                            {exercise.logs && exercise.logs.length > 0 && (
                              <button
                                onClick={() =>
                                  handleCalculateWeight(exercise.name, setIndex)
                                }
                                className="calculate-btn"
                              >
                                Calculate Weight
                              </button>
                            )}

                            <button
                              onClick={() =>
                                handleRemoveSet(exercise.name, setIndex)
                              }
                              className="remove-btn"
                            >
                              Remove Set
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => handleAddSet(exercise.name)}
                      className="button"
                    >
                      ➕ Add Set
                    </button>
                  </div>
                ))
              )}
            </DragDropContext>

            <div className="action-buttons">
              <button
                onClick={() => setIsModalOpen(true)}
                className="action-btn"
              >
                ➕ Add Exercise
              </button>
              <button
                onClick={() => {
                  if (workoutToday) {
                    handleSaveWorkout();
                  }
                  setEditing((editing) => !editing);
                }}
                className="action-btn"
              >
                {editing ? "🔀 Rearrange Exercises" : "✅ Finish Rearranging"}
              </button>
              {/* Undo Button */}
              <button
                onClick={handleUndo}
                className="action-btn"
                disabled={history.length === 0}
              >
                ↩️ Undo
              </button>
            </div>
          </>
        ) : (
          <p>No workout for today.</p>
        )}

        {/* Modal for Adding Exercise */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Add Exercise</h2>
              <div>
                <label>Exercise Name: </label>
                <input
                  type="text"
                  value={exerciseName}
                  onChange={(e) => setExerciseName(e.target.value)}
                  list="exercise-suggestions" // Link to the datalist
                  className="input-field"
                />
                {/* Datalist for exercise suggestions */}
                <datalist id="exercise-suggestions">
                  {suggestions.map((suggestion, idx) => (
                    <option key={idx} value={suggestion} />
                  ))}
                </datalist>
              </div>

              {/* Set Details */}
              {sets.map((set, index) => (
                <div key={index} className="set-input-group">
                  <label>Set {index + 1} - Weight: </label>
                  <input
                    type="number"
                    value={set.weight}
                    onChange={(e) => {
                      const updatedSets = [...sets];
                      updatedSets[index].weight = Number(e.target.value);
                      setSets(updatedSets);
                    }}
                    className="input-field"
                  />
                  <label> Reps: </label>
                  <input
                    type="number"
                    value={set.reps}
                    onChange={(e) => {
                      const updatedSets = [...sets];
                      updatedSets[index].reps = Number(e.target.value);
                      setSets(updatedSets);
                    }}
                    className="input-field"
                  />
                  <label> RIR: </label>
                  <input
                    type="number"
                    value={set.rir}
                    onChange={(e) => {
                      const updatedSets = [...sets];
                      updatedSets[index].rir = Number(e.target.value);
                      setSets(updatedSets);
                    }}
                    className="input-field"
                  />
                </div>
              ))}

              {/* Add Set Button */}
              <button
                onClick={() =>
                  setSets([...sets, { weight: 1, reps: 10, rir: 0 }])
                }
                className="add-set-btn"
              >
                Add Set
              </button>

              {/* Add Exercise Button */}
              <button onClick={handleAddExercise} className="add-exercise-btn">
                ➕ Add Exercise
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="close-modal-btn"
              >
                Close
              </button>
            </div>
          </div>
        )}

        <button onClick={handleSaveWorkout} className="save-btn">
          💾 Save Workout
        </button>
      </div>
    </div>
  );
};
export default StartProgrammedLiftPage;
