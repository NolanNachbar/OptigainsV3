import React, { useState, useEffect } from "react";
import {
  saveWorkouts,
  getConsolidatedExercises,
  calculateNextWeight,
} from "../utils/SupaBase";
import { Workout, Exercise, Set } from "../utils/types";
import ActionBar from "../components/Actionbar";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import { useUser } from "@clerk/clerk-react";

const normalizeExerciseName = (name: string) => name.toUpperCase();

const FreestyleLiftPage: React.FC = () => {
  const { user } = useUser(); // Get the current user
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentExercise, setCurrentExercise] = useState("");
  const [workoutName, setWorkoutName] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [inputState, setInputState] = useState<
    Record<string, { weight: number | ""; reps: number | ""; rir: number | "" }>
  >({});
  const [history, setHistory] = useState<Exercise[][]>([]);

  useEffect(() => {
    if (user) {
      const loadExercises = async () => {
        const exercises = await getConsolidatedExercises(user);
        const exerciseNames = exercises.map((ex) => ex.name);
        setSuggestions(exerciseNames);
      };
      loadExercises();
    }
  }, [user]);

  const handleExerciseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentExercise(e.target.value);
  };

  const handleAddExercise = () => {
    const normalizedExercise = normalizeExerciseName(currentExercise.trim());
    if (normalizedExercise) {
      setExercises((prev) => [
        ...prev,
        { name: normalizedExercise, sets: [], rir: 0 },
      ]);
      setCurrentExercise("");
      setInputState((prev) => ({
        ...prev,
        [normalizedExercise]: { weight: "", reps: "", rir: "" },
      }));
    }
  };

  const handleInputChange = (
    exerciseName: string,
    field: keyof Set,
    value: string
  ) => {
    setInputState((prev) => ({
      ...prev,
      [exerciseName]: { ...prev[exerciseName], [field]: value },
    }));
  };

  const handleLogSet = (exerciseName: string) => {
    const { weight, reps, rir } = inputState[exerciseName];
    if (weight === "" || reps === "" || rir === "") {
      alert("Please fill in all fields before logging a set.");
      return;
    }

    setExercises((prevExercises) => {
      const updatedExercises = prevExercises.map((exercise) =>
        exercise.name === exerciseName
          ? {
              ...exercise,
              sets: [
                ...exercise.sets,
                {
                  weight: Number(weight),
                  reps: Number(reps),
                  rir: Number(rir),
                },
              ],
            }
          : exercise
      );
      return updatedExercises;
    });

    setInputState((prev) => ({
      ...prev,
      [exerciseName]: { weight: "", reps: "", rir: "" },
    }));
  };

  const handleSaveWorkout = async () => {
    if (!workoutName.trim()) {
      alert("Please enter a workout name.");
      return;
    }

    if (!user) {
      alert("User not authenticated.");
      return;
    }

    const today = new Date().toISOString().split("T")[0];

    const newWorkout: Workout = {
      workoutName: workoutName.trim(),
      workoutType: "Freestyle",
      exercises: exercises.map((exercise) => ({
        name: normalizeExerciseName(exercise.name),
        sets: exercise.sets.map((set) => ({
          weight: set.weight,
          reps: set.reps,
          rir: set.rir,
        })),
        rir: exercise.rir,
        logs: exercise.sets.map((set) => ({
          date: today,
          weight: set.weight,
          reps: set.reps,
          rir: set.rir,
        })),
      })),
      assignedDays: [today],
    };

    try {
      await saveWorkouts([newWorkout], user); // Save to Supabase
      setExercises([]);
      setWorkoutName("");
      alert("Workout saved successfully!");
    } catch (error) {
      console.error("Error saving workout:", error);
      alert("Failed to save workout.");
    }
  };

  const handleCalculateWeight = async (exerciseName: string) => {
    const { reps, rir } = inputState[exerciseName];
    if (reps === "" || rir === "") {
      alert("Please enter valid reps and RIR values.");
      return;
    }

    if (!user) {
      alert("User not authenticated.");
      return;
    }

    const exercises = await getConsolidatedExercises(user);
    const exercise = exercises.find(
      (ex) =>
        normalizeExerciseName(ex.name) === normalizeExerciseName(exerciseName)
    );

    if (exercise) {
      const calculatedWeight = calculateNextWeight(
        exercise,
        Number(reps),
        Number(rir)
      );
      setInputState((prev) => ({
        ...prev,
        [exerciseName]: { ...prev[exerciseName], weight: calculatedWeight },
      }));
    }
  };

  const handleReorderExercises = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    const reorderedExercises = Array.from(exercises);
    const [removed] = reorderedExercises.splice(source.index, 1);
    reorderedExercises.splice(destination.index, 0, removed);

    setHistory((prev) => [...prev, exercises]);
    setExercises(reorderedExercises);
  };

  const handleUndo = () => {
    if (history.length > 0) {
      const previousExercises = history[history.length - 1];
      setHistory((prev) => prev.slice(0, -1));
      setExercises(previousExercises);
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <ActionBar />
      <h2>Freestyle Lift</h2>

      <div style={{ marginBottom: "2rem" }}>
        <input
          type="text"
          placeholder="Search or add new exercise"
          value={currentExercise}
          onChange={handleExerciseChange}
          list="exercise-suggestions"
          style={{
            padding: "0.5rem",
            border: "1px solid #ddd",
            borderRadius: "5px",
            width: "70%",
            marginBottom: "1rem",
            fontSize: "1rem",
          }}
        />
        <datalist id="exercise-suggestions">
          {suggestions.map((suggestion, idx) => (
            <option key={idx} value={suggestion} />
          ))}
        </datalist>
        <button onClick={handleAddExercise} className="button action">
          Add Exercise
        </button>
      </div>

      <DragDropContext onDragEnd={handleReorderExercises}>
        <Droppable droppableId="exercises">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              {exercises.map((exercise, index) => (
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
                      style={{ marginBottom: "2rem" }}
                    >
                      <h3>{exercise.name}</h3>
                      <ul style={{ listStyle: "none", padding: 0 }}>
                        {exercise.sets.map((set, idx) => (
                          <li key={idx}>
                            Weight: {set.weight} lbs, Reps: {set.reps}, RIR:{" "}
                            {set.rir}
                          </li>
                        ))}
                      </ul>

                      <div>
                        <input
                          type="number"
                          placeholder="Weight (lbs)"
                          value={inputState[exercise.name]?.weight || ""}
                          onChange={(e) =>
                            handleInputChange(
                              exercise.name,
                              "weight",
                              e.target.value
                            )
                          }
                          style={{
                            padding: "0.5rem",
                            border: "1px solid #ddd",
                            borderRadius: "5px",
                            width: "20%",
                            marginRight: "0.5rem",
                            fontSize: "1rem",
                          }}
                        />
                        <input
                          type="number"
                          placeholder="Reps"
                          value={inputState[exercise.name]?.reps || ""}
                          onChange={(e) =>
                            handleInputChange(
                              exercise.name,
                              "reps",
                              e.target.value
                            )
                          }
                          style={{
                            padding: "0.5rem",
                            border: "1px solid #ddd",
                            borderRadius: "5px",
                            width: "20%",
                            marginRight: "0.5rem",
                            fontSize: "1rem",
                          }}
                        />
                        <input
                          type="number"
                          placeholder="RIR"
                          value={inputState[exercise.name]?.rir || undefined}
                          onChange={(e) =>
                            handleInputChange(
                              exercise.name,
                              "rir",
                              e.target.value
                            )
                          }
                          style={{
                            padding: "0.5rem",
                            border: "1px solid #ddd",
                            borderRadius: "5px",
                            width: "20%",
                            marginRight: "0.5rem",
                            fontSize: "1rem",
                          }}
                        />
                        <button
                          onClick={() => handleLogSet(exercise.name)}
                          className="button action"
                        >
                          Log Set
                        </button>
                        <button
                          onClick={() => handleCalculateWeight(exercise.name)}
                          className="button secondary"
                        >
                          Calculate Weight
                        </button>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div style={{ marginTop: "2rem" }}>
        <input
          type="text"
          placeholder="Workout Name"
          value={workoutName}
          onChange={(e) => setWorkoutName(e.target.value)}
          style={{
            padding: "0.5rem",
            border: "1px solid #ddd",
            borderRadius: "5px",
            width: "70%",
            marginBottom: "1rem",
            fontSize: "1rem",
          }}
        />
        <button onClick={handleSaveWorkout} className="button primary">
          Save Workout
        </button>
        <button
          onClick={handleUndo}
          className="button"
          disabled={history.length === 0}
        >
          Undo
        </button>
      </div>
    </div>
  );
};

export default FreestyleLiftPage;
