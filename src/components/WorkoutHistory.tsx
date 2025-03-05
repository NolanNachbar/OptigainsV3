import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useSupabaseClient } from "../utils/supabaseClient";
import { Workout } from "../utils/types";
import { loadWorkouts } from "../utils/SupaBase";

interface WorkoutCardProps {
  workout: Workout;
  onEdit: () => void;
}

const WorkoutCard: React.FC<WorkoutCardProps> = ({ workout, onEdit }) => {
  return (
    <div className="workout-card">
      <div className="workout-header">
        <h3>{workout.workout_name}</h3>
        <button onClick={onEdit} className="edit-button">
          Edit
        </button>
      </div>
      <div className="workout-details">
        <p>Assigned Days: {workout.assigned_days.join(", ")}</p>
        <div className="exercises-list">
          {workout.exercises.map((exercise, index) => (
            <div key={index} className="exercise-item">
              <h4>{exercise.name}</h4>
              <div className="sets-list">
                {exercise.logs && exercise.logs.length > 0 && (
                  <div className="last-performed">
                    Last performed:{" "}
                    {new Date(
                      exercise.logs[exercise.logs.length - 1].date
                    ).toLocaleDateString()}
                  </div>
                )}
                {exercise.sets.map((set, setIndex) => (
                  <div key={setIndex} className="set-details">
                    Set {setIndex + 1}: {set.weight}lbs × {set.reps} @RIR
                    {set.rir}
                  </div>
                ))}
              </div>
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
  const supabase = useSupabaseClient();

  useEffect(() => {
    const fetchWorkouts = async () => {
      if (user && supabase) {
        try {
          const data = await loadWorkouts(supabase, user);
          setWorkouts(data);
        } catch (error) {
          console.error("Error fetching workouts:", error);
        }
      }
    };

    fetchWorkouts();
  }, [user, supabase]);

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
        filteredWorkouts.map((workout) => (
          <WorkoutCard
            key={workout.workout_name}
            workout={workout}
            onEdit={() => onEditWorkout(workout)}
          />
        ))
      ) : (
        <div className="no-workouts">
          <p>No workouts found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default WorkoutHistory;
