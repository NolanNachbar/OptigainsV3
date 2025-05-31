import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { Workout, TrainingBlock } from "../utils/types";
import {
  assignWorkoutToDate,
  getWorkoutsForDate,
  removeWorkoutFromDate,
} from "../utils/localStorageDB";
import { getCurrentTrainingBlock } from "../utils/trainingBlocks";
import EditWorkoutComponent from "./EditWorkout";
import { useUser } from "@clerk/clerk-react";

interface CalendarProps {
  savedWorkouts: Workout[];
  onRemoveWorkout: (workout: Workout) => void;
  onWorkoutAdded?: (workout: Workout) => void;
}

const ImprovedCalendar: React.FC<CalendarProps> = ({
  savedWorkouts = [],
}) => {
  const { user } = useUser();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [workoutsForMonth, setWorkoutsForMonth] = useState<Record<string, Workout[]>>({});
  const [draggedWorkout, setDraggedWorkout] = useState<Workout | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('month');
  const [search, setSearch] = useState<string>("");
  const [showWorkoutDetails, setShowWorkoutDetails] = useState<{ workout: Workout; date: string } | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [currentTrainingBlock, setCurrentTrainingBlock] = useState<TrainingBlock | null>(null);
  const [selectedWorkouts, setSelectedWorkouts] = useState<Workout[]>([]);
  const [bulkAssignMode, setBulkAssignMode] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    // Load current training block
    const block = getCurrentTrainingBlock();
    setCurrentTrainingBlock(block);
    
    fetchMonthWorkouts();
  }, [user, selectedDate]);

  const fetchMonthWorkouts = async () => {
    if (!user) return;
    
    const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    const monthWorkouts: Record<string, Workout[]> = {};
    
    // Fetch workouts for each day of the month
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      const workouts = await getWorkoutsForDate(null, dateStr, user);
      if (workouts.length > 0) {
        monthWorkouts[dateStr] = workouts;
      }
    }
    
    setWorkoutsForMonth(monthWorkouts);
  };

  const handleDateChange = (value: Date | Date[] | null) => {
    if (value instanceof Date) {
      setSelectedDate(value);
    }
  };

  const handleDragStart = (e: React.DragEvent, workout: Workout) => {
    setDraggedWorkout(workout);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = async (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    if (!draggedWorkout || !user) return;
    
    const dateStr = date.toISOString().split("T")[0];
    await assignWorkoutToDate(null, draggedWorkout.workout_name, dateStr, user);
    await fetchMonthWorkouts();
    setDraggedWorkout(null);
  };

  const handleRemoveWorkoutFromDate = async (workout: Workout, date: string) => {
    if (!user) return;
    
    await removeWorkoutFromDate(null, workout.workout_name, date, user);
    await fetchMonthWorkouts();
  };

  const handleQuickAdd = async (workout: Workout) => {
    if (!user) return;
    
    const dateStr = selectedDate.toISOString().split("T")[0];
    await assignWorkoutToDate(null, workout.workout_name, dateStr, user);
    await fetchMonthWorkouts();
    setShowQuickAdd(false);
  };

  const handleBulkAssign = async () => {
    if (!user || selectedWorkouts.length === 0 || selectedDates.length === 0) return;
    
    for (const date of selectedDates) {
      for (const workout of selectedWorkouts) {
        await assignWorkoutToDate(null, workout.workout_name, date, user);
      }
    }
    
    await fetchMonthWorkouts();
    setSelectedWorkouts([]);
    setSelectedDates([]);
    setBulkAssignMode(false);
  };

  const toggleDateSelection = (dateStr: string) => {
    setSelectedDates(prev => 
      prev.includes(dateStr) 
        ? prev.filter(d => d !== dateStr)
        : [...prev, dateStr]
    );
  };

  const toggleWorkoutSelection = (workout: Workout) => {
    setSelectedWorkouts(prev => 
      prev.some(w => w.workout_name === workout.workout_name)
        ? prev.filter(w => w.workout_name !== workout.workout_name)
        : [...prev, workout]
    );
  };

  const filteredWorkouts = savedWorkouts.filter((workout) =>
    workout.workout_name.toLowerCase().includes(search.toLowerCase())
  );

  const getWorkoutTypeColor = (workoutName: string): string => {
    const name = workoutName.toLowerCase();
    if (name.includes('push')) return '#4CAF50';
    if (name.includes('pull')) return '#2196F3';
    if (name.includes('legs')) return '#FF9800';
    if (name.includes('upper')) return '#FF5722';
    if (name.includes('lower')) return '#E64A19';
    if (name.includes('full') || name.includes('fb')) return '#9C27B0';
    return '#757575';
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      weekDays.push(day);
    }

    return (
      <div className="week-view">
        {weekDays.map(day => {
          const dateStr = day.toISOString().split("T")[0];
          const dayWorkouts = workoutsForMonth[dateStr] || [];
          
          return (
            <div key={dateStr} className="week-day">
              <div className="week-day-header">
                <span className="day-name">{day.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                <span className="day-number">{day.getDate()}</span>
              </div>
              <div 
                className="week-day-content"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, day)}
              >
                {dayWorkouts.map((workout, index) => (
                  <div
                    key={index}
                    className="week-workout-item"
                    style={{ borderLeft: `3px solid ${getWorkoutTypeColor(workout.workout_name)}` }}
                    onClick={() => setShowWorkoutDetails({ workout, date: dateStr })}
                  >
                    <span>{workout.workout_name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveWorkoutFromDate(workout, dateStr);
                      }}
                      className="remove-btn"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderTileContent = ({ date }: { date: Date }) => {
    const dateStr = date.toISOString().split("T")[0];
    const dayWorkouts = workoutsForMonth[dateStr] || [];
    
    if (dayWorkouts.length === 0) return null;
    
    return (
      <div className="tile-workouts">
        {dayWorkouts.slice(0, 2).map((workout, index) => (
          <div
            key={index}
            className="tile-workout-dot"
            style={{ backgroundColor: getWorkoutTypeColor(workout.workout_name) }}
            title={workout.workout_name}
          />
        ))}
        {dayWorkouts.length > 2 && (
          <span className="more-workouts">+{dayWorkouts.length - 2}</span>
        )}
      </div>
    );
  };

  return (
    <div className="improved-calendar-container">
      <div className="calendar-header">
        <div className="view-controls">
          <button 
            className={`view-btn ${viewMode === 'month' ? 'active' : ''}`}
            onClick={() => setViewMode('month')}
          >
            Month
          </button>
          <button 
            className={`view-btn ${viewMode === 'week' ? 'active' : ''}`}
            onClick={() => setViewMode('week')}
          >
            Week
          </button>
          <button 
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            List
          </button>
        </div>
        
        <div className="calendar-actions">
          <button 
            className="action-btn primary"
            onClick={() => setShowQuickAdd(!showQuickAdd)}
          >
            Quick Add
          </button>
          <button 
            className={`action-btn ${bulkAssignMode ? 'active' : ''}`}
            onClick={() => setBulkAssignMode(!bulkAssignMode)}
          >
            Bulk Assign
          </button>
          <button 
            className="action-btn help"
            onClick={() => setShowHelp(true)}
            title="Help & Instructions"
          >
            ?
          </button>
        </div>
      </div>

      {currentTrainingBlock && (
        <div className="training-block-info">
          <div className="block-indicator">
            <span className="block-name">{currentTrainingBlock.name}</span>
            <span className="block-week">Week {currentTrainingBlock.currentWeek} of {currentTrainingBlock.duration}</span>
          </div>
        </div>
      )}

      <div className="calendar-content">
        <div className="calendar-main">
          {viewMode === 'month' && (
            <Calendar
              onChange={(value) => {
                if (value instanceof Date) {
                  handleDateChange(value);
                } else if (Array.isArray(value) && value[0] instanceof Date) {
                  handleDateChange(value[0]);
                }
              }}
              value={selectedDate}
              onClickDay={(date) => {
                if (bulkAssignMode) {
                  toggleDateSelection(date.toISOString().split("T")[0]);
                } else {
                  setSelectedDate(date);
                }
              }}
              tileContent={renderTileContent}
              tileClassName={({ date }) => {
                const dateStr = date.toISOString().split("T")[0];
                const classes = [];
                
                if (workoutsForMonth[dateStr]?.length > 0) {
                  classes.push('has-workouts');
                }
                
                if (selectedDates.includes(dateStr)) {
                  classes.push('bulk-selected');
                }
                
                return classes.join(' ');
              }}
            />
          )}
          
          {viewMode === 'week' && renderWeekView()}
          
          {viewMode === 'list' && (
            <div className="list-view">
              <h3>Upcoming Workouts</h3>
              {Object.entries(workoutsForMonth)
                .sort(([a], [b]) => a.localeCompare(b))
                .slice(0, 14) // Show next 2 weeks
                .map(([dateStr, workouts]) => (
                  <div key={dateStr} className="list-day">
                    <div className="list-day-header">
                      {new Date(dateStr).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                    {workouts.map((workout, index) => (
                      <div 
                        key={index} 
                        className="list-workout"
                        style={{ borderLeft: `3px solid ${getWorkoutTypeColor(workout.workout_name)}` }}
                      >
                        <span>{workout.workout_name}</span>
                        <button 
                          onClick={() => handleRemoveWorkoutFromDate(workout, dateStr)}
                          className="remove-btn"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="calendar-sidebar">
          <div className="sidebar-section">
            <h3>Workout Library</h3>
            <input
              type="text"
              placeholder="Search workouts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            
            {bulkAssignMode && (
              <div className="bulk-assign-controls">
                <p className="bulk-info">
                  {selectedWorkouts.length} workouts × {selectedDates.length} dates selected
                </p>
                {selectedWorkouts.length > 0 && selectedDates.length > 0 && (
                  <button onClick={handleBulkAssign} className="action-btn primary">
                    Assign Selected
                  </button>
                )}
              </div>
            )}
            
            <div className="workout-list">
              {filteredWorkouts.map((workout, index) => (
                <div
                  key={index}
                  className={`workout-item ${
                    bulkAssignMode && selectedWorkouts.some(w => w.workout_name === workout.workout_name) 
                      ? 'selected' 
                      : ''
                  }`}
                  draggable={!bulkAssignMode}
                  onDragStart={(e) => handleDragStart(e, workout)}
                  onClick={() => {
                    if (bulkAssignMode) {
                      toggleWorkoutSelection(workout);
                    } else if (showQuickAdd) {
                      handleQuickAdd(workout);
                    }
                  }}
                  style={{ borderLeft: `3px solid ${getWorkoutTypeColor(workout.workout_name)}` }}
                >
                  <div className="workout-name">{workout.workout_name}</div>
                  <div className="workout-exercises">{workout.exercises.length} exercises</div>
                </div>
              ))}
            </div>
          </div>

          {selectedDate && !bulkAssignMode && (
            <div className="sidebar-section">
              <h3>{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
              <div className="selected-date-workouts">
                {(workoutsForMonth[selectedDate.toISOString().split("T")[0]] || []).map((workout, index) => (
                  <div 
                    key={index} 
                    className="scheduled-workout"
                    style={{ borderLeft: `3px solid ${getWorkoutTypeColor(workout.workout_name)}` }}
                  >
                    <div className="workout-info">
                      <div className="workout-name">{workout.workout_name}</div>
                      <div className="workout-exercises">
                        {workout.exercises.map((ex) => ex.name).join(', ')}
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRemoveWorkoutFromDate(workout, selectedDate.toISOString().split("T")[0])}
                      className="remove-btn"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {(workoutsForMonth[selectedDate.toISOString().split("T")[0]] || []).length === 0 && (
                  <p className="no-workouts">No workouts scheduled. Drag a workout here to add it.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showWorkoutDetails && (
        <div className="workout-modal-overlay" onClick={() => setShowWorkoutDetails(null)}>
          <div className="workout-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{showWorkoutDetails.workout.workout_name}</h2>
              <button onClick={() => setShowWorkoutDetails(null)} className="close-btn">×</button>
            </div>
            <EditWorkoutComponent
              savedWorkout={showWorkoutDetails.workout}
              onUpdateWorkout={async () => {
                await fetchMonthWorkouts();
                setShowWorkoutDetails(null);
              }}
            />
          </div>
        </div>
      )}

      {showHelp && (
        <div className="help-modal-overlay" onClick={() => setShowHelp(false)}>
          <div className="help-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Calendar Instructions</h2>
              <button onClick={() => setShowHelp(false)} className="close-btn">×</button>
            </div>
            
            <div className="help-content">
              <div className="help-section">
                <h3>Quick Start</h3>
                <ul>
                  <li><strong>Add a workout:</strong> Drag any workout from the right sidebar onto a calendar day</li>
                  <li><strong>Remove a workout:</strong> Click the × button on any scheduled workout</li>
                  <li><strong>View workout details:</strong> Click on any scheduled workout to see full details</li>
                </ul>
              </div>

              <div className="help-section">
                <h3>View Modes</h3>
                <ul>
                  <li><strong>Month View:</strong> See your entire month at a glance with color-coded workout indicators</li>
                  <li><strong>Week View:</strong> Detailed 7-day view with all workouts visible</li>
                  <li><strong>List View:</strong> See your next 2 weeks of workouts in a simple list</li>
                </ul>
              </div>

              <div className="help-section">
                <h3>Features</h3>
                
                <h4>Quick Add Mode</h4>
                <ol>
                  <li>Click the "Quick Add" button to enable</li>
                  <li>Select a date on the calendar</li>
                  <li>Click any workout in the sidebar to instantly add it</li>
                  <li>No dragging required!</li>
                </ol>

                <h4>Bulk Assign Mode</h4>
                <ol>
                  <li>Click "Bulk Assign" to enable</li>
                  <li>Click multiple dates on the calendar (they'll turn blue)</li>
                  <li>Click workouts in the sidebar to select them</li>
                  <li>Click "Assign Selected" to add all workouts to all dates</li>
                  <li>Perfect for setting up recurring workouts!</li>
                </ol>

                <h4>Drag & Drop</h4>
                <ul>
                  <li>Click and hold any workout in the sidebar</li>
                  <li>Drag it over to any day on the calendar</li>
                  <li>Release to schedule the workout</li>
                  <li>Works in both Month and Week views</li>
                </ul>
              </div>

              <div className="help-section">
                <h3>Color Coding</h3>
                <ul>
                  <li><span style={{color: '#4CAF50'}}>● Green</span> = Push workouts</li>
                  <li><span style={{color: '#2196F3'}}>● Blue</span> = Pull workouts</li>
                  <li><span style={{color: '#FF9800'}}>● Orange</span> = Legs workouts</li>
                  <li><span style={{color: '#FF5722'}}>● Red-Orange</span> = Upper body</li>
                  <li><span style={{color: '#E64A19'}}>● Deep Orange</span> = Lower body</li>
                  <li><span style={{color: '#9C27B0'}}>● Purple</span> = Full body</li>
                  <li><span style={{color: '#757575'}}>● Gray</span> = Other workouts</li>
                </ul>
              </div>

              <div className="help-section">
                <h3>Pro Tips</h3>
                <ul>
                  <li><strong>Search workouts:</strong> Use the search box to quickly find specific workouts</li>
                  <li><strong>Training blocks:</strong> Your current training block and week are shown at the top</li>
                  <li><strong>Multiple workouts:</strong> You can schedule multiple workouts on the same day</li>
                  <li><strong>Calendar dots:</strong> Colored dots show workout types at a glance</li>
                  <li><strong>Today highlight:</strong> Today's date has a blue border for easy reference</li>
                </ul>
              </div>

              <div className="help-section">
                <h3>Keyboard Shortcuts</h3>
                <ul>
                  <li><strong>Esc:</strong> Close any open modal</li>
                  <li><strong>Arrow keys:</strong> Navigate calendar dates</li>
                </ul>
              </div>
            </div>

            <div className="help-footer">
              <button onClick={() => setShowHelp(false)} className="action-btn primary">
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .improved-calendar-container {
          background: #1e1e1e;
          border-radius: 12px;
          padding: 1.5rem;
          color: #ffffff;
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .view-controls {
          display: flex;
          gap: 0.5rem;
        }

        .view-btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          background: #2a2a2a;
          color: #b0b0b0;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .view-btn:hover {
          background: #333333;
          color: #ffffff;
        }

        .view-btn.active {
          background: #2196F3;
          color: white;
        }

        .calendar-actions {
          display: flex;
          gap: 0.5rem;
        }

        .action-btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          background: #404040;
          color: #ffffff;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-btn:hover {
          background: #555555;
        }

        .action-btn.primary {
          background: #2196F3;
        }

        .action-btn.primary:hover {
          background: #1976D2;
        }

        .action-btn.active {
          background: #4CAF50;
        }

        .action-btn.help {
          width: 36px;
          height: 36px;
          padding: 0;
          border-radius: 50%;
          font-weight: bold;
          background: #1a237e;
          border: 1px solid #2196F3;
        }

        .action-btn.help:hover {
          background: #2196F3;
        }

        .training-block-info {
          background: #2a2a2a;
          border: 1px solid #404040;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1.5rem;
        }

        .block-indicator {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .block-name {
          font-weight: 600;
          color: #2196F3;
        }

        .block-week {
          color: #b0b0b0;
          font-size: 0.9rem;
        }

        .calendar-content {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 2rem;
        }

        .calendar-main {
          background: #2a2a2a;
          border-radius: 8px;
          padding: 1rem;
        }

        /* Enhanced Calendar Styles */
        .react-calendar {
          width: 100%;
          background: transparent;
          border: none;
          color: #ffffff;
        }

        .react-calendar__tile {
          position: relative;
          height: 80px;
          background: #1e1e1e;
          border: 1px solid #404040;
          color: #ffffff;
          display: flex;
          flex-direction: column;
          padding: 0.5rem;
        }

        .react-calendar__tile:hover {
          background: #333333;
        }

        .react-calendar__tile--now {
          background: #1a237e;
          border-color: #2196F3;
        }

        .react-calendar__tile.has-workouts {
          border-color: #4CAF50;
        }

        .react-calendar__tile.bulk-selected {
          background: #2196F3;
          border-color: #1976D2;
        }

        .tile-workouts {
          display: flex;
          gap: 0.25rem;
          margin-top: 0.5rem;
          align-items: center;
        }

        .tile-workout-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .more-workouts {
          font-size: 0.7rem;
          color: #b0b0b0;
        }

        /* Week View */
        .week-view {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 1rem;
        }

        .week-day {
          background: #1e1e1e;
          border-radius: 8px;
          overflow: hidden;
        }

        .week-day-header {
          background: #333333;
          padding: 0.75rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .day-name {
          font-weight: 600;
        }

        .day-number {
          background: #404040;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
        }

        .week-day-content {
          padding: 0.75rem;
          min-height: 200px;
        }

        .week-workout-item {
          background: #2a2a2a;
          border-radius: 6px;
          padding: 0.5rem;
          margin-bottom: 0.5rem;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.2s ease;
        }

        .week-workout-item:hover {
          background: #333333;
        }

        /* List View */
        .list-view {
          max-height: 600px;
          overflow-y: auto;
        }

        .list-day {
          margin-bottom: 1.5rem;
        }

        .list-day-header {
          font-weight: 600;
          font-size: 1.1rem;
          margin-bottom: 0.5rem;
          color: #2196F3;
        }

        .list-workout {
          background: #1e1e1e;
          border-radius: 6px;
          padding: 0.75rem;
          margin-bottom: 0.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        /* Sidebar */
        .calendar-sidebar {
          background: #2a2a2a;
          border-radius: 8px;
          padding: 1rem;
          height: fit-content;
          max-height: 80vh;
          overflow-y: auto;
        }

        .sidebar-section {
          margin-bottom: 2rem;
        }

        .sidebar-section h3 {
          margin: 0 0 1rem 0;
          color: #ffffff;
        }

        .search-input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #404040;
          border-radius: 6px;
          background: #1e1e1e;
          color: #ffffff;
          margin-bottom: 1rem;
        }

        .bulk-assign-controls {
          background: #1a2332;
          border: 1px solid #2196F3;
          border-radius: 6px;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .bulk-info {
          margin: 0 0 0.5rem 0;
          color: #64b5f6;
        }

        .workout-list {
          max-height: 400px;
          overflow-y: auto;
        }

        .workout-item {
          background: #1e1e1e;
          border-radius: 6px;
          padding: 0.75rem;
          margin-bottom: 0.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .workout-item:hover {
          background: #333333;
        }

        .workout-item.selected {
          background: #2196F3;
          border-color: #1976D2;
        }

        .workout-name {
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .workout-exercises {
          font-size: 0.85rem;
          color: #b0b0b0;
        }

        .selected-date-workouts {
          margin-top: 1rem;
        }

        .scheduled-workout {
          background: #1e1e1e;
          border-radius: 6px;
          padding: 0.75rem;
          margin-bottom: 0.5rem;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .workout-info {
          flex: 1;
        }

        .no-workouts {
          color: #888888;
          font-style: italic;
          text-align: center;
          padding: 2rem;
        }

        .remove-btn {
          background: #f44336;
          color: white;
          border: none;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.8rem;
        }

        .remove-btn:hover {
          background: #d32f2f;
        }

        /* Modal */
        .workout-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .workout-modal {
          background: #1e1e1e;
          border-radius: 12px;
          padding: 2rem;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
          color: #ffffff;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .modal-header h2 {
          margin: 0;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 2rem;
          color: #888888;
          cursor: pointer;
        }

        .close-btn:hover {
          color: #ffffff;
        }

        /* Help Modal */
        .help-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .help-modal {
          background: #1e1e1e;
          border-radius: 12px;
          padding: 2rem;
          max-width: 700px;
          max-height: 85vh;
          overflow-y: auto;
          color: #ffffff;
          border: 1px solid #404040;
        }

        .help-content {
          margin: 1.5rem 0;
        }

        .help-section {
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #404040;
        }

        .help-section:last-child {
          border-bottom: none;
        }

        .help-section h3 {
          color: #2196F3;
          margin-bottom: 1rem;
          font-size: 1.3rem;
        }

        .help-section h4 {
          color: #ffffff;
          margin: 1rem 0 0.5rem 0;
          font-size: 1.1rem;
        }

        .help-section ul, .help-section ol {
          margin: 0;
          padding-left: 1.5rem;
        }

        .help-section li {
          margin-bottom: 0.5rem;
          line-height: 1.6;
          color: #e0e0e0;
        }

        .help-section strong {
          color: #ffffff;
        }

        .help-footer {
          margin-top: 2rem;
          text-align: center;
        }

        @media (max-width: 1024px) {
          .calendar-content {
            grid-template-columns: 1fr;
          }

          .calendar-sidebar {
            max-height: none;
          }

          .week-view {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .calendar-header {
            flex-direction: column;
            gap: 1rem;
          }

          .view-controls,
          .calendar-actions {
            width: 100%;
            justify-content: center;
          }

          .react-calendar__tile {
            height: 60px;
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ImprovedCalendar;