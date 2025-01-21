import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { preloadWorkouts } from '../utils/localStorage';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    preloadWorkouts(); // Preload workouts when the app loads
  }, []);

  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <h1>Optigains</h1>
      <p>The tool for optimal gains</p>

      <button
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#6200ea',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
        onClick={() => navigate('/workout-plan')}
      >
        Workout Plan
      </button>

      <button
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#6200ea',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
        onClick={() => navigate('/start-lift')}
      >
        Start Lift
      </button>

      <button
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#6200ea',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
        onClick={() => navigate('/calc-page')}
      >
        Weight Calculator
      </button>

      <button
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#6200ea',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
        onClick={() => navigate('/library-page')}
      >
        Exercise Library
      </button>
    </div>
  );
};

export default HomePage;
