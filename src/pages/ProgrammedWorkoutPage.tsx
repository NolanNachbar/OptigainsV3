import React, { useState, useEffect } from "react";
import {
  getWorkoutForToday,
  saveWorkouts,
  calculateNextWeight,
  loadWorkouts,
  removeExerciseFromWorkout,
  getConsolidatedExercises,
  lastSet,
} from "../utils/SupaBase";
import { Workout, Exercise, Set } from "../utils/types";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import ActionBar from "../components/Actionbar";
import { useUser } from "@clerk/clerk-react";
import { useSupabaseClient } from "../utils/supabaseClient"; // Import the hook

const normalizeExerciseName = (name: string) => name.toUpperCase();

const StartProgrammedLiftPage: React.FC = () => {
  const { user } = useUser();
  const supabase = useSupabaseClient(); // Initialize Supabase client
  const [workoutToday, setWorkoutToday] = useState<Workout | null>(null);
  const [userLog, setUserLog] = useState<Record<string, Set[]>>({});
  const [editing, setEditing] = useState(true);
  const [exerciseName, setExerciseName] = useState<string>("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [sets, setSets] = useState<
    { weight: number; reps: number; rir: number }[]
  >([{ weight: 1, reps: 10, rir: 0 }]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [history, setHistory] = useState<Workout[]>([]);
  const [inputState, setInputState] = useState<
    Record<string, { weight: string; reps: string; rir: string }[]>
  >({});
  const [loggedSets, setLoggedSets] = useState<Record<string, boolean[]>>({});
  const [lastLog, setLastLogged] = useState<
    Record<string, { weight: string; reps: string; rir: string }[]>
  >({});

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const fetchWorkout = async () => {
      if (user) {
        const workout = await getWorkoutForToday(supabase, today, user); // Pass supabase
        setWorkoutToday(workout);

        const consolidatedExercises = await getConsolidatedExercises(
          supabase,
          user
        ); // Pass supabase
        const exerciseNames = consolidatedExercises.map((ex) => ex.name);
        setSuggestions(exerciseNames);

        if (workout) {
          const initialState: Record<
            string,
            { weight: string; reps: string; rir: string }[]
          > = {};
          const loggedState: Record<string, boolean[]> = {};

          workout.exercises.forEach((exercise) => {
            initialState[exercise.name] = exercise.sets.map(() => ({
              weight: "",
              reps: "",
              rir: "",
            }));
            loggedState[exercise.name] = exercise.sets.map(() => false);
          });

          setInputState(initialState);
          setLoggedSets(loggedState);
        }
      }
    };

    fetchWorkout();
  }, [user, supabase]); // Add supabase to dependencies

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
          exercises: [...workoutToday.exercises, newExercise],
        };

        setWorkoutToday(updatedWorkout);
        updateWorkoutWithHistory(updatedWorkout);

        // Initialize inputState for the new exercise
        setInputState((prev) => ({
          ...prev,
          [exerciseName]: sets.map(() => ({ weight: "", reps: "", rir: "" })),
        }));

        // Initialize loggedSets for the new exercise
        setLoggedSets((prev) => ({
          ...prev,
          [exerciseName]: sets.map(() => false), // Initialize all sets as not logged
        }));

        setExerciseName("");
        setSets([{ weight: 1, reps: 10, rir: 0 }]);
        setIsModalOpen(false);
      }
    } else {
      alert("Please fill all fields with valid values.");
    }
  };

  const handleLogSet = (exerciseName: string, setIndex: number) => {
    const setInput = inputState[exerciseName]?.[setIndex];
    if (
      !setInput ||
      setInput.weight === "" ||
      setInput.reps === "" ||
      setInput.rir === ""
    ) {
      alert("Please fill in all fields before logging a set.");
      return;
    }

    setWorkoutToday((prevWorkout) => {
      if (!prevWorkout) return prevWorkout;

      const updatedExercises = prevWorkout.exercises.map((exercise) =>
        exercise.name === exerciseName
          ? {
              ...exercise,
              sets: exercise.sets.map((set, idx) =>
                idx === setIndex
                  ? {
                      ...set,
                      weight: Number(setInput.weight),
                      reps: Number(setInput.reps),
                      rir: Number(setInput.rir),
                    }
                  : set
              ),
              logs: [
                ...(exercise.logs || []),
                {
                  date: new Date().toISOString().split("T")[0], // Log the current date
                  weight: Number(setInput.weight),
                  reps: Number(setInput.reps),
                  rir: Number(setInput.rir),
                },
              ],
            }
          : exercise
      );

      return {
        ...prevWorkout,
        exercises: updatedExercises,
      };
    });

    // Mark the set as logged
    setLoggedSets((prev) => ({
      ...prev,
      [exerciseName]: prev[exerciseName]
        ? prev[exerciseName].map((logged, idx) =>
            idx === setIndex ? true : logged
          )
        : Array(sets.length)
            .fill(false)
            .map((_, idx) => (idx === setIndex ? true : false)), // Handle new exercises
    }));

    // Clear the input fields for the logged set
    setInputState((prev) => ({
      ...prev,
      [exerciseName]: prev[exerciseName].map((set, idx) =>
        idx === setIndex ? { weight: "", reps: "", rir: "" } : set
      ),
    }));
  };

  const toggleEditSet = (exerciseName: string, setIndex: number) => {
    setLoggedSets((prev) => ({
      ...prev,
      [exerciseName]: prev[exerciseName].map((logged, idx) =>
        idx === setIndex ? !logged : logged
      ),
    }));
  };

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

  const handleShowLastSet = async (exerciseName: string) => {
    if (user) {
      const allWorkouts = await loadWorkouts(supabase, user); // Pass supabase
      let lastLogSet: { weight: number; reps: number; rir: number } | null =
        null;

      for (const workout of allWorkouts) {
        for (const exercise of workout.exercises) {
          if (
            normalizeExerciseName(exercise.name) ===
            normalizeExerciseName(exerciseName)
          ) {
            const last = lastSet(exercise);
            if (last) {
              lastLogSet = last;
              break;
            }
          }
        }
        if (lastLogSet) break;
      }

      if (lastLogSet) {
        setLastLogged((prev) => ({
          ...prev,
          [exerciseName]: [
            {
              weight: String(lastLogSet.weight),
              reps: String(lastLogSet.reps),
              rir: String(lastLogSet.rir),
            },
          ],
        }));
      } else {
        alert("No logged sets found for this exercise.");
      }
    }
  };

  const handleCalculateWeight = (exerciseName: string, setIndex: number) => {
    const setInput = inputState[exerciseName]?.[setIndex];
    if (!setInput) return;

    const reps = Number(setInput.reps || 0);
    const rir = Number(setInput.rir || null);

    if (reps === 0 || rir === null) {
      alert("Please enter valid reps");
      return;
    }

    const exercise = workoutToday?.exercises.find(
      (ex) =>
        normalizeExerciseName(ex.name) === normalizeExerciseName(exerciseName)
    );

    if (exercise) {
      const calculatedWeight = calculateNextWeight(exercise, reps, rir);
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
      await removeExerciseFromWorkout(
        supabase,
        workoutToday.workout_name,
        exerciseName,
        user
      ); // Pass supabase
      const updatedWorkout = await loadWorkouts(supabase, user).then(
        // Pass supabase
        (workouts) =>
          workouts.find((w) => w.workout_name === workoutToday.workout_name) ||
          null
      );
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

  const handleSaveWorkout = async () => {
    if (workoutToday && user) {
      const updatedWorkout: Workout = {
        ...workoutToday,
        exercises: workoutToday.exercises.map((exercise) => ({
          ...exercise,
          sets: exercise.sets,
          logs: exercise.logs || [],
        })),
      };

      await saveWorkouts(supabase, [updatedWorkout], user); // Pass supabase
      alert("Workout saved successfully!");
    } else {
      alert("No workout to save or user not authenticated.");
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

      // Update inputState and loggedSets for the new set
      setInputState((prev) => ({
        ...prev,
        [exerciseName]: [
          ...(prev[exerciseName] || []),
          { weight: "", reps: "", rir: "" },
        ],
      }));

      setLoggedSets((prev) => ({
        ...prev,
        [exerciseName]: [...(prev[exerciseName] || []), false],
      }));
    }
  };

  const handleEditExercise = (exercise: Exercise) => {
    // Add your edit logic here
    console.log("Editing exercise:", exercise);
  };

  return (
    <div className="container">
      <ActionBar />
      <div style={{ marginTop: "60px" }}>
        <h1>Today's Workout</h1>
        {workoutToday ? (
          <>
            <h2>{workoutToday.workout_name}</h2>

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
                                <button
                                  onClick={() => handleEditExercise(exercise)}
                                  className="button-primary"
                                >
                                  ✏️
                                </button>
                              </div>
                              <ul className="set-list">
                                {/* Display Last Logged Set */}
                                {lastLog[exercise.name] && (
                                  <div className="last-logged-set">
                                    <h4>Last Logged Set:</h4>
                                    <div className="logged-set">
                                      <span>
                                        {" "}
                                        Weight:{" "}
                                        {lastLog[exercise.name][0].weight} lbs
                                      </span>
                                      <span>
                                        {" "}
                                        Reps: {lastLog[exercise.name][0].reps}
                                      </span>
                                      <span>
                                        {" "}
                                        RIR: {lastLog[exercise.name][0].rir}
                                      </span>
                                    </div>
                                  </div>
                                )}
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
                                            className="button primary"
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
                                        className="button primary"
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
                      <button
                        onClick={() => handleEditExercise(exercise)}
                        className="button-primary"
                      >
                        ✏️
                      </button>
                    </div>

                    {/* Display Last Logged Set */}
                    {lastLog[exercise.name] && (
                      <div className="last-logged-set">
                        <h4>Last Logged Set:</h4>
                        <div className="logged-set">
                          <span>
                            {" "}
                            Weight: {lastLog[exercise.name][0].weight} lbs
                          </span>
                          <span> Reps: {lastLog[exercise.name][0].reps}</span>
                          <span> RIR: {lastLog[exercise.name][0].rir}</span>
                        </div>
                      </div>
                    )}

                    <ul className="set-list">
                      {exercise.sets.map((set, setIndex) => (
                        <li key={setIndex} className="set-item">
                          {loggedSets[exercise.name]?.[setIndex] ? (
                            // Display logged set as read-only
                            <div className="logged-set">
                              <span> Weight: {set.weight} lbs</span>
                              <span> Reps: {set.reps}</span>
                              <span> RIR: {set.rir}</span>
                              <button
                                onClick={() =>
                                  toggleEditSet(exercise.name, setIndex)
                                }
                                className="button-primary"
                              >
                                ✏️
                              </button>
                            </div>
                          ) : (
                            // Display editable inputs for unlogged sets
                            <div className="set-inputs">
                              <input
                                type="number"
                                placeholder="Weight (lbs)"
                                value={
                                  inputState[exercise.name]?.[setIndex]
                                    ?.weight || ""
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
                              <input
                                type="number"
                                placeholder="Reps"
                                value={
                                  inputState[exercise.name]?.[setIndex]?.reps ||
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
                                className="input-field"
                              />
                              <input
                                type="number"
                                placeholder="RIR"
                                value={
                                  inputState[exercise.name]?.[setIndex]?.rir ||
                                  ""
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
                          )}
                          <div className="button-group">
                            {/* Conditionally render the "Calculate Weight" button */}
                            {lastSet(exercise) == null && (
                              <button
                                onClick={() =>
                                  handleCalculateWeight(exercise.name, setIndex)
                                }
                                className="button primary"
                              >
                                Calculate Weight
                              </button>
                            )}

                            {!loggedSets[exercise.name]?.[setIndex] && (
                              <button
                                onClick={() =>
                                  handleLogSet(exercise.name, setIndex)
                                }
                                className="button action"
                              >
                                Log Set
                              </button>
                            )}

                            <button
                              onClick={() =>
                                handleRemoveSet(exercise.name, setIndex)
                              }
                              className="button primary"
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
                    {/* Conditionally render the "Show Last Logged Set" button */}
                    {lastSet(exercise) !== null && (
                      <button
                        onClick={() => handleShowLastSet(exercise.name)}
                        className="button action"
                      >
                        Show Last Logged Set
                      </button>
                    )}
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
                  list="exercise-suggestions"
                  className="input-field"
                />
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
              <button
                onClick={() =>
                  setSets([...sets, { weight: 1, reps: 10, rir: 0 }])
                }
                className="add-set-btn"
              >
                Add Set
              </button>
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
