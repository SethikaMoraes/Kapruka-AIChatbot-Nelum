// ==========================================================================
// NELUM BY KAPRUKA - INTERACTIVE APPLICATION CONTROLLER (MODULAR BOOTSTRAPPER)
// ==========================================================================

import { ConversationManager } from './src/runtime/conversationManager.js';
import { memoryStore } from './src/memory/memoryStore.js';
import { intentDetector } from './src/agents/intentDetector.js';
import { agentOrchestrator } from './src/agents/agentOrchestrator.js';
import { eventBus } from './src/utils/eventBus.js';
import { preferenceEngine } from './src/memory/preferenceEngine.js';
import { voiceController } from './src/voice/voiceController.js';
import { appState } from './src/state/appState.js';
import { uiController } from './src/components/common/uiController.js';
import { chatController } from './src/components/chat/chatController.js';
import { eventBindings } from './src/components/common/eventBindings.js';
import { CONVERSATION_STARTERS, QUICK_ACTIONS } from './src/constants/ui.constants.js';
import { EVENTS } from './src/constants/event.constants.js';

document.addEventListener("DOMContentLoaded", () => {
  // Instantiate the Conversation Manager
  const manager = new ConversationManager(memoryStore, intentDetector, agentOrchestrator);
  appState.setManager(manager);

  // Initialize session context with welcome trigger
  manager.processMessage('default-session', 'init_welcome');

  // Helper: render quick chips
  function renderQuickChips() {
    const quickChipsContainer = document.getElementById("quick-chips");
    if (!quickChipsContainer) return;
    quickChipsContainer.innerHTML = QUICK_ACTIONS.map(chip => `
      <button class="chip-btn" data-action="${chip.action}">
        ${chip.text}
      </button>
    `).join("");
  }

  // Helper: render conversation starters
  function renderStarters(starters = CONVERSATION_STARTERS) {
    const startersGrid = document.getElementById("starters-grid");
    if (!startersGrid) return;
    startersGrid.innerHTML = starters.map(starter => `
      <button class="starter-btn" data-context="${starter.context}">
        <span class="starter-icon">${starter.icon}</span>
        <span>${starter.text}</span>
      </button>
    `).join("");
  }

  // Helper: load memory occasions and check reminders
  async function loadRemindersAndRender() {
    try {
      const profile = await memoryStore.loadUserProfile('default-user');
      const today = '2026-06-17'; // Anchor to current time context
      const reminders = preferenceEngine.checkUpcomingOccasions(profile, today);
      const chatHero = document.getElementById("chat-hero");
      
      if (reminders.length > 0) {
        const reminder = reminders[0];
        console.log(`[Nelum Memory] Detected upcoming occasion:`, reminder);
        
        // Customize the hero subtitle
        if (chatHero) {
          const daysText = reminder.daysRemaining === 0 ? "today" : `in ${reminder.daysRemaining} days`;
          const subTitleEl = chatHero.querySelector(".hero-subtitle");
          if (subTitleEl) {
            const recipientBirthday = profile.frequentRecipients.find(r => r.name === reminder.recipient)?.birthday || '';
            subTitleEl.innerHTML = `Ayubowan! 🌸 **${reminder.recipient}**'s birthday is ${daysText} (${recipientBirthday}). Should I help you schedule a surprise for them?`;
          }
        }
        
        // Add a specialized starter at the beginning
        const updatedStarters = [
          { icon: "🎂", text: `Surprise ${reminder.recipient}`, context: `schedule-reminder:${reminder.recipient}` },
          ...CONVERSATION_STARTERS.filter(s => s.context !== 'birthday')
        ];
        
        renderStarters(updatedStarters);
      } else {
        renderStarters();
      }
    } catch (e) {
      console.error("Error loading user profile or reminders:", e);
      renderStarters();
    }
  }

  // Master Initializer
  async function init() {
    await loadRemindersAndRender();
    renderQuickChips();
    
    // Bind UI DOM listeners
    eventBindings.setup();
    
    // Initialize Voice Subsystem
    const chatInput = document.getElementById('chatInput');
    voiceController.initialize(
      manager, 
      chatInput, 
      () => chatController.sendTextMessage()
    );
    
    // Sync live transcript to chat-input field
    eventBus.on(EVENTS.VOICE_TRANSCRIPT, payload => {
      const inputEl = document.getElementById('chatInput');
      if (!inputEl) return;
      inputEl.value = payload.text;
      inputEl.dispatchEvent(new Event('input'));
    });
    
    // Set default date in delivery form to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateInput = document.getElementById("delivery-date");
    if (dateInput) {
      dateInput.value = tomorrow.toISOString().split("T")[0];
    }
    
    // Subscribe to State transition logging
    eventBus.subscribe(EVENTS.STATE_TRANSITION, (event) => {
      console.log(`[EventBus Notification] User transitioned states:`, event);
    });
  }

  // Bootstrap app and run loading page overlay
  const appInitPromise = init();
  uiController.runLoadingScreen(appInitPromise);
});
