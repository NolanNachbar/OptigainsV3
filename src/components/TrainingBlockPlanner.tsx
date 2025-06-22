import React, { useState, useEffect } from 'react';
import { TrainingBlock, Workout } from '../utils/types';
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
import { db } from '../utils/database';
import RotationPreview from './RotationPreview';
import WorkoutAssignmentForm from './WorkoutAssignmentForm';
import TrainingBlockEditor from './TrainingBlockEditor';
import { getWorkoutsForDate, assignWorkoutToDate } from '../utils/SupaBase';
import { useUser } from '@clerk/clerk-react';
import { PUSH_DAY, PULL_DAY, LEGS_DAY, UPPER_BODY_DAY, LOWER_BODY_DAY, FULL_BODY_DAY_1, FULL_BODY_DAY_2 } from '../utils/preloadedWorkouts';

interface TrainingBlockPlannerProps {
  onBlockChange?: (block: TrainingBlock | null) => void;
  availableWorkouts?: Workout[];
  onEditWorkout?: (workout: Workout) => void;
  onRotationApplied?: () => void;
}

const TrainingBlockPlanner: React.FC<TrainingBlockPlannerProps> = ({ 
  onBlockChange,
  availableWorkouts = [],
  onEditWorkout,
  onRotationApplied
}) => {
  const { user } = useUser();
  const [currentBlock, setCurrentBlock] = useState<TrainingBlock | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<number>(0);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [workoutRotation, setWorkoutRotation] = useState<string[]>([]);
  const [showTemplateWorkouts, setShowTemplateWorkouts] = useState(false);
  const [templateWorkouts, setTemplateWorkouts] = useState<Workout[]>([]);
  const [showBlockEditor, setShowBlockEditor] = useState(false);
  const [pastBlocks, setPastBlocks] = useState<TrainingBlock[]>([]);

  useEffect(() => {
    const loadBlocks = async () => {
      if (!user) return;
      
      // Get current active block
      const block = getCurrentTrainingBlock();
      setCurrentBlock(block);
      if (block && block.workoutRotation) {
        setWorkoutRotation(block.workoutRotation);
      }
      onBlockChange?.(block);
      
      // Get all training blocks to find past ones
      try {
        const allBlocks = await db.getTrainingBlocks(user.id);
        const inactiveBlocks = allBlocks.filter(b => !b.isActive || isBlockCompleted(b));
        setPastBlocks(inactiveBlocks);
      } catch (error) {
        console.error('Error loading training blocks:', error);
      }
    };
    
    loadBlocks();
  }, [onBlockChange, user]);

  const handleViewTemplateWorkouts = async () => {
    if (selectedTemplate !== null) {
      const template = TRAINING_BLOCK_TEMPLATES[selectedTemplate];
      
      // Look for existing workouts that match the template
      let workouts: Workout[] = [];
      
      switch (template.split) {
        case 'PPL':
          // Find existing or use preloaded PPL workouts
          const pushWorkout = availableWorkouts.find(w => w.workout_name.toLowerCase().includes('push')) || 
            { ...PUSH_DAY, id: 'push-temp', clerk_user_id: user?.id || '' };
          const pullWorkout = availableWorkouts.find(w => w.workout_name.toLowerCase().includes('pull')) || 
            { ...PULL_DAY, id: 'pull-temp', clerk_user_id: user?.id || '' };
          const legsWorkout = availableWorkouts.find(w => w.workout_name.toLowerCase().includes('leg')) || 
            { ...LEGS_DAY, id: 'legs-temp', clerk_user_id: user?.id || '' };
          workouts = [pushWorkout, pullWorkout, legsWorkout];
          break;
          
        case 'Upper/Lower':
          const upperWorkout = availableWorkouts.find(w => w.workout_name.toLowerCase().includes('upper')) || 
            { ...UPPER_BODY_DAY, id: 'upper-temp', clerk_user_id: user?.id || '' };
          const lowerWorkout = availableWorkouts.find(w => w.workout_name.toLowerCase().includes('lower')) || 
            { ...LOWER_BODY_DAY, id: 'lower-temp', clerk_user_id: user?.id || '' };
          workouts = [upperWorkout, lowerWorkout];
          break;
          
        case 'Full Body':
          const fb1 = availableWorkouts.find(w => 
            w.workout_name.toLowerCase().includes('full') && 
            (w.workout_name.includes('1') || w.workout_name.includes('A'))
          ) || { ...FULL_BODY_DAY_1, id: 'fb1-temp', clerk_user_id: user?.id || '' };
          
          const fb2 = availableWorkouts.find(w => 
            w.workout_name.toLowerCase().includes('full') && 
            (w.workout_name.includes('2') || w.workout_name.includes('B'))
          ) || { ...FULL_BODY_DAY_2, id: 'fb2-temp', clerk_user_id: user?.id || '' };
          
          workouts = [fb1, fb2];
          break;
      }
      
      setTemplateWorkouts(workouts);
      setShowTemplateWorkouts(true);
      setShowCreateModal(false);
    }
  };

  const handleCreateBlock = () => {
    const template = TRAINING_BLOCK_TEMPLATES[selectedTemplate];
    const startDate = new Date().toISOString().split('T')[0];
    const newBlock = createTrainingBlock(template, startDate);
    
    // Set initial workout rotation based on template
    const initialRotation = getInitialRotation(template.split, template.trainingDaysPerWeek);
    setWorkoutRotation(initialRotation);
    newBlock.workoutRotation = initialRotation;
    
    addTrainingBlock(newBlock);
    setCurrentBlock(newBlock);
    setShowCreateModal(false);
    setShowAssignmentForm(true);
    onBlockChange?.(newBlock);
  };

  const getInitialRotation = (split: string, daysPerWeek: number): string[] => {
    // Try to find appropriate workouts from availableWorkouts
    const pushWorkout = availableWorkouts.find(w => w.workout_name.toLowerCase().includes('push'))?.workout_name || 'Push Day';
    const pullWorkout = availableWorkouts.find(w => w.workout_name.toLowerCase().includes('pull'))?.workout_name || 'Pull Day';
    const legsWorkout = availableWorkouts.find(w => w.workout_name.toLowerCase().includes('legs'))?.workout_name || 'Legs Day';
    const upperWorkout = availableWorkouts.find(w => w.workout_name.toLowerCase().includes('upper'))?.workout_name || 'Upper Body Day';
    const lowerWorkout = availableWorkouts.find(w => w.workout_name.toLowerCase().includes('lower'))?.workout_name || 'Lower Body Day';
    const fullBodyWorkouts = availableWorkouts.filter(w => w.workout_name.toLowerCase().includes('full body'));
    
    switch (split) {
      case 'PPL':
        if (daysPerWeek === 6) {
          return [pushWorkout, pullWorkout, legsWorkout, pushWorkout, pullWorkout, legsWorkout];
        }
        return [pushWorkout, pullWorkout, legsWorkout, 'Rest'];
      case 'Upper/Lower':
        if (daysPerWeek === 4) {
          return [upperWorkout, lowerWorkout, 'Rest', upperWorkout, lowerWorkout];
        }
        return [upperWorkout, lowerWorkout];
      case 'Full Body':
        if (daysPerWeek === 3 && fullBodyWorkouts.length >= 3) {
          return [fullBodyWorkouts[0].workout_name, 'Rest', fullBodyWorkouts[1].workout_name, 'Rest', fullBodyWorkouts[2].workout_name];
        } else if (fullBodyWorkouts.length > 0) {
          return [fullBodyWorkouts[0].workout_name, 'Rest'];
        }
        return ['Full Body Day 1', 'Rest', 'Full Body Day 2', 'Rest', 'Full Body Day 3'];
      default:
        if (availableWorkouts.length > 0) {
          return Array(daysPerWeek).fill(availableWorkouts[0].workout_name).concat(['Rest']);
        }
        return Array(daysPerWeek).fill('Workout').concat(['Rest']);
    }
  };

  const handleRotationChange = (newRotation: string[]) => {
    setWorkoutRotation(newRotation);
    if (currentBlock) {
      const updatedBlock = { ...currentBlock, workoutRotation: newRotation };
      updateTrainingBlock(updatedBlock);
      setCurrentBlock(updatedBlock);
      onBlockChange?.(updatedBlock);
    }
  };

  const handleAssignmentComplete = (assignments: any[]) => {
    if (currentBlock) {
      // Create rotation assignments mapping
      const rotationAssignments: Record<string, string> = {};
      
      assignments.forEach(assignment => {
        if (assignment.assignedWorkout?.id) {
          rotationAssignments[assignment.workoutName] = assignment.assignedWorkout.id;
        }
      });
      
      const updatedBlock = { 
        ...currentBlock, 
        rotationAssignments,
        currentRotationIndex: 0,
        lastRotationDate: new Date().toISOString().split('T')[0]
      };
      
      updateTrainingBlock(updatedBlock);
      setCurrentBlock(updatedBlock);
      onBlockChange?.(updatedBlock);
    }
    setShowAssignmentForm(false);
  };


  const handleAdvanceWeek = () => {
    if (currentBlock) {
      const advancedBlock = advanceTrainingBlock(currentBlock);
      updateTrainingBlock(advancedBlock);
      setCurrentBlock(advancedBlock);
      onBlockChange?.(advancedBlock);
    }
  };
  
  const handleApplyRotationToCalendar = async () => {
    if (!currentBlock || !currentBlock.rotationAssignments || !currentBlock.workoutRotation || !user) {
      return;
    }
    
    const confirmApply = window.confirm(
      'This will apply your workout rotation to the calendar for the next 4 weeks. ' +
      'Any existing calendar assignments will be preserved. Continue?'
    );
    
    if (!confirmApply) return;
    
    try {
      // Calculate dates for the next 4 weeks
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 28); // 4 weeks
      
      let currentDate = new Date(startDate);
      let rotationIndex = currentBlock.currentRotationIndex || 0;
      
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        
        // Get the workout for this rotation index
        const rotationSlot = currentBlock.workoutRotation[rotationIndex % currentBlock.workoutRotation.length];
        const templateId = currentBlock.rotationAssignments[rotationSlot];
        
        if (templateId && rotationSlot.toLowerCase() !== 'rest') {
          // Only assign if no existing assignment for this date
          const existingWorkouts = await getWorkoutsForDate(null, dateStr, user);
          if (existingWorkouts.length === 0) {
            await assignWorkoutToDate(null, templateId, dateStr, user);
          }
        }
        
        // Move to next day and rotation index
        currentDate.setDate(currentDate.getDate() + 1);
        rotationIndex++;
      }
      
      // Update the training block with new rotation tracking
      const updatedBlock = {
        ...currentBlock,
        currentRotationIndex: rotationIndex % currentBlock.workoutRotation.length,
        lastRotationDate: startDate.toISOString().split('T')[0]
      };
      
      updateTrainingBlock(updatedBlock);
      setCurrentBlock(updatedBlock);
      onBlockChange?.(updatedBlock);
      
      // Notify parent component that rotation was applied
      onRotationApplied?.();
      
      alert('Rotation has been applied to your calendar!');
    } catch (error) {
      console.error('Error applying rotation to calendar:', error);
      alert('Failed to apply rotation to calendar. Please try again.');
    }
  };

  return (
    <div className="training-block-planner">
      <div className="block-header">
        <h3>Training Block</h3>
        {!currentBlock && (
          <button 
            onClick={() => setShowBlockEditor(true)}
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
              {currentBlock.intensityRange && (
                <div className="detail-row">
                  <span className="label">Intensity:</span>
                  <span>{currentBlock.intensityRange[0]}-{currentBlock.intensityRange[1]}% 1RM</span>
                </div>
              )}
            </div>

            {isDeloadWeek(currentBlock) && (
              <div className="deload-notice">
                <span>⚡ Deload Week - Reduce volume by 40-60%</span>
              </div>
            )}

            <div className="block-actions">
              {!isBlockCompleted(currentBlock) ? (
                <button 
                  onClick={handleAdvanceWeek}
                  className="button primary"
                >
                  Complete Week {currentBlock.currentWeek}
                </button>
              ) : (
                <button 
                  onClick={() => setShowBlockEditor(true)}
                  className="button primary"
                >
                  Start Next Block
                </button>
              )}
            </div>

            {currentBlock.notes && (
              <div className="block-notes">
                <p>{currentBlock.notes}</p>
              </div>
            )}
          </div>

          {workoutRotation && workoutRotation.length > 0 && (
            <div className="rotation-section">
              <RotationPreview
                trainingBlock={currentBlock}
                workoutRotation={workoutRotation}
                availableWorkouts={availableWorkouts}
                onRotationChange={handleRotationChange}
                readOnly={false}
              />
              {currentBlock.rotationAssignments && Object.keys(currentBlock.rotationAssignments).length > 0 && (
                <div className="rotation-assignments">
                  <h5>Assigned Workouts:</h5>
                  <div className="assignment-list">
                    {workoutRotation.map((slot, index) => {
                      const templateId = currentBlock.rotationAssignments?.[slot];
                      const workout = availableWorkouts.find(w => w.id === templateId);
                      return (
                        <div key={`${slot}-${index}`} className="assignment-item">
                          <span className="slot-name">{slot}:</span>
                          <span className="workout-name">
                            {workout ? workout.workout_name : 'Not assigned'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="assignment-actions">
            <button
              onClick={() => setShowAssignmentForm(true)}
              className="button secondary"
            >
              {currentBlock.rotationAssignments && Object.keys(currentBlock.rotationAssignments).length > 0 
                ? 'Edit Workout Assignments' 
                : 'Assign Workouts to Rotation'}
            </button>
            {currentBlock.rotationAssignments && Object.keys(currentBlock.rotationAssignments).length > 0 && (
              <button
                onClick={handleApplyRotationToCalendar}
                className="button primary"
              >
                Apply Rotation to Calendar
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="no-block">
          <div className="empty-state">
            <h4>No Active Training Block</h4>
            <p>Start a structured training program to optimize your bodybuilding progress with proper periodization.</p>
            <button 
              onClick={() => setShowBlockEditor(true)}
              className="button primary"
            >
              {pastBlocks.length > 0 ? 'Start New Block' : 'Create Your First Block'}
            </button>
          </div>
          
          {pastBlocks.length > 0 && (
            <div className="past-blocks-section">
              <h4>Past Training Blocks</h4>
              <div className="past-blocks-list">
                {pastBlocks.map((block) => (
                  <div key={block.id} className="past-block-card">
                    <div className="past-block-header">
                      <h5>{block.name}</h5>
                      {isBlockCompleted(block) && (
                        <span className="completed-badge">Completed</span>
                      )}
                    </div>
                    <div className="past-block-details">
                      <span>{block.split} • {block.trainingDaysPerWeek}x/week</span>
                      <span>Week {block.currentWeek} of {block.duration}</span>
                    </div>
                    {!isBlockCompleted(block) && (
                      <button
                        onClick={async () => {
                          // Reactivate this block
                          const updatedBlock = { ...block, isActive: true };
                          await db.saveTrainingBlock(updatedBlock, user!);
                          setCurrentBlock(updatedBlock);
                          onBlockChange?.(updatedBlock);
                          setPastBlocks(prev => prev.filter(b => b.id !== block.id));
                        }}
                        className="button secondary small"
                      >
                        Resume Block
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}


      {showBlockEditor && (
        <TrainingBlockEditor
          onComplete={(newBlock) => {
            setCurrentBlock(newBlock);
            setShowBlockEditor(false);
            onBlockChange?.(newBlock);
          }}
          onCancel={() => setShowBlockEditor(false)}
          availableWorkouts={availableWorkouts}
        />
      )}

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <h2>Create Training Block</h2>
            
            <div className="modal-tabs">
              <button 
                className="tab-button active"
                onClick={() => setSelectedTemplate(0)}
              >
                Templates
              </button>
              <button 
                className="tab-button"
                onClick={() => {}}
              >
                Custom
              </button>
            </div>

            <div className="template-selection">
              <h3>Choose a Template</h3>
              <div className="template-grid">
                {TRAINING_BLOCK_TEMPLATES.map((template, index) => (
                  <div 
                    key={index}
                    className={`template-card ${selectedTemplate === index ? 'selected' : ''}`}
                    onClick={() => setSelectedTemplate(index)}
                  >
                    <div className="template-header">
                      <h4>{template.name}</h4>
                    </div>
                    
                    <div className="template-details">
                      <div className="detail-item">
                        <span>Duration: {template.duration} weeks</span>
                      </div>
                      <div className="detail-item">
                        <span>Split: {template.split}</span>
                      </div>
                      <div className="detail-item">
                        <span>Training Days: {template.trainingDaysPerWeek}x/week</span>
                      </div>
                      {template.intensityRange && (
                        <div className="detail-item">
                          <span>Intensity: {template.intensityRange[0]}-{template.intensityRange[1]}%</span>
                        </div>
                      )}
                    </div>

                    <div className="template-description">
                      <p>{template.notes}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button 
                onClick={handleViewTemplateWorkouts}
                className="button primary"
              >
                View Workouts
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

      {showAssignmentForm && currentBlock && (
        <WorkoutAssignmentForm
          trainingBlock={currentBlock}
          availableWorkouts={availableWorkouts}
          onComplete={handleAssignmentComplete}
          onCancel={() => setShowAssignmentForm(false)}
          onEditWorkout={onEditWorkout}
        />
      )}
      
      {showTemplateWorkouts && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <h2>{TRAINING_BLOCK_TEMPLATES[selectedTemplate].name} - Workouts</h2>
            
            <div className="template-workouts-list">
              {templateWorkouts.map((workout) => (
                <div key={workout.id} className="template-workout-card">
                  <div className="workout-header">
                    <h4>{workout.workout_name}</h4>
                    <button
                      onClick={() => onEditWorkout?.(workout)}
                      className="button small secondary"
                    >
                      Edit Workout
                    </button>
                  </div>
                  
                  {workout.exercises.length > 0 ? (
                    <div className="workout-exercises">
                      <p>{workout.exercises.length} exercises</p>
                      <ul>
                        {workout.exercises.slice(0, 3).map((exercise, idx) => (
                          <li key={idx}>{exercise.name}</li>
                        ))}
                        {workout.exercises.length > 3 && (
                          <li>...and {workout.exercises.length - 3} more</li>
                        )}
                      </ul>
                    </div>
                  ) : (
                    <div className="workout-exercises empty">
                      <p>No exercises added yet</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="modal-actions">
              <button 
                onClick={() => {
                  setShowTemplateWorkouts(false);
                  handleCreateBlock();
                }}
                className="button primary"
              >
                Continue to Rotation Setup
              </button>
              <button 
                onClick={() => {
                  setShowTemplateWorkouts(false);
                  setShowCreateModal(true);
                }}
                className="button secondary"
              >
                Back to Templates
              </button>
            </div>
          </div>
        </div>
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

        .modal-tabs {
          display: flex;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid #404040;
        }

        .tab-button {
          padding: 0.75rem 1.5rem;
          border: none;
          background: none;
          cursor: pointer;
          font-weight: 600;
          color: #888888;
          border-bottom: 2px solid transparent;
        }

        .tab-button.active {
          color: #2196F3;
          border-bottom-color: #2196F3;
        }

        .template-selection h3 {
          color: #ffffff;
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

        .volume-customization {
          margin-top: 1rem;
          text-align: center;
        }

        .modal-subtitle {
          color: #b0b0b0;
          margin-bottom: 1.5rem;
          font-size: 0.9rem;
        }

        .volume-targets-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
          max-height: 400px;
          overflow-y: auto;
        }

        .volume-target-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .volume-target-item label {
          font-weight: 600;
          color: #ffffff;
          font-size: 0.9rem;
        }

        .target-input-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .target-input {
          width: 80px;
          padding: 0.5rem;
          border: 1px solid #404040;
          border-radius: 4px;
          background: #2a2a2a;
          color: #ffffff;
          font-size: 1rem;
        }

        .target-range {
          font-size: 0.8rem;
          color: #888888;
        }

        .rotation-section {
          margin-top: 1.5rem;
        }
        
        .rotation-assignments {
          margin-top: 1rem;
          padding: 1rem;
          background: #2a2a2a;
          border-radius: 8px;
        }
        
        .rotation-assignments h5 {
          margin: 0 0 0.75rem 0;
          color: #ffffff;
          font-size: 0.9rem;
        }
        
        .assignment-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .assignment-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0.75rem;
          background: #1e1e1e;
          border-radius: 4px;
          font-size: 0.85rem;
        }
        
        .slot-name {
          color: #2196F3;
          font-weight: 500;
        }
        
        .workout-name {
          color: #b0b0b0;
        }

        .assignment-actions {
          margin-top: 1.5rem;
          display: flex;
          gap: 1rem;
          justify-content: center;
        }
        
        .template-workouts-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin: 2rem 0;
          max-height: 400px;
          overflow-y: auto;
        }
        
        .template-workout-card {
          background: #2a2a2a;
          border: 1px solid #404040;
          border-radius: 8px;
          padding: 1.5rem;
          transition: border-color 0.2s ease;
        }
        
        .template-workout-card:hover {
          border-color: #555;
        }
        
        .workout-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .workout-header h4 {
          margin: 0;
          color: #ffffff;
        }
        
        .workout-exercises {
          color: #b0b0b0;
        }
        
        .workout-exercises.empty {
          font-style: italic;
          color: #666;
        }
        
        .workout-exercises ul {
          margin: 0.5rem 0 0 1.5rem;
          padding: 0;
        }
        
        .workout-exercises li {
          margin: 0.25rem 0;
        }
        
        .past-blocks-section {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid #404040;
        }
        
        .past-blocks-section h4 {
          color: #b0b0b0;
          margin: 0 0 1rem 0;
          font-size: 1rem;
        }
        
        .past-blocks-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1rem;
        }
        
        .past-block-card {
          background: #2a2a2a;
          border: 1px solid #404040;
          border-radius: 8px;
          padding: 1rem;
          transition: border-color 0.2s ease;
        }
        
        .past-block-card:hover {
          border-color: #555555;
        }
        
        .past-block-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        
        .past-block-header h5 {
          margin: 0;
          color: #ffffff;
          font-size: 1rem;
        }
        
        .completed-badge {
          background: #4CAF50;
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        
        .past-block-details {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.75rem;
          font-size: 0.875rem;
          color: #888888;
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
        }
      `}</style>
    </div>
  );
};

export default TrainingBlockPlanner;