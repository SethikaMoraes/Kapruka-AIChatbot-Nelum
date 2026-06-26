/**
 * Nelum Response Variation Engine
 * Manages banks of 20+ variations per response category and prevents repetition within 10 turns.
 */
import { VARIATIONS } from '../constants/variations.constants.js';


export class ResponseVariationEngine {
  /**
   * Selects a random variation for a given category, ensuring no repeat within 10 turns.
   * @param {object} context 
   * @param {string} category 
   * @returns {string} The selected response variation.
   */
  getVariation(context, category) {
    // 1. Initialize emotionalMemory context if missing
    context.emotionalMemory = context.emotionalMemory || {};
    context.emotionalMemory.usedTemplates = context.emotionalMemory.usedTemplates || [];
    context.emotionalMemory.friendshipScore = context.emotionalMemory.friendshipScore || 0;

    let templates = VARIATIONS[category] || ["Hello 😊"];

    // 2. Unlock warmer greetings for high friendship score (Rule 8)
    if (category === 'GREETINGS' && context.emotionalMemory.friendshipScore > 10) {
      templates = VARIATIONS.GREETINGS_WARM;
    }

    // 3. Filter templates to remove recently used ones
    const used = context.emotionalMemory.usedTemplates;
    let candidates = templates.filter(t => !used.includes(t));

    // If all templates were used, reset history for this category or globally
    if (candidates.length === 0) {
      candidates = templates;
    }

    // 4. Select a random template
    const selected = candidates[Math.floor(Math.random() * candidates.length)];

    // 5. Update the used templates queue (last 10 turns)
    used.push(selected);
    if (used.length > 10) {
      used.shift();
    }

    return selected;
  }
}

export const responseVariationEngine = new ResponseVariationEngine();
export default responseVariationEngine;
