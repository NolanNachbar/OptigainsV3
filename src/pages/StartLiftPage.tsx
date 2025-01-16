import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWorkoutForToday } from '../utils/localStorage';
import { Workout } from '../utils/types';
import HomeButton from '../components/HomeButton';

const StartLiftPage: React.FC = () => {
  const [workoutToday, setWorkoutToday] = useState<Workout | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const workout = getWorkoutForToday(today);
    setWorkoutToday(workout);
  }, []);

  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <h2>Start Your Lift</h2>
      <button
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#6200ea',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          margin: '1rem',
        }}
        onClick={() => navigate('/freestyle-lift')}
      >
        Start Freestyle Lift
      </button>
      {workoutToday ? (
        <button
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#6200ea',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            margin: '1rem',
          }}
          onClick={() => navigate('/start-programmed-lift')}
        >
          Start Programmed Lift
        </button>
      ) : (
        <p>No lift programmed for today.</p>
      )}
      <HomeButton/>
    </div>
  );
};

export default StartLiftPage;
