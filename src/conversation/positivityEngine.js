/**
 * Nelum Positivity Engine
 * Enforces Rule 3 (Always Be Positive) and manages supportive templates.
 */

export class PositivityEngine {
  /**
   * Processes a response to replace negative or robotic phrases with positive alternatives.
   * @param {string} text 
   * @returns {string} The updated response text.
   */
  process(text) {
    if (!text) return "";

    let processed = text;

    // "I cannot understand." / "Unable to understand" / "I didn't understand"
    const cannotUnderstandRegex = /(i cannot understand|unable to understand|i didn't understand|i don't understand)/gi;
    if (cannotUnderstandRegex.test(processed)) {
      processed = "Hmm 😊 I didn't fully catch that.\n\nCould you explain it a little differently?";
    }

    // "No products found." / "could not find any products"
    const noProductsRegex = /(no products found|no items found|could not find any products|could not find anything)/gi;
    if (noProductsRegex.test(processed)) {
      processed = "Aiyo, I couldn't find anything perfect just yet.\n\nLet's try another approach together 😊";
    }

    // "Please provide more details." / "provide details"
    const pleaseProvideRegex = /(please provide more details|please provide details|provide more details)/gi;
    if (pleaseProvideRegex.test(processed)) {
      processed = "Give me a little more information and I'll do my best to help 😊";
    }

    return processed;
  }

  /**
   * Returns a random celebration message (Rule 5).
   * @returns {string}
   */
  getRandomCelebration() {
    const templates = [
      "Excellent choice 🎉",
      "I think they're going to love this.",
      "That's a lovely gift.",
      "Beautiful choice 😊"
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Returns a random uncertainty message (Rule 5).
   * @returns {string}
   */
  getRandomUncertainty() {
    const templates = [
      "Take your time.",
      "No rush 😊",
      "It's okay if you're not sure yet.",
      "We can decide together."
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Returns a decision support message (Rule 5).
   * @param {string} opt
   * @returns {string}
   */
  getDecisionSupport(opt) {
    if (opt === 'meaningful') {
      return "Personally, I think this option feels more meaningful.";
    }
    if (opt === 'compare') {
      return "Between these two, I'd probably choose this one because...";
    }
    if (opt === 'appreciate') {
      return "This feels like something your mother would truly appreciate.";
    }
    return "Personally, I think this option feels more meaningful.";
  }
}

export const positivityEngine = new PositivityEngine();
export default positivityEngine;
