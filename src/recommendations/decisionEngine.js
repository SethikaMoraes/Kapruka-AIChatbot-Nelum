/**
 * Nelum Decision Intelligence Engine
 * Governs the progressive conversational information gathering strategy (CFF)
 * and evaluates smart upsell triggers based on current cart and budget conditions.
 */

export class DecisionEngine {
  constructor() {
    this.relationshipRegistry = {
      wife: {
        relation: 'wife',
        expectedBudgetRange: [8000, 25000],
        preferredCategories: ['flowers', 'chocolates', 'cakes'],
        tone: 'WARM'
      },
      amma: {
        relation: 'mother',
        expectedBudgetRange: [5000, 15000],
        preferredCategories: ['flowers', 'groceries', 'tea_box'],
        tone: 'WARM'
      },
      mother: {
        relation: 'mother',
        expectedBudgetRange: [5000, 15000],
        preferredCategories: ['flowers', 'groceries', 'tea_box'],
        tone: 'WARM'
      },
      manager: {
        relation: 'manager',
        expectedBudgetRange: [4000, 8000],
        preferredCategories: ['groceries', 'tea_box'],
        tone: 'PROFESSIONAL'
      }
    };
  }

  /**
   * Evaluates session context to locate missing mandatory variables.
   * Maps to the guided shopping decision tree workflow.
   * @param {object} context 
   * @returns {object} { missingField: string|null, prompt: string|null }
   */
  evaluateConversationProgress(context) {
    const entities = context.extractedEntities || {};
    
    if (!entities.occasion) {
      return {
        missingField: 'occasion',
        prompt: "To help you choose the best surprise, what is the special occasion? (e.g., Birthday, Anniversary, Apology) 🌸"
      };
    }

    if (!entities.recipient) {
      return {
        missingField: 'recipient',
        prompt: "Aha, a surprise! Who are we sending this lovely gift to? (e.g., Wife, Mom, Friend, Manager) 😄"
      };
    }

    if (!entities.budget) {
      return {
        missingField: 'budget',
        prompt: "Got it! To filter our Kapruka catalog, do you have a specific budget in mind? (e.g., under Rs. 5,000 or Rs. 10,000) 💰"
      };
    }

    if (!context.delivery?.city && !entities.city) {
      return {
        missingField: 'city',
        prompt: "Lastly, where in Sri Lanka are we delivering this surprise? (e.g., Colombo, Kandy, Galle) 🚗"
      };
    }

    return { missingField: null, prompt: null };
  }

  /**
   * Checks for up-sell and cross-sell triggers.
   * @param {object} context 
   * @returns {object|null} Upsell recommendation details, or null if no triggers match.
   */
  evaluateUpsell(context) {
    const items = context.cart?.items || [];
    const subtotal = context.cart?.subtotal || 0;
    const targetBudget = context.extractedEntities?.budget || 1000000;
    
    // Rule 1: Cake in cart during cart building -> suggest candles/card
    const hasCake = items.some(i => i.title.toLowerCase().includes('cake') || i.title.toLowerCase().includes('gateau'));
    const hasCard = !!context.cart?.greetingCardMessage;
    
    if (hasCake && !hasCard) {
      return {
        type: 'COMPLIMENTARY_CARD',
        message: "Cakes look wonderful, but are empty without a sweet message. Would you like me to write a custom message on the cake, or add a beautiful handwritten card for free? 🌸",
        itemId: 'FLOWERS00T1901' // suggest flowers/card combo
      };
    }

    // Rule 2: Cart subtotal is close to budget -> offer bundle upgrade
    const headroom = targetBudget - subtotal;
    if (headroom > 0 && headroom <= targetBudget * 0.15) {
      // Suggest a premium chocolate upgrade or tea selection box
      return {
        type: 'BUDGET_UPGRADE',
        message: "You have a little room left in your budget! Shall I add our Ceylon Premium Tea Box or Chocolates with a special package discount? 🍫",
        upgradePrice: 3500
      };
    }

    return null;
  }
}

export const decisionEngine = new DecisionEngine();
export default decisionEngine;
