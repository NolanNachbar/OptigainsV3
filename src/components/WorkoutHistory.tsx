import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { Workout } from "../utils/types";
import { loadWorkouts } from "../utils/SupaBase";

interface WorkoutCardProps {
  workout: Workout;
  onEdit: () => void;
}

const WorkoutCard: React.FC<WorkoutCardProps> = ({ workout, onEdit }) => {
  const totalExercises = workout.exercises.length;
  const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  
  return (
    <div className="workout-history-card" onClick={onEdit}>
      <div className="workout-card-content">
        <h3>{workout.workout_name}</h3>
        <div className="workout-stats">
          <span>{totalExercises} exercises</span>
          <span>{totalSets} sets</span>
        </div>
        <div className="exercise-list-preview">
          {workout.exercises.map((exercise, index) => (
            <div key={index} className="exercise-preview-item">
              <span className="exercise-name">{exercise.name}</span>
              <span className="sets-count">{exercise.sets.length} sets</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface WorkoutHistoryProps {
  searchTerm: string;
  selectedDate: Date | null;
  onEditWorkout: (workout: Workout) => void;
}

const WorkoutHistory: React.FC<WorkoutHistoryProps> = ({
  searchTerm,
  selectedDate,
  onEditWorkout,
}) => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const { user } = useUser();

  useEffect(() => {
    const fetchWorkouts = async () => {
      if (user) {
        try {
          const data = await loadWorkouts(null, user);
          setWorkouts(data);
        } catch (error) {
          console.error("Error fetching workouts:", error);
        }
      }
    };

    fetchWorkouts();
  }, [user]);

  const filteredWorkouts = workouts.filter((workout) => {
    const matchesSearch = workout.workout_name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesDate = selectedDate
      ? workout.exercises.some((exercise) =>
          exercise.logs?.some(
            (log) => log.date === selectedDate.toISOString().split("T")[0]
          )
        )
      : true;

    return matchesSearch && matchesDate;
  });

  return (
    <div className="workout-history">
      {filteredWorkouts.length > 0 ? (
        <div className="workout-cards-grid">
          {filteredWorkouts.map((workout) => (
            <WorkoutCard
              key={workout.workout_name}
              workout={workout}
              onEdit={() => onEditWorkout(workout)}
            />
          ))}
        </div>
      ) : (
        <div className="no-workouts">
          <div className="empty-state">
            <h3>No workouts found</h3>
            <p>Try adjusting your search criteria or create a new workout.</p>
          </div>
        </div>
      )}
      
      <style>{`
        .workout-history {
          padding: 1rem 0;
        }
        
        .workout-cards-grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .workout-history-card {
          background: #1e1e1e;
          border: 1px solid #333;
          border-radius: 8px;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .workout-history-card:hover {
          border-color: #2196F3;
        }
        
        .workout-card-content h3 {
          color: #ffffff;
          margin: 0 0 0.75rem 0;
          font-size: 1.25rem;
          font-weight: 600;
        }
        
        .workout-stats {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #333;
        }
        
        .workout-stats span {
          color: #888;
          font-size: 0.9rem;
        }
        
        .exercise-list-preview {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .exercise-preview-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: #121212;
          border-radius: 6px;
        }
        
        .exercise-name {
          color: #ffffff;
          font-weight: 500;
        }
        
        .sets-count {
          color: #888;
          font-size: 0.875rem;
        }
        
        .no-workouts {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
        }
        
        .empty-state {
          text-align: center;
        }
        
        .empty-state h3 {
          color: #ffffff;
          margin-bottom: 0.5rem;
          font-size: 1.25rem;
        }
        
        .empty-state p {
          color: #888;
        }
        
        @media (max-width: 768px) {
          .workout-history-card {
            padding: 1rem;
          }
          
          .exercise-preview-item {
            padding: 0.5rem;
            font-size: 0.875rem;
          }
        }
      `}</style>
    </div>
  );
};

export default WorkoutHistory;
