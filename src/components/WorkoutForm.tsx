import React, { useState } from 'react';
import { saveWorkouts, loadWorkouts } from '../utils/localStorage';
import { Workout, Exercise } from '../utils/types';

interface WorkoutFormProps {
  setSavedWorkouts: React.Dispatch<React.SetStateAction<Workout[]>>;
}

const WorkoutForm: React.FC<WorkoutFormProps> = ({ setSavedWorkouts }) => {
  const [workoutName, setWorkoutName] = useState<string>('');
  const [workoutType, setWorkoutType] = useState<string>('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exerciseName, setExerciseName] = useState<string>('');
  const [sets, setSets] = useState<{ weight: number; reps: number; rir: number }[]>([{ weight: 1, reps: 10, rir: 2 }]); // Changed to hold an array of sets
  const [feedback, setFeedback] = useState<string>('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleAddExercise = () => {
    if (exerciseName && sets.every(set => set.weight > 0 && set.reps > 0 && set.rir > 0)) {
      const newExercise: Exercise = {
        name: exerciseName,
        sets: sets,
        rir: sets[0].rir, // Assume RIR is consistent across sets for now
        logs: [{ date: new Date().toISOString(), weight: sets[0].weight, reps: sets[0].reps, rir: sets[0].rir }],
      };
      setExercises([...exercises, newExercise]);
      setExerciseName('');
      setSets([{ weight: 1, reps: 10, rir: 2 }]); // Reset to default set
    } else {
      setFeedback('Please fill all fields with valid values.');
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
      setWorkoutName('');
      setWorkoutType('');
      setExercises([]);
      setFeedback('Workout saved successfully!');
    } else {
      setFeedback('Please fill all fields and add exercises before saving.');
    }
  };

  const handleDeleteExercise = (index: number) => {
    const updatedExercises = exercises.filter((_, i) => i !== index);
    setExercises(updatedExercises);
  };

  const handleEditExercise = (index: number) => {
    const exerciseToEdit = exercises[index];
    setExerciseName(exerciseToEdit.name);
    setSets(exerciseToEdit.sets); // Populate sets with existing exercise data
    setEditingIndex(index);
  };

  const handleUpdateExercise = () => {
    if (editingIndex !== null && exerciseName && sets.every(set => set.weight > 0 && set.reps > 0 && set.rir > 0)) {
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
      setExerciseName('');
      setSets([{ weight: 1, reps: 10, rir: 2 }]); // Reset to default set
    } else {
      setFeedback('Please fill all fields with valid values.');
    }
  };

  return (
    <div>
      <h3>Create a New Workout</h3>
      
      {/* Workout Name */}
      <div>
        <label>Workout Name</label>
        <input
          type="text"
          value={workoutName}
          onChange={(e) => setWorkoutName(e.target.value)}
        />
      </div>
      
      {/* Workout Type */}
      <div>
        <label>Workout Type (e.g., Push, Pull)</label>
        <input
          type="text"
          value={workoutType}
          onChange={(e) => setWorkoutType(e.target.value)}
        />
      </div>

      <h4>Exercises</h4>

      {/* List of Exercises Added */}
      <div>
        {exercises.map((exercise, index) => (
          <div key={index}>
            <p>
              {index + 1}. {exercise.name} - {exercise.sets.length} sets (Weight: {exercise.sets.map(set => `${set.weight}kg`).join(", ")}, Reps: {exercise.sets.map(set => `${set.reps}`).join(", ")})
              <button onClick={() => handleEditExercise(index)}>Edit</button>
              <button onClick={() => handleDeleteExercise(index)}>Delete</button>
            </p>
          </div>
        ))}
      </div>

      {/* Exercise Name */}
      <div>
        <label>Exercise Name: </label>
        <input
          type="text"
          value={exerciseName}
          onChange={(e) => setExerciseName(e.target.value)}
        />
      </div>

      {/* Set Details */}
      {sets.map((set, index) => (
        <div key={index}>
          <label>Set {index + 1} - Weight: </label>
          <input
            type="number"
            value={set.weight}
            onChange={(e) => {
              const updatedSets = [...sets];
              updatedSets[index].weight = Number(e.target.value);
              setSets(updatedSets);
            }}
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
          />
        </div>
      ))}

      {/* Add Set Button */}
      <button onClick={() => setSets([...sets, { weight: 1, reps: 10, rir: 2 }])}>Add Set</button>

      {/* Add Exercise Button */}
      <button onClick={handleAddExercise}>Add Exercise</button>
      {feedback && <p>{feedback}</p>}

      {/* Update Exercise Button (only shows when editing) */}
      {editingIndex !== null && (
        <button onClick={handleUpdateExercise}>Update Exercise</button>
      )}

      {/* Save Workout Button */}
      <button onClick={handleSaveWorkout}>Save Workout</button>
    </div>
  );
};

export default WorkoutForm;
