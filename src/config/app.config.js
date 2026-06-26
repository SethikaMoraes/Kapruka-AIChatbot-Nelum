/**
 * Nelum AI Frontend Configuration
 */
export const APP_CONFIG = {
  API_BASE_URL: '',
  DEFAULT_LANGUAGE: 'en',
  LOADING_SCREEN_MIN_DURATION: 4000,
  
  VOICE_DEFAULTS: {
    voiceEnabled: true,
    micEnabled: true,
    autoSpeakReplies: true,
    wakeWordEnabled: false,
    alwaysListen: false,
    autoLanguage: false,
    voiceSpeed: 1.0,
    voicePitch: 1.0,
    voiceVolume: 1.0,
    preferredVoice: 'Aoede'
  },

  AGENT: {
    TIMEOUT_MS: 4500,
    MAX_RETRIES: 2
  }
};

export default APP_CONFIG;
