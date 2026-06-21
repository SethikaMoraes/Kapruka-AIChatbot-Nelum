/**
 * Nelum Speech Synthesis Engine
 * Manages Text-To-Speech output with Gemini API primary synthesis
 * and a transparent local browser SpeechSynthesis fallback system.
 */

import { voiceSettingsManager } from './voiceSettingsManager.js';
import { languageVoiceMapper } from './languageVoiceMapper.js';
import { voiceAnalytics } from './voiceAnalytics.js';

class SpeechSynthesisEngine {
  constructor() {
    this.activeAudio = null;
    this.isSpeakingValue = false;
    this.onStartCallback = null;
    this.onEndCallback = null;
    this.onErrorCallback = null;
  }

  get isSpeaking() {
    return this.isSpeakingValue || (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking);
  }

  /**
   * Main speech function
   * @param {string} text - The text content to speak
   * @param {string} langCode - Current language of the text ('en', 'si', 'ta')
   */
  async speak(text, langCode = 'en') {
    this.cancel(); // Cancel any ongoing speech

    const settings = voiceSettingsManager.getSettings();
    if (!settings.voiceEnabled) {
      console.log('[SpeechSynthesisEngine] Voice output is disabled in settings.');
      return;
    }

    // Clean text: strip markdown emojis or bracket links to speak clean text
    const cleanText = this.sanitizeTextForSpeech(text);
    if (!cleanText) return;

    this.isSpeakingValue = true;
    if (this.onStartCallback) this.onStartCallback();

    try {
      // 1. Try Gemini API Synthesis
      const geminiVoice = languageVoiceMapper.getGeminiVoice(langCode);
      const audioUrl = await this.fetchGeminiAudio(cleanText, geminiVoice);
      
      if (audioUrl) {
        await this.playAudioElement(audioUrl, settings.voiceSpeed, settings.voiceVolume);
        voiceAnalytics.trackEvent('tts_success', { engine: 'gemini', lang: langCode });
      } else {
        throw new Error('Fallback triggered: Empty audio URL returned');
      }
    } catch (err) {
      console.warn('[SpeechSynthesisEngine] Gemini API TTS synthesis failed, switching to browser fallback:', err.message);
      voiceAnalytics.trackEvent('tts_fallback', { reason: err.message, lang: langCode });
      
      // 2. Browser Fallback
      this.speakBrowserFallback(cleanText, langCode, settings);
    }
  }

  /**
   * Cancel any active speaking (Web Audio or Browser window.speechSynthesis)
   */
  cancel() {
    this.isSpeakingValue = false;

    // 1. Stop HTML5 Audio playback
    if (this.activeAudio) {
      try {
        this.activeAudio.pause();
        this.activeAudio.currentTime = 0;
        this.activeAudio = null;
      } catch (e) {
        console.warn('[SpeechSynthesisEngine] Error cancelling audio element:', e);
      }
    }

    // 2. Stop Browser Speech Synthesis
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        console.warn('[SpeechSynthesisEngine] Error cancelling window.speechSynthesis:', e);
      }
    }
  }

  /**
   * Helper to clean up markdown, links, brackets, and extra emojis before speaking
   */
  sanitizeTextForSpeech(text) {
    if (!text) return '';
    return text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // replace markdown links with label
      .replace(/\*\*([^*]+)\*\*/g, '$1')       // strip bold markdown
      .replace(/•\s+/g, '')                    // remove bullet points
      .replace(/[\n\r]+/g, ' ')                // replace newlines with space
      .trim();
  }

  /**
   * Request TTS audio from secure backend endpoint
   */
  async fetchGeminiAudio(text, voice) {
    const response = await fetch('/api/voice/synthesize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text, voice })
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.audioContent) {
      throw new Error('No audio content in synthesis response');
    }

    // Convert base64 to blob URL
    const binaryString = atob(data.audioContent);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const mimeType = data.mimeType || 'audio/mp3';
    const blob = new Blob([bytes.buffer], { type: mimeType });
    return URL.createObjectURL(blob);
  }

  /**
   * Plays the generated audio using a browser Audio element
   */
  playAudioElement(url, speed, volume) {
    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      this.activeAudio = audio;
      
      audio.playbackRate = speed;
      audio.volume = volume;

      audio.onplay = () => {
        this.isSpeakingValue = true;
      };

      audio.onended = () => {
        this.isSpeakingValue = false;
        URL.revokeObjectURL(url);
        if (this.activeAudio === audio) this.activeAudio = null;
        if (this.onEndCallback) this.onEndCallback();
        resolve();
      };

      audio.onerror = (e) => {
        this.isSpeakingValue = false;
        URL.revokeObjectURL(url);
        if (this.activeAudio === audio) this.activeAudio = null;
        if (this.onErrorCallback) this.onErrorCallback(e);
        reject(new Error('Audio element playback error'));
      };

      audio.play().catch(err => {
        this.isSpeakingValue = false;
        reject(err);
      });
    });
  }

  /**
   * Speak using browser fallback speechSynthesis API
   */
  speakBrowserFallback(text, langCode, settings) {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('[SpeechSynthesisEngine] SpeechSynthesis is not supported in this browser.');
      this.isSpeakingValue = false;
      if (this.onEndCallback) this.onEndCallback();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure voice properties
    const matchedVoice = languageVoiceMapper.getBrowserVoice(langCode);
    if (matchedVoice) {
      utterance.voice = matchedVoice;
      utterance.lang = matchedVoice.lang;
    } else {
      // Map standard lang codes if voice search fails
      utterance.lang = langCode === 'si' ? 'si-LK' : (langCode === 'ta' ? 'ta-LK' : 'en-US');
    }

    utterance.rate = settings.voiceSpeed;
    utterance.pitch = settings.voicePitch;
    utterance.volume = settings.voiceVolume;

    utterance.onstart = () => {
      this.isSpeakingValue = true;
    };

    utterance.onend = () => {
      this.isSpeakingValue = false;
      if (this.onEndCallback) this.onEndCallback();
    };

    utterance.onerror = (e) => {
      this.isSpeakingValue = false;
      console.error('[SpeechSynthesisEngine] Fallback utterance error:', e);
      voiceAnalytics.trackEvent('tts_error', { engine: 'browser', error: e.error });
      if (this.onErrorCallback) this.onErrorCallback(e);
      if (this.onEndCallback) this.onEndCallback();
    };

    window.speechSynthesis.speak(utterance);
    voiceAnalytics.trackEvent('tts_success', { engine: 'browser', lang: langCode });
  }

  onStart(callback) {
    this.onStartCallback = callback;
  }

  onEnd(callback) {
    this.onEndCallback = callback;
  }

  onError(callback) {
    this.onErrorCallback = callback;
  }
}

export const speechSynthesisEngine = new SpeechSynthesisEngine();
export default speechSynthesisEngine;
