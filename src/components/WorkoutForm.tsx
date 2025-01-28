import React, { useEffect, useState } from "react";
import {
  saveWorkouts,
  loadWorkouts,
  getConsolidatedExercises,
} from "../utils/localStorage";
import { Workout, Exercise } from "../utils/types";

interface WorkoutFormProps {
  setSavedWorkouts: React.Dispatch<React.SetStateAction<Workout[]>>;
}

const WorkoutForm: React.FC<WorkoutFormProps> = ({ setSavedWorkouts }) => {
  const [workoutName, setWorkoutName] = useState<string>("");
  const [workoutType, setWorkoutType] = useState<string>("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exerciseName, setExerciseName] = useState<string>("");
  const [currentExercise, setCurrentExercise] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [sets, setSets] = useState<
    { weight: number; reps: number; rir: number }[]
  >([{ weight: 1, reps: 10, rir: 0 }]); // Changed to hold an array of sets
  const [feedback, setFeedback] = useState<string>("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    const consolidatedExercises = getConsolidatedExercises();
    const exerciseNames = consolidatedExercises.map((ex) => ex.name);
    setSuggestions(exerciseNames);
  }, []);

  const handleExerciseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentExercise(e.target.value);
    setExerciseName(e.target.value); // Update exerciseName as well
  };

  const handleAddExercise = () => {
    if (
      exerciseName &&
      sets.every((set) => set.weight > 0 && set.reps > 0 && set.rir >= 0) // Allow rir = 0
    ) {
      const newExercise: Exercise = {
        name: exerciseName,
        sets: sets,
        rir: sets[0].rir, // Assume RIR is consistent across sets for now
        logs: [
          {
            date: new Date().toISOString(),
            weight: sets[0].weight,
            reps: sets[0].reps,
            rir: sets[0].rir,
          },
        ],
      };
      setExercises([...exercises, newExercise]);
      setExerciseName("");
      setCurrentExercise(""); // Clear the current exercise input
      setSets([{ weight: 1, reps: 10, rir: 0 }]); // Reset to default set
      setFeedback(""); // Clear feedback message
    } else {
      setFeedback("Please fill all fields with valid values.");
    }
  };

  const handleSaveWorkout = () => {
    if (workoutName && workoutType && exercises.length > 0) {
      const newWorkout: Workout = {
        workoutName,
        workoutType,
        exercises,
        assignedDays: [],
      };
      const savedWorkouts = [...loadWorkouts(), newWorkout];
      saveWorkouts(savedWorkouts);
      setSavedWorkouts(savedWorkouts); // Update the saved workouts state
      setWorkoutName("");
      setWorkoutType("");
      setExercises([]);
      setFeedback("Workout saved successfully!");
    } else {
      setFeedback("Please fill all fields and add exercises before saving.");
    }
  };

  const handleDeleteExercise = (index: number) => {
    const updatedExercises = exercises.filter((_, i) => i !== index);
    setExercises(updatedExercises);
  };

  const handleEditExercise = (index: number) => {
    const exerciseToEdit = exercises[index];
    setExerciseName(exerciseToEdit.name);
    setCurrentExercise(exerciseToEdit.name); // Set currentExercise for the input field
    setSets(exerciseToEdit.sets); // Populate sets with existing exercise data
    setEditingIndex(index);
  };

  const handleUpdateExercise = () => {
    if (
      editingIndex !== null &&
      exerciseName &&
      sets.every((set) => set.weight > 0 && set.reps > 0 && set.rir >= 0) // Allow rir = 0
    ) {
      const updatedExercise: Exercise = {
        name: exerciseName,
        sets: sets,
        rir: sets[0].rir, // Assume RIR is consistent across sets for now
      };
      const updatedExercises = exercises.map((exercise, index) =>
        index === editingIndex ? updatedExercise : exercise
      );
      setExercises(updatedExercises);
      setEditingIndex(null); // Clear editing mode
      setExerciseName("");
      setCurrentExercise(""); // Clear the current exercise input
      setSets([{ weight: 1, reps: 10, rir: 0 }]); // Reset to default set
      setFeedback(""); // Clear feedback message
    } else {
      setFeedback("Please fill all fields with valid values.");
    }
  };

  return (
    <div>
      <h3>Create a New Workout</h3>

      {/* Workout Name */}
      <div className="floating-label-container">
        <input
          type="text"
          value={workoutName}
          onChange={(e) => setWorkoutName(e.target.value)}
          placeholder=" "
        />
        <span className="floating-label">Workout Name</span>
      </div>

      {/* Workout Type */}
      <div className="floating-label-container">
        <input
          type="text"
          value={workoutType}
          onChange={(e) => setWorkoutType(e.target.value)}
          placeholder=" "
        />
        <span className="floating-label">Workout Type (e.g., Push, Pull)</span>
      </div>

      <h4>Exercises</h4>

      {/* List of Exercises Added */}
      <div className="exercise-list">
        {exercises.map((exercise, index) => (
          <div key={index} className="exercise-card">
            <p>
              {index + 1}. {exercise.name} - {exercise.sets.length} sets
              (Weight:{" "}
              {exercise.sets.map((set) => `${set.weight}lbs`).join(", ")}, Reps:{" "}
              {exercise.sets.map((set) => `${set.reps}`).join(", ")})
            </p>
            <div className="exercise-actions">
              <button onClick={() => handleEditExercise(index)}>Edit</button>
              <button onClick={() => handleDeleteExercise(index)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Exercise Name */}
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

      {/* Set Details */}
      {sets.map((set, index) => (
        <div key={index} className="set-container">
          <div className="floating-label-container">
            <input
              type="number"
              value={set.weight}
              onChange={(e) => {
                const updatedSets = [...sets];
                updatedSets[index].weight = Number(e.target.value);
                setSets(updatedSets);
              }}
              placeholder=" "
            />
            <span className="floating-label">
              Set {index + 1} - Weight (lbs)
            </span>
          </div>
          <div className="floating-label-container">
            <input
              type="number"
              value={set.reps}
              onChange={(e) => {
                const updatedSets = [...sets];
                updatedSets[index].reps = Number(e.target.value);
                setSets(updatedSets);
              }}
              placeholder=" "
            />
            <span className="floating-label">Reps</span>
          </div>
          <div className="floating-label-container">
            <input
              type="number"
              value={set.rir}
              onChange={(e) => {
                const updatedSets = [...sets];
                updatedSets[index].rir = Number(e.target.value);
                setSets(updatedSets);
              }}
              placeholder=" "
            />
            <span className="floating-label">RIR</span>
          </div>
        </div>
      ))}

      {/* Add Set Button */}
      <button
        onClick={() => setSets([...sets, { weight: 1, reps: 10, rir: 0 }])}
        className="button primary"
      >
        Add Set
      </button>

      {/* Add Exercise Button */}
      <button onClick={handleAddExercise} className="button primary">
        Add Exercise
      </button>

      {/* Feedback Message */}
      {feedback && <p className="feedback">{feedback}</p>}

      {/* Update Exercise Button (only shows when editing) */}
      {editingIndex !== null && (
        <button onClick={handleUpdateExercise} className="button secondary">
          Update Exercise
        </button>
      )}

      {/* Save Workout Button */}
      <button onClick={handleSaveWorkout} className="button save">
        Save Workout
      </button>
    </div>
  );
};

export default WorkoutForm;
