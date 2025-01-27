import React, { useState, useEffect} from 'react';
import { 
  saveWorkouts, 
  calculateNextWeight, 
  loadWorkouts, 
  removeWorkoutFromList
} from '../utils/localStorage';
import { Workout, Exercise, Set } from '../utils/types';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

const normalizeExerciseName = (name: string) => name.toUpperCase();

interface EditProps {
    savedWorkout: Workout;
    onUpdateWorkout: (updatedWorkout: Workout) => void;
  }

  const EditWorkoutComponent: React.FC<EditProps> = ({ savedWorkout, onUpdateWorkout }) => {
    const [workout, setWorkout] = useState<Workout | null>(savedWorkout);
    const [userLog, setUserLog] = useState<Record<string, Set[]>>({});
    const [editing, setEditing] = useState(true);
    const [exerciseName, setExerciseName] = useState<string>('');
    const [sets, setSets] = useState<{ weight: number; reps: number; rir: number }[]>([{ weight: 1, reps: 10, rir: 2 }]);
    const [isModalOpen, setIsModalOpen] = useState(false);
  
    useEffect(() => {
      setWorkout(savedWorkout);
    }, [savedWorkout]);
 
  const handleReorderExercises = (result: DropResult) => {
    const { source, destination } = result;

    // If there is no destination, just return
    if (!destination) return;

    // Reorder the exercises array
    const reorderedExercises = Array.from(workout?.exercises || []);
    const [removed] = reorderedExercises.splice(source.index, 1);
    reorderedExercises.splice(destination.index, 0, removed);

    // Update the workout with the reordered exercises
    setWorkout({
      ...workout!,
      exercises: reorderedExercises,
    });
  };

  const handleAddExercise = () => {
    if (exerciseName && sets.every(set => set.weight > 0 && set.reps > 0 && set.rir > 0)) {
      const newExercise: Exercise = {
        name: exerciseName,
        sets,
        rir: sets[0].rir,
        logs: [],
      };

      const updatedWorkout = {
        ...workout!,
        exercises: [...workout?.exercises || [], newExercise],
      };

      setWorkout(updatedWorkout);
      onUpdateWorkout(updatedWorkout); // Call the callback to update the parent
      setExerciseName('');
      setSets([{ weight: 1, reps: 10, rir: 2 }]);

      // Save to localStorage
      const workouts = loadWorkouts();
      removeWorkoutFromList(updatedWorkout.workoutName);
      workouts.push(updatedWorkout);
      saveWorkouts(workouts);
    }
  };
  
  
  const handleInputChange = (exerciseName: string, setIndex: number, field: keyof Set, value: number) => {
    setUserLog((prev) => {
      const updatedLog = { ...prev };
      if (!updatedLog[exerciseName]) {
        updatedLog[exerciseName] = workout?.exercises.find((ex) => ex.name === exerciseName)?.sets.map(() => ({
          weight: 0,
          reps: 0,
          rir: 0,
        })) || [];
      }
  
      if (updatedLog[exerciseName][setIndex]) {
        updatedLog[exerciseName][setIndex][field] = value;
      }
  
      return updatedLog;
    });
  };
  
  

  const handleCalculateWeight = (exerciseName: string, setIndex: number) => {
    const reps = userLog[exerciseName]?.[setIndex]?.reps || 0;
    const rir = userLog[exerciseName]?.[setIndex]?.rir || 0;

    if (workout) {
      const exercise = workout.exercises.find(
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
    if (workout) {
      const updatedExercises = workout.exercises.filter(
        (exercise) => normalizeExerciseName(exercise.name) !== normalizeExerciseName(exerciseName)
      );
  
      const updatedWorkout = { ...workout, exercises: updatedExercises };
      setWorkout(updatedWorkout);

    // Remove the existing workout if it already exists
    removeWorkoutFromList(updatedWorkout.workoutName);

    // Add the updated workout to the workouts array
    handleSaveWorkout();
    }
  };
  
  const handleRemoveSet = (exerciseName: string, setIndex: number) => {
    if (workout) {
      // Create a copy of the exercises array to avoid mutation
      const updatedExercises = [...workout.exercises];
      const targetExercise = updatedExercises.find(
        (exercise) => normalizeExerciseName(exercise.name) === normalizeExerciseName(exerciseName)
      );
  
      if (targetExercise) {
        // Remove the set at the specified index from the target exercise
        targetExercise.sets.splice(setIndex, 1);
  
        // Update the workout state with the modified exercises array
        setWorkout({
          ...workout,
          exercises: updatedExercises,
        });
  
        // Update the userLog state as well
        setUserLog((prevLog) => ({
          ...prevLog,
          [exerciseName]: prevLog[exerciseName]?.filter((_, idx) => idx !== setIndex),
        }));
      } else {
        console.error('Exercise not found in the workout');
      }
    }
  };

  const handleSaveWorkout = () => {
    if (workout) {
      const today = new Date().toISOString().split('T')[0];
  
      // Update the exercises with the user log
      const updatedWorkout: Workout = {
        ...workout,
        exercises: workout.exercises.map((exercise) => ({
          ...exercise,
          sets: userLog[exercise.name] || exercise.sets,
          logs: (userLog[exercise.name] || []).map((set) => ({
            ...set,
            date: today,
          })),
        })),
      };
  
      // Load existing workouts
      const workouts = loadWorkouts();
  
      // Find and update the existing workout instead of removing it
      const workoutIndex = workouts.findIndex(
        (w) => w.workoutName === updatedWorkout.workoutName
      );
  
      if (workoutIndex !== -1) {
        workouts[workoutIndex] = updatedWorkout; // Update the existing workout
      } else {
        workouts.push(updatedWorkout); // Add new workout if not found
      }
  
      // Save updated workouts back to localStorage
      saveWorkouts(workouts);
    } else {
      alert('No workout to save.');
    }
  };
  
  
  
  const handleAddSet = (exerciseName: string) => {
    if (workout) {
      const updatedExercises = [...workout.exercises];
      const targetExercise = updatedExercises.find(
        (exercise) => normalizeExerciseName(exercise.name) === normalizeExerciseName(exerciseName)
      );
  
      if (targetExercise) {
        targetExercise.sets.push({ weight: 1, reps: 10, rir: 0 });
  
        setWorkout({ ...workout, exercises: updatedExercises });
  
        setUserLog((prevLog) => {
          const updatedLog = { ...prevLog };
          if (!updatedLog[exerciseName]) {
            updatedLog[exerciseName] = [];
          }
          updatedLog[exerciseName].push({ weight: 1, reps: 10, rir: 0 });
          return updatedLog;
        });
      }
    }
  };
  
  

  return (
    <div className="container">
        <>
          <DragDropContext onDragEnd={handleReorderExercises}>
  {!editing ? (
    <Droppable droppableId="exercises">
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className="exercise-list"
        >
          {workout?.exercises.map((exercise, index) => (
            <Draggable key={exercise.name} draggableId={exercise.name} index={index}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  className="exercise-card"
                >
                  <h3>{exercise.name}</h3>
                  <ul className="set-list">
                    {exercise.sets.map((set, setIndex) => (
                      <li key={setIndex} className="set-item">
                        <div className="set-inputs">
                          <input
                            type="number"
                            value={userLog[exercise.name]?.[setIndex]?.weight || set.weight || ''}
                            onChange={(e) =>
                              handleInputChange(exercise.name, setIndex, 'weight', Number(e.target.value))
                            }
                            placeholder="Weight"
                            className="input-field"
                          />
                          <input
                            type="number"
                            value={userLog[exercise.name]?.[setIndex]?.reps || set.reps || ''}
                            onChange={(e) =>
                              handleInputChange(exercise.name, setIndex, 'reps', Number(e.target.value))
                            }
                            placeholder="Reps"
                            className="input-field"
                          />
                          <input
                            type="number"
                            value={userLog[exercise.name]?.[setIndex]?.rir || set.rir || 0}
                            onChange={(e) =>
                              handleInputChange(exercise.name, setIndex, 'rir', Number(e.target.value))
                            }
                            placeholder="RIR"
                            className="input-field"
                          />
                        </div>
                        <div className="button-group">
                        {exercise.logs && exercise.logs.length > 1 && (
                          <button
                            onClick={() => handleCalculateWeight(exercise.name, setIndex)}
                            className="calculate-btn"
                          >
                            Calculate Weight
                          </button>
                        )}

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
                  <button
                              onClick={() => handleAddSet(exercise.name)}
                              className="add-set-btn"
                            >
                              Add Set
                            </button>
                </div>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  ): (
    // When not editing, just display exercises without drag-and-drop
    savedWorkout.exercises.map((exercise) => (
      <div key={exercise.name} className="exercise-card">
        <h3>{exercise.name}</h3>
        <ul className="set-list">
          {exercise.sets.map((set, setIndex) => (
            <li key={setIndex} className="set-item">
              <div className="set-inputs">
                <input
                  type="number"
                  value={userLog[exercise.name]?.[setIndex]?.weight || set.weight || ''}
                  onChange={(e) =>
                    handleInputChange(exercise.name, setIndex, 'weight', Number(e.target.value))
                  }
                  placeholder="Weight"
                  className="input-field"
                />
                <input
                  type="number"
                  value={userLog[exercise.name]?.[setIndex]?.reps || set.reps || ''}
                  onChange={(e) =>
                    handleInputChange(exercise.name, setIndex, 'reps', Number(e.target.value))
                  }
                  placeholder="Reps"
                  className="input-field"
                />
                <input
                  type="number"
                  value={userLog[exercise.name]?.[setIndex]?.rir || set.rir || 0}
                  onChange={(e) =>
                    handleInputChange(exercise.name, setIndex, 'rir', Number(e.target.value))
                  }
                  placeholder="RIR"
                  className="input-field"
                />
              <div className="button-group">
              {exercise.logs && exercise.logs.length > 0 && (
                <button
                  onClick={() =>  {alert('Calc button clicked');
                    handleCalculateWeight(exercise.name, setIndex)}}
                  className="calculate-btn"
                >
                  Calculate Weight
                </button>
              )}

                <button
                  onClick={() => handleRemoveSet(exercise.name, setIndex)}
                  className="remove-btn"
                >
                  Remove Set
                </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <button
          onClick={() => handleRemoveExercise(exercise.name)}
          className="remove-exercise-btn"
        >
          Remove Exercise
        </button>
        <button
            onClick={() => handleAddSet(exercise.name)}
            className="add-set-btn"
          >
            Add Set
        </button>
      </div>
    ))
  )
  }
</DragDropContext>


          <div className="action-buttons">
            <button onClick={() => setIsModalOpen(true)} className="action-btn">Add Exercise</button>
            <button onClick={() => {if (workout) {saveWorkouts([workout])}; setEditing((editing) => !editing)}} className="action-btn">
  {editing ?  'Rearrange Exercises':'Finish Rearranging' }
</button>

          </div>
        </>

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
          <button onClick={() => setSets([...sets, { weight: 1, reps: 10, rir: 0 }])} className="add-set-btn">
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
export default EditWorkoutComponent;