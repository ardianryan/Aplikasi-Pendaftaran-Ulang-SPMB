import { Setting, DEFAULT_SETTINGS } from '../models/Setting';

export async function getSettingsMap() {
  try {
    let settings = await Setting.find().lean();
    
    if (settings.length === 0) {
      // Seed if empty
      await Setting.insertMany(DEFAULT_SETTINGS);
      settings = await Setting.find().lean();
    }

    return settings.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {} as Record<string, any>);
  } catch (err) {
    console.error('[SETTINGS] Error fetching settings:', err);
    // Return defaults if DB fails
    return DEFAULT_SETTINGS.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {} as Record<string, any>);
  }
}
