import React, { useState } from 'react';
import { TrainingBlock, Workout, Exercise } from '../utils/types';

interface WorkoutAssignmentFormProps {
  trainingBlock: TrainingBlock;
  availableWorkouts: Workout[];
  onComplete: (assignments: WorkoutAssignment[]) => void;
  onCancel: () => void;
  onEditWorkout?: (workout: Workout) => void;
}

interface WorkoutAssignment {
  workoutName: string;
  assignedWorkout: Workout | null;
  customExercises: Exercise[];
}

const WorkoutAssignmentForm: React.FC<WorkoutAssignmentFormProps> = ({
  trainingBlock,
  availableWorkouts,
  onComplete,
  onCancel,
  onEditWorkout
}) => {
  const generateWorkoutSlots = (workouts: Workout[]): string[] => {
    // Detect unique workout types from available workouts
    const detectedTypes = new Set<string>();
    
    workouts.forEach(workout => {
      const name = workout.workout_name.toLowerCase();
      
      // Extract workout identifiers
      if (name.includes('fb1') || name.includes('full body 1')) detectedTypes.add('FB1');
      else if (name.includes('fb2') || name.includes('full body 2')) detectedTypes.add('FB2');
      else if (name.includes('push1') || name.includes('push 1')) detectedTypes.add('Push1');
      else if (name.includes('push2') || name.includes('push 2')) detectedTypes.add('Push2');
      else if (name.includes('pull1') || name.includes('pull 1')) detectedTypes.add('Pull1');
      else if (name.includes('pull2') || name.includes('pull 2')) detectedTypes.add('Pull2');
      else if (name.includes('legs1') || name.includes('legs 1')) detectedTypes.add('Legs1');
      else if (name.includes('legs2') || name.includes('legs 2')) detectedTypes.add('Legs2');
      else if (name.includes('upper')) detectedTypes.add('Upper');
      else if (name.includes('lower')) detectedTypes.add('Lower');
      else if (name.includes('push')) detectedTypes.add('Push');
      else if (name.includes('pull')) detectedTypes.add('Pull');
      else if (name.includes('legs') || name.includes('leg')) detectedTypes.add('Legs');
      else if (name.includes('full') || name.includes('fb')) detectedTypes.add('Full Body');
      else {
        // Create a slot for any unrecognized workout
        const cleanName = workout.workout_name.replace(/[^a-zA-Z0-9\s]/g, '').trim();
        detectedTypes.add(cleanName || 'Custom Workout');
      }
    });
    
    // If no specific types detected, create generic slots based on training frequency
    if (detectedTypes.size === 0) {
      const slots = [];
      for (let i = 1; i <= Math.min(trainingBlock.trainingDaysPerWeek, 7); i++) {
        slots.push(`Workout ${i}`);
      }
      return slots;
    }
    
    return Array.from(detectedTypes).sort();
  };

  const workoutSlots = generateWorkoutSlots(availableWorkouts);
  const [assignments, setAssignments] = useState<WorkoutAssignment[]>(
    workoutSlots.map(slot => ({
      workoutName: slot,
      assignedWorkout: null,
      customExercises: []
    }))
  );

  const [activeTab, setActiveTab] = useState(0);
  const [viewingWorkout, setViewingWorkout] = useState<Workout | null>(null);

  const handleWorkoutSelection = (slotIndex: number, workout: Workout | null) => {
    setAssignments(prev => prev.map((assignment, index) => 
      index === slotIndex 
        ? { ...assignment, assignedWorkout: workout }
        : assignment
    ));
  };

  const addCustomExercise = (slotIndex: number) => {
    const newExercise: Exercise = {
      name: '',
      sets: [{ weight: 0, reps: 8, rir: 3 }],
      rir: 3
    };

    setAssignments(prev => prev.map((assignment, index) => 
      index === slotIndex 
        ? { 
            ...assignment, 
            customExercises: [...assignment.customExercises, newExercise] 
          }
        : assignment
    ));
  };

  const updateCustomExercise = (slotIndex: number, exerciseIndex: number, field: string, value: any) => {
    setAssignments(prev => prev.map((assignment, index) => 
      index === slotIndex 
        ? {
            ...assignment,
            customExercises: assignment.customExercises.map((exercise, exIndex) =>
              exIndex === exerciseIndex
                ? { ...exercise, [field]: value }
                : exercise
            )
          }
        : assignment
    ));
  };

  const removeCustomExercise = (slotIndex: number, exerciseIndex: number) => {
    setAssignments(prev => prev.map((assignment, index) => 
      index === slotIndex 
        ? {
            ...assignment,
            customExercises: assignment.customExercises.filter((_, exIndex) => exIndex !== exerciseIndex)
          }
        : assignment
    ));
  };

  const getWorkoutTypeColor = (workoutName: string): string => {
    const name = workoutName.toLowerCase();
    if (name.includes('push')) return '#4CAF50';
    if (name.includes('pull')) return '#2196F3';
    if (name.includes('legs')) return '#FF9800';
    if (name.includes('fb') || name.includes('full')) return '#9C27B0';
    if (name.includes('upper')) return '#FF5722';
    if (name.includes('lower')) return '#E64A19';
    return '#757575';
  };

  const isFormValid = () => {
    return assignments.every(assignment => 
      assignment.assignedWorkout || assignment.customExercises.length > 0
    );
  };

  return (
    <>
      <div className="workout-assignment-overlay">
        <div className="workout-assignment-modal">
          <h2>Assign Workouts for {trainingBlock.split} Split</h2>
          <p>Assign specific workouts or create custom exercises for each workout type in your rotation.</p>
        
        <div className="assignment-tabs">
          {assignments.map((assignment, index) => (
            <button
              key={index}
              className={`tab-button ${activeTab === index ? 'active' : ''}`}
              onClick={() => setActiveTab(index)}
              style={{ 
                borderBottomColor: activeTab === index ? getWorkoutTypeColor(assignment.workoutName) : 'transparent'
              }}
            >
              {assignment.workoutName}
            </button>
          ))}
        </div>

        <div className="assignment-content">
          {assignments.map((assignment, slotIndex) => (
            <div 
              key={slotIndex} 
              className={`assignment-panel ${activeTab === slotIndex ? 'active' : ''}`}
            >
              <div className="workout-header">
                <h3 style={{ color: getWorkoutTypeColor(assignment.workoutName) }}>
                  {assignment.workoutName} Workout
                </h3>
              </div>

              <div className="assignment-section">
                <h4>Select Existing Workout</h4>
                <div className="workout-options">
                  <div 
                    className={`workout-option ${!assignment.assignedWorkout ? 'selected' : ''}`}
                    onClick={() => handleWorkoutSelection(slotIndex, null)}
                  >
                    <div className="option-content">
                      <span>Create Custom Workout</span>
                      <small>Build a workout from scratch</small>
                    </div>
                  </div>
                  
                  {availableWorkouts.length === 0 ? (
                    <div className="no-workouts-message">
                      <p>No saved workouts available yet.</p>
                      <p className="sub-text">Create custom workouts or go to the Create tab to build workout templates.</p>
                    </div>
                  ) : (
                    availableWorkouts.map((workout, workoutIndex) => (
                    <div 
                      key={workoutIndex}
                      className={`workout-option ${assignment.assignedWorkout?.workout_name === workout.workout_name ? 'selected' : ''}`}
                    >
                      <div 
                        className="option-content"
                        onClick={() => handleWorkoutSelection(slotIndex, workout)}
                      >
                        <span>{workout.workout_name}</span>
                        <small>{workout.exercises.length} exercises</small>
                      </div>
                      <div className="option-actions">
                        <button
                          className="action-button view"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingWorkout(workout);
                          }}
                          title="View workout details"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        </button>
                        {onEditWorkout && (
                          <button
                            className="action-button edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditWorkout(workout);
                            }}
                            title="Edit workout"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  )))}
                </div>
              </div>

              {!assignment.assignedWorkout && (
                <div className="custom-exercises-section">
                  <div className="section-header">
                    <h4>Custom Exercises</h4>
                    <button 
                      onClick={() => addCustomExercise(slotIndex)}
                      className="button small primary"
                    >
                      Add Exercise
                    </button>
                  </div>

                  {assignment.customExercises.map((exercise, exerciseIndex) => (
                    <div key={exerciseIndex} className="custom-exercise">
                      <div className="exercise-header">
                        <input
                          type="text"
                          placeholder="Exercise name..."
                          value={exercise.name}
                          onChange={(e) => updateCustomExercise(slotIndex, exerciseIndex, 'name', e.target.value)}
                          className="exercise-name-input"
                        />
                        <button
                          onClick={() => removeCustomExercise(slotIndex, exerciseIndex)}
                          className="button small danger"
                        >
                          Remove
                        </button>
                      </div>
                      
                      <div className="exercise-details">
                        <div className="detail-field">
                          <label>Sets:</label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={exercise.sets.length}
                            onChange={(e) => {
                              const setCount = parseInt(e.target.value) || 1;
                              const newSets = Array(setCount).fill(null).map(() => ({
                                weight: 0,
                                reps: 8,
                                rir: 3
                              }));
                              updateCustomExercise(slotIndex, exerciseIndex, 'sets', newSets);
                            }}
                            className="sets-input"
                          />
                        </div>
                        
                        <div className="detail-field">
                          <label>Target RIR:</label>
                          <input
                            type="number"
                            min="0"
                            max="5"
                            value={exercise.rir}
                            onChange={(e) => updateCustomExercise(slotIndex, exerciseIndex, 'rir', parseInt(e.target.value) || 0)}
                            className="rir-input"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {assignment.customExercises.length === 0 && (
                    <div className="empty-exercises">
                      <p>No exercises added yet. Click "Add Exercise" to start building your workout.</p>
                    </div>
                  )}
                </div>
              )}

              {assignment.assignedWorkout && (
                <div className="selected-workout-preview">
                  <h4>Selected Workout Preview</h4>
                  <div className="workout-preview">
                    <h5>{assignment.assignedWorkout.workout_name}</h5>
                    <div className="exercise-list">
                      {assignment.assignedWorkout.exercises.map((exercise, index) => (
                        <div key={index} className="exercise-item">
                          <span className="exercise-name">{exercise.name}</span>
                          <span className="exercise-sets">{exercise.sets.length} sets</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="assignment-actions">
          <button 
            onClick={() => onComplete(assignments)} 
            className="button primary"
            disabled={!isFormValid()}
          >
            Complete Assignment
          </button>
          <button onClick={onCancel} className="button secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>

      {viewingWorkout && (
        <div className="workout-view-modal-overlay" onClick={() => setViewingWorkout(null)}>
          <div className="workout-view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{viewingWorkout.workout_name}</h3>
              <button className="close-button" onClick={() => setViewingWorkout(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="modal-content">
              <div className="workout-stats">
                <div className="stat">
                  <span className="stat-label">Total Exercises</span>
                  <span className="stat-value">{viewingWorkout.exercises.length}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Total Sets</span>
                  <span className="stat-value">
                    {viewingWorkout.exercises.reduce((total, exercise) => total + exercise.sets.length, 0)}
                  </span>
                </div>
              </div>
              <div className="exercises-detail">
                <h4>Exercises</h4>
                {viewingWorkout.exercises.map((exercise, index) => (
                  <div key={index} className="exercise-detail">
                    <div className="exercise-detail-header">
                      <span className="exercise-number">{index + 1}</span>
                      <span className="exercise-detail-name">{exercise.name}</span>
                      <span className="exercise-detail-sets">{exercise.sets.length} sets</span>
                    </div>
                    <div className="sets-detail">
                      {exercise.sets.map((set, setIndex) => (
                        <div key={setIndex} className="set-detail">
                          <span>Set {setIndex + 1}:</span>
                          <span>{set.weight}lbs × {set.reps} reps</span>
                          <span>RIR: {set.rir}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              {onEditWorkout && (
                <button 
                  className="button primary"
                  onClick={() => {
                    setViewingWorkout(null);
                    onEditWorkout(viewingWorkout);
                  }}
                >
                  Edit Workout
                </button>
              )}
              <button className="button secondary" onClick={() => setViewingWorkout(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .workout-assignment-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .workout-assignment-modal {
          background: #1e1e1e;
          border-radius: 12px;
          padding: 2rem;
          max-width: 90vw;
          max-height: 90vh;
          width: 1000px;
          overflow-y: auto;
          color: #ffffff;
          border: 1px solid #404040;
        }

        .workout-assignment-modal h2 {
          color: #ffffff;
          margin-top: 0;
          margin-bottom: 1rem;
        }

        .workout-assignment-modal p {
          color: #b0b0b0;
          margin-bottom: 2rem;
        }

        .assignment-tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 2rem;
          border-bottom: 1px solid #404040;
        }

        .tab-button {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px 8px 0 0;
          background: #2a2a2a;
          color: #b0b0b0;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border-bottom: 3px solid transparent;
        }

        .tab-button:hover {
          background: #333333;
          color: #ffffff;
        }

        .tab-button.active {
          background: #1a2332;
          color: #ffffff;
        }

        .assignment-content {
          position: relative;
        }

        .assignment-panel {
          display: none;
        }

        .assignment-panel.active {
          display: block;
        }

        .workout-header h3 {
          margin: 0 0 1.5rem 0;
          font-size: 1.5rem;
        }

        .assignment-section {
          margin-bottom: 2rem;
        }

        .assignment-section h4 {
          color: #ffffff;
          margin-bottom: 1rem;
        }

        .workout-options {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .workout-option {
          border: 2px solid #404040;
          border-radius: 8px;
          padding: 1rem;
          transition: all 0.2s ease;
          background: #2a2a2a;
          position: relative;
        }

        .workout-option:hover {
          border-color: #666666;
          background: #333333;
        }

        .workout-option.selected {
          border-color: #2196F3;
          background: #1a2332;
        }

        .option-content {
          cursor: pointer;
        }

        .option-actions {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          display: flex;
          gap: 0.5rem;
        }

        .action-button {
          width: 32px;
          height: 32px;
          border: 1px solid #404040;
          border-radius: 6px;
          background: #1e1e1e;
          color: #b0b0b0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          padding: 0;
        }

        .action-button:hover {
          background: #333333;
          border-color: #666666;
          color: #ffffff;
        }

        .action-button.view:hover {
          background: #1976D2;
          border-color: #1976D2;
          color: #ffffff;
        }

        .action-button.edit:hover {
          background: #4CAF50;
          border-color: #4CAF50;
          color: #ffffff;
        }

        .option-content span {
          display: block;
          color: #ffffff;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .option-content small {
          color: #b0b0b0;
          font-size: 0.85rem;
        }

        .custom-exercises-section {
          border: 1px solid #404040;
          border-radius: 8px;
          padding: 1.5rem;
          background: #2a2a2a;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .section-header h4 {
          margin: 0;
          color: #ffffff;
        }

        .custom-exercise {
          border: 1px solid #404040;
          border-radius: 6px;
          padding: 1rem;
          margin-bottom: 1rem;
          background: #1e1e1e;
        }

        .custom-exercise:last-child {
          margin-bottom: 0;
        }

        .exercise-header {
          display: flex;
          gap: 1rem;
          align-items: center;
          margin-bottom: 1rem;
        }

        .exercise-name-input {
          flex: 1;
          padding: 0.5rem;
          border: 1px solid #404040;
          border-radius: 4px;
          background: #2a2a2a;
          color: #ffffff;
          font-size: 1rem;
        }

        .exercise-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 1rem;
        }

        .detail-field {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .detail-field label {
          font-size: 0.875rem;
          color: #b0b0b0;
          font-weight: 600;
        }

        .sets-input, .rir-input {
          padding: 0.5rem;
          border: 1px solid #404040;
          border-radius: 4px;
          background: #2a2a2a;
          color: #ffffff;
          width: 80px;
        }

        .empty-exercises {
          text-align: center;
          padding: 2rem;
          color: #888888;
          font-style: italic;
        }

        .selected-workout-preview {
          border: 1px solid #404040;
          border-radius: 8px;
          padding: 1.5rem;
          background: #2a2a2a;
        }

        .selected-workout-preview h4 {
          margin: 0 0 1rem 0;
          color: #ffffff;
        }

        .workout-preview h5 {
          margin: 0 0 1rem 0;
          color: #2196F3;
        }

        .exercise-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 0.5rem;
        }

        .exercise-item {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem;
          background: #1e1e1e;
          border-radius: 4px;
          border: 1px solid #404040;
        }

        .exercise-name {
          color: #ffffff;
          font-weight: 600;
        }

        .exercise-sets {
          color: #b0b0b0;
          font-size: 0.875rem;
        }

        .assignment-actions {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
          justify-content: flex-end;
          padding-top: 2rem;
          border-top: 1px solid #404040;
        }

        .button {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .button.small {
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
        }

        .button.primary {
          background: #2196F3;
          color: white;
        }

        .button.primary:hover:not(:disabled) {
          background: #1976D2;
        }

        .button.primary:disabled {
          background: #666666;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .button.secondary {
          background: #404040;
          color: #ffffff;
          border: 1px solid #666666;
        }

        .button.secondary:hover {
          background: #555555;
        }

        .button.danger {
          background: #f44336;
          color: white;
        }

        .button.danger:hover {
          background: #d32f2f;
        }

        /* Workout View Modal Styles */
        .workout-view-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 2000;
        }

        .workout-view-modal {
          background: #1e1e1e;
          border-radius: 12px;
          padding: 0;
          max-width: 600px;
          width: 90%;
          max-height: 80vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          border: 1px solid #404040;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #404040;
          background: #2a2a2a;
        }

        .modal-header h3 {
          margin: 0;
          color: #ffffff;
          font-size: 1.5rem;
        }

        .close-button {
          width: 40px;
          height: 40px;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: #b0b0b0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .close-button:hover {
          background: #404040;
          color: #ffffff;
        }

        .modal-content {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
        }

        .workout-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .stat {
          background: #2a2a2a;
          border: 1px solid #404040;
          border-radius: 8px;
          padding: 1rem;
          text-align: center;
        }

        .stat-label {
          display: block;
          color: #b0b0b0;
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
        }

        .stat-value {
          display: block;
          color: #2196F3;
          font-size: 2rem;
          font-weight: 700;
        }

        .no-workouts-message {
          text-align: center;
          padding: 2rem;
          color: #b0b0b0;
        }

        .no-workouts-message p {
          margin: 0 0 0.5rem 0;
        }

        .no-workouts-message .sub-text {
          font-size: 0.875rem;
          color: #888888;
        }

        .exercises-detail h4 {
          color: #ffffff;
          margin: 0 0 1rem 0;
        }

        .exercise-detail {
          background: #2a2a2a;
          border: 1px solid #404040;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .exercise-detail:last-child {
          margin-bottom: 0;
        }

        .exercise-detail-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .exercise-number {
          width: 30px;
          height: 30px;
          background: #2196F3;
          color: #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .exercise-detail-name {
          flex: 1;
          color: #ffffff;
          font-weight: 600;
        }

        .exercise-detail-sets {
          color: #b0b0b0;
          font-size: 0.875rem;
        }

        .sets-detail {
          margin-left: 2.5rem;
        }

        .set-detail {
          display: flex;
          gap: 1rem;
          padding: 0.5rem;
          background: #1e1e1e;
          border-radius: 4px;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
        }

        .set-detail:last-child {
          margin-bottom: 0;
        }

        .set-detail span:first-child {
          color: #b0b0b0;
          min-width: 50px;
        }

        .set-detail span:nth-child(2) {
          color: #ffffff;
          flex: 1;
        }

        .set-detail span:nth-child(3) {
          color: #4CAF50;
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          padding: 1.5rem;
          border-top: 1px solid #404040;
          background: #2a2a2a;
          justify-content: flex-end;
        }

        @media (max-width: 768px) {
          .workout-assignment-modal {
            margin: 1rem;
            padding: 1.5rem;
            width: auto;
          }

          .assignment-tabs {
            flex-wrap: wrap;
          }

          .tab-button {
            flex: 1;
            min-width: 100px;
          }

          .workout-options {
            grid-template-columns: 1fr;
          }

          .exercise-details {
            grid-template-columns: 1fr 1fr;
          }

          .exercise-header {
            flex-direction: column;
            align-items: stretch;
          }

          .assignment-actions {
            flex-direction: column;
          }

          .workout-view-modal {
            max-width: 100%;
            max-height: 90vh;
            margin: 1rem;
          }

          .modal-actions {
            flex-direction: column;
          }

          .workout-stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
};

export default WorkoutAssignmentForm;