import React, { useState, useEffect, useCallback } from 'react';
import { TrainingBlock, Workout, Exercise } from '../utils/types';
import EditWorkout from './EditWorkout';

interface RotationItem {
  id: string;
  name: string;
  type: string;
  workout?: Workout;
  isRest: boolean;
  dayIndex: number;
}

interface InteractiveRotationEditorProps {
  trainingBlock: TrainingBlock;
  availableWorkouts: Workout[];
  onPatternChange: (pattern: RotationItem[]) => void;
  onEditWorkout?: (workout: Workout) => void;
}

const InteractiveRotationEditor: React.FC<InteractiveRotationEditorProps> = ({
  trainingBlock,
  availableWorkouts,
  onPatternChange,
  onEditWorkout
}) => {
  const [rotationPattern, setRotationPattern] = useState<RotationItem[]>([]);
  const [rotationLength, setRotationLength] = useState<number>(7);
  const [draggedItem, setDraggedItem] = useState<RotationItem | null>(null);
  const [showWorkoutSelector, setShowWorkoutSelector] = useState<{ dayIndex: number; item: RotationItem } | null>(null);
  const [showCustomWorkoutModal, setShowCustomWorkoutModal] = useState(false);
  const [customWorkout, setCustomWorkout] = useState<{ name: string; exercises: Exercise[] }>({ name: '', exercises: [] });
  const [viewingWorkout, setViewingWorkout] = useState<Workout | null>(null);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);

  const generateInitialPattern = useCallback((): RotationItem[] => {
    const pattern: RotationItem[] = [];
    const workoutGroups: { [key: string]: Workout[] } = {};
    
    availableWorkouts.forEach(workout => {
      const name = workout.workout_name.toLowerCase();
      let category = 'general';
      
      if (name.includes('push')) category = 'push';
      else if (name.includes('pull')) category = 'pull';
      else if (name.includes('legs') || name.includes('leg')) category = 'legs';
      else if (name.includes('upper')) category = 'upper';
      else if (name.includes('lower')) category = 'lower';
      else if (name.includes('full') || name.includes('fb')) category = 'fullbody';
      else if (name.includes('chest')) category = 'push';
      else if (name.includes('back')) category = 'pull';
      else if (name.includes('shoulders')) category = 'push';
      
      if (!workoutGroups[category]) workoutGroups[category] = [];
      workoutGroups[category].push(workout);
    });

    const categories = Object.keys(workoutGroups);
    const trainingDays = trainingBlock.trainingDaysPerWeek;
    const adjustedTrainingDays = Math.ceil((trainingDays * rotationLength) / 7); // Scale training days for longer rotations
    
    for (let day = 0; day < rotationLength; day++) {
      if (categories.includes('fullbody')) {
        if (day % 2 === 0 && pattern.filter(p => !p.isRest).length < adjustedTrainingDays) {
          const fbWorkouts = workoutGroups['fullbody'];
          const workoutIndex = Math.floor(pattern.filter(p => !p.isRest).length / 2) % fbWorkouts.length;
          const workout = fbWorkouts[workoutIndex];
          pattern.push({
            id: `day-${day}`,
            name: workout.workout_name,
            type: `FB${workoutIndex + 1}`,
            workout: workout,
            isRest: false,
            dayIndex: day
          });
        } else {
          pattern.push({
            id: `day-${day}`,
            name: 'Rest',
            type: 'Rest',
            isRest: true,
            dayIndex: day
          });
        }
      } else if (categories.includes('push') && categories.includes('pull') && categories.includes('legs')) {
        const pplOrder = ['push', 'pull', 'legs'];
        const workoutCount = pattern.filter(p => !p.isRest).length;
        
        if (workoutCount < adjustedTrainingDays) {
          const categoryIndex = workoutCount % 3;
          const category = pplOrder[categoryIndex];
          const categoryWorkouts = workoutGroups[category] || [];
          
          if (categoryWorkouts.length > 0) {
            const workoutIndex = Math.floor(workoutCount / 3) % categoryWorkouts.length;
            const workout = categoryWorkouts[workoutIndex];
            const variation = categoryWorkouts.length > 1 ? workoutIndex + 1 : '';
            
            pattern.push({
              id: `day-${day}`,
              name: workout.workout_name,
              type: `${category.charAt(0).toUpperCase() + category.slice(1)}${variation}`,
              workout: workout,
              isRest: false,
              dayIndex: day
            });
          } else {
            pattern.push({
              id: `day-${day}`,
              name: 'Rest',
              type: 'Rest',
              isRest: true,
              dayIndex: day
            });
          }
        } else {
          pattern.push({
            id: `day-${day}`,
            name: 'Rest',
            type: 'Rest',
            isRest: true,
            dayIndex: day
          });
        }
      } else {
        const workoutCount = pattern.filter(p => !p.isRest).length;
        if (workoutCount < adjustedTrainingDays && availableWorkouts.length > 0) {
          const workout = availableWorkouts[workoutCount % availableWorkouts.length];
          pattern.push({
            id: `day-${day}`,
            name: workout.workout_name,
            type: `Workout ${workoutCount + 1}`,
            workout: workout,
            isRest: false,
            dayIndex: day
          });
        } else {
          pattern.push({
            id: `day-${day}`,
            name: 'Rest',
            type: 'Rest',
            isRest: true,
            dayIndex: day
          });
        }
      }
    }

    return pattern;
  }, [trainingBlock.trainingDaysPerWeek, availableWorkouts, rotationLength]);

  // Initialize pattern only once when component mounts or training block changes
  useEffect(() => {
    const pattern = generateInitialPattern();
    setRotationPattern(pattern);
    // Use setTimeout to avoid immediate re-render cycle
    setTimeout(() => {
      onPatternChange(pattern);
    }, 0);
  }, [trainingBlock.id, trainingBlock.split, trainingBlock.trainingDaysPerWeek]); // Use specific props to avoid re-renders

  useEffect(() => {
    // Handle rotation length changes separately to preserve existing workouts
    if (rotationPattern.length === 0) return; // Skip if pattern not initialized
    
    const newPattern = [...rotationPattern];
    let changed = false;
    
    if (rotationLength > rotationPattern.length) {
      // Add new days
      for (let i = rotationPattern.length; i < rotationLength; i++) {
        newPattern.push({
          id: `day-${i}`,
          name: 'Rest',
          type: 'Rest',
          isRest: true,
          dayIndex: i
        });
      }
      changed = true;
    } else if (rotationLength < rotationPattern.length) {
      // Remove days
      newPattern.splice(rotationLength);
      changed = true;
    }
    
    if (changed) {
      // Update day indices
      newPattern.forEach((item, index) => {
        item.dayIndex = index;
      });
      
      setRotationPattern(newPattern);
      // Use setTimeout to avoid immediate re-render cycle
      setTimeout(() => {
        onPatternChange(newPattern);
      }, 0);
    }
  }, [rotationLength, rotationPattern.length]); // Only depend on lengths, not the full pattern


  const handleDragStart = (e: React.DragEvent, item: RotationItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!draggedItem) return;

    const newPattern = [...rotationPattern];
    const draggedIndex = newPattern.findIndex(item => item.id === draggedItem.id);
    
    if (draggedIndex !== -1 && draggedIndex !== targetIndex) {
      // Swap the items
      const temp = newPattern[targetIndex];
      newPattern[targetIndex] = { ...draggedItem, dayIndex: targetIndex };
      newPattern[draggedIndex] = { ...temp, dayIndex: draggedIndex };
      
      setRotationPattern(newPattern);
      onPatternChange(newPattern);
    }
    
    setDraggedItem(null);
  };

  const handleWorkoutSelection = (dayIndex: number, selectedWorkout: Workout | null) => {
    const newPattern = [...rotationPattern];
    
    if (selectedWorkout) {
      // Determine the workout type based on the workout name
      const workoutNameLower = selectedWorkout.workout_name.toLowerCase();
      let type = 'Workout';
      
      if (workoutNameLower.includes('push')) type = 'Push';
      else if (workoutNameLower.includes('pull')) type = 'Pull';
      else if (workoutNameLower.includes('legs') || workoutNameLower.includes('leg')) type = 'Legs';
      else if (workoutNameLower.includes('upper')) type = 'Upper';
      else if (workoutNameLower.includes('lower')) type = 'Lower';
      else if (workoutNameLower.includes('full') || workoutNameLower.includes('fb')) type = 'Full Body';
      else if (workoutNameLower.includes('chest')) type = 'Push';
      else if (workoutNameLower.includes('back')) type = 'Pull';
      
      newPattern[dayIndex] = {
        id: `day-${dayIndex}`,
        name: selectedWorkout.workout_name,
        workout: selectedWorkout,
        isRest: false,
        type: type,
        dayIndex: dayIndex
      };
    } else {
      newPattern[dayIndex] = {
        id: `day-${dayIndex}`,
        name: 'Rest',
        isRest: true,
        type: 'Rest',
        workout: undefined,
        dayIndex: dayIndex
      };
    }
    
    // Update state and call onPatternChange
    setRotationPattern(newPattern);
    onPatternChange(newPattern);
    setShowWorkoutSelector(null);
  };

  const handleCustomWorkout = () => {
    if (customWorkout.name && showWorkoutSelector) {
      const newWorkout: Workout = {
        workout_name: customWorkout.name,
        exercises: customWorkout.exercises,
        assigned_days: [],
        clerk_user_id: ''
      };
      
      handleWorkoutSelection(showWorkoutSelector.dayIndex, newWorkout);
      setCustomWorkout({ name: '', exercises: [] });
      setShowCustomWorkoutModal(false);
    }
  };

  const addCustomExercise = () => {
    const newExercise: Exercise = {
      name: '',
      sets: [{ weight: 0, reps: 8, rir: 3 }],
      rir: 3
    };
    setCustomWorkout(prev => ({
      ...prev,
      exercises: [...prev.exercises, newExercise]
    }));
  };

  const updateCustomExercise = (index: number, field: string, value: any) => {
    setCustomWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.map((exercise, i) => 
        i === index ? { ...exercise, [field]: value } : exercise
      )
    }));
  };

  const removeCustomExercise = (index: number) => {
    setCustomWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }));
  };

  const getWorkoutTypeColor = (type: string, isRest: boolean): string => {
    if (isRest || type.toLowerCase() === 'rest') {
      return '#424242'; // Grey for rest days
    }
    
    const typeLower = type.toLowerCase();
    
    // Check for specific workout types
    if (typeLower.includes('push')) return '#4CAF50';
    if (typeLower.includes('pull')) return '#2196F3';
    if (typeLower.includes('legs') || typeLower.includes('leg')) return '#FF9800';
    if (typeLower.includes('upper')) return '#FF5722';
    if (typeLower.includes('lower')) return '#E64A19';
    if (typeLower.includes('full') || typeLower.includes('fb')) return '#9C27B0';
    if (typeLower.includes('chest')) return '#4CAF50';
    if (typeLower.includes('back')) return '#2196F3';
    if (typeLower.includes('shoulder')) return '#4CAF50';
    if (typeLower.includes('arm')) return '#FF5722';
    
    // Default color for other workouts
    return '#00BCD4'; // Cyan for generic workouts
  };

  return (
    <div className="interactive-rotation-editor">
      <h3>Customize Your Training Rotation</h3>
      <p>Drag and drop to rearrange days, or click on any day to change the workout.</p>
      
      <div className="rotation-controls">
        <div className="rotation-length-control">
          <label htmlFor="rotation-length">Rotation Length:</label>
          <div className="rotation-input-group">
            <input
              type="number"
              id="rotation-length"
              min="1"
              max="21"
              value={rotationLength}
              onChange={(e) => setRotationLength(Number(e.target.value))}
              className="rotation-length-input"
            />
            <span className="rotation-unit">days</span>
          </div>
        </div>
        <div className="rotation-info">
          <span>Training days in rotation: {rotationPattern.filter(p => !p.isRest).length}</span>
        </div>
      </div>
      
      <div className="rotation-calendar">
        <div className="week-header">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="day-header">{day}</div>
          ))}
        </div>
        
        {Array.from({ length: Math.ceil(rotationLength / 7) }, (_, weekIndex) => (
          <div key={weekIndex} className="week-row">
            {Array.from({ length: 7 }, (_, dayIndex) => {
              const actualIndex = weekIndex * 7 + dayIndex;
              const item = rotationPattern[actualIndex];
              
              if (!item) {
                // Empty cell for days beyond rotation length
                return <div key={`empty-${actualIndex}`} className="day-cell empty-cell"></div>;
              }
              
              return (
                <div 
                  key={item.id}
                  className={`day-cell ${draggedItem?.id === item.id ? 'dragging' : ''} ${item.isRest ? 'rest-day' : ''}`}
                  style={{ backgroundColor: getWorkoutTypeColor(item.type, item.isRest) }}
                  draggable={!item.isRest}
                  onDragStart={(e) => handleDragStart(e, item)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, actualIndex)}
                  onClick={() => setShowWorkoutSelector({ dayIndex: actualIndex, item })}
                >
                  <div className="workout-name">{item.name}</div>
                  <div className="workout-type">{item.type}</div>
                  <div className="day-number">Day {actualIndex + 1}</div>
                  {!item.isRest && (
                    <div className="drag-indicator">⋮⋮</div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {showWorkoutSelector && (
        <div className="workout-selector-modal" onClick={() => setShowWorkoutSelector(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h4>Select Workout for Day {showWorkoutSelector.dayIndex + 1}</h4>
            
            <div className="workout-options">
              <div 
                className="workout-option rest-option"
                onClick={() => handleWorkoutSelection(showWorkoutSelector.dayIndex, null)}
              >
                <span>Rest Day</span>
              </div>
              
              {availableWorkouts.map((workout, index) => (
                <div 
                  key={index}
                  className="workout-option"
                  onClick={() => handleWorkoutSelection(showWorkoutSelector.dayIndex, workout)}
                  style={{ cursor: 'pointer' }}
                >
                  <div 
                    className="workout-info"
                  >
                    <span>{workout.workout_name}</span>
                    <small>{workout.exercises.length} exercises</small>
                  </div>
                  <div className="workout-actions">
                    <button
                      className="action-btn view"
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
                    <button
                      className="action-btn edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingWorkout(workout);
                      }}
                      title="Edit workout"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              
              <div 
                className="workout-option create-option"
                onClick={() => {
                  setShowCustomWorkoutModal(true);
                }}
              >
                <span>Create Custom Workout</span>
                <small>Build from scratch</small>
              </div>
            </div>
            
            <button 
              onClick={() => setShowWorkoutSelector(null)}
              className="close-button"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showCustomWorkoutModal && (
        <div className="custom-workout-modal">
          <div className="modal-content large">
            <h4>Create Custom Workout</h4>
            
            <div className="workout-name-field">
              <label>Workout Name:</label>
              <input
                type="text"
                value={customWorkout.name}
                onChange={(e) => setCustomWorkout(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter workout name..."
              />
            </div>

            <div className="exercises-section">
              <div className="section-header">
                <h5>Exercises</h5>
                <button onClick={addCustomExercise} className="add-button">
                  Add Exercise
                </button>
              </div>

              {customWorkout.exercises.map((exercise, index) => (
                <div key={index} className="exercise-item">
                  <input
                    type="text"
                    value={exercise.name}
                    onChange={(e) => updateCustomExercise(index, 'name', e.target.value)}
                    placeholder="Exercise name..."
                  />
                  <input
                    type="number"
                    value={exercise.sets.length}
                    onChange={(e) => {
                      const setCount = parseInt(e.target.value) || 1;
                      const newSets = Array(setCount).fill(null).map(() => ({
                        weight: 0, reps: 8, rir: 3
                      }));
                      updateCustomExercise(index, 'sets', newSets);
                    }}
                    min="1"
                    max="10"
                    placeholder="Sets"
                  />
                  <button 
                    onClick={() => removeCustomExercise(index)}
                    className="remove-button"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="modal-actions">
              <button onClick={handleCustomWorkout} className="save-button">
                Save Workout
              </button>
              <button 
                onClick={() => {
                  setShowCustomWorkoutModal(false);
                  setCustomWorkout({ name: '', exercises: [] });
                }}
                className="cancel-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingWorkout && (
        <div className="workout-view-overlay" onClick={() => setViewingWorkout(null)}>
          <div className="workout-view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="view-modal-header">
              <h3>{viewingWorkout.workout_name}</h3>
              <button className="close-view-button" onClick={() => setViewingWorkout(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="view-modal-content">
              <div className="workout-summary">
                <div className="summary-stat">
                  <span className="stat-label">Total Exercises</span>
                  <span className="stat-value">{viewingWorkout.exercises.length}</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-label">Total Sets</span>
                  <span className="stat-value">
                    {viewingWorkout.exercises.reduce((total, exercise) => total + exercise.sets.length, 0)}
                  </span>
                </div>
              </div>
              <div className="exercise-details">
                <h4>Exercises</h4>
                {viewingWorkout.exercises.map((exercise, index) => (
                  <div key={index} className="exercise-detail-item">
                    <div className="exercise-detail-header">
                      <span className="exercise-number">{index + 1}</span>
                      <span className="exercise-detail-name">{exercise.name}</span>
                      <span className="exercise-sets-count">{exercise.sets.length} sets</span>
                    </div>
                    <div className="sets-breakdown">
                      {exercise.sets.map((set, setIndex) => (
                        <div key={setIndex} className="set-info">
                          <span>Set {setIndex + 1}:</span>
                          <span>{set.weight}lbs × {set.reps} reps</span>
                          <span className="rir">RIR: {set.rir}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="view-modal-actions">
              <button 
                className="edit-from-view-button"
                onClick={() => {
                  setViewingWorkout(null);
                  setEditingWorkout(viewingWorkout);
                }}
              >
                Edit Workout
              </button>
              <button className="close-modal-button" onClick={() => setViewingWorkout(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {editingWorkout && (
        <div className="edit-workout-overlay" onClick={() => setEditingWorkout(null)}>
          <div className="edit-workout-modal" onClick={(e) => e.stopPropagation()}>
            <EditWorkout
              savedWorkout={editingWorkout}
              onUpdateWorkout={(updatedWorkout) => {
                // Update the workout in available workouts if onEditWorkout is provided
                if (onEditWorkout) {
                  onEditWorkout(updatedWorkout);
                }
                
                // Update the workout in the rotation pattern
                setRotationPattern(prevPattern => 
                  prevPattern.map(item => 
                    item.workout?.workout_name === editingWorkout.workout_name
                      ? { ...item, workout: updatedWorkout, name: updatedWorkout.workout_name }
                      : item
                  )
                );
                
                // Update the pattern through the callback
                onPatternChange(rotationPattern.map(item => 
                  item.workout?.workout_name === editingWorkout.workout_name
                    ? { ...item, workout: updatedWorkout, name: updatedWorkout.workout_name }
                    : item
                ));
                
                setEditingWorkout(null);
              }}
            />
            <button 
              className="close-edit-button"
              onClick={() => setEditingWorkout(null)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      <style>{`
        .interactive-rotation-editor {
          margin: 2rem 0;
        }

        .interactive-rotation-editor h3 {
          color: #ffffff;
          margin-bottom: 0.5rem;
        }

        .interactive-rotation-editor p {
          color: #b0b0b0;
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }

        .rotation-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: #2a2a2a;
          border-radius: 8px;
          border: 1px solid #404040;
        }

        .rotation-length-control {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .rotation-length-control label {
          color: #ffffff;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .rotation-input-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .rotation-length-input {
          padding: 0.5rem;
          border: 1px solid #404040;
          border-radius: 6px;
          background: #1e1e1e;
          color: #ffffff;
          font-size: 0.9rem;
          width: 80px;
          text-align: center;
        }

        .rotation-length-input:focus {
          outline: none;
          border-color: #2196F3;
          box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
        }

        .rotation-unit {
          color: #b0b0b0;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .rotation-info {
          color: #b0b0b0;
          font-size: 0.9rem;
        }

        .rotation-info span {
          background: #1a2332;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          border: 1px solid #2196F3;
          color: #64b5f6;
        }

        .rotation-calendar {
          border: 1px solid #404040;
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 1rem;
        }

        .week-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          background: #2a2a2a;
        }

        .day-header {
          padding: 0.75rem;
          text-align: center;
          font-weight: 600;
          color: #ffffff;
          border-right: 1px solid #404040;
        }

        .day-header:last-child {
          border-right: none;
        }

        .week-row {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
        }

        .day-cell {
          padding: 1rem;
          text-align: center;
          color: white;
          border-right: 1px solid rgba(255,255,255,0.2);
          min-height: 80px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 0.25rem;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .day-cell:hover {
          brightness: 1.1;
          transform: translateY(-1px);
        }

        .day-cell.dragging {
          opacity: 0.5;
          transform: rotate(2deg);
        }

        .day-cell:last-child {
          border-right: none;
        }

        .day-cell.rest-day {
          opacity: 0.8;
        }

        .day-cell.rest-day .workout-type {
          color: #e0e0e0;
        }

        .day-cell.rest-day .workout-name {
          color: #bdbdbd;
        }

        .day-cell.rest-day .day-number {
          color: #9e9e9e;
        }

        .workout-name {
          font-weight: 700;
          font-size: 0.9rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .workout-type {
          font-size: 0.7rem;
          opacity: 0.9;
        }

        .day-number {
          font-size: 0.6rem;
          opacity: 0.7;
          font-weight: 500;
        }

        .empty-cell {
          background: transparent !important;
          cursor: default;
          opacity: 0.3;
          border-right: 1px solid rgba(255,255,255,0.1);
        }

        .empty-cell:hover {
          transform: none;
          brightness: 1;
        }

        .drag-indicator {
          position: absolute;
          bottom: 4px;
          right: 4px;
          font-size: 0.7rem;
          opacity: 0.6;
        }

        .workout-selector-modal {
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
          overflow-y: auto;
        }

        .custom-workout-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1001;
        }

        .modal-content {
          background: #1e1e1e;
          border-radius: 12px;
          padding: 2rem;
          max-width: 500px;
          max-height: 80vh;
          overflow-y: auto;
          color: #ffffff;
          border: 1px solid #404040;
          position: relative;
          z-index: 1001;
        }

        .modal-content.large {
          max-width: 700px;
        }

        .modal-content h4 {
          margin-top: 0;
          color: #ffffff;
        }

        .workout-options {
          display: grid;
          gap: 0.75rem;
          margin: 1.5rem 0;
        }

        .workout-option {
          padding: 1rem;
          border: 2px solid #404040;
          border-radius: 8px;
          transition: all 0.2s ease;
          background: #2a2a2a;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          position: relative;
          z-index: 1;
        }

        .workout-option:hover {
          border-color: #2196F3;
          background: #333333;
          transform: translateY(-1px);
        }

        .workout-info {
          flex: 1;
          pointer-events: none;
        }

        .workout-info span {
          display: block;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .workout-info small {
          color: #b0b0b0;
          font-size: 0.85rem;
        }

        .workout-actions {
          display: flex;
          gap: 0.5rem;
          margin-left: 1rem;
          position: relative;
          z-index: 2;
        }

        .action-btn {
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
          pointer-events: auto;
        }

        .action-btn:hover {
          background: #333333;
          border-color: #666666;
          color: #ffffff;
        }

        .action-btn.view:hover {
          background: #1976D2;
          border-color: #1976D2;
          color: #ffffff;
        }

        .action-btn.edit:hover {
          background: #4CAF50;
          border-color: #4CAF50;
          color: #ffffff;
        }

        .workout-option.rest-option {
          background: #424242;
          color: #e0e0e0;
          cursor: pointer;
          position: relative;
          z-index: 1;
        }

        .workout-option.create-option {
          background: #1a2332;
          border-color: #2196F3;
          cursor: pointer;
          position: relative;
          z-index: 1;
        }

        .close-button, .cancel-button {
          background: #404040;
          color: #ffffff;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .close-button:hover, .cancel-button:hover {
          background: #555555;
        }

        .workout-name-field {
          margin-bottom: 1.5rem;
        }

        .workout-name-field label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
        }

        .workout-name-field input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #404040;
          border-radius: 6px;
          background: #2a2a2a;
          color: #ffffff;
          font-size: 1rem;
        }

        .exercises-section {
          margin-bottom: 1.5rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .section-header h5 {
          margin: 0;
          color: #ffffff;
        }

        .add-button, .save-button {
          background: #2196F3;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: background 0.2s ease;
        }

        .add-button:hover, .save-button:hover {
          background: #1976D2;
        }

        .exercise-item {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          margin-bottom: 0.75rem;
          padding: 1rem;
          background: #2a2a2a;
          border-radius: 6px;
          border: 1px solid #404040;
        }

        .exercise-item input {
          flex: 1;
          padding: 0.5rem;
          border: 1px solid #404040;
          border-radius: 4px;
          background: #1e1e1e;
          color: #ffffff;
        }

        .exercise-item input[type="number"] {
          width: 80px;
          flex: none;
        }

        .remove-button {
          background: #f44336;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .remove-button:hover {
          background: #d32f2f;
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        /* Workout View Modal Styles */
        .workout-view-overlay {
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

        .view-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #404040;
          background: #2a2a2a;
        }

        .view-modal-header h3 {
          margin: 0;
          color: #ffffff;
          font-size: 1.5rem;
        }

        .close-view-button {
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

        .close-view-button:hover {
          background: #404040;
          color: #ffffff;
        }

        .view-modal-content {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
        }

        .workout-summary {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .summary-stat {
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

        .exercise-details h4 {
          color: #ffffff;
          margin: 0 0 1rem 0;
        }

        .exercise-detail-item {
          background: #2a2a2a;
          border: 1px solid #404040;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .exercise-detail-item:last-child {
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

        .exercise-sets-count {
          color: #b0b0b0;
          font-size: 0.875rem;
        }

        .sets-breakdown {
          margin-left: 2.5rem;
        }

        .set-info {
          display: flex;
          gap: 1rem;
          padding: 0.5rem;
          background: #1e1e1e;
          border-radius: 4px;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
        }

        .set-info:last-child {
          margin-bottom: 0;
        }

        .set-info span:first-child {
          color: #b0b0b0;
          min-width: 50px;
        }

        .set-info span:nth-child(2) {
          color: #ffffff;
          flex: 1;
        }

        .set-info .rir {
          color: #4CAF50;
        }

        .view-modal-actions {
          display: flex;
          gap: 1rem;
          padding: 1.5rem;
          border-top: 1px solid #404040;
          background: #2a2a2a;
          justify-content: flex-end;
        }

        .edit-from-view-button {
          background: #2196F3;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .edit-from-view-button:hover {
          background: #1976D2;
        }

        .close-modal-button {
          background: #404040;
          color: #ffffff;
          border: 1px solid #666666;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .close-modal-button:hover {
          background: #555555;
        }

        /* Edit Workout Modal Styles */
        .edit-workout-overlay {
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
          padding: 2rem;
        }

        .edit-workout-modal {
          background: #1e1e1e;
          border-radius: 12px;
          padding: 2rem;
          max-width: 1200px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          border: 1px solid #404040;
        }

        .close-edit-button {
          position: absolute;
          top: 1rem;
          right: 1rem;
          width: 40px;
          height: 40px;
          border: none;
          border-radius: 8px;
          background: #404040;
          color: #b0b0b0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          z-index: 10;
        }

        .close-edit-button:hover {
          background: #555555;
          color: #ffffff;
        }

        @media (max-width: 768px) {
          .rotation-controls {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .rotation-length-control {
            justify-content: center;
          }

          .day-cell {
            padding: 0.75rem;
            min-height: 60px;
          }

          .workout-type {
            font-size: 0.8rem;
          }

          .workout-name {
            font-size: 0.6rem;
          }

          .day-number {
            font-size: 0.5rem;
          }

          .modal-content {
            margin: 1rem;
            padding: 1.5rem;
          }

          .exercise-item {
            flex-direction: column;
            align-items: stretch;
          }

          .exercise-item input[type="number"] {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default InteractiveRotationEditor;