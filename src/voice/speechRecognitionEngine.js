/**
 * Nelum Speech Recognition Engine
 * Connects the browser SpeechRecognition API to Nelum, supporting Sinhala, Tamil,
 * English dictation, continuous listening, push-to-talk, and wake word activation.
 */

import { voiceSettingsManager } from './voiceSettingsManager.js';
import { voiceAnalytics } from './voiceAnalytics.js';
import { eventBus } from '../utils/eventBus.js';

class SpeechRecognitionEngine {
  constructor() {
    const SpeechRecognition = typeof window !== 'undefined' && 
      (window.SpeechRecognition || window.webkitSpeechRecognition);
      
    this.recognition = SpeechRecognition ? new SpeechRecognition() : null;
    this.isListeningValue = false;
    this.isMuted = false;
    this.silenceTimer = null;
    
    this.onStartCallback = null;
    this.onEndCallback = null;
    this.onResultCallback = null;
    this.onErrorCallback = null;
    this.onSilenceCallback = null;
    
    this.shouldRestart = false;
    this.wakeWordWatchMode = false;
    
    this.wakeWords = ['hey nelum', 'nelum', 'machan nelum', 'nelum ai', 'nelum ayi'];
    
    if (this.recognition) {
      this.setupRecognitionDefaults();
    }
  }

  setupRecognitionDefaults() {
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => {
      this.isListeningValue = true;
      console.log('[VOICE] Listening started');
      if (this.onStartCallback) this.onStartCallback();
      this.resetSilenceTimer();
    };

    this.recognition.onresult = (event) => {
      if (this.isMuted) return;

      let interimTranscript = '';
      let finalTranscript = '';

      for (
          let i = event.resultIndex;
          i < event.results.length;
          ++i
      ) {
          const transcript =
              event.results[i][0].transcript;

          if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
          } else {
              interimTranscript += transcript;
          }
      }

      const completeText =
          finalTranscript + interimTranscript;

      console.log(`[VOICE] Transcript: ${completeText.trim()}`);

      // 1. Check for wake words if in background wake watch mode
      if (this.wakeWordWatchMode && completeText) {
        const lowerTranscript = completeText.toLowerCase().trim();
        const detectedWakeWord = this.wakeWords.some(ww => lowerTranscript.includes(ww));
        
        if (detectedWakeWord) {
          console.log(`[SpeechRecognitionEngine] Wake word detected! Transitioning to active dictation...`);
          voiceAnalytics.trackEvent('wakeword_detected', { text: lowerTranscript });
          this.triggerWakeActivation();
          return;
        }
      }

      // 2. Normal dictation result callback
      if (!this.wakeWordWatchMode) {
        eventBus.emit('voice:transcript', {
            text: completeText.trim(),
            final:
                event.results[event.results.length - 1]
                .isFinal
        });

        if (this.onResultCallback) {
          this.onResultCallback({
            text: completeText.trim(),
            isFinal: event.results[event.results.length - 1].isFinal,
            confidence: event.results[event.results.length - 1][0].confidence || 1.0
          });
        }
      }

      // Reset the silence debounce timer on every transcript update
      this.resetSilenceTimer();
    };

    this.recognition.onerror = (event) => {
      console.error('[SpeechRecognitionEngine] Error event:', event.error);
      
      voiceAnalytics.trackEvent('recognition_error', { error: event.error });

      if (event.error === 'not-allowed') {
        this.shouldRestart = false;
      }

      this.clearSilenceTimer();

      if (this.onErrorCallback) {
        this.onErrorCallback(event.error);
      }
    };

    this.recognition.onend = () => {
      this.isListeningValue = false;
      console.log('[VOICE] Listening ended');
      this.clearSilenceTimer();
      
      if (this.shouldRestart) {
        this.restartRecognition();
      } else {
        if (this.onEndCallback) this.onEndCallback();
      }
    };
  }

  resetSilenceTimer() {
    this.clearSilenceTimer();
    
    // Do not auto-stop if in background wake-word mode or if alwaysListen is enabled
    const settings = voiceSettingsManager.getSettings();
    if (this.wakeWordWatchMode || settings.alwaysListen) {
      return;
    }

    this.silenceTimer = setTimeout(() => {
      console.log('[VOICE] Silence detected');
      if (this.onSilenceCallback) this.onSilenceCallback();
      this.stop();
    }, 2000);
  }

  clearSilenceTimer() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  start(langCode = 'en') {
    if (!this.recognition) {
      console.warn('[SpeechRecognitionEngine] SpeechRecognition not supported in this browser.');
      return;
    }

    const settings = voiceSettingsManager.getSettings();
    if (!settings.micEnabled) {
      console.warn('[SpeechRecognitionEngine] Microphone is muted in settings.');
      return;
    }

    // Set speech recognition language
    if (langCode === 'si') {
      this.recognition.lang = 'si-LK';
    } else if (langCode === 'ta') {
      this.recognition.lang = 'ta-LK';
    } else {
      this.recognition.lang = 'en-US';
    }

    this.wakeWordWatchMode = false;
    this.shouldRestart = settings.alwaysListen;

    try {
      this.recognition.start();
    } catch (e) {
      console.log('[SpeechRecognitionEngine] Recognition already active.');
    }
  }

  startWakeWordWatch(langCode = 'en') {
    if (!this.recognition) return;
    
    const settings = voiceSettingsManager.getSettings();
    if (!settings.wakeWordEnabled || !settings.micEnabled) {
      return;
    }

    console.log('[SpeechRecognitionEngine] Starting passive wake word watch loop...');
    this.wakeWordWatchMode = true;
    this.shouldRestart = true;

    if (langCode === 'si') {
      this.recognition.lang = 'si-LK';
    } else if (langCode === 'ta') {
      this.recognition.lang = 'ta-LK';
    } else {
      this.recognition.lang = 'en-US';
    }

    try {
      this.recognition.start();
    } catch (e) {
      // already running
    }
  }

  stop() {
    this.shouldRestart = false;
    this.wakeWordWatchMode = false;
    this.clearSilenceTimer();
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore errors
      }
    }
  }

  restartRecognition() {
    if (!this.shouldRestart || !this.recognition) return;
    
    setTimeout(() => {
      try {
        this.recognition.start();
      } catch (e) {
        // failed or already running
      }
    }, 300);
  }

  toggleMute(muteState) {
    this.isMuted = (muteState !== undefined) ? muteState : !this.isMuted;
    console.log(`[SpeechRecognitionEngine] Mic status set to: ${this.isMuted ? 'Muted' : 'Unmuted'}`);
    return this.isMuted;
  }

  triggerWakeActivation() {
    this.stop();
    
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const beep = new SpeechSynthesisUtterance("Ow, machan?");
      const settings = voiceSettingsManager.getSettings();
      beep.volume = settings.voiceVolume;
      beep.rate = settings.voiceSpeed;
      window.speechSynthesis.speak(beep);
    }
    
    if (this.onWakeWordDetectedCallback) {
      this.onWakeWordDetectedCallback();
    }
  }

  onStart(callback) {
    this.onStartCallback = callback;
  }

  onEnd(callback) {
    this.onEndCallback = callback;
  }

  onResult(callback) {
    this.onResultCallback = callback;
  }

  onError(callback) {
    this.onErrorCallback = callback;
  }

  onSilence(callback) {
    this.onSilenceCallback = callback;
  }

  onWakeWordDetected(callback) {
    this.onWakeWordDetectedCallback = callback;
  }
}

export const speechRecognitionEngine = new SpeechRecognitionEngine();
export default speechRecognitionEngine;
