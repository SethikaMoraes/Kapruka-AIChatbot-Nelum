/**
 * Nelum Conversation Manager
 * Coordinates session load/save, intent parsing, state transitions, and worker agent execution.
 */

import { StateMachineRegistry } from './stateMachine.js';
import { eventBus } from '../utils/eventBus.js';
import { getUserFriendlyMessage } from '../utils/errorHandler.js';

export class ConversationManager {
  /**
   * @param {object} memoryStore Database / Session Cache connector
   * @param {object} intentDetector Parsing system for raw queries
   * @param {object} agentOrchestrator Coordinator for worker agents
   */
  constructor(memoryStore, intentDetector, agentOrchestrator) {
    this.memoryStore = memoryStore;
    this.intentDetector = intentDetector;
    this.agentOrchestrator = agentOrchestrator;
    this.stateRegistry = new StateMachineRegistry();
    this.activeLanguage = 'en';
  }

  /**
   * Main entry point to process a customer message turn.
   * @param {string} sessionId 
   * @param {string} message 
   * @param {string} [userId] 
   * @returns {Promise<string>} Nelum's text response
   */
  async processMessage(sessionId, message, userId = null) {
    try {
      console.log(`[ConversationManager] Processing message: "${message}" for session: ${sessionId}`);

      // 1. Load active conversation context
      let context = await this.memoryStore.loadSession(sessionId);
      if (!context) {
        context = this.createNewContext(sessionId, userId);
        console.log(`[ConversationManager] Created new session context for ${sessionId}`);
      }

      const conversationalStates = [
        'WELCOME',
        'DISCOVERY',
        'GIFT_DISCOVERY',
        'PRODUCT_SEARCH',
        'GREETING',
        'RELATIONSHIP_DISCOVERY',
        'OCCASION_DISCOVERY',
        'BUDGET_DISCOVERY',
        'PREFERENCE_DISCOVERY',
        'RECOMMENDATION',
        'COMPARISON',
        'POST_PURCHASE',
        'GOODBYE'
      ];

      let agentResponse;

      if (conversationalStates.includes(context.activeState)) {
        const { conversationIntelligence } = await import('../conversation/conversationIntelligence.js');
        agentResponse = await conversationIntelligence.process(context, message);
      } else {
        // 2. Classify raw string utilizing the Intent Detection System
        const intentOutput = await this.intentDetector.detect(message, context.languageCode, context);
        console.log(`[ConversationManager] Intent classified: ${intentOutput.primaryIntent} (confidence: ${intentOutput.confidence})`);

        // Merge language and entities back into context
        context.languageCode = intentOutput.language;
        context.extractedEntities = {
          ...context.extractedEntities,
          ...intentOutput.entities
        };

        // 3. Retrieve current active state class
        let activeStateObj = this.stateRegistry.getState(context.activeState);

        // 4. Check Exit Criteria & process input on current state
        const canExit = activeStateObj.validateExit(context);
        let nextState = context.activeState;

        if (canExit) {
          nextState = activeStateObj.determineTransition(context, intentOutput);
        } else {
          console.log(`[ConversationManager] Cannot exit state ${context.activeState} due to missing required entities.`);
        }

        // 5. Handle State Transition (Exit old state, Enter new state)
        if (nextState !== context.activeState) {
          console.log(`[StateMachine] Transitioning: ${context.activeState} -> ${nextState}`);
          await activeStateObj.onExit(context);
          
          // Publish transition event
          eventBus.publish('state_transition', {
            sessionId,
            oldState: context.activeState,
            newState: nextState,
            entities: context.extractedEntities
          });

          context.activeState = nextState;
          
          activeStateObj = this.stateRegistry.getState(nextState);
          await activeStateObj.onEntry(context);
        }

        // 6. Select appropriate specialized agent to run logic via Orchestrator
        agentResponse = await this.agentOrchestrator.execute(context, message, intentOutput);
      }

      // 7. Recalculate totals and save context
      this.recalculateCartSubtotal(context);
      this.activeLanguage = context.languageCode || 'en';
      await this.memoryStore.saveSession(sessionId, context);

      // Publish message processed event
      eventBus.publish('message_processed', {
        sessionId,
        currentState: context.activeState,
        cartCount: context.cart.items.length
      });

      return agentResponse;

    } catch (error) {
      console.error(`[ConversationManager] Critical error in processMessage:`, error);
      return getUserFriendlyMessage(error);
    }
  }

  /**
   * Instantiates an empty context container schema.
   * @param {string} sessionId 
   * @param {string} userId 
   * @returns {object}
   */
  createNewContext(sessionId, userId) {
    return {
      sessionId,
      userId: userId || null,
      activeState: 'WELCOME',
      languageCode: 'en',
      extractedEntities: {},
      cart: {
        items: [],
        subtotal: 0,
        greetingCardMessage: null
      },
      delivery: {
        recipientName: null,
        recipientPhone: null,
        address: null,
        date: null,
        timeWindow: 'any',
        senderName: null
      },
      trackingReference: null
    };
  }

  /**
   * Recalculates cart subtotals
   * @param {object} context 
   */
  recalculateCartSubtotal(context) {
    let subtotal = 0;
    if (context.cart && context.cart.items) {
      for (const item of context.cart.items) {
        const itemPrice = item.price || 0;
        subtotal += itemPrice * item.qty;
      }
      context.cart.subtotal = subtotal;
    }
  }
}
