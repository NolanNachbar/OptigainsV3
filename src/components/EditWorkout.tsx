import React, { useState, useEffect } from "react";
import {
  saveWorkouts,
  calculateNextWeight,
  loadWorkouts,
  removeWorkoutFromList,
} from "../utils/SupaBase";
import "../styles/styles.css";
import { Workout, Exercise, Set } from "../utils/types";
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
  const [userLog, setUserLog] = useState<Record<string, Set[]>>({});
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

    const workouts = await loadWorkouts(user);
    const workoutIndex = workouts.findIndex(
      (w) => w.workoutName === updatedWorkout.workoutName
    );
    if (workoutIndex !== -1) {
      workouts[workoutIndex] = updatedWorkout;
    } else {
      workouts.push(updatedWorkout);
    }
    await saveWorkouts(workouts, user); // Save to Supabase
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
        updatedLog[exerciseName] = sets.map(() => ({
          weight: 1,
          reps: 10,
          rir: 0,
        }));
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
    field: keyof Set,
    value: string
  ) => {
    setUserLog((prev) => {
      const updatedLog = { ...prev };
      if (!updatedLog[exerciseName]) {
        updatedLog[exerciseName] =
          workout?.exercises
            .find((ex) => ex.name === exerciseName)
            ?.sets.map(() => ({
              weight: 0,
              reps: 0,
              rir: 0,
            })) || [];
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
        alert("Exercise not found in today’s workout.");
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

      await removeWorkoutFromList(updatedWorkout.workoutName, user); // Remove from Supabase
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

        await saveWorkouts([updatedWorkout], user); // Save to Supabase
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

      await saveWorkouts([updatedWorkout], user); // Save to Supabase
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

        await saveWorkouts([updatedWorkout], user); // Save to Supabase
      }
    }
  };

  return (
    <div className="container">
      <DragDropContext onDragEnd={handleReorderExercises}>
        {!editing ? (
          <Droppable droppableId="exercises">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="exercise-list"
              >
                {workout?.exercises.map((exercise, index) => (
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
                            onClick={() => handleRemoveExercise(exercise.name)}
                            className="button"
                          >
                            🗑️
                          </button>
                        </div>
                        <ul className="set-list">
                          {exercise.sets.map((set, setIndex) => (
                            <li key={setIndex} className="set-item">
                              <div className="floating-label-container">
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
                                  placeholder=" "
                                  className="input-field"
                                />
                                <label className="floating-label">Weight</label>
                              </div>
                              <div className="floating-label-container">
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
                                  placeholder=" "
                                  className="input-field"
                                />
                                <label className="floating-label">Reps</label>
                              </div>
                              <div className="floating-label-container">
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
                                  placeholder=" "
                                  className="input-field"
                                />
                                <label className="floating-label">RIR</label>
                              </div>
                              <div className="button-group">
                                {exercise.logs && exercise.logs.length > 1 && (
                                  <button
                                    onClick={() =>
                                      handleCalculateWeight(
                                        exercise.name,
                                        setIndex
                                      )
                                    }
                                    className="calculate-btn"
                                  >
                                    Calculate
                                  </button>
                                )}
                                <button
                                  onClick={() =>
                                    handleRemoveSet(exercise.name, setIndex)
                                  }
                                  className="button"
                                >
                                  Remove
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
          savedWorkout.exercises.map((exercise) => (
            <div key={exercise.name} className="exercise-card">
              <div className="exercise-header">
                <h3>{exercise.name}</h3>
                <button
                  onClick={() => handleRemoveExercise(exercise.name)}
                  className="remove-exercise-btn"
                >
                  Remove
                </button>
              </div>
              <ul className="set-list">
                {exercise.sets.map((set, setIndex) => (
                  <li key={setIndex} className="set-item">
                    <div className="floating-label-container">
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
                        placeholder=" "
                        className="input-field"
                      />
                      <label className="floating-label">Weight</label>
                    </div>
                    <div className="floating-label-container">
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
                        placeholder=" "
                        className="input-field"
                      />
                      <label className="floating-label">Reps</label>
                    </div>
                    <div className="floating-label-container">
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
                        placeholder=" "
                        className="input-field"
                      />
                      <label className="floating-label">RIR</label>
                    </div>
                    <div className="button-group">
                      {exercise.logs && exercise.logs.length > 0 && (
                        <button
                          onClick={() => {
                            handleCalculateWeight(exercise.name, setIndex);
                          }}
                          className="button primary"
                        >
                          Calculate
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveSet(exercise.name, setIndex)}
                        className="button primary"
                      >
                        🗑️
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
        <button onClick={() => setIsModalOpen(true)} className="action-btn">
          ➕ Add Exercise
        </button>
        <button
          onClick={() => {
            if (workout) {
              handleSaveWorkout();
              onUpdateWorkout(workout);
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

      {/* Modal for Adding Exercise */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add Exercise</h2>
            <div className="modal-input-group">
              <label>Exercise Name: </label>
              <input
                type="text"
                value={exerciseName}
                onChange={(e) => setExerciseName(e.target.value)}
                className="input-field"
              />
            </div>

            {/* Set Details */}
            {sets.map((set, index) => (
              <div key={index} className="modal-input-group">
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
              ➕ Add Set
            </button>

            {/* Add Exercise Button */}
            <button onClick={handleAddExercise} className="add-exercise-btn">
              Add Exercise
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
  );
};
export default EditWorkoutComponent;
