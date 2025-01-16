import React from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <h1>Welcome to the Lifting App</h1>
      <p>Your journey to better fitness starts here!</p>

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
        onClick={() => navigate('/exercise-library')}
      >
        Exercise Library
      </button>
    </div>
  );
};

export default HomePage;
