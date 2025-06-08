// Settings management utilities

export interface AppSettings {
  // Timer settings
  showRestTimers: boolean;
  defaultRestTime: number; // in seconds
  
  // Weight increment settings
  defaultWeightIncrement: number; // in lbs
  
  // Display preferences
  showVolumeMetrics: boolean;
  collapsibleExercises: boolean;
}

const SETTINGS_KEY = 'optigains_settings';

export const defaultSettings: AppSettings = {
  showRestTimers: false,
  defaultRestTime: 90,
  defaultWeightIncrement: 5,
  showVolumeMetrics: true,
  collapsibleExercises: true,
};

export const loadSettings = (): AppSettings => {
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (stored) {
    try {
      return { ...defaultSettings, ...JSON.parse(stored) };
    } catch (e) {
      console.error('Error loading settings:', e);
      return defaultSettings;
    }
  }
  return defaultSettings;
};

export const saveSettings = (settings: AppSettings): void => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const updateSetting = <K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
): void => {
  const settings = loadSettings();
  settings[key] = value;
  saveSettings(settings);
};