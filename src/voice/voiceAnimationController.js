/**
 * Nelum Voice Animation Controller
 * Handles visual state transitions for the microphone button, voice overlay wave,
 * and the assistant avatar emoji / glow rings based on engine state.
 */

class VoiceAnimationController {
  constructor() {
    this.btnVoice = null;
    this.voiceWave = null;
    this.heroAvatar = null;
    this.heroEmoji = null;
    this.pulseIndicator = null;
    this.chatInputBar = null;
  }

  /**
   * Initializes handles to DOM elements
   */
  initialize() {
    this.btnVoice = document.getElementById('btn-voice');
    this.voiceWave = document.getElementById('voice-wave');
    this.heroAvatar = document.querySelector('.hero-avatar-glow');
    this.heroEmoji = document.querySelector('.hero-emoji');
    this.pulseIndicator = document.querySelector('.pulse-indicator');
    this.chatInputBar = document.querySelector('.chat-input-bar');

    // Start in idle state
    this.setMicState('idle');
    this.setAvatarState('idle');
  }

  /**
   * Update the microphone button state and wave overlay
   * @param {string} state - 'idle', 'listening', 'processing', 'speaking', 'muted'
   */
  setMicState(state) {
    if (!this.btnVoice) return;

    // Reset classes
    this.btnVoice.classList.remove('voice-idle', 'voice-listening', 'voice-processing', 'voice-speaking', 'voice-muted');
    if (this.chatInputBar) this.chatInputBar.classList.remove('glow-active');

    // Hide overlay by default
    if (this.voiceWave) this.voiceWave.style.display = 'none';

    switch (state) {
      case 'idle':
        this.btnVoice.classList.add('voice-idle');
        break;
      case 'listening':
        this.btnVoice.classList.add('voice-listening');
        if (this.voiceWave) {
          this.voiceWave.style.display = 'flex';
          const waveStatus = this.voiceWave.querySelector('.wave-status');
          if (waveStatus) waveStatus.textContent = 'Listening to your voice...';
          this.startWaveformAnimation();
        }
        break;
      case 'processing':
        this.btnVoice.classList.add('voice-processing');
        if (this.chatInputBar) this.chatInputBar.classList.add('glow-active');
        if (this.voiceWave) {
          this.voiceWave.style.display = 'flex';
          const waveStatus = this.voiceWave.querySelector('.wave-status');
          if (waveStatus) waveStatus.textContent = 'Nelum is listening...';
          this.stopWaveformAnimation();
        }
        break;
      case 'speaking':
        this.btnVoice.classList.add('voice-speaking');
        if (this.voiceWave) {
          this.voiceWave.style.display = 'flex';
          const waveStatus = this.voiceWave.querySelector('.wave-status');
          if (waveStatus) waveStatus.textContent = 'Nelum is speaking...';
          this.startEqualizerAnimation();
        }
        break;
      case 'muted':
        this.btnVoice.classList.add('voice-muted');
        break;
    }
  }

  /**
   * Update the avatar status (emoji & glow rings)
   * @param {string} state - 'idle', 'listening', 'thinking', 'speaking', 'happy', 'celebrating', 'confused'
   */
  setAvatarState(state) {
    const emojis = {
      idle: '🌸',
      listening: '👂',
      thinking: '💭',
      speaking: '💬',
      happy: '😊',
      celebrating: '🎉',
      confused: '😅'
    };

    const colors = {
      idle: 'rgba(75, 46, 131, 0.4)',      // Soft Purple
      listening: 'rgba(16, 185, 129, 0.4)', // Emerald Green
      thinking: 'rgba(244, 211, 0, 0.4)',   // Golden Yellow
      speaking: 'rgba(236, 72, 153, 0.4)',  // Hot Pink
      happy: 'rgba(59, 130, 246, 0.4)',     // Sky Blue
      celebrating: 'rgba(249, 115, 22, 0.4)',// Orange Spark
      confused: 'rgba(107, 114, 128, 0.4)'  // Cool Gray
    };

    // Update sticky header pulse indicator color
    if (this.pulseIndicator) {
      this.pulseIndicator.style.backgroundColor = colors[state] ? colors[state].replace('0.4', '1.0') : '#10B981';
    }

    // Update landing page avatar
    if (this.heroEmoji && emojis[state]) {
      this.heroEmoji.textContent = emojis[state];
    }

    if (this.heroAvatar && colors[state]) {
      this.heroAvatar.style.boxShadow = `0 0 30px ${colors[state]}, inset 0 0 15px ${colors[state]}`;
      
      // Toggle custom css animations
      this.heroAvatar.className = 'hero-avatar-glow'; // Reset classes
      if (state === 'listening') {
        this.heroAvatar.classList.add('anim-listening');
      } else if (state === 'thinking') {
        this.heroAvatar.classList.add('anim-thinking');
      } else if (state === 'speaking') {
        this.heroAvatar.classList.add('anim-speaking');
      }
    }
  }

  /**
   * Continuous animated wave form (listening mode)
   */
  startWaveformAnimation() {
    const bars = document.querySelectorAll('.wave-bar');
    bars.forEach((bar, idx) => {
      bar.style.animation = `wavePulse ${0.5 + idx * 0.15}s ease-in-out infinite alternate`;
    });
  }

  /**
   * Speak equalizer animation (reaction to synthesis audio)
   */
  startEqualizerAnimation() {
    const bars = document.querySelectorAll('.wave-bar');
    bars.forEach((bar, idx) => {
      bar.style.animation = `voiceEq ${0.3 + idx * 0.1}s ease-in-out infinite alternate`;
    });
  }

  stopWaveformAnimation() {
    const bars = document.querySelectorAll('.wave-bar');
    bars.forEach(bar => {
      bar.style.animation = 'none';
      bar.style.height = '6px';
    });
  }
}

export const voiceAnimationController = new VoiceAnimationController();
export default voiceAnimationController;
