/**
 * Nelum Voice Settings Manager
 * Handles persistent configuration of voice preferences using LocalStorage.
 */

const SETTINGS_KEY = 'nelum_voice_settings';

const DEFAULT_SETTINGS = {
  voiceEnabled: true,
  micEnabled: true,
  autoSpeakReplies: true,
  voiceSpeed: 1.0,      // Range: 0.5 to 2.0
  voicePitch: 1.0,      // Range: 0.5 to 2.0
  voiceVolume: 1.0,     // Range: 0.0 to 1.0
  autoLanguage: true,   // Auto-detect and match recognition lang
  alwaysListen: false,  // Continuous restart
  wakeWordEnabled: true,// Watch for wake words
  preferredVoice: 'Aoede' // Default Gemini prebuilt voice
};

class VoiceSettingsManager {
  constructor() {
    this.settings = this.loadSettings();
  }

  loadSettings() {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to handle new keys
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (e) {
      console.warn('[VoiceSettingsManager] Failed to load settings from localStorage, using defaults:', e);
    }
    return { ...DEFAULT_SETTINGS };
  }

  saveSettings() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (e) {
      console.warn('[VoiceSettingsManager] Failed to save settings to localStorage:', e);
    }
  }

  getSetting(key) {
    return this.settings[key] !== undefined ? this.settings[key] : DEFAULT_SETTINGS[key];
  }

  updateSetting(key, value) {
    if (key in DEFAULT_SETTINGS) {
      // Coerce numeric settings
      if (key === 'voiceSpeed' || key === 'voicePitch' || key === 'voiceVolume') {
        value = parseFloat(value);
      }
      this.settings[key] = value;
      this.saveSettings();
      console.log(`[VoiceSettingsManager] Setting updated: ${key} = ${value}`);
      return true;
    }
    return false;
  }

  getSettings() {
    return { ...this.settings };
  }

  reset() {
    this.settings = { ...DEFAULT_SETTINGS };
    this.saveSettings();
  }
}

export const voiceSettingsManager = new VoiceSettingsManager();
export default voiceSettingsManager;
