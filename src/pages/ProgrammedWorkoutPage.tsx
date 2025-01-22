import React, { useState, useEffect } from 'react';
import { getWorkoutForToday, saveWorkouts, calculateNextWeight, loadWorkouts } from '../utils/localStorage';
import { Workout, Set } from '../utils/types';
import HomeButton from '../components/HomeButton';

const normalizeExerciseName = (name: string) => name.toUpperCase();

const StartProgrammedLiftPage: React.FC = () => {
  const [workoutToday, setWorkoutToday] = useState<Workout | null>(null);
  const [userLog, setUserLog] = useState<Record<string, Set[]>>({});

  // Load today's workout on component mount
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const workout = getWorkoutForToday(today);
    setWorkoutToday(workout);
  }, []);

  const handleInputChange = (exerciseName: string, setIndex: number, field: keyof Set, value: number) => {
    setUserLog((prev) => ({
      ...prev,
      [exerciseName]: prev[exerciseName]
        ? prev[exerciseName].map((set, idx) => 
            idx === setIndex ? { ...set, [field]: value } : set)
        : Array.from({ length: workoutToday?.exercises.find(ex => ex.name === exerciseName)?.sets.length || 1 }, () => ({
            weight: 0,
            reps: 0,
            rir: 0,
          })),
    }));
  };

  const handleCalculateWeight = (exerciseName: string, setIndex: number) => {
    const reps = userLog[exerciseName]?.[setIndex]?.reps || 0;
    const rir = userLog[exerciseName]?.[setIndex]?.rir || 0;

    if (workoutToday) {
      const exercise = workoutToday.exercises.find((ex) => normalizeExerciseName(ex.name) === normalizeExerciseName(exerciseName));
      if (exercise) {
        const recommendedWeight = calculateNextWeight(exercise, reps, rir);
        handleInputChange(exerciseName, setIndex, 'weight', recommendedWeight);
      } else {
        alert('Exercise not found in today’s workout.');
      }
    }
  };

  const handleSaveWorkout = () => {
    if (workoutToday) {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if the workout already exists in localStorage
      const existingWorkouts = loadWorkouts();
      const existingWorkoutIndex = existingWorkouts.findIndex(workout => workout.workoutName === workoutToday.workoutName);
  
      const updatedWorkout: Workout = {
        ...workoutToday,
        exercises: workoutToday.exercises.map((exercise) => ({
          ...exercise,
          sets: userLog[exercise.name] || exercise.sets,
          logs: (userLog[exercise.name] || []).map((set) => ({
            ...set,
            date: today,
          })),
        })),
      };
  
      if (existingWorkoutIndex !== -1) {
        // If workout already exists, update it
        existingWorkouts[existingWorkoutIndex] = updatedWorkout;
      } else {
        // If workout doesn't exist, add it as a new workout
        existingWorkouts.push(updatedWorkout);
      }
  
      // Save updated workouts
      saveWorkouts(existingWorkouts);
      alert('Workout saved successfully!');
    } else {
      alert('No workout to save.');
    }
  };
  
  

  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <h2>Programmed Lift</h2>

      {workoutToday ? (
        workoutToday.exercises.map((exercise) => (
          <div key={exercise.name} style={{ marginBottom: '2rem' }}>
            <h3>{exercise.name}</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {exercise.sets.map((set, index) => (
                <li key={index} style={{ marginBottom: '1rem' }}>
                  <div>
                    <label>
                      Weight (lbs):
                      <input
                        type="number"
                        value={userLog[exercise.name]?.[index]?.weight || set.weight || ''}
                        onChange={(e) =>
                          handleInputChange(
                            exercise.name,
                            index,
                            'weight',
                            Number(e.target.value)
                          )
                        }
                        style={{
                          margin: '0.5rem',
                          padding: '0.5rem',
                          width: '70px',
                          textAlign: 'center',
                        }}
                      />
                    </label>
                    <label>
                      Reps:
                      <input
                        type="number"
                        value={userLog[exercise.name]?.[index]?.reps || set.reps || ''}
                        onChange={(e) =>
                          handleInputChange(
                            exercise.name,
                            index,
                            'reps',
                            Number(e.target.value)
                          )
                        }
                        style={{
                          margin: '0.5rem',
                          padding: '0.5rem',
                          width: '50px',
                          textAlign: 'center',
                        }}
                      />
                    </label>
                    <label>
                      RIR:
                      <input
                        type="number"
                        value={userLog[exercise.name]?.[index]?.rir || set.rir || ''}
                        onChange={(e) =>
                          handleInputChange(
                            exercise.name,
                            index,
                            'rir',
                            Number(e.target.value)
                          )
                        }
                        style={{
                          margin: '0.5rem',
                          padding: '0.5rem',
                          width: '50px',
                          textAlign: 'center',
                        }}
                      />
                    </label>
                    <button
                      onClick={() => handleCalculateWeight(exercise.name, index)}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#4CAF50',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '5px',
                        marginLeft: '1rem',
                      }}
                    >
                      Calculate Weight
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))
      ) : (
        <p>No workout assigned for today.</p>
      )}

      <button
        onClick={handleSaveWorkout}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#6200ea',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          marginTop: '2rem',
        }}
      >
        Save Workout
      </button>

      <HomeButton />
    </div>
  );
};

export default StartProgrammedLiftPage;
