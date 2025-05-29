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
  copyWorkoutTemplate,
  getWorkoutTemplate,
} from "../utils/localStorageDB";
import "../styles/CalendarComponent.css";
import EditWorkoutComponent from "./EditWorkout";
import { useUser } from "@clerk/clerk-react";

interface CalendarProps {
  savedWorkouts: Workout[];
  onRemoveWorkout: (workout: Workout) => void;
  onWorkoutAdded?: (workout: Workout) => void;
}

const CalendarComponent: React.FC<CalendarProps> = ({
  savedWorkouts = [],
  onRemoveWorkout,
  onWorkoutAdded,
}) => {
  const { user } = useUser();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedWorkouts, setSelectedWorkouts] = useState<Workout[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [assignedDays, setAssignedDays] = useState<Record<string, boolean>>({});
  const [workoutsForToday, setWorkoutsForToday] = useState<Workout[]>([]);
  const [modalWorkout, setModalWorkout] = useState<Workout | null>(null);
  const [editModal, setModalEdit] = useState(false);
  const [search, setSearch] = useState<string>("");
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyWorkout, setCopyWorkout] = useState<Workout | null>(null);
  const [copyName, setCopyName] = useState<string>("");

  useEffect(() => {
    if (!user) return;

    const fetchWorkouts = async () => {
      const workouts = await getWorkoutsForDate(
        null,
        selectedDate.toISOString().split("T")[0],
        user
      );
      setWorkoutsForToday(workouts);
    };

    fetchWorkouts();
  }, [selectedDate, user, modalWorkout, search, savedWorkouts]);

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
          null,
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
          null,
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

    await removeWorkoutFromDate(null, workout.workout_name, date, user);

    const updatedWorkouts = await getWorkoutsForDate(null, date, user);
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

    await removeWorkoutFromList(null, workout.workout_name, user);
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

  const handleCopyWorkout = (workout: Workout) => {
    setCopyWorkout(workout);
    setCopyName(`${workout.workout_name} - Copy`);
    setShowCopyModal(true);
  };

  const handleConfirmCopy = async () => {
    if (!copyWorkout || !user || !copyName.trim()) return;

    try {
      // Get the original template
      const template = await getWorkoutTemplate(null, copyWorkout.workout_name, user);
      if (template) {
        // Copy the template with new name
        const copiedTemplate = await copyWorkoutTemplate(null, template, copyName.trim(), user);
        
        // Convert back to Workout format for compatibility
        const newWorkout: Workout = {
          id: copiedTemplate.id,
          workout_name: copiedTemplate.workout_name,
          assigned_days: [],
          exercises: copiedTemplate.exercises,
          clerk_user_id: copiedTemplate.clerk_user_id,
          user_id: copiedTemplate.user_id
        };

        // Notify parent component
        if (onWorkoutAdded) {
          onWorkoutAdded(newWorkout);
        }

        alert(`Workout copied successfully as "${copyName}"`);
      }
    } catch (error) {
      console.error("Error copying workout:", error);
      alert("Failed to copy workout. Please try again.");
    }

    setShowCopyModal(false);
    setCopyWorkout(null);
    setCopyName("");
  };

  const handleCancelCopy = () => {
    setShowCopyModal(false);
    setCopyWorkout(null);
    setCopyName("");
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
                    onClick={() => handleCopyWorkout(workout)}
                    className="button action copy-button"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => handleRemoveWorkoutFromList(workout)}
                    className="button action delete-button"
                  >
                    Delete
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

      {showCopyModal && copyWorkout && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Copy Workout</h2>
            <p>Create a copy of "{copyWorkout.workout_name}" with a new name:</p>
            
            <div className="modal-input-group">
              <label htmlFor="copy-workout-name">New Workout Name</label>
              <input
                type="text"
                id="copy-workout-name"
                value={copyName}
                onChange={(e) => setCopyName(e.target.value)}
                className="input-field"
                placeholder="Enter new workout name"
              />
            </div>
            
            <div className="workout-preview">
              <h4>What will be copied:</h4>
              <ul>
                <li><strong>{copyWorkout.exercises.length}</strong> exercises</li>
                <li><strong>{copyWorkout.exercises.reduce((total, ex) => total + ex.sets.length, 0)}</strong> total sets</li>
                <li>All exercise configurations and weights</li>
              </ul>
            </div>

            <div className="modal-actions">
              <button 
                onClick={handleConfirmCopy}
                className="button primary"
                disabled={!copyName.trim()}
              >
                Create Copy
              </button>
              <button 
                onClick={handleCancelCopy}
                className="button secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarComponent;
