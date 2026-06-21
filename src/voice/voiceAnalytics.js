/**
 * Nelum Voice Analytics Tracker
 * Gathers usage metrics and diagnostic voice event statistics
 * using LocalStorage persistency.
 */

const ANALYTICS_KEY = 'nelum_voice_analytics';

const INITIAL_ANALYTICS = {
  usageCount: 0,
  sessionStartTimes: [],
  sessionDurations: [],
  languages: {
    en: 0,
    si: 0,
    ta: 0,
    mix: 0
  },
  interruptionCount: 0,
  errorCount: 0,
  confidenceScores: []
};

class VoiceAnalytics {
  constructor() {
    this.analytics = this.loadAnalytics();
    this.sessionStartTime = null;
  }

  loadAnalytics() {
    try {
      const stored = localStorage.getItem(ANALYTICS_KEY);
      if (stored) {
        return { ...INITIAL_ANALYTICS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('[VoiceAnalytics] Failed to load analytics from localStorage:', e);
    }
    return { ...INITIAL_ANALYTICS };
  }

  saveAnalytics() {
    try {
      localStorage.setItem(ANALYTICS_KEY, JSON.stringify(this.analytics));
    } catch (e) {
      console.warn('[VoiceAnalytics] Failed to save analytics to localStorage:', e);
    }
  }

  startSession() {
    this.sessionStartTime = Date.now();
    this.analytics.usageCount++;
    this.saveAnalytics();
    console.log('[VoiceAnalytics] Voice session started.');
  }

  endSession() {
    if (this.sessionStartTime) {
      const durationSeconds = (Date.now() - this.sessionStartTime) / 1000;
      this.analytics.sessionDurations.push(parseFloat(durationSeconds.toFixed(2)));
      // Keep only last 100 sessions to save space
      if (this.analytics.sessionDurations.length > 100) {
        this.analytics.sessionDurations.shift();
      }
      this.sessionStartTime = null;
      this.saveAnalytics();
      console.log(`[VoiceAnalytics] Voice session ended. Duration: ${durationSeconds} seconds.`);
    }
  }

  trackEvent(eventName, data = {}) {
    switch (eventName) {
      case 'tts_success':
        if (data.lang && data.lang in this.analytics.languages) {
          this.analytics.languages[data.lang]++;
        }
        break;
      case 'recognition_success':
        if (data.confidence !== undefined) {
          this.analytics.confidenceScores.push(parseFloat(data.confidence.toFixed(4)));
          if (this.analytics.confidenceScores.length > 200) {
            this.analytics.confidenceScores.shift();
          }
        }
        if (data.lang && data.lang in this.analytics.languages) {
          this.analytics.languages[data.lang]++;
        }
        break;
      case 'voice_interrupted':
        this.analytics.interruptionCount++;
        break;
      case 'tts_error':
      case 'recognition_error':
        this.analytics.errorCount++;
        break;
    }
    this.saveAnalytics();
  }

  getMetrics() {
    const avgDuration = this.analytics.sessionDurations.length > 0
      ? this.analytics.sessionDurations.reduce((a, b) => a + b, 0) / this.analytics.sessionDurations.length
      : 0;

    const avgConfidence = this.analytics.confidenceScores.length > 0
      ? this.analytics.confidenceScores.reduce((a, b) => a + b, 0) / this.analytics.confidenceScores.length
      : 0;

    return {
      totalVoiceSessions: this.analytics.usageCount,
      averageSessionDurationSeconds: parseFloat(avgDuration.toFixed(2)),
      languageDistribution: { ...this.analytics.languages },
      totalInterruptions: this.analytics.interruptionCount,
      totalErrors: this.analytics.errorCount,
      averageSpeechConfidence: parseFloat(avgConfidence.toFixed(4))
    };
  }

  clear() {
    this.analytics = { ...INITIAL_ANALYTICS };
    this.saveAnalytics();
  }
}

export const voiceAnalytics = new VoiceAnalytics();
export default voiceAnalytics;
