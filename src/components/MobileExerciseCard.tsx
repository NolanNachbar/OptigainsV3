import React, { useState } from 'react';
import { Exercise } from '../utils/types';
import { MobileSetInput } from './MobileSetInput';

interface MobileExerciseCardProps {
  exercise: Exercise;
  exerciseHistory: any;
  inputState: { weight: string; reps: string; rir: string }[];
  onInputChange: (exerciseName: string, setIndex: number, field: 'weight' | 'reps' | 'rir', value: string) => void;
  onLogSet: (exerciseName: string, setIndex: number) => void;
  onCalculateWeight: (exerciseName: string, setIndex: number) => void;
  onRemoveSet: (exerciseName: string, setIndex: number) => void;
  onAddSet: (exerciseName: string) => void;
  onSwapExercise: (exerciseName: string) => void;
  onRemoveExercise: (exerciseName: string) => void;
  onEditSet: (exerciseName: string, setIndex: number) => void;
  onDeleteSet: (exerciseName: string, setIndex: number) => void;
  isDraggable: boolean;
}

export const MobileExerciseCard: React.FC<MobileExerciseCardProps> = ({
  exercise,
  exerciseHistory,
  inputState,
  onInputChange,
  onLogSet,
  onCalculateWeight,
  onRemoveSet,
  onAddSet,
  onSwapExercise,
  onRemoveExercise,
  onEditSet,
  onDeleteSet,
  isDraggable,
}) => {
  const [showHistory, setShowHistory] = useState(false);

  const history = exerciseHistory[exercise.name];

  return (
    <div className={`exercise-card ${isDraggable ? 'draggable' : ''}`}>
      <div className="exercise-header">
        <h3>{exercise.name}</h3>
        <div className="exercise-actions">
          <button
            onClick={() => onAddSet(exercise.name)}
            className="button action"
          >
            + Set
          </button>
          <button
            onClick={() => onSwapExercise(exercise.name)}
            className="button secondary"
          >
            Swap
          </button>
          <button
            onClick={() => onRemoveExercise(exercise.name)}
            className="button danger"
          >
            Remove
          </button>
        </div>
      </div>

      {history && (
        <div 
          className={`last-set-info ${showHistory ? '' : 'collapsed'}`}
          onClick={() => setShowHistory(!showHistory)}
        >
          <div className="performance-header">
            <strong>Last: {history.weight}lbs × {history.reps} @RIR{history.rir}</strong>
            <span>{showHistory ? '−' : '+'}</span>
          </div>
          {showHistory && (
            <div className="performance-details">
              <span className="date">
                {new Date(history.date).toLocaleDateString()} - {history.workoutName}
              </span>
            </div>
          )}
        </div>
      )}

      <ul className="set-list">
        {exercise.sets.map((set, setIndex) => (
          <li key={setIndex} className="set-item">
            <MobileSetInput
              exerciseName={exercise.name}
              setIndex={setIndex}
              set={set}
              inputValues={inputState[setIndex] || { weight: '', reps: '', rir: '' }}
              onInputChange={(field, value) => onInputChange(exercise.name, setIndex, field, value)}
              onLogSet={() => onLogSet(exercise.name, setIndex)}
              onCalculateWeight={() => onCalculateWeight(exercise.name, setIndex)}
              onRemoveSet={() => onRemoveSet(exercise.name, setIndex)}
              showCalculate={!!history}
              isLogged={set.isLogged}
              onEditSet={() => onEditSet(exercise.name, setIndex)}
              onDeleteSet={() => onDeleteSet(exercise.name, setIndex)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};