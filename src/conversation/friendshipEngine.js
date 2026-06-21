/**
 * Nelum Friendship Engine (Phase 16)
 * Coordinates conversational modes, emotional memory, proactive suggestions,
 * small talk, empathy/compliments, fillers, friendship scores, and post-purchase loops.
 */

import { conversationModeManager } from './conversationModeManager.js';
import { empathyEngine } from './empathyEngine.js';
import { smallTalkEngine } from './smallTalkEngine.js';
import { positivityEngine } from './positivityEngine.js';
import { clarificationEngine } from './clarificationEngine.js';
import { responseHumanizer } from './responseHumanizer.js';
import { responseVariationEngine } from './responseVariationEngine.js';
import { emotionalMemoryEngine } from './emotionalMemoryEngine.js';
import { proactiveSuggestionEngine } from './proactiveSuggestionEngine.js';

export class FriendshipEngine {
  constructor() {
    this.modeManager = conversationModeManager;
    this.empathy = empathyEngine;
    this.smallTalk = smallTalkEngine;
    this.positivity = positivityEngine;
    this.clarification = clarificationEngine;
    this.humanizer = responseHumanizer;
    this.variations = responseVariationEngine;
    this.emotionalMemory = emotionalMemoryEngine;
    this.proactive = proactiveSuggestionEngine;
  }

  /**
   * Processes a turn in the conversation, managing friendship rules and logic.
   * @param {object} context 
   * @param {string} userInput 
   * @param {object} analysis 
   * @returns {Promise<string|null>} The response string if intercepted, or null.
   */
  async processTurn(context, userInput, analysis) {
    // 1. Initialize and update emotional memory (Rule 2)
    const emMem = this.emotionalMemory.init(context);
    this.emotionalMemory.analyze(context, userInput, analysis);

    const rawInput = userInput.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?'"]/g, "").replace(/\s+/g, " ");

    // 2. Increment Friendship Score based on triggers (Rule 8)
    
    // First session load/initial turn (simulated via turns count = 0 or flag)
    if (!emMem.sessionCounted) {
      emMem.sessionCounted = true;
      emMem.friendshipScore += 3;
      console.log(`[FriendshipEngine] +3 points for new session. Friendship Score: ${emMem.friendshipScore}`);
    }

    // Casual small talk detection
    const isSmallTalk = this.modeManager.determineMode(context, userInput, analysis) === 'SMALL_TALK';
    if (isSmallTalk) {
      emMem.friendshipScore += 1;
      console.log(`[FriendshipEngine] +1 point for small talk. Friendship Score: ${emMem.friendshipScore}`);
    }

    // Thank you detection
    const isThanks = rawInput === 'thank you' || rawInput === 'thanks' || rawInput === 'sthuthi';
    if (isThanks) {
      emMem.friendshipScore += 2;
      console.log(`[FriendshipEngine] +2 points for thank you. Friendship Score: ${emMem.friendshipScore}`);
    }

    // Successful purchase detection
    if (context.trackingReference && !emMem.purchaseCounted) {
      emMem.purchaseCounted = true;
      emMem.friendshipScore += 5;
      console.log(`[FriendshipEngine] +5 points for successful purchase. Friendship Score: ${emMem.friendshipScore}`);
    }

    // 3. Post-Purchase Relationship Loop (Rule 9)
    if (emMem.purchaseCounted) {
      emMem.postPurchaseTurns = (emMem.postPurchaseTurns || 0) + 1;
      if (emMem.postPurchaseTurns >= 3 && !emMem.postPurchaseTriggered) {
        emMem.postPurchaseTriggered = true;
        const postPurchaseTemplates = [
          "Hope the gift was well received 😊",
          "Did they enjoy the surprise?"
        ];
        const selectedResponse = postPurchaseTemplates[Math.floor(Math.random() * postPurchaseTemplates.length)];
        return this.humanizer.humanize(this.positivity.process(selectedResponse));
      }
    }

    // 4. Hesitation Detection (Rule 4)
    const hesitationKeywords = ['maybe', 'not sure', 'dont know', 'confused', 'anything', 'whatever'];
    const hasHesitation = hesitationKeywords.some(kw => rawInput.includes(kw));
    
    if (hasHesitation) {
      console.log(`[FriendshipEngine] Hesitation detected. Blocking search widget.`);
      emMem.hesitationDetected = true;
      context.activeState = 'RELATIONSHIP_DISCOVERY'; // Force discovery reset to guide gently
      
      const hesitationReply = this.variations.getVariation(context, 'HESITATION');
      return this.humanizer.humanize(this.positivity.process(hesitationReply));
    } else {
      emMem.hesitationDetected = false; // Reset if they are confident on this turn
    }

    // 5. Determine active mode and store in context
    const mode = this.modeManager.determineMode(context, userInput, analysis);
    context.activeMode = mode;

    // 6. Proactive Suggestion Engine (Rule 3)
    const proactiveReply = this.proactive.getProactiveSuggestion(context, userInput, analysis);
    if (proactiveReply) {
      console.log(`[FriendshipEngine] Proactive guidance triggered`);
      return this.humanizer.humanize(this.positivity.process(proactiveReply));
    }

    // 7. Small Talk handler call (Rule 6)
    const smallTalkReply = this.smallTalk.handleSmallTalk(context, userInput);
    if (smallTalkReply) {
      console.log(`[FriendshipEngine] Handled by Small Talk Engine`);
      return this.humanizer.humanize(this.positivity.process(smallTalkReply));
    }

    // 8. Empathy & Soft Discovery/Compliment handler call (Rule 2, 5)
    const empathyReply = this.empathy.getEmpatheticResponse(context, userInput, analysis.emotion);
    if (empathyReply) {
      console.log(`[FriendshipEngine] Handled by Empathy Engine`);
      return this.humanizer.humanize(this.positivity.process(empathyReply));
    }

    // 9. Low Confidence Guard (Rule 1: Never Assume Shopping when confidence < 85%)
    const confidence = analysis.confidence !== undefined ? analysis.confidence : 1.0;
    if (confidence < 0.85) {
      const nonShoppingModes = ['FRIEND_CHAT', 'SMALL_TALK', 'GENERAL_HELP'];
      if (nonShoppingModes.includes(mode)) {
        console.log(`[FriendshipEngine] Low confidence (${confidence} < 0.85) - triggering clarification`);
        const clarificationResponse = this.variations.getVariation(context, 'CLARIFICATION');
        return this.humanizer.humanize(this.positivity.process(clarificationResponse));
      }
    }

    return null;
  }

  /**
   * Applies final humanization, emotional prefixes, and human pauses/conversational fillers.
   * @param {object} context 
   * @param {string} text 
   * @returns {string} The fully refined conversational text.
   */
  refineOutput(context, text) {
    if (!text) return "";

    const emMem = this.emotionalMemory.init(context);

    // 1. Empathize using prefixes (Rule 2)
    const emoPrefix = this.emotionalMemory.getEmpatheticPrefix(context);

    // 2. Conversational fillers (Rule 7: Max 1 every 3 responses)
    let fillerPrefix = "";
    emMem.fillerTurnsCooldown = (emMem.fillerTurnsCooldown || 0) - 1;
    
    if (emMem.fillerTurnsCooldown <= 0) {
      const fillers = ["Hmm... ", "Ah... ", "Oho... ", "Aney... ", "Interesting 😊 "];
      fillerPrefix = fillers[Math.floor(Math.random() * fillers.length)];
      emMem.fillerTurnsCooldown = 3; // Reset cooldown
      console.log(`[FriendshipEngine] Injected natural flow filler: "${fillerPrefix.trim()}"`);
    }

    const finalResponse = this.humanizer.humanize(this.positivity.process(`${emoPrefix}${fillerPrefix}${text}`));
    return finalResponse;
  }
}

export const friendshipEngine = new FriendshipEngine();
export default friendshipEngine;
