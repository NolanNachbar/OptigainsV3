import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { saveWorkoutTemplate, normalizeExerciseName } from '../utils/SupaBase';
import { WorkoutTemplate, Exercise } from '../utils/types';
import { v4 as uuidv4 } from 'uuid';
import { FiPlus, FiTrash2, FiSave, FiX, FiCopy } from 'react-icons/fi';
import '../styles/CustomWorkout.css';

// Common exercises for quick selection
const QUICK_EXERCISES = {
  Push: ['BENCH PRESS', 'SHOULDER PRESS', 'DIPS', 'TRICEP EXTENSION'],
  Pull: ['PULL UPS', 'BARBELL ROW', 'LAT PULLDOWN', 'BICEP CURL'],
  Legs: ['SQUAT', 'DEADLIFT', 'LEG PRESS', 'LEG CURL'],
  Core: ['PLANK', 'AB WHEEL', 'HANGING LEG RAISE', 'RUSSIAN TWIST']
};

// Extended Exercise type with temporary ID for UI management
interface ExerciseWithId extends Exercise {
  tempId: string;
}

const CustomWorkoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  
  const [workoutName, setWorkoutName] = useState('');
  const [workoutType, setWorkoutType] = useState<'Push' | 'Pull' | 'Legs' | 'Core' | 'Custom'>('Custom');
  const [exercises, setExercises] = useState<ExerciseWithId[]>([]);
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Add an empty exercise
  const addExercise = () => {
    const newExercise: ExerciseWithId = {
      tempId: uuidv4(),
      name: '',
      rir: 0,
      logs: [],
      sets: [{ weight: 0, reps: 0, rir: 0 }]
    };
    setExercises([...exercises, newExercise]);
  };

  // Quick add from suggestions
  const quickAddExercise = (exerciseName: string) => {
    const newExercise: ExerciseWithId = {
      tempId: uuidv4(),
      name: normalizeExerciseName(exerciseName),
      rir: 2, // Default RIR for the exercise
      logs: [],
      sets: [
        { weight: 0, reps: 8, rir: 2 },
        { weight: 0, reps: 8, rir: 2 },
        { weight: 0, reps: 8, rir: 2 }
      ]
    };
    setExercises([...exercises, newExercise]);
  };

  // Update exercise name
  const updateExerciseName = (index: number, name: string) => {
    const updated = [...exercises];
    updated[index].name = normalizeExerciseName(name);
    setExercises(updated);
  };

  // Remove exercise
  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  // Add set to exercise
  const addSet = (exerciseIndex: number) => {
    const updated = [...exercises];
    const lastSet = updated[exerciseIndex].sets[updated[exerciseIndex].sets.length - 1];
    updated[exerciseIndex].sets.push({ ...lastSet });
    setExercises(updated);
  };

  // Remove set from exercise
  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const updated = [...exercises];
    updated[exerciseIndex].sets = updated[exerciseIndex].sets.filter((_, i) => i !== setIndex);
    setExercises(updated);
  };

  // Update set details
  const updateSet = (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps' | 'rir', value: number) => {
    const updated = [...exercises];
    updated[exerciseIndex].sets[setIndex][field] = value;
    setExercises(updated);
  };

  // Copy sets from another exercise
  const copySets = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const updated = [...exercises];
    updated[toIndex].sets = [...updated[fromIndex].sets];
    setExercises(updated);
  };

  // Save workout
  const saveWorkout = async () => {
    if (!user || !workoutName.trim() || exercises.length === 0) {
      alert('Please provide a workout name and at least one exercise');
      return;
    }

    setIsSaving(true);
    try {
      // Remove tempId from exercises before saving
      const exercisesForSave: Exercise[] = exercises
        .filter(e => e.name.trim() !== '')
        .map(({ tempId, ...exercise }) => exercise);

      const workout: WorkoutTemplate = {
        id: uuidv4(),
        workout_name: workoutName.trim(),
        exercises: exercisesForSave,
        notes: workoutNotes,
        clerk_user_id: user.id,
        user_id: uuidv4() // This will be generated properly by the save function
      };

      await saveWorkoutTemplate(null, workout, user);
      navigate('/workout-plan', { state: { activeTab: 'overview' } });
    } catch (error) {
      console.error('Error saving workout:', error);
      alert('Failed to save workout. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Generate workout name suggestion
  useEffect(() => {
    if (!workoutName && workoutType !== 'Custom' && exercises.length > 0) {
      setWorkoutName(`${workoutType} Day - ${new Date().toLocaleDateString()}`);
    }
  }, [workoutType, exercises.length]);

  return (
    <div className="custom-workout-page">
      <div className="custom-workout-header">
        <button onClick={() => navigate(-1)} className="back-button">
          <FiX /> Cancel
        </button>
        <h1>Create Custom Workout</h1>
        <button 
          onClick={saveWorkout} 
          disabled={isSaving || !workoutName.trim() || exercises.length === 0}
          className="save-button"
        >
          <FiSave /> {isSaving ? 'Saving...' : 'Save Workout'}
        </button>
      </div>

      <div className="custom-workout-content">
        {/* Workout Details */}
        <div className="workout-details-section">
          <div className="form-group">
            <label>Workout Name</label>
            <input
              type="text"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              placeholder="e.g., Upper Body Strength"
              className="workout-name-input"
            />
          </div>

          <div className="form-group">
            <label>Workout Type</label>
            <div className="workout-type-selector">
              {['Push', 'Pull', 'Legs', 'Core', 'Custom'].map((type) => (
                <button
                  key={type}
                  onClick={() => setWorkoutType(type as any)}
                  className={`type-button ${workoutType === type ? 'active' : ''}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Workout Notes (Optional)</label>
            <textarea
              value={workoutNotes}
              onChange={(e) => setWorkoutNotes(e.target.value)}
              placeholder="Focus points, form cues, or general notes..."
              className="workout-notes-input"
              rows={3}
            />
          </div>
        </div>

        {/* Quick Add Section */}
        {workoutType !== 'Custom' && (
          <div className="quick-add-section">
            <h3>Quick Add Exercises</h3>
            <div className="quick-exercise-grid">
              {QUICK_EXERCISES[workoutType]?.map((exercise) => (
                <button
                  key={exercise}
                  onClick={() => quickAddExercise(exercise)}
                  className="quick-add-button"
                >
                  <FiPlus /> {exercise}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Exercise List */}
        <div className="exercises-section">
          <div className="section-header">
            <h3>Exercises ({exercises.length})</h3>
            <button onClick={addExercise} className="add-exercise-button">
              <FiPlus /> Add Exercise
            </button>
          </div>

          {exercises.length === 0 ? (
            <div className="empty-state">
              <p>No exercises added yet</p>
              <p className="empty-state-hint">
                {workoutType !== 'Custom' 
                  ? 'Use the quick add buttons above or click "Add Exercise"'
                  : 'Click "Add Exercise" to get started'}
              </p>
            </div>
          ) : (
            <div className="exercise-list">
              {exercises.map((exercise, exerciseIndex) => (
                <div key={exercise.tempId} className="exercise-card">
                  <div className="exercise-header">
                    <input
                      type="text"
                      value={exercise.name}
                      onChange={(e) => updateExerciseName(exerciseIndex, e.target.value)}
                      placeholder="Exercise name"
                      className="exercise-name-input"
                    />
                    <button
                      onClick={() => removeExercise(exerciseIndex)}
                      className="remove-exercise-button"
                    >
                      <FiTrash2 />
                    </button>
                  </div>

                  <div className="sets-section">
                    <div className="sets-header">
                      <span>Sets</span>
                      <button
                        onClick={() => addSet(exerciseIndex)}
                        className="add-set-button"
                      >
                        <FiPlus /> Add Set
                      </button>
                    </div>

                    {exercise.sets.map((set, setIndex) => (
                      <div key={setIndex} className="set-row">
                        <span className="set-number">Set {setIndex + 1}</span>
                        <input
                          type="number"
                          value={set.weight || ''}
                          onChange={(e) => updateSet(exerciseIndex, setIndex, 'weight', Number(e.target.value))}
                          placeholder="Weight"
                          className="set-input"
                        />
                        <span className="set-label">lbs ×</span>
                        <input
                          type="number"
                          value={set.reps || ''}
                          onChange={(e) => updateSet(exerciseIndex, setIndex, 'reps', Number(e.target.value))}
                          placeholder="Reps"
                          className="set-input"
                        />
                        <span className="set-label">@</span>
                        <input
                          type="number"
                          value={set.rir ?? ''}
                          onChange={(e) => updateSet(exerciseIndex, setIndex, 'rir', Number(e.target.value))}
                          placeholder="RIR"
                          className="set-input rir-input"
                          min="0"
                          max="10"
                        />
                        <span className="set-label">RIR</span>
                        {exercise.sets.length > 1 && (
                          <button
                            onClick={() => removeSet(exerciseIndex, setIndex)}
                            className="remove-set-button"
                          >
                            <FiTrash2 />
                          </button>
                        )}
                      </div>
                    ))}

                    {exerciseIndex > 0 && (
                      <button
                        onClick={() => copySets(0, exerciseIndex)}
                        className="copy-sets-button"
                      >
                        <FiCopy /> Copy sets from first exercise
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        {exercises.length > 0 && (
          <div className="workout-summary">
            <h3>Workout Summary</h3>
            <p>{exercises.length} exercises, {exercises.reduce((sum, ex) => sum + ex.sets.length, 0)} total sets</p>
            <p className="summary-details">
              {exercises.map(ex => ex.name).filter(n => n).join(', ') || 'No named exercises yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomWorkoutPage;