import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useDate } from "../contexts/DateContext";
import ActionBar from "../components/Actionbar";
import {
  getWorkoutForToday,
  getWorkoutHistory,
  getBodyWeightLogs,
  getWorkoutStreak,
  getWeeklyVolume,
} from "../utils/SupaBase";
import "../styles/design-system.css";
import "../styles/components.css";
import "../styles/optimized-home.css";

interface WorkoutStreak {
  current: number;
  longest: number;
  lastWorkoutDate: string;
}

interface WeeklyStats {
  workoutsCompleted: number;
  totalVolume: number;
  totalSets: number;
}

interface BodyWeight {
  weight: number;
  date: string;
  trend: 'up' | 'down' | 'stable';
}

const OptimizedHomePage: React.FC = () => {
  const { user } = useUser();
  const { currentDate } = useDate();
  const navigate = useNavigate();
  
  // State
  const [todaysWorkout, setTodaysWorkout] = useState<any>(null);
  const [recentWorkouts, setRecentWorkouts] = useState<any[]>([]);
  const [currentWeight, setCurrentWeight] = useState<BodyWeight | null>(null);
  const [workoutStreak, setWorkoutStreak] = useState<WorkoutStreak>({
    current: 0,
    longest: 0,
    lastWorkoutDate: "",
  });
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({
    workoutsCompleted: 0,
    totalVolume: 0,
    totalSets: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, currentDate]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Load all data in parallel
      const [
        todayWorkout,
        workoutHistory,
        weightLogs,
        // streak,
        // volume,
      ] = await Promise.all([
        getWorkoutForToday(null, currentDate.toISOString().split("T")[0], user),
        getWorkoutHistory(user, 7), // Last 7 workouts
        getBodyWeightLogs(user, 30), // Last 30 days
        // getWorkoutStreak(user),
        // getWeeklyVolume(user),
      ]);
      
      setTodaysWorkout(todayWorkout);
      setRecentWorkouts(workoutHistory || []);
      
      // Process weight data
      if (weightLogs && weightLogs.length > 0) {
        const latest = weightLogs[0];
        const previous = weightLogs[1];
        const trend = !previous ? 'stable' : 
          latest.weight > previous.weight ? 'up' : 
          latest.weight < previous.weight ? 'down' : 'stable';
        
        setCurrentWeight({
          weight: latest.weight,
          date: latest.date,
          trend,
        });
      }
      
      // Mock data for now (replace with actual calculations)
      setWorkoutStreak({
        current: 5,
        longest: 12,
        lastWorkoutDate: new Date().toISOString(),
      });
      
      setWeeklyStats({
        workoutsCompleted: workoutHistory?.length || 0,
        totalVolume: 45280, // Calculate from actual data
        totalSets: 96,
      });
      
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}k`;
    }
    return volume.toString();
  };

  const getDayOfWeek = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[currentDate.getDay()];
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  if (isLoading) {
    return (
      <div className="home-page">
        <ActionBar />
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <ActionBar />
      
      {/* Header */}
      <div className="home-header">
        <div className="greeting-section">
          <h1 className="greeting">{getGreeting()}, {user?.firstName || "Athlete"}!</h1>
          <p className="date">{getDayOfWeek()}, {currentDate.toLocaleDateString()}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        {todaysWorkout ? (
          <button 
            onClick={() => navigate("/start-lift")}
            className="quick-action-primary"
          >
            <div className="quick-action-icon">💪</div>
            <div className="quick-action-content">
              <h3>Start Today's Workout</h3>
              <p>{todaysWorkout.workout_name}</p>
            </div>
            <div className="quick-action-arrow">→</div>
          </button>
        ) : (
          <button 
            onClick={() => navigate("/freestyle-lift")}
            className="quick-action-primary"
          >
            <div className="quick-action-icon">⚡</div>
            <div className="quick-action-content">
              <h3>Quick Workout</h3>
              <p>Start an unplanned session</p>
            </div>
            <div className="quick-action-arrow">→</div>
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {/* Workout Streak */}
        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-content">
            <div className="stat-value">{workoutStreak.current}</div>
            <div className="stat-label">Day Streak</div>
          </div>
          <div className="stat-badge">Best: {workoutStreak.longest}</div>
        </div>

        {/* Current Weight */}
        <div className="stat-card" onClick={() => navigate("/body-weight-log")}>
          <div className="stat-icon">⚖️</div>
          <div className="stat-content">
            <div className="stat-value">
              {currentWeight ? `${currentWeight.weight} lbs` : "--"}
            </div>
            <div className="stat-label">Body Weight</div>
          </div>
          {currentWeight && (
            <div className={`stat-trend ${currentWeight.trend}`}>
              {currentWeight.trend === 'up' ? '↑' : 
               currentWeight.trend === 'down' ? '↓' : '→'}
            </div>
          )}
        </div>

        {/* Weekly Volume */}
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{formatVolume(weeklyStats.totalVolume)}</div>
            <div className="stat-label">Weekly Volume</div>
          </div>
        </div>

        {/* This Week */}
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <div className="stat-value">{weeklyStats.workoutsCompleted}</div>
            <div className="stat-label">This Week</div>
          </div>
        </div>
      </div>

      {/* Weekly Schedule Preview */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">This Week</h2>
          <button 
            onClick={() => navigate("/workout-plan")}
            className="btn btn-ghost btn-sm"
          >
            View All
          </button>
        </div>
        <div className="week-preview">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
            const isToday = index === (currentDate.getDay() + 6) % 7;
            const hasWorkout = index % 2 === 0; // Mock data
            
            return (
              <div 
                key={day}
                className={`day-cell ${isToday ? 'today' : ''} ${hasWorkout ? 'has-workout' : ''}`}
              >
                <div className="day-label">{day}</div>
                {hasWorkout && <div className="workout-dot"></div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Workouts */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Recent Activity</h2>
          <button 
            onClick={() => navigate("/library-page")}
            className="btn btn-ghost btn-sm"
          >
            History
          </button>
        </div>
        <div className="recent-workouts">
          {recentWorkouts.length > 0 ? (
            recentWorkouts.slice(0, 3).map((workout, index) => (
              <div key={index} className="workout-item">
                <div className="workout-date">
                  {new Date(workout.date).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
                <div className="workout-details">
                  <h4 className="workout-name">{workout.workout_name}</h4>
                  <p className="workout-stats">
                    {workout.total_sets} sets • {formatVolume(workout.total_volume)} lbs
                  </p>
                </div>
                <div className="workout-rating">
                  {workout.rating ? '⭐'.repeat(workout.rating) : ''}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-message">
              <p>No recent workouts</p>
              <button 
                onClick={() => navigate("/workout-plan")}
                className="btn btn-primary btn-sm"
              >
                Plan Your First Workout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="section">
        <h2 className="section-title">Quick Links</h2>
        <div className="quick-links">
          <button 
            onClick={() => navigate("/workout-plan")}
            className="quick-link"
          >
            <span className="quick-link-icon">📋</span>
            <span className="quick-link-label">Workout Plans</span>
          </button>
          <button 
            onClick={() => navigate("/library-page")}
            className="quick-link"
          >
            <span className="quick-link-icon">📚</span>
            <span className="quick-link-label">Exercise Library</span>
          </button>
          <button 
            onClick={() => navigate("/body-weight-log")}
            className="quick-link"
          >
            <span className="quick-link-icon">📈</span>
            <span className="quick-link-label">Track Weight</span>
          </button>
          <button 
            onClick={() => navigate("/calculator")}
            className="quick-link"
          >
            <span className="quick-link-icon">🧮</span>
            <span className="quick-link-label">Calculators</span>
          </button>
        </div>
      </div>

      {/* Motivational Quote */}
      <div className="motivation-card">
        <p className="motivation-quote">
          "The pain you feel today will be the strength you feel tomorrow."
        </p>
        <p className="motivation-author">- Arnold Schwarzenegger</p>
      </div>
    </div>
  );
};

export default OptimizedHomePage;