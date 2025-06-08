import React, { useEffect, useState } from "react";
import WorkoutForm from "../components/WorkoutForm";
import ImprovedCalendar from "../components/ImprovedCalendar";
import TrainingBlockPlanner from "../components/TrainingBlockPlanner";
import EditWorkout from "../components/EditWorkout";
import {
  loadWorkouts,
  removeWorkoutFromList,
  preloadWorkouts,
} from "../utils/localStorageDB";
import { Workout, TrainingBlock } from "../utils/types";
import ActionBar from "../components/Actionbar";
import { useUser, useAuth } from "@clerk/clerk-react";

const WorkoutPlanPage: React.FC = () => {
  const [savedWorkouts, setSavedWorkouts] = useState<Workout[]>([]);
  const [currentTrainingBlock, setCurrentTrainingBlock] = useState<TrainingBlock | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'create'>('overview');
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const { user } = useUser();
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchWorkouts = async () => {
      if (user && getToken) {
        try {
          // Ensure database is initialized with auth token
          const { initializeDatabase } = await import('../utils/database');
          await initializeDatabase(() => getToken({ template: 'supabase' }));
          
          // Debug: Check the token
          const token = await getToken({ template: 'supabase' });
          if (token) {
            // Decode JWT to see claims
            const payload = token.split('.')[1];
            const decodedPayload = JSON.parse(atob(payload));
            console.log('JWT Token claims:', decodedPayload);
            console.log('User ID from Clerk:', user.id);
          }
          
          // Small delay to ensure auth is propagated
          await new Promise(resolve => setTimeout(resolve, 100));
          
          await preloadWorkouts(null, user);
          const workouts = await loadWorkouts(null, user);
          console.log('WorkoutPlanPage - Loaded workouts:', workouts.length, workouts.map(w => w.workout_name));
          setSavedWorkouts(workouts);
        } catch (error) {
          console.error("Error loading workouts:", error);
        }
      }
    };

    fetchWorkouts();
  }, [user, getToken]);

  const handleRemoveWorkout = async (workout: Workout) => {
    if (user) {
      await removeWorkoutFromList(null, workout.workout_name, user);
      setSavedWorkouts((prevWorkouts) =>
        prevWorkouts.filter((w) => w.workout_name !== workout.workout_name)
      );
    }
  };

  const handleWorkoutAdded = (workout: Workout) => {
    setSavedWorkouts((prevWorkouts) => [...prevWorkouts, workout]);
  };

  const handleTrainingBlockChange = (block: TrainingBlock | null) => {
    setCurrentTrainingBlock(block);
  };

  const handleEditWorkout = (workout: Workout) => {
    setEditingWorkout(workout);
    setActiveTab('create');
  };

  const handleWorkoutUpdated = (updatedWorkout: Workout) => {
    setSavedWorkouts((prevWorkouts) =>
      prevWorkouts.map((w) =>
        w.workout_name === updatedWorkout.workout_name ? updatedWorkout : w
      )
    );
    setEditingWorkout(null);
  };

  return (
    <div className="workout-plan-page">
      <ActionBar />
      
      <div className="workout-plan-header">
        <h1>Workout Planning</h1>
        <div className="tab-navigation">
          <button 
            className={activeTab === 'overview' ? 'tab-button active' : 'tab-button'}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={activeTab === 'schedule' ? 'tab-button active' : 'tab-button'}
            onClick={() => setActiveTab('schedule')}
          >
            Schedule
          </button>
          <button 
            className={activeTab === 'create' ? 'tab-button active' : 'tab-button'}
            onClick={() => setActiveTab('create')}
          >
            Create
          </button>
        </div>
      </div>

      <div className="workout-plan-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="training-block-section">
              <TrainingBlockPlanner 
                onBlockChange={handleTrainingBlockChange} 
                availableWorkouts={savedWorkouts}
                onEditWorkout={handleEditWorkout}
              />
            </div>
            
            {currentTrainingBlock && (
              <div className="block-insights">
                <div className="insights-card">
                  <h3>Current Block Insights</h3>
                  <div className="insights-content">
                    <div className="insight-item">
                      <span className="insight-label">Split:</span>
                      <span className="insight-value">{currentTrainingBlock.split}</span>
                    </div>
                    <div className="insight-item">
                      <span className="insight-label">Training Days:</span>
                      <span className="insight-value">{currentTrainingBlock.trainingDaysPerWeek} per week</span>
                    </div>
                    <div className="insight-item">
                      <span className="insight-label">Progress:</span>
                      <span className="insight-value">Week {currentTrainingBlock.currentWeek} of {currentTrainingBlock.duration}</span>
                    </div>
                  </div>
                  {currentTrainingBlock.notes && (
                    <div className="block-notes">
                      <h4>Notes</h4>
                      <p>{currentTrainingBlock.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="schedule-tab">
            <ImprovedCalendar
              savedWorkouts={savedWorkouts}
              onRemoveWorkout={handleRemoveWorkout}
              onWorkoutAdded={handleWorkoutAdded}
            />
          </div>
        )}

        {activeTab === 'create' && (
          <div className="create-tab">
            {editingWorkout ? (
              <EditWorkout
                savedWorkout={editingWorkout}
                onUpdateWorkout={handleWorkoutUpdated}
              />
            ) : (
              <WorkoutForm setSavedWorkouts={setSavedWorkouts} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutPlanPage;

// Add styles for the new layout
const styles = `
.workout-plan-page {
  min-height: 100vh;
  background: #121212;
}

.workout-plan-header {
  background: #1e1e1e;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #404040;
  margin-bottom: 2rem;
}

.workout-plan-header h1 {
  margin: 0 0 1rem 0;
  color: #ffffff;
  font-size: 2rem;
  font-weight: 700;
}

.tab-navigation {
  display: flex;
  gap: 0.5rem;
}

.tab-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: #2a2a2a;
  color: #b0b0b0;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tab-button:hover {
  background: #333333;
  color: #ffffff;
}

.tab-button.active {
  background: #2196F3;
  color: white;
}

.workout-plan-content {
  padding: 0 2rem 2rem;
}

.overview-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

.training-block-section,
.muscle-group-section {
  min-height: 400px;
}

.block-insights {
  margin-top: 2rem;
}

.insights-card {
  background: #1e1e1e;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  border: 1px solid #404040;
}

.insights-card h3 {
  margin: 0 0 1rem 0;
  color: #ffffff;
  font-size: 1.25rem;
}

.insights-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.insight-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #2a2a2a;
  border-radius: 6px;
  border: 1px solid #404040;
}

.insight-label {
  font-weight: 600;
  color: #b0b0b0;
}

.insight-value {
  font-weight: 700;
  color: #ffffff;
}

.specialization-info h4 {
  margin: 0 0 0.75rem 0;
  color: #ffffff;
}

.specialization-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.specialization-tag {
  padding: 0.25rem 0.75rem;
  background: #1a237e;
  color: #64b5f6;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
}

.schedule-tab,
.create-tab {
  background: #1e1e1e;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  border: 1px solid #404040;
}

@media (max-width: 1024px) {
  .overview-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .workout-plan-header {
    padding: 1rem;
  }
  
  .workout-plan-content {
    padding: 0 1rem 1rem;
  }
  
  .insights-content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .tab-navigation {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .tab-button {
    justify-content: center;
    padding: 0.625rem 1rem;
  }
  
  .workout-plan-header h1 {
    font-size: 1.5rem;
  }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}
