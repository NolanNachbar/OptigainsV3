import React, { useState, useEffect } from "react";
import {
  getWorkoutForToday,
  saveWorkouts,
  calculateNextWeight,
  getLastExercisePerformance,
  getWorkoutInstanceForDate,
  saveWorkoutInstance,
  updateWorkoutInstance,
  saveExerciseLog,
} from "../utils/SupaBase";
import { Workout, Exercise, Set } from "../utils/types";
import ActionBar from "../components/Actionbar";
import { MobileExerciseCard } from "../components/MobileExerciseCard";
import { MobileModal } from "../components/MobileModal";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useDate } from "../contexts/DateContext";

const normalizeExerciseName = (name: string) => name.toUpperCase();

const MobileProgrammedWorkoutPage: React.FC = () => {
  const { user } = useUser();
  const { currentDate } = useDate();
  const navigate = useNavigate();
  
  // Core state
  const [workoutToday, setWorkoutToday] = useState<Workout | null>(null);
  const [inputState, setInputState] = useState<
    Record<string, { weight: string; reps: string; rir: string }[]>
  >({});
  const [exerciseHistory, setExerciseHistory] = useState<Record<string, any>>({});
  const [workoutInstanceId, setWorkoutInstanceId] = useState<string | null>(null);
  
  // UI state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [exerciseName, setExerciseName] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [completedSets, setCompletedSets] = useState(0);
  const [totalSets, setTotalSets] = useState(0);
  
  // Editing state
  const [editingSet, setEditingSet] = useState<{
    exerciseName: string;
    setIndex: number;
    set: { weight: string; reps: string; rir: string };
  } | null>(null);

  // Calculate progress
  useEffect(() => {
    if (workoutToday) {
      let total = 0;
      let completed = 0;
      workoutToday.exercises.forEach((exercise) => {
        total += exercise.sets.length;
        completed += exercise.sets.filter(set => set.isLogged).length;
      });
      setTotalSets(total);
      setCompletedSets(completed);
    }
  }, [workoutToday]);

  // Fetch workout on mount
  useEffect(() => {
    const fetchWorkout = async () => {
      if (!user) return;

      try {
        const todayDate = currentDate.toISOString().split("T")[0];
        const workout = await getWorkoutForToday(null, todayDate, user);

        if (workout) {
          const instance = await getWorkoutInstanceForDate(user, todayDate);
          
          if (instance) {
            setWorkoutToday(instance.workout_data as Workout);
            setWorkoutInstanceId(instance.id);
          } else {
            const freshWorkout = {
              ...workout,
              exercises: workout.exercises.map((ex: Exercise) => ({
                ...ex,
                sets: ex.sets.map((set: Set) => ({ ...set, isLogged: false })),
              })),
            };
            setWorkoutToday(freshWorkout);
            
            const newInstance = await saveWorkoutInstance(
              user,
              freshWorkout,
              todayDate
            );
            setWorkoutInstanceId(newInstance.id);
          }

          // Initialize input state
          const initialInputState: Record<string, { weight: string; reps: string; rir: string }[]> = {};
          workout.exercises.forEach((exercise: Exercise) => {
            initialInputState[exercise.name] = exercise.sets.map(() => ({
              weight: "",
              reps: "",
              rir: "",
            }));
          });
          setInputState(initialInputState);

          // Load exercise history
          const historyData: Record<string, any> = {};
          for (const exercise of workout.exercises) {
            const lastPerformance = await getLastExercisePerformance(
              user,
              exercise.name
            );
            if (lastPerformance) {
              historyData[exercise.name] = lastPerformance;
            }
          }
          setExerciseHistory(historyData);
        }
      } catch (error) {
        console.error("Error fetching workout:", error);
      }
    };

    fetchWorkout();
  }, [user, currentDate]);

  const handleInputChange = (
    exerciseName: string,
    setIndex: number,
    field: "weight" | "reps" | "rir",
    value: string
  ) => {
    setInputState((prev) => ({
      ...prev,
      [exerciseName]: prev[exerciseName].map((set, idx) =>
        idx === setIndex ? { ...set, [field]: value } : set
      ),
    }));
  };

  const handleLogSet = async (exerciseName: string, setIndex: number) => {
    if (!workoutToday || !user || !workoutInstanceId) return;

    const input = inputState[exerciseName]?.[setIndex];
    if (!input?.weight || !input?.reps || !input?.rir) {
      alert("Please fill in all fields");
      return;
    }

    const weight = parseFloat(input.weight);
    const reps = parseInt(input.reps);
    const rir = parseInt(input.rir);

    // Update workout
    const updatedWorkout = {
      ...workoutToday,
      exercises: workoutToday.exercises.map((exercise) =>
        exercise.name === exerciseName
          ? {
              ...exercise,
              sets: exercise.sets.map((set, idx) =>
                idx === setIndex
                  ? { weight, reps, rir, isLogged: true }
                  : set
              ),
            }
          : exercise
      ),
    };

    setWorkoutToday(updatedWorkout);

    // Save to database
    try {
      await saveExerciseLog(
        user,
        workoutInstanceId,
        exerciseName,
        weight,
        reps,
        rir,
        setIndex
      );
      await updateWorkoutInstance(workoutInstanceId, updatedWorkout);
    } catch (error) {
      console.error("Error saving set:", error);
    }
  };

  const handleCalculateWeight = (exerciseName: string, setIndex: number) => {
    const exercise = workoutToday?.exercises.find(
      (ex) => ex.name === exerciseName
    );
    if (!exercise) return;

    const input = inputState[exerciseName]?.[setIndex];
    if (!input?.reps || !input?.rir) return;

    const targetReps = parseInt(input.reps);
    const targetRir = parseInt(input.rir);
    const calculatedWeight = calculateNextWeight(
      exercise,
      targetReps,
      targetRir
    );

    handleInputChange(exerciseName, setIndex, "weight", calculatedWeight.toString());
  };

  const handleRemoveSet = (exerciseName: string, setIndex: number) => {
    if (!workoutToday) return;

    setWorkoutToday({
      ...workoutToday,
      exercises: workoutToday.exercises.map((exercise) =>
        exercise.name === exerciseName
          ? {
              ...exercise,
              sets: exercise.sets.filter((_, idx) => idx !== setIndex),
            }
          : exercise
      ),
    });

    setInputState((prev) => ({
      ...prev,
      [exerciseName]: prev[exerciseName].filter((_, idx) => idx !== setIndex),
    }));
  };

  const handleAddSet = (exerciseName: string) => {
    if (!workoutToday) return;

    setWorkoutToday({
      ...workoutToday,
      exercises: workoutToday.exercises.map((exercise) =>
        exercise.name === exerciseName
          ? {
              ...exercise,
              sets: [...exercise.sets, { weight: 0, reps: 0, rir: 0, isLogged: false }],
            }
          : exercise
      ),
    });

    setInputState((prev) => ({
      ...prev,
      [exerciseName]: [
        ...(prev[exerciseName] || []),
        { weight: "", reps: "", rir: "" },
      ],
    }));
  };

  const handleSaveWorkout = async () => {
    if (!workoutToday || !user || !workoutInstanceId) return;

    try {
      await updateWorkoutInstance(workoutInstanceId, workoutToday);
      setShowSaveModal(true);
      setTimeout(() => setShowSaveModal(false), 2000);
    } catch (error) {
      console.error("Error saving workout:", error);
    }
  };

  const handleEditSet = (exerciseName: string, setIndex: number) => {
    const exercise = workoutToday?.exercises.find(ex => ex.name === exerciseName);
    const set = exercise?.sets[setIndex];
    if (!set) return;

    setEditingSet({
      exerciseName,
      setIndex,
      set: {
        weight: set.weight.toString(),
        reps: set.reps.toString(),
        rir: set.rir.toString(),
      },
    });
  };

  const handleDeleteSet = async (exerciseName: string, setIndex: number) => {
    if (!workoutToday) return;

    const updatedWorkout = {
      ...workoutToday,
      exercises: workoutToday.exercises.map((exercise) =>
        exercise.name === exerciseName
          ? {
              ...exercise,
              sets: exercise.sets.map((set, idx) =>
                idx === setIndex ? { ...set, isLogged: false } : set
              ),
            }
          : exercise
      ),
    };

    setWorkoutToday(updatedWorkout);
  };

  if (!workoutToday) {
    return (
      <div className="programmed-workout-page">
        <ActionBar />
        <div className="no-workout-container">
          <h2>No Workout Scheduled</h2>
          <p>There's no workout scheduled for today.</p>
          <div className="action-buttons">
            <button onClick={() => navigate("/workout-plan")} className="button primary">
              View Calendar
            </button>
            <button onClick={() => navigate("/freestyle-lift")} className="button secondary">
              Freestyle Workout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="programmed-workout-page">
      <ActionBar />
      <div className="workout-content">
        <h2>{workoutToday.workout_name}</h2>
        
        <div className="workout-stats-bar">
          <div className="stat-item">
            <div className="stat-item-label">Total</div>
            <div className="stat-item-value">{totalSets}</div>
          </div>
          <div className="stat-item">
            <div className="stat-item-label">Done</div>
            <div className="stat-item-value">{completedSets}</div>
          </div>
          <div className="stat-item">
            <div className="stat-item-label">Progress</div>
            <div className="stat-item-value">
              {totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0}%
            </div>
          </div>
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${totalSets > 0 ? (completedSets / totalSets) * 100 : 0}%` }}
          />
        </div>

        <div className="exercise-list">
          {workoutToday.exercises.map((exercise, index) => (
            <MobileExerciseCard
              key={exercise.name}
              exercise={exercise}
              exerciseHistory={exerciseHistory}
              inputState={inputState[exercise.name] || []}
              onInputChange={handleInputChange}
              onLogSet={handleLogSet}
              onCalculateWeight={handleCalculateWeight}
              onRemoveSet={handleRemoveSet}
              onAddSet={handleAddSet}
              onSwapExercise={() => {/* TODO */}}
              onRemoveExercise={() => {/* TODO */}}
              onEditSet={handleEditSet}
              onDeleteSet={handleDeleteSet}
              isDraggable={false}
            />
          ))}
        </div>

        <div className="action-buttons">
          <button onClick={handleSaveWorkout} className="button primary">
            Save Workout
          </button>
          <button onClick={() => setShowAddExerciseModal(true)} className="button secondary">
            Add Exercise
          </button>
        </div>
      </div>

      {/* Edit Set Modal */}
      {editingSet && (
        <MobileModal
          isOpen={!!editingSet}
          onClose={() => setEditingSet(null)}
          title="Edit Set"
        >
          <div className="modal-input-group">
            <label>Weight (lbs)</label>
            <input
              type="number"
              value={editingSet.set.weight}
              onChange={(e) =>
                setEditingSet({
                  ...editingSet,
                  set: { ...editingSet.set, weight: e.target.value },
                })
              }
              className="input-field"
              inputMode="decimal"
            />
          </div>
          <div className="modal-input-group">
            <label>Reps</label>
            <input
              type="number"
              value={editingSet.set.reps}
              onChange={(e) =>
                setEditingSet({
                  ...editingSet,
                  set: { ...editingSet.set, reps: e.target.value },
                })
              }
              className="input-field"
              inputMode="numeric"
            />
          </div>
          <div className="modal-input-group">
            <label>RIR</label>
            <input
              type="number"
              value={editingSet.set.rir}
              onChange={(e) =>
                setEditingSet({
                  ...editingSet,
                  set: { ...editingSet.set, rir: e.target.value },
                })
              }
              className="input-field"
              inputMode="numeric"
              min="0"
              max="5"
            />
          </div>
          <div className="modal-actions">
            <button
              onClick={() => {
                handleInputChange(
                  editingSet.exerciseName,
                  editingSet.setIndex,
                  "weight",
                  editingSet.set.weight
                );
                handleInputChange(
                  editingSet.exerciseName,
                  editingSet.setIndex,
                  "reps",
                  editingSet.set.reps
                );
                handleInputChange(
                  editingSet.exerciseName,
                  editingSet.setIndex,
                  "rir",
                  editingSet.set.rir
                );
                handleLogSet(editingSet.exerciseName, editingSet.setIndex);
                setEditingSet(null);
              }}
              className="button primary"
            >
              Update Set
            </button>
            <button onClick={() => setEditingSet(null)} className="button secondary">
              Cancel
            </button>
          </div>
        </MobileModal>
      )}

      {/* Save Success Modal */}
      <MobileModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        title="Workout Saved!"
        showCloseButton={false}
      >
        <p>Your workout has been saved successfully.</p>
      </MobileModal>
    </div>
  );
};

export default MobileProgrammedWorkoutPage;