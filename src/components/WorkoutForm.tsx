import React, { useState } from 'react';
import { saveWorkouts, loadWorkouts } from '../utils/localStorage';
import { Workout, Exercise } from '../utils/types';

const WorkoutForm: React.FC = () => {
  const [workoutName, setWorkoutName] = useState<string>('');
  const [workoutType, setWorkoutType] = useState<string>('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exerciseName, setExerciseName] = useState<string>('');
  const [sets, setSets] = useState<number>(1);
  const [reps, setReps] = useState<string>('10');
  const [rir, setRir] = useState<number>(2);
  const [search, setSearch] = useState<string>('');

  const handleAddExercise = () => {
    const newExercise: Exercise = { name: exerciseName, sets, reps, rir };
    setExercises([...exercises, newExercise]);
    setExerciseName('');
    setSets(1);
    setReps('10');
    setRir(2);
  };

  const handleSaveWorkout = () => {
    const newWorkout: Workout = {
      workoutName,
      workoutType,
      exercises,
      assignedDays: []
    };
    const savedWorkouts = [...loadWorkouts(), newWorkout];
    saveWorkouts(savedWorkouts);
    setWorkoutName('');
    setWorkoutType('');
    setExercises([]);
  };

  const filteredWorkouts = loadWorkouts().filter(workout =>
    workout.workoutName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h3>Create a New Workout</h3>
      <input
        type="text"
        placeholder="Workout Name"
        value={workoutName}
        onChange={(e) => setWorkoutName(e.target.value)}
      />
      <input
        type="text"
        placeholder="Workout Type (e.g., Push)"
        value={workoutType}
        onChange={(e) => setWorkoutType(e.target.value)}
      />
      
      <h4>Exercises</h4>
      <input
        type="text"
        placeholder="Exercise Name"
        value={exerciseName}
        onChange={(e) => setExerciseName(e.target.value)}
      />
      <input
        type="number"
        value={sets}
        onChange={(e) => setSets(Number(e.target.value))}
        placeholder="Sets"
      />
      <input
        type="text"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        placeholder="Reps"
      />
      <input
        type="number"
        value={rir}
        onChange={(e) => setRir(Number(e.target.value))}
        placeholder="RIR"
      />
      <button onClick={handleAddExercise}>Add Exercise</button>

      <div>
        {exercises.map((exercise, index) => (
          <p key={index}>
            {exercise.name} - {exercise.sets} sets x {exercise.reps} reps, RIR: {exercise.rir}
          </p>
        ))}
      </div>

      <button onClick={handleSaveWorkout}>Save Workout</button>

      <h4>Saved Workouts</h4>
      <input
        type="text"
        placeholder="Search workouts"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <ul>
        {filteredWorkouts.map((workout, index) => (
          <li key={index}>
            {workout.workoutName} ({workout.workoutType})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default WorkoutForm;
