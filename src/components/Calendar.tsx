import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Workout, Exercise } from '../utils/types';
import { assignWorkoutToDate, getWorkoutsForDate, removeWorkoutFromDate, calculateNextWeight, removeWorkoutFromList} from '../utils/localStorage';
import '../styles/CalendarComponent.css';

interface CalendarProps {
  savedWorkouts: Workout[];
}

const CalendarComponent: React.FC<CalendarProps> = ({ savedWorkouts }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedWorkouts, setSelectedWorkouts] = useState<Workout[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [assignedDays, setAssignedDays] = useState<Record<string, boolean>>({});
  const [workoutsForToday, setWorkoutsForToday] = useState<Workout[]>([]);
  const [modalWorkout, setModalWorkout] = useState<Workout | null>(null);

  useEffect(() => {
    // Fetch assigned workouts for the selected date
    const workouts = getWorkoutsForDate(selectedDate.toISOString().split('T')[0]);
    setWorkoutsForToday(workouts);
    // Reload assigned days from localStorage when the component mounts or when workouts change
    const storedAssignedDays = JSON.parse(localStorage.getItem('assignedDays') || '{}');
    setAssignedDays(storedAssignedDays);
  }, [selectedDate]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handleWorkoutSelection = (workout: Workout) => {
    const workoutIndex = selectedWorkouts.findIndex(
      (w) => w.workoutName === workout.workoutName
    );

    if (workoutIndex === -1) {
      setSelectedWorkouts([...selectedWorkouts, workout]);
    } else {
      setSelectedWorkouts(selectedWorkouts.filter((w) => w.workoutName !== workout.workoutName));
    }
  };

  const handleDaySelection = (date: Date) => {
    // Format the selected date directly
    const selectedDateObj = new Date(date.toISOString().split('T')[0]); 
  
    const selectedDay = selectedDateObj.toISOString().split('T')[0];  // This is the selected day formatted correctly
  
    if (selectedWorkouts.length === 0) {
      // If no workout is selected, show all workouts for the selected day
      const workouts = getWorkoutsForDate(selectedDay); 
      setWorkoutsForToday(workouts);
    } else {
      // If a workout is selected, highlight the day
      const dayIndex = selectedDays.findIndex(selectedDay => selectedDay === selectedDay); 
      setSelectedDays(prev => {
        if (dayIndex === -1) { // If day not found, add it
          return [...prev, selectedDay];
        } else { // If day found, toggle selection at the correct index
          return prev.slice(0, dayIndex).concat(prev.slice(dayIndex + 1));
        }
      });
    }
  };
  

  const handleAssignWorkoutsToDays = () => {
    const newAssignedDays = { ...assignedDays };

    selectedDays.forEach(day => {
      selectedWorkouts.forEach(workout => {
        assignWorkoutToDate(workout.workoutName, day);
      });
      newAssignedDays[day] = true;
    });

    setAssignedDays(newAssignedDays);
    setSelectedDays([]);

    // Save the updated assignedDays to localStorage
    localStorage.setItem('assignedDays', JSON.stringify(newAssignedDays));

    alert(`Workouts assigned to selected days: ${selectedDays.join(', ')}`);
  };

  const handleRemoveWorkoutFromDate = (workout: Workout, date: string) => {
    removeWorkoutFromDate(workout.workoutName, date);
    // Update workoutsForToday state using a callback function
    updateWorkoutsForToday(workouts => workouts.filter(w => w.workoutName !== workout.workoutName));
  };
  
  const updateWorkoutsForToday = (callback: (workouts: Workout[]) => Workout[]) => {
    setWorkoutsForToday(callback);
  };

  const handleRemoveWorkoutFromList = (workout: Workout) => {
    removeWorkoutFromList(workout.workoutName);

    setSelectedWorkouts(prevWorkouts => prevWorkouts.filter(w => w.workoutName !== workout.workoutName));
    setWorkoutsForToday(prevWorkouts => prevWorkouts.filter(w => w.workoutName !== workout.workoutName));

    alert(`${workout.workoutName} has been deleted.`);
  };

  const getRecommendedWeight = (exercise: Exercise, reps: number, rir: number): number => {
    const nextWeight = calculateNextWeight(exercise, reps, rir);
    return nextWeight;
  };

  const handleViewWorkout = (workout: Workout) => {
    setModalWorkout(workout);
  };

  const handleCloseModal = () => {
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
          const day = date.toISOString().split('T')[0];
          if (assignedDays[day]) return 'react-calendar__tile--dot';
          return selectedDays.includes(day) ? 'react-calendar__tile--highlight' : '';
        }}
      />

      {/* <h3>Workouts for {selectedDate.toDateString()}</h3> */}
      <ul>
        {workoutsForToday.length ? (
          workoutsForToday.map((workout, index) => (
            <li key={index}>
              {workout.workoutName} ({workout.workoutType || 'No Type'})
              <ul>
                {workout.exercises.map((exercise, idx) => (
                  <li key={idx}>
                    <strong>{exercise.name}</strong>
                    <ul>
                      {exercise.sets.map((set, setIdx) => (
                        <li key={setIdx}>
                          <p>Set {setIdx + 1} - Weight: {set.weight} lbs, Reps: {set.reps}, RIR: {set.rir}</p>
                          <p>Next recommended weight: {getRecommendedWeight(exercise, set.reps, set.rir)} lbs</p>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
              <button onClick={() => handleRemoveWorkoutFromDate(workout, selectedDate.toISOString().split('T')[0])}>
                Remove from this day
              </button>
            </li>
          ))
        ) : (
          <p>No workouts assigned to this day.</p>
        )}
      </ul>

      <h3>Select Workouts to Assign</h3>
      {savedWorkouts.map((workout, index) => (
        <div key={index}>
          <input
            type="checkbox"
            checked={selectedWorkouts.some(w => w.workoutName === workout.workoutName)}
            onChange={() => handleWorkoutSelection(workout)}
          />
          <span>{workout.workoutName}</span>
          <button onClick={() => handleViewWorkout(workout)}>View</button>
          <button onClick={() => handleRemoveWorkoutFromList(workout)}>Delete</button>
        </div>
      ))}

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
          <div className="modal-content">
            <h2>{modalWorkout.workoutName}</h2>
            <p>Type: {modalWorkout.workoutType || 'No Type'}</p>
            <ul>
              {modalWorkout.exercises.map((exercise, idx) => (
                <li key={idx}>
                  <strong>{exercise.name}</strong>
                  <ul>
                    {exercise.sets.map((set, setIdx) => (
                      <li key={setIdx}>
                        <p>Set {setIdx + 1} - Weight: {set.weight} lbs, Reps: {set.reps}, RIR: {set.rir}</p>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
            <button onClick={() => alert('Edit workout functionality to be added.')}>Edit Workout</button>
            <button onClick={() => handleRemoveWorkoutFromList(modalWorkout)}>Delete Workout</button>
            <button onClick={handleCloseModal}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarComponent;
