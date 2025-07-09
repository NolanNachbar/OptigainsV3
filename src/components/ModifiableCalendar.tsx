import React, { useState, useEffect, useRef, useCallback } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { Workout } from "../utils/types";
import {
  assignWorkoutToDate,
  getWorkoutsForDate,
  removeWorkoutFromDate,
  updateWorkoutForDate,
  loadWorkouts,
} from "../utils/SupaBase";
import { useUser } from "@clerk/clerk-react";
import EditWorkoutModal from "./EditWorkoutModal";
import "../styles/modifiable-calendar.css";

interface ModifiableCalendarProps {
  savedWorkouts: Workout[];
  onWorkoutUpdated?: () => void;
}

interface ContextMenuState {
  show: boolean;
  x: number;
  y: number;
  workout: Workout | null;
  date: string;
}

const ModifiableCalendar: React.FC<ModifiableCalendarProps> = ({
  onWorkoutUpdated,
}) => {
  const { user } = useUser();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [workoutsForMonth, setWorkoutsForMonth] = useState<Record<string, Workout[]>>({});
  const [draggedWorkout, setDraggedWorkout] = useState<{ workout: Workout; fromDate: string } | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('month');
  const [editMode, setBulkEditMode] = useState(false);
  const [selectedWorkouts, setSelectedWorkouts] = useState<{ workout: Workout; date: string }[]>([]);
  const [movingWorkout, setMovingWorkout] = useState<{ workout: Workout; fromDate: string } | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    show: false,
    x: 0,
    y: 0,
    workout: null,
    date: '',
  });
  const [editingWorkout, setEditingWorkout] = useState<{ workout: Workout; date: string } | null>(null);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swappingWorkout, setSwappingWorkout] = useState<{ workout: Workout; date: string } | null>(null);
  const [allWorkouts, setAllWorkouts] = useState<Workout[]>([]);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const fetchMonthWorkouts = useCallback(async () => {
    if (!user) return;
    
    const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    const monthWorkouts: Record<string, Workout[]> = {};
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      const workouts = await getWorkoutsForDate(null, dateStr, user);
      if (workouts.length > 0) {
        monthWorkouts[dateStr] = workouts;
      }
    }
    
    setWorkoutsForMonth(monthWorkouts);
  }, [user, selectedDate]);

  const fetchAllWorkouts = useCallback(async () => {
    if (!user) return;
    const workouts = await loadWorkouts(null, user);
    setAllWorkouts(workouts || []);
  }, [user]);

  useEffect(() => {
    fetchMonthWorkouts();
    fetchAllWorkouts();
  }, [fetchMonthWorkouts, fetchAllWorkouts]);

  useEffect(() => {
    // Close context menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu({ ...contextMenu, show: false });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [contextMenu]);

  const handleDateChange = (value: Date | Date[] | null) => {
    if (value instanceof Date) {
      setSelectedDate(value);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, workout: Workout, fromDate: string) => {
    setDraggedWorkout({ workout, fromDate });
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('dragging');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('dragging');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = async (e: React.DragEvent, toDate: Date) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    if (!draggedWorkout || !user) return;
    
    const toDateStr = toDate.toISOString().split("T")[0];
    const { workout, fromDate } = draggedWorkout;
    
    // Remove from old date
    if (fromDate !== toDateStr) {
      await removeWorkoutFromDate(null, workout.workout_name, fromDate, user);
    }
    
    // Add to new date
    await assignWorkoutToDate(null, workout.workout_name, toDateStr, user);
    await fetchMonthWorkouts();
    setDraggedWorkout(null);
  };

  // Context menu handlers
  const handleContextMenu = (e: React.MouseEvent, workout: Workout, date: string) => {
    e.preventDefault();
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      workout,
      date,
    });
  };

  const handleEditWorkout = () => {
    if (contextMenu.workout && contextMenu.date) {
      setEditingWorkout({ workout: contextMenu.workout, date: contextMenu.date });
    }
    setContextMenu({ ...contextMenu, show: false });
  };

  const handleSwapWorkout = () => {
    if (contextMenu.workout && contextMenu.date) {
      setSwappingWorkout({ workout: contextMenu.workout, date: contextMenu.date });
      setShowSwapModal(true);
    }
    setContextMenu({ ...contextMenu, show: false });
  };

  const handleDeleteWorkout = async () => {
    if (contextMenu.workout && contextMenu.date && user) {
      await removeWorkoutFromDate(null, contextMenu.workout.workout_name, contextMenu.date, user);
      await fetchMonthWorkouts();
    }
    setContextMenu({ ...contextMenu, show: false });
  };

  const handleCopyWorkout = async () => {
    if (contextMenu.workout && user) {
      // Store in clipboard (simplified - in real app use proper clipboard API)
      localStorage.setItem('copiedWorkout', JSON.stringify(contextMenu.workout));
      alert('Workout copied! Right-click on another date to paste.');
    }
    setContextMenu({ ...contextMenu, show: false });
  };

  const handlePasteWorkout = async (date: string) => {
    const copiedWorkout = localStorage.getItem('copiedWorkout');
    if (copiedWorkout && user) {
      const workout = JSON.parse(copiedWorkout);
      await assignWorkoutToDate(null, workout.workout_name, date, user);
      await fetchMonthWorkouts();
    }
  };

  // Bulk edit handlers
  const toggleWorkoutSelection = (workout: Workout, date: string) => {
    const isSelected = selectedWorkouts.some(
      w => w.workout.workout_name === workout.workout_name && w.date === date
    );
    
    if (isSelected) {
      setSelectedWorkouts(selectedWorkouts.filter(
        w => !(w.workout.workout_name === workout.workout_name && w.date === date)
      ));
    } else {
      setSelectedWorkouts([...selectedWorkouts, { workout, date }]);
    }
  };

  const handleBulkDelete = async () => {
    if (!user || selectedWorkouts.length === 0) return;
    
    const confirmDelete = window.confirm(
      `Delete ${selectedWorkouts.length} selected workouts?`
    );
    
    if (confirmDelete) {
      for (const { workout, date } of selectedWorkouts) {
        await removeWorkoutFromDate(null, workout.workout_name, date, user);
      }
      await fetchMonthWorkouts();
      setSelectedWorkouts([]);
      setBulkEditMode(false);
    }
  };

  // TODO: Implement bulk move functionality
  // const handleBulkMove = async (targetDate: Date) => {
  //   if (!user || selectedWorkouts.length === 0) return;
  //   
  //   const targetDateStr = targetDate.toISOString().split("T")[0];
  //   
  //   for (const { workout, date } of selectedWorkouts) {
  //     await removeWorkoutFromDate(null, workout.workout_name, date, user);
  //     await assignWorkoutToDate(null, workout.workout_name, targetDateStr, user);
  //   }
  //   
  //   await fetchMonthWorkouts();
  //   setSelectedWorkouts([]);
  //   setBulkEditMode(false);
  // };

  const handleSwapConfirm = async (newWorkout: Workout) => {
    if (!swappingWorkout || !user) return;
    
    const { workout: oldWorkout, date } = swappingWorkout;
    
    // Remove old workout
    await removeWorkoutFromDate(null, oldWorkout.workout_name, date, user);
    
    // Add new workout
    await assignWorkoutToDate(null, newWorkout.workout_name, date, user);
    
    await fetchMonthWorkouts();
    setShowSwapModal(false);
    setSwappingWorkout(null);
  };

  const handleTileClick = async (date: Date) => {
    if (movingWorkout && user) {
      const toDateStr = date.toISOString().split("T")[0];
      const { workout, fromDate } = movingWorkout;
      
      // Don't move to the same date
      if (fromDate === toDateStr) {
        setMovingWorkout(null);
        return;
      }
      
      // Remove from old date
      await removeWorkoutFromDate(null, workout.workout_name, fromDate, user);
      
      // Add to new date
      await assignWorkoutToDate(null, workout.workout_name, toDateStr, user);
      
      // Refresh and clear moving state
      await fetchMonthWorkouts();
      setMovingWorkout(null);
      
      // Show success feedback (optional)
      onWorkoutUpdated?.();
    }
  };

  const handleWorkoutClick = (workout: Workout, date: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (editMode) {
      toggleWorkoutSelection(workout, date);
    } else if (movingWorkout) {
      // If clicking the same workout that's being moved, cancel the move
      if (movingWorkout.workout.workout_name === workout.workout_name && movingWorkout.fromDate === date) {
        setMovingWorkout(null);
      } else {
        // Otherwise, select this new workout to move
        setMovingWorkout({ workout, fromDate: date });
      }
    } else {
      // Start moving this workout
      setMovingWorkout({ workout, fromDate: date });
    }
  };

  const renderTileContent = ({ date }: { date: Date }) => {
    const dateStr = date.toISOString().split("T")[0];
    const workouts = workoutsForMonth[dateStr] || [];
    const copiedWorkout = localStorage.getItem('copiedWorkout');

    return (
      <div
        className={`calendar-tile-content ${movingWorkout ? 'move-mode' : ''}`}
        onClick={() => handleTileClick(date)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, date)}
        onContextMenu={(e) => {
          if (workouts.length === 0 && copiedWorkout) {
            e.preventDefault();
            setContextMenu({
              show: true,
              x: e.clientX,
              y: e.clientY,
              workout: null,
              date: dateStr,
            });
          }
        }}
      >
        {workouts.map((workout, index) => {
          const isSelected = editMode && selectedWorkouts.some(
            w => w.workout.workout_name === workout.workout_name && w.date === dateStr
          );
          const isMoving = movingWorkout && 
            movingWorkout.workout.workout_name === workout.workout_name && 
            movingWorkout.fromDate === dateStr;
          
          return (
            <div
              key={index}
              className={`workout-pill ${isSelected ? 'selected' : ''} ${isMoving ? 'moving' : ''}`}
              draggable={!editMode && !movingWorkout}
              onDragStart={(e) => !movingWorkout && handleDragStart(e, workout, dateStr)}
              onDragEnd={handleDragEnd}
              onContextMenu={(e) => handleContextMenu(e, workout, dateStr)}
              onClick={(e) => handleWorkoutClick(workout, dateStr, e)}
              style={{ backgroundColor: getWorkoutColor(workout.workout_name) }}
              title={isMoving ? "Click on a date to move this workout" : workout.workout_name}
            >
              {workout.workout_name}
            </div>
          );
        })}
      </div>
    );
  };

  const getWorkoutColor = (name: string): string => {
    const colors = ['#3498db', '#e74c3c', '#f39c12', '#27ae60', '#9b59b6', '#1abc9c'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="modifiable-calendar">
      <div className="calendar-header">
        <div className="view-controls">
          <button
            className={viewMode === 'month' ? 'active' : ''}
            onClick={() => setViewMode('month')}
          >
            Month
          </button>
          <button
            className={viewMode === 'week' ? 'active' : ''}
            onClick={() => setViewMode('week')}
          >
            Week
          </button>
          <button
            className={viewMode === 'list' ? 'active' : ''}
            onClick={() => setViewMode('list')}
          >
            List
          </button>
        </div>
        
        <div className="edit-controls">
          {movingWorkout && (
            <div className="moving-indicator">
              <span>Moving: <strong>{movingWorkout.workout.workout_name}</strong></span>
              <button onClick={() => setMovingWorkout(null)} className="cancel-move-btn">
                Cancel
              </button>
            </div>
          )}
          
          <button
            className={`edit-mode-btn ${editMode ? 'active' : ''}`}
            onClick={() => {
              setBulkEditMode(!editMode);
              setSelectedWorkouts([]);
              setMovingWorkout(null);
            }}
          >
            {editMode ? 'Exit Edit Mode' : 'Edit Mode'}
          </button>
          
          {editMode && selectedWorkouts.length > 0 && (
            <div className="bulk-actions">
              <span>{selectedWorkouts.length} selected</span>
              <button onClick={handleBulkDelete} className="delete-btn">
                Delete Selected
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="calendar-content">
        {viewMode === 'month' && (
          <Calendar
            onChange={handleDateChange}
            value={selectedDate}
            tileContent={renderTileContent}
            className="custom-calendar"
          />
        )}
      </div>

      {/* Context Menu */}
      {contextMenu.show && (
        <div
          ref={contextMenuRef}
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          {contextMenu.workout ? (
            <>
              <button onClick={handleEditWorkout}>Edit Workout</button>
              <button onClick={handleSwapWorkout}>Swap with Another</button>
              <button onClick={handleCopyWorkout}>Copy</button>
              <button onClick={handleDeleteWorkout}>Delete</button>
            </>
          ) : (
            <button onClick={() => handlePasteWorkout(contextMenu.date)}>
              Paste Workout
            </button>
          )}
        </div>
      )}

      {/* Edit Workout Modal */}
      {editingWorkout && (
        <EditWorkoutModal
          workout={editingWorkout.workout}
          date={editingWorkout.date}
          onSave={async (updatedWorkout) => {
            await updateWorkoutForDate(
              null,
              editingWorkout.workout.workout_name,
              editingWorkout.date,
              updatedWorkout,
              user!
            );
            await fetchMonthWorkouts();
            setEditingWorkout(null);
            onWorkoutUpdated?.();
          }}
          onClose={() => setEditingWorkout(null)}
        />
      )}

      {/* Swap Workout Modal */}
      {showSwapModal && swappingWorkout && (
        <div className="modal-overlay" onClick={() => setShowSwapModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Swap Workout</h2>
            <p>Current: {swappingWorkout.workout.workout_name}</p>
            <div className="workout-list">
              {allWorkouts
                .filter(w => w.workout_name !== swappingWorkout.workout.workout_name)
                .map((workout) => (
                  <button
                    key={workout.workout_name}
                    className="workout-option"
                    onClick={() => handleSwapConfirm(workout)}
                  >
                    {workout.workout_name}
                  </button>
                ))}
            </div>
            <button onClick={() => setShowSwapModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModifiableCalendar;