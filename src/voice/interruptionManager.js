/**
 * Nelum Interruption Manager
 * Automatically detects user input (typing, pressing ESC, or speaking)
 * to instantly interrupt Nelum's speech playback for natural conversations.
 */

import { voiceAnalytics } from './voiceAnalytics.js';

class InterruptionManager {
  constructor() {
    this.synthesisEngine = null;
    this.recognitionEngine = null;
  }

  /**
   * Initializes interruption hooks on document and elements
   */
  initialize(synthesisEngine, recognitionEngine, chatInputField) {
    this.synthesisEngine = synthesisEngine;
    this.recognitionEngine = recognitionEngine;

    if (!synthesisEngine) return;

    // 1. Hook user typing in Chat Input
    if (chatInputField) {
      chatInputField.addEventListener('input', () => {
        if (chatInputField.value.trim() && this.synthesisEngine.isSpeaking) {
          console.log('[InterruptionManager] User started typing. Cancelling speech...');
          this.interrupt();
        }
      });
    }

    // 2. Hook Keyboard Shortcut: Escape (ESC)
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        if (this.synthesisEngine.isSpeaking) {
          console.log('[InterruptionManager] ESC key pressed. Cancelling speech...');
          event.preventDefault();
          this.interrupt();
        }
      }
    });
  }

  /**
   * Checks if user's spoken words should interrupt Nelum
   * @param {string} text - The spoken text recognized so far
   */
  handleSpeechResult(text) {
    if (!text || !this.synthesisEngine) return;

    // If Nelum is speaking and the user says something, interrupt Nelum immediately
    if (this.synthesisEngine.isSpeaking && text.trim().length > 2) {
      console.log(`[InterruptionManager] User spoke: "${text.trim()}". Cancelling speech...`);
      this.interrupt();
    }
  }

  /**
   * Perform speech cancellation and record metrics
   */
  interrupt() {
    if (this.synthesisEngine) {
      this.synthesisEngine.cancel();
      voiceAnalytics.trackEvent('voice_interrupted', { timestamp: Date.now() });
    }
  }
}

export const interruptionManager = new InterruptionManager();
export default interruptionManager;
