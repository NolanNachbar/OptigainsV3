import React, { useState, useEffect, useMemo } from 'react';
import { Workout, TrainingBlock } from '../utils/types';

interface RotationPreviewProps {
  trainingBlock: TrainingBlock;
  workoutRotation: string[];
  availableWorkouts: Workout[];
  onRotationChange?: (newRotation: string[]) => void;
  readOnly?: boolean;
}

const RotationPreview: React.FC<RotationPreviewProps> = ({
  trainingBlock,
  workoutRotation,
  availableWorkouts,
  onRotationChange,
  readOnly = false
}) => {
  const [rotation, setRotation] = useState<string[]>(workoutRotation || []);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    if (workoutRotation) {
      setRotation(workoutRotation);
    }
  }, [workoutRotation]);

  const getWorkoutType = (workoutName: string): string | null => {
    const name = workoutName.toLowerCase();
    if (name === 'rest') return 'rest';
    if (name.includes('push')) return 'push';
    if (name.includes('pull')) return 'pull';
    if (name.includes('legs') || name.includes('leg')) return 'legs';
    if (name.includes('upper')) return 'upper';
    if (name.includes('lower')) return 'lower';
    if (name.includes('full') || name.includes('fb')) return 'full';
    return null;
  };

  const conflictWarnings = useMemo(() => {
    const warnings = new Map<number, string>();
    
    if (!rotation || rotation.length === 0) {
      return warnings;
    }
    
    for (let i = 0; i < rotation.length; i++) {
      const workout = rotation[i];
      const workoutType = getWorkoutType(workout);
      
      // Check for consecutive leg days
      if (workoutType === 'legs' && i > 0) {
        const prevWorkout = rotation[i - 1];
        if (getWorkoutType(prevWorkout) === 'legs') {
          warnings.set(i, 'Warning: Consecutive leg days may impact recovery');
        }
      }
      
      // Check for too many consecutive training days
      let consecutiveTrainingDays = 0;
      for (let j = i; j >= 0 && rotation[j] !== 'Rest'; j--) {
        consecutiveTrainingDays++;
      }
      if (consecutiveTrainingDays >= 5) {
        warnings.set(i, 'Warning: 5+ consecutive training days without rest');
      }
    }
    
    return warnings;
  }, [rotation]);

  const getWorkoutColor = (workoutName: string): string => {
    const name = workoutName.toLowerCase();
    if (name === 'rest') return '#333333';
    if (name.includes('push')) return '#4CAF50';
    if (name.includes('pull')) return '#2196F3';
    if (name.includes('legs')) return '#FF9800';
    if (name.includes('upper')) return '#FF5722';
    if (name.includes('lower')) return '#E64A19';
    if (name.includes('full') || name.includes('fb')) return '#9C27B0';
    return '#757575';
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (readOnly) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (readOnly) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    if (readOnly || draggedIndex === null) return;
    e.preventDefault();
    
    const newRotation = [...rotation];
    const [draggedItem] = newRotation.splice(draggedIndex, 1);
    newRotation.splice(dropIndex, 0, draggedItem);
    
    setRotation(newRotation);
    
    if (onRotationChange) {
      onRotationChange(newRotation);
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleWorkoutChange = (index: number, newWorkout: string) => {
    if (readOnly) return;
    
    const newRotation = [...rotation];
    newRotation[index] = newWorkout;
    
    setRotation(newRotation);
    
    if (onRotationChange) {
      onRotationChange(newRotation);
    }
  };

  const addRestDay = (afterIndex: number) => {
    if (readOnly) return;
    
    const newRotation = [...rotation];
    newRotation.splice(afterIndex + 1, 0, 'Rest');
    
    setRotation(newRotation);
    
    if (onRotationChange) {
      onRotationChange(newRotation);
    }
  };

  const removeWorkout = (index: number) => {
    if (readOnly) return;
    
    const newRotation = rotation.filter((_, i) => i !== index);
    
    setRotation(newRotation);
    
    if (onRotationChange) {
      onRotationChange(newRotation);
    }
  };

  const applyPreset = (preset: string) => {
    if (readOnly) return;
    
    let newRotation: string[] = [];
    
    // Try to find appropriate workouts from availableWorkouts
    const pushWorkout = availableWorkouts.find(w => w.workout_name.toLowerCase().includes('push'))?.workout_name || 'Push Day';
    const pullWorkout = availableWorkouts.find(w => w.workout_name.toLowerCase().includes('pull'))?.workout_name || 'Pull Day';
    const legsWorkout = availableWorkouts.find(w => w.workout_name.toLowerCase().includes('legs'))?.workout_name || 'Legs Day';
    const upperWorkout = availableWorkouts.find(w => w.workout_name.toLowerCase().includes('upper'))?.workout_name || 'Upper Body Day';
    const lowerWorkout = availableWorkouts.find(w => w.workout_name.toLowerCase().includes('lower'))?.workout_name || 'Lower Body Day';
    const fullBodyWorkouts = availableWorkouts.filter(w => w.workout_name.toLowerCase().includes('full body'));
    
    switch (preset) {
      case 'PPL':
        newRotation = [pushWorkout, pullWorkout, legsWorkout];
        break;
      case 'PPLR':
        newRotation = [pushWorkout, pullWorkout, legsWorkout, 'Rest'];
        break;
      case 'PPLPPL':
        newRotation = [pushWorkout, pullWorkout, legsWorkout, pushWorkout, pullWorkout, legsWorkout];
        break;
      case 'PPLRPPLR':
        newRotation = [pushWorkout, pullWorkout, legsWorkout, 'Rest', pushWorkout, pullWorkout, legsWorkout, 'Rest'];
        break;
      case 'UL':
        newRotation = [upperWorkout, lowerWorkout];
        break;
      case 'ULRUL':
        newRotation = [upperWorkout, lowerWorkout, 'Rest', upperWorkout, lowerWorkout];
        break;
      case 'FB':
        // Use different full body workouts if available
        if (fullBodyWorkouts.length >= 3) {
          newRotation = [fullBodyWorkouts[0].workout_name, 'Rest', fullBodyWorkouts[1].workout_name, 'Rest', fullBodyWorkouts[2].workout_name];
        } else if (fullBodyWorkouts.length > 0) {
          newRotation = [fullBodyWorkouts[0].workout_name, 'Rest', fullBodyWorkouts[0].workout_name, 'Rest', fullBodyWorkouts[0].workout_name];
        } else {
          newRotation = ['Full Body Day 1', 'Rest', 'Full Body Day 2', 'Rest', 'Full Body Day 3'];
        }
        break;
      default:
        return;
    }
    
    setRotation(newRotation);
    
    if (onRotationChange) {
      onRotationChange(newRotation);
    }
  };

  const getWeeklySchedule = () => {
    const weeks = [];
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    for (let week = 0; week < trainingBlock.duration; week++) {
      const weekSchedule = [];
      for (let day = 0; day < 7; day++) {
        const rotationIndex = (week * 7 + day) % rotation.length;
        weekSchedule.push({
          day: daysOfWeek[day],
          workout: rotation[rotationIndex],
          index: rotationIndex,
          hasWarning: conflictWarnings.has(rotationIndex)
        });
      }
      weeks.push({
        weekNumber: week + 1,
        schedule: weekSchedule
      });
    }
    
    return weeks;
  };

  return (
    <div className="rotation-preview">
      <div className="rotation-header">
        <h3>Workout Rotation</h3>
        {!readOnly && (
          <div className="preset-buttons">
            <button onClick={() => applyPreset('PPL')} className="preset-btn">PPL</button>
            <button onClick={() => applyPreset('PPLR')} className="preset-btn">PPLR</button>
            <button onClick={() => applyPreset('PPLPPL')} className="preset-btn">PPL×2</button>
            <button onClick={() => applyPreset('UL')} className="preset-btn">U/L</button>
            <button onClick={() => applyPreset('ULRUL')} className="preset-btn">ULRUL</button>
            <button onClick={() => applyPreset('FB')} className="preset-btn">FB</button>
          </div>
        )}
      </div>

      <div className="rotation-sequence">
        <h4>Rotation Pattern</h4>
        <div className="rotation-items">
          {rotation.map((workout, index) => (
            <div key={index} className="rotation-item-wrapper">
              <div
                className={`rotation-item ${dragOverIndex === index ? 'drag-over' : ''} ${
                  draggedIndex === index ? 'dragging' : ''
                } ${conflictWarnings.has(index) ? 'has-warning' : ''}`}
                draggable={!readOnly}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                style={{ borderColor: getWorkoutColor(workout) }}
              >
                <div className="item-header">
                  <span className="item-number">{index + 1}</span>
                  {readOnly ? (
                    <span className="item-name">{workout}</span>
                  ) : (
                    <select
                      value={workout}
                      onChange={(e) => handleWorkoutChange(index, e.target.value)}
                      className="workout-select"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="">Select workout...</option>
                      <option value="Rest">Rest Day</option>
                      
                      {/* Available Workouts */}
                      {availableWorkouts.length > 0 ? (
                        availableWorkouts.map((w, i) => (
                          <option key={i} value={w.workout_name}>
                            {w.workout_name}
                          </option>
                        ))
                      ) : (
                        <option disabled>No workouts available</option>
                      )}
                    </select>
                  )}
                </div>
                
                {!readOnly && (
                  <div className="item-actions">
                    <button
                      onClick={() => addRestDay(index)}
                      className="action-btn add-rest"
                      title="Add rest day after"
                    >
                      +R
                    </button>
                    <button
                      onClick={() => removeWorkout(index)}
                      className="action-btn remove"
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                )}
                
                {conflictWarnings.has(index) && (
                  <div className="warning-tooltip">
                    {conflictWarnings.get(index)}
                  </div>
                )}
              </div>
              
              {index < rotation.length - 1 && (
                <div className="rotation-arrow">→</div>
              )}
            </div>
          ))}
          
          {!readOnly && (
            <button
              onClick={() => handleWorkoutChange(rotation.length, 'Rest')}
              className="add-workout-btn"
            >
              + Add Workout
            </button>
          )}
        </div>
      </div>

      <div className="weekly-preview">
        <h4>Weekly Schedule Preview</h4>
        <div className="weeks-container">
          {getWeeklySchedule().map((week) => (
            <div key={week.weekNumber} className="week-preview">
              <h5>Week {week.weekNumber}</h5>
              <div className="week-grid">
                {week.schedule.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={`day-cell ${day.workout === 'Rest' ? 'rest-day' : ''} ${
                      day.hasWarning ? 'has-warning' : ''
                    }`}
                    style={{
                      borderColor: getWorkoutColor(day.workout),
                      backgroundColor: day.workout === 'Rest' ? '#1a1a1a' : 'transparent'
                    }}
                  >
                    <div className="day-label">{day.day}</div>
                    <div className="day-workout">{day.workout}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .rotation-preview {
          background: #1e1e1e;
          border-radius: 12px;
          padding: 1.5rem;
          color: #ffffff;
        }

        .rotation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .rotation-header h3 {
          margin: 0;
          color: #ffffff;
        }

        .preset-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .preset-btn {
          padding: 0.5rem 1rem;
          border: 1px solid #404040;
          border-radius: 6px;
          background: #2a2a2a;
          color: #b0b0b0;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.875rem;
        }

        .preset-btn:hover {
          background: #333333;
          color: #ffffff;
          border-color: #2196F3;
        }

        .rotation-sequence {
          margin-bottom: 2rem;
        }

        .rotation-sequence h4 {
          color: #b0b0b0;
          margin: 0 0 1rem 0;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .rotation-items {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.5rem;
        }

        .rotation-item-wrapper {
          display: flex;
          align-items: center;
          position: relative;
        }

        .rotation-item {
          background: #2a2a2a;
          border: 2px solid;
          border-radius: 8px;
          padding: 0.75rem;
          min-width: 140px;
          cursor: move;
          transition: all 0.2s ease;
          position: relative;
        }

        .rotation-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .rotation-item.dragging {
          opacity: 0.5;
          transform: scale(0.95);
        }

        .rotation-item.drag-over {
          transform: scale(1.05);
          box-shadow: 0 0 0 2px #2196F3;
        }

        .rotation-item.has-warning {
          position: relative;
        }

        .rotation-item.has-warning::after {
          content: '!';
          position: absolute;
          top: -8px;
          right: -8px;
          width: 20px;
          height: 20px;
          background: #f44336;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: bold;
        }

        .item-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .item-number {
          width: 24px;
          height: 24px;
          background: #404040;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          color: #b0b0b0;
        }

        .item-name {
          font-weight: 600;
          flex: 1;
        }

        .workout-select {
          flex: 1;
          padding: 0.25rem;
          border: 1px solid #404040;
          border-radius: 4px;
          background: #1e1e1e;
          color: #ffffff;
          font-size: 0.875rem;
        }

        .item-actions {
          display: flex;
          gap: 0.25rem;
        }

        .action-btn {
          width: 24px;
          height: 24px;
          border: 1px solid #404040;
          border-radius: 4px;
          background: transparent;
          color: #b0b0b0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          transition: all 0.2s ease;
        }

        .action-btn:hover {
          background: #404040;
          color: #ffffff;
        }

        .action-btn.add-rest {
          font-weight: bold;
        }

        .action-btn.remove:hover {
          background: #f44336;
          border-color: #f44336;
          color: #ffffff;
        }

        .warning-tooltip {
          position: absolute;
          bottom: -30px;
          left: 50%;
          transform: translateX(-50%);
          background: #f44336;
          color: #ffffff;
          padding: 0.5rem 0.75rem;
          border-radius: 6px;
          font-size: 0.75rem;
          white-space: nowrap;
          z-index: 10;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s ease;
        }

        .rotation-item.has-warning:hover .warning-tooltip {
          opacity: 1;
        }

        .rotation-arrow {
          color: #666666;
          font-size: 1.25rem;
          margin: 0 0.5rem;
        }

        .add-workout-btn {
          padding: 0.75rem 1.5rem;
          border: 2px dashed #404040;
          border-radius: 8px;
          background: transparent;
          color: #b0b0b0;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .add-workout-btn:hover {
          border-color: #2196F3;
          color: #2196F3;
          background: rgba(33, 150, 243, 0.1);
        }

        .weekly-preview {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid #404040;
        }

        .weekly-preview h4 {
          color: #b0b0b0;
          margin: 0 0 1rem 0;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .weeks-container {
          display: grid;
          gap: 1.5rem;
        }

        .week-preview {
          background: #2a2a2a;
          border-radius: 8px;
          padding: 1rem;
        }

        .week-preview h5 {
          margin: 0 0 1rem 0;
          color: #2196F3;
          font-size: 1rem;
        }

        .week-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.5rem;
        }

        .day-cell {
          background: #1e1e1e;
          border: 2px solid;
          border-radius: 6px;
          padding: 0.75rem;
          text-align: center;
          transition: all 0.2s ease;
        }

        .day-cell:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }

        .day-cell.rest-day {
          opacity: 0.6;
        }

        .day-cell.has-warning {
          position: relative;
        }

        .day-cell.has-warning::after {
          content: '!';
          position: absolute;
          top: -6px;
          right: -6px;
          width: 16px;
          height: 16px;
          background: #f44336;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.625rem;
          font-weight: bold;
        }

        .day-label {
          font-size: 0.75rem;
          color: #b0b0b0;
          margin-bottom: 0.25rem;
          font-weight: 600;
        }

        .day-workout {
          font-size: 0.875rem;
          font-weight: 600;
          color: #ffffff;
        }

        @media (max-width: 768px) {
          .rotation-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .preset-buttons {
            flex-wrap: wrap;
          }

          .rotation-items {
            flex-direction: column;
            align-items: stretch;
          }

          .rotation-arrow {
            transform: rotate(90deg);
            margin: 0.5rem 0;
          }

          .week-grid {
            grid-template-columns: repeat(3, 1fr);
          }

          .day-cell {
            padding: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default RotationPreview;