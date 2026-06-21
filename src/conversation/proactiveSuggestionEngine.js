/**
 * Nelum Proactive Suggestion Engine
 * Provides occasional conversational guidance to the user (Rule 3).
 */

export class ProactiveSuggestionEngine {
  /**
   * Evaluates if proactive guidance should be returned for this turn.
   * @param {object} context 
   * @param {string} userInput 
   * @param {object} analysis 
   * @returns {string|null} The proactive suggestion response, or null.
   */
  getProactiveSuggestion(context, userInput, analysis) {
    context.emotionalMemory = context.emotionalMemory || {};
    const mem = context.conversationMemory || {};

    // Check if we already showed proactive suggestion in this segment
    if (context.emotionalMemory.proactiveShown) {
      return null;
    }

    const raw = userInput.toLowerCase();

    // Trigger proactive help if user mentions a recipient's birthday or occasion
    const hasRecipient = !!mem.recipient || !!analysis.relationship;
    const hasOccasion = !!mem.occasion || !!analysis.occasion;
    const hasTimeframe = raw.includes('next week') || raw.includes('coming') || raw.includes('soon') || raw.includes('tomorrow');

    if (hasRecipient && hasOccasion && hasTimeframe && (!mem.preferences || mem.preferences.length === 0)) {
      context.emotionalMemory.proactiveShown = true;
      return "We still have plenty of time 😊\n\nWould you like me to suggest:\n\n🎂 Cakes\n🌸 Flowers\n🎁 Gift hampers\n💍 Jewelry\n\nor should we explore something unique?";
    }

    return null;
  }
}

export const proactiveSuggestionEngine = new ProactiveSuggestionEngine();
export default proactiveSuggestionEngine;
