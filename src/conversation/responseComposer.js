/**
 * Nelum Response Composer
 * Formulates empathetic, best-friend style Sri Lankan responses.
 * Avoids robotic phrases, adapts to emotions, and provides decision guidance.
 */

import { generateResponse } from '../services/geminiClient.js';

export const COMPOSER_SYSTEM_PROMPT = `You are Nelum, a warm, caring Sri Lankan best friend and shopping companion for Kapruka surprises.
You act as a buddy who helps the user make choices.

Tone Rules:
1. Speak naturally using a warm, friendly romanized Singlish/English mix like "machan", "amma", "thaththa", "aiyo", "elakiri", "hari", "ne".
2. Sri Lankan Slang Density: DO NOT overuse slang. Maximum one local expression (e.g., machan, aiyo, elakiri) every 2-3 responses. Let it feel natural and not forced.
3. Adapt to the user's detected emotion:
   - If Caring: Be warm, sweet, and supportive (e.g. for mom's birthday: "Amma ge birthday eka nam special day ekak ne. Let's find something she'll genuinely love.")
   - If Apologetic: Suggest sweet options like lilies, chocolates, and say "Aiyo, let's write a sweet card message ne."
   - If Unsure: Ask questions, list options, explain why they fit, and help them decide.
4. STRICTLY REMOVE and NEVER use these robotic/software phrases:
   - "Looks like you said"
   - "Intent detected"
   - "Searching products"
   - "Unable to understand"
   - "Please provide details"
   - "Please provide more details"
   - "Processing request"
   - "Invalid input"
   - "No data found"
   - "System error"
   - "I detected"
5. Decision Guidance: Do not dump lists of products. Help guide them.
`;

export class ResponseComposer {
  /**
   * Composes the final companion text response.
   * @param {object} context 
   * @param {string} userInput 
   * @param {object} analysis 
   * @param {object} [plannerResult=null] 
   * @returns {Promise<string>}
   */
  async compose(context, userInput, analysis, plannerResult = null) {
    const rawInput = userInput.trim().toLowerCase();

    // 1. Check exact match templates from user requirements to guarantee accuracy
    
    // "Hi machan"
    if (rawInput === 'hi machan' || rawInput === 'hi machang' || rawInput === 'hello' || rawInput === 'ayubowan') {
      return "Ayubowan 👋 Kohomada? Hello 😊 Good to see you. How can I help you today?";
    }

    // "Godak kalekin dakkie" or "godak kalekin dakke"
    if (rawInput.includes('godak kalekin dakkie') || rawInput.includes('godak kalekin dakke')) {
      return "Aney machan 😄 Godak kalekin thamai. What's the scene today?";
    }

    // "Amma ge birthday"
    if (rawInput === 'amma ge birthday' || rawInput === 'amma birthday') {
      return "Ah ❤️ That's special. Let's make sure we find something she'll genuinely love. Tell me a little about your mother. What kinds of things does she enjoy?";
    }

    // "My mother's birthday is coming up soon."
    if (rawInput.includes('mother') && rawInput.includes('birthday') && (rawInput.includes('soon') || rawInput.includes('coming') || rawInput.includes('next week'))) {
      return "Ah ❤️ That's special.\n\nLet's make sure we find something she'll genuinely love.\n\nTell me a little about your mother. What kinds of things does she enjoy?";
    }

    // "I don't know what to buy."
    if (rawInput.includes('don\'t know what to buy') || rawInput.includes('dont know what to buy') || rawInput.includes('i don\'t know what to choose')) {
      return "It's okay if you're not sure yet. No rush 😊 We can decide together. Tell me, who are we shopping for today?";
    }

    // "She likes gardening."
    if (rawInput.includes('gardening') || rawInput.includes('she likes gardening')) {
      return "Oho 🌱\n\nThen we already have a good direction.\n\nInstead of generic gifts, let's look at things a gardening lover would actually enjoy.\n\nWhat's your budget?\n\nUnder Rs.5000\nRs.5000-10000\nRs.10000+";
    }

    // 2. Dynamic generation using Gemini with Sri Lankan Buddy tone rules
    const recipient = context.conversationMemory?.recipient || 'them';
    const occasion = context.conversationMemory?.occasion || 'the occasion';
    const budget = context.conversationMemory?.budget ? `Rs. ${context.conversationMemory.budget}` : 'not set yet';
    const preferences = context.conversationMemory?.preferences?.join(', ') || 'none';

    let prompt = `User input: "${userInput}"
Current State: ${context.activeState}
Detected Emotion: ${analysis.emotion || 'Neutral'}
Detected Occasion: ${analysis.occasion || 'None'}
Detected Relationship: ${analysis.relationship || 'None'}

Conversation Memory Context:
- Recipient/Relationship: ${recipient}
- Occasion: ${occasion}
- Budget: ${budget}
- Preferences/Interests: ${preferences}

Next Planning Action: ${plannerResult ? plannerResult.missingField : 'None'}
Suggested Chips to show: ${plannerResult && plannerResult.options ? plannerResult.options.join(', ') : 'None'}

Compose a friendly best-friend Sri Lankan buddy response to guide the user naturally, aligning with the context and guidelines above. Remember, do NOT use robotic phrases. Keep it warm and simple.`;

    try {
      return await generateResponse(prompt, COMPOSER_SYSTEM_PROMPT);
    } catch (err) {
      console.warn('[ResponseComposer] Gemini failed, using fallback.', err.message);
      
      // Basic fallback
      if (context.activeState === 'RELATIONSHIP_DISCOVERY') {
        return "Hari machan 😄 Tell me, who are we surprise-shopping for today? (e.g., Amma, Father, Partner, Friend)";
      }
      if (context.activeState === 'OCCASION_DISCOVERY') {
        return "Elakiri! What's the special occasion ne? 🎂 Birthday, 🌹 Anniversary, or maybe just a Thank You?";
      }
      if (context.activeState === 'BUDGET_DISCOVERY') {
        return "Got it ne! Roughly what budget are we thinking about, machan? (e.g., Under Rs. 5000, or Rs. 10000+)";
      }
      if (context.activeState === 'PREFERENCE_DISCOVERY') {
        return `Ah, nice! What does your ${recipient} enjoy? Flowers, Chocolates, Cakes, or something else?`;
      }
      return "Ayubowan machan! How can I help you choose the best surprise today? 🌸";
    }
  }
}

export const responseComposer = new ResponseComposer();
export default responseComposer;
