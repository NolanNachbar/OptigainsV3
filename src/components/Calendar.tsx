import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Workout } from '../utils/types';
import { assignWorkoutToDate, getWorkoutsForDate } from '../utils/localStorage';

interface CalendarProps {
  savedWorkouts: Workout[];
}

const CalendarComponent: React.FC<CalendarProps> = ({ savedWorkouts }) => {
  const [date, setDate] = useState<Date>(new Date());

  // Adjust the function signature to match the expected onChange type
  const handleDateChange = (value: Date | Date[] | null, event: React.MouseEvent<HTMLButtonElement>) => {
    if (value instanceof Date) {
      setDate(value);
    } else if (Array.isArray(value)) {
      setDate(value[0]);
    } else {
        setDate(new Date());
    }
  };

  // Handle workout assignment
  const handleAssignWorkout = (workoutId: string, selectedDate: Date) => {
    const formattedDate = selectedDate.toISOString().split('T')[0]; // Format date as YYYY-MM-DD
    assignWorkoutToDate(workoutId, formattedDate);
    alert(`Workout assigned to ${formattedDate}`);
  };

  // Get workouts assigned for the current date
  const workoutsForToday = getWorkoutsForDate(date.toISOString().split('T')[0]);

  return (
    <div>
      <h2>Assign Workouts to Calendar</h2>
      <Calendar
        onChange={handleDateChange} // Now includes both value and event arguments
        value={date}
        tileClassName={({ date }) => {
          const workoutsForThisDay = getWorkoutsForDate(date.toISOString().split('T')[0]);
          return workoutsForThisDay.length > 0 ? 'highlight' : '';
        }}
      />

      <h3>Workouts for {date.toDateString()}</h3>

      <ul>
        {workoutsForToday.map((workout, index) => (
          <li key={index}>
            {workout.workoutName} ({workout.workoutType || 'No Type'})
          </li>
        ))}
      </ul>

      <h3>Assign New Workout</h3>

      {savedWorkouts.map((workout, index) => (
        <div key={index}>
          <h4>{workout.workoutName}</h4>
          <button onClick={() => handleAssignWorkout(workout.workoutName, date)}>
            Assign to {date.toDateString()}
          </button>
        </div>
      ))}
    </div>
  );
};

export default CalendarComponent;
