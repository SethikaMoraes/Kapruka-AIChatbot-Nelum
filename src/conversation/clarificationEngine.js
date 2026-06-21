/**
 * Nelum Clarification Engine
 * Handles low confidence scenarios naturally by asking friendly clarifying questions.
 */

export class ClarificationEngine {
  /**
   * Generates a warm, friendly clarifying question.
   * @param {string} userInput 
   * @returns {string} Clarification response.
   */
  getClarification(userInput) {
    return "Hmm 😊 I didn't fully catch that.\n\nCould you explain it a little differently? I'm here to help!";
  }
}

export const clarificationEngine = new ClarificationEngine();
export default clarificationEngine;
