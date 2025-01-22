import React, { useState, useEffect } from 'react';
import { 
  getWorkoutForToday, 
  saveWorkouts, 
  calculateNextWeight, 
  loadWorkouts, 
  removeExerciseFromWorkout, 
} from '../utils/localStorage';
import { Workout, Exercise, Set } from '../utils/types';
import ActionBar from '../components/Actionbar';

const normalizeExerciseName = (name: string) => name.toUpperCase();

const StartProgrammedLiftPage: React.FC = () => {
  const [workoutToday, setWorkoutToday] = useState<Workout | null>(null);
  const [userLog, setUserLog] = useState<Record<string, Set[]>>({});
  const [editing, setEditing] = useState(false);
  const [exerciseName, setExerciseName] = useState<string>('');
  const [sets, setSets] = useState<{ weight: number; reps: number; rir: number }[]>([{ weight: 1, reps: 10, rir: 2 }]); // Changed to hold an array of sets
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const workout = getWorkoutForToday(today);
    setWorkoutToday(workout);
  }, []);

  const handleAddExercise = () => {
    if (exerciseName && sets.every(set => set.weight > 0 && set.reps > 0 && set.rir > 0)) {
      const newExercise: Exercise = {
        name: exerciseName,
        sets: sets,
        rir: sets[0].rir, 
        logs: [{ date: new Date().toISOString(), weight: sets[0].weight, reps: sets[0].reps, rir: sets[0].rir }],
      };
  
      if (workoutToday) {
        const updatedWorkout = {
          ...workoutToday,
          exercises: [...workoutToday.exercises, newExercise], // Add the new exercise
        };
  
        setWorkoutToday(updatedWorkout); // Update the state with the new workout
        setExerciseName(''); 
        setSets([{ weight: 1, reps: 10, rir: 2 }]);
        setIsModalOpen(false); // Close the modal after adding the exercise
        alert('Exercise added successfully!');
      }
    } else {
      alert('Please fill all fields with valid values.');
    }
  };
  
  const handleInputChange = (exerciseName: string, setIndex: number, field: keyof Set, value: number) => {
    setUserLog((prev) => ({
      ...prev,
      [exerciseName]: prev[exerciseName]
        ? prev[exerciseName].map((set, idx) =>
            idx === setIndex ? { ...set, [field]: value } : set
          )
        : Array.from({ length: workoutToday?.exercises.find((ex) => ex.name === exerciseName)?.sets.length || 1 }, () => ({
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
      const exercise = workoutToday.exercises.find(
        (ex) => normalizeExerciseName(ex.name) === normalizeExerciseName(exerciseName)
      );
      if (exercise) {
        const recommendedWeight = calculateNextWeight(exercise, reps, rir);
        handleInputChange(exerciseName, setIndex, 'weight', recommendedWeight);
      } else {
        alert('Exercise not found in today’s workout.');
      }
    }
  };

  const handleRemoveExercise = (exerciseName: string) => {
    if (workoutToday) {
      removeExerciseFromWorkout(workoutToday.workoutName, exerciseName);
      setWorkoutToday(loadWorkouts().find((w) => w.workoutName === workoutToday.workoutName) || null);
    }
  };

  const handleRemoveSet = (exerciseName: string, setIndex: number) => {
    if (workoutToday) {
      const updatedExercises = workoutToday.exercises.map((exercise) => {
        if (normalizeExerciseName(exercise.name) === normalizeExerciseName(exerciseName)) {
          return {
            ...exercise,
            sets: exercise.sets.filter((_, idx) => idx !== setIndex),
          };
        }
        return exercise;
      });
  
      setWorkoutToday({
        ...workoutToday,
        exercises: updatedExercises,
      });
  
      // Update the log state as well
      setUserLog((prevLog) => ({
        ...prevLog,
        [exerciseName]: prevLog[exerciseName]?.filter((_, idx) => idx !== setIndex),
      }));
    }
  };
  


  const handleSaveWorkout = () => {
    if (workoutToday) {
      const today = new Date().toISOString().split('T')[0];
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

      const workouts = loadWorkouts();
      const workoutIndex = workouts.findIndex((workout) => workout.workoutName === workoutToday.workoutName);

      if (workoutIndex !== -1) {
        workouts[workoutIndex] = updatedWorkout;
      } else {
        workouts.push(updatedWorkout);
      }

      saveWorkouts(workouts);
      alert('Workout saved successfully!');
    } else {
      alert('No workout to save.');
    }
  };

  return (
  <div className="container">
    <ActionBar/>
    <h1>Today's Workout</h1>
    {workoutToday ? (
      <>
        <h2>{workoutToday.workoutName}</h2>
        <div className="exercise-list">
          {workoutToday.exercises.map((exercise, index) => (
            <div key={index} className="exercise-card">
              <h3>{exercise.name}</h3>
              <ul className="set-list">
                {exercise.sets.map((set, setIndex) => (
                  <li key={setIndex} className="set-item">
                    <div className="set-inputs">
                      <input
                        type="number"
                        value={userLog[exercise.name]?.[setIndex]?.weight || set.weight || ''}
                        onChange={(e) => handleInputChange(exercise.name, setIndex, 'weight', Number(e.target.value))}
                        placeholder="Weight"
                        className="input-field"
                      />
                      <input
                        type="number"
                        value={userLog[exercise.name]?.[setIndex]?.reps || set.reps || ''}
                        onChange={(e) => handleInputChange(exercise.name, setIndex, 'reps', Number(e.target.value))}
                        placeholder="Reps"
                        className="input-field"
                      />
                      <input
                        type="number"
                        value={userLog[exercise.name]?.[setIndex]?.rir || set.rir || ''}
                        onChange={(e) => handleInputChange(exercise.name, setIndex, 'rir', Number(e.target.value))}
                        placeholder="RIR"
                        className="input-field"
                      />
                    </div>
                    <div className="button-group">
                      <button
                        onClick={() => handleCalculateWeight(exercise.name, setIndex)}
                        className="calculate-btn"
                      >
                        Calculate Weight
                      </button>
                      <button
                        onClick={() => handleRemoveSet(exercise.name, setIndex)}
                        className="remove-btn"
                      >
                        Remove Set
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <button onClick={() => handleRemoveExercise(exercise.name)} className="remove-exercise-btn">
                Remove Exercise
              </button>
            </div>
          ))}
        </div>

        <div className="action-buttons">
          <button onClick={() => setIsModalOpen(true)} className="action-btn">Add Exercise</button>
          <button onClick={() => setEditing(!editing)} className="action-btn">Rearrange Exercises</button>
        </div>
      </>
    ) : (
      <p>No workout for today.</p>
    )}

    {/* Modal for Adding Exercise */}
    {isModalOpen && (
      <div className="modal-overlay">
        <div className="modal-content">
          <h2>Add Exercise</h2>
          <div>
            <label>Exercise Name: </label>
            <input
              type="text"
              value={exerciseName}
              onChange={(e) => setExerciseName(e.target.value)}
              className="input-field"
            />
          </div>

          {/* Set Details */}
          {sets.map((set, index) => (
            <div key={index} className="set-input-group">
              <label>Set {index + 1} - Weight: </label>
              <input
                type="number"
                value={set.weight}
                onChange={(e) => {
                  const updatedSets = [...sets];
                  updatedSets[index].weight = Number(e.target.value);
                  setSets(updatedSets);
                }}
                className="input-field"
              />
              <label> Reps: </label>
              <input
                type="number"
                value={set.reps}
                onChange={(e) => {
                  const updatedSets = [...sets];
                  updatedSets[index].reps = Number(e.target.value);
                  setSets(updatedSets);
                }}
                className="input-field"
              />
              <label> RIR: </label>
              <input
                type="number"
                value={set.rir}
                onChange={(e) => {
                  const updatedSets = [...sets];
                  updatedSets[index].rir = Number(e.target.value);
                  setSets(updatedSets);
                }}
                className="input-field"
              />
            </div>
          ))}

          {/* Add Set Button */}
          <button onClick={() => setSets([...sets, { weight: 1, reps: 10, rir: 2 }])} className="add-set-btn">
            Add Set
          </button>

          {/* Add Exercise Button */}
          <button onClick={handleAddExercise} className="add-exercise-btn">Add Exercise</button>
          <button onClick={() => setIsModalOpen(false)} className="close-modal-btn">Close</button>
        </div>
      </div>
    )}

    <button onClick={handleSaveWorkout} className="save-btn">Save Workout</button>
  </div>
);
};
export default StartProgrammedLiftPage;
