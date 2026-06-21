/**
 * Nelum Small Talk Engine
 * Supports friendly answers to small talk prompts (Rule 6).
 */

import { responseVariationEngine } from './responseVariationEngine.js';

export class SmallTalkEngine {
  /**
   * Processes a small talk input and returns a friendly template response.
   * @param {object} context 
   * @param {string} userInput 
   * @returns {string|null} The small talk response text, or null if not applicable.
   */
  handleSmallTalk(context, userInput) {
    const raw = userInput.toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?'"]/g, "").replace(/\s+/g, " ");

    if (raw === 'how are you' || raw === 'how r u' || raw === 'kohomada') {
      return "I'm doing great 😊 Thanks for asking.\n\nI'm excited to help you today.";
    }
    
    if (raw === 'whats up' || raw === 'what is up') {
      return "Not much, machan! Just excited to hang out with you and help you surprise someone today. How was your day?";
    }
    
    if (raw === 'how was your day' || raw === 'how was ur day') {
      return "It's been a wonderful day ne! Busy helping folks choose gifts. How has your day been, machan?";
    }
    
    if (raw.includes('joke')) {
      return "Why did the coconut tree cross the road? To prove it wasn't a bunch of nuts! 🥥 Haha, hope that made you smile ne!";
    }
    
    if (raw.includes('stressed')) {
      return "Aiyo 😅 Sorry to hear that.\n\nHopefully I can make your day a little easier. What's going on?";
    }
    
    if (raw.includes('tired')) {
      return "Aiyo, get some rest ne! 🌸 Take it easy. I'm here whenever you need me, no rush at all.";
    }
    
    if (raw.includes('confused')) {
      return "No worries 😊 We'll figure it out together. What's confusing you? Tell me, I'm here.";
    }
    
    if (raw === 'thank you' || raw === 'thanks' || raw === 'sthuthi') {
      return "You're always welcome 😊\n\nHappy to help anytime.";
    }
    
    if (raw.includes('good night') || raw === 'gn') {
      return "Good night! Sleep well and have a wonderful rest ne! 🌸";
    }
    
    if (raw.includes('good morning') || raw === 'gm') {
      return "Good morning! Hope you have a beautiful day ahead ne! 🌸";
    }

    // Treat casual "hello" or "hi" as a greeting variation
    if (raw === 'hi' || raw === 'hello' || raw === 'ayubowan' || raw === 'greetings') {
      return responseVariationEngine.getVariation(context, 'GREETINGS');
    }

    return null;
  }
}

export const smallTalkEngine = new SmallTalkEngine();
export default smallTalkEngine;
