import React from 'react';
import { TrainingBlock, Workout } from '../utils/types';

interface RotationPreviewProps {
  trainingBlock: TrainingBlock;
  availableWorkouts: Workout[];
  onConfirm: () => void;
  onCancel: () => void;
}

const RotationPreview: React.FC<RotationPreviewProps> = ({
  trainingBlock,
  availableWorkouts,
  onConfirm,
  onCancel
}) => {
  const generateRotationPattern = (workouts: Workout[]): { name: string; type: string }[] => {
    // Smart detection based on available workouts rather than hardcoded splits
    const pattern: { name: string; type: string }[] = [];
    
    // Group workouts by type based on their names
    const workoutGroups: { [key: string]: Workout[] } = {};
    
    workouts.forEach(workout => {
      const name = workout.workout_name.toLowerCase();
      let category = 'general';
      
      // Detect workout categories from names
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

    // Generate pattern based on detected categories and training days
    const categories = Object.keys(workoutGroups);
    const trainingDays = trainingBlock.trainingDaysPerWeek;
    
    if (categories.includes('fullbody')) {
      // Full body pattern - alternate between available FB workouts every other day
      const fbWorkouts = workoutGroups['fullbody'];
      
      for (let day = 0; day < 7; day++) {
        if (day % 2 === 0 && pattern.filter(p => p.type !== 'Rest').length < Math.ceil(trainingDays)) {
          const workoutIndex = Math.floor(pattern.filter(p => p.type !== 'Rest').length / 2) % fbWorkouts.length;
          const workout = fbWorkouts[workoutIndex];
          pattern.push({ 
            name: workout.workout_name, 
            type: `FB${workoutIndex + 1}` 
          });
        } else {
          pattern.push({ name: 'Rest', type: 'Rest' });
        }
      }
    } else if (categories.includes('push') && categories.includes('pull') && categories.includes('legs')) {
      // PPL pattern
      const pplOrder = ['push', 'pull', 'legs'];
      let workoutCount = 0;
      
      for (let day = 0; day < 7; day++) {
        if (workoutCount < trainingDays) {
          const categoryIndex = workoutCount % 3;
          const category = pplOrder[categoryIndex];
          const categoryWorkouts = workoutGroups[category] || [];
          
          if (categoryWorkouts.length > 0) {
            const workoutIndex = Math.floor(workoutCount / 3) % categoryWorkouts.length;
            const workout = categoryWorkouts[workoutIndex];
            const variation = categoryWorkouts.length > 1 ? workoutIndex + 1 : '';
            
            pattern.push({ 
              name: workout.workout_name, 
              type: `${category.charAt(0).toUpperCase() + category.slice(1)}${variation}` 
            });
            workoutCount++;
          } else {
            pattern.push({ name: 'Rest', type: 'Rest' });
          }
        } else {
          pattern.push({ name: 'Rest', type: 'Rest' });
        }
      }
    } else if (categories.includes('upper') && categories.includes('lower')) {
      // Upper/Lower pattern
      const ulOrder = ['upper', 'lower'];
      let workoutCount = 0;
      
      for (let day = 0; day < 7; day++) {
        if (workoutCount < trainingDays) {
          const categoryIndex = workoutCount % 2;
          const category = ulOrder[categoryIndex];
          const categoryWorkouts = workoutGroups[category] || [];
          
          if (categoryWorkouts.length > 0) {
            const workoutIndex = Math.floor(workoutCount / 2) % categoryWorkouts.length;
            const workout = categoryWorkouts[workoutIndex];
            
            pattern.push({ 
              name: workout.workout_name, 
              type: category.charAt(0).toUpperCase() + category.slice(1) 
            });
            workoutCount++;
          } else {
            pattern.push({ name: 'Rest', type: 'Rest' });
          }
        } else {
          pattern.push({ name: 'Rest', type: 'Rest' });
        }
      }
    } else {
      // Custom/General pattern - cycle through all available workouts
      let workoutCount = 0;
      const allWorkouts = workouts;
      
      for (let day = 0; day < 7; day++) {
        if (workoutCount < trainingDays && allWorkouts.length > 0) {
          const workout = allWorkouts[workoutCount % allWorkouts.length];
          pattern.push({ 
            name: workout.workout_name, 
            type: `Workout ${workoutCount + 1}` 
          });
          workoutCount++;
        } else {
          pattern.push({ name: 'Rest', type: 'Rest' });
        }
      }
    }

    return pattern;
  };

  const rotationPattern = generateRotationPattern(availableWorkouts);
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const getWorkoutTypeColor = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'push1':
      case 'push':
        return '#4CAF50';
      case 'push2':
        return '#45a049';
      case 'pull1':
      case 'pull':
        return '#2196F3';
      case 'pull2':
        return '#1976D2';
      case 'legs1':
      case 'legs':
        return '#FF9800';
      case 'legs2':
        return '#F57C00';
      case 'fb1':
      case 'fb':
        return '#9C27B0';
      case 'fb2':
        return '#7B1FA2';
      case 'upper':
        return '#FF5722';
      case 'lower':
        return '#E64A19';
      case 'rest':
        return '#616161';
      default:
        return '#757575';
    }
  };

  return (
    <div className="rotation-preview-overlay">
      <div className="rotation-preview-modal">
        <h2>Training Block Rotation Preview</h2>
        <p>This is how your {trainingBlock.split} training will look over one full cycle:</p>
        
        <div className="rotation-calendar">
          <div className="week-header">
            {daysOfWeek.map(day => (
              <div key={day} className="day-header">{day}</div>
            ))}
          </div>
          
          <div className="week-row">
            {rotationPattern.map((workout, index) => (
              <div 
                key={index}
                className="day-cell"
                style={{ backgroundColor: getWorkoutTypeColor(workout.type) }}
              >
                <div className="workout-type">{workout.type}</div>
                <div className="workout-name">{workout.name}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rotation-details">
          <h3>Rotation Breakdown:</h3>
          <div className="rotation-list">
            {rotationPattern.map((workout, index) => (
              <div key={index} className="rotation-item">
                <span 
                  className="rotation-dot"
                  style={{ backgroundColor: getWorkoutTypeColor(workout.type) }}
                />
                <span className="rotation-day">Day {index + 1}:</span>
                <span className="rotation-workout">{workout.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="preview-actions">
          <button onClick={onConfirm} className="button primary">
            Proceed to Workout Assignment
          </button>
          <button onClick={onCancel} className="button secondary">
            Cancel
          </button>
        </div>
      </div>

      <style>{`
        .rotation-preview-overlay {
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

        .rotation-preview-modal {
          background: #1e1e1e;
          border-radius: 12px;
          padding: 2rem;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
          color: #ffffff;
          border: 1px solid #404040;
        }

        .rotation-preview-modal h2 {
          color: #ffffff;
          margin-top: 0;
          margin-bottom: 1rem;
        }

        .rotation-preview-modal p {
          color: #b0b0b0;
          margin-bottom: 2rem;
        }

        .rotation-calendar {
          margin-bottom: 2rem;
          border: 1px solid #404040;
          border-radius: 8px;
          overflow: hidden;
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
        }

        .day-cell:last-child {
          border-right: none;
        }

        .workout-type {
          font-weight: 700;
          font-size: 0.9rem;
        }

        .workout-name {
          font-size: 0.7rem;
          opacity: 0.9;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .rotation-details {
          margin-bottom: 2rem;
        }

        .rotation-details h3 {
          color: #ffffff;
          margin-bottom: 1rem;
        }

        .rotation-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 0.75rem;
        }

        .rotation-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem;
          background: #2a2a2a;
          border-radius: 6px;
          border: 1px solid #404040;
        }

        .rotation-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .rotation-day {
          font-weight: 600;
          color: #ffffff;
          min-width: 50px;
        }

        .rotation-workout {
          color: #b0b0b0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .preview-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .button {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .button.primary {
          background: #2196F3;
          color: white;
        }

        .button.primary:hover {
          background: #1976D2;
        }

        .button.secondary {
          background: #404040;
          color: #ffffff;
          border: 1px solid #666666;
        }

        .button.secondary:hover {
          background: #555555;
        }

        @media (max-width: 768px) {
          .rotation-preview-modal {
            margin: 1rem;
            padding: 1.5rem;
          }

          .rotation-list {
            grid-template-columns: 1fr;
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
        }
      `}</style>
    </div>
  );
};

export default RotationPreview;