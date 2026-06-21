/**
 * Nelum Conversation Mode Manager
 * Manages the active mode state machine.
 */

export const CONVERSATION_MODES = {
  FRIEND_CHAT: 'FRIEND_CHAT',
  GENERAL_HELP: 'GENERAL_HELP',
  SMALL_TALK: 'SMALL_TALK',
  SHOPPING_DISCOVERY: 'SHOPPING_DISCOVERY',
  PRODUCT_DISCOVERY: 'PRODUCT_DISCOVERY',
  RECOMMENDATION: 'RECOMMENDATION',
  DELIVERY_ASSISTANCE: 'DELIVERY_ASSISTANCE',
  CHECKOUT_ASSISTANCE: 'CHECKOUT_ASSISTANCE',
  ORDER_SUPPORT: 'ORDER_SUPPORT',
  GOODBYE: 'GOODBYE'
};

export class ConversationModeManager {
  /**
   * Evaluates user input and context to determine the current conversation mode.
   * @param {object} context 
   * @param {string} userInput 
   * @param {object} analysis 
   * @returns {string} One of CONVERSATION_MODES
   */
  determineMode(context, userInput, analysis) {
    const rawInput = userInput.trim().toLowerCase();
    
    // 1. Order tracking references / queries
    if (rawInput.includes('track') || rawInput.match(/(kp-\d+|ord-[\w-]+)/i) || context.activeState === 'TRACKING') {
      return CONVERSATION_MODES.ORDER_SUPPORT;
    }
    
    // 2. Checkout / payment intentions
    if (rawInput.includes('checkout') || rawInput.includes('ready to send') || rawInput.includes('confirm & pay') || rawInput.includes('payment') || context.activeState === 'CHECKOUT') {
      return CONVERSATION_MODES.CHECKOUT_ASSISTANCE;
    }
    
    // 3. Delivery / location queries
    if (rawInput.includes('deliver') || rawInput.includes('city') || rawInput.includes('fee') || rawInput.includes('can you send') || rawInput.includes('delivery date') || context.activeState === 'DELIVERY_CHECK') {
      return CONVERSATION_MODES.DELIVERY_ASSISTANCE;
    }
    
    // 4. Goodbyes / thank yous
    if (rawInput.includes('bye') || rawInput.includes('goodbye') || rawInput.includes('sthuthi') || rawInput.includes('thank you') || context.activeState === 'GOODBYE') {
      return CONVERSATION_MODES.GOODBYE;
    }

    // 5. Small Talk keywords (Rule 6)
    const smallTalkKeywords = [
      'how are you', 'how r u', 'whats up', 'what\'s up', 'how was your day', 'how was ur day',
      'tell me a joke', 'joke', 'stressed', 'tired', 'confused', 'good night', 'good morning'
    ];
    if (smallTalkKeywords.some(kw => rawInput.includes(kw))) {
      return CONVERSATION_MODES.SMALL_TALK;
    }

    // 6. General Help inquiries
    if (rawInput.includes('help') || rawInput.includes('can you help') || rawInput.includes('what can you do') || rawInput.includes('stuck') || rawInput.includes('don\'t know what to do')) {
      return CONVERSATION_MODES.GENERAL_HELP;
    }

    // 7. Shopping intents (Rule 2: Soft Discovery)
    const shoppingKeywords = [
      'buy', 'gift', 'present', 'order', 'shop', 'send', 'purchase', 'surprise', 'get something',
      'cake', 'flower', 'chocolate', 'grocery', 'toy', 'electronic', 'hampers'
    ];
    const hasShoppingKeyword = shoppingKeywords.some(kw => rawInput.includes(kw));
    const hasRecipientOrOccasion = !!analysis.relationship || !!analysis.occasion || (analysis.preferences && analysis.preferences.length > 0);
    
    if (hasShoppingKeyword || hasRecipientOrOccasion) {
      const mem = context.conversationMemory || {};
      
      // If we have all core shopping attributes, we are in RECOMMENDATION
      if (mem.recipient && mem.occasion && mem.budget && (mem.preferences && mem.preferences.length > 0)) {
        return CONVERSATION_MODES.RECOMMENDATION;
      }
      
      // If we have started collecting context, we are in SHOPPING_DISCOVERY
      if (mem.recipient || mem.occasion || (mem.preferences && mem.preferences.length > 0)) {
        return CONVERSATION_MODES.SHOPPING_DISCOVERY;
      }
      
      return CONVERSATION_MODES.PRODUCT_DISCOVERY;
    }

    // Default to retaining activeMode, or FRIEND_CHAT
    return context.activeMode || CONVERSATION_MODES.FRIEND_CHAT;
  }
}

export const conversationModeManager = new ConversationModeManager();
export default conversationModeManager;
