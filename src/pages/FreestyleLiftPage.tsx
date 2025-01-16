import React, { useState, useEffect } from 'react';
//import { saveAs } from 'file-saver';
import { saveWorkouts, loadWorkouts } from '../utils/localStorage';
import { Workout } from '../utils/types';
import HomeButton from '../components/HomeButton';

type Set = {
  weight: number;
  reps: number;
  rir: number;
};

type Exercise = {
  name: string;
  sets: Set[];
};

const FreestyleLiftPage: React.FC = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentExercise, setCurrentExercise] = useState('');
  const [weight, setWeight] = useState<number | ''>('');
  const [reps, setReps] = useState<number | ''>('');
  const [rir, setRir] = useState<number | ''>('');
  const [workoutName, setWorkoutName] = useState('');

  useEffect(() => {
    const savedExercises = localStorage.getItem('freestyleExercises');
    if (savedExercises) {
      setExercises(JSON.parse(savedExercises));
    }
  }, []);

  const handleAddExercise = () => {
    if (currentExercise.trim() && !exercises.find((e) => e.name === currentExercise.trim())) {
      setExercises([...exercises, { name: currentExercise.trim(), sets: [] }]);
      setCurrentExercise('');
    }
  };

  const handleAddSet = (exerciseName: string) => {
    if (weight !== '' && reps !== '' && rir !== '') {
      const updatedExercises = exercises.map((exercise) => {
        if (exercise.name === exerciseName) {
          return {
            ...exercise,
            sets: [...exercise.sets, { weight: Number(weight), reps: Number(reps), rir: Number(rir) }],
          };
        }
        return exercise;
      });
      setExercises(updatedExercises);
      setWeight('');
      setReps('');
      setRir('');
    }
  };

  const handleSaveWorkout = () => {
    if (workoutName.trim()) {
      const workoutData: Workout = {
        workoutName: workoutName.trim(),
        workoutType: 'Freestyle', // Or another type if applicable
        exercises: exercises.map((exercise) => ({
          name: exercise.name,
          sets: exercise.sets.length,
          reps: exercise.sets.map((set) => `${set.reps}`).join(', '),
          rir: exercise.sets.reduce((acc, set) => acc + set.rir, 0) / (exercise.sets.length || 1),
        })),
        assignedDays: [],
      };
  
      // Save the workout to localStorage
      const savedWorkouts = [...loadWorkouts(), workoutData];
      saveWorkouts(savedWorkouts);
  
      // Reset state after saving
      setExercises([]);
      setWorkoutName('');
      alert('Workout saved successfully and added to Planned Workouts!');
    } else {
      alert('Please enter a workout name.');
    }
  };
  
  

  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <h2>Freestyle Lift</h2>

      <div style={{ marginBottom: '2rem' }}>
        <input
          type="text"
          placeholder="Enter new exercise"
          value={currentExercise}
          onChange={(e) => setCurrentExercise(e.target.value)}
          style={{
            padding: '0.5rem',
            border: '1px solid #ddd',
            borderRadius: '5px',
            width: '70%',
            marginBottom: '1rem',
          }}
        />
        <button
          onClick={handleAddExercise}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#6200ea',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
          }}
        >
          Add Exercise
        </button>
      </div>

      {exercises.map((exercise) => (
        <div key={exercise.name} style={{ marginBottom: '2rem' }}>
          <h3>{exercise.name}</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {exercise.sets.map((set, index) => (
              <li key={index}>
                Weight: {set.weight} lbs, Reps: {set.reps}, RIR: {set.rir}
              </li>
            ))}
          </ul>
          <div>
            <input
              type="number"
              placeholder="Weight (lbs)"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              style={{
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '5px',
                width: '20%',
                marginRight: '0.5rem',
              }}
            />
            <input
              type="number"
              placeholder="Reps"
              value={reps}
              onChange={(e) => setReps(Number(e.target.value))}
              style={{
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '5px',
                width: '20%',
                marginRight: '0.5rem',
              }}
            />
            <input
              type="number"
              placeholder="RIR"
              value={rir}
              onChange={(e) => setRir(Number(e.target.value))}
              style={{
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '5px',
                width: '20%',
                marginRight: '0.5rem',
              }}
            />
            <button
              onClick={() => handleAddSet(exercise.name)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#6200ea',
                color: '#fff',
                border: 'none',
                borderRadius: '5px',
              }}
            >
              Add Set
            </button>
          </div>
        </div>
      ))}

      <div style={{ marginTop: '2rem' }}>
        <input
          type="text"
          placeholder="Enter workout name"
          value={workoutName}
          onChange={(e) => setWorkoutName(e.target.value)}
          style={{
            padding: '0.5rem',
            border: '1px solid #ddd',
            borderRadius: '5px',
            width: '70%',
            marginBottom: '1rem',
          }}
        />
        <button
          onClick={handleSaveWorkout}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#6200ea',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
          }}
        >
          Save/End Workout
        </button>
        <HomeButton/>
      </div>
    </div>
  );
};

export default FreestyleLiftPage;
