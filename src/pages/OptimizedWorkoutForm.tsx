import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { saveWorkouts, getConsolidatedExercises } from "../utils/SupaBase";
import { Exercise, Set } from "../utils/types";
import ActionBar from "../components/Actionbar";
import "../styles/design-system.css";
import "../styles/components.css";
import "../styles/optimized-workout-form.css";

// Exercise database with muscle groups
const EXERCISE_DATABASE = {
  // Chest
  "BENCH PRESS": { primary: "Chest", secondary: ["Shoulders", "Triceps"] },
  "INCLINE BENCH PRESS": { primary: "Chest", secondary: ["Shoulders", "Triceps"] },
  "DUMBBELL PRESS": { primary: "Chest", secondary: ["Shoulders", "Triceps"] },
  "DUMBBELL FLYES": { primary: "Chest", secondary: [] },
  "CABLE FLYES": { primary: "Chest", secondary: [] },
  "DIPS": { primary: "Chest", secondary: ["Triceps", "Shoulders"] },
  
  // Back
  "DEADLIFT": { primary: "Back", secondary: ["Legs", "Core"] },
  "PULL-UPS": { primary: "Back", secondary: ["Biceps"] },
  "LAT PULLDOWN": { primary: "Back", secondary: ["Biceps"] },
  "BARBELL ROW": { primary: "Back", secondary: ["Biceps"] },
  "DUMBBELL ROW": { primary: "Back", secondary: ["Biceps"] },
  "T-BAR ROW": { primary: "Back", secondary: ["Biceps"] },
  
  // Shoulders
  "OVERHEAD PRESS": { primary: "Shoulders", secondary: ["Triceps"] },
  "DUMBBELL SHOULDER PRESS": { primary: "Shoulders", secondary: ["Triceps"] },
  "LATERAL RAISES": { primary: "Shoulders", secondary: [] },
  "FACE PULLS": { primary: "Shoulders", secondary: ["Back"] },
  "UPRIGHT ROWS": { primary: "Shoulders", secondary: ["Traps"] },
  
  // Arms
  "BARBELL CURLS": { primary: "Biceps", secondary: [] },
  "DUMBBELL CURLS": { primary: "Biceps", secondary: [] },
  "HAMMER CURLS": { primary: "Biceps", secondary: [] },
  "PREACHER CURLS": { primary: "Biceps", secondary: [] },
  "TRICEP PUSHDOWNS": { primary: "Triceps", secondary: [] },
  "OVERHEAD EXTENSION": { primary: "Triceps", secondary: [] },
  "CLOSE GRIP BENCH": { primary: "Triceps", secondary: ["Chest"] },
  
  // Legs
  "SQUAT": { primary: "Legs", secondary: ["Core"] },
  "FRONT SQUAT": { primary: "Legs", secondary: ["Core"] },
  "LEG PRESS": { primary: "Legs", secondary: [] },
  "ROMANIAN DEADLIFT": { primary: "Legs", secondary: ["Back"] },
  "LEG CURLS": { primary: "Legs", secondary: [] },
  "LEG EXTENSIONS": { primary: "Legs", secondary: [] },
  "CALF RAISES": { primary: "Legs", secondary: [] },
  
  // Core
  "PLANK": { primary: "Core", secondary: [] },
  "CRUNCHES": { primary: "Core", secondary: [] },
  "RUSSIAN TWISTS": { primary: "Core", secondary: [] },
  "LEG RAISES": { primary: "Core", secondary: [] },
};

interface WorkoutExercise {
  name: string;
  sets: number;
  defaultReps: number;
  defaultRIR: number;
  notes?: string;
}

interface WorkoutTemplate {
  name: string;
  exercises: WorkoutExercise[];
}

// Pre-built templates
const WORKOUT_TEMPLATES: Record<string, WorkoutTemplate> = {
  "Push (Chest, Shoulders, Triceps)": {
    name: "Push Day",
    exercises: [
      { name: "BENCH PRESS", sets: 4, defaultReps: 8, defaultRIR: 2 },
      { name: "INCLINE DUMBBELL PRESS", sets: 3, defaultReps: 10, defaultRIR: 2 },
      { name: "OVERHEAD PRESS", sets: 4, defaultReps: 8, defaultRIR: 2 },
      { name: "LATERAL RAISES", sets: 3, defaultReps: 12, defaultRIR: 1 },
      { name: "TRICEP PUSHDOWNS", sets: 3, defaultReps: 15, defaultRIR: 0 },
    ],
  },
  "Pull (Back, Biceps)": {
    name: "Pull Day",
    exercises: [
      { name: "DEADLIFT", sets: 4, defaultReps: 6, defaultRIR: 2 },
      { name: "PULL-UPS", sets: 3, defaultReps: 8, defaultRIR: 2 },
      { name: "BARBELL ROW", sets: 4, defaultReps: 10, defaultRIR: 2 },
      { name: "LAT PULLDOWN", sets: 3, defaultReps: 12, defaultRIR: 1 },
      { name: "BARBELL CURLS", sets: 3, defaultReps: 12, defaultRIR: 1 },
    ],
  },
  "Legs": {
    name: "Leg Day",
    exercises: [
      { name: "SQUAT", sets: 4, defaultReps: 8, defaultRIR: 2 },
      { name: "ROMANIAN DEADLIFT", sets: 3, defaultReps: 10, defaultRIR: 2 },
      { name: "LEG PRESS", sets: 3, defaultReps: 12, defaultRIR: 1 },
      { name: "LEG CURLS", sets: 3, defaultReps: 15, defaultRIR: 0 },
      { name: "CALF RAISES", sets: 4, defaultReps: 15, defaultRIR: 0 },
    ],
  },
  "Upper Body": {
    name: "Upper Body",
    exercises: [
      { name: "BENCH PRESS", sets: 4, defaultReps: 8, defaultRIR: 2 },
      { name: "BARBELL ROW", sets: 4, defaultReps: 8, defaultRIR: 2 },
      { name: "OVERHEAD PRESS", sets: 3, defaultReps: 10, defaultRIR: 2 },
      { name: "PULL-UPS", sets: 3, defaultReps: 8, defaultRIR: 2 },
      { name: "DUMBBELL CURLS", sets: 3, defaultReps: 12, defaultRIR: 1 },
    ],
  },
  "Lower Body": {
    name: "Lower Body",
    exercises: [
      { name: "SQUAT", sets: 4, defaultReps: 8, defaultRIR: 2 },
      { name: "ROMANIAN DEADLIFT", sets: 4, defaultReps: 10, defaultRIR: 2 },
      { name: "FRONT SQUAT", sets: 3, defaultReps: 10, defaultRIR: 2 },
      { name: "LEG CURLS", sets: 3, defaultReps: 15, defaultRIR: 0 },
      { name: "CALF RAISES", sets: 4, defaultReps: 15, defaultRIR: 0 },
    ],
  },
};

const OptimizedWorkoutForm: React.FC = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  
  // State
  const [workoutName, setWorkoutName] = useState("");
  const [workoutNotes, setWorkoutNotes] = useState("");
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Exercise addition state
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(null);
  
  // Get all exercises from database
  const allExercises = Object.keys(EXERCISE_DATABASE);
  const muscleGroups = ["All", "Chest", "Back", "Shoulders", "Biceps", "Triceps", "Legs", "Core"];

  // Filter exercises based on search and muscle group
  const filteredExercises = allExercises.filter(exercise => {
    const matchesSearch = exercise.toLowerCase().includes(exerciseSearch.toLowerCase());
    const exerciseData = EXERCISE_DATABASE[exercise as keyof typeof EXERCISE_DATABASE];
    const matchesMuscle = 
      !selectedMuscleGroup || 
      selectedMuscleGroup === "All" ||
      exerciseData.primary === selectedMuscleGroup ||
      exerciseData.secondary.includes(selectedMuscleGroup);
    
    return matchesSearch && matchesMuscle;
  });

  const handleTemplateSelect = (templateKey: string) => {
    const template = WORKOUT_TEMPLATES[templateKey];
    setSelectedTemplate(templateKey);
    setWorkoutName(template.name);
    setExercises(template.exercises);
  };

  const handleAddExercise = (exerciseName: string) => {
    const newExercise: WorkoutExercise = {
      name: exerciseName,
      sets: 3,
      defaultReps: 10,
      defaultRIR: 2,
    };
    setExercises([...exercises, newExercise]);
    setShowExerciseSelector(false);
    setExerciseSearch("");
  };

  const handleUpdateExercise = (index: number, field: keyof WorkoutExercise, value: any) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  };

  const handleRemoveExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleMoveExercise = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === exercises.length - 1)
    ) {
      return;
    }
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...exercises];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setExercises(updated);
  };

  const handleSaveWorkout = async () => {
    if (!workoutName || exercises.length === 0 || !user) {
      return;
    }

    setIsSaving(true);
    try {
      // Convert to the expected format
      const workoutToSave = {
        userId: user.id,
        workout_name: workoutName,
        notes: workoutNotes,
        exercises: exercises.map(ex => ({
          name: ex.name,
          notes: ex.notes || "",
          sets: Array(ex.sets).fill(null).map(() => ({
            weight: 0,
            reps: ex.defaultReps,
            rir: ex.defaultRIR,
          })),
        })),
      };

      await saveWorkouts(workoutToSave, user);
      navigate("/workout-plan");
    } catch (error) {
      console.error("Error saving workout:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="workout-form-page">
      <ActionBar />
      
      <div className="form-container">
        <div className="form-header">
          <h1>Create Workout</h1>
          <button 
            onClick={() => navigate("/workout-plan")}
            className="btn btn-ghost"
          >
            Cancel
          </button>
        </div>

        {/* Template Selection */}
        {exercises.length === 0 && (
          <div className="template-section">
            <h2>Start with a template</h2>
            <div className="template-grid">
              {Object.entries(WORKOUT_TEMPLATES).map(([key, template]) => (
                <button
                  key={key}
                  onClick={() => handleTemplateSelect(key)}
                  className={`template-card ${selectedTemplate === key ? 'selected' : ''}`}
                >
                  <h3>{key}</h3>
                  <p>{template.exercises.length} exercises</p>
                </button>
              ))}
            </div>
            <div className="divider">
              <span>or</span>
            </div>
            <button 
              onClick={() => setShowExerciseSelector(true)}
              className="btn btn-secondary btn-block"
            >
              Build Custom Workout
            </button>
          </div>
        )}

        {/* Workout Details */}
        {exercises.length > 0 && (
          <>
            <div className="form-section">
              <div className="input-group">
                <label className="input-label">Workout Name</label>
                <input
                  type="text"
                  value={workoutName}
                  onChange={(e) => setWorkoutName(e.target.value)}
                  placeholder="e.g., Upper Body Power"
                  className="input"
                />
              </div>
              
              <div className="input-group">
                <label className="input-label">Notes (optional)</label>
                <textarea
                  value={workoutNotes}
                  onChange={(e) => setWorkoutNotes(e.target.value)}
                  placeholder="Add any notes about this workout..."
                  className="input"
                  rows={3}
                />
              </div>
            </div>

            {/* Exercise List */}
            <div className="exercises-section">
              <div className="section-header">
                <h2>Exercises ({exercises.length})</h2>
                <button 
                  onClick={() => setShowExerciseSelector(true)}
                  className="btn btn-primary btn-sm"
                >
                  + Add Exercise
                </button>
              </div>

              <div className="exercise-list">
                {exercises.map((exercise, index) => (
                  <div key={index} className="exercise-item">
                    <div className="exercise-header">
                      <h3>{exercise.name}</h3>
                      <div className="exercise-actions">
                        <button
                          onClick={() => handleMoveExercise(index, 'up')}
                          className="btn-icon-sm"
                          disabled={index === 0}
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => handleMoveExercise(index, 'down')}
                          className="btn-icon-sm"
                          disabled={index === exercises.length - 1}
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => handleRemoveExercise(index)}
                          className="btn-icon-sm danger"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    
                    <div className="exercise-config">
                      <div className="config-item">
                        <label>Sets</label>
                        <input
                          type="number"
                          value={exercise.sets}
                          onChange={(e) => handleUpdateExercise(index, 'sets', parseInt(e.target.value))}
                          min="1"
                          max="10"
                          className="config-input"
                        />
                      </div>
                      <div className="config-item">
                        <label>Target Reps</label>
                        <input
                          type="number"
                          value={exercise.defaultReps}
                          onChange={(e) => handleUpdateExercise(index, 'defaultReps', parseInt(e.target.value))}
                          min="1"
                          max="30"
                          className="config-input"
                        />
                      </div>
                      <div className="config-item">
                        <label>Target RIR</label>
                        <input
                          type="number"
                          value={exercise.defaultRIR}
                          onChange={(e) => handleUpdateExercise(index, 'defaultRIR', parseInt(e.target.value))}
                          min="0"
                          max="5"
                          className="config-input"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="form-footer">
              <button 
                onClick={handleSaveWorkout}
                disabled={!workoutName || exercises.length === 0 || isSaving}
                className="btn btn-success btn-lg btn-block"
              >
                {isSaving ? "Saving..." : "Save Workout"}
              </button>
            </div>
          </>
        )}

        {/* Exercise Selector Modal */}
        {showExerciseSelector && (
          <div className="modal-overlay" onClick={() => setShowExerciseSelector(false)}>
            <div className="modal-content exercise-selector" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Add Exercise</h3>
                <button 
                  onClick={() => setShowExerciseSelector(false)}
                  className="modal-close"
                >
                  ×
                </button>
              </div>
              
              <div className="modal-body">
                <input
                  type="text"
                  placeholder="Search exercises..."
                  value={exerciseSearch}
                  onChange={(e) => setExerciseSearch(e.target.value)}
                  className="input"
                  autoFocus
                />
                
                <div className="muscle-filter">
                  {muscleGroups.map(group => (
                    <button
                      key={group}
                      onClick={() => setSelectedMuscleGroup(group === "All" ? null : group)}
                      className={`filter-chip ${
                        (group === "All" && !selectedMuscleGroup) || 
                        selectedMuscleGroup === group ? 'active' : ''
                      }`}
                    >
                      {group}
                    </button>
                  ))}
                </div>
                
                <div className="exercise-grid">
                  {filteredExercises.map(exercise => {
                    const data = EXERCISE_DATABASE[exercise as keyof typeof EXERCISE_DATABASE];
                    return (
                      <button
                        key={exercise}
                        onClick={() => handleAddExercise(exercise)}
                        className="exercise-option"
                      >
                        <span className="exercise-name">{exercise}</span>
                        <span className={`muscle-badge badge-${data.primary.toLowerCase()}`}>
                          {data.primary}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OptimizedWorkoutForm;