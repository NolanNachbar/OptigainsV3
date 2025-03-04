// src\components\Calendar.tsx
import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { Workout, Exercise } from "../utils/types";
import {
  assignWorkoutToDate,
  getWorkoutsForDate,
  removeWorkoutFromDate,
  calculateNextWeight,
  removeWorkoutFromList,
} from "../utils/SupaBase";
import "../styles/CalendarComponent.css";
import EditWorkoutComponent from "./EditWorkout";
import { useUser } from "@clerk/clerk-react";
import { useSupabaseClient } from "../utils/supabaseClient"; // Import the hook

interface CalendarProps {
  savedWorkouts: Workout[];
  onRemoveWorkout: (workout: Workout) => void; // Add this line
}

const CalendarComponent: React.FC<CalendarProps> = ({
  savedWorkouts = [],
  onRemoveWorkout,
}) => {
  const { user } = useUser();
  const supabase = useSupabaseClient(); // Initialize Supabase client
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedWorkouts, setSelectedWorkouts] = useState<Workout[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [assignedDays, setAssignedDays] = useState<Record<string, boolean>>({});
  const [workoutsForToday, setWorkoutsForToday] = useState<Workout[]>([]);
  const [modalWorkout, setModalWorkout] = useState<Workout | null>(null);
  const [editModal, setModalEdit] = useState(false);
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    if (!user) return; // Ensure user is authenticated

    const fetchWorkouts = async () => {
      const workouts = await getWorkoutsForDate(
        supabase, // Pass supabase here
        selectedDate.toISOString().split("T")[0],
        user
      );
      setWorkoutsForToday(workouts);
    };

    fetchWorkouts();
  }, [selectedDate, user, modalWorkout, search, savedWorkouts, supabase]); // Add `supabase` to dependencies

  const handleUpdateWorkout = (updatedWorkout: Workout) => {
    setModalWorkout(updatedWorkout); // Update the modalWorkout state
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handleWorkoutSelection = (workout: Workout) => {
    const workoutIndex = selectedWorkouts.findIndex(
      (w) => w.workout_name === workout.workout_name
    );

    if (workoutIndex === -1) {
      setSelectedWorkouts([...selectedWorkouts, workout]);
    } else {
      setSelectedWorkouts(
        selectedWorkouts.filter((w) => w.workout_name !== workout.workout_name)
      );
    }
  };

  const handleDaySelection = async (date: Date) => {
    const selectedDateStr = date.toISOString().split("T")[0]; // Get the date in YYYY-MM-DD format

    if (selectedWorkouts.length === 0) {
      // If no workout is selected, show all workouts for the selected day
      if (user) {
        const workouts = await getWorkoutsForDate(
          supabase, // Pass supabase here
          selectedDateStr,
          user
        );
        setWorkoutsForToday(workouts);
      }
    } else {
      // Toggle selection of the day
      setSelectedDays((prevSelectedDays) => {
        if (prevSelectedDays.includes(selectedDateStr)) {
          return prevSelectedDays.filter((day) => day !== selectedDateStr);
        } else {
          return [...prevSelectedDays, selectedDateStr];
        }
      });
    }
  };

  const handleAssignWorkoutsToDays = async () => {
    if (!user) return; // Ensure user is authenticated

    const newAssignedDays = { ...assignedDays };

    for (const day of selectedDays) {
      for (const workout of selectedWorkouts) {
        await assignWorkoutToDate(
          supabase, // Pass supabase here
          workout.workout_name,
          day,
          user
        );
        if (!newAssignedDays[day]) newAssignedDays[day] = true;
      }
    }

    setAssignedDays(newAssignedDays);
    setSelectedDays([]);
    alert(`Workouts assigned to selected days: ${selectedDays.join(", ")}`);
  };

  const handleRemoveWorkoutFromDate = async (
    workout: Workout,
    date: string
  ) => {
    if (!user) return; // Ensure user is authenticated

    await removeWorkoutFromDate(
      supabase, // Pass supabase here
      workout.workout_name,
      date,
      user
    );

    // Update workoutsForToday state
    const updatedWorkouts = await getWorkoutsForDate(
      supabase, // Pass supabase here
      date,
      user
    );
    setWorkoutsForToday(updatedWorkouts);

    // Update assignedDays
    const updatedAssignedDays = { ...assignedDays };
    if (updatedWorkouts.length === 0) {
      delete updatedAssignedDays[date];
    }
    setAssignedDays(updatedAssignedDays);
  };

  const filteredWorkouts =
    savedWorkouts?.filter((workout) =>
      workout?.workout_name?.toLowerCase().includes(search?.toLowerCase() || "")
    ) || [];

  const handleRemoveWorkoutFromList = async (workout: Workout) => {
    if (!user) return; // Ensure user is authenticated

    await removeWorkoutFromList(
      supabase, // Pass supabase here
      workout.workout_name,
      user
    );
    setSelectedWorkouts((prevWorkouts) =>
      prevWorkouts.filter((w) => w.workout_name !== workout.workout_name)
    );
    setWorkoutsForToday((prevWorkouts) =>
      prevWorkouts.filter((w) => w.workout_name !== workout.workout_name)
    );
    onRemoveWorkout(workout);
  };

  const getRecommendedWeight = (
    exercise: Exercise,
    reps: number,
    rir: number
  ): number => {
    // Calculate the next weight based on reps and rir
    const nextWeight = calculateNextWeight(exercise, reps, rir);

    // Calculate the adjusted reps (6-7 reps + RIR)
    const adjustedReps = reps + rir; // Make sure it's between 6-7 reps

    // Calculate the 1RM using Epley
    const oneRm = nextWeight * (1 + 0.0333 * adjustedReps);

    // Estimate the weight for 6-7 reps based on the 1RM using Epley
    const targetReps = 6 + rir;
    const recommendedWeight = oneRm / (1 + 0.0333 * targetReps);

    // Return the recommended weight, rounded to the nearest 5
    const roundedWeight = Math.round(recommendedWeight / 5) * 5;

    return roundedWeight;
  };

  const handleViewWorkout = (workout: Workout) => {
    setModalWorkout(workout);
  };

  const handleCloseModal = () => {
    if (!editModal) setModalEdit((editModal) => !editModal);
    setModalWorkout(null);
  };

  return (
    <div>
      <h2>Assign Workouts to Calendar</h2>
      <Calendar
        onChange={() => handleDateChange} // Ensure onChange properly handles date change
        value={selectedDate}
        onClickDay={handleDaySelection} // Pass the correct handler for day click
        tileClassName={({ date }) => {
          const day = date.toISOString().split("T")[0];
          // Check if this day has workouts assigned
          if (assignedDays[day]) return "react-calendar__tile--dot"; // Add a dot for assigned days
          return selectedDays.includes(day)
            ? "react-calendar__tile--highlight"
            : ""; // Highlight selected days
        }}
      />

      {/* <h3>Workouts for {selectedDate.toDateString()}</h3> */}
      <ul>
        {workoutsForToday.length ? (
          workoutsForToday.map((workout, index) => (
            <li key={index}>
              {workout.workout_name}
              <ul>
                {workout.exercises.map((exercise, idx) => (
                  <li key={idx}>
                    <strong>{exercise.name}</strong>
                    <ul>
                      {exercise.sets.map((set, setIdx) => (
                        <li key={setIdx}>
                          <p>
                            Set {setIdx + 1} - Weight: {set.weight} lbs, Reps:{" "}
                            {set.reps}, RIR: {set.rir}
                          </p>
                          <p>
                            Next recommended weight:{" "}
                            {getRecommendedWeight(exercise, set.reps, set.rir)}{" "}
                            lbs
                          </p>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
              <button
                onClick={() =>
                  handleRemoveWorkoutFromDate(
                    workout,
                    selectedDate.toISOString().split("T")[0]
                  )
                }
              >
                Remove from this day
              </button>
            </li>
          ))
        ) : (
          <p>No workouts assigned to this day.</p>
        )}
      </ul>

      <h3>Select Workouts to Assign</h3>

      <h4>Saved Workouts</h4>

      {/* Search and List of Workouts */}
      <div className="workout-container">
        <h4>Saved Workouts</h4>
        <div>
          <label>Search Workouts</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="workout-scroll-container">
          <ul className="workout-list">
            {filteredWorkouts.map((workout, index) => (
              <li key={index} className="workout-card">
                <div className="workout-info">
                  <input
                    type="checkbox"
                    checked={selectedWorkouts.some(
                      (w) => w.workout_name === workout.workout_name
                    )}
                    onChange={() => handleWorkoutSelection(workout)}
                    className="workout-checkbox"
                  />
                  <span className="workout-name">{workout.workout_name}</span>
                </div>
                <div className="workout-actions">
                  <button
                    onClick={() => handleViewWorkout(workout)}
                    className="button action view-button"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleRemoveWorkoutFromList(workout)}
                    className="button action delete-button"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {selectedWorkouts.length > 0 && (
        <>
          <h3>Selected Days to Assign Workouts</h3>
          <ul>
            {selectedDays.map((day, index) => {
              // Convert day string to Date object
              const date = new Date(day);

              // Add 1 day to the current date
              date.setDate(date.getDate() + 1);

              // Return the formatted date after adding 1 day
              return <li key={index}>{date.toDateString()}</li>;
            })}
          </ul>

          <button onClick={handleAssignWorkoutsToDays}>
            Assign Workouts to Selected Days
          </button>
        </>
      )}

      {/* Modal to view workout details */}
      {modalWorkout && (
        <div className="modal">
          {/* Modal to edit workout*/}
          {!editModal ? (
            <div>
              <h2> Edit Workout </h2>
              <EditWorkoutComponent
                savedWorkout={modalWorkout} // Pass the function to update the workout in the parent
                onUpdateWorkout={handleUpdateWorkout}
              />
            </div>
          ) : (
            <div className="modal-content">
              <h2>{modalWorkout.workout_name}</h2>
              <ul>
                {modalWorkout.exercises.map((exercise, idx) => (
                  <li key={idx}>
                    <strong>{exercise.name}</strong>
                    <ul>
                      {exercise.sets.map((set, setIdx) => (
                        <li key={setIdx}>
                          <p>
                            Set {setIdx + 1} - Weight: {set.weight} lbs, Reps:{" "}
                            {set.reps}, RIR: {set.rir}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* <button onClick={() => alert('Edit workout functionality to be added.')}>Edit Workout</button> */}
          <button onClick={() => handleRemoveWorkoutFromList(modalWorkout)}>
            Delete Workout
          </button>
          <button
            onClick={() => setModalEdit((editModal) => !editModal)}
            className="action-btn"
          >
            {!editModal ? "Finish Editing" : "Edit Exercises"}
          </button>
          <button onClick={handleCloseModal}>Close</button>
        </div>
      )}
    </div>
  );
};

export default CalendarComponent;
