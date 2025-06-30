import React, { useState, useEffect, useRef } from 'react';

interface InlineSetEditorProps {
  weight: number;
  reps: number;
  rir: number;
  onSave: (weight: number, reps: number, rir: number) => void;
  onCancel: () => void;
}

export const InlineSetEditor: React.FC<InlineSetEditorProps> = ({
  weight,
  reps,
  rir,
  onSave,
  onCancel,
}) => {
  const [editWeight, setEditWeight] = useState(weight.toString());
  const [editReps, setEditReps] = useState(reps.toString());
  const [editRir, setEditRir] = useState(rir.toString());
  const weightRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus weight input on mount
    weightRef.current?.focus();
    weightRef.current?.select();
  }, []);

  const handleSave = () => {
    const newWeight = parseFloat(editWeight) || 0;
    const newReps = parseInt(editReps) || 0;
    const newRir = parseInt(editRir) || 0;
    
    if (newWeight > 0 && newReps > 0 && newRir >= 0 && newRir <= 5) {
      onSave(newWeight, newReps, newRir);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="inline-set-editor">
      <div className="inline-edit-inputs">
        <div className="inline-input-group">
          <input
            ref={weightRef}
            type="number"
            value={editWeight}
            onChange={(e) => setEditWeight(e.target.value)}
            onKeyDown={handleKeyDown}
            className="inline-input"
            placeholder="Weight"
            inputMode="decimal"
          />
          <span className="inline-label">lbs</span>
        </div>
        <div className="inline-input-group">
          <input
            type="number"
            value={editReps}
            onChange={(e) => setEditReps(e.target.value)}
            onKeyDown={handleKeyDown}
            className="inline-input"
            placeholder="Reps"
            inputMode="numeric"
          />
          <span className="inline-label">reps</span>
        </div>
        <div className="inline-input-group">
          <input
            type="number"
            value={editRir}
            onChange={(e) => setEditRir(e.target.value)}
            onKeyDown={handleKeyDown}
            className="inline-input"
            placeholder="RIR"
            inputMode="numeric"
            min="0"
            max="5"
          />
          <span className="inline-label">RIR</span>
        </div>
      </div>
      <div className="inline-edit-actions">
        <button 
          onClick={handleSave} 
          className="inline-save-btn"
          aria-label="Save changes"
        >
          ✓
        </button>
        <button 
          onClick={onCancel} 
          className="inline-cancel-btn"
          aria-label="Cancel edit"
        >
          ✗
        </button>
      </div>
    </div>
  );
};