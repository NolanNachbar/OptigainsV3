import React from 'react';
import { useDate } from '../contexts/DateContext';

const DevDatePicker: React.FC = () => {
  const { currentDate, setCurrentDate, isDevelopment } = useDate();

  if (!isDevelopment) {
    return null;
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value + 'T00:00:00');
    setCurrentDate(newDate);
  };

  const handleReset = () => {
    localStorage.removeItem('devCurrentDate');
    setCurrentDate(new Date());
  };

  // Format date for input value (YYYY-MM-DD)
  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '140px',
      right: '20px',
      backgroundColor: '#2a2a2a',
      padding: '10px',
      borderRadius: '8px',
      border: '1px solid #444',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      color: '#c0c0c0',
      fontSize: '14px'
    }}>
      <div style={{ fontWeight: 'bold' }}>Dev Date Control</div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <label>Current:</label>
        <input
          type="date"
          value={formatDateForInput(currentDate)}
          onChange={handleDateChange}
          style={{
            backgroundColor: '#333',
            color: '#c0c0c0',
            border: '1px solid #555',
            borderRadius: '4px',
            padding: '4px 8px'
          }}
        />
      </div>
      <button
        onClick={handleReset}
        style={{
          backgroundColor: '#444',
          color: '#c0c0c0',
          border: '1px solid #555',
          borderRadius: '4px',
          padding: '4px 8px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        Reset to Today
      </button>
    </div>
  );
};

export default DevDatePicker;