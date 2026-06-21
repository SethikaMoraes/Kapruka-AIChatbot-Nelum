/**
 * Nelum Conversation Memory
 * Persists and retrieves details for: recipient, occasion, budget, delivery city, delivery date, preferences, selected products, and gift message.
 * Prevents asking for details multiple times unless explicitly updated.
 */

export class ConversationMemory {
  /**
   * Initializes or gets the conversation memory object within the context.
   * @param {object} context 
   * @returns {object}
   */
  getMemory(context) {
    if (!context.conversationMemory) {
      context.conversationMemory = {
        recipient: null,
        occasion: null,
        budget: null,
        deliveryCity: null,
        deliveryDate: null,
        timeframe: null,
        preferences: [],
        selectedProducts: [],
        giftMessage: null
      };
    }
    return context.conversationMemory;
  }

  /**
   * Updates conversation memory from newly detected entities.
   * Ensures previously detected parameters are not overwritten unless explicitly requested.
   * @param {object} context 
   * @param {object} detectedEntities 
   */
  update(context, detectedEntities) {
    const mem = this.getMemory(context);

    if (detectedEntities.recipient && !mem.recipient) {
      mem.recipient = detectedEntities.recipient;
    }
    if (detectedEntities.occasion && !mem.occasion) {
      mem.occasion = detectedEntities.occasion;
    }
    if (detectedEntities.budget && !mem.budget) {
      mem.budget = detectedEntities.budget;
    }
    if (detectedEntities.deliveryCity && !mem.deliveryCity) {
      mem.deliveryCity = detectedEntities.deliveryCity;
    }
    if (detectedEntities.city && !mem.deliveryCity) {
      mem.deliveryCity = detectedEntities.city;
    }
    if (detectedEntities.deliveryDate && !mem.deliveryDate) {
      mem.deliveryDate = detectedEntities.deliveryDate;
    }
    if (detectedEntities.giftMessage && !mem.giftMessage) {
      mem.giftMessage = detectedEntities.giftMessage;
    }
    if (detectedEntities.timeframe && !mem.timeframe) {
      mem.timeframe = detectedEntities.timeframe;
    }

    // Extract preferences/interests
    if (detectedEntities.preferences && Array.isArray(detectedEntities.preferences)) {
      for (const pref of detectedEntities.preferences) {
        if (!mem.preferences.includes(pref)) {
          mem.preferences.push(pref);
        }
      }
    } else if (detectedEntities.preference && typeof detectedEntities.preference === 'string') {
      if (!mem.preferences.includes(detectedEntities.preference)) {
        mem.preferences.push(detectedEntities.preference);
      }
    }

    // Sync back to context.extractedEntities and context.delivery for backward compatibility
    context.extractedEntities = context.extractedEntities || {};
    context.extractedEntities.recipient = mem.recipient || context.extractedEntities.recipient;
    context.extractedEntities.occasion = mem.occasion || context.extractedEntities.occasion;
    context.extractedEntities.budget = mem.budget || context.extractedEntities.budget;
    context.extractedEntities.city = mem.deliveryCity || context.extractedEntities.city;
    context.extractedEntities.deliveryDate = mem.deliveryDate || context.extractedEntities.deliveryDate;
    context.extractedEntities.giftMessage = mem.giftMessage || context.extractedEntities.giftMessage;
    context.extractedEntities.timeframe = mem.timeframe || context.extractedEntities.timeframe;

    if (mem.deliveryCity) {
      context.delivery = context.delivery || {};
      context.delivery.city = mem.deliveryCity;
    }
    if (mem.deliveryDate) {
      context.delivery = context.delivery || {};
      context.delivery.date = mem.deliveryDate;
    }
  }

  /**
   * Reset selected parameters.
   * @param {object} context 
   * @param {Array<string>} keys 
   */
  clear(context, keys) {
    const mem = this.getMemory(context);
    for (const key of keys) {
      if (key in mem) {
        if (key === 'preferences' || key === 'selectedProducts') {
          mem[key] = [];
        } else {
          mem[key] = null;
        }
      }
    }
  }
}

export const conversationMemory = new ConversationMemory();
export default conversationMemory;
