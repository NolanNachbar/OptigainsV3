import React from 'react';
import { useNavigate } from 'react-router-dom'; 
import OptigainDumbell from '../assets/react3.svg'; 

const ActionBar: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.5rem 1.5rem',  // Adjust padding for a smaller bar
        backgroundColor: '#333',
        color: '#fff',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000, // Keeps it on top
      }}
    >
      {/* SVG Icon with onClick to navigate to home */}
      <img 
        src={OptigainDumbell} 
        alt="Optigain Dumbell Logo" 
        style={{
          width: '30px',  // Scale down the icon
          height: '30px', // Scale down the icon
          marginRight: '1rem',  // Space between icon and app name
          cursor: 'pointer',  // Make it look clickable
        }} 
        onClick={() => navigate('/')}  // Navigate to home on click
      />

      {/* App Name */}
      <h1 style={{
        margin: 0, 
        fontSize: '1.25rem', // Reduce font size of app name
        fontWeight: 'normal',  // Optional: makes it less bold if needed
      }}>
        Optigains
      </h1>
    </div>
  );
};

export default ActionBar;
