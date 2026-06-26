/**
 * Nelum Intent Detection Layer
 * Classifies raw user text queries into 12 structured shopping intents.
 */

import { languageProcessor } from '../localization/languageProcessor.js';
import { detectIntentWithLLM } from '../services/geminiClient.js';

export class IntentDetector {
  constructor() {
    this.intentKeywords = {
      GREETING: ['hi', 'hello', 'ayubowan', 'vanakkam', 'kohomada', 'good morning', 'good afternoon'],
      GIFT_DISCOVERY: ['gift', 'surprise', 'birthday', 'anniversary', 'sorry', 'apology', 'sympathy', 'wedding', 'new baby', 'vesak', 'avurudu', 'new year', 'amma', 'thaththa', 'wife'],
      PRODUCT_SEARCH: ['search', 'find', 'show', 'cakes', 'flowers', 'roses', 'lilies', 'chocolates', 'tea', 'groceries', 'playstation', 'ps5', 'teddy'],
      PRODUCT_FILTERING: ['under', 'less than', 'price', 'budget', 'cheap', 'cost'],
      CART_ADD: ['add', 'cart', 'put', 'write on', 'card message'],
      DELIVERY_CHECK: ['deliver', 'reach', 'puluwanda', 'ship', 'delivery'],
      CHECKOUT: ['checkout', 'pay', 'confirm', 'send', 'order', 'ready to send'],
      ORDER_TRACK: ['track', 'where is', 'kp-', 'status', 'parcel', 'parcel කොහේද'],
      GOODBYE: ['bye', 'goodbye', 'thank you', 'thanks', 'gihin ennam', 'poitu varugiren']
    };
  }

  /**
   * Identifies intent matching the user prompt.
   * @param {string} text 
   * @param {string} [activeLanguage='en'] 
   * @param {object} [context=null]
   * @returns {Promise<object>} IntentOutput details
   */
  async detect(text, activeLanguage = 'en', context = null) {
    const raw = text.toLowerCase().trim();
    
    // 1. Check hardcoded keyword patterns first
    const quickMatch = this._evaluateHardcodedKeywords(raw);
    if (quickMatch) return quickMatch;

    // 2. Delegate to LLM if context is available
    if (context) {
      try {
        console.log(`[IntentDetector] Querying Gemini LLM for intent classification...`);
        const llmResult = await detectIntentWithLLM(text, context);
        if (llmResult && llmResult.primaryIntent) {
          console.log(`[IntentDetector] Gemini LLM classified intent: ${llmResult.primaryIntent} (confidence: ${llmResult.confidence})`);
          return {
            primaryIntent: llmResult.primaryIntent,
            secondaryIntents: [],
            confidence: llmResult.confidence || 0.95,
            entities: llmResult.entities || {},
            language: llmResult.language || activeLanguage,
            nextAction: llmResult.primaryIntent.toLowerCase()
          };
        }
      } catch (e) {
        console.warn(`[IntentDetector] Gemini LLM failed: ${e.message}. Using rule-based fallback.`);
      }
    }

    // 2. Delegate to language parsing engine to extract localization features
    const parsedLocale = languageProcessor.parseQuery(text);
    
    // 3. Classify intent by checking term frequencies
    let primaryIntent = 'PRODUCT_SEARCH';
    let maxMatches = 0;

    for (const [intentName, words] of Object.entries(this.intentKeywords)) {
      const matches = words.filter(w => raw.includes(w)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        primaryIntent = intentName;
      }
    }

    // Override if language parser identified a direct state change
    if (parsedLocale.intent) {
      primaryIntent = parsedLocale.intent;
    }

    // 4. Resolve entities
    const entities = {
      ...parsedLocale.entities
    };

    // Extract budget ceiling
    const budgetMatch = raw.match(/(under|below|less than|rs\.?|rs)?\s?(\d{4,6})/);
    if (budgetMatch) {
      entities.budget = Number(budgetMatch[2]);
    }

    return {
      primaryIntent,
      secondaryIntents: [],
      confidence: maxMatches > 0 ? 0.9 : 0.65,
      entities,
      language: parsedLocale.language,
      nextAction: primaryIntent.toLowerCase()
    };
  }

  _evaluateHardcodedKeywords(raw) {
    if (['hi', 'hello', 'ayubowan', 'vanakkam', 'kohomada'].includes(raw)) {
      return {
        primaryIntent: 'GREETING',
        secondaryIntents: [],
        confidence: 1.0,
        entities: {},
        language: raw === 'vanakkam' ? 'ta' : (raw === 'hello' ? 'en' : 'mix'),
        nextAction: 'welcome'
      };
    }
    
    const idMatch = raw.match(/(kp-\d+|ord-[\w-]+)/i);
    if (raw.includes('track') || idMatch) {
      return {
        primaryIntent: 'ORDER_TRACK',
        secondaryIntents: [],
        confidence: 0.95,
        entities: { orderId: idMatch ? idMatch[0].toUpperCase() : null },
        language: 'en',
        nextAction: 'track'
      };
    }

    return null;
  }
}

export const intentDetector = new IntentDetector();
export default intentDetector;
