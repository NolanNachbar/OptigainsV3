import { Exercise, Workout, bodyWeight } from './types';
import { loadWorkouts, getConsolidatedExercises } from './localStorageDB';
import { UserResource } from '@clerk/types';

interface ExportData {
  exportDate: string;
  userData: {
    userId: string;
    email?: string;
  };
  exercises: Exercise[];
  workouts: Workout[];
  bodyWeightLogs: bodyWeight[];
}

// Convert data to CSV format
export const convertToCSV = (data: any[], headers: string[]): string => {
  const csvHeaders = headers.join(',');
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      // Handle nested objects or arrays
      if (typeof value === 'object') {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      // Escape quotes and wrap in quotes if contains comma
      const stringValue = String(value ?? '');
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',');
  });
  
  return [csvHeaders, ...csvRows].join('\n');
};

// Export exercise logs as CSV
export const exportExerciseLogsCSV = async (user: UserResource) => {
  const exercises = await getConsolidatedExercises(null, user);
  
  // Flatten exercise logs for CSV
  const flattenedLogs: any[] = [];
  exercises.forEach(exercise => {
    if (exercise.logs) {
      exercise.logs.forEach(log => {
        flattenedLogs.push({
          exerciseName: exercise.name,
          date: new Date(log.date).toLocaleDateString(),
          weight: log.weight,
          reps: log.reps,
          rir: log.rir,
        });
      });
    }
  });
  
  const headers = ['exerciseName', 'date', 'weight', 'reps', 'rir'];
  const csv = convertToCSV(flattenedLogs, headers);
  
  downloadFile(csv, `exercise-logs-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
};

// Export workouts as CSV
export const exportWorkoutsCSV = async (user: UserResource) => {
  const workouts = await loadWorkouts(null, user);
  
  // Flatten workouts for CSV
  const flattenedWorkouts: any[] = [];
  workouts.forEach(workout => {
    workout.exercises.forEach(exercise => {
      exercise.sets.forEach((set, index) => {
        flattenedWorkouts.push({
          workoutName: workout.workout_name,
          exerciseName: exercise.name,
          setNumber: index + 1,
          weight: set.weight,
          reps: set.reps,
          rir: set.rir,
          assignedDays: workout.assigned_days.join('; '),
        });
      });
    });
  });
  
  const headers = ['workoutName', 'exerciseName', 'setNumber', 'weight', 'reps', 'rir', 'assignedDays'];
  const csv = convertToCSV(flattenedWorkouts, headers);
  
  downloadFile(csv, `workout-templates-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
};

// Export all data as JSON
export const exportAllDataJSON = async (user: UserResource) => {
  const exercises = await getConsolidatedExercises(null, user);
  const workouts = await loadWorkouts(null, user);
  // TODO: Add body weight logs when function is available
  const bodyWeightLogs: bodyWeight[] = [];
  
  const exportData: ExportData = {
    exportDate: new Date().toISOString(),
    userData: {
      userId: user.id,
      email: user.primaryEmailAddress?.emailAddress,
    },
    exercises,
    workouts,
    bodyWeightLogs,
  };
  
  const json = JSON.stringify(exportData, null, 2);
  downloadFile(json, `optigains-backup-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
};

// Export body weight logs as CSV
export const exportBodyWeightCSV = async (_user: UserResource) => {
  // TODO: Implement when body weight log function is available
  console.warn('Body weight export not yet implemented');
  alert('Body weight export feature coming soon!');
};

// Helper function to download file
const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Generate workout summary for sharing
export const generateWorkoutSummary = (workout: Workout): string => {
  let summary = `🏋️ ${workout.workout_name}\n\n`;
  
  workout.exercises.forEach(exercise => {
    summary += `📌 ${exercise.name}\n`;
    exercise.sets.forEach((set, index) => {
      if (set.isLogged) {
        summary += `   Set ${index + 1}: ${set.weight}lbs × ${set.reps} reps @RIR${set.rir}\n`;
      }
    });
    summary += '\n';
  });
  
  summary += `Generated with OptiGains 💪`;
  
  return summary;
};

// Copy to clipboard helper
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
};