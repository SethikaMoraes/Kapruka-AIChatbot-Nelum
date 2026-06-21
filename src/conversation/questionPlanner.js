/**
 * Nelum Question Planner
 * Evaluates conversation memory to identify missing fields and determine the next logical state.
 * Returns suggested options to display as quick chips.
 */

export class QuestionPlanner {
  /**
   * Plans the next question phase based on conversation memory status.
   * @param {object} context 
   * @returns {object} { nextState: string, missingField: string|null, options: Array<string>|null }
   */
  plan(context) {
    const mem = context.conversationMemory || {};

    // 1. Check Recipient
    if (!mem.recipient) {
      return {
        nextState: 'RELATIONSHIP_DISCOVERY',
        missingField: 'recipient',
        options: ['Mother', 'Father', 'Partner', 'Friend', 'Child']
      };
    }

    // 2. Check Occasion
    if (!mem.occasion) {
      return {
        nextState: 'OCCASION_DISCOVERY',
        missingField: 'occasion',
        options: ['Birthday', 'Anniversary', 'Apology', 'Thank You', 'Congratulations']
      };
    }

    // 3. Check Preferences/Interests
    if (!mem.preferences || mem.preferences.length === 0) {
      return {
        nextState: 'PREFERENCE_DISCOVERY',
        missingField: 'preferences',
        options: ['Flowers', 'Cakes', 'Chocolates', 'Gift Hampers', 'Books', 'Gardening']
      };
    }

    // 4. Check Budget
    if (!mem.budget) {
      return {
        nextState: 'BUDGET_DISCOVERY',
        missingField: 'budget',
        options: ['Under Rs. 5000', 'Rs. 5000 - 10000', 'Rs. 10000+']
      };
    }

    // All discovery fields collected! Transition to Recommendation
    return {
      nextState: 'RECOMMENDATION',
      missingField: null,
      options: null
    };
  }
}

export const questionPlanner = new QuestionPlanner();
export default questionPlanner;
