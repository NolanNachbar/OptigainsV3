// src\components\Calendar.tsx
import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { Workout } from "../utils/types";
import {
  assignWorkoutToDate,
  getWorkoutsForDate,
  removeWorkoutFromDate,
  removeWorkoutFromList,
} from "../utils/SupaBase";
import "../styles/CalendarComponent.css";
import EditWorkoutComponent from "./EditWorkout";
import { useUser } from "@clerk/clerk-react";
import { useSupabaseClient } from "../utils/supabaseClient";

interface CalendarProps {
  savedWorkouts: Workout[];
  onRemoveWorkout: (workout: Workout) => void;
}

const CalendarComponent: React.FC<CalendarProps> = ({
  savedWorkouts = [],
  onRemoveWorkout,
}) => {
  const { user } = useUser();
  const supabase = useSupabaseClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedWorkouts, setSelectedWorkouts] = useState<Workout[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [assignedDays, setAssignedDays] = useState<Record<string, boolean>>({});
  const [workoutsForToday, setWorkoutsForToday] = useState<Workout[]>([]);
  const [modalWorkout, setModalWorkout] = useState<Workout | null>(null);
  const [editModal, setModalEdit] = useState(false);
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    if (!user) return;

    const fetchWorkouts = async () => {
      const workouts = await getWorkoutsForDate(
        supabase,
        selectedDate.toISOString().split("T")[0],
        user
      );
      setWorkoutsForToday(workouts);
    };

    fetchWorkouts();
  }, [selectedDate, user, modalWorkout, search, savedWorkouts, supabase]);

  const handleUpdateWorkout = (updatedWorkout: Workout) => {
    setModalWorkout(updatedWorkout);
  };

  const handleDateChange = (value: Date | Date[] | null) => {
    if (value instanceof Date) {
      setSelectedDate(value);
    }
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

  const handleDayClick = async (value: Date) => {
    const selectedDateStr = value.toISOString().split("T")[0];

    if (selectedWorkouts.length === 0) {
      if (user) {
        const workouts = await getWorkoutsForDate(
          supabase,
          selectedDateStr,
          user
        );
        setWorkoutsForToday(workouts);
      }
    } else {
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
    if (!user) return;

    const newAssignedDays = { ...assignedDays };

    for (const day of selectedDays) {
      for (const workout of selectedWorkouts) {
        const formattedDate = new Date(day).toISOString().split("T")[0];
        await assignWorkoutToDate(
          supabase,
          workout.workout_name,
          formattedDate,
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
    if (!user) return;

    await removeWorkoutFromDate(supabase, workout.workout_name, date, user);

    const updatedWorkouts = await getWorkoutsForDate(supabase, date, user);
    setWorkoutsForToday(updatedWorkouts);

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
    if (!user) return;

    await removeWorkoutFromList(supabase, workout.workout_name, user);
    setSelectedWorkouts((prevWorkouts) =>
      prevWorkouts.filter((w) => w.workout_name !== workout.workout_name)
    );
    setWorkoutsForToday((prevWorkouts) =>
      prevWorkouts.filter((w) => w.workout_name !== workout.workout_name)
    );
    onRemoveWorkout(workout);
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
        onClickDay={handleDayClick}
        tileClassName={({ date }) => {
          const day = date.toISOString().split("T")[0];
          if (assignedDays[day]) return "react-calendar__tile--dot";
          return selectedDays.includes(day)
            ? "react-calendar__tile--highlight"
            : "";
        }}
      />

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
              const date = new Date(day);
              date.setDate(date.getDate() + 1);
              return <li key={index}>{date.toDateString()}</li>;
            })}
          </ul>

          <button onClick={handleAssignWorkoutsToDays}>
            Assign Workouts to Selected Days
          </button>
        </>
      )}

      {modalWorkout && (
        <div className="modal">
          {!editModal ? (
            <div>
              <h2> Edit Workout </h2>
              <EditWorkoutComponent
                savedWorkout={modalWorkout}
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
