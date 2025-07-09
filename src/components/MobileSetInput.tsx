import React from 'react';
import { Set } from '../utils/types';

interface MobileSetInputProps {
  exerciseName: string;
  setIndex: number;
  set: Set;
  inputValues: { weight: string; reps: string; rir: string };
  onInputChange: (field: 'weight' | 'reps' | 'rir', value: string) => void;
  onLogSet: () => void;
  onCalculateWeight?: () => void;
  onRemoveSet: () => void;
  showCalculate: boolean;
  isLogged: boolean;
  onEditSet?: () => void;
  onDeleteSet?: () => void;
}

export const MobileSetInput: React.FC<MobileSetInputProps> = ({
  set,
  inputValues,
  onInputChange,
  onLogSet,
  onCalculateWeight,
  onRemoveSet,
  showCalculate,
  isLogged,
  onEditSet,
  onDeleteSet,
}) => {
  if (isLogged) {
    return (
      <div className="logged-set">
        <div className="set-info">
          <span data-label="Weight">{set.weight} lbs</span>
          <span data-label="Reps">{set.reps}</span>
          <span data-label="RIR">{set.rir}</span>
        </div>
        <div className="button-group">
          <button onClick={onEditSet} className="button action">
            Edit
          </button>
          <button onClick={onDeleteSet} className="button danger">
            Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={onRemoveSet}
        className="remove-set-btn"
        aria-label="Remove set"
      >
        ×
      </button>
      <div className="set-inputs">
        <div className="floating-label-container">
          <input
            type="number"
            value={inputValues.weight}
            onChange={(e) => onInputChange('weight', e.target.value)}
            className="input-field"
            placeholder="0"
            inputMode="decimal"
            autoComplete="off"
          />
          <label className="floating-label">Weight</label>
        </div>
        <div className="floating-label-container">
          <input
            type="number"
            value={inputValues.reps}
            onChange={(e) => onInputChange('reps', e.target.value)}
            className="input-field"
            placeholder="0"
            inputMode="numeric"
            autoComplete="off"
          />
          <label className="floating-label">Reps</label>
        </div>
        <div className="floating-label-container">
          <input
            type="number"
            value={inputValues.rir}
            onChange={(e) => onInputChange('rir', e.target.value)}
            className="input-field"
            placeholder="0"
            inputMode="numeric"
            autoComplete="off"
            min="0"
            max="5"
          />
          <label className="floating-label">RIR</label>
        </div>
      </div>
      <div className="set-actions">
        <button onClick={onLogSet} className="button primary">
          Log Set
        </button>
        {showCalculate && onCalculateWeight && (
          <button
            onClick={onCalculateWeight}
            className="button secondary"
            disabled={!inputValues.reps || !inputValues.rir}
          >
            Calculate
          </button>
        )}
      </div>
    </>
  );
};