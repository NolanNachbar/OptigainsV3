import React, { useState } from 'react';
import { TrainingBlock, Workout } from '../utils/types';
import {
  createTrainingBlock,
  addTrainingBlock,
} from '../utils/trainingBlocks';
import { useUser } from '@clerk/clerk-react';
import { assignWorkoutToDate, getWorkoutsForDate } from '../utils/localStorageDB';
import { saveCustomTemplate, getCustomTemplates, CustomTemplate } from '../utils/localStorage';
import RotationPreview from './RotationPreview';
import ActionBar from './Actionbar';
import '../styles/TrainingBlockEditor.css';

interface TrainingBlockEditorProps {
  onComplete: (block: TrainingBlock) => void;
  onCancel: () => void;
  availableWorkouts: Workout[];
}

type Step = 'rotation' | 'preview';

const TrainingBlockEditor: React.FC<TrainingBlockEditorProps> = ({
  onComplete,
  onCancel,
  availableWorkouts
}) => {
  const { user } = useUser();
  const [currentStep, setCurrentStep] = useState<Step>('rotation');
  const [blockName, setBlockName] = useState('');
  const [blockDuration, setBlockDuration] = useState(8);
  const [workoutRotation, setWorkoutRotation] = useState<string[]>(['Push Day', 'Pull Day', 'Legs Day', 'Rest']);
  const [previewWeeks, setPreviewWeeks] = useState(4);
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [templateName, setTemplateName] = useState('Custom Training Block');

  // Load custom templates on mount
  React.useEffect(() => {
    const templates = getCustomTemplates();
    setCustomTemplates(templates);
  }, []);

  // Add preset rotations
  const applyPreset = (preset: string) => {
    const pushWorkout = availableWorkouts.find(w => w.workout_name.toLowerCase().includes('push'))?.workout_name || 'Push Day';
    const pullWorkout = availableWorkouts.find(w => w.workout_name.toLowerCase().includes('pull'))?.workout_name || 'Pull Day';
    const legsWorkout = availableWorkouts.find(w => w.workout_name.toLowerCase().includes('legs'))?.workout_name || 'Legs Day';
    const upperWorkout = availableWorkouts.find(w => w.workout_name.toLowerCase().includes('upper'))?.workout_name || 'Upper Body';
    const lowerWorkout = availableWorkouts.find(w => w.workout_name.toLowerCase().includes('lower'))?.workout_name || 'Lower Body';
    const fullBodyWorkouts = availableWorkouts.filter(w => w.workout_name.toLowerCase().includes('full body'));
    
    switch (preset) {
      case 'PPL':
        setWorkoutRotation([pushWorkout, pullWorkout, legsWorkout, 'Rest']);
        setTemplateName('Push/Pull/Legs Block');
        break;
      case 'PPLPPL':
        setWorkoutRotation([pushWorkout, pullWorkout, legsWorkout, pushWorkout, pullWorkout, legsWorkout]);
        setTemplateName('PPL 6-Day Block');
        break;
      case 'UL':
        setWorkoutRotation([upperWorkout, lowerWorkout, 'Rest', upperWorkout, lowerWorkout]);
        setTemplateName('Upper/Lower Block');
        break;
      case 'FB':
        if (fullBodyWorkouts.length >= 3) {
          setWorkoutRotation([fullBodyWorkouts[0].workout_name, 'Rest', fullBodyWorkouts[1].workout_name, 'Rest', fullBodyWorkouts[2].workout_name]);
        } else {
          setWorkoutRotation(['Full Body A', 'Rest', 'Full Body B', 'Rest', 'Full Body C']);
        }
        setTemplateName('Full Body Block');
        break;
      default:
        // Check if it's a custom template
        const customTemplate = customTemplates.find(t => t.id === preset);
        if (customTemplate) {
          setWorkoutRotation(customTemplate.rotation);
          setTemplateName(customTemplate.name || 'Custom Block');
        }
        break;
    }
  };

  const handleRotationChange = (newRotation: string[]) => {
    setWorkoutRotation(newRotation);
  };


  const getCalendarPreview = () => {
    const preview: Array<{
      date: string;
      dayName: string;
      workout: string | null;
      isRest: boolean;
    }> = [];
    const startDate = new Date();
    let rotationIndex = 0;

    if (!workoutRotation || workoutRotation.length === 0) {
      return preview;
    }

    for (let i = 0; i < previewWeeks * 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      const workoutName = workoutRotation[rotationIndex % workoutRotation.length] || '';
      
      preview.push({
        date: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        workout: workoutName && workoutName.toLowerCase() !== 'rest' ? workoutName : null,
        isRest: !workoutName || workoutName.toLowerCase() === 'rest'
      });
      
      rotationIndex++;
    }
    
    return preview;
  };

  const handleApplyToCalendar = async () => {
    if (!user || !blockName) {
      alert('Please enter a name for your training block');
      return;
    }

    // Calculate training days per week from rotation
    const trainingDaysPerWeek = workoutRotation.filter(day => day.toLowerCase() !== 'rest').length;

    const template = {
      name: blockName,
      duration: blockDuration,
      trainingDaysPerWeek: trainingDaysPerWeek,
      split: 'Custom',
      notes: `${trainingDaysPerWeek}x per week training split`
    };

    const newBlock = createTrainingBlock(template, new Date().toISOString().split('T')[0]);
    newBlock.workoutRotation = workoutRotation;
    
    // Create rotationAssignments from workout names
    const assignments: Record<string, string> = {};
    workoutRotation.forEach(workoutName => {
      if (workoutName.toLowerCase() !== 'rest') {
        const workout = availableWorkouts.find(w => w.workout_name === workoutName);
        if (workout && workout.id) {
          assignments[workoutName] = workout.id;
        }
      }
    });
    
    newBlock.rotationAssignments = assignments;
    newBlock.currentRotationIndex = 0;
    newBlock.lastRotationDate = new Date().toISOString().split('T')[0];

    // Save the block
    addTrainingBlock(newBlock);

    // Save as custom template if it's a unique rotation
    const existingTemplates = getCustomTemplates();
    const rotationString = workoutRotation.join(',');
    const isExistingTemplate = existingTemplates.some(t => t.rotation.join(',') === rotationString);
    
    if (!isExistingTemplate && workoutRotation.length > 0) {
      const newTemplate: CustomTemplate = {
        id: `custom-${Date.now()}`,
        name: blockName,
        rotation: workoutRotation,
        createdAt: new Date().toISOString()
      };
      saveCustomTemplate(newTemplate);
    }

    // Apply to calendar
    const preview = getCalendarPreview();
    for (const day of preview) {
      if (!day.isRest && day.workout) {
        const workout = availableWorkouts.find(w => w.workout_name === day.workout);
        if (workout && workout.id) {
          const existingWorkouts = await getWorkoutsForDate(null, day.date, user);
          if (existingWorkouts.length === 0) {
            await assignWorkoutToDate(null, workout.id, day.date, user);
          }
        }
      }
    }

    onComplete(newBlock);
  };

  return (
    <div className="training-block-editor">
      <ActionBar />
      <div className="editor-main">
        <div className="editor-sidebar">
        <div className="step-indicator">
          <div 
            className={`step ${currentStep === 'rotation' ? 'active' : ''}`}
            onClick={() => setCurrentStep('rotation')}
          >
            <span className="step-number">1</span>
            <span className="step-label">Build Rotation</span>
          </div>
          <div 
            className={`step ${currentStep === 'preview' ? 'active' : ''} ${workoutRotation.length === 0 ? 'disabled' : ''}`}
            onClick={() => workoutRotation.length > 0 ? setCurrentStep('preview') : null}
          >
            <span className="step-number">2</span>
            <span className="step-label">Review & Apply</span>
          </div>
        </div>
      </div>

      <div className="editor-content">
        {currentStep === 'rotation' && (
          <div className="rotation-builder">
            <h2>Build Your Training Block</h2>
            
            <div className="block-settings">
              <div className="setting-row">
                <label>Block Duration</label>
                <div className="duration-selector">
                  <input
                    type="range"
                    min="4"
                    max="12"
                    value={blockDuration}
                    onChange={(e) => setBlockDuration(Number(e.target.value))}
                  />
                  <span>{blockDuration} weeks</span>
                </div>
              </div>
            </div>
            
            <div className="rotation-section">
              <div className="rotation-header">
                <h3>Workout Rotation</h3>
                <div className="preset-section">
                  <div className="preset-buttons">
                    <span className="preset-label">Templates:</span>
                    <button onClick={() => applyPreset('PPL')} className="preset-btn">PPL</button>
                    <button onClick={() => applyPreset('PPLPPL')} className="preset-btn">PPL×2</button>
                    <button onClick={() => applyPreset('UL')} className="preset-btn">Upper/Lower</button>
                    <button onClick={() => applyPreset('FB')} className="preset-btn">Full Body</button>
                  </div>
                  {customTemplates.length > 0 && (
                    <div className="custom-templates">
                      <span className="preset-label">Your Templates:</span>
                      {customTemplates.slice(0, 3).map(template => (
                        <button 
                          key={template.id} 
                          onClick={() => applyPreset(template.id)} 
                          className="preset-btn custom"
                          title={template.rotation.join(' → ')}
                        >
                          {template.name}
                        </button>
                      ))}
                      {customTemplates.length > 3 && (
                        <span className="more-templates">+{customTemplates.length - 3} more</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <RotationPreview
                trainingBlock={{
                  id: 'temp',
                  name: blockName || 'New Training Block',
                  startDate: new Date().toISOString().split('T')[0],
                  duration: blockDuration,
                  currentWeek: 1,
                  trainingDaysPerWeek: workoutRotation.filter(day => day.toLowerCase() !== 'rest').length,
                  split: 'Custom',
                  workoutRotation
                }}
                workoutRotation={workoutRotation}
                availableWorkouts={availableWorkouts}
                onRotationChange={handleRotationChange}
                readOnly={false}
              />
            </div>


            <div className="rotation-stats">
              <div className="stat-item">
                <span className="stat-label">Training Days:</span>
                <span className="stat-value">{workoutRotation.filter(day => day.toLowerCase() !== 'rest').length} per rotation</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Rotation Length:</span>
                <span className="stat-value">{workoutRotation.length} days</span>
              </div>
            </div>

            <button
              className="button primary continue-button"
              onClick={() => setCurrentStep('preview')}
              disabled={workoutRotation.length === 0}
            >
              Continue to Preview
            </button>
          </div>
        )}

        {currentStep === 'preview' && (
          <div className="calendar-preview">
            <h2>Review & Apply to Calendar</h2>
            
            <div className="block-name-section">
              <label>Training Block Name</label>
              <input
                type="text"
                value={blockName}
                onChange={(e) => setBlockName(e.target.value)}
                placeholder={templateName}
                className="block-name-input"
              />
            </div>
            
            <div className="preview-controls">
              <label>Preview weeks: </label>
              <select 
                value={previewWeeks} 
                onChange={(e) => setPreviewWeeks(Number(e.target.value))}
                className="weeks-select"
              >
                <option value={2}>2 weeks</option>
                <option value={4}>4 weeks</option>
                <option value={6}>6 weeks</option>
              </select>
            </div>

            <div className="calendar-grid">
              <div className="calendar-header">
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
                <div>Sun</div>
              </div>
              
              <div className="calendar-days">
                {getCalendarPreview().map((day, index) => (
                  <div 
                    key={`calendar-day-${index}-${day.date}-${day.workout}`} 
                    className={`calendar-day ${day.isRest ? 'rest-day' : ''} ${index % 7 === 0 ? 'week-start' : ''}`}
                  >
                    <div className="day-date">{new Date(day.date).getDate()}</div>
                    <div className="day-workout">
                      {day.isRest ? 'Rest' : day.workout || 'Unassigned'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="apply-actions">
              <button onClick={() => setCurrentStep('rotation')} className="button secondary">
                Back to Rotation
              </button>
              <button onClick={onCancel} className="button secondary">
                Cancel
              </button>
              <button 
                onClick={handleApplyToCalendar} 
                className="button primary"
                disabled={!blockName || workoutRotation.filter(w => w && w.toLowerCase() !== 'rest').length === 0}
              >
                Apply to Calendar
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default TrainingBlockEditor;