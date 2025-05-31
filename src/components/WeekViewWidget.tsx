import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Workout, TrainingBlock } from "../utils/types";
import { getWorkoutsForDate } from "../utils/localStorageDB";
import { getCurrentTrainingBlock } from "../utils/trainingBlocks";
import { useUser } from "@clerk/clerk-react";

const WeekViewWidget: React.FC = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [weekWorkouts, setWeekWorkouts] = useState<Record<string, Workout[]>>({});
  const [currentTrainingBlock, setCurrentTrainingBlock] = useState<TrainingBlock | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const fetchWeekData = async () => {
      setLoading(true);
      
      // Get current training block
      const block = getCurrentTrainingBlock();
      setCurrentTrainingBlock(block);
      
      // Get start of current week (Sunday)
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      
      // Fetch workouts for each day of the week
      const weekData: Record<string, Workout[]> = {};
      
      for (let i = 0; i < 7; i++) {
        const currentDay = new Date(startOfWeek);
        currentDay.setDate(startOfWeek.getDate() + i);
        const dateStr = currentDay.toISOString().split("T")[0];
        
        try {
          const workouts = await getWorkoutsForDate(null, dateStr, user);
          if (workouts.length > 0) {
            weekData[dateStr] = workouts;
          }
        } catch (error) {
          console.error(`Error fetching workouts for ${dateStr}:`, error);
        }
      }
      
      setWeekWorkouts(weekData);
      setLoading(false);
    };
    
    fetchWeekData();
  }, [user]);

  const getWorkoutTypeColor = (workoutName: string): string => {
    const name = workoutName.toLowerCase();
    if (name.includes('push')) return '#4CAF50';
    if (name.includes('pull')) return '#2196F3';
    if (name.includes('legs')) return '#FF9800';
    if (name.includes('upper')) return '#FF5722';
    if (name.includes('lower')) return '#E64A19';
    if (name.includes('full') || name.includes('fb')) return '#9C27B0';
    return '#757575';
  };

  const getDayName = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const getDayNumber = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.getDate().toString();
  };

  const isToday = (dateStr: string): boolean => {
    const today = new Date().toISOString().split("T")[0];
    return dateStr === today;
  };

  const isPastDay = (dateStr: string): boolean => {
    const today = new Date().toISOString().split("T")[0];
    return dateStr < today;
  };

  // Generate array of dates for the current week
  const getWeekDates = (): string[] => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(startOfWeek);
      currentDay.setDate(startOfWeek.getDate() + i);
      dates.push(currentDay.toISOString().split("T")[0]);
    }
    
    return dates;
  };

  const weekDates = getWeekDates();
  const completedWorkouts = Object.keys(weekWorkouts).filter(date => isPastDay(date)).length;
  const todayWorkouts = weekWorkouts[new Date().toISOString().split("T")[0]] || [];

  if (loading) {
    return (
      <div className="week-view-widget loading">
        <div className="widget-header">
          <h3>This Week's Schedule</h3>
        </div>
        <div className="loading-message">Loading workouts...</div>
      </div>
    );
  }

  return (
    <div className="week-view-widget">
      <div className="widget-header">
        <div className="header-content">
          <h3>This Week's Schedule</h3>
          {currentTrainingBlock && (
            <div className="training-block-badge">
              {currentTrainingBlock.name} - Week {currentTrainingBlock.currentWeek}
            </div>
          )}
        </div>
        <button 
          className="view-full-button"
          onClick={() => navigate('/workout-plan?tab=schedule')}
        >
          View Full Calendar
        </button>
      </div>

      <div className="week-summary">
        <div className="summary-item">
          <span className="summary-number">{completedWorkouts}</span>
          <span className="summary-label">Completed</span>
        </div>
        <div className="summary-item">
          <span className="summary-number">{Object.keys(weekWorkouts).length}</span>
          <span className="summary-label">Scheduled</span>
        </div>
        {todayWorkouts.length > 0 && (
          <div className="summary-item today">
            <span className="summary-number">{todayWorkouts.length}</span>
            <span className="summary-label">Today</span>
          </div>
        )}
      </div>

      <div className="week-grid">
        {weekDates.map(dateStr => {
          const dayWorkouts = weekWorkouts[dateStr] || [];
          const dayClass = `week-day ${isToday(dateStr) ? 'today' : ''} ${isPastDay(dateStr) ? 'past' : ''}`;
          
          return (
            <div key={dateStr} className={dayClass}>
              <div className="day-header">
                <span className="day-name">{getDayName(dateStr)}</span>
                <span className="day-number">{getDayNumber(dateStr)}</span>
              </div>
              <div className="day-workouts">
                {dayWorkouts.length > 0 ? (
                  dayWorkouts.map((workout, index) => (
                    <div 
                      key={index}
                      className="workout-chip"
                      style={{ backgroundColor: getWorkoutTypeColor(workout.workout_name) }}
                      onClick={() => navigate('/start-lift')}
                    >
                      <span className="workout-name">{workout.workout_name}</span>
                      <span className="exercise-count">{workout.exercises.length} ex</span>
                    </div>
                  ))
                ) : (
                  <div className="rest-day">Rest</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .week-view-widget {
          background: #1e1e1e;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          border: 1px solid #404040;
        }

        .week-view-widget.loading {
          min-height: 200px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .loading-message {
          color: #888888;
          margin-top: 1rem;
        }

        .widget-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }

        .header-content h3 {
          margin: 0;
          color: #ffffff;
          font-size: 1.5rem;
        }

        .training-block-badge {
          margin-top: 0.25rem;
          font-size: 0.875rem;
          color: #64b5f6;
          background: #1a237e;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          display: inline-block;
        }

        .view-full-button {
          padding: 0.5rem 1rem;
          background: #2196F3;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .view-full-button:hover {
          background: #1976D2;
        }

        .week-summary {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #404040;
        }

        .summary-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }

        .summary-number {
          font-size: 2rem;
          font-weight: 700;
          color: #ffffff;
        }

        .summary-item.today .summary-number {
          color: #2196F3;
        }

        .summary-label {
          font-size: 0.875rem;
          color: #b0b0b0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .week-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.75rem;
        }

        .week-day {
          background: #2a2a2a;
          border-radius: 8px;
          overflow: hidden;
          transition: all 0.2s ease;
          border: 1px solid #404040;
        }

        .week-day.today {
          border-color: #2196F3;
          box-shadow: 0 0 0 1px #2196F3;
        }

        .week-day.past {
          opacity: 0.6;
        }

        .day-header {
          background: #333333;
          padding: 0.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .day-name {
          font-weight: 600;
          color: #ffffff;
          font-size: 0.875rem;
        }

        .week-day.today .day-name {
          color: #2196F3;
        }

        .day-number {
          background: #404040;
          padding: 0.125rem 0.375rem;
          border-radius: 4px;
          font-size: 0.75rem;
          color: #e0e0e0;
        }

        .day-workouts {
          padding: 0.5rem;
          min-height: 80px;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .workout-chip {
          padding: 0.375rem 0.5rem;
          border-radius: 6px;
          color: white;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .workout-chip:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }

        .workout-name {
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
        }

        .exercise-count {
          font-size: 0.625rem;
          opacity: 0.9;
          white-space: nowrap;
          margin-left: 0.5rem;
        }

        .rest-day {
          color: #888888;
          font-style: italic;
          text-align: center;
          padding: 1rem 0;
        }

        @media (max-width: 1024px) {
          .week-grid {
            grid-template-columns: repeat(4, 1fr);
            grid-template-rows: repeat(2, 1fr);
          }

          .week-day:last-child {
            grid-column: span 1;
          }
        }

        @media (max-width: 768px) {
          .widget-header {
            flex-direction: column;
            gap: 1rem;
          }

          .view-full-button {
            width: 100%;
          }

          .week-grid {
            grid-template-columns: repeat(2, 1fr);
            grid-template-rows: repeat(4, 1fr);
          }

          .week-day:last-child {
            grid-column: span 2;
          }

          .workout-chip {
            font-size: 0.7rem;
            padding: 0.25rem 0.375rem;
          }

          .exercise-count {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .week-summary {
            justify-content: space-around;
          }

          .summary-number {
            font-size: 1.5rem;
          }

          .summary-label {
            font-size: 0.75rem;
          }

          .week-grid {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }

          .week-day {
            display: flex;
          }

          .day-header {
            min-width: 80px;
            flex-direction: column;
            justify-content: center;
          }

          .day-workouts {
            flex: 1;
            min-height: auto;
            flex-direction: row;
            align-items: center;
            padding: 0.75rem;
          }

          .rest-day {
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default WeekViewWidget;