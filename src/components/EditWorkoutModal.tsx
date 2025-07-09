import React, { useState } from "react";
import { Workout, Exercise, WorkoutSet, ExerciseLog } from "../utils/types";
import "../styles/edit-workout-modal.css";

interface EditWorkoutModalProps {
  workout: Workout;
  date: string;
  onSave: (workout: Workout) => void;
  onClose: () => void;
}

const EditWorkoutModal: React.FC<EditWorkoutModalProps> = ({
  workout,
  date,
  onSave,
  onClose,
}) => {
  const [editedWorkout, setEditedWorkout] = useState<Workout>({ ...workout });
  const [saveOption, setSaveOption] = useState<'instance' | 'template'>('instance');

  const handleExerciseChange = (index: number, field: keyof Exercise, value: string | WorkoutSet[] | ExerciseLog[] | number | undefined) => {
    const updatedExercises = [...editedWorkout.exercises];
    updatedExercises[index] = {
      ...updatedExercises[index],
      [field]: value,
    };
    setEditedWorkout({ ...editedWorkout, exercises: updatedExercises });
  };

  const handleSetChange = (exerciseIndex: number, setIndex: number, field: string, value: number | boolean) => {
    const updatedExercises = [...editedWorkout.exercises];
    const updatedSets = [...updatedExercises[exerciseIndex].sets];
    updatedSets[setIndex] = {
      ...updatedSets[setIndex],
      [field]: value,
    };
    updatedExercises[exerciseIndex] = {
      ...updatedExercises[exerciseIndex],
      sets: updatedSets,
    };
    setEditedWorkout({ ...editedWorkout, exercises: updatedExercises });
  };

  const addExercise = () => {
    const newExercise: Exercise = {
      name: "New Exercise",
      sets: [{ weight: 0, reps: 10, rir: 2 }],
      rir: 2,
      notes: "",
    };
    setEditedWorkout({
      ...editedWorkout,
      exercises: [...editedWorkout.exercises, newExercise],
    });
  };

  const removeExercise = (index: number) => {
    const updatedExercises = editedWorkout.exercises.filter((_, i) => i !== index);
    setEditedWorkout({ ...editedWorkout, exercises: updatedExercises });
  };

  const addSet = (exerciseIndex: number) => {
    const updatedExercises = [...editedWorkout.exercises];
    const lastSet = updatedExercises[exerciseIndex].sets[updatedExercises[exerciseIndex].sets.length - 1];
    updatedExercises[exerciseIndex].sets.push({ ...lastSet });
    setEditedWorkout({ ...editedWorkout, exercises: updatedExercises });
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const updatedExercises = [...editedWorkout.exercises];
    updatedExercises[exerciseIndex].sets = updatedExercises[exerciseIndex].sets.filter(
      (_, i) => i !== setIndex
    );
    setEditedWorkout({ ...editedWorkout, exercises: updatedExercises });
  };

  const handleSave = () => {
    onSave(editedWorkout);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="edit-workout-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Workout - {formatDate(date)}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="workout-name-section">
            <label>Workout Name</label>
            <input
              type="text"
              value={editedWorkout.workout_name}
              onChange={(e) =>
                setEditedWorkout({ ...editedWorkout, workout_name: e.target.value })
              }
              className="workout-name-input"
            />
          </div>

          <div className="exercises-section">
            <div className="section-header">
              <h3>Exercises</h3>
              <button onClick={addExercise} className="add-btn">+ Add Exercise</button>
            </div>

            {editedWorkout.exercises.map((exercise, exerciseIndex) => (
              <div key={exerciseIndex} className="exercise-block">
                <div className="exercise-header">
                  <input
                    type="text"
                    value={exercise.name}
                    onChange={(e) =>
                      handleExerciseChange(exerciseIndex, "name", e.target.value)
                    }
                    className="exercise-name-input"
                  />
                  <button
                    onClick={() => removeExercise(exerciseIndex)}
                    className="remove-btn"
                  >
                    Remove
                  </button>
                </div>

                <div className="sets-section">
                  <div className="sets-header">
                    <span>Sets</span>
                    <button
                      onClick={() => addSet(exerciseIndex)}
                      className="add-set-btn"
                    >
                      + Add Set
                    </button>
                  </div>

                  {exercise.sets.map((set, setIndex) => (
                    <div key={setIndex} className="set-row">
                      <span className="set-number">Set {setIndex + 1}</span>
                      <div className="set-inputs">
                        <div className="input-group">
                          <label>Weight</label>
                          <input
                            type="number"
                            value={set.weight}
                            onChange={(e) =>
                              handleSetChange(
                                exerciseIndex,
                                setIndex,
                                "weight",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="set-input"
                          />
                        </div>
                        <div className="input-group">
                          <label>Reps</label>
                          <input
                            type="number"
                            value={set.reps}
                            onChange={(e) =>
                              handleSetChange(
                                exerciseIndex,
                                setIndex,
                                "reps",
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="set-input"
                          />
                        </div>
                        <div className="input-group">
                          <label>RIR</label>
                          <input
                            type="number"
                            value={set.rir}
                            onChange={(e) =>
                              handleSetChange(
                                exerciseIndex,
                                setIndex,
                                "rir",
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="set-input"
                            min="0"
                            max="5"
                          />
                        </div>
                        {exercise.sets.length > 1 && (
                          <button
                            onClick={() => removeSet(exerciseIndex, setIndex)}
                            className="remove-set-btn"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="exercise-notes">
                  <label>Notes</label>
                  <textarea
                    value={exercise.notes || ""}
                    onChange={(e) =>
                      handleExerciseChange(exerciseIndex, "notes", e.target.value)
                    }
                    placeholder="Add notes for this exercise..."
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="save-options">
            <label>
              <input
                type="radio"
                value="instance"
                checked={saveOption === 'instance'}
                onChange={(e) => setSaveOption(e.target.value as 'instance' | 'template')}
              />
              Save for this day only
            </label>
            <label>
              <input
                type="radio"
                value="template"
                checked={saveOption === 'template'}
                onChange={(e) => setSaveOption(e.target.value as 'instance' | 'template')}
              />
              Update workout template (affects all future instances)
            </label>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="cancel-btn">Cancel</button>
          <button onClick={handleSave} className="save-btn">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export default EditWorkoutModal;