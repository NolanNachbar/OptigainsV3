import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Workout } from '../utils/types';
import { assignWorkoutToDate, getWorkoutsForDate } from '../utils/localStorage';
import '../styles/CalendarComponent.css';  // Import the CSS file
interface CalendarProps {
  savedWorkouts: Workout[];
}

const CalendarComponent: React.FC<CalendarProps> = ({ savedWorkouts }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedWorkouts, setSelectedWorkouts] = useState<Workout[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handleWorkoutSelection = (workout: Workout) => {
    setSelectedWorkouts(prev => {
      if (prev.includes(workout)) {
        return prev.filter(w => w !== workout);
      } else {
        return [...prev, workout];
      }
    });
  };

  const handleAssignWorkoutsToDays = () => {
    selectedWorkouts.forEach(workout => {
      selectedDays.forEach(day => {
        assignWorkoutToDate(workout.workoutName, day);
      });
    });
    alert(`Workouts assigned to selected days: ${selectedDays.join(', ')}`);
  };

  const workoutsForToday = getWorkoutsForDate(selectedDate.toISOString().split('T')[0]);

  const handleDaySelection = (date: Date) => {
    const day = date.toISOString().split('T')[0];
    setSelectedDays(prev => {
      if (prev.includes(day)) {
        return prev.filter(d => d !== day);
      } else {
        return [...prev, day];
      }
    });
  };

  // Handle double-click to highlight dates
  const handleDayDoubleClick = (date: Date) => {
    const day = date.toISOString().split('T')[0]; // Convert the date to the 'YYYY-MM-DD' format
    setSelectedDays(prev => {
      if (prev.includes(day)) {
        return prev.filter(d => d !== day); // Deselect if already selected
      } else {
        return [...prev, day]; // Select the day
      }
    });
  };
  

  return (
    <div>
      <h2>Assign Workouts to Calendar</h2>
      <Calendar
        onChange={handleDateChange}
        value={selectedDate}
        onClickDay={handleDayDoubleClick} // Handle double-click event
        tileClassName={({ date }) => {
          const day = date.toISOString().split('T')[0]; // Get the date in the format 'YYYY-MM-DD'
          if (selectedDays.includes(day)) {
            return 'selected'; // Add 'selected' class if the day is selected
          }
          const workoutsForThisDay = getWorkoutsForDate(day);
          return workoutsForThisDay.length > 0 ? 'highlight' : ''; // Highlight days with workouts
        }}
        
      />

      <h3>Workouts for {selectedDate.toDateString()}</h3>
      <ul>
        {workoutsForToday.map((workout, index) => (
          <li key={index}>
            {workout.workoutName} ({workout.workoutType || 'No Type'})
          </li>
        ))}
      </ul>

      <h3>Select Workouts to Assign</h3>
      {savedWorkouts.map((workout, index) => (
        <div key={index}>
          <input
            type="checkbox"
            onChange={() => handleWorkoutSelection(workout)}
          />
          <span>{workout.workoutName}</span>
        </div>
      ))}

      <h3>Selected Days to Assign Workouts</h3>
      <ul>
        {selectedDays.map((day, index) => (
          <li key={index}>{new Date(day).toDateString()}</li>
        ))}
      </ul>

      <button onClick={handleAssignWorkoutsToDays}>
        Assign Workouts to Selected Days
      </button>
    </div>
  );
};

export default CalendarComponent;
