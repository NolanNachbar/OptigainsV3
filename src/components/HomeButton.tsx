import React from 'react';
import { useNavigate } from 'react-router-dom';

const HomeButton: React.FC = () => {
  const navigate = useNavigate();

  return (
    <button
      style={{
        padding: '0.5rem 1rem',
        backgroundColor: '#007bff',
        color: '#fff',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
      }}
      onClick={() => navigate('/')}
    >
      Home
    </button>
  );
};

export default HomeButton;
