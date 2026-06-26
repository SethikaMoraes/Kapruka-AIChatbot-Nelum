/**
 * Nelum Supervisor Agent Coordinator
 * Evaluates context anomalies, parses safety policies, and structures empathetic response envelopes.
 */

import { languageProcessor } from '../localization/languageProcessor.js';
import { decisionEngine } from '../recommendations/decisionEngine.js';
import { preferenceEngine } from '../memory/preferenceEngine.js';
import { memoryStore } from '../memory/memoryStore.js';
import { kaprukaClient } from '../api/kaprukaClient.js';
import { generateResponse } from '../services/geminiClient.js';

export class SupervisorAgent {
  constructor() {
    this.agentName = 'Supervisor';
  }

  /**
   * Main supervisor loop.
   * Checks safety policies, checks guided progress, and routes.
   * @param {object} context 
   * @param {string} userInput 
   * @param {object} intent 
   * @returns {Promise<string>}
   */
  async run(context, userInput, intent) {
    // 1. Safety injection guard check
    if (this._detectPromptInjection(userInput)) {
      return "Security Alert 🌸 Respectful greetings. I am designed to assist with Kapruka shopping surprises. Let's keep it safe!";
    }

    // Birthday Reminder Concierge trigger
    const profile = await memoryStore.loadUserProfile(context.userId || 'default-user');
    const today = '2026-06-17'; // anchor to target system time
    const reminders = preferenceEngine.checkUpcomingOccasions(profile, today);
    const rawInput = userInput.toLowerCase();
    
    if (reminders.length > 0 && (rawInput.includes('yes') || rawInput.includes('schedule') || rawInput.includes('amma') || rawInput.includes('birthday'))) {
      const reminder = reminders[0];
      
      // Auto-configure the context
      context.activeState = 'ORDER_REVIEW';
      context.extractedEntities = {
        recipient: reminder.relationship,
        occasion: 'birthday',
        city: 'Colombo',
        budget: 10000
      };
      context.delivery = {
        recipientName: reminder.recipient,
        recipientPhone: '077 123 4567',
        address: reminder.address,
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        timeWindow: 'morning',
        senderName: 'Sethika Moraes'
      };
      
      // Load suggested item into cart
      const item = await kaprukaClient.getProduct(reminder.suggestedItem);
      if (item) {
        context.cart.items = [{
          productId: item.id,
          title: item.title,
          price: item.price,
          image: item.image,
          qty: 1,
          isBundle: false
        }];
        context.cart.subtotal = item.price;
        context.cart.greetingCardMessage = "Happy Birthday! Hamaදාම සතුටින් ඉන්න. 🎂";
      }
      
      return `All set! I've loaded your surprise details for **${reminder.recipient}**. I've added the **${item.title}** (Rs. ${item.price.toLocaleString()}) to your cart and pre-filled the delivery address. You can review your gifts in the drawer and proceed when ready! 🌸`;
    }

    // 2. Check for missing progressive profile details
    const progress = decisionEngine.evaluateConversationProgress(context);
    if (progress.missingField) {
      try {
        const prompt = `The user is shopping. We need to collect the missing details: "${progress.missingField}". The default fallback prompt is: "${progress.prompt}". Ask the user for this missing detail in a warm, friendly Sri Lankan buddy tone (e.g. using 'machan' or 'aiyo' naturally if appropriate). Prior context/preferences: ${JSON.stringify(profile)}`;
        return await generateResponse(prompt);
      } catch (err) {
        console.warn("[SupervisorAgent] Gemini failed progressive collection prompt, using fallback", err.message);
        return progress.prompt;
      }
    }

    // 3. Fallback/Standard Greeting Handler
    if (intent.primaryIntent === 'GREETING') {
      try {
        const prompt = `The user greeted us: "${userInput}". Generate a warm, welcoming greeting in a friendly Sri Lankan buddy tone. Prior context/preferences: ${JSON.stringify(profile)}`;
        return await generateResponse(prompt);
      } catch (e) {
        console.warn("[SupervisorAgent] Gemini failed greeting response, using fallback", e.message);
        const tone = context.extractedEntities.recipient === 'friend' ? 'BUDDY' : 'FORMAL';
        return languageProcessor.getGreeting(context.languageCode, tone);
      }
    }

    // 4. Apology Empathy adaptation
    if (context.extractedEntities.occasion === 'apology') {
      try {
        const prompt = `The occasion is apology/sorry. Suggest a sweet surprise like white lilies or luxury chocolates, and offer to write a card message like 'Mage waradata samawenna'. Speak in a warm, empathetic Sri Lankan buddy tone. Prior context/preferences: ${JSON.stringify(profile)}`;
        return await generateResponse(prompt);
      } catch (e) {
        console.warn("[SupervisorAgent] Gemini failed apology response, using fallback", e.message);
        return "Aiyo, sorry to hear that. Let's send a gorgeous white lily bouquet and luxury chocolates. I can write a card message saying: 'Mage waradata samawenna'. Shall we proceed to Colombo delivery details? 🌹";
      }
    }

    // 5. Standard fallback coordination
    try {
      const prompt = `The user said: "${userInput}". Respond to the user in a warm, welcoming Sri Lankan buddy tone. Guide them to look at the available categories on the right showcase or tell you who they are shopping for. Prior context/preferences: ${JSON.stringify(profile)}`;
      return await generateResponse(prompt);
    } catch (e) {
      console.warn("[SupervisorAgent] Gemini failed fallback response, using fallback", e.message);
      return `Ayubowan! 🌸 I am coordinating your request to find the perfect surprise. Let's look at the available categories on the right showcase!`;
    }
  }

  _detectPromptInjection(text) {
    const raw = text.toLowerCase();
    return raw.includes('ignore prior instructions') || 
           raw.includes('system developer') || 
           raw.includes('override prompt') || 
           raw.includes('ignore limits');
  }
}

export const supervisorAgent = new SupervisorAgent();
export default supervisorAgent;
