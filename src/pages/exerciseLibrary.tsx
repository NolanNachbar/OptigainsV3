import React, { useState, useEffect } from 'react';
import { getConsolidatedExercises } from '../utils/localStorage';
import { Exercise } from '../utils/types';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import ActionBar from '../components/Actionbar';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const ExerciseLibrary: React.FC = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const loadExercises = () => {
    const consolidatedExercises = getConsolidatedExercises();
    setExercises(consolidatedExercises);
  };

  useEffect(() => {
    loadExercises();
    // Reload whenever localStorage is updated
    window.addEventListener('storage', loadExercises);
    return () => {
      window.removeEventListener('storage', loadExercises);
    };
  }, []);

  const handleSelectExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
  };

  const getProgressData = (exercise: Exercise) => {
    if (!exercise.logs || exercise.logs.length === 0) return null;

    const labels = exercise.logs.map(log => log.date);
    const weights = exercise.logs.map(log => log.weight);

    return {
      labels,
      datasets: [
        {
          label: 'Weight',
          data: weights,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.2,
        },
      ],
    };
  };

  return (
    <div>
      <ActionBar/>
      <h1>Exercise Library</h1>
      <ul>
        {exercises.map((exercise, index) => (
          <li key={index} onClick={() => handleSelectExercise(exercise)}>
            {exercise.name}
          </li>
        ))}
      </ul>
      {selectedExercise && (
        <div>
          <h2>{selectedExercise.name}</h2>
          {getProgressData(selectedExercise) ? (
            <Line data={getProgressData(selectedExercise)!} />
          ) : (
            <p>No data available</p>
          )}

          {/* Displaying the data points below the graph */}
          <h3>Data Points</h3>
          {selectedExercise.logs && selectedExercise.logs.length > 0 ? (
            <table style={{ width: '100%', marginTop: '1rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #ddd', padding: '0.5rem' }}>Date</th>
                  <th style={{ border: '1px solid #ddd', padding: '0.5rem' }}>Weight</th>
                  <th style={{ border: '1px solid #ddd', padding: '0.5rem' }}>Reps</th>
                  <th style={{ border: '1px solid #ddd', padding: '0.5rem' }}>Rir</th>
                </tr>
              </thead>
              <tbody>
                {selectedExercise.logs.map((log, index) => (
                  <tr key={index}>
                    <td style={{ border: '1px solid #ddd', padding: '0.5rem' }}>{log.date}</td>
                    <td style={{ border: '1px solid #ddd', padding: '0.5rem' }}>{log.weight} lbs</td>
                    <td style={{ border: '1px solid #ddd', padding: '0.5rem' }}>{log.reps}</td>
                    <td style={{ border: '1px solid #ddd', padding: '0.5rem' }}>{log.rir}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No logs available</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ExerciseLibrary;
