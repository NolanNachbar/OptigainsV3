import React, { useState, useEffect } from "react";
import {
  saveWorkouts,
  calculateNextWeight,
  loadWorkouts,
  removeWorkoutFromList,
} from "../utils/localStorageDB";
import "../styles/styles.css";
import { Workout, Exercise, Set as ExerciseSet } from "../utils/types";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import { useUser } from "@clerk/clerk-react";

const normalizeExerciseName = (name: string) => name.toUpperCase();

interface EditProps {
  savedWorkout: Workout;
  onUpdateWorkout: (updatedWorkout: Workout) => void;
}

const EditWorkoutComponent: React.FC<EditProps> = ({
  savedWorkout,
  onUpdateWorkout,
}) => {
  const { user } = useUser();
  const [workout, setWorkout] = useState<Workout | null>(savedWorkout);
  const [userLog, setUserLog] = useState<Record<string, ExerciseSet[]>>({});
  const [editing, setEditing] = useState(true);
  const [exerciseName, setExerciseName] = useState<string>("");
  const [sets, setSets] = useState<
    { weight: number; reps: number; rir: number }[]
  >([{ weight: 1, reps: 10, rir: 0 }]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [history, setHistory] = useState<Workout[]>([]);

  useEffect(() => {
    setWorkout(savedWorkout);
  }, [savedWorkout]);

  const updateWorkoutWithHistory = (updatedWorkout: Workout) => {
    setHistory((prevHistory) => [...prevHistory, workout!]); // Save current state to history
    setWorkout(updatedWorkout); // Update workout state
    onUpdateWorkout(updatedWorkout); // Update parent state
  };

  // Undo the latest change
  const handleUndo = () => {
    if (history.length > 0) {
      const previousWorkout = history[history.length - 1]; // Get the latest state from history
      setHistory((prevHistory) => prevHistory.slice(0, -1)); // Remove the latest state from history
      setWorkout(previousWorkout); // Restore the previous state
      onUpdateWorkout(previousWorkout); // Update parent state
    }
  };

  const handleReorderExercises = async (result: DropResult) => {
    const { source, destination } = result;

    if (!destination || !user) return;

    const reorderedExercises = Array.from(workout?.exercises || []);
    const [removed] = reorderedExercises.splice(source.index, 1);
    reorderedExercises.splice(destination.index, 0, removed);

    const updatedWorkout = {
      ...workout!,
      exercises: reorderedExercises,
    };

    updateWorkoutWithHistory(updatedWorkout);

    const workouts = await loadWorkouts(null, user); // Pass null here
    const workoutIndex = workouts.findIndex(
      (w) => w.workout_name === updatedWorkout.workout_name
    );
    if (workoutIndex !== -1) {
      workouts[workoutIndex] = updatedWorkout;
    } else {
      workouts.push(updatedWorkout);
    }
    await saveWorkouts(null, workouts, user); // Pass null here
  };

  const handleAddExercise = async () => {
    if (
      exerciseName &&
      sets.every((set) => set.weight > 0 && set.reps > 0 && set.rir >= 0) &&
      user
    ) {
      const newExercise: Exercise = {
        name: exerciseName,
        sets,
        rir: sets[0].rir,
        logs: [],
      };

      const updatedWorkout = {
        ...workout!,
        exercises: [...(workout?.exercises || []), newExercise],
      };

      updateWorkoutWithHistory(updatedWorkout);

      // Initialize userLog for the new exercise
      setUserLog((prevLog) => {
        const updatedLog = { ...prevLog };
        updatedLog[exerciseName] = sets.map(
          () =>
            ({
              weight: 1,
              reps: 10,
              rir: 0,
            } as ExerciseSet)
        );
        return updatedLog;
      });

      onUpdateWorkout(updatedWorkout);
      await handleSaveWorkout(); // Save to Supabase
      setExerciseName("");
      setSets([{ weight: 1, reps: 10, rir: 0 }]);
      setIsModalOpen(false);
    }
  };

  const handleInputChange = (
    exerciseName: string,
    setIndex: number,
    field: "weight" | "reps" | "rir",
    value: string
  ) => {
    setUserLog((prev) => {
      const updatedLog = { ...prev };
      if (!updatedLog[exerciseName]) {
        updatedLog[exerciseName] =
          workout?.exercises
            .find((ex) => ex.name === exerciseName)
            ?.sets.map(
              () =>
                ({
                  weight: 0,
                  reps: 0,
                  rir: 0,
                } as ExerciseSet)
            ) || [];
      }

      if (updatedLog[exerciseName][setIndex]) {
        updatedLog[exerciseName][setIndex][field] = Number(value);
      }

      return updatedLog;
    });
  };

  const handleCalculateWeight = (exerciseName: string, setIndex: number) => {
    const reps = userLog[exerciseName]?.[setIndex]?.reps || 0;
    const rir = userLog[exerciseName]?.[setIndex]?.rir || 0;

    if (workout) {
      const exercise = workout.exercises.find(
        (ex) =>
          normalizeExerciseName(ex.name) === normalizeExerciseName(exerciseName)
      );
      if (exercise) {
        const recommendedWeight = calculateNextWeight(exercise, reps, rir);
        handleInputChange(
          exerciseName,
          setIndex,
          "weight",
          String(recommendedWeight)
        );
      } else {
        alert("Exercise not found in today's workout.");
      }
    }
  };

  const handleRemoveExercise = async (exerciseName: string) => {
    if (workout && user) {
      const updatedExercises = workout.exercises.filter(
        (exercise) =>
          normalizeExerciseName(exercise.name) !==
          normalizeExerciseName(exerciseName)
      );

      const updatedWorkout = { ...workout, exercises: updatedExercises };
      updateWorkoutWithHistory(updatedWorkout);

      await removeWorkoutFromList(null, updatedWorkout.workout_name, user); // Pass null here
      onUpdateWorkout(updatedWorkout);
      await handleSaveWorkout(); // Save to Supabase
    }
  };

  const handleRemoveSet = async (exerciseName: string, setIndex: number) => {
    if (workout && user) {
      const updatedExercises = [...workout.exercises];
      const targetExercise = updatedExercises.find(
        (exercise) =>
          normalizeExerciseName(exercise.name) ===
          normalizeExerciseName(exerciseName)
      );

      if (targetExercise) {
        targetExercise.sets.splice(setIndex, 1);

        const updatedWorkout = { ...workout, exercises: updatedExercises };
        updateWorkoutWithHistory(updatedWorkout);

        setUserLog((prevLog) => ({
          ...prevLog,
          [exerciseName]: prevLog[exerciseName]?.filter(
            (_, idx) => idx !== setIndex
          ),
        }));

        await saveWorkouts(null, [updatedWorkout], user); // Pass null here
      }
    }
  };

  const handleSaveWorkout = async () => {
    if (workout && user) {
      const today = new Date().toISOString().split("T")[0];

      const updatedWorkout: Workout = {
        ...workout,
        exercises: workout.exercises.map((exercise) => ({
          ...exercise,
          sets: userLog[exercise.name] || exercise.sets,
          logs: (userLog[exercise.name] || []).map((set) => ({
            ...set,
            date: today,
          })),
        })),
      };

      await saveWorkouts(null, [updatedWorkout], user); // Pass null here
    } else {
      alert("No workout to save or user not authenticated.");
    }
  };

  const handleAddSet = async (exerciseName: string) => {
    if (workout && user) {
      const updatedExercises = [...workout.exercises];
      const targetExercise = updatedExercises.find(
        (exercise) =>
          normalizeExerciseName(exercise.name) ===
          normalizeExerciseName(exerciseName)
      );

      if (targetExercise) {
        targetExercise.sets.push({ weight: 1, reps: 10, rir: 0 });

        const updatedWorkout = { ...workout, exercises: updatedExercises };
        updateWorkoutWithHistory(updatedWorkout);

        setUserLog((prevLog) => {
          const updatedLog = { ...prevLog };
          if (!updatedLog[exerciseName]) {
            updatedLog[exerciseName] = [];
          }
          updatedLog[exerciseName].push({ weight: 1, reps: 10, rir: 0 });
          return updatedLog;
        });

        await saveWorkouts(null, [updatedWorkout], user); // Pass null here
      }
    }
  };

  return (
    <div className="container">
      <DragDropContext onDragEnd={handleReorderExercises}>
        <Droppable droppableId="exercises">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="exercise-list"
            >
              {workout?.exercises.map((exercise, exerciseIndex) => (
                <Draggable
                  key={exercise.name}
                  draggableId={exercise.name}
                  index={exerciseIndex}
                  isDragDisabled={!editing}
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...(editing ? provided.dragHandleProps : {})}
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
                            onClick={() => handleRemoveExercise(exercise.name)}
                            className="button danger"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      {exercise.logs && exercise.logs.length > 0 && (
                        <div className="last-set-info">
                          Last Set:{" "}
                          {exercise.logs[exercise.logs.length - 1].weight}
                          lbs × {
                            exercise.logs[exercise.logs.length - 1].reps
                          }{" "}
                          @RIR{exercise.logs[exercise.logs.length - 1].rir}
                          <span className="date">
                            {new Date(
                              exercise.logs[exercise.logs.length - 1].date
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      <ul className="set-list">
                        {exercise.sets.map((set, setIndex) => (
                          <li key={setIndex} className="set-item">
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
                                  className="input-field"
                                />
                              </div>
                              <div className="floating-label-container">
                                <label className="floating-label">Reps</label>
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
                                  className="input-field"
                                />
                              </div>
                              <div className="floating-label-container">
                                <label className="floating-label">RIR</label>
                                <input
                                  type="number"
                                  value={
                                    userLog[exercise.name]?.[setIndex]?.rir !==
                                    undefined
                                      ? userLog[exercise.name][setIndex].rir
                                      : set.rir
                                  }
                                  onChange={(e) =>
                                    handleInputChange(
                                      exercise.name,
                                      setIndex,
                                      "rir",
                                      e.target.value
                                    )
                                  }
                                  min="0"
                                  className="input-field"
                                />
                              </div>
                            </div>
                            <div className="set-actions">
                              {exercise.logs && exercise.logs.length > 0 && (
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
                              )}
                            </div>
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

      <div className="action-buttons">
        <button onClick={() => setIsModalOpen(true)} className="button primary">
          Add Exercise
        </button>
        <button
          onClick={() => {
            if (workout) {
              handleSaveWorkout();
              onUpdateWorkout(workout);
            }
            setEditing((editing) => !editing);
          }}
          className={`button ${editing ? "secondary" : "primary"}`}
        >
          {editing ? "Finish Reordering" : "Reorder Exercises"}
        </button>
        <button
          onClick={handleUndo}
          className="button secondary"
          disabled={history.length === 0}
        >
          Undo
        </button>
      </div>

      {/* Modal for Adding Exercise */}
      {isModalOpen && (
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
              />
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
                        min="0"
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
                  setIsModalOpen(false);
                }}
                className="button save"
              >
                Add Exercise
              </button>
              <button
                onClick={() => {
                  setIsModalOpen(false);
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

      <button onClick={handleSaveWorkout} className="button save">
        Save Workout
      </button>
    </div>
  );
};
export default EditWorkoutComponent;
