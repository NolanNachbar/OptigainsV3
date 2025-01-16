import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Workout } from '../utils/types';
import { assignWorkoutToDate, getWorkoutsForDate } from '../utils/localStorage';
import '../styles/CalendarComponent.css';

interface CalendarProps {
  savedWorkouts: Workout[];
}

const CalendarComponent: React.FC<CalendarProps> = ({ savedWorkouts }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedWorkouts, setSelectedWorkouts] = useState<Workout[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [assignedDays, setAssignedDays] = useState<Record<string, boolean>>({});

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handleWorkoutSelection = (workout: Workout) => {
    setSelectedWorkouts(prev =>
      prev.includes(workout)
        ? prev.filter(w => w !== workout)
        : [...prev, workout]
    );
  };

  const handleDaySelection = (date: Date) => {
    const day = date.toISOString().split('T')[0];
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleAssignWorkoutsToDays = () => {
    const newAssignedDays = { ...assignedDays };

    selectedDays.forEach(day => {
      selectedWorkouts.forEach(workout => {
        assignWorkoutToDate(workout.workoutName, day);
      });
      newAssignedDays[day] = true; // Mark day as assigned
    });

    setAssignedDays(newAssignedDays);
    setSelectedDays([]); // Reset selected days
    alert(`Workouts assigned to selected days: ${selectedDays.join(', ')}`);
  };

  const workoutsForToday = getWorkoutsForDate(selectedDate.toISOString().split('T')[0]);

  return (
    <div>
      <h2>Assign Workouts to Calendar</h2>
      <Calendar
        onChange={() => handleDateChange}
        value={selectedDate}
        onClickDay={handleDaySelection}
        tileClassName={({ date }) => {
          const day = date.toISOString().split('T')[0];
          if (selectedDays.includes(day)) return 'react-calendar__tile--highlight';
          if (assignedDays[day]) return 'react-calendar__tile--dot';
          return '';
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
            checked={selectedWorkouts.includes(workout)}
            onChange={() => handleWorkoutSelection(workout)}
          />
          <span>{workout.workoutName}</span>
        </div>
      ))}

      {selectedWorkouts.length > 0 && (
        <>
          <h3>Selected Days to Assign Workouts</h3>
          <ul>
            {selectedDays.map((day, index) => (
              <li key={index}>{new Date(day).toDateString()}</li>
            ))}
          </ul>

          <button onClick={handleAssignWorkoutsToDays}>
            Assign Workouts to Selected Days
          </button>
        </>
      )}
    </div>
  );
};

export default CalendarComponent;
