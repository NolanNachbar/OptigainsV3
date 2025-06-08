import React, { useState, useMemo } from 'react';
import { EXERCISE_MUSCLE_MAPPING } from '../utils/trainingBlocks';
import { MuscleGroup } from '../utils/types';

interface EnhancedExerciseSelectorProps {
  suggestions: string[];
  onSelectExercise: (exerciseName: string) => void;
  onClose: () => void;
  currentExerciseName?: string;
}

const EnhancedExerciseSelector: React.FC<EnhancedExerciseSelectorProps> = ({
  suggestions,
  onSelectExercise,
  onClose,
  currentExerciseName = ''
}) => {
  const [searchTerm, setSearchTerm] = useState(currentExerciseName);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroup | 'All'>('All');
  const [showOnlyRecent, setShowOnlyRecent] = useState(false);

  // Get unique muscle groups from the mapping
  const muscleGroups = useMemo(() => {
    const groups = new Set<MuscleGroup>();
    EXERCISE_MUSCLE_MAPPING.forEach(exercise => {
      exercise.primaryMuscles.forEach(muscle => groups.add(muscle));
      exercise.secondaryMuscles.forEach(muscle => groups.add(muscle));
    });
    return ['All', ...Array.from(groups).sort()] as const;
  }, []);

  // Filter exercises based on search and filters
  const filteredExercises = useMemo(() => {
    // Combine suggestions with exercise mapping
    const allExercises = new Set([
      ...suggestions,
      ...EXERCISE_MUSCLE_MAPPING.map(e => e.exerciseName)
    ]);

    return Array.from(allExercises).filter(exerciseName => {
      // Search filter
      if (searchTerm && !exerciseName.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      const mapping = EXERCISE_MUSCLE_MAPPING.find(
        e => e.exerciseName.toUpperCase() === exerciseName.toUpperCase()
      );

      // Muscle group filter
      if (selectedMuscleGroup !== 'All' && mapping) {
        const hasMuscle = [...mapping.primaryMuscles, ...mapping.secondaryMuscles]
          .includes(selectedMuscleGroup);
        if (!hasMuscle) return false;
      }


      // Recent filter
      if (showOnlyRecent && !suggestions.includes(exerciseName)) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      // Sort recently used first
      const aRecent = suggestions.includes(a);
      const bRecent = suggestions.includes(b);
      if (aRecent && !bRecent) return -1;
      if (!aRecent && bRecent) return 1;
      return a.localeCompare(b);
    });
  }, [searchTerm, selectedMuscleGroup, showOnlyRecent, suggestions]);

  const handleSelectExercise = (exerciseName: string) => {
    onSelectExercise(exerciseName);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <h2>Select Exercise</h2>
        
        <div className="exercise-filters">
          <div className="search-section">
            <input
              type="text"
              placeholder="Search exercises..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              autoFocus
            />
          </div>

          <div className="filter-row">
            <div className="filter-group">
              <label>Muscle Group</label>
              <select
                value={selectedMuscleGroup}
                onChange={(e) => setSelectedMuscleGroup(e.target.value as MuscleGroup | 'All')}
                className="filter-select"
              >
                {muscleGroups.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showOnlyRecent}
                  onChange={(e) => setShowOnlyRecent(e.target.checked)}
                />
                Recently Used Only
              </label>
            </div>
          </div>
        </div>

        <div className="exercise-results">
          <div className="results-header">
            <span>{filteredExercises.length} exercises found</span>
          </div>
          
          <div className="exercise-list-scroll">
            {filteredExercises.map((exerciseName, index) => {
              const mapping = EXERCISE_MUSCLE_MAPPING.find(
                e => e.exerciseName.toUpperCase() === exerciseName.toUpperCase()
              );
              const isRecent = suggestions.includes(exerciseName);
              
              return (
                <div
                  key={index}
                  className={`exercise-item ${isRecent ? 'recent' : ''}`}
                  onClick={() => handleSelectExercise(exerciseName)}
                >
                  <div className="exercise-info">
                    <div className="exercise-name">
                      {exerciseName}
                      {isRecent && <span className="recent-badge">Recent</span>}
                    </div>
                    {mapping && (
                      <div className="exercise-details">
                        <span className="muscle-groups">
                          {mapping.primaryMuscles.join(', ')}
                          {mapping.secondaryMuscles.length > 0 && 
                            ` (${mapping.secondaryMuscles.join(', ')})`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="button secondary">
            Cancel
          </button>
        </div>

        <style>{`
          .exercise-filters {
            margin-bottom: 1.5rem;
          }

          .search-section {
            margin-bottom: 1rem;
          }

          .search-input {
            width: 100%;
            padding: 0.75rem;
            font-size: 1rem;
            background: var(--input-background);
            color: var(--input-text);
            border: 1px solid var(--border);
            border-radius: 6px;
          }

          .search-input:focus {
            outline: none;
            border-color: var(--primary);
          }

          .filter-row {
            display: flex;
            gap: 1rem;
            align-items: flex-end;
            flex-wrap: wrap;
          }

          .filter-group {
            flex: 1;
            min-width: 150px;
          }

          .filter-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-size: 0.9rem;
            color: #b0b0b0;
          }

          .filter-select {
            width: 100%;
            padding: 0.5rem;
            background: var(--input-background);
            color: var(--input-text);
            border: 1px solid var(--border);
            border-radius: 4px;
            font-size: 0.9rem;
          }

          .checkbox-label {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            cursor: pointer;
            user-select: none;
          }

          .checkbox-label input {
            cursor: pointer;
          }

          .exercise-results {
            background: #1e1e1e;
            border-radius: 8px;
            padding: 1rem;
            max-height: 400px;
            display: flex;
            flex-direction: column;
          }

          .results-header {
            padding-bottom: 0.75rem;
            border-bottom: 1px solid #333;
            margin-bottom: 0.75rem;
            font-size: 0.9rem;
            color: #888;
          }

          .exercise-list-scroll {
            overflow-y: auto;
            flex: 1;
          }

          .exercise-item {
            padding: 0.75rem;
            margin-bottom: 0.5rem;
            background: #2a2a2a;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
            border: 1px solid transparent;
          }

          .exercise-item:hover {
            background: #333;
            border-color: var(--primary);
          }

          .exercise-item.recent {
            border-left: 3px solid var(--primary);
          }

          .exercise-info {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
          }

          .exercise-name {
            font-weight: 500;
            color: #ffffff;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .recent-badge {
            font-size: 0.75rem;
            padding: 0.125rem 0.5rem;
            background: var(--primary);
            color: white;
            border-radius: 12px;
            font-weight: normal;
          }

          .exercise-details {
            font-size: 0.85rem;
            color: #888;
            display: flex;
            gap: 1rem;
          }

          .muscle-groups {
            color: #64b5f6;
          }

          .equipment {
            color: #81c784;
          }

          .modal-content.large {
            max-width: 800px;
            width: 90%;
          }

          @media (max-width: 768px) {
            .filter-row {
              flex-direction: column;
              gap: 0.75rem;
            }

            .filter-group {
              width: 100%;
            }

            .exercise-list-scroll {
              max-height: 300px;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default EnhancedExerciseSelector;