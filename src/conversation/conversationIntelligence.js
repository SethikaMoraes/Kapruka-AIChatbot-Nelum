/**
 * Nelum Conversation Intelligence Engine
 * Orchestrates the conversational buddy lifecycle: Language/Emotion/Occasion/Relationship Detection,
 * Memory updates, State transitions, MCP search constraints, and Response composition.
 */

import { languageProcessor } from '../localization/languageProcessor.js';
import { emotionDetector } from './emotionDetector.js';
import { occasionDetector } from './occasionDetector.js';
import { relationshipDetector } from './relationshipDetector.js';
import { conversationMemory } from './conversationMemory.js';
import { questionPlanner } from './questionPlanner.js';
import { responseComposer } from './responseComposer.js';
import { analyzeConversationTurn } from '../services/geminiClient.js';
import { kaprukaClient } from '../api/kaprukaClient.js';
import { recommendationEngine } from '../recommendations/recommendationEngine.js';
import { friendshipEngine } from './friendshipEngine.js';
import { responseHumanizer } from './responseHumanizer.js';

export class ConversationIntelligence {
  /**
   * Processes a conversation turn.
   * @param {object} context Session context
   * @param {string} userInput User raw text
   * @returns {Promise<string>} Nelum's text response
   */
  async process(context, userInput) {
    console.log(`[ConversationIntelligence] Processing user input: "${userInput}"`);

    // 1. Language Detection (Offline fallback & fast parse first)
    const fastLang = languageProcessor.detectLanguage(userInput);

    // 2. Perform Unified LLM Analysis for conversational details
    let analysis = {
      language: fastLang,
      emotion: 'Neutral',
      occasion: null,
      relationship: null,
      recipientName: null,
      deliveryCity: null,
      deliveryDate: null,
      budget: null,
      preferences: [],
      confidence: 0.9
    };

    try {
      const llmAnalysis = await analyzeConversationTurn(userInput, context);
      if (llmAnalysis) {
        analysis = { ...analysis, ...llmAnalysis };
      }
    } catch (e) {
      console.warn(`[ConversationIntelligence] Unified LLM analysis failed: ${e.message}. Using rule detectors.`);
    }

    // 3. Fallback to modular rule detectors if LLM analysis returned nulls
    if (!analysis.emotion || analysis.emotion === 'Neutral') {
      analysis.emotion = emotionDetector.detect(userInput, context);
    }
    if (!analysis.occasion) {
      analysis.occasion = occasionDetector.detect(userInput, context);
    }
    if (!analysis.relationship) {
      analysis.relationship = relationshipDetector.detect(userInput, context);
    }

    conversationMemory.update(context, {
      recipient: analysis.relationship,
      occasion: analysis.occasion,
      budget: analysis.budget,
      city: analysis.deliveryCity,
      deliveryDate: analysis.deliveryDate,
      timeframe: analysis.timeframe,
      preferences: analysis.preferences
    });

    const mem = conversationMemory.getMemory(context);

    // Enforce Rule 1 & 2: Friendship Engine turn interception
    const friendshipReply = await friendshipEngine.processTurn(context, userInput, analysis);
    if (friendshipReply) {
      return friendshipReply;
    }

    // 5. Evaluate state machine transitions
    const plannerResult = questionPlanner.plan(context);
    let nextState = context.activeState || 'GREETING';

    const rawInput = userInput.trim().toLowerCase();
    
    // Command / Intent Override checks
    if (rawInput === 'hi machan' || rawInput === 'hi machang' || rawInput === 'hello' || rawInput === 'ayubowan') {
      nextState = 'GREETING';
    } else if (rawInput.includes('track') || rawInput.match(/(kp-\d+|ord-[\w-]+)/i)) {
      nextState = 'TRACKING';
    } else if (rawInput.includes('checkout') || rawInput.includes('ready to send') || rawInput.includes('confirm & pay') || rawInput.includes('payment')) {
      nextState = 'CHECKOUT';
    } else if (rawInput.includes('bye') || rawInput.includes('goodbye') || rawInput.includes('sthuthi') || rawInput.includes('thank you')) {
      nextState = 'GOODBYE';
    } else if (context.activeState === 'RECOMMENDATION' && (rawInput.includes('compare') || rawInput.includes('versus') || rawInput.includes('vs') || rawInput.includes('better'))) {
      nextState = 'COMPARISON';
    } else {
      // Transition governed by missing fields
      nextState = plannerResult.nextState;
    }

    context.activeState = nextState;
    console.log(`[ConversationIntelligence] State updated to: ${context.activeState}`);

    // 6. Product Search Trigger Guard
    // Search only after enough information is collected: Recipient, Occasion, and Budget (known or inferred)
    const hasRecipient = !!mem.recipient;
    const hasOccasion = !!mem.occasion;
    const hasBudget = !!mem.budget;
    const enoughContext = mem.preferences && mem.preferences.length > 0;
    const hasHighConfidence = analysis.confidence >= 0.85;
    const hesitationDetected = !!context.emotionalMemory?.hesitationDetected;

    const canSearch = hasRecipient && hasOccasion && (hasBudget || rawInput.includes('gardening')) && enoughContext && hasHighConfidence && !hesitationDetected;

    if (canSearch && (context.activeState === 'RECOMMENDATION' || context.activeState === 'COMPARISON')) {
      console.log(`[ConversationIntelligence] Search trigger guard PASSED (Confidence: ${analysis.confidence}). Calling MCP...`);
      try {
        const searchWord = mem.preferences[0] || 'gift';
        const budgetLimit = mem.budget || null;
        
        let products = await kaprukaClient.searchProducts(searchWord, null, budgetLimit);
        
        // Rank products using recommendation score
        const ranked = recommendationEngine.rankProducts(products, context);
        context.recommendedProducts = ranked;
      } catch (err) {
        console.warn(`[ConversationIntelligence] MCP Search failed:`, err.message);
      }
    } else {
      console.log(`[ConversationIntelligence] Search trigger guard SKIPPED. Missing fields or Confidence low. DO NOT CALL MCP.`);
      // Clear pre-existing recommendations to prevent old products from displaying
      context.recommendedProducts = [];
    }

    // 7. Generate Response using Response Composer
    const replyText = await responseComposer.compose(context, userInput, analysis, plannerResult);
    return friendshipEngine.refineOutput(context, replyText);
  }
}

export const conversationIntelligence = new ConversationIntelligence();
export default conversationIntelligence;
