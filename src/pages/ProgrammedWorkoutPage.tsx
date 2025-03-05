import React, { useState, useEffect } from "react";
import { getWorkoutForToday, saveWorkouts } from "../utils/SupaBase";
import { Workout, Set } from "../utils/types";
import ActionBar from "../components/Actionbar";
import { useUser } from "@clerk/clerk-react";
import { useSupabaseClient } from "../utils/supabaseClient";
import { useNavigate } from "react-router-dom";

const StartProgrammedLiftPage: React.FC = () => {
  const { user } = useUser();
  const supabase = useSupabaseClient();
  const [workoutToday, setWorkoutToday] = useState<Workout | null>(null);
  const [exerciseName, setExerciseName] = useState<string>("");
  const [inputState, setInputState] = useState<
    Record<string, { weight: string; reps: string; rir: string }[]>
  >({});
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [completedSets, setCompletedSets] = useState(0);
  const [totalSets, setTotalSets] = useState(0);
  const navigate = useNavigate();

  // Calculate total sets and completed sets whenever workout changes
  useEffect(() => {
    if (workoutToday) {
      let total = 0;
      let completed = 0;
      workoutToday.exercises.forEach((exercise) => {
        total += exercise.sets.length;
        const loggedSetsForExercise =
          inputState[exercise.name]?.filter(
            (set) => set.weight && set.reps && set.rir
          ).length || 0;
        completed += loggedSetsForExercise;
      });
      setTotalSets(total);
      setCompletedSets(completed);
    }
  }, [workoutToday, inputState]);

  useEffect(() => {
    const fetchWorkout = async () => {
      if (!user) return;

      try {
        const today = new Date().toISOString().split("T")[0];
        const workout = await getWorkoutForToday(supabase, today, user);

        if (workout) {
          setWorkoutToday(workout);
          const initialState: Record<
            string,
            { weight: string; reps: string; rir: string }[]
          > = {};

          workout.exercises.forEach((exercise) => {
            initialState[exercise.name] = exercise.sets.map(() => ({
              weight: "",
              reps: "",
              rir: "",
            }));
          });

          setInputState(initialState);
        }
      } catch (error) {
        console.error("Error fetching workout:", error);
      }
    };

    fetchWorkout();
  }, [user, supabase]);

  const handleInputChange = (
    exerciseName: string,
    setIndex: number,
    field: keyof Set,
    value: string
  ) => {
    setInputState((prev) => ({
      ...prev,
      [exerciseName]: prev[exerciseName].map((set, idx) =>
        idx === setIndex ? { ...set, [field]: value } : set
      ),
    }));
  };

  const handleLogSet = (exerciseName: string, setIndex: number) => {
    const setInput = inputState[exerciseName]?.[setIndex];
    if (!setInput || !workoutToday) return;

    const { weight, reps, rir } = setInput;
    if (!weight || !reps || !rir) {
      alert("Please fill in all fields before logging the set.");
      return;
    }

    setWorkoutToday((prev) => {
      if (!prev) return null;

      const updatedExercises = prev.exercises.map((exercise) => {
        if (exercise.name === exerciseName) {
          const updatedSets = [...exercise.sets];
          updatedSets[setIndex] = {
            weight: Number(weight),
            reps: Number(reps),
            rir: Number(rir),
          };
          return { ...exercise, sets: updatedSets };
        }
        return exercise;
      });

      return {
        ...prev,
        exercises: updatedExercises,
      };
    });

    // Clear the input fields for the logged set
    setInputState((prev) => ({
      ...prev,
      [exerciseName]: prev[exerciseName].map((set, idx) =>
        idx === setIndex ? { weight: "", reps: "", rir: "" } : set
      ),
    }));
  };

  const handleSaveWorkout = async () => {
    if (!workoutToday || !user) return;

    try {
      await saveWorkouts(supabase, [workoutToday], user);
      alert("Workout saved successfully!");
      navigate("/workout-plan");
    } catch (error) {
      console.error("Error saving workout:", error);
      alert("Failed to save workout.");
    }
  };

  const handleSaveAsNew = async () => {
    if (!workoutToday || !user || !exerciseName.trim()) return;

    try {
      const newWorkout = {
        ...workoutToday,
        workout_name: exerciseName.trim(),
        assigned_days: [new Date().toISOString().split("T")[0]],
      };

      await saveWorkouts(supabase, [newWorkout], user);
      alert("New workout saved successfully!");
      setShowSaveModal(false);
      setExerciseName("");
      navigate("/workout-plan");
    } catch (error) {
      console.error("Error saving new workout:", error);
      alert("Failed to save new workout.");
    }
  };

  return (
    <div className="programmed-workout-page">
      <ActionBar />
      <div className="workout-content">
        <div className="workout-stats-bar">
          <div className="stat-item">
            <div className="stat-item-label">Total Sets</div>
            <div className="stat-item-value">{totalSets}</div>
          </div>
          <div className="stat-item">
            <div className="stat-item-label">Completed</div>
            <div className="stat-item-value">{completedSets}</div>
          </div>
          <div className="stat-item">
            <div className="stat-item-label">Progress</div>
            <div className="stat-item-value">
              {Math.round((completedSets / totalSets) * 100)}%
            </div>
          </div>
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${(completedSets / totalSets) * 100}%` }}
          />
        </div>

        {workoutToday && (
          <div className="exercises-list">
            {workoutToday.exercises.map((exercise, exerciseIndex) => (
              <div key={exerciseIndex} className="exercise-block">
                <h3>{exercise.name}</h3>
                <div className="sets-container">
                  {exercise.sets.map((set, setIndex) => (
                    <div key={setIndex} className="set-card">
                      <div className="set-header">
                        <span>Set {setIndex + 1}</span>
                      </div>
                      <div className="set-info">
                        <div>
                          <label className="set-label">Weight (lbs)</label>
                          <input
                            type="number"
                            value={
                              inputState[exercise.name]?.[setIndex]?.weight ||
                              ""
                            }
                            onChange={(e) =>
                              handleInputChange(
                                exercise.name,
                                setIndex,
                                "weight",
                                e.target.value
                              )
                            }
                            className="input-field"
                          />
                        </div>
                        <div>
                          <label className="set-label">Reps</label>
                          <input
                            type="number"
                            value={
                              inputState[exercise.name]?.[setIndex]?.reps || ""
                            }
                            onChange={(e) =>
                              handleInputChange(
                                exercise.name,
                                setIndex,
                                "reps",
                                e.target.value
                              )
                            }
                            className="input-field"
                          />
                        </div>
                        <div>
                          <label className="set-label">RIR</label>
                          <input
                            type="number"
                            value={
                              inputState[exercise.name]?.[setIndex]?.rir || ""
                            }
                            onChange={(e) =>
                              handleInputChange(
                                exercise.name,
                                setIndex,
                                "rir",
                                e.target.value
                              )
                            }
                            className="input-field"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => handleLogSet(exercise.name, setIndex)}
                        className="set-action-btn log"
                      >
                        Log Set
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="action-buttons">
          <button onClick={handleSaveWorkout} className="button save">
            Save Workout
          </button>
          <button
            onClick={() => setShowSaveModal(true)}
            className="button secondary"
          >
            Save as New
          </button>
        </div>

        {showSaveModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Save as New Workout</h2>
              <div className="modal-input-group">
                <label htmlFor="new-workout-name">Workout Name</label>
                <input
                  type="text"
                  id="new-workout-name"
                  value={exerciseName}
                  onChange={(e) => setExerciseName(e.target.value)}
                  className="input-field"
                  placeholder=" "
                />
              </div>
              <div className="modal-actions">
                <button onClick={handleSaveAsNew} className="button save">
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowSaveModal(false);
                    setExerciseName("");
                  }}
                  className="button secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StartProgrammedLiftPage;
