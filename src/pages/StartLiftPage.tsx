import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getWorkoutsForDate } from "../utils/localStorageDB";
import { Workout, WorkoutInstance } from "../utils/types";
import ActionBar from "../components/Actionbar";
import { useUser } from "@clerk/clerk-react";
import { getCurrentTrainingBlock } from "../utils/trainingBlocks";
import { db } from "../utils/database";

const StartLiftPage: React.FC = () => {
  const { user } = useUser();
  const [workoutToday, setWorkoutToday] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutInstance[]>([]);
  const [currentBlock, setCurrentBlock] = useState<any>(null);
  const [todayDate] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWorkoutData = async () => {
      if (!user) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      try {
        // Get today's workout
        const todayStr = todayDate.toISOString().split("T")[0];
        const workouts = await getWorkoutsForDate(null, todayStr, user);
        
        if (workouts && workouts.length > 0) {
          setWorkoutToday(workouts[0]);
        }

        // Get current training block
        const block = getCurrentTrainingBlock();
        setCurrentBlock(block);

        // Get recent workout instances (last 7 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        
        const instances = await db.getWorkoutInstances(user.id, {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        });
        
        setRecentWorkouts(instances.filter(w => w.completed_at));
      } catch (err) {
        console.error("Error fetching workout data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkoutData();
  }, [user, todayDate]);

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  const getGreeting = () => {
    const hour = todayDate.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return (
      <div className="start-lift-page">
        <ActionBar />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your workout...</p>
        </div>
      </div>
    );
  }

  const WorkoutPreviewCard = ({ workout }: { workout: Workout }) => (
    <div className="workout-preview-card">
      <div className="workout-preview-header">
        <h3>{workout.workout_name}</h3>
        <span className="exercise-count">{workout.exercises.length} exercises</span>
      </div>
      <div className="workout-preview-exercises">
        {workout.exercises.slice(0, 4).map((exercise, idx) => (
          <div key={idx} className="exercise-preview">
            <span className="exercise-name">{exercise.name}</span>
            <span className="exercise-sets">{exercise.sets.length} sets</span>
          </div>
        ))}
        {workout.exercises.length > 4 && (
          <div className="exercise-preview more">
            <span>+{workout.exercises.length - 4} more exercises</span>
          </div>
        )}
      </div>
      <button 
        onClick={() => navigate("/start-programmed-lift")}
        className="start-workout-btn"
      >
        Start This Workout
      </button>
    </div>
  );

  return (
    <div className="start-lift-page">
      <ActionBar />
      
      <div className="page-content">
        <div className="date-header">
          <h1>{getGreeting()}, {user?.firstName || 'Athlete'}</h1>
          <p className="current-date">{formatDate(todayDate)}</p>
        </div>

        {currentBlock && (
          <div className="training-block-info">
            <div className="block-badge">
              <span className="block-name">{currentBlock.name}</span>
              <span className="block-progress">Week {currentBlock.currentWeek} of {currentBlock.duration}</span>
            </div>
          </div>
        )}

        <div className="main-actions">
          {workoutToday ? (
            <div className="today-workout-section">
              <h2>Today's Workout</h2>
              <WorkoutPreviewCard workout={workoutToday} />
            </div>
          ) : (
            <div className="no-workout-section">
              <h2>No Workout Scheduled Today</h2>
              <p>Choose an option below to start training</p>
            </div>
          )}

          <div className="quick-actions">
            <button 
              onClick={() => navigate("/weight-log")} 
              className="quick-action-btn weigh-in"
            >
              <span className="label">Weigh In</span>
            </button>
            
            <button
              onClick={() => navigate("/freestyle-lift")}
              className="quick-action-btn freestyle"
            >
              <span className="label">Freestyle Workout</span>
            </button>

            <button
              onClick={() => navigate("/workout-plan")}
              className="quick-action-btn plan"
            >
              <span className="label">View Calendar</span>
            </button>
          </div>
        </div>

        {recentWorkouts.length > 0 && (
          <div className="recent-workouts">
            <h3>Recent Activity</h3>
            <div className="recent-list">
              {recentWorkouts.slice(0, 3).map((workout) => (
                <div key={workout.id} className="recent-item">
                  <div className="recent-info">
                    <span className="workout-name">{workout.workout_name}</span>
                    <span className="workout-date">
                      {new Date(workout.completed_at!).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                  <span className="exercise-count">{workout.exercises.length} exercises</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .start-lift-page {
          min-height: 100vh;
          background: #121212;
          color: #ffffff;
        }

        .page-content {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 50vh;
          gap: 1rem;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #404040;
          border-top-color: #2196F3;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .date-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .date-header h1 {
          font-size: 2rem;
          margin: 0 0 0.5rem 0;
          color: #ffffff;
        }

        .current-date {
          color: #b0b0b0;
          font-size: 1.1rem;
        }

        .training-block-info {
          display: flex;
          justify-content: center;
          margin-bottom: 2rem;
        }

        .block-badge {
          background: #1e1e1e;
          border: 1px solid #404040;
          border-radius: 8px;
          padding: 0.75rem 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }

        .block-name {
          font-weight: 600;
          color: #2196F3;
        }

        .block-progress {
          font-size: 0.875rem;
          color: #b0b0b0;
        }

        .today-workout-section, .no-workout-section {
          text-align: center;
          margin-bottom: 3rem;
        }

        .today-workout-section h2, .no-workout-section h2 {
          margin-bottom: 1.5rem;
          color: #ffffff;
        }

        .no-workout-section p {
          color: #888888;
          margin-bottom: 2rem;
        }

        .workout-preview-card {
          background: #1e1e1e;
          border: 2px solid #404040;
          border-radius: 12px;
          padding: 1.5rem;
          max-width: 500px;
          margin: 0 auto;
          transition: border-color 0.2s ease;
        }

        .workout-preview-card:hover {
          border-color: #2196F3;
        }

        .workout-preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .workout-preview-header h3 {
          margin: 0;
          color: #ffffff;
          font-size: 1.5rem;
        }

        .exercise-count {
          background: #2a2a2a;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.875rem;
          color: #b0b0b0;
        }

        .workout-preview-exercises {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .exercise-preview {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: #2a2a2a;
          border-radius: 8px;
          font-size: 0.9rem;
        }

        .exercise-name {
          color: #ffffff;
          font-weight: 500;
        }

        .exercise-sets {
          color: #888888;
        }

        .exercise-preview.more {
          justify-content: center;
          color: #666666;
          font-style: italic;
        }

        .start-workout-btn {
          width: 100%;
          padding: 1rem;
          background: #2196F3;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .start-workout-btn:hover {
          background: #1976D2;
        }

        .quick-actions {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
          max-width: 500px;
          margin: 0 auto;
        }

        .quick-action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem 1.5rem;
          background: #1e1e1e;
          border: 1px solid #404040;
          border-radius: 12px;
          color: #ffffff;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .quick-action-btn:hover {
          background: #2a2a2a;
          border-color: #555555;
          transform: translateY(-2px);
        }

        .quick-action-btn .label {
          font-size: 1rem;
          font-weight: 600;
        }

        .quick-action-btn.weigh-in {
          border-color: #4CAF50;
        }

        .quick-action-btn.weigh-in:hover {
          background: #1a2e1a;
        }

        .quick-action-btn.freestyle {
          border-color: #FF9800;
        }

        .quick-action-btn.freestyle:hover {
          background: #2e1f1a;
        }

        .quick-action-btn.plan {
          border-color: #9C27B0;
        }

        .quick-action-btn.plan:hover {
          background: #2a1a2e;
        }

        .recent-workouts {
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 1px solid #333333;
        }

        .recent-workouts h3 {
          margin: 0 0 1rem 0;
          color: #b0b0b0;
          font-size: 1.1rem;
        }

        .recent-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .recent-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          background: #1e1e1e;
          border-radius: 8px;
          transition: background 0.2s ease;
        }

        .recent-item:hover {
          background: #2a2a2a;
        }

        .recent-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .workout-name {
          font-weight: 500;
          color: #ffffff;
        }

        .workout-date {
          font-size: 0.875rem;
          color: #888888;
        }

        @media (max-width: 768px) {
          .page-content {
            padding: 1rem;
          }

          .date-header h1 {
            font-size: 1.5rem;
          }

          .quick-actions {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default StartLiftPage;
