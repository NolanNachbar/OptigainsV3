import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useDate } from "../contexts/DateContext";
import {
  getWorkoutForToday,
  calculateNextWeight,
  getLastExercisePerformance,
  getWorkoutInstanceForDate,
  saveWorkoutInstance,
  updateWorkoutInstance,
  saveExerciseLog,
} from "../utils/SupaBase";
import { Workout, Exercise, Set } from "../utils/types";
import ActionBar from "../components/Actionbar";
import "../styles/design-system.css";
import "../styles/components.css";
import "../styles/optimized-workout.css";

interface SetData {
  weight: string;
  reps: string;
  rir: string;
}

interface ExerciseHistory {
  weight: number;
  reps: number;
  rir: number;
  date: string;
  workoutName: string;
}

const OptimizedWorkoutPage: React.FC = () => {
  const { user } = useUser();
  const { currentDate } = useDate();
  const navigate = useNavigate();
  
  // Core state
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [workoutInstanceId, setWorkoutInstanceId] = useState<string | null>(null);
  const [inputState, setInputState] = useState<Record<string, SetData[]>>({});
  const [exerciseHistory, setExerciseHistory] = useState<Record<string, ExerciseHistory>>({});
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // UI state
  const [showPlateCalculator, setShowPlateCalculator] = useState(false);
  const [calculatorWeight, setCalculatorWeight] = useState("");
  const [showExerciseMenu, setShowExerciseMenu] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [completedSets, setCompletedSets] = useState(0);
  const [totalSets, setTotalSets] = useState(0);
  
  // Refs for input focus management
  const weightInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    fetchWorkout();
  }, [user, currentDate]);

  useEffect(() => {
    if (workout) {
      calculateProgress();
    }
  }, [workout, inputState]);

  const fetchWorkout = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const todayDate = currentDate.toISOString().split("T")[0];
      const todayWorkout = await getWorkoutForToday(null, todayDate, user);

      if (todayWorkout) {
        const instance = await getWorkoutInstanceForDate(user, todayDate);
        
        if (instance) {
          setWorkout(instance.workout_data as Workout);
          setWorkoutInstanceId(instance.id);
        } else {
          const freshWorkout = {
            ...todayWorkout,
            exercises: todayWorkout.exercises.map((ex: Exercise) => ({
              ...ex,
              sets: ex.sets.map((set: Set) => ({ ...set, isLogged: false })),
            })),
          };
          setWorkout(freshWorkout);
          
          const newInstance = await saveWorkoutInstance(user, freshWorkout, todayDate);
          setWorkoutInstanceId(newInstance.id);
        }

        // Initialize input state
        const initialInputState: Record<string, SetData[]> = {};
        todayWorkout.exercises.forEach((exercise: Exercise) => {
          initialInputState[exercise.name] = exercise.sets.map(() => ({
            weight: "",
            reps: "",
            rir: "",
          }));
        });
        setInputState(initialInputState);

        // Load exercise history
        const historyData: Record<string, ExerciseHistory> = {};
        for (const exercise of todayWorkout.exercises) {
          const lastPerformance = await getLastExercisePerformance(user, exercise.name);
          if (lastPerformance) {
            historyData[exercise.name] = lastPerformance;
          }
        }
        setExerciseHistory(historyData);
      }
    } catch (error) {
      console.error("Error fetching workout:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateProgress = () => {
    if (!workout) return;
    
    let total = 0;
    let completed = 0;
    
    workout.exercises.forEach((exercise) => {
      total += exercise.sets.length;
      completed += exercise.sets.filter(set => set.isLogged).length;
    });
    
    setTotalSets(total);
    setCompletedSets(completed);
  };

  const handleInputChange = (
    exerciseName: string,
    setIndex: number,
    field: keyof SetData,
    value: string
  ) => {
    setInputState(prev => ({
      ...prev,
      [exerciseName]: prev[exerciseName].map((set, idx) =>
        idx === setIndex ? { ...set, [field]: value } : set
      ),
    }));
  };

  const handleQuickFill = (exerciseName: string, setIndex: number) => {
    const history = exerciseHistory[exerciseName];
    if (!history) return;

    // Smart progression: add 2.5% to last weight or 2.5lbs minimum
    const lastWeight = history.weight;
    const increment = Math.max(lastWeight * 0.025, 2.5);
    const newWeight = Math.round((lastWeight + increment) * 2) / 2; // Round to nearest 0.5

    setInputState(prev => ({
      ...prev,
      [exerciseName]: prev[exerciseName].map((set, idx) =>
        idx === setIndex
          ? {
              weight: newWeight.toString(),
              reps: history.reps.toString(),
              rir: history.rir.toString(),
            }
          : set
      ),
    }));
  };

  const handleLogSet = async (exerciseName: string, setIndex: number) => {
    if (!workout || !user || !workoutInstanceId) return;

    const input = inputState[exerciseName]?.[setIndex];
    if (!input?.weight || !input?.reps || !input?.rir) {
      // Highlight empty fields
      return;
    }

    const weight = parseFloat(input.weight);
    const reps = parseInt(input.reps);
    const rir = parseInt(input.rir);

    // Update workout
    const updatedWorkout = {
      ...workout,
      exercises: workout.exercises.map((exercise) =>
        exercise.name === exerciseName
          ? {
              ...exercise,
              sets: exercise.sets.map((set, idx) =>
                idx === setIndex ? { weight, reps, rir, isLogged: true } : set
              ),
            }
          : exercise
      ),
    };

    setWorkout(updatedWorkout);

    try {
      await saveExerciseLog(user, workoutInstanceId, exerciseName, weight, reps, rir, setIndex);
      await updateWorkoutInstance(workoutInstanceId, updatedWorkout);
      
      // Auto-focus next set
      const nextSetIndex = setIndex + 1;
      const exercise = workout.exercises.find(ex => ex.name === exerciseName);
      if (exercise && nextSetIndex < exercise.sets.length) {
        const nextInputKey = `${exerciseName}-${nextSetIndex}-weight`;
        setTimeout(() => {
          weightInputRefs.current[nextInputKey]?.focus();
        }, 100);
      }
    } catch (error) {
      console.error("Error saving set:", error);
    }
  };

  const calculatePlates = (targetWeight: number) => {
    const barWeight = 45;
    const availablePlates = [45, 35, 25, 10, 5, 2.5];
    const remainingWeight = (targetWeight - barWeight) / 2;
    
    if (remainingWeight <= 0) return { plates: [], total: barWeight };
    
    const plates: number[] = [];
    let current = remainingWeight;
    
    for (const plate of availablePlates) {
      while (current >= plate) {
        plates.push(plate);
        current -= plate;
      }
    }
    
    return {
      plates,
      total: barWeight + plates.reduce((sum, p) => sum + p, 0) * 2,
    };
  };

  if (isLoading) {
    return (
      <div className="workout-page">
        <ActionBar />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading workout...</p>
        </div>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="workout-page">
        <ActionBar />
        <div className="empty-state">
          <h2>No Workout Today</h2>
          <p>Rest day or no workout scheduled</p>
          <div className="empty-actions">
            <button onClick={() => navigate("/workout-plan")} className="btn btn-primary">
              Schedule Workout
            </button>
            <button onClick={() => navigate("/freestyle-lift")} className="btn btn-secondary">
              Quick Workout
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentExercise = workout.exercises[currentExerciseIndex];
  const progressPercentage = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  return (
    <div className="workout-page">
      <ActionBar />
      
      {/* Workout Header */}
      <div className="workout-header">
        <h1 className="workout-title">{workout.workout_name}</h1>
        <div className="workout-progress">
          <div className="progress-stats">
            <span className="progress-text">{completedSets} / {totalSets} sets</span>
            <span className="progress-percentage">{Math.round(progressPercentage)}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progressPercentage}%` }} />
          </div>
        </div>
      </div>

      {/* Exercise Navigation */}
      <div className="exercise-nav">
        {workout.exercises.map((exercise, index) => (
          <button
            key={exercise.name}
            onClick={() => setCurrentExerciseIndex(index)}
            className={`exercise-nav-item ${
              index === currentExerciseIndex ? "active" : ""
            } ${
              exercise.sets.every(set => set.isLogged) ? "completed" : ""
            }`}
          >
            <span className="exercise-nav-number">{index + 1}</span>
            <span className="exercise-nav-name">{exercise.name}</span>
          </button>
        ))}
      </div>

      {/* Current Exercise */}
      <div className="exercise-container">
        <div className="exercise-info">
          <h2 className="exercise-name">{currentExercise.name}</h2>
          <div className="exercise-actions">
            <button
              onClick={() => setShowPlateCalculator(!showPlateCalculator)}
              className="btn btn-ghost btn-sm"
            >
              🏋️ Plates
            </button>
            <button
              onClick={() => {
                setSelectedExercise(currentExercise.name);
                setShowExerciseMenu(true);
              }}
              className="btn btn-ghost btn-sm"
            >
              ⋮
            </button>
          </div>
        </div>

        {/* Exercise History */}
        {exerciseHistory[currentExercise.name] && (
          <div className="exercise-history">
            <div className="history-label">Last time:</div>
            <div className="history-data">
              <span className="history-weight">{exerciseHistory[currentExercise.name].weight} lbs</span>
              <span className="history-reps">× {exerciseHistory[currentExercise.name].reps}</span>
              <span className="history-rir">@{exerciseHistory[currentExercise.name].rir} RIR</span>
            </div>
          </div>
        )}

        {/* Sets */}
        <div className="sets-container">
          {currentExercise.sets.map((set, setIndex) => {
            const inputData = inputState[currentExercise.name]?.[setIndex] || {
              weight: "",
              reps: "",
              rir: "",
            };

            return (
              <div
                key={setIndex}
                className={`set-card ${set.isLogged ? "logged" : ""}`}
              >
                <div className="set-header">
                  <span className="set-number">Set {setIndex + 1}</span>
                  {set.isLogged && <span className="set-check">✓</span>}
                </div>

                {set.isLogged ? (
                  <div className="set-logged-data">
                    <div className="set-data-item">
                      <div className="set-data-value">{set.weight}</div>
                      <div className="set-data-label">lbs</div>
                    </div>
                    <div className="set-data-item">
                      <div className="set-data-value">{set.reps}</div>
                      <div className="set-data-label">reps</div>
                    </div>
                    <div className="set-data-item">
                      <div className="set-data-value">{set.rir}</div>
                      <div className="set-data-label">RIR</div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="set-inputs">
                      <div className="set-input-group">
                        <input
                          ref={el => weightInputRefs.current[`${currentExercise.name}-${setIndex}-weight`] = el}
                          type="number"
                          inputMode="decimal"
                          placeholder="0"
                          value={inputData.weight}
                          onChange={(e) =>
                            handleInputChange(currentExercise.name, setIndex, "weight", e.target.value)
                          }
                          className="set-input"
                        />
                        <label className="set-input-label">Weight</label>
                      </div>
                      <div className="set-input-group">
                        <input
                          type="number"
                          inputMode="numeric"
                          placeholder="0"
                          value={inputData.reps}
                          onChange={(e) =>
                            handleInputChange(currentExercise.name, setIndex, "reps", e.target.value)
                          }
                          className="set-input"
                        />
                        <label className="set-input-label">Reps</label>
                      </div>
                      <div className="set-input-group">
                        <input
                          type="number"
                          inputMode="numeric"
                          placeholder="0"
                          value={inputData.rir}
                          onChange={(e) =>
                            handleInputChange(currentExercise.name, setIndex, "rir", e.target.value)
                          }
                          className="set-input"
                          min="0"
                          max="5"
                        />
                        <label className="set-input-label">RIR</label>
                      </div>
                    </div>
                    <div className="set-actions">
                      {exerciseHistory[currentExercise.name] && (
                        <button
                          onClick={() => handleQuickFill(currentExercise.name, setIndex)}
                          className="btn btn-ghost btn-sm"
                        >
                          ↻ Last
                        </button>
                      )}
                      <button
                        onClick={() => handleLogSet(currentExercise.name, setIndex)}
                        className="btn btn-primary btn-block"
                        disabled={!inputData.weight || !inputData.reps || !inputData.rir}
                      >
                        Log Set
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Add Set Button */}
        <button 
          onClick={() => {
            // Add set logic
          }}
          className="btn btn-secondary btn-block"
        >
          + Add Set
        </button>
      </div>

      {/* Navigation Footer */}
      <div className="workout-footer">
        <button
          onClick={() => setCurrentExerciseIndex(Math.max(0, currentExerciseIndex - 1))}
          disabled={currentExerciseIndex === 0}
          className="btn btn-secondary"
        >
          ← Previous
        </button>
        <button
          onClick={async () => {
            if (workout && workoutInstanceId) {
              await updateWorkoutInstance(workoutInstanceId, workout);
              navigate("/");
            }
          }}
          className="btn btn-success"
        >
          Finish Workout
        </button>
        <button
          onClick={() =>
            setCurrentExerciseIndex(
              Math.min(workout.exercises.length - 1, currentExerciseIndex + 1)
            )
          }
          disabled={currentExerciseIndex === workout.exercises.length - 1}
          className="btn btn-secondary"
        >
          Next →
        </button>
      </div>

      {/* Plate Calculator Modal */}
      {showPlateCalculator && (
        <div className="modal-overlay" onClick={() => setShowPlateCalculator(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Plate Calculator</h3>
              <button 
                onClick={() => setShowPlateCalculator(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <input
                type="number"
                placeholder="Enter weight"
                value={calculatorWeight}
                onChange={(e) => setCalculatorWeight(e.target.value)}
                className="input"
              />
              {calculatorWeight && (
                <div className="plate-result">
                  <h4>Load each side:</h4>
                  <div className="plate-list">
                    {calculatePlates(parseFloat(calculatorWeight)).plates.map((plate, idx) => (
                      <span key={idx} className="plate-item">
                        {plate} lbs
                      </span>
                    ))}
                  </div>
                  <p className="plate-total">
                    Total: {calculatePlates(parseFloat(calculatorWeight)).total} lbs
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizedWorkoutPage;