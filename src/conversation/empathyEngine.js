/**
 * Nelum Empathy Engine
 * Handles empathetic responses, compliments, celebrations, and soft discovery transitions (Rule 2, 5).
 */

import { responseVariationEngine } from './responseVariationEngine.js';

export class EmpathyEngine {
  /**
   * Analyzes user input and emotion to provide empathetic or transitionary responses.
   * @param {object} context 
   * @param {string} userInput 
   * @param {string} emotion 
   * @returns {string|null} The empathetic response text, or null if not applicable.
   */
  getEmpatheticResponse(context, userInput, emotion) {
    const raw = userInput.toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?'"]/g, "").replace(/\s+/g, " ");

    // Rule 5: Compliment & Celebration Engine
    const isForMother = raw.includes('for my mother') || raw.includes('for my mom') || raw.includes('for mom') || raw.includes('for amma');
    const isBuyingOrGifting = raw.includes('buy') || raw.includes('get') || raw.includes('gift') || raw.includes('shop') || raw.includes('send') || raw.includes('surprise');
    if (isForMother && isBuyingOrGifting) {
      return "That's really thoughtful of you ❤️ I'm sure she'll appreciate the gesture.";
    }

    const isSurpriseWifeOrPartner = raw.includes('surprise my wife') || raw.includes('surprise my husband') || raw.includes('surprise my partner') || raw.includes('surprise my girlfriend') || raw.includes('surprise my boyfriend') || raw.includes('surprise my spouse');
    if (isSurpriseWifeOrPartner) {
      return "That's lovely 😊 Surprises usually create the best memories.";
    }

    // 1. Direct empathy responses (Rule 1 & 2 Examples, mapped to variation engine)
    if (raw === 'machan i need your help' || raw === 'i need your help') {
      return "Aney, of course 😊\n\nWhat's going on? Tell me. I'm listening.";
    }
    if (raw === 'can you help me') {
      return responseVariationEngine.getVariation(context, 'GENERAL_HELP');
    }
    if (raw === 'i dont know what to do' || raw === 'i do not know what to do') {
      return "No worries 😊 We'll figure it out together.\n\nTell me a little more about what's happening.";
    }

    // 2. Soft Discovery transitions (Rule 2)
    if (raw === 'i want to buy something') {
      return "Nice 😄\n\nWho are we shopping for today?";
    }
    if (raw === 'i need a gift') {
      return "Lovely 🎁\n\nWho's the lucky person?";
    }

    // If mother's birthday or similar is mentioned
    if (raw.includes('mothers birthday') || raw.includes('mom birthday') || raw.includes('mommy birthday') || raw.includes('amma ge birthday')) {
      return "Ah ❤️ That's special.\n\nLet's make sure we find something she'll genuinely love.\n\nTell me a little about your mother. What kinds of things does she enjoy?";
    }

    return null;
  }
}

export const empathyEngine = new EmpathyEngine();
export default empathyEngine;
