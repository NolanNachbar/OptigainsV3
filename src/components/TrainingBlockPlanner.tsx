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
import RotationPreview from './RotationPreview';
import WorkoutAssignmentForm from './WorkoutAssignmentForm';

interface TrainingBlockPlannerProps {
  onBlockChange?: (block: TrainingBlock | null) => void;
  availableWorkouts?: Workout[];
  onEditWorkout?: (workout: Workout) => void;
}

const TrainingBlockPlanner: React.FC<TrainingBlockPlannerProps> = ({ 
  onBlockChange,
  availableWorkouts = [],
  onEditWorkout
}) => {
  const [currentBlock, setCurrentBlock] = useState<TrainingBlock | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<number>(0);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [workoutRotation, setWorkoutRotation] = useState<string[]>([]);

  useEffect(() => {
    const block = getCurrentTrainingBlock();
    setCurrentBlock(block);
    if (block && block.workoutRotation) {
      setWorkoutRotation(block.workoutRotation);
    }
    onBlockChange?.(block);
  }, [onBlockChange]);

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
    setShowAssignmentForm(false);
    // Additional logic to save assignments can be added here
  };


  const handleAdvanceWeek = () => {
    if (currentBlock) {
      const advancedBlock = advanceTrainingBlock(currentBlock);
      updateTrainingBlock(advancedBlock);
      setCurrentBlock(advancedBlock);
      onBlockChange?.(advancedBlock);
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
                  onClick={() => setShowCreateModal(true)}
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
            </div>
          )}

          <div className="assignment-actions">
            <button
              onClick={() => setShowAssignmentForm(true)}
              className="button secondary"
            >
              Assign Workouts to Days
            </button>
          </div>
        </div>
      ) : (
        <div className="no-block">
          <div className="empty-state">
            <h4>No Active Training Block</h4>
            <p>Start a structured training program to optimize your bodybuilding progress with proper periodization.</p>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="button primary"
            >
              Create Your First Block
            </button>
          </div>
        </div>
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
                onClick={handleCreateBlock}
                className="button primary"
              >
                Start This Block
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

        .assignment-actions {
          margin-top: 1.5rem;
          display: flex;
          justify-content: center;
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