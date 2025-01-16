import React, { useState, useEffect } from 'react';
import { getWorkoutForToday, saveWorkouts } from '../utils/localStorage';
import { Workout } from '../utils/types';
import HomeButton from '../components/HomeButton';

const StartProgrammedLiftPage: React.FC = () => {
  const [workoutToday, setWorkoutToday] = useState<Workout | null>(null);
  const [userLog, setUserLog] = useState<Record<string, { weight: number; reps: number; rir: number }[]>>({});
  
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const workout = getWorkoutForToday(today);
    setWorkoutToday(workout);
  }, []);

  const handleInputChange = (exerciseName: string, setIndex: number, field: string, value: string | number) => {
    setUserLog((prev) => ({
      ...prev,
      [exerciseName]: prev[exerciseName]
        ? prev[exerciseName].map((set, idx) => (idx === setIndex ? { ...set, [field]: value } : set))
        : [{ weight: 0, reps: 0, rir: 0 }]
    }));
  };

  const handleSaveWorkout = () => {
    if (workoutToday) {
      const updatedWorkout = {
        ...workoutToday,
        exercises: workoutToday.exercises.map((exercise) => ({
          ...exercise,
          userSets: userLog[exercise.name] || []
        }))
      };
      const allWorkouts = [...(JSON.parse(localStorage.getItem('workouts') || '[]') as Workout[]), updatedWorkout];
      saveWorkouts(allWorkouts);
      alert('Workout saved!');
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <h2>Today's Programmed Lift</h2>
      {workoutToday ? (
        <div>
          <p>Workout Name: {workoutToday.workoutName}</p>
          <p>Workout Type: {workoutToday.workoutType || 'No Type'}</p>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {workoutToday.exercises.map((exercise, index) => (
              <li key={index} style={{ marginBottom: '1rem' }}>
                <strong>{exercise.name}</strong> - Sets: {exercise.sets}, Reps: {exercise.reps}, RIR: {exercise.rir}
                <div>
                  {[...Array(exercise.sets)].map((_, setIndex) => (
                    <div key={setIndex} style={{ marginTop: '0.5rem' }}>
                      <label>Set {setIndex + 1}:</label>
                      <input
                        type="number"
                        placeholder="Weight"
                        value={userLog[exercise.name]?.[setIndex]?.weight || ''}
                        onChange={(e) => handleInputChange(exercise.name, setIndex, 'weight', +e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="Reps"
                        value={userLog[exercise.name]?.[setIndex]?.reps || ''}
                        onChange={(e) => handleInputChange(exercise.name, setIndex, 'reps', +e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="RIR"
                        value={userLog[exercise.name]?.[setIndex]?.rir || ''}
                        onChange={(e) => handleInputChange(exercise.name, setIndex, 'rir', +e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
          <button
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#6200ea',
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              marginRight: '1rem',
            }}
            onClick={handleSaveWorkout}
          >
            Save Workout
          </button>
          <HomeButton />
        </div>
      ) : (
        <p>No programmed workout found for today.</p>
      )}
    </div>
  );
};

export default StartProgrammedLiftPage;
