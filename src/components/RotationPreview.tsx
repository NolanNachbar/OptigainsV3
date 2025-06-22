import React, { useState, useEffect, useMemo } from 'react';
import { Workout, TrainingBlock } from '../utils/types';
import { useDate } from '../contexts/DateContext';

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
  const { currentDate } = useDate();
  const [rotation, setRotation] = useState<string[]>(() => 
    Array.isArray(workoutRotation) ? workoutRotation : []
  );
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    if (Array.isArray(workoutRotation)) {
      setRotation(workoutRotation);
    }
  }, [workoutRotation]);


  const conflictWarnings = useMemo(() => {
    const warnings = new Map<number, string>();
    // Removed all warnings for now
    return warnings;
  }, [rotation]);

  const getWorkoutColor = (workoutName: string): string => {
    if (!workoutName) return '#757575';
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


  const getWeeklySchedule = () => {
    const weeks = [];
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Get start date - next Sunday
    const startDate = new Date(currentDate);
    const currentDay = startDate.getDay();
    if (currentDay !== 0) {
      // If not Sunday, go to next Sunday
      startDate.setDate(startDate.getDate() + (7 - currentDay));
    }
    
    for (let week = 0; week < trainingBlock.duration; week++) {
      const weekSchedule = [];
      for (let day = 0; day < 7; day++) {
        const scheduleDate = new Date(startDate);
        scheduleDate.setDate(startDate.getDate() + (week * 7) + day);
        
        const rotationIndex = (week * 7 + day) % rotation.length;
        weekSchedule.push({
          day: daysOfWeek[day],
          date: scheduleDate.getDate(),
          month: scheduleDate.toLocaleDateString('en-US', { month: 'short' }),
          workout: rotation[rotationIndex],
          index: rotationIndex,
          hasWarning: conflictWarnings.has(rotationIndex),
          isToday: scheduleDate.toDateString() === currentDate.toDateString()
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
      </div>

      <div className="rotation-sequence">
        <h4>Rotation Pattern</h4>
        <div className="rotation-items">
          {rotation.map((workout, index) => (
            <div key={`rotation-${index}-${workout}`} className="rotation-item-wrapper">
              <div
                className={`rotation-item ${dragOverIndex === index ? 'drag-over' : ''} ${
                  draggedIndex === index ? 'dragging' : ''
                } ${conflictWarnings.has(index) ? 'has-warning' : ''}`}
                draggable={!readOnly}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                style={{ borderColor: workout ? getWorkoutColor(workout) : '#757575' }}
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
                          <option key={`workout-${i}-${w.id || w.workout_name}`} value={w.workout_name}>
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
            <div key={`week-${week.weekNumber}`} className="week-preview">
              <h5>Week {week.weekNumber}</h5>
              <div className="week-grid">
                {week.schedule.map((day, dayIndex) => (
                  <div
                    key={`week-${week.weekNumber}-day-${dayIndex}-${day.workout}`}
                    className={`day-cell ${day.workout === 'Rest' ? 'rest-day' : ''} ${
                      day.hasWarning ? 'has-warning' : ''
                    } ${day.isToday ? 'is-today' : ''}`}
                    style={{
                      borderColor: day.workout ? getWorkoutColor(day.workout) : '#757575',
                      backgroundColor: day.workout === 'Rest' ? '#1a1a1a' : 'transparent'
                    }}
                  >
                    <div className="day-header">
                      <div className="day-label">{day.day}</div>
                      <div className="day-date">{day.date}</div>
                    </div>
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

        .day-cell.is-today {
          background: rgba(33, 150, 243, 0.1) !important;
          border-color: #2196F3 !important;
        }

        .day-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .day-label {
          font-size: 0.75rem;
          color: #b0b0b0;
          font-weight: 600;
        }

        .day-date {
          font-size: 0.875rem;
          color: #ffffff;
          font-weight: 500;
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