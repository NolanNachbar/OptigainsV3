import React, { useState, useEffect, useCallback } from 'react';
import { TrainingBlock, TrainingSplit, TrainingPhase, VolumeLevel, Workout } from '../utils/types';
import {
  TRAINING_BLOCK_TEMPLATES,
  createTrainingBlock,
  getCurrentTrainingBlock,
  addTrainingBlock,
  updateTrainingBlock,
  advanceTrainingBlock,
  getBlockProgress,
  isDeloadWeek,
  isBlockCompleted
} from '../utils/trainingBlocks';
import { assignWorkoutToDate } from '../utils/localStorageDB';
import { useUser } from '@clerk/clerk-react';
import RotationPreview from './RotationPreview';
import InteractiveRotationEditor from './InteractiveRotationEditor';

interface TrainingBlockPlannerProps {
  onBlockChange?: (block: TrainingBlock | null) => void;
  availableWorkouts?: Workout[];
  onEditWorkout?: (workout: Workout) => void;
}

const TrainingBlockPlanner: React.FC<TrainingBlockPlannerProps> = ({ onBlockChange, availableWorkouts = [], onEditWorkout }) => {
  const { user } = useUser();
  const [currentBlock, setCurrentBlock] = useState<TrainingBlock | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<number>(0);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState<number>(8);
  const [isPopulating, setIsPopulating] = useState(false);
  const [showRotationPreview, setShowRotationPreview] = useState(false);
  const [customRotationPattern, setCustomRotationPattern] = useState<any[]>([]);
  const [showRotationEditor, setShowRotationEditor] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customTemplate, setCustomTemplate] = useState<Omit<TrainingBlock, 'id' | 'startDate' | 'currentWeek'>>({
    name: '',
    phase: 'Hypertrophy',
    duration: 8,
    volumeLevel: 'Moderate',
    intensityRange: [70, 85],
    trainingDaysPerWeek: 4,
    split: 'Upper/Lower',
    notes: ''
  });

  const handlePatternChange = useCallback((pattern: any[]) => {
    setCustomRotationPattern(pattern);
  }, []);

  useEffect(() => {
    const block = getCurrentTrainingBlock();
    setCurrentBlock(block);
    onBlockChange?.(block);
  }, []);

  const handleCreateBlock = async () => {
    let template;
    
    if (showCustomForm) {
      // Validate custom template
      if (!customTemplate.name.trim()) {
        alert('Please provide a name for your custom training block.');
        return;
      }
      template = customTemplate;
    } else {
      template = TRAINING_BLOCK_TEMPLATES[selectedTemplate];
    }
    
    const blockWithDuration = { ...template, duration: showCustomForm ? customTemplate.duration : duration };
    const newBlock = createTrainingBlock(blockWithDuration, startDate);
    
    addTrainingBlock(newBlock);
    setCurrentBlock(newBlock);
    
    // If we have a custom rotation pattern, populate the calendar immediately
    if (customRotationPattern.length > 0 && user) {
      await populateCalendarWithCustomPattern(newBlock, customRotationPattern);
    }
    
    setShowCreateModal(false);
    setShowRotationEditor(false);
    setCustomRotationPattern([]);
    setShowCustomForm(false);
    onBlockChange?.(newBlock);
  };

  const populateCalendarWithCustomPattern = async (block: TrainingBlock, pattern: any[]) => {
    try {
      let scheduledCount = 0;
      
      for (let week = 0; week < block.duration; week++) {
        const weekStartDate = new Date(block.startDate);
        weekStartDate.setDate(weekStartDate.getDate() + (week * 7));
        
        for (let day = 0; day < 7; day++) {
          const patternItem = pattern[day];
          if (patternItem && !patternItem.isRest && patternItem.workout) {
            const workoutDate = new Date(weekStartDate);
            workoutDate.setDate(weekStartDate.getDate() + day);
            const dateString = workoutDate.toISOString().split('T')[0];
            
            await assignWorkoutToDate(null, patternItem.workout.workout_name, dateString, user!);
            scheduledCount++;
          }
        }
      }
      
      if (scheduledCount > 0) {
        alert(`Successfully scheduled ${scheduledCount} workouts across ${block.duration} weeks using your custom rotation!`);
      }
    } catch (error) {
      console.error('Error populating calendar with custom pattern:', error);
    }
  };

  const handleAdvanceWeek = () => {
    if (currentBlock) {
      const advancedBlock = advanceTrainingBlock(currentBlock);
      updateTrainingBlock(advancedBlock);
      setCurrentBlock(advancedBlock);
      onBlockChange?.(advancedBlock);
    }
  };

  const getPhaseColor = (phase: TrainingPhase | string): string => {
    switch (phase) {
      case 'Hypertrophy': return '#4CAF50';
      case 'Strength': return '#FF9800';
      case 'Power': return '#F44336';
      default: return '#757575';
    }
  };

  const getVolumeColor = (level: VolumeLevel): string => {
    switch (level) {
      case 'Low': return '#4CAF50';
      case 'Moderate': return '#FF9800';
      default: return '#757575';
    }
  };

  const getEndDate = (start: string, weeks: number): string => {
    const startDate = new Date(start);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (weeks * 7) - 1);
    return endDate.toLocaleDateString();
  };

  const calculateTrainingPattern = (split: string, trainingDaysPerWeek: number): number[] => {
    switch (split.toLowerCase()) {
      case 'full body':
        // Every other day pattern - some weeks 3 days, some weeks 4 days
        return [0, 2, 4, 6].slice(0, Math.ceil(trainingDaysPerWeek));
        
      case 'upper/lower':
        if (trainingDaysPerWeek === 4) {
          return [0, 1, 3, 4]; // Mon (Upper), Tue (Lower), Thu (Upper), Fri (Lower)
        } else if (trainingDaysPerWeek === 6) {
          return [0, 1, 2, 4, 5, 6];
        }
        return [0, 1, 3, 4];
        
      case 'ppl':
      case 'push/pull/legs':
        if (trainingDaysPerWeek === 6) {
          return [0, 1, 2, 4, 5, 6]; // Push, Pull, Legs, Push, Pull, Legs
        } else if (trainingDaysPerWeek === 3) {
          return [0, 2, 4];
        }
        return [0, 1, 2, 4, 5, 6];
        
      default:
        const pattern: number[] = [];
        const daySpacing = Math.floor(7 / trainingDaysPerWeek);
        for (let i = 0; i < trainingDaysPerWeek; i++) {
          pattern.push(i * daySpacing);
        }
        return pattern;
    }
  };

  const selectWorkoutForDay = (workouts: Workout[], split: string, dayOffset: number, totalWorkoutCount: number): Workout | null => {
    if (workouts.length === 0) return null;
    
    switch (split.toLowerCase()) {
      case 'full body':
        // Alternate between FB1 and FB2 workouts
        const fb1Workout = workouts.find(w => 
          w.workout_name.toLowerCase().includes('fb1') ||
          w.workout_name.toLowerCase().includes('full body 1') ||
          w.workout_name.toLowerCase().includes('fullbody1')
        );
        const fb2Workout = workouts.find(w => 
          w.workout_name.toLowerCase().includes('fb2') ||
          w.workout_name.toLowerCase().includes('full body 2') ||
          w.workout_name.toLowerCase().includes('fullbody2')
        );
        
        // If we have FB1 and FB2, alternate between them
        if (fb1Workout && fb2Workout) {
          return totalWorkoutCount % 2 === 0 ? fb1Workout : fb2Workout;
        }
        
        // Fallback to any full body workout
        const fullBodyWorkout = workouts.find(w => 
          w.workout_name.toLowerCase().includes('full body') ||
          w.workout_name.toLowerCase().includes('full')
        );
        return fullBodyWorkout || workouts[0];
        
      case 'upper/lower':
        const isUpperDay = dayOffset % 2 === 0;
        const upperWorkout = workouts.find(w => 
          w.workout_name.toLowerCase().includes('upper') ||
          w.workout_name.toLowerCase().includes('push') ||
          w.workout_name.toLowerCase().includes('chest') ||
          w.workout_name.toLowerCase().includes('back')
        );
        const lowerWorkout = workouts.find(w => 
          w.workout_name.toLowerCase().includes('lower') ||
          w.workout_name.toLowerCase().includes('legs') ||
          w.workout_name.toLowerCase().includes('squat') ||
          w.workout_name.toLowerCase().includes('deadlift')
        );
        
        if (isUpperDay && upperWorkout) return upperWorkout;
        if (!isUpperDay && lowerWorkout) return lowerWorkout;
        return workouts[0];
        
      case 'ppl':
      case 'push/pull/legs':
        const dayType = totalWorkoutCount % 6; // Full 6-day cycle
        
        // Look for Push1, Push2, Pull1, Pull2, Legs1, Legs2 workouts
        const push1Workout = workouts.find(w => 
          w.workout_name.toLowerCase().includes('push1') ||
          w.workout_name.toLowerCase().includes('push 1')
        );
        const push2Workout = workouts.find(w => 
          w.workout_name.toLowerCase().includes('push2') ||
          w.workout_name.toLowerCase().includes('push 2')
        );
        const pull1Workout = workouts.find(w => 
          w.workout_name.toLowerCase().includes('pull1') ||
          w.workout_name.toLowerCase().includes('pull 1')
        );
        const pull2Workout = workouts.find(w => 
          w.workout_name.toLowerCase().includes('pull2') ||
          w.workout_name.toLowerCase().includes('pull 2')
        );
        const legs1Workout = workouts.find(w => 
          w.workout_name.toLowerCase().includes('legs1') ||
          w.workout_name.toLowerCase().includes('legs 1')
        );
        const legs2Workout = workouts.find(w => 
          w.workout_name.toLowerCase().includes('legs2') ||
          w.workout_name.toLowerCase().includes('legs 2')
        );
        
        // P1-P2-L-P1-P2-L-R pattern
        const pplPattern = [push1Workout, pull1Workout, legs1Workout, push2Workout, pull2Workout, legs2Workout];
        const selectedWorkout = pplPattern[dayType % 6];
        
        if (selectedWorkout) return selectedWorkout;
        
        // Fallback to basic PPL
        const basicDayType = dayType % 3;
        const pushWorkout = workouts.find(w => 
          w.workout_name.toLowerCase().includes('push') ||
          w.workout_name.toLowerCase().includes('chest')
        );
        const pullWorkout = workouts.find(w => 
          w.workout_name.toLowerCase().includes('pull') ||
          w.workout_name.toLowerCase().includes('back')
        );
        const legWorkout = workouts.find(w => 
          w.workout_name.toLowerCase().includes('legs') ||
          w.workout_name.toLowerCase().includes('leg')
        );
        
        if (basicDayType === 0 && pushWorkout) return pushWorkout;
        if (basicDayType === 1 && pullWorkout) return pullWorkout;
        if (basicDayType === 2 && legWorkout) return legWorkout;
        return workouts[dayOffset % workouts.length];
        
      default:
        return workouts[dayOffset % workouts.length];
    }
  };

  const handlePopulateCalendar = async () => {
    if (!currentBlock || !user || availableWorkouts.length === 0) {
      alert('No active training block, user, or available workouts to schedule.');
      return;
    }

    setShowRotationPreview(false);
    setIsPopulating(true);
    
    try {
      const startDate = new Date(currentBlock.startDate);
      const trainingPattern = calculateTrainingPattern(currentBlock.split, currentBlock.trainingDaysPerWeek);
      let scheduledCount = 0;
      let totalWorkoutCount = 0;
      
      for (let week = 0; week < currentBlock.duration; week++) {
        const weekStartDate = new Date(startDate);
        weekStartDate.setDate(startDate.getDate() + (week * 7));
        
        for (const dayOffset of trainingPattern) {
          const workoutDate = new Date(weekStartDate);
          workoutDate.setDate(weekStartDate.getDate() + dayOffset);
          
          const workout = selectWorkoutForDay(availableWorkouts, currentBlock.split, dayOffset, totalWorkoutCount);
          
          if (workout) {
            const dateString = workoutDate.toISOString().split('T')[0];
            await assignWorkoutToDate(null, workout.workout_name, dateString, user);
            scheduledCount++;
            totalWorkoutCount++;
          }
        }
      }
      
      alert(`Successfully scheduled ${scheduledCount} workouts across ${currentBlock.duration} weeks!`);
    } catch (error) {
      console.error('Error populating calendar:', error);
      alert('Failed to populate calendar. Please try again.');
    } finally {
      setIsPopulating(false);
    }
  };

  return (
    <div className="training-block-planner">
      <div className="block-header">
        <h3>Training Block</h3>
        {!currentBlock && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="button primary"
          >
            Start New Block
          </button>
        )}
      </div>

      {currentBlock ? (
        <div className="current-block">
          <div className="block-card">
            <div className="block-title">
              <h4>{currentBlock.name}</h4>
              <div className="block-badges">
                <span 
                  className="phase-badge"
                  style={{ backgroundColor: getPhaseColor(currentBlock.phase) }}
                >
                  {currentBlock.phase}
                </span>
              </div>
            </div>

            <div className="block-progress">
              <div className="progress-info">
                <span>Week {currentBlock.currentWeek} of {currentBlock.duration}</span>
                <span>{getBlockProgress(currentBlock)}% Complete</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${getBlockProgress(currentBlock)}%` }}
                />
              </div>
            </div>

            <div className="block-details">
              <div className="detail-row">
                <span className="label">Split:</span>
                <span>{currentBlock.split}</span>
              </div>
              <div className="detail-row">
                <span className="label">Training Days:</span>
                <span>{currentBlock.trainingDaysPerWeek}x per week</span>
              </div>
              <div className="detail-row">
                <span className="label">Start Date:</span>
                <span>{new Date(currentBlock.startDate).toLocaleDateString()}</span>
              </div>
              <div className="detail-row">
                <span className="label">End Date:</span>
                <span>{getEndDate(currentBlock.startDate, currentBlock.duration)}</span>
              </div>
              {currentBlock.specialization && (
                <div className="detail-row">
                  <span className="label">Specialization:</span>
                  <span>{currentBlock.specialization.join(', ')}</span>
                </div>
              )}
            </div>

            {isDeloadWeek(currentBlock) && (
              <div className="deload-notice">
                <span>⚡ Deload Week - Reduce volume by 40-60%</span>
              </div>
            )}

            <div className="block-actions">
              <div className="action-row">
                {!isBlockCompleted(currentBlock) ? (
                  <button 
                    onClick={handleAdvanceWeek}
                    className="button primary"
                  >
                    Complete Week {currentBlock.currentWeek}
                  </button>
                ) : (
                  <button 
                    onClick={() => setShowCreateModal(true)}
                    className="button primary"
                  >
                    Start Next Block
                  </button>
                )}
                
                <button 
                  onClick={() => setShowRotationPreview(true)}
                  className="button secondary"
                  disabled={availableWorkouts.length === 0}
                >
                  Show Rotation Preview
                </button>
                
                <button 
                  onClick={handlePopulateCalendar}
                  className="button secondary"
                  disabled={isPopulating || availableWorkouts.length === 0}
                >
                  {isPopulating ? 'Populating...' : 'Populate Calendar'}
                </button>
              </div>
              
              {availableWorkouts.length === 0 && (
                <div className="calendar-warning">
                  <span>⚠️ No workouts available. Create workouts first to populate calendar.</span>
                </div>
              )}
            </div>

            {currentBlock.notes && (
              <div className="block-notes">
                <p>{currentBlock.notes}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="no-block">
          <div className="empty-state">
            <h4>No Active Training Block</h4>
            <p>Start a structured training program to optimize your progress with proper periodization.</p>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <h2>Create Training Block</h2>
            
            <div className="template-selection">
              <h3>Choose a Template</h3>
              <div className="template-grid">
                {TRAINING_BLOCK_TEMPLATES.map((template, index) => (
                  <div 
                    key={index}
                    className={`template-card ${selectedTemplate === index && !showCustomForm ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedTemplate(index);
                      setDuration(template.duration);
                      setShowCustomForm(false);
                    }}
                  >
                    <div className="template-header">
                      <h4>{template.name}</h4>
                      <div className="template-badges">
                        <span 
                          className="phase-badge small"
                          style={{ backgroundColor: getPhaseColor(template.phase) }}
                        >
                          {template.phase}
                        </span>
                      </div>
                    </div>
                    
                    <div className="template-details">
                      <div className="detail-item">
                        <span>Default Duration: {template.duration} weeks</span>
                      </div>
                      <div className="detail-item">
                        <span>Split: {template.split}</span>
                      </div>
                      <div className="detail-item">
                        <span>Training Days: {template.trainingDaysPerWeek}x/week</span>
                      </div>
                    </div>

                    <div className="template-description">
                      <p>{template.notes}</p>
                    </div>
                  </div>
                ))}
                
                {/* Custom Template Card */}
                <div 
                  className={`template-card custom-template ${showCustomForm ? 'selected' : ''}`}
                  onClick={() => setShowCustomForm(true)}
                >
                  <div className="template-header">
                    <h4>Create Custom Template</h4>
                    <div className="template-badges">
                      <span className="phase-badge small" style={{ backgroundColor: '#9C27B0' }}>
                        Custom
                      </span>
                    </div>
                  </div>
                  
                  <div className="template-details">
                    <div className="detail-item">
                      <span>Design your own training block</span>
                    </div>
                  </div>

                  <div className="template-description">
                    <p>Build a personalized training block with your preferred split, phase, and duration.</p>
                  </div>
                  
                  <div className="custom-template-icon">
                    <span>+</span>
                  </div>
                </div>
              </div>

              <div className="block-setup">
                <h3>{showCustomForm ? 'Custom Block Setup' : 'Block Setup'}</h3>
                
                {showCustomForm && (
                  <div className="custom-form-fields">
                    <div className="setup-fields">
                      <div className="setup-field">
                        <label>Block Name:</label>
                        <input
                          type="text"
                          value={customTemplate.name}
                          onChange={(e) => setCustomTemplate({...customTemplate, name: e.target.value})}
                          placeholder="e.g., Summer Strength Block"
                          className="text-input"
                        />
                      </div>
                      
                      <div className="setup-field">
                        <label>Training Phase:</label>
                        <select
                          value={customTemplate.phase}
                          onChange={(e) => setCustomTemplate({...customTemplate, phase: e.target.value as TrainingPhase})}
                          className="select-input"
                        >
                          <option value="Hypertrophy">Hypertrophy</option>
                          <option value="Strength">Strength</option>
                          <option value="Power">Power</option>
                        </select>
                      </div>
                      
                      <div className="setup-field">
                        <label>Training Split:</label>
                        <select
                          value={customTemplate.split}
                          onChange={(e) => setCustomTemplate({...customTemplate, split: e.target.value as TrainingSplit})}
                          className="select-input"
                        >
                          <option value="Full Body">Full Body</option>
                          <option value="Upper/Lower">Upper/Lower</option>
                          <option value="PPL">Push/Pull/Legs</option>
                          <option value="Full Body/Upper/Lower">Full Body/Upper/Lower</option>
                        </select>
                      </div>
                      
                      <div className="setup-field">
                        <label>Training Days/Week:</label>
                        <input
                          type="number"
                          min="1"
                          max="7"
                          value={customTemplate.trainingDaysPerWeek}
                          onChange={(e) => setCustomTemplate({...customTemplate, trainingDaysPerWeek: Number(e.target.value)})}
                          className="number-input"
                        />
                      </div>
                      
                      <div className="setup-field">
                        <label>Volume Level:</label>
                        <select
                          value={customTemplate.volumeLevel}
                          onChange={(e) => setCustomTemplate({...customTemplate, volumeLevel: e.target.value as VolumeLevel})}
                          className="select-input"
                        >
                          <option value="Low">Low</option>
                          <option value="Moderate">Moderate</option>
                        </select>
                      </div>
                      
                      <div className="setup-field">
                        <label>Intensity Range (% 1RM):</label>
                        <div className="intensity-inputs">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={customTemplate.intensityRange[0]}
                            onChange={(e) => setCustomTemplate({
                              ...customTemplate, 
                              intensityRange: [Number(e.target.value), customTemplate.intensityRange[1]]
                            })}
                            className="intensity-input"
                          />
                          <span>to</span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={customTemplate.intensityRange[1]}
                            onChange={(e) => setCustomTemplate({
                              ...customTemplate, 
                              intensityRange: [customTemplate.intensityRange[0], Number(e.target.value)]
                            })}
                            className="intensity-input"
                          />
                        </div>
                      </div>
                      
                      <div className="setup-field full-width">
                        <label>Notes (optional):</label>
                        <textarea
                          value={customTemplate.notes || ''}
                          onChange={(e) => setCustomTemplate({...customTemplate, notes: e.target.value})}
                          placeholder="Additional notes about this training block..."
                          className="textarea-input"
                          rows={3}
                        />
                      </div>
                    </div>
                    
                    <div className="divider"></div>
                  </div>
                )}
                
                <div className="setup-fields">
                  <div className="setup-field">
                    <label>Start Date:</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="date-input"
                    />
                  </div>
                  <div className="setup-field">
                    <label>Duration (weeks):</label>
                    <input
                      type="number"
                      min="1"
                      max="52"
                      value={showCustomForm ? customTemplate.duration : duration}
                      onChange={(e) => {
                        const newDuration = Number(e.target.value);
                        if (showCustomForm) {
                          setCustomTemplate({...customTemplate, duration: newDuration});
                        } else {
                          setDuration(newDuration);
                        }
                      }}
                      className="duration-input"
                    />
                  </div>
                  <div className="setup-field">
                    <label>End Date:</label>
                    <span className="calculated-date">
                      {getEndDate(startDate, showCustomForm ? customTemplate.duration : duration)}
                    </span>
                  </div>
                </div>
                
                <div className="rotation-setup">
                  <div className="rotation-header">
                    <h4>Training Rotation</h4>
                    <button 
                      onClick={() => setShowRotationEditor(!showRotationEditor)}
                      className="button secondary small"
                    >
                      {showRotationEditor ? 'Hide Editor' : 'Customize Rotation'}
                    </button>
                  </div>
                  
                  {showRotationEditor && (
                    <InteractiveRotationEditor
                      trainingBlock={{
                        ...(showCustomForm ? customTemplate : TRAINING_BLOCK_TEMPLATES[selectedTemplate]),
                        duration: showCustomForm ? customTemplate.duration : duration,
                        startDate,
                        id: '',
                        currentWeek: 1
                      }}
                      availableWorkouts={availableWorkouts}
                      onPatternChange={handlePatternChange}
                      onEditWorkout={onEditWorkout}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                onClick={handleCreateBlock}
                className="button primary"
              >
                {customRotationPattern.length > 0 ? 'Create Block & Schedule Workouts' : 'Start This Block'}
              </button>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="button secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showRotationPreview && currentBlock && (
        <RotationPreview
          trainingBlock={currentBlock}
          availableWorkouts={availableWorkouts}
          onConfirm={handlePopulateCalendar}
          onCancel={() => setShowRotationPreview(false)}
        />
      )}

      <style>{`
        .training-block-planner {
          background: #1e1e1e;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          color: #ffffff;
        }

        .block-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .block-header h3 {
          color: #ffffff;
          margin: 0;
        }

        .block-card {
          border: 1px solid #404040;
          border-radius: 8px;
          padding: 1.5rem;
          background: #2a2a2a;
        }

        .block-title {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .block-title h4 {
          color: #ffffff;
          margin: 0;
        }

        .block-badges {
          display: flex;
          gap: 0.5rem;
        }

        .phase-badge, .volume-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .phase-badge.small {
          padding: 0.2rem 0.5rem;
          font-size: 0.7rem;
        }

        .block-progress {
          margin-bottom: 1.5rem;
        }

        .progress-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
          color: #b0b0b0;
        }

        .progress-bar {
          height: 8px;
          background: #404040;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #4CAF50, #45a049);
          transition: width 0.3s ease;
        }

        .block-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          color: #b0b0b0;
        }

        .label {
          font-weight: 600;
          color: #ffffff;
        }

        .deload-notice {
          background: #1a237e;
          border: 1px solid #2196F3;
          border-radius: 6px;
          padding: 0.75rem;
          margin-bottom: 1rem;
          text-align: center;
          color: #64b5f6;
          font-weight: 600;
        }

        .block-actions {
          margin-bottom: 1rem;
        }

        .action-row {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 0.75rem;
        }

        .calendar-warning {
          padding: 0.5rem;
          background: #1a1a1a;
          border: 1px solid #ff9800;
          border-radius: 6px;
          color: #ff9800;
          font-size: 0.9rem;
          text-align: center;
        }

        .block-notes {
          font-style: italic;
          color: #888888;
          font-size: 0.9rem;
        }

        .empty-state {
          text-align: center;
          padding: 2rem;
          color: #888888;
        }

        .empty-state h4 {
          color: #ffffff;
        }

        .template-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .template-card {
          border: 2px solid #404040;
          border-radius: 8px;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          background: #2a2a2a;
          color: #ffffff;
        }

        .template-card:hover {
          border-color: #2196F3;
          background: #333333;
        }

        .template-card.selected {
          border-color: #2196F3;
          background: #1a2332;
        }

        .template-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .template-header h4 {
          color: #ffffff;
          margin: 0;
        }

        .template-details {
          margin-bottom: 1rem;
        }

        .detail-item {
          margin-bottom: 0.25rem;
          font-size: 0.9rem;
          color: #b0b0b0;
        }

        .template-description {
          font-size: 0.85rem;
          color: #888888;
          line-height: 1.4;
        }

        .modal-overlay {
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

        .modal-content {
          background: #1e1e1e;
          border-radius: 12px;
          padding: 2rem;
          max-width: 90vw;
          max-height: 90vh;
          overflow-y: auto;
          color: #ffffff;
          border: 1px solid #404040;
        }

        .modal-content.large {
          width: 80vw;
          max-width: 1200px;
        }

        .modal-content h2 {
          color: #ffffff;
          margin-top: 0;
        }

        .template-selection h3 {
          color: #ffffff;
          margin-bottom: 1rem;
        }

        .block-setup {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid #404040;
        }

        .block-setup h3 {
          color: #ffffff;
          margin-bottom: 1rem;
        }

        .setup-fields {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
        }

        .setup-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .setup-field label {
          font-weight: 600;
          color: #ffffff;
        }

        .date-input, .duration-input {
          padding: 0.75rem;
          border: 1px solid #404040;
          border-radius: 6px;
          background: #2a2a2a;
          color: #ffffff;
          font-size: 1rem;
        }

        .calculated-date {
          padding: 0.75rem;
          background: #2a2a2a;
          border: 1px solid #404040;
          border-radius: 6px;
          color: #b0b0b0;
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
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

        .button.small {
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
        }

        .rotation-setup {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid #404040;
        }

        .rotation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .rotation-header h4 {
          margin: 0;
          color: #ffffff;
        }

        .custom-template {
          position: relative;
          background: #2a2a2a;
          border: 2px dashed #666666;
        }

        .custom-template:hover {
          border-color: #9C27B0;
          background: #333333;
        }

        .custom-template.selected {
          border-color: #9C27B0;
          background: #1a2332;
        }

        .custom-template-icon {
          position: absolute;
          bottom: 1rem;
          right: 1rem;
          width: 40px;
          height: 40px;
          background: #9C27B0;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
          font-weight: bold;
        }

        .custom-form-fields {
          margin-bottom: 2rem;
          padding-bottom: 2rem;
        }

        .text-input, .select-input, .number-input, .textarea-input {
          padding: 0.75rem;
          border: 1px solid #404040;
          border-radius: 6px;
          background: #2a2a2a;
          color: #ffffff;
          font-size: 1rem;
          width: 100%;
        }

        .text-input:focus, .select-input:focus, .number-input:focus, .textarea-input:focus {
          outline: none;
          border-color: #2196F3;
        }

        .intensity-inputs {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .intensity-input {
          padding: 0.75rem;
          border: 1px solid #404040;
          border-radius: 6px;
          background: #2a2a2a;
          color: #ffffff;
          font-size: 1rem;
          width: 80px;
        }

        .full-width {
          grid-column: 1 / -1;
        }

        .divider {
          height: 1px;
          background: #404040;
          margin: 2rem 0;
        }

        @media (max-width: 768px) {
          .block-details {
            grid-template-columns: 1fr;
          }
          
          .template-grid {
            grid-template-columns: 1fr;
          }
          
          .block-title {
            flex-direction: column;
            gap: 1rem;
          }

          .modal-content {
            margin: 1rem;
            padding: 1.5rem;
          }

          .setup-fields {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default TrainingBlockPlanner;