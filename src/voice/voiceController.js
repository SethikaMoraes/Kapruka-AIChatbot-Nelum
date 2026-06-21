/**
 * Nelum Master Voice Controller
 * Orchestrates settings, recognition, synthesis, interruption, animations, and analytics.
 * Connects the voice subsystem directly to app.js and the DOM elements.
 */

import { voiceSettingsManager } from './voiceSettingsManager.js';
import { speechRecognitionEngine } from './speechRecognitionEngine.js';
import { speechSynthesisEngine } from './speechSynthesisEngine.js';
import { interruptionManager } from './interruptionManager.js';
import { voiceAnimationController } from './voiceAnimationController.js';
import { voiceAnalytics } from './voiceAnalytics.js';

class VoiceController {
  constructor() {
    this.conversationManager = null;
    this.chatInput = null;
    this.sendTextMessageFn = null;
    this.activeSessionId = 'default-session';
  }

  /**
   * Initializes all sub-engines and hooks event listeners
   * @param {object} conversationManager - Reference to runtime ConversationManager
   * @param {HTMLTextAreaElement} chatInput - Main chat textarea input
   * @param {function} sendTextMessageFn - Function to execute sending a text message
   */
  initialize(conversationManager, chatInput, sendTextMessageFn) {
    this.conversationManager = conversationManager;
    this.chatInput = chatInput;
    this.sendTextMessageFn = sendTextMessageFn;

    // 1. Initialize animations
    voiceAnimationController.initialize();

    // 2. Initialize interruption hooks
    interruptionManager.initialize(speechSynthesisEngine, speechRecognitionEngine, chatInput);

    // 3. Setup Recognition Callbacks
    this.setupSpeechRecognitionCallbacks();

    // 4. Setup Synthesis Callbacks
    this.setupSpeechSynthesisCallbacks();

    // 5. Setup Keyboard Shortcuts
    this.setupKeyboardShortcuts();

    // 6. Setup Settings Modal Event Bindings
    this.setupSettingsUI();

    // 7. Start background wake-word watcher if enabled
    const settings = voiceSettingsManager.getSettings();
    if (settings.wakeWordEnabled && settings.micEnabled && !settings.alwaysListen) {
      speechRecognitionEngine.startWakeWordWatch(this.getActiveLanguage());
    }

    console.log('[VoiceController] Voice subsystem initialized successfully.');
  }

  setupSpeechRecognitionCallbacks() {
    speechRecognitionEngine.onStart(() => {
      voiceAnimationController.setMicState('listening');
      voiceAnimationController.setAvatarState('listening');
      voiceAnalytics.startSession();
      
      // Stop synthesis if speaking
      speechSynthesisEngine.cancel();
    });

    speechRecognitionEngine.onResult(({ text, isFinal, confidence }) => {
      // 1. If synthesis is active, user speech interrupts immediately
      interruptionManager.handleSpeechResult(text);

      if (isFinal && text.trim()) {
        voiceAnalytics.trackEvent('recognition_success', { 
          confidence, 
          lang: this.getActiveLanguage() 
        });
      }
    });

    speechRecognitionEngine.onSilence(() => {
      voiceAnimationController.setMicState('processing');
    });

    speechRecognitionEngine.onEnd(() => {
      voiceAnimationController.setMicState('idle');
      voiceAnimationController.setAvatarState('idle');
      voiceAnalytics.endSession();

      // Auto-send if chatInput contains text
      const chatInput = document.getElementById('chatInput');
      if (chatInput && chatInput.value.trim() && !speechRecognitionEngine.wakeWordWatchMode) {
        console.log('[VOICE] Sending message');
        const sendBtn = document.getElementById('sendBtn');
        if (sendBtn) {
          sendBtn.click();
        }
      }
    });

    speechRecognitionEngine.onError((error) => {
      console.warn(`[VoiceController] Speech Recognition Error: ${error}`);
      
      if (error === 'not-allowed') {
        showToastNotification("Aiyo, microphone access denied! Check browser settings. 😅");
        voiceSettingsManager.updateSetting('micEnabled', false);
        voiceAnimationController.setMicState('muted');
        return;
      }

      // Display friendly error and speak back fallback
      voiceAnimationController.setMicState('idle');
      voiceAnimationController.setAvatarState('confused');
      
      const settings = voiceSettingsManager.getSettings();
      if (settings.voiceEnabled && settings.autoSpeakReplies) {
        speechSynthesisEngine.speak("Aiyo 😅 I couldn't hear that clearly. Could you say it again?", this.getActiveLanguage());
      } else {
        showToastNotification("Aiyo 😅 I couldn't hear that clearly. Could you say it again?");
      }
      
      this.handlePostRecognitionListening();
    });

    speechRecognitionEngine.onWakeWordDetected(() => {
      // Transition from wake word watch to active dictation
      voiceAnimationController.setMicState('listening');
      voiceAnimationController.setAvatarState('listening');
      
      setTimeout(() => {
        speechRecognitionEngine.start(this.getActiveLanguage());
      }, 500);
    });
  }

  setupSpeechSynthesisCallbacks() {
    speechSynthesisEngine.onStart(() => {
      voiceAnimationController.setMicState('speaking');
      voiceAnimationController.setAvatarState('speaking');
    });

    speechSynthesisEngine.onEnd(() => {
      voiceAnimationController.setMicState('idle');
      voiceAnimationController.setAvatarState('idle');
      
      // Resume background wake watching or always listen if enabled
      this.handlePostRecognitionListening();
    });

    speechSynthesisEngine.onError(() => {
      voiceAnimationController.setMicState('idle');
      voiceAnimationController.setAvatarState('confused');
      this.handlePostRecognitionListening();
    });
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
      // 1. ESC: Stop speaking (Handled in InterruptionManager, but fallback here)
      if (event.key === 'Escape') {
        if (speechSynthesisEngine.isSpeaking) {
          speechSynthesisEngine.cancel();
          showToastNotification("Nelum stopped speaking.");
        }
      }

      // 2. Ctrl + M: Toggle microphone mute settings
      if (event.ctrlKey && event.key.toLowerCase() === 'm') {
        event.preventDefault();
        this.toggleMute();
      }

      // 3. Spacebar: Push-to-talk (When input is not focused and not typing)
      if (event.key === ' ' && document.activeElement !== this.chatInput && !speechSynthesisEngine.isSpeaking) {
        const settings = voiceSettingsManager.getSettings();
        if (settings.micEnabled && !speechRecognitionEngine.isListeningValue) {
          event.preventDefault();
          console.log('[VoiceController] PTT Activated via Spacebar');
          speechRecognitionEngine.start(this.getActiveLanguage());
        }
      }
    });
  }

  setupSettingsUI() {
    const btnOpenSettings = document.getElementById('btn-voice-settings');
    const modalSettings = document.getElementById('voice-settings-modal');
    const btnCloseSettings = document.getElementById('btn-close-voice-settings');
    const btnResetSettings = document.getElementById('btn-reset-voice-settings');
    const btnSaveSettings = document.getElementById('btn-save-voice-settings');

    if (!btnOpenSettings || !modalSettings) return;

    // Helper to sync inputs with settings values
    const syncInputsWithSettings = () => {
      const settings = voiceSettingsManager.getSettings();

      document.getElementById('setting-voice-output').checked = settings.voiceEnabled;
      document.getElementById('setting-mic-status').checked = settings.micEnabled;
      document.getElementById('setting-auto-speak').checked = settings.autoSpeakReplies;
      document.getElementById('setting-wake-word').checked = settings.wakeWordEnabled;
      document.getElementById('setting-always-listen').checked = settings.alwaysListen;
      document.getElementById('setting-auto-lang').checked = settings.autoLanguage;

      document.getElementById('setting-voice-speed').value = settings.voiceSpeed;
      document.getElementById('val-voice-speed').textContent = `${settings.voiceSpeed}x`;

      document.getElementById('setting-voice-pitch').value = settings.voicePitch;
      document.getElementById('val-voice-pitch').textContent = settings.voicePitch;

      document.getElementById('setting-voice-volume').value = settings.voiceVolume;
      document.getElementById('val-voice-volume').textContent = `${Math.round(settings.voiceVolume * 100)}%`;

      document.getElementById('setting-preferred-voice').value = settings.preferredVoice;
    };

    // Helper to sync analytics insights
    const syncAnalyticsUI = () => {
      const metrics = voiceAnalytics.getMetrics();
      document.getElementById('analytic-sessions').textContent = metrics.totalVoiceSessions;
      document.getElementById('analytic-duration').textContent = `${metrics.averageSessionDurationSeconds}s`;
      document.getElementById('analytic-interrupts').textContent = metrics.totalInterruptions;
      document.getElementById('analytic-confidence').textContent = `${Math.round(metrics.averageSpeechConfidence * 100)}%`;
    };

    // Bind slider labels update
    document.getElementById('setting-voice-speed').addEventListener('input', (e) => {
      document.getElementById('val-voice-speed').textContent = `${e.target.value}x`;
    });
    document.getElementById('setting-voice-pitch').addEventListener('input', (e) => {
      document.getElementById('val-voice-pitch').textContent = e.target.value;
    });
    document.getElementById('setting-voice-volume').addEventListener('input', (e) => {
      document.getElementById('val-voice-volume').textContent = `${Math.round(e.target.value * 100)}%`;
    });

    // Open Modal
    btnOpenSettings.addEventListener('click', () => {
      syncInputsWithSettings();
      syncAnalyticsUI();
      modalSettings.style.display = 'flex';
    });

    // Close Modal without saving (Close btn or save btn)
    const closeModal = () => {
      modalSettings.style.display = 'none';
    };
    btnCloseSettings.addEventListener('click', closeModal);

    // Save and Apply Settings
    btnSaveSettings.addEventListener('click', () => {
      const settings = voiceSettingsManager.getSettings();
      
      voiceSettingsManager.updateSetting('voiceEnabled', document.getElementById('setting-voice-output').checked);
      
      const newMicStatus = document.getElementById('setting-mic-status').checked;
      voiceSettingsManager.updateSetting('micEnabled', newMicStatus);
      
      voiceSettingsManager.updateSetting('autoSpeakReplies', document.getElementById('setting-auto-speak').checked);
      voiceSettingsManager.updateSetting('wakeWordEnabled', document.getElementById('setting-wake-word').checked);
      voiceSettingsManager.updateSetting('alwaysListen', document.getElementById('setting-always-listen').checked);
      voiceSettingsManager.updateSetting('autoLanguage', document.getElementById('setting-auto-lang').checked);

      voiceSettingsManager.updateSetting('voiceSpeed', document.getElementById('setting-voice-speed').value);
      voiceSettingsManager.updateSetting('voicePitch', document.getElementById('setting-voice-pitch').value);
      voiceSettingsManager.updateSetting('voiceVolume', document.getElementById('setting-voice-volume').value);
      voiceSettingsManager.updateSetting('preferredVoice', document.getElementById('setting-preferred-voice').value);

      // Handle mic status logic
      if (!newMicStatus) {
        speechRecognitionEngine.stop();
        voiceAnimationController.setMicState('muted');
      } else {
        voiceAnimationController.setMicState('idle');
        this.handlePostRecognitionListening();
      }

      closeModal();
      showToastNotification("Voice settings applied successfully!");
    });

    // Reset Settings
    btnResetSettings.addEventListener('click', () => {
      if (confirm("Are you sure you want to reset all voice settings to defaults?")) {
        voiceSettingsManager.reset();
        syncInputsWithSettings();
        showToastNotification("Settings reset to defaults.");
      }
    });
  }

  /**
   * Resumes listening loops following a text-turn processing or synthesis completion
   */
  handlePostRecognitionListening() {
    const settings = voiceSettingsManager.getSettings();
    if (settings.micEnabled) {
      if (settings.alwaysListen) {
        speechRecognitionEngine.start(this.getActiveLanguage());
      } else if (settings.wakeWordEnabled) {
        speechRecognitionEngine.startWakeWordWatch(this.getActiveLanguage());
      }
    }
  }

  /**
   * Triggers voice synthesis for a text reply
   */
  speak(text, lang = null) {
    const settings = voiceSettingsManager.getSettings();
    if (settings.voiceEnabled && settings.autoSpeakReplies) {
      // Stop listening to avoid feedback loop
      speechRecognitionEngine.stop();
      
      const speechLang = lang || this.getActiveLanguage();
      speechSynthesisEngine.speak(text, speechLang);
    }
  }

  /**
   * Triggered when clicking the Microphone button in the UI
   */
  handleMicClick() {
    const settings = voiceSettingsManager.getSettings();
    if (!settings.micEnabled) {
      showToastNotification("Mic is disabled in settings. Enable it first! 🎙️");
      return;
    }

    if (speechRecognitionEngine.isListeningValue) {
      // Stop listening
      speechRecognitionEngine.stop();
      voiceAnimationController.setMicState('idle');
      voiceAnimationController.setAvatarState('idle');
      this.handlePostRecognitionListening();
    } else {
      // Stop active speaking first
      speechSynthesisEngine.cancel();
      // Start dictation
      speechRecognitionEngine.start(this.getActiveLanguage());
    }
  }

  /**
   * Toggle microphone mute status from shortcut or UI
   */
  toggleMute() {
    const isMutedNow = speechRecognitionEngine.toggleMute();
    voiceSettingsManager.updateSetting('micEnabled', !isMutedNow);

    if (isMutedNow) {
      speechRecognitionEngine.stop();
      voiceAnimationController.setMicState('muted');
      showToastNotification("Microphone muted.");
    } else {
      voiceAnimationController.setMicState('idle');
      showToastNotification("Microphone active.");
      this.handlePostRecognitionListening();
    }
  }

  /**
   * Retrieves the current conversation language
   */
  getActiveLanguage() {
    if (this.conversationManager && this.conversationManager.activeLanguage) {
      return this.conversationManager.activeLanguage;
    }
    
    // Fallback: look at the active lang switcher button in header
    const activeBtn = document.querySelector('.lang-switcher .lang-btn.active');
    return activeBtn ? activeBtn.getAttribute('data-lang') : 'en';
  }
}

// Global Toast display helper
function showToastNotification(message) {
  // Find global app showToast if available or fallback
  const globalToast = window.showToast || console.log;
  globalToast(message);
}

// Make helper accessible globally to keep code DRY
if (typeof window !== 'undefined') {
  window.showToastNotification = showToastNotification;
}

export const voiceController = new VoiceController();
export default voiceController;
