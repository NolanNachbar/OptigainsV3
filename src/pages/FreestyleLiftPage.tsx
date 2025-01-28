import React, { useState, useEffect } from "react";
import {
  loadWorkouts,
  saveWorkouts,
  getConsolidatedExercises,
  calculateNextWeight,
} from "../utils/localStorage";
import { Workout, Exercise } from "../utils/types";
import ActionBar from "../components/Actionbar";

const normalizeExerciseName = (name: string) => name.toUpperCase();

const FreestyleLiftPage: React.FC = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]); // Start with empty exercises list
  const [currentExercise, setCurrentExercise] = useState("");
  const [weight, setWeight] = useState<number | "">("");
  const [reps, setReps] = useState<number | "">("");
  const [rir, setRir] = useState<number | "">("");
  const [workoutName, setWorkoutName] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]); // Suggestions for exercise search

  useEffect(() => {
    const consolidatedExercises = getConsolidatedExercises();
    const exerciseNames = consolidatedExercises.map((ex) => ex.name); // Extract exercise names for suggestions
    setSuggestions(exerciseNames);
  }, []);

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
    }
  };

  const handleAddSet = (exerciseName: string) => {
    const normalizedExerciseName = normalizeExerciseName(exerciseName.trim());

    if (!normalizedExerciseName || weight === "" || reps === "" || rir === "") {
      alert("Please fill in all fields before adding a set.");
      return;
    }

    setExercises((prevExercises) => {
      const existingExerciseIndex = prevExercises.findIndex(
        (exercise) =>
          normalizeExerciseName(exercise.name) === normalizedExerciseName
      );

      if (existingExerciseIndex !== -1) {
        const updatedExercises = [...prevExercises];
        const updatedExercise = { ...updatedExercises[existingExerciseIndex] };
        updatedExercise.sets = [
          ...updatedExercise.sets,
          { weight: Number(weight), reps: Number(reps), rir: Number(rir) },
        ];
        updatedExercises[existingExerciseIndex] = updatedExercise;
        return updatedExercises;
      }

      return [
        ...prevExercises,
        {
          name: normalizedExerciseName,
          sets: [
            { weight: Number(weight), reps: Number(reps), rir: Number(rir) },
          ],
          rir: Number(rir),
        },
      ];
    });

    setWeight("");
    setReps("");
    setRir("");
  };

  const handleSaveWorkout = () => {
    if (!workoutName.trim()) {
      alert("Please enter a workout name.");
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

    saveWorkouts([...loadWorkouts(), newWorkout]);

    setExercises([]);
    setWorkoutName("");
    alert("Workout saved successfully!");
  };

  // Handle weight calculation for the selected exercise
  const handleCalculateWeight = (exerciseName: string) => {
    const exercise = getConsolidatedExercises().find(
      (ex) =>
        normalizeExerciseName(ex.name) === normalizeExerciseName(exerciseName)
    );

    if (exercise && reps && rir != "") {
      const calculatedWeight = calculateNextWeight(
        exercise,
        Number(reps),
        Number(rir)
      );
      setWeight(calculatedWeight); // Update the weight for the new set
    } else {
      alert("Please enter valid reps and RIR values.");
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
          style={{
            padding: "0.5rem",
            border: "1px solid #ddd",
            borderRadius: "5px",
            width: "70%",
            marginBottom: "1rem",
          }}
        />
        <button onClick={handleAddExercise} className="button action">
          Add Exercise
        </button>

        {currentExercise && (
          <div
            style={{
              marginTop: "1rem",
              padding: "1rem",
              border: "1px solid #ddd",
              borderRadius: "5px",
            }}
          >
            <h4>Suggestions</h4>
            <ul>
              {suggestions
                .filter((name) =>
                  name.toLowerCase().includes(currentExercise.toLowerCase())
                )
                .map((suggestion, idx) => (
                  <li key={idx} onClick={() => setCurrentExercise(suggestion)}>
                    {suggestion}
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>

      {exercises.map((exercise) => (
        <div key={exercise.name} style={{ marginBottom: "2rem" }}>
          <h3>{exercise.name}</h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {exercise.sets.map((set, index) => (
              <li key={index}>
                Weight: {set.weight} lbs, Reps: {set.reps}, RIR: {set.rir}
              </li>
            ))}
          </ul>

          <div>
            <input
              type="number"
              placeholder="Weight (lbs)"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              style={{
                padding: "0.5rem",
                border: "1px solid #ddd",
                borderRadius: "5px",
                width: "20%",
                marginRight: "0.5rem",
              }}
            />
            <input
              type="number"
              placeholder="Reps"
              value={reps}
              onChange={(e) => setReps(Number(e.target.value))}
              style={{
                padding: "0.5rem",
                border: "1px solid #ddd",
                borderRadius: "5px",
                width: "20%",
                marginRight: "0.5rem",
              }}
            />
            <input
              type="number"
              placeholder="RIR"
              value={rir}
              onChange={(e) => setRir(Number(e.target.value))}
              style={{
                padding: "0.5rem",
                border: "1px solid #ddd",
                borderRadius: "5px",
                width: "20%",
                marginRight: "0.5rem",
              }}
            />
            <button
              onClick={() => handleAddSet(exercise.name)}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#6200ea",
                color: "#fff",
                border: "none",
                borderRadius: "5px",
              }}
            >
              Add Set
            </button>
            <button
              onClick={() => handleCalculateWeight(exercise.name)}
              className="button"
            >
              Calculate Weight
            </button>
          </div>
        </div>
      ))}

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
          }}
        />
        <button onClick={handleSaveWorkout} className="button action">
          Save Workout
        </button>
      </div>
    </div>
  );
};

export default FreestyleLiftPage;
